-- =====================================================
-- TPO Management System - Core Schema
-- File: 04_core.sql
-- Description: TPO administrators, department coordinators, tasks, reviews, and system configuration
-- =====================================================

-- Create schema
CREATE SCHEMA IF NOT EXISTS core;

-- =====================================================
-- Table: core.tpo_admins
-- Description: TPO administrator profiles
-- =====================================================
CREATE TABLE IF NOT EXISTS core.tpo_admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Personal Info
    admin_name VARCHAR(255) NOT NULL,
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    mobile_number VARCHAR(15) NOT NULL,
    designation VARCHAR(100),
    
    -- Permissions
    can_verify_recruiters BOOLEAN DEFAULT TRUE,
    can_approve_job_postings BOOLEAN DEFAULT TRUE,
    can_approve_applications BOOLEAN DEFAULT TRUE,
    can_manage_users BOOLEAN DEFAULT TRUE,
    can_configure_policies BOOLEAN DEFAULT TRUE,
    can_view_audit_logs BOOLEAN DEFAULT TRUE,
    can_export_data BOOLEAN DEFAULT TRUE,
    
    -- System Fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    deleted_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_tpo_admins_employee_id ON core.tpo_admins(employee_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_tpo_admins_active ON core.tpo_admins(is_active) WHERE is_active = TRUE;

-- Comments
COMMENT ON TABLE core.tpo_admins IS 'TPO administrator profiles with system-wide permissions';

-- =====================================================
-- Table: core.tpo_dept_coordinators
-- Description: Department-level TPO coordinators
-- =====================================================
CREATE TABLE IF NOT EXISTS core.tpo_dept_coordinators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Personal Info
    dept_coordinator_name VARCHAR(255) NOT NULL,
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    mobile_number VARCHAR(15) NOT NULL,
    designation VARCHAR(100),
    
    -- Department Assignment
    primary_department VARCHAR(50) NOT NULL CHECK (primary_department IN ('CSE', 'ECE', 'ME', 'CE', 'IT', 'EE', 'Others')),
    assigned_departments TEXT[] DEFAULT ARRAY[]::TEXT[], -- Multi-department support
    
    -- Permissions
    can_verify_profiles BOOLEAN DEFAULT TRUE,
    can_process_applications BOOLEAN DEFAULT TRUE,
    can_generate_reports BOOLEAN DEFAULT TRUE,
    can_create_events BOOLEAN DEFAULT TRUE,
    can_send_bulk_notifications BOOLEAN DEFAULT TRUE,
    
    -- Workflow Metrics (computed)
    active_student_count INTEGER DEFAULT 0,
    pending_verifications INTEGER DEFAULT 0,
    pending_applications INTEGER DEFAULT 0,
    
    -- Calendar & Reminder Settings
    calendar_preferences JSONB DEFAULT '{"timezone": "Asia/Kolkata", "default_view": "week", "notification_settings": {}}'::jsonb,
    reminder_templates JSONB DEFAULT '{}'::jsonb,
    verification_deadlines JSONB DEFAULT '{}'::jsonb,
    auto_reminder_enabled BOOLEAN DEFAULT TRUE,
    
    -- System Fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    deleted_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_tpo_dept_primary_department ON core.tpo_dept_coordinators(primary_department) WHERE deleted_at IS NULL;
CREATE INDEX idx_tpo_dept_active ON core.tpo_dept_coordinators(is_active) WHERE is_active = TRUE;

-- Comments
COMMENT ON TABLE core.tpo_dept_coordinators IS 'Department-level TPO coordinators with department-scoped permissions';

-- =====================================================
-- Table: core.tasks
-- Description: Task management for TPO staff
-- =====================================================
CREATE TABLE IF NOT EXISTS core.tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id VARCHAR(50) UNIQUE NOT NULL, -- e.g., "TASK-2024-001"
    
    -- Task Details
    title VARCHAR(255) NOT NULL,
    description TEXT,
    task_type VARCHAR(50) CHECK (task_type IN ('PROFILE_VERIFICATION', 'APPLICATION_REVIEW', 'JD_APPROVAL', 'EVENT_COORDINATION', 'REPORT_GENERATION', 'OTHER')),
    priority VARCHAR(50) DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
    
    -- Assignment
    assigned_to UUID REFERENCES auth.users(id),
    assigned_by UUID REFERENCES auth.users(id),
    assigned_at TIMESTAMP,
    
    -- Status
    status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE', 'CANCELLED')),
    
    -- Deadline
    due_date TIMESTAMP,
    
    -- Completion
    completed_at TIMESTAMP,
    completion_notes TEXT,
    
    -- Audit
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_tasks_assigned_to ON core.tasks(assigned_to) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_status ON core.tasks(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_due_date ON core.tasks(due_date) WHERE deleted_at IS NULL;

-- Comments
COMMENT ON TABLE core.tasks IS 'Task management for TPO administrators and coordinators';

-- =====================================================
-- Table: core.exam_correction_requests
-- Description: Requests for academic data corrections via Exam Cell
-- =====================================================
CREATE TABLE IF NOT EXISTS core.exam_correction_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id VARCHAR(50) UNIQUE NOT NULL, -- e.g., "ECR-2024-001"
    
    -- Student & Department Info
    student_id UUID NOT NULL, -- References students.profiles(id)
    department VARCHAR(50) NOT NULL,
    
    -- Issue Details
    issue_type VARCHAR(50) NOT NULL CHECK (issue_type IN ('CGPI_MISMATCH', 'BACKLOG_UPDATE', 'SEMESTER_MARKS_MISSING', 'OTHER')),
    description TEXT NOT NULL,
    requested_correction TEXT NOT NULL,
    
    -- Supporting Documents
    supporting_docs JSONB DEFAULT '[]'::jsonb, -- [{"file_name": "marksheet.pdf", "file_path": "s3://...", "uploaded_at": "..."}]
    
    -- Workflow
    status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'MORE_INFO_REQUIRED')),
    exam_cell_notes TEXT,
    resolution_notes TEXT,
    
    -- Actors
    created_by UUID NOT NULL REFERENCES auth.users(id), -- TPO_Dept coordinator
    reviewed_by UUID REFERENCES auth.users(id), -- Exam Cell staff
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP,
    resolved_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_exam_correction_student ON core.exam_correction_requests(student_id);
CREATE INDEX idx_exam_correction_status ON core.exam_correction_requests(status);
CREATE INDEX idx_exam_correction_department ON core.exam_correction_requests(department);

-- Comments
COMMENT ON TABLE core.exam_correction_requests IS 'Requests for academic data corrections via Exam Cell';

-- =====================================================
-- Table: core.communication_log
-- Description: Log of all communications sent
-- =====================================================
CREATE TABLE IF NOT EXISTS core.communication_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id VARCHAR(100) UNIQUE NOT NULL,
    
    -- Sender
    sender_id UUID NOT NULL REFERENCES auth.users(id),
    sender_role VARCHAR(50) NOT NULL,
    
    -- Recipients
    recipient_type VARCHAR(50) NOT NULL CHECK (recipient_type IN ('INDIVIDUAL', 'BULK_DEPARTMENT', 'BULK_YEAR', 'BULK_CUSTOM')),
    recipient_ids UUID[] DEFAULT ARRAY[]::UUID[],
    recipient_count INTEGER NOT NULL,
    
    -- Message Content
    subject VARCHAR(500) NOT NULL,
    body TEXT NOT NULL,
    message_type VARCHAR(50) NOT NULL CHECK (message_type IN ('EMAIL', 'SMS', 'PUSH', 'IN_APP')),
    
    -- Delivery
    delivery_status VARCHAR(50) DEFAULT 'QUEUED' CHECK (delivery_status IN ('QUEUED', 'SENDING', 'SENT', 'FAILED', 'PARTIALLY_SENT')),
    sent_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    delivered_count INTEGER DEFAULT 0,
    read_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMP,
    scheduled_for TIMESTAMP
);

-- Indexes
CREATE INDEX idx_communication_sender ON core.communication_log(sender_id);
CREATE INDEX idx_communication_status ON core.communication_log(delivery_status);
CREATE INDEX idx_communication_type ON core.communication_log(message_type);
CREATE INDEX idx_communication_created_at ON core.communication_log(created_at);

-- Comments
COMMENT ON TABLE core.communication_log IS 'Log of all communications sent through the system';

-- =====================================================
-- Table: core.report_exports
-- Description: Log of report generations and exports
-- =====================================================
CREATE TABLE IF NOT EXISTS core.report_exports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id VARCHAR(100) UNIQUE NOT NULL,
    
    -- Report Details
    report_type VARCHAR(50) NOT NULL CHECK (report_type IN ('PLACEMENT_SUMMARY', 'STUDENT_ELIGIBILITY', 'APPLICATION_STATUS', 'VERIFICATION_PENDING', 'OFFER_ACCEPTANCE', 'COMPLIANCE', 'ANALYTICS')),
    report_name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Filters
    filters JSONB DEFAULT '{}'::jsonb,
    
    -- Export Details
    export_format VARCHAR(50) NOT NULL CHECK (export_format IN ('PDF', 'EXCEL', 'CSV', 'JSON')),
    file_path TEXT,
    file_size INTEGER,
    
    -- Access Control
    generated_by UUID NOT NULL REFERENCES auth.users(id),
    access_level VARCHAR(50) CHECK (access_level IN ('PUBLIC', 'INTERNAL', 'CONFIDENTIAL')),
    purpose TEXT,
    
    -- Status
    status VARCHAR(50) DEFAULT 'GENERATING' CHECK (status IN ('GENERATING', 'COMPLETED', 'FAILED')),
    error_message TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    expires_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_report_exports_generated_by ON core.report_exports(generated_by);
CREATE INDEX idx_report_exports_type ON core.report_exports(report_type);
CREATE INDEX idx_report_exports_status ON core.report_exports(status);

-- Comments
COMMENT ON TABLE core.report_exports IS 'Log of all report generations and data exports';

-- =====================================================
-- Functions and Triggers
-- =====================================================

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION core.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update updated_at on tpo_admins
CREATE TRIGGER trigger_tpo_admins_updated_at
    BEFORE UPDATE ON core.tpo_admins
    FOR EACH ROW
    EXECUTE FUNCTION core.update_updated_at_column();

-- Trigger: Update updated_at on tpo_dept_coordinators
CREATE TRIGGER trigger_tpo_dept_coordinators_updated_at
    BEFORE UPDATE ON core.tpo_dept_coordinators
    FOR EACH ROW
    EXECUTE FUNCTION core.update_updated_at_column();

-- Trigger: Update updated_at on tasks
CREATE TRIGGER trigger_tasks_updated_at
    BEFORE UPDATE ON core.tasks
    FOR EACH ROW
    EXECUTE FUNCTION core.update_updated_at_column();

-- Trigger: Update updated_at on exam_correction_requests
CREATE TRIGGER trigger_exam_correction_requests_updated_at
    BEFORE UPDATE ON core.exam_correction_requests
    FOR EACH ROW
    EXECUTE FUNCTION core.update_updated_at_column();

-- Function: Auto-update task status to OVERDUE
CREATE OR REPLACE FUNCTION core.update_overdue_tasks()
RETURNS void AS $$
BEGIN
    UPDATE core.tasks
    SET status = 'OVERDUE'
    WHERE due_date < CURRENT_TIMESTAMP
      AND status IN ('PENDING', 'IN_PROGRESS')
      AND deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Row-Level Security (RLS) Policies
-- =====================================================

-- Enable RLS on tables
ALTER TABLE core.tpo_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.tpo_dept_coordinators ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.exam_correction_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.communication_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.report_exports ENABLE ROW LEVEL SECURITY;

-- Policy: TPO_Admin can view/edit their own profile
CREATE POLICY tpo_admin_own_profile ON core.tpo_admins
    FOR ALL
    USING (user_id = current_setting('app.current_user_id', true)::UUID)
    WITH CHECK (user_id = current_setting('app.current_user_id', true)::UUID);

-- Policy: TPO_Admin can view all admin profiles
CREATE POLICY tpo_admin_all_admins ON core.tpo_admins
    FOR SELECT
    USING (current_setting('app.current_user_role', true) = 'ROLE_TPO_ADMIN');

-- Policy: TPO_Dept can view/edit their own profile
CREATE POLICY tpo_dept_own_profile ON core.tpo_dept_coordinators
    FOR ALL
    USING (user_id = current_setting('app.current_user_id', true)::UUID)
    WITH CHECK (user_id = current_setting('app.current_user_id', true)::UUID);

-- Policy: TPO_Admin can view all dept coordinators
CREATE POLICY tpo_admin_all_dept_coordinators ON core.tpo_dept_coordinators
    FOR SELECT
    USING (current_setting('app.current_user_role', true) = 'ROLE_TPO_ADMIN');

-- Policy: Users can view tasks assigned to them
CREATE POLICY users_assigned_tasks ON core.tasks
    FOR SELECT
    USING (assigned_to = current_setting('app.current_user_id', true)::UUID);

-- Policy: TPO_Admin can view all tasks
CREATE POLICY tpo_admin_all_tasks ON core.tasks
    FOR ALL
    USING (current_setting('app.current_user_role', true) = 'ROLE_TPO_ADMIN');

-- Policy: TPO_Dept can view exam correction requests for their department
CREATE POLICY tpo_dept_own_exam_corrections ON core.exam_correction_requests
    FOR ALL
    USING (current_setting('app.current_user_role', true) = 'ROLE_TPO_DEPT');

-- Policy: TPO_Admin can view all exam correction requests
CREATE POLICY tpo_admin_all_exam_corrections ON core.exam_correction_requests
    FOR ALL
    USING (current_setting('app.current_user_role', true) = 'ROLE_TPO_ADMIN');

-- Policy: Users can view communications they sent
CREATE POLICY users_own_communications ON core.communication_log
    FOR SELECT
    USING (sender_id = current_setting('app.current_user_id', true)::UUID);

-- Policy: TPO_Admin can view all communications
CREATE POLICY tpo_admin_all_communications ON core.communication_log
    FOR SELECT
    USING (current_setting('app.current_user_role', true) = 'ROLE_TPO_ADMIN');

-- Policy: Users can view reports they generated
CREATE POLICY users_own_reports ON core.report_exports
    FOR SELECT
    USING (generated_by = current_setting('app.current_user_id', true)::UUID);

-- Policy: TPO_Admin can view all reports
CREATE POLICY tpo_admin_all_reports ON core.report_exports
    FOR SELECT
    USING (current_setting('app.current_user_role', true) = 'ROLE_TPO_ADMIN');

-- =====================================================
-- End of 04_core.sql
-- =====================================================
