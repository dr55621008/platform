import { Router, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { z } from 'zod';
import { authenticate, tenantContext } from '../middleware/auth.js';
import { addCredits, getBalance, getTransactionHistory, checkBalance } from '../services/creditService.js';
import { AuthRequest } from '../middleware/auth.js';

export const creditRoutes = Router();

// All credit routes require authentication
creditRoutes.use(authenticate, tenantContext);

// Get credit balance
creditRoutes.get('/balance', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const balance = await getBalance(req.tenant_id!);
    res.json(balance);
  } catch (error) {
    next(error);
  }
});

// Add credits (purchase)
creditRoutes.post('/purchase', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      amount: z.number().int().positive(),
      metadata: z.record(z.any()).optional(),
    });
    
    const { amount, metadata } = schema.parse(req.body);
    
    const balance = await addCredits(req.tenant_id!, amount, 'purchase', {
      user_id: req.user_id,
      ip_address: req.ip,
      metadata,
    });
    
    res.json(balance);
  } catch (error) {
    next(error);
  }
});

// Get transaction history
creditRoutes.get('/transactions', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { limit, offset, type } = req.query;
    
    const history = await getTransactionHistory(req.tenant_id!, {
      limit: limit ? parseInt(limit as string, 10) : undefined,
      offset: offset ? parseInt(offset as string, 10) : undefined,
      transaction_type: type as any,
    });
    
    res.json(history);
  } catch (error) {
    next(error);
  }
});

// Check balance (without deducting)
creditRoutes.post('/check', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      required_amount: z.number().int().positive(),
    });
    
    const { required_amount } = schema.parse(req.body);
    
    const result = await checkBalance(req.tenant_id!, required_amount);
    
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Refund credits (admin operation - would need additional scope check)
creditRoutes.post('/refund', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      amount: z.number().int().positive(),
      transaction_id: z.number().int().positive().optional(),
      reason: z.string(),
    });
    
    const { amount, transaction_id, reason } = schema.parse(req.body);
    
    // TODO: Add admin scope check here
    
    const balance = await addCredits(req.tenant_id!, amount, 'refund', {
      user_id: req.user_id,
      metadata: { reason, original_transaction_id: transaction_id },
    });
    
    res.json(balance);
  } catch (error) {
    next(error);
  }
});
