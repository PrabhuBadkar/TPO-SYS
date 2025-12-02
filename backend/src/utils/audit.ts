/**
 * Audit Logging Utility
 * Centralized audit trail for all TPO Admin actions
 * Implements BR-A5, BR-A11, BR-A16, BR-A20
 */

import { prisma } from '../server'

export interface AuditLogEntry {
  actor_id: string
  action: string
  resource_type: string
  resource_id?: string
  changes?: Record<string, any>
  ip_address?: string
  user_agent?: string
  metadata?: Record<string, any>
}

/**
 * Log an audit event
 */
export async function logAudit(entry: AuditLogEntry): Promise<void> {
  try {
    await prisma.$executeRaw`
      INSERT INTO audit.events (
        actor_id, 
        action, 
        resource_type, 
        resource_id, 
        changes, 
        ip_address, 
        user_agent,
        metadata,
        timestamp
      ) VALUES (
        ${entry.actor_id}::uuid,
        ${entry.action},
        ${entry.resource_type},
        ${entry.resource_id ? `${entry.resource_id}::uuid` : null},
        ${entry.changes ? JSON.stringify(entry.changes) : '{}'}::jsonb,
        ${entry.ip_address || null}::inet,
        ${entry.user_agent || null},
        ${entry.metadata ? JSON.stringify(entry.metadata) : '{}'}::jsonb,
        NOW()
      )
    `
  } catch (error) {
    // Log to console but don't fail the operation
    console.error('Audit logging failed:', error)
  }
}

/**
 * Audit action types for TPO Admin
 */
export const AUDIT_ACTIONS = {
  // Organization verification
  RECRUITER_VERIFIED: 'RECRUITER_VERIFIED',
  RECRUITER_REJECTED: 'RECRUITER_REJECTED',
  RECRUITER_BLACKLISTED: 'RECRUITER_BLACKLISTED',
  
  // Job posting approval
  JD_APPROVED: 'JD_APPROVED',
  JD_REJECTED: 'JD_REJECTED',
  JD_MODIFICATIONS_REQUESTED: 'JD_MODIFICATIONS_REQUESTED',
  
  // Application review
  APPLICATION_APPROVED_BY_ADMIN: 'APPLICATION_APPROVED_BY_ADMIN',
  APPLICATION_REJECTED_BY_ADMIN: 'APPLICATION_REJECTED_BY_ADMIN',
  APPLICATION_FLAGGED: 'APPLICATION_FLAGGED',
  
  // Overrides
  PROFILE_VERIFICATION_OVERRIDE: 'PROFILE_VERIFICATION_OVERRIDE',
  APPLICATION_DECISION_OVERRIDE: 'APPLICATION_DECISION_OVERRIDE',
  
  // Approvals (4-eyes)
  APPROVAL_REQUEST_CREATED: 'APPROVAL_REQUEST_CREATED',
  APPROVAL_REQUEST_APPROVED: 'APPROVAL_REQUEST_APPROVED',
  APPROVAL_REQUEST_REJECTED: 'APPROVAL_REQUEST_REJECTED',
  
  // Reports
  REPORT_GENERATED: 'REPORT_GENERATED',
  DATA_EXPORTED: 'DATA_EXPORTED',
  
  // Communications
  BULK_COMMUNICATION_SENT: 'BULK_COMMUNICATION_SENT',
  EMERGENCY_BROADCAST: 'EMERGENCY_BROADCAST',
} as const

/**
 * Resource types
 */
export const RESOURCE_TYPES = {
  ORGANIZATION: 'ORGANIZATION',
  JOB_POSTING: 'JOB_POSTING',
  APPLICATION: 'APPLICATION',
  STUDENT_PROFILE: 'STUDENT_PROFILE',
  APPROVAL_REQUEST: 'APPROVAL_REQUEST',
  REPORT: 'REPORT',
  COMMUNICATION: 'COMMUNICATION',
} as const

/**
 * Helper to extract IP and User-Agent from Express request
 */
export function extractRequestMetadata(req: any): { ip_address?: string; user_agent?: string } {
  return {
    ip_address: req.ip || req.connection?.remoteAddress,
    user_agent: req.get('user-agent'),
  }
}
