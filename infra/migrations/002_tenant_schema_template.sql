-- ============================================
-- Migration: 002_tenant_schema_template
-- Description: Template for per-tenant schemas
-- Created: 2026-03-28
-- ============================================

-- This migration creates the FUNCTION to generate tenant schemas
-- Each tenant gets their own isolated schema: tenant_{tenant_id}

-- ============================================
-- Function: Create Tenant Schema
-- ============================================
CREATE OR REPLACE FUNCTION create_tenant_schema(p_tenant_id VARCHAR)
RETURNS VOID AS $$
DECLARE
    schema_name TEXT;
BEGIN
    -- Build schema name
    schema_name := 'tenant_' || lower(regexp_replace(p_tenant_id, '[^a-zA-Z0-9]', '_', 'g'));
    
    -- Create schema
    EXECUTE format('CREATE SCHEMA IF NOT EXISTS %I', schema_name);
    
    -- Create conversations table
    EXECUTE format('
        CREATE TABLE %I.conversations (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            tenant_id VARCHAR(50) NOT NULL,
            
            -- Conversation metadata
            external_id VARCHAR(100) DEFAULT NULL,  -- Client-provided ID
            channel VARCHAR(30) DEFAULT NULL,  -- whatsapp, telegram, api, etc.
            participant_id VARCHAR(100) DEFAULT NULL,
            participant_email VARCHAR(255) DEFAULT NULL,
            
            -- Messages (stored as JSONB array)
            messages JSONB NOT NULL DEFAULT ''[]''::jsonb,
            
            -- Status
            status VARCHAR(20) NOT NULL DEFAULT ''active'' CHECK (status IN (''active'', ''archived'', ''closed'')),
            
            -- Timestamps
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
            
            -- Indexes
            UNIQUE(external_id) WHERE external_id IS NOT NULL
        )
    ', schema_name);
    
    EXECUTE format('CREATE INDEX ON %I.conversations (tenant_id)', schema_name);
    EXECUTE format('CREATE INDEX ON %I.conversations (participant_id)', schema_name);
    EXECUTE format('CREATE INDEX ON %I.conversations (status)', schema_name);
    EXECUTE format('CREATE INDEX ON %I.conversations (created_at DESC)', schema_name);
    
    -- Create documents table
    EXECUTE format('
        CREATE TABLE %I.documents (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            tenant_id VARCHAR(50) NOT NULL,
            
            -- S3 reference
            s3_key VARCHAR(500) NOT NULL,
            s3_bucket VARCHAR(100) NOT NULL,
            file_name VARCHAR(255) NOT NULL,
            mime_type VARCHAR(100) NOT NULL,
            file_size_bytes BIGINT NOT NULL,
            
            -- Processing status
            status VARCHAR(20) NOT NULL DEFAULT ''pending'' CHECK (status IN (''pending'', ''processing'', ''completed'', ''failed'')),
            processing_error TEXT DEFAULT NULL,
            
            -- Metadata (extracted content, tags, etc.)
            metadata JSONB DEFAULT NULL,
            
            -- Context
            conversation_id UUID DEFAULT NULL REFERENCES %I.conversations(id) ON DELETE SET NULL,
            uploaded_by VARCHAR(100) DEFAULT NULL,
            
            -- Timestamps
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            processed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
        )
    ', schema_name, schema_name);
    
    EXECUTE format('CREATE INDEX ON %I.documents (tenant_id)', schema_name);
    EXECUTE format('CREATE INDEX ON %I.documents (conversation_id)', schema_name);
    EXECUTE format('CREATE INDEX ON %I.documents (status)', schema_name);
    EXECUTE format('CREATE INDEX ON %I.documents (created_at DESC)', schema_name);
    
    -- Create configs table (tenant-specific settings)
    EXECUTE format('
        CREATE TABLE %I.configs (
            id BIGSERIAL PRIMARY KEY,
            tenant_id VARCHAR(50) NOT NULL,
            
            -- Key-value
            config_key VARCHAR(100) NOT NULL,
            config_value JSONB NOT NULL,
            
            -- Metadata
            description TEXT DEFAULT NULL,
            updated_by VARCHAR(100) DEFAULT NULL,
            
            -- Timestamps
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            
            -- Unique constraint
            UNIQUE(tenant_id, config_key)
        )
    ', schema_name);
    
    EXECUTE format('CREATE INDEX ON %I.configs (tenant_id)', schema_name);
    EXECUTE format('CREATE INDEX ON %I.configs (config_key)', schema_name);
    
    -- Create skill executions table (per-tenant audit)
    EXECUTE format('
        CREATE TABLE %I.skill_executions (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            tenant_id VARCHAR(50) NOT NULL,
            
            -- Skill reference
            skill_id VARCHAR(50) NOT NULL,
            
            -- Execution details
            request_id VARCHAR(100) NOT NULL,  -- Idempotency key
            params_hash VARCHAR(64) DEFAULT NULL,  -- SHA256 of params
            result_hash VARCHAR(64) DEFAULT NULL,  -- SHA256 of result
            
            -- Credit consumption
            credits_used INTEGER NOT NULL DEFAULT 0,
            
            -- Performance
            execution_time_ms INTEGER DEFAULT NULL,
            
            -- Status
            status VARCHAR(20) NOT NULL DEFAULT ''pending'' CHECK (status IN (''pending'', ''completed'', ''failed'', ''cancelled'')),
            error_message TEXT DEFAULT NULL,
            
            -- Context
            conversation_id UUID DEFAULT NULL,
            user_id VARCHAR(100) DEFAULT NULL,
            
            -- Timestamps
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            completed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
        )
    ', schema_name);
    
    EXECUTE format('CREATE INDEX ON %I.skill_executions (tenant_id)', schema_name);
    EXECUTE format('CREATE INDEX ON %I.skill_executions (skill_id)', schema_name);
    EXECUTE format('CREATE INDEX ON %I.skill_executions (request_id)', schema_name);
    EXECUTE format('CREATE INDEX ON %I.skill_executions (created_at DESC)', schema_name);
    
    -- Add comments
    EXECUTE format('COMMENT ON SCHEMA %I IS ''Isolated schema for tenant: %s''', schema_name, p_tenant_id);
    
    -- Log the creation
    RAISE NOTICE 'Created tenant schema: %', schema_name;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Function: Drop Tenant Schema
-- ============================================
CREATE OR REPLACE FUNCTION drop_tenant_schema(p_tenant_id VARCHAR)
RETURNS VOID AS $$
DECLARE
    schema_name TEXT;
BEGIN
    -- Build schema name
    schema_name := 'tenant_' || lower(regexp_replace(p_tenant_id, '[^a-zA-Z0-9]', '_', 'g'));
    
    -- Drop schema (CASCADE to remove all objects)
    EXECUTE format('DROP SCHEMA IF EXISTS %I CASCADE', schema_name);
    
    -- Log the deletion
    RAISE NOTICE 'Dropped tenant schema: %', schema_name;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Function: Get Tenant Credit Balance
-- ============================================
CREATE OR REPLACE FUNCTION get_tenant_balance(p_tenant_id VARCHAR)
RETURNS TABLE (
    tenant_id VARCHAR,
    credit_balance INTEGER,
    credit_limit INTEGER,
    available_credit INTEGER,
    last_transaction_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.tenant_id::VARCHAR,
        t.credit_balance,
        t.credit_limit,
        (t.credit_balance + COALESCE(t.credit_limit, 0))::INTEGER AS available_credit,
        (SELECT MAX(cl.created_at) FROM credit_ledger cl WHERE cl.tenant_id = p_tenant_id) AS last_transaction_at
    FROM tenants t
    WHERE t.tenant_id = p_tenant_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Comments
-- ============================================
COMMENT ON FUNCTION create_tenant_schema IS 'Creates isolated schema for new tenant with all required tables';
COMMENT ON FUNCTION drop_tenant_schema IS 'Removes tenant schema and all data (use with caution)';
COMMENT ON FUNCTION get_tenant_balance IS 'Returns current credit balance and limit for tenant';
