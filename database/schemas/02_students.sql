-- =====================================================
-- TPO Management System - Students Schema
-- =====================================================
-- Description: Student profiles, academic data, resumes, consents, and eligibility
-- Version: 1.0
-- Last Updated: 2024-01-15
-- =====================================================

-- Create students schema
CREATE SCHEMA IF NOT EXISTS students;

-- =====================================================
-- Table: students.profiles
-- Description: Complete student profile with personal, academic, and career information
-- =====================================================
CREATE TABLE students.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Personal Information (15% completion)
  first_name VARCHAR(100) NOT NULL,
  middle_name VARCHAR(100), -- Father's name
  last_name VARCHAR(100) NOT NULL,
  mother_name VARCHAR(100),
  date_of_birth DATE NOT NULL CHECK (date_of_birth <= CURRENT_DATE - INTERVAL '16 years'),
  gender VARCHAR(50) NOT NULL CHECK (gender IN ('Male', 'Female', 'Other', 'Prefer not to say')),
  mobile_number VARCHAR(15) NOT NULL,
  alternate_mobile VARCHAR(15),
  personal_email VARCHAR(255) NOT NULL,
  address_permanent TEXT NOT NULL,
  address_current TEXT,
  photo_url TEXT,
  college_name VARCHAR(100) DEFAULT 'ACER',
  category VARCHAR(50) CHECK (category IN ('General', 'OBC', 'SC', 'ST', 'Other')),
  
  -- Academic Information (20% completion)
  enrollment_number VARCHAR(50) UNIQUE NOT NULL,
  roll_number VARCHAR(50) UNIQUE,
  department VARCHAR(50) NOT NULL CHECK (department IN ('CSE', 'ECE', 'ME', 'CE', 'IT', 'EE', 'Others')),
  degree VARCHAR(50) NOT NULL CHECK (degree IN ('B.Tech', 'M.Tech', 'MCA', 'MBA', 'Diploma')),
  year_of_admission INTEGER NOT NULL CHECK (year_of_admission >= 2000 AND year_of_admission <= EXTRACT(YEAR FROM CURRENT_DATE)),
  current_semester INTEGER NOT NULL CHECK (current_semester >= 1 AND current_semester <= 12),
  expected_graduation_year INTEGER NOT NULL,
  cgpi DECIMAL(4,2) CHECK (cgpi >= 0 AND cgpi <= 10),
  active_backlogs BOOLEAN DEFAULT FALSE,
  backlog_history JSONB DEFAULT '{"backlogs": [], "active_backlog_count": 0, "total_backlogs_ever": 0}'::jsonb,
  
  -- Documents (25% completion)
  ssc_year_of_passing INTEGER CHECK (ssc_year_of_passing >= 1990),
  ssc_board VARCHAR(100),
  ssc_percentage DECIMAL(5,2) CHECK (ssc_percentage >= 0 AND ssc_percentage <= 100),
  ssc_marksheet_url TEXT,
  hsc_year_of_passing INTEGER,
  hsc_board VARCHAR(100),
  hsc_percentage DECIMAL(5,2) CHECK (hsc_percentage >= 0 AND hsc_percentage <= 100),
  hsc_marksheet_url TEXT,
  diploma_percentage DECIMAL(5,2) CHECK (diploma_percentage >= 0 AND diploma_percentage <= 100),
  diploma_year_of_passing INTEGER,
  diploma_marksheet_url TEXT,
  is_direct_second_year BOOLEAN DEFAULT FALSE,
  
  -- Career Preferences (20% completion)
  skills JSONB DEFAULT '{"skills": []}'::jsonb,
  projects JSONB DEFAULT '[]'::jsonb,
  certifications JSONB DEFAULT '[]'::jsonb,
  internships JSONB DEFAULT '[]'::jsonb,
  competitive_profiles JSONB DEFAULT '{}'::jsonb,
  preferred_job_roles TEXT[] DEFAULT ARRAY[]::TEXT[],
  preferred_employment_type VARCHAR(50) CHECK (preferred_employment_type IN ('Full-Time', 'Internship', 'Part-Time', 'Contract')),
  preferred_locations TEXT[] DEFAULT ARRAY[]::TEXT[],
  expected_ctc_min INTEGER,
  expected_ctc_max INTEGER,
  
  -- TPO Workflow
  tpo_dept_assigned UUID REFERENCES auth.users(id),
  tpo_dept_verified BOOLEAN DEFAULT FALSE,
  tpo_dept_verified_at TIMESTAMP,
  tpo_dept_verified_by UUID REFERENCES auth.users(id),
  tpo_admin_verified BOOLEAN DEFAULT FALSE,
  tpo_admin_verified_at TIMESTAMP,
  tpo_admin_verified_by UUID REFERENCES auth.users(id),
  dept_review_notes JSONB DEFAULT '[]'::jsonb,
  academic_data_flagged BOOLEAN DEFAULT FALSE,
  academic_flag_notes JSONB DEFAULT '[]'::jsonb,
  data_sharing_consent BOOLEAN DEFAULT FALSE,
  profile_complete_percent INTEGER DEFAULT 0 CHECK (profile_complete_percent >= 0 AND profile_complete_percent <= 100),
  profile_status VARCHAR(50) DEFAULT 'DRAFT' CHECK (profile_status IN ('DRAFT', 'PENDING_VERIFICATION', 'VERIFIED', 'REJECTED')),
  
  -- Calendar & Notifications
  calendar_preferences JSONB DEFAULT '{"timezone": "Asia/Kolkata", "default_view": "week", "notification_settings": {}}'::jsonb,
  google_calendar_sync BOOLEAN DEFAULT FALSE,
  outlook_calendar_sync BOOLEAN DEFAULT FALSE,
  calendar_token TEXT, -- Encrypted OAuth tokens
  notification_preferences JSONB DEFAULT '{"email": true, "sms": true, "push": true, "dnd_windows": []}'::jsonb,
  
  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Indexes for students.profiles
CREATE INDEX idx_students_profiles_enrollment ON students.profiles(enrollment_number);
CREATE INDEX idx_students_profiles_department ON students.profiles(department);
CREATE INDEX idx_students_profiles_graduation_year ON students.profiles(expected_graduation_year);
CREATE INDEX idx_students_profiles_verified ON students.profiles(tpo_dept_verified, tpo_admin_verified);
CREATE INDEX idx_students_profiles_user_id ON students.profiles(user_id);

-- RLS Policies for students.profiles
ALTER TABLE students.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY students_own_profile ON students.profiles 
  FOR ALL 
  USING (user_id = auth.uid()) 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY tpo_dept_department_profiles ON students.profiles 
  FOR ALL 
  USING (
    auth.jwt() ->> 'role' = 'ROLE_TPO_DEPT' 
    AND department = (SELECT department FROM auth.users WHERE id = auth.uid())
  );

CREATE POLICY tpo_admin_all_profiles ON students.profiles 
  FOR SELECT 
  USING (auth.jwt() ->> 'role' = 'ROLE_TPO_ADMIN');

-- =====================================================
-- Table: students.semester_marks
-- Description: Semester-wise academic marks and SPI
-- =====================================================
CREATE TABLE students.semester_marks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students.profiles(id) ON DELETE CASCADE,
  semester INTEGER NOT NULL CHECK (semester >= 1 AND semester <= 12),
  academic_year VARCHAR(20) NOT NULL,
  subjects JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_credits INTEGER NOT NULL,
  earned_credits INTEGER NOT NULL,
  spi DECIMAL(4,2) NOT NULL CHECK (spi >= 0 AND spi <= 10),
  has_backlogs BOOLEAN DEFAULT FALSE,
  backlog_subjects TEXT[] DEFAULT ARRAY[]::TEXT[],
  is_editable BOOLEAN DEFAULT TRUE,
  edit_count INTEGER DEFAULT 0,
  last_edited_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(student_id, semester, academic_year)
);

CREATE INDEX idx_semester_marks_student ON students.semester_marks(student_id);

-- Trigger: Update CGPI in students.profiles
CREATE OR REPLACE FUNCTION update_student_cgpi() 
RETURNS TRIGGER AS $$
DECLARE 
  new_cgpi DECIMAL(4,2); 
  total_credits_sum INTEGER; 
  weighted_spi_sum DECIMAL(10,2);
BEGIN
  SELECT 
    COALESCE(SUM(spi * total_credits), 0), 
    COALESCE(SUM(total_credits), 0) 
  INTO weighted_spi_sum, total_credits_sum 
  FROM students.semester_marks 
  WHERE student_id = NEW.student_id;
  
  IF total_credits_sum > 0 THEN 
    new_cgpi := weighted_spi_sum / total_credits_sum; 
  ELSE 
    new_cgpi := NULL; 
  END IF;
  
  UPDATE students.profiles 
  SET cgpi = new_cgpi, updated_at = CURRENT_TIMESTAMP 
  WHERE id = NEW.student_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_cgpi_on_semester_marks 
  AFTER INSERT OR UPDATE ON students.semester_marks 
  FOR EACH ROW 
  EXECUTE FUNCTION update_student_cgpi();

-- =====================================================
-- Table: students.resumes
-- Description: Resume versions with watermarking and parsing
-- =====================================================
CREATE TABLE students.resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students.profiles(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_hash VARCHAR(64) NOT NULL,
  parsed_data JSONB DEFAULT '{}'::jsonb,
  parser_confidence_score DECIMAL(3,2),
  parsing_status VARCHAR(50) CHECK (parsing_status IN ('PENDING', 'SUCCESS', 'FAILED', 'SKIPPED')),
  is_primary BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  watermark_applied BOOLEAN DEFAULT FALSE,
  watermark_text TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(student_id, version)
);

CREATE INDEX idx_resumes_student ON students.resumes(student_id);
CREATE INDEX idx_resumes_primary ON students.resumes(student_id, is_primary) WHERE is_primary = TRUE;

-- Trigger: Ensure only one primary resume
CREATE OR REPLACE FUNCTION ensure_single_primary_resume() 
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_primary = TRUE THEN 
    UPDATE students.resumes 
    SET is_primary = FALSE 
    WHERE student_id = NEW.student_id AND id != NEW.id; 
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_primary_resume_uniqueness 
  BEFORE INSERT OR UPDATE ON students.resumes 
  FOR EACH ROW 
  EXECUTE FUNCTION ensure_single_primary_resume();

-- =====================================================
-- Table: students.consents
-- Description: Data sharing consents with recruiters
-- =====================================================
CREATE TABLE students.consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students.profiles(id) ON DELETE CASCADE,
  job_posting_id UUID,
  recruiter_id UUID REFERENCES auth.users(id),
  consent_type VARCHAR(50) NOT NULL CHECK (consent_type IN ('APPLICATION', 'RESUME_BOOK', 'PROFILE_SHARING')),
  consent_given BOOLEAN NOT NULL DEFAULT TRUE,
  consent_text TEXT NOT NULL,
  data_shared TEXT[] NOT NULL,
  access_expiry TIMESTAMP,
  revoked BOOLEAN DEFAULT FALSE,
  revoked_at TIMESTAMP,
  revocation_reason TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_consents_student ON students.consents(student_id);
CREATE INDEX idx_consents_job_posting ON students.consents(job_posting_id);
CREATE INDEX idx_consents_active ON students.consents(student_id, job_posting_id) 
  WHERE consent_given = TRUE AND revoked = FALSE;

-- =====================================================
-- Table: students.eligibility_results
-- Description: Computed eligibility for job postings
-- =====================================================
CREATE TABLE students.eligibility_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students.profiles(id) ON DELETE CASCADE,
  job_posting_id UUID NOT NULL,
  is_eligible BOOLEAN NOT NULL,
  reason_codes JSONB DEFAULT '[]'::jsonb,
  computed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  rule_set_hash VARCHAR(64) NOT NULL,
  jd_version INTEGER NOT NULL,
  engine_version VARCHAR(20) NOT NULL,
  UNIQUE(student_id, job_posting_id, computed_at)
);

CREATE INDEX idx_eligibility_student ON students.eligibility_results(student_id);
CREATE INDEX idx_eligibility_job_posting ON students.eligibility_results(job_posting_id);
CREATE INDEX idx_eligibility_eligible ON students.eligibility_results(student_id, is_eligible) 
  WHERE is_eligible = TRUE;

-- =====================================================
-- Table: students.documents
-- Description: Additional student documents (marksheets, certificates)
-- =====================================================
CREATE TABLE students.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students.profiles(id) ON DELETE CASCADE,
  document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('SSC_MARKSHEET', 'HSC_MARKSHEET', 'DIPLOMA_MARKSHEET', 'CERTIFICATE', 'ID_PROOF', 'OTHER')),
  document_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_hash VARCHAR(64) NOT NULL,
  watermark_applied BOOLEAN DEFAULT FALSE,
  verified BOOLEAN DEFAULT FALSE,
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_documents_student ON students.documents(student_id);
CREATE INDEX idx_documents_type ON students.documents(document_type);

-- =====================================================
-- Comments
-- =====================================================
COMMENT ON SCHEMA students IS 'Student profiles, academic data, resumes, and eligibility';
COMMENT ON TABLE students.profiles IS 'Complete student profile with personal, academic, and career information';
COMMENT ON TABLE students.semester_marks IS 'Semester-wise academic marks and SPI with CGPI auto-calculation';
COMMENT ON TABLE students.resumes IS 'Resume versions with watermarking and parsing support';
COMMENT ON TABLE students.consents IS 'Data sharing consents with recruiters and access tracking';
COMMENT ON TABLE students.eligibility_results IS 'Computed eligibility for job postings with audit trail';
COMMENT ON TABLE students.documents IS 'Additional student documents with verification workflow';

-- =====================================================
-- End of students schema
-- =====================================================
