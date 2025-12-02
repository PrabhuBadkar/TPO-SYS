-- =====================================================
-- TPO Management System - Analytics Schema
-- =====================================================
-- Description: Pre-computed metrics and analytics
-- Version: 1.0
-- Last Updated: 2024-01-15
-- =====================================================

CREATE SCHEMA IF NOT EXISTS analytics;

-- =====================================================
-- Table: analytics.student_metrics
-- =====================================================
CREATE TABLE analytics.student_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students.profiles(id) ON DELETE CASCADE,
  metric_date DATE NOT NULL,
  total_applications INTEGER DEFAULT 0,
  pending_applications INTEGER DEFAULT 0,
  shortlisted_count INTEGER DEFAULT 0,
  rejected_count INTEGER DEFAULT 0,
  offers_count INTEGER DEFAULT 0,
  profile_views INTEGER DEFAULT 0,
  resume_downloads INTEGER DEFAULT 0,
  computed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(student_id, metric_date)
);

CREATE INDEX idx_student_metrics_student ON analytics.student_metrics(student_id);
CREATE INDEX idx_student_metrics_date ON analytics.student_metrics(metric_date DESC);

-- =====================================================
-- Table: analytics.department_metrics
-- =====================================================
CREATE TABLE analytics.department_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department VARCHAR(50) NOT NULL,
  metric_date DATE NOT NULL,
  total_students INTEGER DEFAULT 0,
  verified_students INTEGER DEFAULT 0,
  eligible_students INTEGER DEFAULT 0,
  applied_students INTEGER DEFAULT 0,
  placed_students INTEGER DEFAULT 0,
  avg_cgpa DECIMAL(4,2),
  avg_ctc INTEGER,
  highest_ctc INTEGER,
  computed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(department, metric_date)
);

CREATE INDEX idx_dept_metrics_department ON analytics.department_metrics(department);
CREATE INDEX idx_dept_metrics_date ON analytics.department_metrics(metric_date DESC);

-- =====================================================
-- Table: analytics.placement_stats
-- =====================================================
CREATE TABLE analytics.placement_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academic_year VARCHAR(20) NOT NULL,
  total_students INTEGER DEFAULT 0,
  placed_students INTEGER DEFAULT 0,
  placement_percentage DECIMAL(5,2),
  avg_ctc INTEGER,
  median_ctc INTEGER,
  highest_ctc INTEGER,
  total_companies INTEGER DEFAULT 0,
  total_offers INTEGER DEFAULT 0,
  computed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(academic_year)
);

COMMENT ON SCHEMA analytics IS 'Pre-computed metrics for dashboards and reports';
