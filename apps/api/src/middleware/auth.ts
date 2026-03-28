import { Request, Response, NextFunction } from 'express';
import { validateAccessToken } from '../services/authService.js';
import { UnauthorizedError } from './errorHandler.js';
import { getTenant } from '../services/tenantService.js';

export interface AuthRequest extends Request {
  tenant_id?: string;
  user_id?: string;
  token_scope?: string[];
}

/**
 * Authentication middleware - validates JWT token
 */
export function authenticate(req: AuthRequest, _res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or invalid authorization header');
    }
    
    const token = authHeader.substring(7);
    const payload = validateAccessToken(token);
    
    // Attach to request
    req.tenant_id = payload.tenant_id;
    req.user_id = payload.user_id;
    req.token_scope = payload.scope;
    
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Tenant context middleware - ensures tenant exists and is active
 */
export async function tenantContext(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.tenant_id) {
      throw new UnauthorizedError('Tenant ID not found in token');
    }
    
    const tenant = await getTenant(req.tenant_id);
    
    // Check tenant status
    if (tenant.status === 'suspended') {
      return res.status(403).json({
        error: 'TENANT_SUSPENDED',
        message: `Tenant is suspended. Reason: ${tenant.suspended_reason || 'Not specified'}`,
      });
    }
    
    if (tenant.status === 'terminated') {
      return res.status(403).json({
        error: 'TENANT_TERMINATED',
        message: 'Tenant account has been terminated',
      });
    }
    
    if (tenant.status === 'pending') {
      return res.status(403).json({
        error: 'TENANT_PENDING',
        message: 'Tenant account is pending approval',
      });
    }
    
    // Attach tenant to request
    (req as any).tenant = tenant;
    
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Scope checker - validates token has required scope
 */
export function requireScope(...requiredScopes: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    const tokenScope = req.token_scope || [];
    
    // Check if token has any of the required scopes
    const hasScope = requiredScopes.some(scope => 
      tokenScope.includes(scope) || tokenScope.includes('*')
    );
    
    if (!hasScope) {
      res.status(403).json({
        error: 'INSUFFICIENT_SCOPE',
        message: `Required scope: ${requiredScopes.join(' or ')}`,
        provided_scope: tokenScope,
      });
      return;
    }
    
    next();
  };
}

/**
 * Optional authentication - attaches user if token present, but doesn't require it
 */
export function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const payload = validateAccessToken(token);
      
      req.tenant_id = payload.tenant_id;
      req.user_id = payload.user_id;
      req.token_scope = payload.scope;
    }
    
    next();
  } catch (error) {
    // Ignore auth errors for optional auth
    next();
  }
}
