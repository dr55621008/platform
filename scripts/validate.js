#!/usr/bin/env node
/**
 * brokerHub Phase 1 Validation Script
 * Simple Node.js version - no dependencies required
 */

const { existsSync, readFileSync } = require('fs');
const { join, resolve } = require('path');

// Colors
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(msg, color = colors.reset) {
  console.log(`${color}${msg}${colors.reset}`);
}

function success(msg) { log(`✅ ${msg}`, colors.green); }
function error(msg) { log(`❌ ${msg}`, colors.red); }
function info(msg) { log(`ℹ️  ${msg}`, colors.blue); }

const root = resolve(__dirname, '..');
let passed = 0, failed = 0;

function test(name, fn) {
  try {
    if (fn() !== false) { success(name); passed++; }
    else { error(name); failed++; }
  } catch (e) {
    error(`${name} - ${e.message}`);
    failed++;
  }
}

log('\n' + '='.repeat(60), colors.cyan);
log('🔍 brokerHub Phase 1 Validation', colors.cyan);
log('='.repeat(60) + '\n', colors.cyan);

// Directory Structure
log('📁 Directory Structure', colors.blue);
test('Root package.json', () => existsSync(join(root, 'package.json')));
test('apps/api', () => existsSync(join(root, 'apps/api')));
test('apps/admin', () => existsSync(join(root, 'apps/admin')));
test('infra/migrations', () => existsSync(join(root, 'infra/migrations')));
test('docs', () => existsSync(join(root, 'docs')));
test('assets/brand', () => existsSync(join(root, 'assets/brand')));
test('.github/workflows', () => existsSync(join(root, '.github/workflows')));

// API Files
log('\n🔧 API Service', colors.blue);
test('apps/api/package.json', () => existsSync(join(root, 'apps/api/package.json')));
test('apps/api/src/index.ts', () => existsSync(join(root, 'apps/api/src/index.ts')));
test('apps/api/src/config/index.ts', () => existsSync(join(root, 'apps/api/src/config/index.ts')));
test('apps/api/src/db/index.ts', () => existsSync(join(root, 'apps/api/src/db/index.ts')));
test('tenantService.ts', () => existsSync(join(root, 'apps/api/src/services/tenantService.ts')));
test('authService.ts', () => existsSync(join(root, 'apps/api/src/services/authService.ts')));
test('creditService.ts', () => existsSync(join(root, 'apps/api/src/services/creditService.ts')));
test('skillsService.ts', () => existsSync(join(root, 'apps/api/src/services/skillsService.ts')));
test('auth.ts middleware', () => existsSync(join(root, 'apps/api/src/middleware/auth.ts')));
test('tenantRoutes.ts', () => existsSync(join(root, 'apps/api/src/routes/tenantRoutes.ts')));
test('authRoutes.ts', () => existsSync(join(root, 'apps/api/src/routes/authRoutes.ts')));
test('creditRoutes.ts', () => existsSync(join(root, 'apps/api/src/routes/creditRoutes.ts')));
test('skillsRoutes.ts', () => existsSync(join(root, 'apps/api/src/routes/skillsRoutes.ts')));

// Docker
log('\n🐳 Docker', colors.blue);
test('docker-compose.yml', () => existsSync(join(root, 'docker-compose.yml')));
test('docker-compose.dev.yml', () => existsSync(join(root, 'docker-compose.dev.yml')));
test('.env.example', () => existsSync(join(root, '.env.example')));
test('apps/api/Dockerfile', () => existsSync(join(root, 'apps/api/Dockerfile')));
test('apps/admin/Dockerfile', () => existsSync(join(root, 'apps/admin/Dockerfile')));

// Migrations
log('\n🗄️  Migrations', colors.blue);
test('001_initial_schema.sql', () => existsSync(join(root, 'infra/migrations/001_initial_schema.sql')));
test('002_tenant_schema_template.sql', () => existsSync(join(root, 'infra/migrations/002_tenant_schema_template.sql')));
test('003_seed_skills.sql', () => existsSync(join(root, 'infra/migrations/003_seed_skills.sql')));

test('Migration 001 has tenants table', () => {
  const c = readFileSync(join(root, 'infra/migrations/001_initial_schema.sql'), 'utf-8');
  return c.includes('CREATE TABLE tenants');
});
test('Migration 001 has credit_ledger', () => {
  const c = readFileSync(join(root, 'infra/migrations/001_initial_schema.sql'), 'utf-8');
  return c.includes('CREATE TABLE credit_ledger');
});
test('Migration 001 has audit_logs', () => {
  const c = readFileSync(join(root, 'infra/migrations/001_initial_schema.sql'), 'utf-8');
  return c.includes('CREATE TABLE audit_logs');
});
test('Migration 002 has create_tenant_schema', () => {
  const c = readFileSync(join(root, 'infra/migrations/002_tenant_schema_template.sql'), 'utf-8');
  return c.includes('create_tenant_schema');
});

// Docs
log('\n📚 Documentation', colors.blue);
test('README.md', () => existsSync(join(root, 'README.md')));
test('docs/architecture.md', () => existsSync(join(root, 'docs/architecture.md')));
test('docs/brand/agent-tone.md', () => existsSync(join(root, 'docs/brand/agent-tone.md')));
test('docs/infrastructure/assets.md', () => existsSync(join(root, 'docs/infrastructure/assets.md')));
test('brand-tokens.json', () => existsSync(join(root, 'assets/brand/brand-tokens.json')));

// CI/CD
log('\n🔄 CI/CD', colors.blue);
test('.github/workflows/ci.yml', () => existsSync(join(root, '.github/workflows/ci.yml')));

// Summary
log('\n' + '='.repeat(60), colors.cyan);
log(`📊 Passed: ${passed} | Failed: ${failed}`, colors.cyan);
log('='.repeat(60), colors.cyan);

if (failed === 0) {
  log('\n🎉 All validations passed! Phase 1 ready for deployment.\n', colors.green);
  log('To run locally:', colors.blue);
  log('1. cd /data/.openclaw/workspace/brokerhub');
  log('2. docker compose -f docker-compose.dev.yml up -d');
  log('3. curl http://localhost:3000/health\n');
  process.exit(0);
} else {
  log('\n⚠️  Some validations failed.\n', colors.yellow);
  process.exit(1);
}
