-- =====================================================
-- TPO Management System - Scheduling Schema
-- =====================================================
-- Description: Calendar events, slots, RSVP, and attendance
-- Version: 1.0
-- Last Updated: 2024-01-15
-- =====================================================

CREATE SCHEMA IF NOT EXISTS scheduling;

-- =====================================================
-- Table: scheduling.events
-- =====================================================
CREATE TABLE scheduling.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id VARCHAR(100) UNIQUE NOT NULL,
  event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('PPT', 'TEST', 'INTERVIEW', 'DEADLINE', 'MEETING', 'OTHER')),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Timing
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  timezone VARCHAR(50) DEFAULT 'Asia/Kolkata',
  
  -- Location
  location_type VARCHAR(50) CHECK (location_type IN ('PHYSICAL', 'VIRTUAL', 'HYBRID')),
  location_details TEXT,
  meeting_link TEXT,
  
  -- Organizer
  organized_by UUID NOT NULL REFERENCES auth.users(id),
  organization_id UUID REFERENCES recruiters.organizations(id),
  job_posting_id UUID REFERENCES recruiters.job_postings(id),
  
  -- Attendees
  attendee_type VARCHAR(50) CHECK (attendee_type IN ('ALL_STUDENTS', 'DEPARTMENT', 'YEAR', 'CUSTOM', 'SHORTLISTED')),
  attendee_filter JSONB DEFAULT '{}'::jsonb,
  
  -- RSVP
  rsvp_required BOOLEAN DEFAULT FALSE,
  rsvp_deadline TIMESTAMP,
  
  -- Status
  status VARCHAR(50) DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'ONGOING', 'COMPLETED', 'CANCELLED')),
  
  -- Attachments
  attachments JSONB DEFAULT '[]'::jsonb,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_events_start_time ON scheduling.events(start_time);
CREATE INDEX idx_events_organizer ON scheduling.events(organized_by);
CREATE INDEX idx_events_job_posting ON scheduling.events(job_posting_id);

-- =====================================================
-- Table: scheduling.rsvp
-- =====================================================
CREATE TABLE scheduling.rsvp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES scheduling.events(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students.profiles(id) ON DELETE CASCADE,
  response VARCHAR(50) NOT NULL CHECK (response IN ('ATTENDING', 'NOT_ATTENDING', 'TENTATIVE')),
  response_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  UNIQUE(event_id, student_id)
);

CREATE INDEX idx_rsvp_event ON scheduling.rsvp(event_id);
CREATE INDEX idx_rsvp_student ON scheduling.rsvp(student_id);

-- =====================================================
-- Table: scheduling.attendance
-- =====================================================
CREATE TABLE scheduling.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES scheduling.events(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students.profiles(id) ON DELETE CASCADE,
  attended BOOLEAN NOT NULL,
  marked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  marked_by UUID REFERENCES auth.users(id),
  notes TEXT,
  UNIQUE(event_id, student_id)
);

CREATE INDEX idx_attendance_event ON scheduling.attendance(event_id);
CREATE INDEX idx_attendance_student ON scheduling.attendance(student_id);

COMMENT ON SCHEMA scheduling IS 'Calendar events, RSVP, and attendance tracking';
