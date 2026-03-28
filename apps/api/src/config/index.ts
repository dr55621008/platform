import dotenv from 'dotenv';
dotenv.config();

export const config = {
  // Environment
  nodeEnv: process.env.NODE_ENV || 'development',
  version: '0.1.0',
  
  // Server
  port: parseInt(process.env.API_PORT || '3000', 10),
  host: process.env.API_HOST || '0.0.0.0',
  
  // CORS
  corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3001', 'http://localhost:5173'],
  
  // Database
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/brokerhub',
  databasePoolSize: parseInt(process.env.DATABASE_POOL_SIZE || '10', 10),
  
  // Redis
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  redisPrefix: process.env.REDIS_PREFIX || 'brokerhub:',
  
  // JWT
  jwtSecret: process.env.JWT_SECRET || 'brokerhub-dev-secret-key-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  jwtIssuer: process.env.JWT_ISSUER || 'brokerhub-platform',
  
  // Rate Limiting
  rateLimitDefault: parseInt(process.env.API_RATE_LIMIT_DEFAULT || '100', 10),
  rateLimitWindowMs: parseInt(process.env.API_RATE_LIMIT_WINDOW_MS || '3600000', 10),
  
  // S3
  s3Bucket: process.env.S3_BUCKET || 'brokerhub-documents',
  s3Region: process.env.S3_REGION || 'ap-east-1',
  s3AccessKey: process.env.AWS_ACCESS_KEY_ID || '',
  s3SecretKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  s3Endpoint: process.env.S3_ENDPOINT_URL || undefined,
  
  // Credit System
  creditGracePeriodHours: parseInt(process.env.CREDIT_GRACE_PERIOD_HOURS || '24', 10),
  creditZeroSuspendAfterHours: parseInt(process.env.CREDIT_ZERO_SUSPEND_AFTER_HOURS || '72', 10),
  
  // Audit
  auditLogRetentionYears: parseInt(process.env.AUDIT_LOG_RETENTION_YEARS || '7', 10),
  
  // Brand (Default)
  brandPrimaryColor: process.env.BRAND_PRIMARY_COLOR || '#0A192F',
  brandAccentColor: process.env.BRAND_ACCENT_COLOR || '#00D4FF',
  brandTagline: process.env.BRAND_TAGLINE || 'Your 24/7 AI Admin',
  
  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
  logFormat: process.env.LOG_FORMAT || 'json',
  
  // Feature Flags
  featureWhiteLabelEnabled: process.env.FEATURE_WHITE_LABEL_ENABLED !== 'false',
  featureAutoTopupEnabled: process.env.FEATURE_AUTO_TOPUP_ENABLED === 'true',
};
