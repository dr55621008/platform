-- ============================================
-- Migration: 003_seed_skills
-- Description: Seed initial skills registry
-- Created: 2026-03-28
-- ============================================

-- ============================================
-- Phase 1 Skills
-- ============================================

-- Basic Q&A (Starter Tier)
INSERT INTO skills_registry (skill_id, name, description, tier, credit_cost, rate_limit_per_hour, config_schema, metadata)
VALUES (
    'basic_qa',
    'Basic Q&A',
    'General question answering and information retrieval',
    'starter',
    1,  -- 1 credit per use
    100,  -- 100 requests per hour
    '{
        "type": "object",
        "properties": {
            "query": {"type": "string", "description": "User question"},
            "context": {"type": "string", "description": "Optional context"}
        },
        "required": ["query"]
    }'::jsonb,
    '{"category": "communication", "complexity": "low"}'::jsonb
);

-- Document Analysis (Professional Tier)
INSERT INTO skills_registry (skill_id, name, description, tier, credit_cost, credit_cost_batch, rate_limit_per_hour, config_schema, metadata)
VALUES (
    'document_analysis',
    'Document Analysis',
    'Extract insights, summarize, and analyze uploaded documents',
    'professional',
    5,  -- 5 credits per document
    50,  -- 50 credits per 100 documents batch
    20,  -- 20 requests per hour
    '{
        "type": "object",
        "properties": {
            "document_id": {"type": "string", "description": "Document UUID"},
            "analysis_type": {
                "type": "string",
                "enum": ["summary", "extract", "classify", "qa"],
                "description": "Type of analysis"
            },
            "questions": {"type": "array", "items": {"type": "string"}, "description": "Specific questions to answer"}
        },
        "required": ["document_id", "analysis_type"]
    }'::jsonb,
    '{"category": "analysis", "complexity": "medium", "supported_formats": ["pdf", "docx", "txt", "png", "jpg"]}'::jsonb
);

-- Market Analytics (Enterprise Tier)
INSERT INTO skills_registry (skill_id, name, description, tier, credit_cost, rate_limit_per_hour, rate_limit_per_day, config_schema, metadata)
VALUES (
    'market_analytics',
    'Market Analytics',
    'Generate market reports, trends, and competitive intelligence',
    'enterprise',
    10,  -- 10 credits per report
    10,  -- 10 requests per hour
    50,  -- 50 requests per day
    '{
        "type": "object",
        "properties": {
            "market": {"type": "string", "description": "Market segment (e.g., HK insurance)"},
            "timeframe": {"type": "string", "enum": ["quarter", "year", "5year"], "description": "Analysis period"},
            "format": {"type": "string", "enum": ["summary", "detailed", "executive"], "description": "Report depth"},
            "competitors": {"type": "array", "items": {"type": "string"}, "description": "Specific competitors to analyze"}
        },
        "required": ["market", "timeframe"]
    }'::jsonb,
    '{"category": "analytics", "complexity": "high", "data_sources": ["public", "licensed"]}':jsonb
);

-- API Integration (Enterprise Tier)
INSERT INTO skills_registry (skill_id, name, description, tier, credit_cost, rate_limit_per_hour, config_schema, metadata)
VALUES (
    'api_integration',
    'API Integration',
    'Connect to external APIs and services with data transformation',
    'enterprise',
    2,  -- 2 credits per call
    50,  -- 50 calls per hour
    '{
        "type": "object",
        "properties": {
            "endpoint": {"type": "string", "description": "API endpoint URL"},
            "method": {"type": "string", "enum": ["GET", "POST", "PUT", "DELETE"], "description": "HTTP method"},
            "headers": {"type": "object", "description": "Request headers"},
            "body": {"type": "object", "description": "Request body"},
            "transform": {"type": "string", "description": "Transformation script (optional)"}
        },
        "required": ["endpoint", "method"]
    }'::jsonb,
    '{"category": "integration", "complexity": "medium", "supports_webhooks": true}'::jsonb
);

-- Compliance Check (Professional Tier)
INSERT INTO skills_registry (skill_id, name, description, tier, credit_cost, rate_limit_per_hour, config_schema, metadata)
VALUES (
    'compliance_check',
    'Compliance Check',
    'Review documents and communications for regulatory compliance',
    'professional',
    8,  -- 8 credits per check
    15,  -- 15 checks per hour
    '{
        "type": "object",
        "properties": {
            "document_id": {"type": "string", "description": "Document UUID"},
            "jurisdiction": {"type": "string", "description": "Regulatory jurisdiction (e.g., HK, SG)"},
            "regulation_type": {"type": "string", "enum": ["insurance", "finance", "data_privacy", "aml"], "description": "Regulation category"}
        },
        "required": ["document_id", "jurisdiction"]
    }'::jsonb,
    '{"category": "compliance", "complexity": "high", "audit_required": true}'::jsonb
);

-- ============================================
-- Default Entitlements by Tier
-- ============================================

-- Starter Tier Entitlements
INSERT INTO tenant_skill_entitlements (tenant_id, skill_id, enabled)
SELECT 
    'demo_starter_tenant'::VARCHAR,  -- Demo tenant ID
    skill_id,
    true
FROM skills_registry
WHERE tier = 'starter';

-- Professional Tier Entitlements (includes Starter)
INSERT INTO tenant_skill_entitlements (tenant_id, skill_id, enabled)
SELECT 
    'demo_professional_tenant'::VARCHAR,
    skill_id,
    true
FROM skills_registry
WHERE tier IN ('starter', 'professional');

-- Enterprise Tier Entitlements (includes all)
INSERT INTO tenant_skill_entitlements (tenant_id, skill_id, enabled)
SELECT 
    'demo_enterprise_tenant'::VARCHAR,
    skill_id,
    true
FROM skills_registry
WHERE enabled = true;

-- ============================================
-- Comments
-- ============================================
COMMENT ON TABLE skills_registry IS 'Available skills with pricing - seed data includes Phase 1 skills';
