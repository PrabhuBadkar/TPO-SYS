-- =====================================================
-- TPO Management System - Audit Schema
-- =====================================================
-- Description: Audit logging for all system actions
-- Version: 1.0
-- Last Updated: 2024-01-15
-- =====================================================

CREATE SCHEMA IF NOT EXISTS audit;

-- =====================================================
-- Table: audit.events
-- =====================================================
CREATE TABLE audit.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id),
  actor_role VARCHAR(50),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(100) NOT NULL,
  resource_id UUID,
  changes JSONB,
  ip_address INET,
  user_agent TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT
);

CREATE INDEX idx_audit_events_actor ON audit.events(actor_id);
CREATE INDEX idx_audit_events_action ON audit.events(action);
CREATE INDEX idx_audit_events_resource ON audit.events(resource_type, resource_id);
CREATE INDEX idx_audit_events_timestamp ON audit.events(timestamp DESC);

-- Make audit.events append-only
ALTER TABLE audit.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY audit_append_only ON audit.events FOR INSERT WITH CHECK (true);
CREATE POLICY audit_admin_read ON audit.events FOR SELECT 
  USING (auth.jwt() ->> 'role' = 'ROLE_TPO_ADMIN');

COMMENT ON SCHEMA audit IS 'Immutable audit log for all system actions';
COMMENT ON TABLE audit.events IS 'Append-only audit trail with 10-year retention';
