import { pool, withTransaction } from '../db/index.js';
import { logger } from '../utils/logger.js';
import { NotFoundError, ForbiddenError } from '../middleware/errorHandler.js';

export interface Skill {
  skill_id: string;
  name: string;
  description: string | null;
  tier: 'starter' | 'professional' | 'enterprise' | 'custom';
  credit_cost: number;
  credit_cost_batch: number | null;
  rate_limit_per_hour: number | null;
  rate_limit_per_day: number | null;
  enabled: boolean;
  deprecated: boolean;
  deprecation_date: string | null;
  config_schema: Record<string, any> | null;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface TenantSkillEntitlement {
  id: number;
  tenant_id: string;
  skill_id: string;
  credit_cost_override: number | null;
  rate_limit_override: number | null;
  enabled: boolean;
  granted_at: string;
  expires_at: string | null;
}

export interface SkillExecution {
  id: string;
  tenant_id: string;
  skill_id: string;
  request_id: string;
  params_hash: string | null;
  result_hash: string | null;
  credits_used: number;
  execution_time_ms: number | null;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  error_message: string | null;
  conversation_id: string | null;
  user_id: string | null;
  created_at: string;
  completed_at: string | null;
}

/**
 * Get skill registry
 */
export async function getSkillRegistry(options: { enabled_only?: boolean } = {}): Promise<Skill[]> {
  const { enabled_only = true } = options;
  
  const whereClause = enabled_only ? 'WHERE enabled = true AND deprecated = false' : '';
  
  const result = await pool.query<Skill>(
    `SELECT * FROM skills_registry ${whereClause} ORDER BY tier, name`
  );
  
  return result.rows;
}

/**
 * Get skill by ID
 */
export async function getSkill(skill_id: string): Promise<Skill> {
  const result = await pool.query<Skill>(
    'SELECT * FROM skills_registry WHERE skill_id = $1',
    [skill_id]
  );
  
  if (result.rows.length === 0) {
    throw new NotFoundError('Skill');
  }
  
  return result.rows[0];
}

/**
 * Get tenant skill entitlements
 */
export async function getTenantEntitlements(tenant_id: string): Promise<TenantSkillEntitlement[]> {
  const result = await pool.query<TenantSkillEntitlement>(
    `SELECT * FROM tenant_skill_entitlements
     WHERE tenant_id = $1 AND enabled = true
     ORDER BY skill_id`,
    [tenant_id]
  );
  
  return result.rows;
}

/**
 * Check if tenant has entitlement for a skill
 */
export async function checkEntitlement(tenant_id: string, skill_id: string): Promise<{
  entitled: boolean;
  skill: Skill | null;
  entitlement: TenantSkillEntitlement | null;
  effective_credit_cost: number;
  effective_rate_limit: number | null;
}> {
  // Get skill from registry
  const skill = await getSkill(skill_id);
  
  if (!skill.enabled || skill.deprecated) {
    return {
      entitled: false,
      skill: null,
      entitlement: null,
      effective_credit_cost: 0,
      effective_rate_limit: null,
    };
  }
  
  // Check tenant entitlement
  const result = await pool.query<TenantSkillEntitlement>(
    `SELECT * FROM tenant_skill_entitlements
     WHERE tenant_id = $1 AND skill_id = $2 AND enabled = true
     AND (expires_at IS NULL OR expires_at > NOW())`,
    [tenant_id, skill_id]
  );
  
  if (result.rows.length === 0) {
    return {
      entitled: false,
      skill,
      entitlement: null,
      effective_credit_cost: 0,
      effective_rate_limit: null,
    };
  }
  
  const entitlement = result.rows[0];
  
  // Calculate effective values (override or default)
  const effective_credit_cost = entitlement.credit_cost_override ?? skill.credit_cost;
  const effective_rate_limit = entitlement.rate_limit_override ?? skill.rate_limit_per_hour;
  
  return {
    entitled: true,
    skill,
    entitlement,
    effective_credit_cost,
    effective_rate_limit,
  };
}

/**
 * Grant skill entitlement to tenant
 */
export async function grantEntitlement(
  tenant_id: string,
  skill_id: string,
  options: {
    credit_cost_override?: number;
    rate_limit_override?: number;
    expires_at?: string;
  } = {}
): Promise<TenantSkillEntitlement> {
  // Verify skill exists
  await getSkill(skill_id);
  
  const result = await pool.query<TenantSkillEntitlement>(
    `INSERT INTO tenant_skill_entitlements (tenant_id, skill_id, credit_cost_override, rate_limit_override, expires_at)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (tenant_id, skill_id) DO UPDATE SET
       credit_cost_override = EXCLUDED.credit_cost_override,
       rate_limit_override = EXCLUDED.rate_limit_override,
       expires_at = EXCLUDED.expires_at,
       enabled = true,
       granted_at = NOW()
     RETURNING *`,
    [
      tenant_id,
      skill_id,
      options.credit_cost_override || null,
      options.rate_limit_override || null,
      options.expires_at || null,
    ]
  );
  
  logger.info('Skill entitlement granted', { tenant_id, skill_id });
  
  return result.rows[0];
}

/**
 * Revoke skill entitlement
 */
export async function revokeEntitlement(tenant_id: string, skill_id: string): Promise<void> {
  await pool.query(
    `UPDATE tenant_skill_entitlements SET enabled = false WHERE tenant_id = $1 AND skill_id = $2`,
    [tenant_id, skill_id]
  );
  
  logger.info('Skill entitlement revoked', { tenant_id, skill_id });
}

/**
 * Execute skill (with credit deduction)
 */
export async function executeSkill(
  tenant_id: string,
  skill_id: string,
  _params: Record<string, any>,
  options: {
    user_id?: string;
    conversation_id?: string;
    request_id?: string;
  } = {}
): Promise<{
  execution_id: string;
  request_id: string;
  credits_used: number;
  status: 'pending' | 'completed' | 'failed';
  result?: any;
  error?: string;
}> {
  const requestId = options.request_id || `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  return withTransaction(async (client) => {
    // Check entitlement
    const { entitled, skill, effective_credit_cost } = await checkEntitlement(tenant_id, skill_id);
    
    if (!entitled || !skill) {
      throw new ForbiddenError(`Skill '${skill_id}' not entitled for this tenant`);
    }
    
    // Check credits
    const balanceResult = await client.query(
      'SELECT credit_balance, credit_limit FROM tenants WHERE tenant_id = $1',
      [tenant_id]
    );
    
    const { credit_balance, credit_limit } = balanceResult.rows[0];
    const availableCredit = credit_balance + (credit_limit || 0);
    
    if (availableCredit < effective_credit_cost) {
      throw new ForbiddenError(`Insufficient credits. Required: ${effective_credit_cost}, Available: ${availableCredit}`);
    }
    
    // Create execution record
    const execResult = await client.query<SkillExecution>(
      `INSERT INTO tenant_${tenant_id}.skill_executions 
       (tenant_id, skill_id, request_id, credits_used, status, user_id, conversation_id, created_at)
       VALUES ($1, $2, $3, $4, 'pending', $5, $6, NOW())
       RETURNING *`,
      [tenant_id, skill_id, requestId, effective_credit_cost, options.user_id || null, options.conversation_id || null]
    );
    
    const execution = execResult.rows[0];
    
    // Deduct credits
    await client.query(
      `INSERT INTO credit_ledger (tenant_id, amount, balance_after, transaction_type, skill_id, request_id, metadata)
       SELECT $1, -$2, credit_balance - $2, 'usage', $3, $4, $5
       FROM tenants WHERE tenant_id = $1`,
      [tenant_id, effective_credit_cost, skill_id, requestId, JSON.stringify({ execution_id: execution.id })]
    );
    
    await client.query(
      'UPDATE tenants SET credit_balance = credit_balance - $1 WHERE tenant_id = $2',
      [effective_credit_cost, tenant_id]
    );
    
    // Log audit
    await client.query(
      `INSERT INTO audit_logs (tenant_id, action, resource, resource_id, metadata)
       VALUES ($1, 'skill_executed', 'skill_executions', $2, $3)`,
      [tenant_id, execution.id, JSON.stringify({ skill_id, credits: effective_credit_cost })]
    );
    
    logger.info('Skill executed', { tenant_id, skill_id, credits: effective_credit_cost, execution_id: execution.id });
    
    return {
      execution_id: execution.id,
      request_id: requestId,
      credits_used: effective_credit_cost,
      status: 'pending',  // Actual execution happens outside this service
    };
  });
}

/**
 * Get skill execution history
 */
export async function getExecutionHistory(
  tenant_id: string,
  options: { limit?: number; offset?: number; skill_id?: string } = {}
): Promise<SkillExecution[]> {
  const { limit = 50, offset = 0, skill_id } = options;
  
  const schemaName = `tenant_${tenant_id.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
  const whereClause = skill_id ? 'WHERE skill_id = $1' : '';
  const params = skill_id ? [skill_id] : [];
  
  const result = await pool.query<SkillExecution>(
    `SELECT * FROM ${schemaName}.skill_executions ${whereClause}
     ORDER BY created_at DESC
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset]
  );
  
  return result.rows;
}
