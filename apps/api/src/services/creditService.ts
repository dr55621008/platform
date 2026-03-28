import { pool, withTransaction } from '../db/index.js';
import { logger } from '../utils/logger.js';
import { InsufficientCreditsError, BadRequestError, NotFoundError } from '../middleware/errorHandler.js';

export interface CreditTransaction {
  id: number;
  tenant_id: string;
  amount: number;
  balance_after: number;
  transaction_type: 'purchase' | 'usage' | 'refund' | 'adjustment' | 'expiry';
  skill_id: string | null;
  request_id: string | null;
  metadata: Record<string, any> | null;
  user_id: string | null;
  ip_address: string | null;
  created_at: string;
}

export interface CreditBalance {
  tenant_id: string;
  credit_balance: number;
  credit_limit: number | null;
  available_credit: number;
  last_transaction_at: string | null;
}

/**
 * Add credits to tenant (purchase/adjustment)
 */
export async function addCredits(
  tenant_id: string,
  amount: number,
  transactionType: CreditTransaction['transaction_type'] = 'purchase',
  options: {
    user_id?: string;
    ip_address?: string;
    request_id?: string;
    metadata?: Record<string, any>;
  } = {}
): Promise<CreditBalance> {
  if (amount <= 0) {
    throw new BadRequestError('Credit amount must be positive');
  }
  
  return withTransaction(async (client) => {
    // Get current balance
    const tenantResult = await client.query(
      'SELECT credit_balance, credit_limit FROM tenants WHERE tenant_id = $1',
      [tenant_id]
    );
    
    if (tenantResult.rows.length === 0) {
      throw new NotFoundError('Tenant');
    }
    
    const { credit_balance, credit_limit } = tenantResult.rows[0];
    const newBalance = credit_balance + amount;
    
    // Update tenant balance
    await client.query(
      'UPDATE tenants SET credit_balance = $1, updated_at = NOW() WHERE tenant_id = $2',
      [newBalance, tenant_id]
    );
    
    // Log transaction
    await client.query(
      `INSERT INTO credit_ledger (tenant_id, amount, balance_after, transaction_type, user_id, ip_address, request_id, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        tenant_id,
        amount,
        newBalance,
        transactionType,
        options.user_id || null,
        options.ip_address || null,
        options.request_id || null,
        options.metadata ? JSON.stringify(options.metadata) : null,
      ]
    );
    
    // Log audit
    await client.query(
      `INSERT INTO audit_logs (tenant_id, action, resource, metadata, ip_address)
       VALUES ($1, 'credits_added', 'credit_ledger', $2, $3)`,
      [tenant_id, JSON.stringify({ amount, type: transactionType }), options.ip_address]
    );
    
    logger.info('Credits added', { tenant_id, amount, type: transactionType, newBalance });
    
    return {
      tenant_id,
      credit_balance: newBalance,
      credit_limit,
      available_credit: newBalance + (credit_limit || 0),
      last_transaction_at: new Date().toISOString(),
    };
  });
}

/**
 * Use credits (skill execution, etc.)
 */
export async function useCredits(
  tenant_id: string,
  amount: number,
  skill_id: string,
  options: {
    user_id?: string;
    ip_address?: string;
    request_id?: string;
    metadata?: Record<string, any>;
  } = {}
): Promise<CreditBalance> {
  if (amount <= 0) {
    throw new BadRequestError('Credit amount must be positive');
  }
  
  return withTransaction(async (client) => {
    // Get current balance
    const tenantResult = await client.query(
      'SELECT credit_balance, credit_limit, status FROM tenants WHERE tenant_id = $1',
      [tenant_id]
    );
    
    if (tenantResult.rows.length === 0) {
      throw new NotFoundError('Tenant');
    }
    
    const { credit_balance, credit_limit, status } = tenantResult.rows[0];
    
    // Check if tenant is suspended
    if (status === 'suspended') {
      throw new BadRequestError('Tenant is suspended');
    }
    
    // Check balance (including credit limit)
    const availableCredit = credit_balance + (credit_limit || 0);
    if (availableCredit < amount) {
      throw new InsufficientCreditsError(amount, availableCredit);
    }
    
    const newBalance = credit_balance - amount;
    
    // Update tenant balance
    await client.query(
      'UPDATE tenants SET credit_balance = $1, updated_at = NOW() WHERE tenant_id = $2',
      [newBalance, tenant_id]
    );
    
    // Log transaction
    await client.query(
      `INSERT INTO credit_ledger (tenant_id, amount, balance_after, transaction_type, skill_id, user_id, ip_address, request_id, metadata)
       VALUES ($1, $2, $3, 'usage', $4, $5, $6, $7, $8)`,
      [
        tenant_id,
        -amount,  // Negative for debit
        newBalance,
        skill_id,
        options.user_id || null,
        options.ip_address || null,
        options.request_id || null,
        options.metadata ? JSON.stringify(options.metadata) : null,
      ]
    );
    
    logger.info('Credits used', { tenant_id, amount, skill_id, newBalance });
    
    return {
      tenant_id,
      credit_balance: newBalance,
      credit_limit,
      available_credit: newBalance + (credit_limit || 0),
      last_transaction_at: new Date().toISOString(),
    };
  });
}

/**
 * Get credit balance
 */
export async function getBalance(tenant_id: string): Promise<CreditBalance> {
  const result = await pool.query(
    'SELECT * FROM get_tenant_balance($1)',
    [tenant_id]
  );
  
  if (result.rows.length === 0) {
    throw new NotFoundError('Tenant');
  }
  
  return result.rows[0];
}

/**
 * Get transaction history
 */
export async function getTransactionHistory(
  tenant_id: string,
  options: { limit?: number; offset?: number; transaction_type?: CreditTransaction['transaction_type'] } = {}
): Promise<{ transactions: CreditTransaction[]; total: number }> {
  const { limit = 50, offset = 0, transaction_type } = options;
  
  const whereClause = transaction_type ? 'WHERE tenant_id = $1 AND transaction_type = $2' : 'WHERE tenant_id = $1';
  const params = transaction_type ? [tenant_id, transaction_type] : [tenant_id];
  
  const countResult = await pool.query<{ count: string }>(
    `SELECT COUNT(*) FROM credit_ledger ${whereClause}`,
    params
  );
  
  const total = parseInt(countResult.rows[0].count, 10);
  
  const result = await pool.query<CreditTransaction>(
    `SELECT * FROM credit_ledger ${whereClause}
     ORDER BY created_at DESC
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset]
  );
  
  return { transactions: result.rows, total };
}

/**
 * Check if tenant has sufficient credits (without deducting)
 */
export async function checkBalance(tenant_id: string, requiredAmount: number): Promise<{
  sufficient: boolean;
  available: number;
  required: number;
}> {
  const balance = await getBalance(tenant_id);
  
  return {
    sufficient: balance.available_credit >= requiredAmount,
    available: balance.available_credit,
    required: requiredAmount,
  };
}
