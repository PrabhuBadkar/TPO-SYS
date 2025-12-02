-- =====================================================
-- TPO Management System - Scheduling Schema
-- File: 05_scheduling.sql
-- Description: Events, calendar, RSVP, and attendance tracking
-- =====================================================

-- Create schema
CREATE SCHEMA IF NOT EXISTS scheduling;

-- =====================================================
-- Table: scheduling.events
-- Description: Calendar events for placement activities
-- =====================================================
CREATE TABLE IF NOT EXISTS scheduling.events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id VARCHAR(50) UNIQUE NOT NULL, -- e.g., "EVT-2024-001"
    
    -- Event Details
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN (
        'PRE_PLACEMENT_TALK',
        'APTITUDE_TEST',
        'TECHNICAL_TEST',
        'CODING_TEST',
        'GROUP_DISCUSSION',
        'INTERVIEW',
        'HR_ROUND',
        'DEPARTMENT_MEETING',
        'VERIFICATION_DEADLINE',
        'APPLICATION_DEADLINE',
        'OTHER'
    )),
    
    -- Timing
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    timezone VARCHAR(50) DEFAULT 'Asia/Kolkata',
    all_day BOOLEAN DEFAULT FALSE,
    
    -- Location
    location_type VARCHAR(50) CHECK (location_type IN ('PHYSICAL', 'VIRTUAL', 'HYBRID')),
    location_details TEXT, -- Room number or meeting link
    
    -- Association
    job_posting_id UUID, -- References recruiters.job_postings(id)
    organization_id UUID, -- References recruiters.organizations(id)
    department VARCHAR(50) CHECK (department IN ('CSE', 'ECE', 'ME', 'CE', 'IT', 'EE', 'Others', 'ALL')),
    
    -- Attendees
    attendee_type VARCHAR(50) CHECK (attendee_type IN ('ALL_STUDENTS', 'DEPARTMENT', 'SPECIFIC_STUDENTS', 'TPO_STAFF', 'RECRUITERS')),
    attendee_ids UUID[] DEFAULT ARRAY[]::UUID[], -- Specific student/staff IDs
    
    -- RSVP
    rsvp_required BOOLEAN DEFAULT FALSE,
    rsvp_deadline TIMESTAMP,
    
    -- Attachments
    attachments JSONB DEFAULT '[]'::jsonb, -- [{"file_name": "jd.pdf", "file_path": "s3://...", "file_size": 1024}]
    
    -- Organizer
    created_by UUID NOT NULL REFERENCES auth.users(id),
    organizer_name VARCHAR(255),
    organizer_email VARCHAR(255),
    
    -- Status
    status VARCHAR(50) DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'ONGOING', 'COMPLETED', 'CANCELLED', 'RESCHEDULED')),
    cancellation_reason TEXT,
    
    -- Visibility
    visibility VARCHAR(50) DEFAULT 'PUBLIC' CHECK (visibility IN ('PUBLIC', 'DEPARTMENT', 'PRIVATE')),
    
    -- Reminders
    reminder_settings JSONB DEFAULT '{"reminders": [{"time": "72h", "channels": ["email"]}, {"time": "24h", "channels": ["email", "sms"]}, {"time": "2h", "channels": ["push"]}]}'::jsonb,
    
    -- Audit
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_events_start_time ON scheduling.events(start_time) WHERE deleted_at IS NULL;
CREATE INDEX idx_events_event_type ON scheduling.events(event_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_events_job_posting ON scheduling.events(job_posting_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_events_department ON scheduling.events(department) WHERE deleted_at IS NULL;
CREATE INDEX idx_events_status ON scheduling.events(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_events_created_by ON scheduling.events(created_by) WHERE deleted_at IS NULL;

-- Comments
COMMENT ON TABLE scheduling.events IS 'Calendar events for placement activities, interviews, tests, and deadlines';
COMMENT ON COLUMN scheduling.events.attendee_type IS 'Type of attendees: ALL_STUDENTS, DEPARTMENT, SPECIFIC_STUDENTS, TPO_STAFF, RECRUITERS';
COMMENT ON COLUMN scheduling.events.reminder_settings IS 'JSON configuration for automated reminders';

-- =====================================================
-- Table: scheduling.rsvp
-- Description: RSVP responses for events
-- =====================================================
CREATE TABLE IF NOT EXISTS scheduling.rsvp (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES scheduling.events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Response
    response VARCHAR(50) NOT NULL CHECK (response IN ('ATTENDING', 'NOT_ATTENDING', 'TENTATIVE')),
    response_notes TEXT,
    
    -- Timestamps
    responded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(event_id, user_id)
);

-- Indexes
CREATE INDEX idx_rsvp_event ON scheduling.rsvp(event_id);
CREATE INDEX idx_rsvp_user ON scheduling.rsvp(user_id);
CREATE INDEX idx_rsvp_response ON scheduling.rsvp(response);

-- Comments
COMMENT ON TABLE scheduling.rsvp IS 'RSVP responses for calendar events';

-- =====================================================
-- Table: scheduling.attendance
-- Description: Attendance tracking for events
-- =====================================================
CREATE TABLE IF NOT EXISTS scheduling.attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES scheduling.events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Attendance Status
    status VARCHAR(50) NOT NULL CHECK (status IN ('PRESENT', 'ABSENT', 'LATE', 'EXCUSED')),
    
    -- Check-in Details
    checked_in_at TIMESTAMP,
    checked_in_by UUID REFERENCES auth.users(id), -- Who marked attendance
    check_in_method VARCHAR(50) CHECK (check_in_method IN ('MANUAL', 'QR_CODE', 'GEOFENCE', 'SELF_CHECKIN')),
    
    -- Location Verification
    check_in_location JSONB, -- {"latitude": 12.34, "longitude": 56.78, "accuracy": 10}
    
    -- Notes
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(event_id, user_id)
);

-- Indexes
CREATE INDEX idx_attendance_event ON scheduling.attendance(event_id);
CREATE INDEX idx_attendance_user ON scheduling.attendance(user_id);
CREATE INDEX idx_attendance_status ON scheduling.attendance(status);

-- Comments
COMMENT ON TABLE scheduling.attendance IS 'Attendance tracking for events with check-in details';
COMMENT ON COLUMN scheduling.attendance.check_in_method IS 'Method used for check-in: MANUAL, QR_CODE, GEOFENCE, SELF_CHECKIN';

-- =====================================================
-- Functions and Triggers
-- =====================================================

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION scheduling.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update updated_at on events
CREATE TRIGGER trigger_events_updated_at
    BEFORE UPDATE ON scheduling.events
    FOR EACH ROW
    EXECUTE FUNCTION scheduling.update_updated_at_column();

-- Trigger: Update updated_at on rsvp
CREATE TRIGGER trigger_rsvp_updated_at
    BEFORE UPDATE ON scheduling.rsvp
    FOR EACH ROW
    EXECUTE FUNCTION scheduling.update_updated_at_column();

-- Trigger: Update updated_at on attendance
CREATE TRIGGER trigger_attendance_updated_at
    BEFORE UPDATE ON scheduling.attendance
    FOR EACH ROW
    EXECUTE FUNCTION scheduling.update_updated_at_column();

-- Function: Validate event timing
CREATE OR REPLACE FUNCTION scheduling.validate_event_timing()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.end_time <= NEW.start_time THEN
        RAISE EXCEPTION 'Event end time must be after start time';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Validate event timing
CREATE TRIGGER trigger_validate_event_timing
    BEFORE INSERT OR UPDATE ON scheduling.events
    FOR EACH ROW
    EXECUTE FUNCTION scheduling.validate_event_timing();

-- Function: Auto-create RSVP entries for required events
CREATE OR REPLACE FUNCTION scheduling.create_rsvp_entries()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.rsvp_required = TRUE AND NEW.attendee_ids IS NOT NULL THEN
        INSERT INTO scheduling.rsvp (event_id, user_id, response)
        SELECT NEW.id, unnest(NEW.attendee_ids), 'TENTATIVE'
        ON CONFLICT (event_id, user_id) DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-create RSVP entries
CREATE TRIGGER trigger_create_rsvp_entries
    AFTER INSERT ON scheduling.events
    FOR EACH ROW
    EXECUTE FUNCTION scheduling.create_rsvp_entries();

-- Function: Track no-show count for students
CREATE OR REPLACE FUNCTION scheduling.track_no_shows()
RETURNS TRIGGER AS $$
DECLARE
    no_show_count INTEGER;
BEGIN
    IF NEW.status = 'ABSENT' AND OLD.status != 'ABSENT' THEN
        -- Count total no-shows for this user
        SELECT COUNT(*) INTO no_show_count
        FROM scheduling.attendance
        WHERE user_id = NEW.user_id
          AND status = 'ABSENT';
        
        -- Log warning at 3 no-shows
        IF no_show_count = 3 THEN
            -- Insert notification or log entry
            RAISE NOTICE 'User % has 3 no-shows - warning threshold reached', NEW.user_id;
        END IF;
        
        -- Log suspension threshold at 5 no-shows
        IF no_show_count = 5 THEN
            RAISE NOTICE 'User % has 5 no-shows - suspension threshold reached', NEW.user_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Track no-shows
CREATE TRIGGER trigger_track_no_shows
    AFTER INSERT OR UPDATE ON scheduling.attendance
    FOR EACH ROW
    EXECUTE FUNCTION scheduling.track_no_shows();

-- =====================================================
-- Row-Level Security (RLS) Policies
-- =====================================================

-- Enable RLS on tables
ALTER TABLE scheduling.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduling.rsvp ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduling.attendance ENABLE ROW LEVEL SECURITY;

-- Policy: Students can view events they're invited to or public events
CREATE POLICY students_view_events ON scheduling.events
    FOR SELECT
    USING (
        visibility = 'PUBLIC'
        OR current_setting('app.current_user_id', true)::UUID = ANY(attendee_ids)
        OR (visibility = 'DEPARTMENT' AND department IN (
            SELECT department FROM students.profiles 
            WHERE user_id = current_setting('app.current_user_id', true)::UUID
        ))
    );

-- Policy: TPO_Dept can view/edit department events
CREATE POLICY tpo_dept_department_events ON scheduling.events
    FOR ALL
    USING (current_setting('app.current_user_role', true) = 'ROLE_TPO_DEPT');

-- Policy: TPO_Admin can view/edit all events
CREATE POLICY tpo_admin_all_events ON scheduling.events
    FOR ALL
    USING (current_setting('app.current_user_role', true) = 'ROLE_TPO_ADMIN');

-- Policy: Recruiters can view events for their job postings
CREATE POLICY recruiters_own_events ON scheduling.events
    FOR SELECT
    USING (
        job_posting_id IN (
            SELECT id FROM recruiters.job_postings 
            WHERE organization_id IN (
                SELECT organization_id FROM recruiters.pocs 
                WHERE user_id = current_setting('app.current_user_id', true)::UUID
            )
        )
    );

-- Policy: Users can view/update their own RSVP
CREATE POLICY users_own_rsvp ON scheduling.rsvp
    FOR ALL
    USING (user_id = current_setting('app.current_user_id', true)::UUID)
    WITH CHECK (user_id = current_setting('app.current_user_id', true)::UUID);

-- Policy: TPO staff can view all RSVPs
CREATE POLICY tpo_staff_all_rsvp ON scheduling.rsvp
    FOR SELECT
    USING (
        current_setting('app.current_user_role', true) IN ('ROLE_TPO_ADMIN', 'ROLE_TPO_DEPT')
    );

-- Policy: Users can view their own attendance
CREATE POLICY users_own_attendance ON scheduling.attendance
    FOR SELECT
    USING (user_id = current_setting('app.current_user_id', true)::UUID);

-- Policy: TPO staff can manage all attendance
CREATE POLICY tpo_staff_all_attendance ON scheduling.attendance
    FOR ALL
    USING (
        current_setting('app.current_user_role', true) IN ('ROLE_TPO_ADMIN', 'ROLE_TPO_DEPT')
    );

-- =====================================================
-- End of 05_scheduling.sql
-- =====================================================
