#!/usr/bin/env tsx
/**
 * Database Migration Runner
 * Runs all SQL migrations in order
 */

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { Pool } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/brokerhub';

const pool = new Pool({
  connectionString: DATABASE_URL,
  max: 5,
});

async function runMigrations() {
  console.log('🔧 Starting database migrations...');
  
  const client = await pool.connect();
  
  try {
    // Create migrations tracking table
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        migration_name VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    
    // Get list of migration files
    const migrationsDir = join(__dirname, '..', 'migrations');
    const files = readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();
    
    console.log(`Found ${files.length} migration files`);
    
    // Run each migration
    for (const file of files) {
      // Check if already applied
      const checkResult = await client.query(
        'SELECT 1 FROM schema_migrations WHERE migration_name = $1',
        [file]
      );
      
      if (checkResult.rows.length > 0) {
        console.log(`⏭️  Skipping ${file} (already applied)`);
        continue;
      }
      
      console.log(`📄 Running ${file}...`);
      
      // Read and execute migration
      const sql = readFileSync(join(migrationsDir, file), 'utf-8');
      
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query(
          'INSERT INTO schema_migrations (migration_name) VALUES ($1)',
          [file]
        );
        await client.query('COMMIT');
        console.log(`✅ ${file} completed`);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    }
    
    console.log('🎉 All migrations completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations();
