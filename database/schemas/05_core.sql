-- =====================================================
-- TPO Management System - Core Schema
-- =====================================================
-- Description: System configuration, policies, and TPO operations
-- Version: 1.0
-- Last Updated: 2024-01-15
-- =====================================================

CREATE SCHEMA IF NOT EXISTS core;

-- =====================================================
-- Table: core.tpo_dept_coordinators
-- =====================================================
CREATE TABLE core.tpo_dept_coordinators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dept_coordinator_name VARCHAR(255) NOT NULL,
  employee_id VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  mobile_number VARCHAR(15) NOT NULL,
  designation VARCHAR(100),
  primary_department VARCHAR(50) NOT NULL,
  assigned_departments TEXT[] DEFAULT ARRAY[]::TEXT[],
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- Table: core.policies
-- =====================================================
CREATE TABLE core.policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_name VARCHAR(255) NOT NULL,
  policy_type VARCHAR(50) NOT NULL,
  policy_data JSONB NOT NULL,
  effective_from DATE NOT NULL,
  effective_to DATE,
  created_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- Table: core.departments
-- =====================================================
CREATE TABLE core.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_code VARCHAR(50) UNIQUE NOT NULL,
  department_name VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- Table: core.academic_years
-- =====================================================
CREATE TABLE core.academic_years (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year_code VARCHAR(20) UNIQUE NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_current BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- Table: core.placement_cycles
-- =====================================================
CREATE TABLE core.placement_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_name VARCHAR(255) NOT NULL,
  academic_year_id UUID REFERENCES core.academic_years(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- Table: core.communication_log
-- =====================================================
CREATE TABLE core.communication_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id VARCHAR(100) UNIQUE NOT NULL,
  sender_id UUID NOT NULL REFERENCES auth.users(id),
  sender_role VARCHAR(50) NOT NULL,
  recipient_type VARCHAR(50) NOT NULL,
  recipient_ids UUID[] DEFAULT ARRAY[]::UUID[],
  subject VARCHAR(500) NOT NULL,
  body TEXT NOT NULL,
  message_type VARCHAR(50) NOT NULL,
  delivery_status VARCHAR(50) DEFAULT 'QUEUED',
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- Table: core.report_exports
-- =====================================================
CREATE TABLE core.report_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id VARCHAR(100) UNIQUE NOT NULL,
  report_type VARCHAR(50) NOT NULL,
  report_name VARCHAR(255) NOT NULL,
  filters JSONB DEFAULT '{}'::jsonb,
  format VARCHAR(20) NOT NULL,
  file_path TEXT,
  generated_by UUID REFERENCES auth.users(id),
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON SCHEMA core IS 'System configuration, policies, and TPO operations';
