-- =====================================================
-- TPO Management System - Audit Schema
-- File: 07_audit.sql
-- Description: Immutable audit log for all system actions
-- =====================================================

-- Create schema
CREATE SCHEMA IF NOT EXISTS audit;

-- =====================================================
-- Table: audit.events
-- Description: Immutable audit log for all system actions
-- =====================================================
CREATE TABLE IF NOT EXISTS audit.events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Actor Information
    actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    actor_role VARCHAR(50),
    actor_email VARCHAR(255),
    
    -- Action Details
    action VARCHAR(100) NOT NULL, -- e.g., "PROFILE_VERIFIED", "APPLICATION_SUBMITTED", "JOB_APPROVED"
    resource_type VARCHAR(100) NOT NULL, -- e.g., "students.profiles", "recruiters.job_postings"
    resource_id UUID,
    
    -- Changes (JSONB for flexibility)
    changes JSONB, -- {"old": {...}, "new": {...}}
    
    -- Request Metadata
    ip_address INET,
    user_agent TEXT,
    request_id VARCHAR(100),
    session_id UUID,
    
    -- Result
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    
    -- Additional Context
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Timestamp (immutable)
    event_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Indexes
CREATE INDEX idx_audit_events_actor ON audit.events(actor_id);
CREATE INDEX idx_audit_events_action ON audit.events(action);
CREATE INDEX idx_audit_events_resource_type ON audit.events(resource_type);
CREATE INDEX idx_audit_events_resource_id ON audit.events(resource_id);
CREATE INDEX idx_audit_events_timestamp ON audit.events(event_timestamp DESC);
CREATE INDEX idx_audit_events_success ON audit.events(success);
CREATE INDEX idx_audit_events_ip_address ON audit.events(ip_address);

-- Comments
COMMENT ON TABLE audit.events IS 'Immutable audit log for all system actions (append-only)';
COMMENT ON COLUMN audit.events.action IS 'Action performed (e.g., PROFILE_VERIFIED, APPLICATION_SUBMITTED)';
COMMENT ON COLUMN audit.events.changes IS 'JSON object with old and new values for the resource';
COMMENT ON COLUMN audit.events.metadata IS 'Additional context data for the action';

-- =====================================================
-- Immutability Constraints
-- =====================================================

-- Prevent UPDATE and DELETE operations on audit.events
CREATE OR REPLACE FUNCTION audit.prevent_audit_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Audit events are immutable and cannot be modified or deleted';
END;
$$ LANGUAGE plpgsql;

-- Trigger: Prevent UPDATE
CREATE TRIGGER trigger_prevent_audit_update
    BEFORE UPDATE ON audit.events
    FOR EACH ROW
    EXECUTE FUNCTION audit.prevent_audit_modification();

-- Trigger: Prevent DELETE
CREATE TRIGGER trigger_prevent_audit_delete
    BEFORE DELETE ON audit.events
    FOR EACH ROW
    EXECUTE FUNCTION audit.prevent_audit_modification();

-- =====================================================
-- Audit Helper Functions
-- =====================================================

-- Function: Log audit event
CREATE OR REPLACE FUNCTION audit.log_event(
    p_actor_id UUID,
    p_action VARCHAR(100),
    p_resource_type VARCHAR(100),
    p_resource_id UUID,
    p_changes JSONB DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::jsonb,
    p_success BOOLEAN DEFAULT TRUE,
    p_error_message TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_event_id UUID;
    v_actor_role VARCHAR(50);
    v_actor_email VARCHAR(255);
    v_ip_address INET;
    v_user_agent TEXT;
BEGIN
    -- Get actor details
    SELECT role, email INTO v_actor_role, v_actor_email
    FROM auth.users
    WHERE id = p_actor_id;
    
    -- Get request metadata from session variables (if available)
    BEGIN
        v_ip_address := current_setting('request.ip_address', true)::INET;
    EXCEPTION WHEN OTHERS THEN
        v_ip_address := NULL;
    END;
    
    BEGIN
        v_user_agent := current_setting('request.user_agent', true);
    EXCEPTION WHEN OTHERS THEN
        v_user_agent := NULL;
    END;
    
    -- Insert audit event
    INSERT INTO audit.events (
        actor_id,
        actor_role,
        actor_email,
        action,
        resource_type,
        resource_id,
        changes,
        ip_address,
        user_agent,
        success,
        error_message,
        metadata
    ) VALUES (
        p_actor_id,
        v_actor_role,
        v_actor_email,
        p_action,
        p_resource_type,
        p_resource_id,
        p_changes,
        v_ip_address,
        v_user_agent,
        p_success,
        p_error_message,
        p_metadata
    ) RETURNING id INTO v_event_id;
    
    RETURN v_event_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Get audit trail for a resource
CREATE OR REPLACE FUNCTION audit.get_resource_trail(
    p_resource_type VARCHAR(100),
    p_resource_id UUID
)
RETURNS TABLE (
    event_id UUID,
    action VARCHAR(100),
    actor_email VARCHAR(255),
    actor_role VARCHAR(50),
    changes JSONB,
    event_timestamp TIMESTAMP
) AS $ AS $$
BEGIN
    RETURN QUERY
    SELECT 
        id,
        action,
        actor_email,
        actor_role,
        changes,
        event_timestamp
    FROM audit.events
    WHERE resource_type = p_resource_type
      AND resource_id = p_resource_id
    ORDER BY event_timestamp DESC;
END;
$$ LANGUAGE plpgsql;

-- Function: Get user activity log
CREATE OR REPLACE FUNCTION audit.get_user_activity(
    p_actor_id UUID,
    p_limit INTEGER DEFAULT 100
)
RETURNS TABLE (
    event_id UUID,
    action VARCHAR(100),
    resource_type VARCHAR(100),
    resource_id UUID,
    event_timestamp TIMESTAMP,
    success BOOLEAN
) AS $ AS $$
BEGIN
    RETURN QUERY
    SELECT 
        id,
        action,
        resource_type,
        resource_id,
        event_timestamp,
        success
    FROM audit.events
    WHERE actor_id = p_actor_id
    ORDER BY event_timestamp DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function: Get failed actions (security monitoring)
CREATE OR REPLACE FUNCTION audit.get_failed_actions(
    p_hours INTEGER DEFAULT 24,
    p_limit INTEGER DEFAULT 100
)
RETURNS TABLE (
    event_id UUID,
    actor_id UUID,
    actor_email VARCHAR(255),
    action VARCHAR(100),
    resource_type VARCHAR(100),
    ip_address INET,
    error_message TEXT,
    event_timestamp TIMESTAMP
) AS $ AS $$
BEGIN
    RETURN QUERY
    SELECT 
        id,
        actor_id,
        actor_email,
        action,
        resource_type,
        ip_address,
        error_message,
        event_timestamp
    FROM audit.events
    WHERE success = FALSE
      AND event_timestamp > CURRENT_TIMESTAMP - (p_hours || ' hours')::INTERVAL
    ORDER BY event_timestamp DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function: Get actions by IP address (security monitoring)
CREATE OR REPLACE FUNCTION audit.get_actions_by_ip(
    p_ip_address INET,
    p_hours INTEGER DEFAULT 24
)
RETURNS TABLE (
    event_id UUID,
    actor_id UUID,
    actor_email VARCHAR(255),
    action VARCHAR(100),
    resource_type VARCHAR(100),
    event_timestamp TIMESTAMP,
    success BOOLEAN
) AS $ AS $$
BEGIN
    RETURN QUERY
    SELECT 
        id,
        actor_id,
        actor_email,
        action,
        resource_type,
        event_timestamp,
        success
    FROM audit.events
    WHERE ip_address = p_ip_address
      AND event_timestamp > CURRENT_TIMESTAMP - (p_hours || ' hours')::INTERVAL
    ORDER BY event_timestamp DESC;
END;
$$ LANGUAGE plpgsql;

-- Function: Archive old audit events (for WORM storage)
CREATE OR REPLACE FUNCTION audit.archive_old_events(
    p_days_old INTEGER DEFAULT 90
)
RETURNS TABLE (
    archived_count BIGINT,
    oldest_timestamp TIMESTAMP,
    newest_timestamp TIMESTAMP
) AS $ AS $$$
DECLARE
    v_cutoff_date TIMESTAMP;
    v_archived_count BIGINT;
    v_oldest TIMESTAMP;
    v_newest TIMESTAMP;
BEGIN
    v_cutoff_date := CURRENT_TIMESTAMP - (p_days_old || ' days')::INTERVAL;
    
    -- Get statistics before archiving
    SELECT COUNT(*), MIN(event_timestamp), MAX(event_timestamp)
    INTO v_archived_count, v_oldest, v_newest
    FROM audit.events
    WHERE event_timestamp < v_cutoff_date;
    
    -- In production, this would export to WORM storage
    -- For now, we just return statistics
    
    RETURN QUERY SELECT v_archived_count, v_oldest, v_newest;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Row-Level Security (RLS) Policies
-- =====================================================

-- Enable RLS on audit.events
ALTER TABLE audit.events ENABLE ROW LEVEL SECURITY;

-- Policy: TPO_Admin can view all audit events
CREATE POLICY tpo_admin_view_all_audit ON audit.events
    FOR SELECT
    USING (current_setting('app.current_user_role', true) = 'ROLE_TPO_ADMIN');

-- Policy: Users can view their own audit events
CREATE POLICY users_view_own_audit ON audit.events
    FOR SELECT
    USING (actor_id = current_setting('app.current_user_id', true)::UUID);

-- Policy: TPO_Dept can view audit events for their department
CREATE POLICY tpo_dept_view_department_audit ON audit.events
    FOR SELECT
    USING (
        current_setting('app.current_user_role', true) = 'ROLE_TPO_DEPT'
        AND resource_type LIKE 'students.%'
    );

-- Policy: Allow INSERT for all authenticated users (via application)
CREATE POLICY all_users_insert_audit ON audit.events
    FOR INSERT
    WITH CHECK (true);

-- =====================================================
-- Audit Event Types (Documentation)
-- =====================================================

/*
Common Audit Event Actions:

Authentication & Authorization:
- LOGIN_SUCCESS
- LOGIN_FAILED
- LOGOUT
- PASSWORD_CHANGED
- MFA_ENABLED
- MFA_DISABLED
- SESSION_EXPIRED

Student Profile:
- PROFILE_CREATED
- PROFILE_UPDATED
- PROFILE_VERIFIED
- PROFILE_REJECTED
- PROFILE_HOLD
- RESUME_UPLOADED
- RESUME_DELETED
- CONSENT_GIVEN
- CONSENT_REVOKED

Applications:
- APPLICATION_SUBMITTED
- APPLICATION_WITHDRAWN
- APPLICATION_APPROVED_BY_DEPT
- APPLICATION_REJECTED_BY_DEPT
- APPLICATION_APPROVED_BY_ADMIN
- APPLICATION_REJECTED_BY_ADMIN
- APPLICATION_FORWARDED_TO_RECRUITER

Job Postings:
- JD_CREATED
- JD_UPDATED
- JD_SUBMITTED_FOR_APPROVAL
- JD_APPROVED
- JD_REJECTED
- JD_MODIFICATIONS_REQUESTED
- JD_CLOSED

Offers:
- OFFER_EXTENDED
- OFFER_ACCEPTED
- OFFER_REJECTED
- OFFER_RESCINDED

Recruiters:
- ORGANIZATION_REGISTERED
- ORGANIZATION_VERIFIED
- ORGANIZATION_REJECTED
- ORGANIZATION_BLACKLISTED
- POC_ADDED
- POC_REMOVED

Events & Calendar:
- EVENT_CREATED
- EVENT_UPDATED
- EVENT_CANCELLED
- RSVP_SUBMITTED
- ATTENDANCE_MARKED

System Administration:
- USER_CREATED
- USER_UPDATED
- USER_DELETED
- ROLE_ASSIGNED
- PERMISSION_GRANTED
- PERMISSION_REVOKED
- POLICY_UPDATED
- REPORT_GENERATED
- DATA_EXPORTED

Academic Data:
- ACADEMIC_DATA_FLAGGED
- EXAM_CORRECTION_REQUESTED
- EXAM_CORRECTION_APPROVED
- EXAM_CORRECTION_REJECTED
*/

-- =====================================================
-- End of 07_audit.sql
-- =====================================================
