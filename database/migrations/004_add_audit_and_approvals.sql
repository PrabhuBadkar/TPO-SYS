-- Migration: Add Audit Events and Approval Requests Tables
-- Date: 2025-01-XX
-- Description: Add tables for audit logging and 4-eyes approval workflow

-- =====================================================
-- Create audit schema if not exists
-- =====================================================
CREATE SCHEMA IF NOT EXISTS audit;

-- =====================================================
-- Audit Events Table
-- =====================================================
CREATE TABLE IF NOT EXISTS audit.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID NOT NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id UUID,
    changes JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}',
    timestamp TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for audit.events
CREATE INDEX IF NOT EXISTS idx_audit_events_actor_id ON audit.events(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_action ON audit.events(action);
CREATE INDEX IF NOT EXISTS idx_audit_events_resource_type ON audit.events(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_events_resource_id ON audit.events(resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_timestamp ON audit.events(timestamp);

-- =====================================================
-- Approval Requests Table
-- =====================================================
CREATE TABLE IF NOT EXISTS core.approval_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Request Details
    request_type VARCHAR(50) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id UUID NOT NULL,
    
    -- Workflow
    initiator_id UUID NOT NULL,
    approver_id UUID,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    
    -- Justification
    justification TEXT NOT NULL,
    proposed_changes JSONB DEFAULT '{}',
    
    -- Decision
    decision_notes TEXT,
    decided_at TIMESTAMP,
    
    -- Audit
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for core.approval_requests
CREATE INDEX IF NOT EXISTS idx_approval_requests_initiator_id ON core.approval_requests(initiator_id);
CREATE INDEX IF NOT EXISTS idx_approval_requests_approver_id ON core.approval_requests(approver_id);
CREATE INDEX IF NOT EXISTS idx_approval_requests_status ON core.approval_requests(status);
CREATE INDEX IF NOT EXISTS idx_approval_requests_request_type ON core.approval_requests(request_type);
CREATE INDEX IF NOT EXISTS idx_approval_requests_resource_id ON core.approval_requests(resource_id);

-- =====================================================
-- Add comments for documentation
-- =====================================================
COMMENT ON TABLE audit.events IS 'Audit trail for all TPO Admin actions';
COMMENT ON TABLE core.approval_requests IS '4-eyes approval workflow for sensitive actions';

COMMENT ON COLUMN audit.events.actor_id IS 'User ID who performed the action';
COMMENT ON COLUMN audit.events.action IS 'Action type (e.g., RECRUITER_VERIFIED, JD_APPROVED)';
COMMENT ON COLUMN audit.events.resource_type IS 'Type of resource affected (e.g., ORGANIZATION, JOB_POSTING)';
COMMENT ON COLUMN audit.events.resource_id IS 'ID of the affected resource';
COMMENT ON COLUMN audit.events.changes IS 'JSON object containing changes made';
COMMENT ON COLUMN audit.events.ip_address IS 'IP address of the request';
COMMENT ON COLUMN audit.events.user_agent IS 'User agent of the request';
COMMENT ON COLUMN audit.events.metadata IS 'Additional metadata';

COMMENT ON COLUMN core.approval_requests.request_type IS 'Type of approval request (BLACKLIST_ORG, OVERRIDE_PROFILE_VERIFICATION, etc.)';
COMMENT ON COLUMN core.approval_requests.initiator_id IS 'Admin who initiated the request';
COMMENT ON COLUMN core.approval_requests.approver_id IS 'Admin who approved/rejected the request';
COMMENT ON COLUMN core.approval_requests.status IS 'Request status (PENDING, APPROVED, REJECTED)';
COMMENT ON COLUMN core.approval_requests.justification IS 'Reason for the request';
COMMENT ON COLUMN core.approval_requests.proposed_changes IS 'JSON object containing proposed changes';

-- =====================================================
-- Grant permissions
-- =====================================================
-- Grant permissions to application user (adjust username as needed)
-- GRANT SELECT, INSERT ON audit.events TO tpo_app_user;
-- GRANT SELECT, INSERT, UPDATE ON core.approval_requests TO tpo_app_user;

-- =====================================================
-- Verification queries
-- =====================================================
-- Verify tables created
SELECT 
    schemaname, 
    tablename, 
    tableowner 
FROM pg_tables 
WHERE schemaname IN ('audit', 'core') 
    AND tablename IN ('events', 'approval_requests')
ORDER BY schemaname, tablename;

-- Verify indexes created
SELECT 
    schemaname, 
    tablename, 
    indexname 
FROM pg_indexes 
WHERE schemaname IN ('audit', 'core') 
    AND tablename IN ('events', 'approval_requests')
ORDER BY schemaname, tablename, indexname;
