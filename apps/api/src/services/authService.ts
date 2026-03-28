import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { pool } from '../db/index.js';
import { config } from '../config/index.js';
import { UnauthorizedError } from '../middleware/errorHandler.js';
import { logger } from '../utils/logger.js';

export interface TokenPayload {
  tenant_id: string;
  user_id?: string;
  scope: string[];
  iat?: number;
  exp?: number;
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

/**
 * Generate JWT access token
 */
export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn as string | number,
    issuer: config.jwtIssuer,
  });
}

/**
 * Generate refresh token (stored in DB)
 */
export async function generateRefreshToken(
  tenant_id: string,
  user_id: string,
  deviceInfo?: Record<string, any>,
  ipAddress?: string
): Promise<string> {
  const tokenId = randomUUID();
  const tokenHash = Buffer.from(tokenId).toString('base64');
  
  const expiresAt = new Date();
  const refreshDays = parseInt(config.jwtRefreshExpiresIn) || 30;
  expiresAt.setDate(expiresAt.getDate() + refreshDays);
  
  await pool.query(
    `INSERT INTO refresh_tokens (id, tenant_id, user_id, token_hash, device_info, ip_address, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [tokenId, tenant_id, user_id, tokenHash, deviceInfo ? JSON.stringify(deviceInfo) : null, ipAddress, expiresAt]
  );
  
  return tokenId;
}

/**
 * Generate token pair (access + refresh)
 */
export async function generateTokenPair(
  tenant_id: string,
  user_id: string,
  scope: string[] = ['read', 'write'],
  deviceInfo?: Record<string, any>,
  ipAddress?: string
): Promise<TokenPair> {
  const access_token = generateAccessToken({ tenant_id, user_id, scope });
  const refresh_token = await generateRefreshToken(tenant_id, user_id, deviceInfo, ipAddress);
  
  // Parse expires_in from jwtExpiresIn config (e.g., "15m" -> 900)
  const expiresIn = parseExpiresIn(config.jwtExpiresIn);
  
  return { access_token, refresh_token, expires_in: expiresIn };
}

/**
 * Validate access token
 */
export function validateAccessToken(token: string): TokenPayload {
  try {
    const payload = jwt.verify(token, config.jwtSecret, {
      issuer: config.jwtIssuer,
    }) as TokenPayload;
    
    return payload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedError('Token expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new UnauthorizedError('Invalid token');
    }
    throw error;
  }
}

/**
 * Validate refresh token
 */
export async function validateRefreshToken(tokenId: string): Promise<{
  tenant_id: string;
  user_id: string;
}> {
  const result = await pool.query(
    `SELECT tenant_id, user_id FROM refresh_tokens
     WHERE id = $1 AND revoked_at IS NULL AND expires_at > NOW()`,
    [tokenId]
  );
  
  if (result.rows.length === 0) {
    throw new UnauthorizedError('Invalid or expired refresh token');
  }
  
  return {
    tenant_id: result.rows[0].tenant_id,
    user_id: result.rows[0].user_id,
  };
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<TokenPair> {
  const { tenant_id, user_id } = await validateRefreshToken(refreshToken);
  
  // Revoke old refresh token (single-use)
  await pool.query(
    `UPDATE refresh_tokens SET revoked_at = NOW() WHERE id = $1`,
    [refreshToken]
  );
  
  // Generate new token pair
  return generateTokenPair(tenant_id, user_id);
}

/**
 * Revoke refresh token
 */
export async function revokeToken(tokenId: string): Promise<void> {
  await pool.query(
    `UPDATE refresh_tokens SET revoked_at = NOW() WHERE id = $1`,
    [tokenId]
  );
  
  logger.info('Token revoked', { tokenId });
}

/**
 * Revoke all tokens for a tenant
 */
export async function revokeAllTenantTokens(tenant_id: string): Promise<void> {
  await pool.query(
    `UPDATE refresh_tokens SET revoked_at = NOW() WHERE tenant_id = $1`,
    [tenant_id]
  );
  
  logger.info('All tenant tokens revoked', { tenant_id });
}

/**
 * Parse expires_in string to seconds
 */
function parseExpiresIn(expiresIn: string): number {
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match) return 900; // Default 15 minutes
  
  const value = parseInt(match[1], 10);
  const unit = match[2];
  
  switch (unit) {
    case 's': return value;
    case 'm': return value * 60;
    case 'h': return value * 3600;
    case 'd': return value * 86400;
    default: return 900;
  }
}
