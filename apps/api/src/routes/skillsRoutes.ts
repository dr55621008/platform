import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate, tenantContext } from '../middleware/auth.js';
import {
  getSkillRegistry,
  getSkill,
  getTenantEntitlements,
  checkEntitlement,
  executeSkill,
  getExecutionHistory,
} from '../services/skillsService.js';
import { AuthRequest } from '../middleware/auth.js';

export const skillsRoutes = Router();

// All skills routes require authentication
skillsRoutes.use(authenticate, tenantContext);

// Get available skills (registry)
skillsRoutes.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { enabled_only } = req.query;
    
    const skills = await getSkillRegistry({
      enabled_only: enabled_only !== 'false',
    });
    
    res.json(skills);
  } catch (error) {
    next(error);
  }
});

// Get skill by ID
skillsRoutes.get('/:skill_id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const skill = await getSkill(req.params.skill_id);
    res.json(skill);
  } catch (error) {
    next(error);
  }
});

// Get tenant entitlements
skillsRoutes.get('/me/entitlements', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const entitlements = await getTenantEntitlements(req.tenant_id!);
    res.json(entitlements);
  } catch (error) {
    next(error);
  }
});

// Check entitlement for specific skill
skillsRoutes.get('/me/entitlements/:skill_id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await checkEntitlement(req.tenant_id!, req.params.skill_id);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Execute skill
skillsRoutes.post('/:skill_id/execute', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      params: z.record(z.any()),
      conversation_id: z.string().optional(),
      request_id: z.string().optional(),
    });
    
    const { params, conversation_id, request_id } = schema.parse(req.body);
    
    const result = await executeSkill(req.tenant_id!, req.params.skill_id, params, {
      user_id: req.user_id,
      conversation_id,
      request_id,
    });
    
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Get execution history
skillsRoutes.get('/me/executions', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { limit, offset, skill_id } = req.query;
    
    const executions = await getExecutionHistory(req.tenant_id!, {
      limit: limit ? parseInt(limit as string, 10) : undefined,
      offset: offset ? parseInt(offset as string, 10) : undefined,
      skill_id: skill_id as string | undefined,
    });
    
    res.json(executions);
  } catch (error) {
    next(error);
  }
});
