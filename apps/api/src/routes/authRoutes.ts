import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { generateTokenPair, refreshAccessToken, revokeToken, validateAccessToken } from '../services/authService.js';
import { BadRequestError, UnauthorizedError } from '../middleware/errorHandler.js';

export const authRoutes = Router();

// Request access token (tenant authentication)
authRoutes.post('/token', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      tenant_id: z.string().min(1),
      user_id: z.string().min(1),
      scope: z.array(z.string()).optional().default(['read', 'write']),
      device_info: z.record(z.any()).optional(),
    });
    
    const { tenant_id, user_id, scope, device_info } = schema.parse(req.body);
    
    // Get client IP
    const ip_address = req.ip || req.socket.remoteAddress;
    
    // Generate token pair
    const tokens = await generateTokenPair(tenant_id, user_id, scope, device_info, ip_address);
    
    res.json(tokens);
  } catch (error) {
    next(error);
  }
});

// Refresh access token
authRoutes.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      refresh_token: z.string().min(1),
    });
    
    const { refresh_token } = schema.parse(req.body);
    
    // Generate new token pair
    const tokens = await refreshAccessToken(refresh_token);
    
    res.json(tokens);
  } catch (error) {
    next(error);
  }
});

// Revoke token
authRoutes.post('/revoke', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      token_id: z.string().min(1),
    });
    
    const { token_id } = schema.parse(req.body);
    
    await revokeToken(token_id);
    
    res.json({ success: true, message: 'Token revoked' });
  } catch (error) {
    next(error);
  }
});

// Validate token (utility endpoint)
authRoutes.post('/validate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      token: z.string().min(1),
    });
    
    const { token } = schema.parse(req.body);
    
    const payload = validateAccessToken(token);
    
    res.json({
      valid: true,
      payload: {
        tenant_id: payload.tenant_id,
        user_id: payload.user_id,
        scope: payload.scope,
        exp: payload.exp,
        iat: payload.iat,
      },
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      res.json({ valid: false, error: error.message });
    } else {
      next(error);
    }
  }
});
