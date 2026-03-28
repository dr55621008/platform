-- ============================================
-- Migration: 001_initial_schema
-- Description: Core shared tables for brokerHub
-- Created: 2026-03-28
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Tenants Table
-- ============================================
CREATE TABLE tenants (
    tenant_id VARCHAR(50) PRIMARY KEY,
    company_id VARCHAR(100) NOT NULL UNIQUE,
    agent_id VARCHAR(50) NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'suspended', 'terminated')),
    
    -- Branding (NULL = use brokerHub default)
    brand_config JSONB DEFAULT NULL,
    
    -- Credit tracking (denormalized for performance)
    credit_balance INTEGER NOT NULL DEFAULT 0,
    credit_limit INTEGER DEFAULT NULL,  -- NULL = no credit line
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    suspended_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    suspended_reason TEXT DEFAULT NULL
);

-- Index for lookups
CREATE INDEX idx_tenants_company_id ON tenants(company_id);
CREATE INDEX idx_tenants_status ON tenants(status);
CREATE INDEX idx_tenants_agent_id ON tenants(agent_id);

-- ============================================
-- Credit Ledger (Immutable Transaction Log)
-- ============================================
CREATE TABLE credit_ledger (
    id BIGSERIAL PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL REFERENCES tenants(tenant_id) ON DELETE RESTRICT,
    
    -- Transaction details
    amount INTEGER NOT NULL,  -- Positive = credit, Negative = debit
    balance_after INTEGER NOT NULL,
    transaction_type VARCHAR(30) NOT NULL CHECK (transaction_type IN ('purchase', 'usage', 'refund', 'adjustment', 'expiry')),
    
    -- Context
    skill_id VARCHAR(50) DEFAULT NULL,  -- For usage transactions
    request_id VARCHAR(100) DEFAULT NULL,  -- Idempotency key
    metadata JSONB DEFAULT NULL,
    
    -- Actor
    user_id VARCHAR(100) DEFAULT NULL,  -- Who initiated (if applicable)
    ip_address INET DEFAULT NULL,
    
    -- Timestamp (immutable)
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for queries
CREATE INDEX idx_credit_ledger_tenant_id ON credit_ledger(tenant_id);
CREATE INDEX idx_credit_ledger_created_at ON credit_ledger(created_at DESC);
CREATE INDEX idx_credit_ledger_transaction_type ON credit_ledger(transaction_type);
CREATE INDEX idx_credit_ledger_request_id ON credit_ledger(request_id) WHERE request_id IS NOT NULL;

-- ============================================
-- Audit Logs (7-Year Retention, Immutable)
-- ============================================
CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL REFERENCES tenants(tenant_id) ON DELETE RESTRICT,
    
    -- Action details
    action VARCHAR(50) NOT NULL,
    resource VARCHAR(100) DEFAULT NULL,
    resource_id VARCHAR(100) DEFAULT NULL,
    
    -- Actor
    user_id VARCHAR(100) DEFAULT NULL,
    user_email VARCHAR(255) DEFAULT NULL,
    ip_address INET NOT NULL,
    user_agent TEXT DEFAULT NULL,
    
    -- Request context
    method VARCHAR(10) DEFAULT NULL,
    path TEXT DEFAULT NULL,
    request_body_hash VARCHAR(64) DEFAULT NULL,  -- SHA256 of request body
    response_status INTEGER DEFAULT NULL,
    
    -- Additional context
    metadata JSONB DEFAULT NULL,
    
    -- Timestamp (immutable)
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for compliance queries
CREATE INDEX idx_audit_logs_tenant_id ON audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id) WHERE user_id IS NOT NULL;

-- Retention policy comment (enforced at application layer)
-- NOTE: Records must be retained for 7 years per insurance/finance compliance
-- DO NOT DELETE or UPDATE records in this table

-- ============================================
-- Skills Registry
-- ============================================
CREATE TABLE skills_registry (
    skill_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT DEFAULT NULL,
    tier VARCHAR(20) NOT NULL CHECK (tier IN ('starter', 'professional', 'enterprise', 'custom')),
    
    -- Pricing
    credit_cost INTEGER NOT NULL DEFAULT 1,
    credit_cost_batch INTEGER DEFAULT NULL,  -- For batch operations
    
    -- Rate limiting
    rate_limit_per_hour INTEGER DEFAULT 100,
    rate_limit_per_day INTEGER DEFAULT NULL,
    
    -- Status
    enabled BOOLEAN NOT NULL DEFAULT true,
    deprecated BOOLEAN NOT NULL DEFAULT false,
    deprecation_date DATE DEFAULT NULL,
    
    -- Configuration
    config_schema JSONB DEFAULT NULL,  -- JSON Schema for skill params
    metadata JSONB DEFAULT NULL,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Index for lookups
CREATE INDEX idx_skills_registry_tier ON skills_registry(tier);
CREATE INDEX idx_skills_registry_enabled ON skills_registry(enabled) WHERE enabled = true;

-- ============================================
-- Tenant Skill Entitlements
-- ============================================
CREATE TABLE tenant_skill_entitlements (
    id BIGSERIAL PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    skill_id VARCHAR(50) NOT NULL REFERENCES skills_registry(skill_id) ON DELETE RESTRICT,
    
    -- Override defaults (NULL = use registry default)
    credit_cost_override INTEGER DEFAULT NULL,
    rate_limit_override INTEGER DEFAULT NULL,
    
    -- Status
    enabled BOOLEAN NOT NULL DEFAULT true,
    
    -- Timestamps
    granted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    
    -- Unique constraint
    UNIQUE(tenant_id, skill_id)
);

-- Index for entitlement checks
CREATE INDEX idx_tenant_entitlements_tenant_id ON tenant_skill_entitlements(tenant_id);
CREATE INDEX idx_tenant_entitlements_enabled ON tenant_skill_entitlements(tenant_id, enabled) WHERE enabled = true;

-- ============================================
-- Refresh Tokens
-- ============================================
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR(50) NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    user_id VARCHAR(100) NOT NULL,
    
    -- Token hash (store hash, not raw token)
    token_hash VARCHAR(64) NOT NULL,
    
    -- Metadata
    device_info JSONB DEFAULT NULL,
    ip_address INET DEFAULT NULL,
    
    -- Expiry
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Index for lookups
CREATE INDEX idx_refresh_tokens_tenant_id ON refresh_tokens(tenant_id);
CREATE INDEX idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);

-- ============================================
-- Updated At Trigger Function
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to tables with updated_at
CREATE TRIGGER update_tenants_updated_at
    BEFORE UPDATE ON tenants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_skills_registry_updated_at
    BEFORE UPDATE ON skills_registry
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Comments
-- ============================================
COMMENT ON TABLE tenants IS 'Multi-tenant isolation - each row represents a broker company';
COMMENT ON TABLE credit_ledger IS 'Immutable credit transaction log - never UPDATE or DELETE';
COMMENT ON TABLE audit_logs IS 'Compliance audit trail - 7-year retention, immutable';
COMMENT ON TABLE skills_registry IS 'Available skills with pricing and rate limits';
COMMENT ON TABLE tenant_skill_entitlements IS 'Per-tenant skill access grants';
