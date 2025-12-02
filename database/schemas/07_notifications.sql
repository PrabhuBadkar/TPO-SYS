-- =====================================================
-- TPO Management System - Notifications Schema
-- =====================================================
-- Description: Multi-channel notification system
-- Version: 1.0
-- Last Updated: 2024-01-15
-- =====================================================

CREATE SCHEMA IF NOT EXISTS notifications;

-- =====================================================
-- Table: notifications.outbox
-- =====================================================
CREATE TABLE notifications.outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id VARCHAR(100) UNIQUE NOT NULL,
  recipient_id UUID NOT NULL REFERENCES auth.users(id),
  channel VARCHAR(50) NOT NULL CHECK (channel IN ('EMAIL', 'SMS', 'PUSH', 'IN_APP')),
  subject VARCHAR(500),
  body TEXT NOT NULL,
  priority VARCHAR(20) DEFAULT 'NORMAL' CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'CRITICAL')),
  status VARCHAR(50) DEFAULT 'QUEUED' CHECK (status IN ('QUEUED', 'SENDING', 'SENT', 'FAILED', 'DELIVERED', 'READ')),
  sent_at TIMESTAMP,
  delivered_at TIMESTAMP,
  read_at TIMESTAMP,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_recipient ON notifications.outbox(recipient_id);
CREATE INDEX idx_notifications_status ON notifications.outbox(status);
CREATE INDEX idx_notifications_created ON notifications.outbox(created_at DESC);

-- =====================================================
-- Table: notifications.templates
-- =====================================================
CREATE TABLE notifications.templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_code VARCHAR(100) UNIQUE NOT NULL,
  template_name VARCHAR(255) NOT NULL,
  channel VARCHAR(50) NOT NULL,
  subject_template VARCHAR(500),
  body_template TEXT NOT NULL,
  variables JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON SCHEMA notifications IS 'Multi-channel notification system with templates';
