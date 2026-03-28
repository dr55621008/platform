import { Pool, PoolClient } from 'pg';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

// Create connection pool
export const pool = new Pool({
  connectionString: config.databaseUrl,
  max: config.databasePoolSize,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Pool event handlers
pool.on('connect', () => {
  logger.debug('New client connected to database');
});

pool.on('remove', () => {
  logger.debug('Client removed from pool');
});

pool.on('error', (err) => {
  logger.error('Unexpected database pool error', { error: err.message });
});

// Get client from pool
export async function getClient(): Promise<PoolClient> {
  const client = await pool.connect();
  
  // Return client to pool on error
  client.on('error', (err) => {
    logger.error('Database client error', { error: err.message });
    client.release();
  });
  
  return client;
}

// Transaction helper
export async function withTransaction<T>(
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Health check
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    const result = await pool.query('SELECT NOW()');
    return result.rows.length > 0;
  } catch (error) {
    logger.error('Database health check failed', { error });
    return false;
  }
}

export default pool;
