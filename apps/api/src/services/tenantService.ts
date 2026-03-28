import { pool, withTransaction, getClient } from '../db/index.js';
import { logger } from '../utils/logger.js';
import { NotFoundError } from '../middleware/errorHandler.js';

export interface Tenant {
  tenant_id: string;
  company_id: string;
  agent_id: string;
  status: 'pending' | 'approved' | 'suspended' | 'terminated';
  brand_config: Record<string, any> | null;
  credit_balance: number;
  credit_limit: number | null;
  created_at: string;
  updated_at: string;
  suspended_at: string | null;
  suspended_reason: string | null;
}

export interface CreateTenantInput {
  company_id: string;
  agent_id: string;
  brand_config?: Record<string, any>;
  initial_credits?: number;
}

export interface UpdateTenantInput {
  brand_config?: Record<string, any>;
  credit_limit?: number | null;
  status?: Tenant['status'];
  suspended_reason?: string;
}

/**
 * Create a new tenant
 */
export async function createTenant(input: CreateTenantInput): Promise<Tenant> {
  const { company_id, agent_id, brand_config = null, initial_credits = 0 } = input;
  
  // Generate tenant_id from company_id
  const tenant_id = `tenant_${company_id.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
  
  return withTransaction(async (client) => {
    // Insert tenant
    const insertResult = await client.query<Tenant>(
      `INSERT INTO tenants (tenant_id, company_id, agent_id, brand_config, credit_balance, status)
       VALUES ($1, $2, $3, $4, $5, 'pending')
       RETURNING *`,
      [tenant_id, company_id, agent_id, brand_config, initial_credits]
    );
    
    const tenant = insertResult.rows[0];
    
    // Create tenant schema
    await client.query('SELECT create_tenant_schema($1)', [tenant_id]);
    
    // Log audit
    await client.query(
      `INSERT INTO audit_logs (tenant_id, action, resource, metadata)
       VALUES ($1, 'tenant_created', 'tenants', $2)`,
      [tenant_id, JSON.stringify({ company_id, agent_id })]
    );
    
    // Add initial credits if provided
    if (initial_credits > 0) {
      await client.query(
        `INSERT INTO credit_ledger (tenant_id, amount, balance_after, transaction_type, metadata)
         VALUES ($1, $2, $3, 'purchase', $4)`,
        [tenant_id, initial_credits, initial_credits, JSON.stringify({ source: 'initial_allocation' })]
      );
    }
    
    logger.info('Tenant created', { tenant_id, company_id });
    
    return tenant;
  });
}

/**
 * Get tenant by ID
 */
export async function getTenant(tenant_id: string): Promise<Tenant> {
  const result = await pool.query<Tenant>(
    'SELECT * FROM tenants WHERE tenant_id = $1',
    [tenant_id]
  );
  
  if (result.rows.length === 0) {
    throw new NotFoundError('Tenant');
  }
  
  return result.rows[0];
}

/**
 * Get tenant by company_id
 */
export async function getTenantByCompanyId(company_id: string): Promise<Tenant> {
  const result = await pool.query<Tenant>(
    'SELECT * FROM tenants WHERE company_id = $1',
    [company_id]
  );
  
  if (result.rows.length === 0) {
    throw new NotFoundError('Tenant');
  }
  
  return result.rows[0];
}

/**
 * Update tenant
 */
export async function updateTenant(tenant_id: string, input: UpdateTenantInput): Promise<Tenant> {
  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;
  
  if (input.brand_config !== undefined) {
    fields.push(`brand_config = $${paramIndex++}`);
    values.push(input.brand_config);
  }
  
  if (input.credit_limit !== undefined) {
    fields.push(`credit_limit = $${paramIndex++}`);
    values.push(input.credit_limit);
  }
  
  if (input.status !== undefined) {
    fields.push(`status = $${paramIndex++}`);
    values.push(input.status);
    
    if (input.status === 'suspended') {
      fields.push(`suspended_at = NOW()`);
      fields.push(`suspended_reason = $${paramIndex++}`);
      values.push(input.suspended_reason || null);
    } else if (input.status === 'approved' || input.status === 'pending') {
      fields.push(`suspended_at = NULL`);
      fields.push(`suspended_reason = NULL`);
    }
  }
  
  fields.push(`updated_at = NOW()`);
  values.push(tenant_id);
  
  const result = await pool.query<Tenant>(
    `UPDATE tenants SET ${fields.join(', ')} WHERE tenant_id = $${paramIndex} RETURNING *`,
    values
  );
  
  if (result.rows.length === 0) {
    throw new NotFoundError('Tenant');
  }
  
  logger.info('Tenant updated', { tenant_id, updates: Object.keys(input) });
  
  return result.rows[0];
}

/**
 * Suspend tenant
 */
export async function suspendTenant(tenant_id: string, reason: string): Promise<Tenant> {
  return updateTenant(tenant_id, { status: 'suspended', suspended_reason: reason });
}

/**
 * Approve tenant (change from pending to approved)
 */
export async function approveTenant(tenant_id: string): Promise<Tenant> {
  return updateTenant(tenant_id, { status: 'approved' });
}

/**
 * List tenants with pagination
 */
export async function listTenants(options: {
  limit?: number;
  offset?: number;
  status?: Tenant['status'];
}): Promise<{ tenants: Tenant[]; total: number }> {
  const { limit = 50, offset = 0, status } = options;
  
  const whereClause = status ? 'WHERE status = $1' : '';
  const params = status ? [status] : [];
  
  const countResult = await pool.query<{ count: string }>(
    `SELECT COUNT(*) FROM tenants ${whereClause}`,
    params
  );
  
  const total = parseInt(countResult.rows[0].count, 10);
  
  const result = await pool.query<Tenant>(
    `SELECT * FROM tenants ${whereClause}
     ORDER BY created_at DESC
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset]
  );
  
  return { tenants: result.rows, total };
}

/**
 * Get tenant credit balance
 */
export async function getTenantBalance(tenant_id: string): Promise<{
  tenant_id: string;
  credit_balance: number;
  credit_limit: number | null;
  available_credit: number;
  last_transaction_at: string | null;
}> {
  const result = await pool.query(
    'SELECT * FROM get_tenant_balance($1)',
    [tenant_id]
  );
  
  if (result.rows.length === 0) {
    throw new NotFoundError('Tenant');
  }
  
  return result.rows[0];
}
0];
}
