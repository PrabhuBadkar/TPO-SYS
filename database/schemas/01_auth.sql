-- =====================================================
-- TPO Management System - Authentication Schema
-- File: 01_auth.sql
-- Description: User authentication, roles, and sessions
-- =====================================================

-- Create schema
CREATE SCHEMA IF NOT EXISTS auth;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- Table: auth.users
-- Description: All system users (students, TPO staff, recruiters)
-- =====================================================
CREATE TABLE IF NOT EXISTS auth.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    encrypted_password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('ROLE_STUDENT', 'ROLE_TPO_DEPT', 'ROLE_TPO_ADMIN', 'ROLE_RECRUITER')),
    
    -- Email verification
    email_verified BOOLEAN DEFAULT FALSE,
    email_verification_token VARCHAR(255),
    email_verification_sent_at TIMESTAMP,
    
    -- Mobile verification
    mobile_number VARCHAR(15),
    mobile_verified BOOLEAN DEFAULT FALSE,
    mobile_verification_code VARCHAR(6),
    mobile_verification_sent_at TIMESTAMP,
    
    -- MFA (Multi-Factor Authentication)
    mfa_enabled BOOLEAN DEFAULT FALSE,
    mfa_secret VARCHAR(255),
    mfa_backup_codes TEXT[], -- Array of backup codes
    
    -- Password reset
    password_reset_token VARCHAR(255),
    password_reset_sent_at TIMESTAMP,
    password_reset_expires_at TIMESTAMP,
    
    -- Account status
    is_active BOOLEAN DEFAULT TRUE,
    is_locked BOOLEAN DEFAULT FALSE,
    locked_at TIMESTAMP,
    locked_reason TEXT,
    
    -- Login tracking
    last_login_at TIMESTAMP,
    last_login_ip VARCHAR(45),
    failed_login_attempts INTEGER DEFAULT 0,
    last_failed_login_at TIMESTAMP,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_users_email ON auth.users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_role ON auth.users(role) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_email_verified ON auth.users(email_verified) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_is_active ON auth.users(is_active) WHERE deleted_at IS NULL;

-- Comments
COMMENT ON TABLE auth.users IS 'All system users including students, TPO staff, and recruiters';
COMMENT ON COLUMN auth.users.role IS 'User role: ROLE_STUDENT, ROLE_TPO_DEPT, ROLE_TPO_ADMIN, ROLE_RECRUITER';
COMMENT ON COLUMN auth.users.mfa_enabled IS 'Whether multi-factor authentication is enabled';
COMMENT ON COLUMN auth.users.failed_login_attempts IS 'Number of consecutive failed login attempts';

-- =====================================================
-- Table: auth.sessions
-- Description: User sessions for JWT token management
-- =====================================================
CREATE TABLE IF NOT EXISTS auth.sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Token information
    access_token_hash VARCHAR(255) NOT NULL,
    refresh_token_hash VARCHAR(255) NOT NULL,
    
    -- Session metadata
    ip_address VARCHAR(45),
    user_agent TEXT,
    device_info JSONB,
    
    -- Expiry
    access_token_expires_at TIMESTAMP NOT NULL,
    refresh_token_expires_at TIMESTAMP NOT NULL,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    revoked_at TIMESTAMP,
    revoked_reason TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_sessions_user_id ON auth.sessions(user_id);
CREATE INDEX idx_sessions_access_token ON auth.sessions(access_token_hash);
CREATE INDEX idx_sessions_refresh_token ON auth.sessions(refresh_token_hash);
CREATE INDEX idx_sessions_is_active ON auth.sessions(is_active);
CREATE INDEX idx_sessions_expires_at ON auth.sessions(refresh_token_expires_at);

-- Comments
COMMENT ON TABLE auth.sessions IS 'User sessions for JWT token management and tracking';
COMMENT ON COLUMN auth.sessions.access_token_hash IS 'SHA-256 hash of access token';
COMMENT ON COLUMN auth.sessions.refresh_token_hash IS 'SHA-256 hash of refresh token';

-- =====================================================
-- Table: auth.permissions
-- Description: Role-based permissions
-- =====================================================
CREATE TABLE IF NOT EXISTS auth.permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role VARCHAR(50) NOT NULL,
    resource VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL CHECK (action IN ('CREATE', 'READ', 'UPDATE', 'DELETE', 'APPROVE', 'VERIFY')),
    
    -- Conditions (optional JSONB for complex rules)
    conditions JSONB,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Unique constraint
    UNIQUE(role, resource, action)
);

-- Indexes
CREATE INDEX idx_permissions_role ON auth.permissions(role);
CREATE INDEX idx_permissions_resource ON auth.permissions(resource);

-- Comments
COMMENT ON TABLE auth.permissions IS 'Role-based access control permissions';
COMMENT ON COLUMN auth.permissions.conditions IS 'Optional JSONB conditions for complex permission rules';

-- =====================================================
-- Table: auth.login_history
-- Description: Login attempt history for security auditing
-- =====================================================
CREATE TABLE IF NOT EXISTS auth.login_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    email VARCHAR(255) NOT NULL,
    
    -- Attempt details
    success BOOLEAN NOT NULL,
    failure_reason VARCHAR(255),
    
    -- Request metadata
    ip_address VARCHAR(45),
    user_agent TEXT,
    device_info JSONB,
    
    -- Timestamp
    attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_login_history_user_id ON auth.login_history(user_id);
CREATE INDEX idx_login_history_email ON auth.login_history(email);
CREATE INDEX idx_login_history_attempted_at ON auth.login_history(attempted_at);
CREATE INDEX idx_login_history_success ON auth.login_history(success);

-- Comments
COMMENT ON TABLE auth.login_history IS 'Login attempt history for security auditing and monitoring';

-- =====================================================
-- Functions and Triggers
-- =====================================================

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION auth.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update updated_at on auth.users
CREATE TRIGGER trigger_users_updated_at
    BEFORE UPDATE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION auth.update_updated_at_column();

-- Trigger: Update updated_at on auth.permissions
CREATE TRIGGER trigger_permissions_updated_at
    BEFORE UPDATE ON auth.permissions
    FOR EACH ROW
    EXECUTE FUNCTION auth.update_updated_at_column();

-- Function: Clean expired sessions
CREATE OR REPLACE FUNCTION auth.clean_expired_sessions()
RETURNS void AS $$
BEGIN
    UPDATE auth.sessions
    SET is_active = FALSE,
        revoked_at = CURRENT_TIMESTAMP,
        revoked_reason = 'Expired'
    WHERE refresh_token_expires_at < CURRENT_TIMESTAMP
      AND is_active = TRUE;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Row-Level Security (RLS) Policies
-- =====================================================

-- Enable RLS on tables
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth.sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own record
CREATE POLICY users_view_own ON auth.users
    FOR SELECT
    USING (id = current_setting('app.current_user_id', true)::UUID);

-- Policy: Users can update their own record (limited fields)
CREATE POLICY users_update_own ON auth.users
    FOR UPDATE
    USING (id = current_setting('app.current_user_id', true)::UUID);

-- Policy: Admins can view all users
CREATE POLICY users_admin_view_all ON auth.users
    FOR SELECT
    USING (current_setting('app.current_user_role', true) = 'ROLE_TPO_ADMIN');

-- Policy: Users can view their own sessions
CREATE POLICY sessions_view_own ON auth.sessions
    FOR SELECT
    USING (user_id = current_setting('app.current_user_id', true)::UUID);

-- =====================================================
-- Initial Data (Permissions)
-- =====================================================

-- Student permissions
INSERT INTO auth.permissions (role, resource, action) VALUES
('ROLE_STUDENT', 'profile', 'READ'),
('ROLE_STUDENT', 'profile', 'UPDATE'),
('ROLE_STUDENT', 'resume', 'CREATE'),
('ROLE_STUDENT', 'resume', 'READ'),
('ROLE_STUDENT', 'resume', 'DELETE'),
('ROLE_STUDENT', 'application', 'CREATE'),
('ROLE_STUDENT', 'application', 'READ'),
('ROLE_STUDENT', 'job_posting', 'READ')
ON CONFLICT (role, resource, action) DO NOTHING;

-- TPO_Dept permissions
INSERT INTO auth.permissions (role, resource, action) VALUES
('ROLE_TPO_DEPT', 'student_profile', 'READ'),
('ROLE_TPO_DEPT', 'student_profile', 'VERIFY'),
('ROLE_TPO_DEPT', 'application', 'READ'),
('ROLE_TPO_DEPT', 'application', 'APPROVE'),
('ROLE_TPO_DEPT', 'event', 'CREATE'),
('ROLE_TPO_DEPT', 'event', 'UPDATE')
ON CONFLICT (role, resource, action) DO NOTHING;

-- TPO_Admin permissions
INSERT INTO auth.permissions (role, resource, action) VALUES
('ROLE_TPO_ADMIN', 'recruiter', 'VERIFY'),
('ROLE_TPO_ADMIN', 'job_posting', 'APPROVE'),
('ROLE_TPO_ADMIN', 'application', 'APPROVE'),
('ROLE_TPO_ADMIN', 'student_profile', 'READ'),
('ROLE_TPO_ADMIN', 'user', 'CREATE'),
('ROLE_TPO_ADMIN', 'user', 'UPDATE'),
('ROLE_TPO_ADMIN', 'audit_log', 'READ')
ON CONFLICT (role, resource, action) DO NOTHING;

-- Recruiter permissions
INSERT INTO auth.permissions (role, resource, action) VALUES
('ROLE_RECRUITER', 'job_posting', 'CREATE'),
('ROLE_RECRUITER', 'job_posting', 'UPDATE'),
('ROLE_RECRUITER', 'application', 'READ'),
('ROLE_RECRUITER', 'offer', 'CREATE'),
('ROLE_RECRUITER', 'offer', 'UPDATE')
ON CONFLICT (role, resource, action) DO NOTHING;

-- =====================================================
-- End of 01_auth.sql
-- =====================================================
