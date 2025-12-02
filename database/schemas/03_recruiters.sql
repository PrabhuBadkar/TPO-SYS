-- =====================================================
-- TPO Management System - Recruiters Schema
-- =====================================================
-- Description: Organizations, POCs, job postings, applications, and offers
-- Version: 1.0
-- Last Updated: 2024-01-15
-- =====================================================

-- Create recruiters schema
CREATE SCHEMA IF NOT EXISTS recruiters;

-- =====================================================
-- Table: recruiters.organizations
-- Description: Company/organization profiles
-- =====================================================
CREATE TABLE recruiters.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_name VARCHAR(255) NOT NULL,
  organization_type VARCHAR(50) NOT NULL CHECK (organization_type IN ('PRODUCT', 'SERVICE', 'STARTUP', 'MNC', 'PSU', 'GOVERNMENT', 'NGO', 'OTHER')),
  industry VARCHAR(100),
  website VARCHAR(255),
  headquarters_location VARCHAR(255),
  employee_count VARCHAR(50),
  founded_year INTEGER,
  description TEXT,
  
  -- Verification
  is_verified BOOLEAN DEFAULT FALSE,
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMP,
  is_blacklisted BOOLEAN DEFAULT FALSE,
  blacklisted_by UUID REFERENCES auth.users(id),
  blacklisted_at TIMESTAMP,
  blacklist_reason TEXT,
  
  -- Documents
  gst_number VARCHAR(50),
  pan_number VARCHAR(50),
  registration_certificate_url TEXT,
  
  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_organizations_name ON recruiters.organizations(organization_name);
CREATE INDEX idx_organizations_verified ON recruiters.organizations(is_verified);
CREATE INDEX idx_organizations_blacklisted ON recruiters.organizations(is_blacklisted);

-- =====================================================
-- Table: recruiters.pocs (Points of Contact)
-- Description: Company representatives/recruiters
-- =====================================================
CREATE TABLE recruiters.pocs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES recruiters.organizations(id) ON DELETE CASCADE,
  
  -- Personal Info
  full_name VARCHAR(255) NOT NULL,
  designation VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  mobile_number VARCHAR(15) NOT NULL,
  alternate_mobile VARCHAR(15),
  
  -- Status
  is_primary BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Verification
  email_verified BOOLEAN DEFAULT FALSE,
  mobile_verified BOOLEAN DEFAULT FALSE,
  
  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP
);

CREATE INDEX idx_pocs_organization ON recruiters.pocs(organization_id);
CREATE INDEX idx_pocs_user ON recruiters.pocs(user_id);
CREATE INDEX idx_pocs_active ON recruiters.pocs(is_active) WHERE is_active = TRUE;

-- =====================================================
-- Table: recruiters.job_postings
-- Description: Job descriptions and eligibility criteria
-- =====================================================
CREATE TABLE recruiters.job_postings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES recruiters.organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  
  -- Job Details
  job_posting_id VARCHAR(100) UNIQUE NOT NULL,
  job_title VARCHAR(255) NOT NULL,
  job_description TEXT NOT NULL,
  job_type VARCHAR(50) NOT NULL CHECK (job_type IN ('FULL_TIME', 'INTERNSHIP', 'PART_TIME', 'CONTRACT')),
  employment_type VARCHAR(50) NOT NULL CHECK (employment_type IN ('PERMANENT', 'TEMPORARY', 'CONTRACT', 'INTERNSHIP')),
  
  -- Location
  job_locations TEXT[] NOT NULL,
  is_remote BOOLEAN DEFAULT FALSE,
  relocation_provided BOOLEAN DEFAULT FALSE,
  
  -- Eligibility Criteria
  eligibility_criteria JSONB NOT NULL DEFAULT '{}'::jsonb,
  required_skills TEXT[] DEFAULT ARRAY[]::TEXT[],
  preferred_skills TEXT[] DEFAULT ARRAY[]::TEXT[],
  allowed_branches TEXT[] NOT NULL,
  graduation_years INTEGER[] NOT NULL,
  cgpa_min DECIMAL(4,2) NOT NULL CHECK (cgpa_min >= 0 AND cgpa_min <= 10),
  max_backlogs INTEGER DEFAULT 0,
  
  -- Compensation
  ctc_min INTEGER,
  ctc_max INTEGER,
  ctc_breakup JSONB DEFAULT '{}'::jsonb,
  stipend_amount INTEGER,
  bond_duration_months INTEGER DEFAULT 0,
  bond_amount INTEGER,
  
  -- Application
  application_deadline TIMESTAMP NOT NULL,
  max_applications INTEGER,
  current_applications INTEGER DEFAULT 0,
  
  -- Status
  status VARCHAR(50) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PENDING_APPROVAL', 'ACTIVE', 'CLOSED', 'REJECTED', 'CANCELLED')),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP,
  rejection_reason TEXT,
  
  -- Attachments
  jd_document_url TEXT,
  company_presentation_url TEXT,
  
  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  published_at TIMESTAMP,
  closed_at TIMESTAMP
);

CREATE INDEX idx_job_postings_organization ON recruiters.job_postings(organization_id);
CREATE INDEX idx_job_postings_status ON recruiters.job_postings(status);
CREATE INDEX idx_job_postings_deadline ON recruiters.job_postings(application_deadline);
CREATE INDEX idx_job_postings_active ON recruiters.job_postings(status) WHERE status = 'ACTIVE';

-- =====================================================
-- Table: recruiters.job_applications
-- Description: Student applications to job postings
-- =====================================================
CREATE TABLE recruiters.job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id VARCHAR(100) UNIQUE NOT NULL,
  job_posting_id UUID NOT NULL REFERENCES recruiters.job_postings(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students.profiles(id) ON DELETE CASCADE,
  
  -- Application Data
  resume_id UUID NOT NULL,
  cover_letter TEXT,
  additional_documents JSONB DEFAULT '[]'::jsonb,
  
  -- Status Workflow
  status VARCHAR(50) DEFAULT 'SUBMITTED' CHECK (status IN (
    'SUBMITTED', 
    'PENDING_TPO_DEPT', 
    'APPROVED_BY_DEPT', 
    'REJECTED_BY_DEPT',
    'PENDING_TPO_ADMIN', 
    'APPROVED_BY_ADMIN', 
    'REJECTED_BY_ADMIN',
    'FORWARDED_TO_RECRUITER',
    'UNDER_REVIEW',
    'SHORTLISTED',
    'REJECTED',
    'WITHDRAWN'
  )),
  
  -- Review Notes
  dept_review_notes TEXT,
  reviewed_by_dept UUID REFERENCES auth.users(id),
  reviewed_at_dept TIMESTAMP,
  
  admin_review_notes TEXT,
  reviewed_by_admin UUID REFERENCES auth.users(id),
  reviewed_at_admin TIMESTAMP,
  
  recruiter_notes TEXT,
  reviewed_by_recruiter UUID REFERENCES auth.users(id),
  reviewed_at_recruiter TIMESTAMP,
  
  -- Timestamps
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  forwarded_at TIMESTAMP,
  shortlisted_at TIMESTAMP,
  rejected_at TIMESTAMP,
  withdrawn_at TIMESTAMP,
  
  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(job_posting_id, student_id)
);

CREATE INDEX idx_applications_job_posting ON recruiters.job_applications(job_posting_id);
CREATE INDEX idx_applications_student ON recruiters.job_applications(student_id);
CREATE INDEX idx_applications_status ON recruiters.job_applications(status);
CREATE INDEX idx_applications_pending_dept ON recruiters.job_applications(status) 
  WHERE status = 'PENDING_TPO_DEPT';
CREATE INDEX idx_applications_pending_admin ON recruiters.job_applications(status) 
  WHERE status = 'PENDING_TPO_ADMIN';

-- =====================================================
-- Table: recruiters.offers
-- Description: Job offers extended to students
-- =====================================================
CREATE TABLE recruiters.offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id VARCHAR(100) UNIQUE NOT NULL,
  job_posting_id UUID NOT NULL REFERENCES recruiters.job_postings(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students.profiles(id) ON DELETE CASCADE,
  application_id UUID NOT NULL REFERENCES recruiters.job_applications(id) ON DELETE CASCADE,
  
  -- Offer Details
  designation VARCHAR(255) NOT NULL,
  ctc_offered INTEGER NOT NULL,
  ctc_breakup JSONB NOT NULL,
  joining_date DATE,
  joining_location VARCHAR(255),
  bond_duration_months INTEGER DEFAULT 0,
  bond_amount INTEGER,
  
  -- Status
  status VARCHAR(50) DEFAULT 'EXTENDED' CHECK (status IN (
    'EXTENDED',
    'ACCEPTED',
    'REJECTED',
    'EXPIRED',
    'RESCINDED',
    'JOINED'
  )),
  
  -- Acceptance
  accepted_at TIMESTAMP,
  rejected_at TIMESTAMP,
  rejection_reason TEXT,
  
  -- Rescind
  rescinded_at TIMESTAMP,
  rescind_reason TEXT,
  rescinded_by UUID REFERENCES auth.users(id),
  
  -- Documents
  offer_letter_url TEXT,
  acceptance_letter_url TEXT,
  
  -- Expiry
  offer_expiry TIMESTAMP NOT NULL,
  
  -- Verification
  verified_by_tpo BOOLEAN DEFAULT FALSE,
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMP,
  
  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  extended_by UUID REFERENCES auth.users(id),
  
  UNIQUE(job_posting_id, student_id)
);

CREATE INDEX idx_offers_job_posting ON recruiters.offers(job_posting_id);
CREATE INDEX idx_offers_student ON recruiters.offers(student_id);
CREATE INDEX idx_offers_status ON recruiters.offers(status);
CREATE INDEX idx_offers_active ON recruiters.offers(status) 
  WHERE status IN ('EXTENDED', 'ACCEPTED');

-- =====================================================
-- Comments
-- =====================================================
COMMENT ON SCHEMA recruiters IS 'Organizations, job postings, applications, and offers';
COMMENT ON TABLE recruiters.organizations IS 'Company/organization profiles with verification and blacklist management';
COMMENT ON TABLE recruiters.pocs IS 'Company representatives (Points of Contact) linked to organizations';
COMMENT ON TABLE recruiters.job_postings IS 'Job descriptions with eligibility criteria and approval workflow';
COMMENT ON TABLE recruiters.job_applications IS 'Student applications with two-tier approval (TPO_Dept → TPO_Admin)';
COMMENT ON TABLE recruiters.offers IS 'Job offers with acceptance tracking and verification';

-- =====================================================
-- End of recruiters schema
-- =====================================================
