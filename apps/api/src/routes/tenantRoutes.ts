import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate, tenantContext, requireScope } from '../middleware/auth.js';
import {
  createTenant,
  getTenant,
  updateTenant,
  suspendTenant,
  approveTenant,
  listTenants,
  getTenantBalance,
} from '../services/tenantService.js';
import { BadRequestError } from '../middleware/errorHandler.js';
import { AuthRequest } from '../middleware/auth.js';

export const tenantRoutes = Router();

// ============================================
// Admin Routes (create, list - admin only)
// ============================================

// Create tenant (admin only)
tenantRoutes.post('/', authenticate, requireScope('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      company_id: z.string().min(1),
      agent_id: z.string().min(1),
      brand_config: z.record(z.any()).optional(),
      initial_credits: z.number().int().positive().optional(),
    });
    
    const input = schema.parse(req.body);
    const tenant = await createTenant(input);
    
    res.status(201).json(tenant);
  } catch (error) {
    next(error);
  }
});

// List tenants (admin only)
tenantRoutes.get('/', authenticate, requireScope('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { limit, offset, status } = req.query;
    
    const tenants = await listTenants({
      limit: limit ? parseInt(limit as string, 10) : undefined,
      offset: offset ? parseInt(offset as string, 10) : undefined,
      status: status as any,
    });
    
    res.json(tenants);
  } catch (error) {
    next(error);
  }
});

// ============================================
// Tenant Routes (require tenant auth)
// ============================================

// Get current tenant
tenantRoutes.get('/me', authenticate, tenantContext, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tenant = (req as any).tenant;
    res.json(tenant);
  } catch (error) {
    next(error);
  }
});

// Get tenant by ID
tenantRoutes.get('/:tenant_id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenant = await getTenant(req.params.tenant_id);
    res.json(tenant);
  } catch (error) {
    next(error);
  }
});

// Update tenant
tenantRoutes.put('/:tenant_id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      brand_config: z.record(z.any()).optional(),
      credit_limit: z.number().nullable().optional(),
      suspended_reason: z.string().optional(),
    });
    
    const input = schema.parse(req.body);
    const tenant = await updateTenant(req.params.tenant_id, input);
    
    res.json(tenant);
  } catch (error) {
    next(error);
  }
});

// Approve tenant (admin only)
tenantRoutes.post('/:tenant_id/approve', authenticate, requireScope('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenant = await approveTenant(req.params.tenant_id);
    res.json(tenant);
  } catch (error) {
    next(error);
  }
});

// Suspend tenant (admin only)
tenantRoutes.post('/:tenant_id/suspend', authenticate, requireScope('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { reason } = req.body;
    
    if (!reason) {
      throw new BadRequestError('Suspension reason is required');
    }
    
    const tenant = await suspendTenant(req.params.tenant_id, reason);
    res.json(tenant);
  } catch (error) {
    next(error);
  }
});

// Get tenant balance
tenantRoutes.get('/:tenant_id/balance', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const balance = await getTenantBalance(req.params.tenant_id);
    res.json(balance);
  } catch (error) {
    next(error);
  }
});
