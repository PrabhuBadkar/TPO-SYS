-- =====================================================
-- TPO Management System - Notifications Schema
-- File: 06_notifications.sql
-- Description: Notification queue and templates
-- =====================================================

-- Create schema
CREATE SCHEMA IF NOT EXISTS notifications;

-- =====================================================
-- Table: notifications.outbox
-- Description: Notification queue for email, SMS, and push notifications
-- =====================================================
CREATE TABLE IF NOT EXISTS notifications.outbox (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    notification_id VARCHAR(100) UNIQUE NOT NULL,
    
    -- Recipient
    recipient_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    recipient_email VARCHAR(255),
    recipient_mobile VARCHAR(15),
    recipient_device_token TEXT, -- For push notifications
    
    -- Notification Details
    notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN (
        'PROFILE_VERIFIED',
        'PROFILE_REJECTED',
        'APPLICATION_SUBMITTED',
        'APPLICATION_APPROVED',
        'APPLICATION_REJECTED',
        'JOB_POSTED',
        'JOB_APPROVED',
        'OFFER_EXTENDED',
        'OFFER_ACCEPTED',
        'EVENT_REMINDER',
        'DEADLINE_REMINDER',
        'DOCUMENT_REQUEST',
        'SYSTEM_ANNOUNCEMENT',
        'OTHER'
    )),
    
    -- Channel
    channel VARCHAR(50) NOT NULL CHECK (channel IN ('EMAIL', 'SMS', 'PUSH', 'IN_APP')),
    
    -- Content
    subject VARCHAR(500),
    body TEXT NOT NULL,
    html_body TEXT, -- For email
    
    -- Template
    template_id UUID, -- References notifications.templates(id)
    template_data JSONB, -- Variables for template rendering
    
    -- Priority
    priority VARCHAR(50) DEFAULT 'NORMAL' CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT')),
    
    -- Delivery
    status VARCHAR(50) DEFAULT 'QUEUED' CHECK (status IN ('QUEUED', 'SENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED', 'CANCELLED')),
    delivery_attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    last_attempt_at TIMESTAMP,
    error_message TEXT,
    
    -- Tracking
    sent_at TIMESTAMP,
    delivered_at TIMESTAMP,
    read_at TIMESTAMP,
    clicked_at TIMESTAMP,
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb, -- Additional tracking data
    
    -- Scheduling
    scheduled_for TIMESTAMP,
    
    -- Audit
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_notifications_recipient ON notifications.outbox(recipient_id);
CREATE INDEX idx_notifications_status ON notifications.outbox(status);
CREATE INDEX idx_notifications_channel ON notifications.outbox(channel);
CREATE INDEX idx_notifications_scheduled_for ON notifications.outbox(scheduled_for) WHERE status = 'QUEUED';
CREATE INDEX idx_notifications_created_at ON notifications.outbox(created_at);
CREATE INDEX idx_notifications_type ON notifications.outbox(notification_type);

-- Comments
COMMENT ON TABLE notifications.outbox IS 'Notification queue for email, SMS, push, and in-app notifications';
COMMENT ON COLUMN notifications.outbox.delivery_attempts IS 'Number of delivery attempts made';
COMMENT ON COLUMN notifications.outbox.scheduled_for IS 'When to send the notification (NULL for immediate)';

-- =====================================================
-- Table: notifications.templates
-- Description: Notification templates with versioning
-- =====================================================
CREATE TABLE IF NOT EXISTS notifications.templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id VARCHAR(100) UNIQUE NOT NULL, -- e.g., "PROFILE_VERIFIED_EMAIL"
    
    -- Template Details
    template_name VARCHAR(255) NOT NULL,
    description TEXT,
    template_type VARCHAR(50) NOT NULL CHECK (template_type IN (
        'PROFILE_VERIFICATION',
        'APPLICATION_STATUS',
        'JOB_NOTIFICATION',
        'OFFER_NOTIFICATION',
        'EVENT_REMINDER',
        'DEADLINE_REMINDER',
        'SYSTEM_ANNOUNCEMENT',
        'OTHER'
    )),
    
    -- Channel
    channel VARCHAR(50) NOT NULL CHECK (channel IN ('EMAIL', 'SMS', 'PUSH', 'IN_APP')),
    
    -- Content
    subject_template VARCHAR(500), -- For email
    body_template TEXT NOT NULL,
    html_template TEXT, -- For email
    
    -- Variables
    variables JSONB DEFAULT '[]'::jsonb, -- ["student_name", "company_name", "deadline"]
    
    -- Versioning
    version INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Audit
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    archived_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_templates_template_id ON notifications.templates(template_id);
CREATE INDEX idx_templates_type ON notifications.templates(template_type);
CREATE INDEX idx_templates_channel ON notifications.templates(channel);
CREATE INDEX idx_templates_active ON notifications.templates(is_active) WHERE is_active = TRUE;

-- Comments
COMMENT ON TABLE notifications.templates IS 'Notification templates with versioning support';
COMMENT ON COLUMN notifications.templates.variables IS 'JSON array of variable names used in template';
COMMENT ON COLUMN notifications.templates.version IS 'Template version number for tracking changes';

-- =====================================================
-- Functions and Triggers
-- =====================================================

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION notifications.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update updated_at on outbox
CREATE TRIGGER trigger_outbox_updated_at
    BEFORE UPDATE ON notifications.outbox
    FOR EACH ROW
    EXECUTE FUNCTION notifications.update_updated_at_column();

-- Trigger: Update updated_at on templates
CREATE TRIGGER trigger_templates_updated_at
    BEFORE UPDATE ON notifications.templates
    FOR EACH ROW
    EXECUTE FUNCTION notifications.update_updated_at_column();

-- Function: Increment delivery attempts
CREATE OR REPLACE FUNCTION notifications.increment_delivery_attempts()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'SENDING' AND OLD.status != 'SENDING' THEN
        NEW.delivery_attempts = OLD.delivery_attempts + 1;
        NEW.last_attempt_at = CURRENT_TIMESTAMP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Increment delivery attempts
CREATE TRIGGER trigger_increment_delivery_attempts
    BEFORE UPDATE ON notifications.outbox
    FOR EACH ROW
    EXECUTE FUNCTION notifications.increment_delivery_attempts();

-- Function: Mark as failed after max attempts
CREATE OR REPLACE FUNCTION notifications.check_max_attempts()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.delivery_attempts >= NEW.max_attempts AND NEW.status != 'SENT' THEN
        NEW.status = 'FAILED';
        NEW.error_message = COALESCE(NEW.error_message, 'Maximum delivery attempts exceeded');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Check max attempts
CREATE TRIGGER trigger_check_max_attempts
    BEFORE UPDATE ON notifications.outbox
    FOR EACH ROW
    EXECUTE FUNCTION notifications.check_max_attempts();

-- Function: Archive old templates on version update
CREATE OR REPLACE FUNCTION notifications.archive_old_template_version()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.version > 1 THEN
        UPDATE notifications.templates
        SET is_active = FALSE,
            archived_at = CURRENT_TIMESTAMP
        WHERE template_id = NEW.template_id
          AND version < NEW.version
          AND is_active = TRUE;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Archive old template versions
CREATE TRIGGER trigger_archive_old_template_version
    AFTER INSERT ON notifications.templates
    FOR EACH ROW
    EXECUTE FUNCTION notifications.archive_old_template_version();

-- Function: Render template with variables
CREATE OR REPLACE FUNCTION notifications.render_template(
    template_body TEXT,
    template_vars JSONB
)
RETURNS TEXT AS $$
DECLARE
    rendered_body TEXT;
    var_key TEXT;
    var_value TEXT;
BEGIN
    rendered_body := template_body;
    
    FOR var_key, var_value IN SELECT * FROM jsonb_each_text(template_vars)
    LOOP
        rendered_body := replace(rendered_body, '{{' || var_key || '}}', var_value);
    END LOOP;
    
    RETURN rendered_body;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Row-Level Security (RLS) Policies
-- =====================================================

-- Enable RLS on tables
ALTER TABLE notifications.outbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications.templates ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own notifications
CREATE POLICY users_own_notifications ON notifications.outbox
    FOR SELECT
    USING (recipient_id = current_setting('app.current_user_id', true)::UUID);

-- Policy: TPO staff can view all notifications
CREATE POLICY tpo_staff_all_notifications ON notifications.outbox
    FOR SELECT
    USING (
        current_setting('app.current_user_role', true) IN ('ROLE_TPO_ADMIN', 'ROLE_TPO_DEPT')
    );

-- Policy: TPO_Admin can manage templates
CREATE POLICY tpo_admin_manage_templates ON notifications.templates
    FOR ALL
    USING (current_setting('app.current_user_role', true) = 'ROLE_TPO_ADMIN');

-- Policy: All users can view active templates
CREATE POLICY all_users_view_active_templates ON notifications.templates
    FOR SELECT
    USING (is_active = TRUE);

-- =====================================================
-- Initial Data (Sample Templates)
-- =====================================================

-- Email template: Profile Verified
INSERT INTO notifications.templates (template_id, template_name, description, template_type, channel, subject_template, body_template, variables) VALUES
('PROFILE_VERIFIED_EMAIL', 'Profile Verified - Email', 'Email sent when student profile is verified', 'PROFILE_VERIFICATION', 'EMAIL', 
'Profile Verified - {{department}} TPO', 
'Dear {{student_name}},

Your profile has been verified by {{dept_coordinator_name}} from {{department}} department.

You are now eligible to apply for placement drives.

Next steps:
1. Upload your resume
2. Browse available job postings
3. Apply to companies that match your profile

Best regards,
TPO Team',
'["student_name", "dept_coordinator_name", "department"]'::jsonb)
ON CONFLICT (template_id) DO NOTHING;

-- SMS template: Application Approved
INSERT INTO notifications.templates (template_id, template_name, description, template_type, channel, body_template, variables) VALUES
('APPLICATION_APPROVED_SMS', 'Application Approved - SMS', 'SMS sent when application is approved', 'APPLICATION_STATUS', 'SMS',
'Your application for {{job_title}} at {{company_name}} has been approved. Check your email for details.',
'["job_title", "company_name"]'::jsonb)
ON CONFLICT (template_id) DO NOTHING;

-- Push template: Event Reminder
INSERT INTO notifications.templates (template_id, template_name, description, template_type, channel, subject_template, body_template, variables) VALUES
('EVENT_REMINDER_PUSH', 'Event Reminder - Push', 'Push notification for event reminder', 'EVENT_REMINDER', 'PUSH',
'Reminder: {{event_title}}',
'{{event_title}} is scheduled for {{event_date}} at {{event_time}}. Location: {{event_location}}',
'["event_title", "event_date", "event_time", "event_location"]'::jsonb)
ON CONFLICT (template_id) DO NOTHING;

-- Email template: Offer Extended
INSERT INTO notifications.templates (template_id, template_name, description, template_type, channel, subject_template, body_template, variables) VALUES
('OFFER_EXTENDED_EMAIL', 'Offer Extended - Email', 'Email sent when job offer is extended', 'OFFER_NOTIFICATION', 'EMAIL',
'Congratulations! Job Offer from {{company_name}}',
'Dear {{student_name}},

Congratulations! You have received a job offer from {{company_name}} for the position of {{job_title}}.

Offer Details:
- Position: {{job_title}}
- CTC: ₹{{ctc_offered}}
- Joining Date: {{joining_date}}
- Location: {{joining_location}}

Please review the offer letter and respond by {{acceptance_deadline}}.

To accept or reject the offer, please log in to your account.

Best regards,
TPO Team',
'["student_name", "company_name", "job_title", "ctc_offered", "joining_date", "joining_location", "acceptance_deadline"]'::jsonb)
ON CONFLICT (template_id) DO NOTHING;

-- Email template: Deadline Reminder
INSERT INTO notifications.templates (template_id, template_name, description, template_type, channel, subject_template, body_template, variables) VALUES
('DEADLINE_REMINDER_EMAIL', 'Deadline Reminder - Email', 'Email reminder for approaching deadlines', 'DEADLINE_REMINDER', 'EMAIL',
'Reminder: {{deadline_type}} - {{hours_remaining}} hours left',
'Dear {{student_name}},

This is a reminder that the deadline for {{deadline_type}} is approaching.

Deadline: {{deadline_date}}
Time Remaining: {{hours_remaining}} hours

{{action_required}}

Please complete the required action before the deadline.

Best regards,
TPO Team',
'["student_name", "deadline_type", "deadline_date", "hours_remaining", "action_required"]'::jsonb)
ON CONFLICT (template_id) DO NOTHING;

-- =====================================================
-- End of 06_notifications.sql
-- =====================================================
