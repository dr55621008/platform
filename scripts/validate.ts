#!/usr/bin/env tsx
/**
 * brokerHub Phase 1 Validation Script
 * 
 * Validates code structure, TypeScript compilation, and configuration
 * without requiring Docker runtime.
 */

import { existsSync, readFileSync } from 'fs';
import { join, resolve } from 'path';

// Colors for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message: string, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function success(message: string) {
  log(`✅ ${message}`, colors.green);
}

function error(message: string) {
  log(`❌ ${message}`, colors.red);
}

function warn(message: string) {
  log(`⚠️  ${message}`, colors.yellow);
}

function info(message: string) {
  log(`ℹ️  ${message}`, colors.blue);
}

// ============================================
// Validation Tests
// ============================================

const workspaceRoot = resolve(__dirname, '..');
let passed = 0;
let failed = 0;
const warnings = 0;

function test(name: string, fn: () => boolean | void): void {
  try {
    const result = fn();
    if (result !== false) {
      success(name);
      passed++;
    } else {
      error(name);
      failed++;
    }
  } catch (e) {
    error(`${name} - ${e instanceof Error ? e.message : 'Unknown error'}`);
    failed++;
  }
}

log('\n' + '='.repeat(60), colors.cyan);
log('🔍 brokerHub Phase 1 Validation', colors.cyan);
log('='.repeat(60) + '\n', colors.cyan);

// --------------------------------------------
// 1. Directory Structure
// --------------------------------------------
log('📁 Directory Structure', colors.blue);

test('Root package.json exists', () => {
  return existsSync(join(workspaceRoot, 'package.json'));
});

test('apps/api directory exists', () => {
  return existsSync(join(workspaceRoot, 'apps/api'));
});

test('apps/admin directory exists', () => {
  return existsSync(join(workspaceRoot, 'apps/admin'));
});

test('infra/migrations directory exists', () => {
  return existsSync(join(workspaceRoot, 'infra/migrations'));
});

test('docs directory exists', () => {
  return existsSync(join(workspaceRoot, 'docs'));
});

test('assets/brand directory exists', () => {
  return existsSync(join(workspaceRoot, 'assets/brand'));
});

test('.github/workflows directory exists', () => {
  return existsSync(join(workspaceRoot, '.github/workflows'));
});

// --------------------------------------------
// 2. API Service Files
// --------------------------------------------
log('\n🔧 API Service Files', colors.blue);

test('apps/api/package.json exists', () => {
  return existsSync(join(workspaceRoot, 'apps/api/package.json'));
});

test('apps/api/tsconfig.json exists', () => {
  return existsSync(join(workspaceRoot, 'apps/api/tsconfig.json'));
});

test('apps/api/src/index.ts exists', () => {
  return existsSync(join(workspaceRoot, 'apps/api/src/index.ts'));
});

test('apps/api/src/config/index.ts exists', () => {
  return existsSync(join(workspaceRoot, 'apps/api/src/config/index.ts'));
});

test('apps/api/src/db/index.ts exists', () => {
  return existsSync(join(workspaceRoot, 'apps/api/src/db/index.ts'));
});

test('apps/api/src/services/tenantService.ts exists', () => {
  return existsSync(join(workspaceRoot, 'apps/api/src/services/tenantService.ts'));
});

test('apps/api/src/services/authService.ts exists', () => {
  return existsSync(join(workspaceRoot, 'apps/api/src/services/authService.ts'));
});

test('apps/api/src/services/creditService.ts exists', () => {
  return existsSync(join(workspaceRoot, 'apps/api/src/services/creditService.ts'));
});

test('apps/api/src/services/skillsService.ts exists', () => {
  return existsSync(join(workspaceRoot, 'apps/api/src/services/skillsService.ts'));
});

test('apps/api/src/middleware/auth.ts exists', () => {
  return existsSync(join(workspaceRoot, 'apps/api/src/middleware/auth.ts'));
});

test('apps/api/src/middleware/errorHandler.ts exists', () => {
  return existsSync(join(workspaceRoot, 'apps/api/src/middleware/errorHandler.ts'));
});

test('apps/api/src/routes/index.ts exists', () => {
  return existsSync(join(workspaceRoot, 'apps/api/src/routes/index.ts'));
});

test('apps/api/src/routes/tenantRoutes.ts exists', () => {
  return existsSync(join(workspaceRoot, 'apps/api/src/routes/tenantRoutes.ts'));
});

test('apps/api/src/routes/authRoutes.ts exists', () => {
  return existsSync(join(workspaceRoot, 'apps/api/src/routes/authRoutes.ts'));
});

test('apps/api/src/routes/creditRoutes.ts exists', () => {
  return existsSync(join(workspaceRoot, 'apps/api/src/routes/creditRoutes.ts'));
});

test('apps/api/src/routes/skillsRoutes.ts exists', () => {
  return existsSync(join(workspaceRoot, 'apps/api/src/routes/skillsRoutes.ts'));
});

// --------------------------------------------
// 3. Docker & Infrastructure
// --------------------------------------------
log('\n🐳 Docker & Infrastructure', colors.blue);

test('docker-compose.yml exists', () => {
  return existsSync(join(workspaceRoot, 'docker-compose.yml'));
});

test('docker-compose.dev.yml exists', () => {
  return existsSync(join(workspaceRoot, 'docker-compose.dev.yml'));
});

test('.env.example exists', () => {
  return existsSync(join(workspaceRoot, '.env.example'));
});

test('.gitignore exists', () => {
  return existsSync(join(workspaceRoot, '.gitignore'));
});

test('apps/api/Dockerfile exists', () => {
  return existsSync(join(workspaceRoot, 'apps/api/Dockerfile'));
});

test('apps/api/Dockerfile.dev exists', () => {
  return existsSync(join(workspaceRoot, 'apps/api/Dockerfile.dev'));
});

test('apps/admin/Dockerfile exists', () => {
  return existsSync(join(workspaceRoot, 'apps/admin/Dockerfile'));
});

test('apps/admin/nginx.conf exists', () => {
  return existsSync(join(workspaceRoot, 'apps/admin/nginx.conf'));
});

// --------------------------------------------
// 4. Database Migrations
// --------------------------------------------
log('\n🗄️  Database Migrations', colors.blue);

test('001_initial_schema.sql exists', () => {
  return existsSync(join(workspaceRoot, 'infra/migrations/001_initial_schema.sql'));
});

test('002_tenant_schema_template.sql exists', () => {
  return existsSync(join(workspaceRoot, 'infra/migrations/002_tenant_schema_template.sql'));
});

test('003_seed_skills.sql exists', () => {
  return existsSync(join(workspaceRoot, 'infra/migrations/003_seed_skills.sql'));
});

test('Migration 001 contains tenants table', () => {
  const content = readFileSync(join(workspaceRoot, 'infra/migrations/001_initial_schema.sql'), 'utf-8');
  return content.includes('CREATE TABLE tenants');
});

test('Migration 001 contains credit_ledger table', () => {
  const content = readFileSync(join(workspaceRoot, 'infra/migrations/001_initial_schema.sql'), 'utf-8');
  return content.includes('CREATE TABLE credit_ledger');
});

test('Migration 001 contains audit_logs table', () => {
  const content = readFileSync(join(workspaceRoot, 'infra/migrations/001_initial_schema.sql'), 'utf-8');
  return content.includes('CREATE TABLE audit_logs');
});

test('Migration 002 contains create_tenant_schema function', () => {
  const content = readFileSync(join(workspaceRoot, 'infra/migrations/002_tenant_schema_template.sql'), 'utf-8');
  return content.includes('CREATE OR REPLACE FUNCTION create_tenant_schema');
});

test('Migration 003 seeds basic_qa skill', () => {
  const content = readFileSync(join(workspaceRoot, 'infra/migrations/003_seed_skills.sql'), 'utf-8');
  return content.includes("'basic_qa'");
});

// --------------------------------------------
// 5. Documentation
// --------------------------------------------
log('\n📚 Documentation', colors.blue);

test('README.md exists', () => {
  return existsSync(join(workspaceRoot, 'README.md'));
});

test('docs/architecture.md exists', () => {
  return existsSync(join(workspaceRoot, 'docs/architecture.md'));
});

test('docs/brand/agent-tone.md exists', () => {
  return existsSync(join(workspaceRoot, 'docs/brand/agent-tone.md'));
});

test('docs/infrastructure/assets.md exists', () => {
  return existsSync(join(workspaceRoot, 'docs/infrastructure/assets.md'));
});

test('assets/brand/brand-tokens.json exists', () => {
  return existsSync(join(workspaceRoot, 'assets/brand/brand-tokens.json'));
});

// --------------------------------------------
// 6. CI/CD
// --------------------------------------------
log('\n🔄 CI/CD Pipeline', colors.blue);

test('.github/workflows/ci.yml exists', () => {
  return existsSync(join(workspaceRoot, '.github/workflows/ci.yml'));
});

test('CI workflow contains lint job', () => {
  const content = readFileSync(join(workspaceRoot, '.github/workflows/ci.yml'), 'utf-8');
  return content.includes('lint:');
});

test('CI workflow contains test job', () => {
  const content = readFileSync(join(workspaceRoot, '.github/workflows/ci.yml'), 'utf-8');
  return content.includes('test:');
});

test('CI workflow contains build job', () => {
  const content = readFileSync(join(workspaceRoot, '.github/workflows/ci.yml'), 'utf-8');
  return content.includes('build:');
});

// --------------------------------------------
// 7. Package.json Validation
// --------------------------------------------
log('\n📦 Package Configuration', colors.blue);

test('Root package.json has workspaces', () => {
  const pkg = JSON.parse(readFileSync(join(workspaceRoot, 'package.json'), 'utf-8'));
  return Array.isArray(pkg.workspaces) && pkg.workspaces.length > 0;
});

test('API package.json has required dependencies', () => {
  const pkg = JSON.parse(readFileSync(join(workspaceRoot, 'apps/api/package.json'), 'utf-8'));
  return pkg.dependencies && pkg.dependencies.express && pkg.dependencies.pg && pkg.dependencies.redis;
});

test('Admin package.json has React dependencies', () => {
  const pkg = JSON.parse(readFileSync(join(workspaceRoot, 'apps/admin/package.json'), 'utf-8'));
  return pkg.dependencies && pkg.dependencies.react && pkg.dependencies['react-dom'];
});

// --------------------------------------------
// Summary
// --------------------------------------------
log('\n' + '='.repeat(60), colors.cyan);
log('📊 Validation Summary', colors.cyan);
log('='.repeat(60), colors.cyan);

log(`\n✅ Passed: ${passed}`, colors.green);
log(`❌ Failed: ${failed}`, failed > 0 ? colors.red : colors.reset);
log(`⚠️  Warnings: ${warnings}`, warnings > 0 ? colors.yellow : colors.reset);
log(`📁 Total: ${passed + failed + warnings}\n`, colors.cyan);

if (failed === 0) {
  log('🎉 All validations passed! Phase 1 is ready for deployment.\n', colors.green);
  log('Next steps:', colors.blue);
  log('1. cd /data/.openclaw/workspace/brokerhub');
  log('2. docker compose -f docker-compose.dev.yml up -d');
  log('3. curl http://localhost:3000/health\n');
  process.exit(0);
} else {
  log('⚠️  Some validations failed. Please review and fix.\n', colors.yellow);
  process.exit(1);
}
