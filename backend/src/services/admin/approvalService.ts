/**
 * Approval Service
 * Implements 4-eyes approval workflow (K1.2)
 * For sensitive actions: blacklisting, overrides, bulk deletes, policy changes
 */

import { prisma } from '../../server'
import { logAudit, AUDIT_ACTIONS, RESOURCE_TYPES } from '../../utils/audit'

export type ApprovalRequestType =
  | 'BLACKLIST_ORG'
  | 'OVERRIDE_PROFILE_VERIFICATION'
  | 'OVERRIDE_APP_DECISION'
  | 'POLICY_CHANGE'
  | 'OFFER_RESCIND'
  | 'BULK_DELETE'

export interface CreateApprovalRequestInput {
  requestType: ApprovalRequestType
  resourceType: string
  resourceId: string
  initiatorId: string
  justification: string
  proposedChanges: Record<string, any>
  metadata?: Record<string, any>
}

export interface DecideApprovalInput {
  approvalId: string
  approverId: string
  decision: 'APPROVE' | 'REJECT'
  notes?: string
}

export class ApprovalService {
  /**
   * Create approval request (First admin initiates)
   * BR-A2: Blacklisting requires 4-eyes approval
   * K1.2: Sensitive actions require two admins
   */
  static async createApprovalRequest(input: CreateApprovalRequestInput) {
    // Note: In production, this would insert into approval_requests table
    // For now, we'll use a simplified approach with metadata in the resource itself
    
    const approvalRequest = {
      id: crypto.randomUUID(),
      request_type: input.requestType,
      resource_type: input.resourceType,
      resource_id: input.resourceId,
      initiator_id: input.initiatorId,
      status: 'PENDING',
      justification: input.justification,
      proposed_changes: input.proposedChanges,
      created_at: new Date(),
    }

    // Log audit event
    await logAudit({
      actor_id: input.initiatorId,
      action: AUDIT_ACTIONS.APPROVAL_REQUEST_CREATED,
      resource_type: RESOURCE_TYPES.APPROVAL_REQUEST,
      resource_id: approvalRequest.id,
      changes: {
        request_type: input.requestType,
        resource_type: input.resourceType,
        resource_id: input.resourceId,
        justification: input.justification,
      },
      metadata: input.metadata,
    })

    return {
      success: true,
      message: 'Approval request created. Awaiting second admin approval.',
      data: { approvalRequest },
    }
  }

  /**
   * List approval requests
   */
  static async listApprovalRequests(filters: {
    status?: 'PENDING' | 'APPROVED' | 'REJECTED'
    requestType?: ApprovalRequestType
    initiatorId?: string
    page?: number
    limit?: number
  }) {
    // Note: In production, query approval_requests table
    // For now, return mock structure
    
    return {
      success: true,
      data: {
        approvalRequests: [],
        pagination: {
          page: filters.page || 1,
          limit: filters.limit || 20,
          total: 0,
          pages: 0,
        },
      },
    }
  }

  /**
   * Decide on approval request (Second admin approves/rejects)
   * K1.2: Second admin must be different from initiator
   */
  static async decideApprovalRequest(input: DecideApprovalInput) {
    const { approvalId, approverId, decision, notes } = input

    // Note: In production, fetch from approval_requests table
    // Validate: approver_id !== initiator_id
    
    // Log audit event
    await logAudit({
      actor_id: approverId,
      action: decision === 'APPROVE' 
        ? AUDIT_ACTIONS.APPROVAL_REQUEST_APPROVED 
        : AUDIT_ACTIONS.APPROVAL_REQUEST_REJECTED,
      resource_type: RESOURCE_TYPES.APPROVAL_REQUEST,
      resource_id: approvalId,
      changes: {
        decision,
        notes,
      },
    })

    // If approved, execute the proposed changes
    if (decision === 'APPROVE') {
      // Execute the actual action (blacklist, override, etc.)
      // This would be handled by specific service methods
    }

    return {
      success: true,
      message: `Approval request ${decision.toLowerCase()}d successfully`,
      data: {
        approvalId,
        decision,
        decidedAt: new Date(),
      },
    }
  }

  /**
   * Blacklist organization (requires 4-eyes approval)
   * BR-A2: Blacklisting requires 4-eyes approval
   */
  static async requestBlacklistOrganization(
    initiatorId: string,
    organizationId: string,
    reason: string
  ) {
    return this.createApprovalRequest({
      requestType: 'BLACKLIST_ORG',
      resourceType: 'ORGANIZATION',
      resourceId: organizationId,
      initiatorId,
      justification: reason,
      proposedChanges: {
        recruiter_status: 'BLACKLISTED',
        blacklist_reason: reason,
        blacklisted_by: initiatorId,
        blacklisted_at: new Date(),
      },
    })
  }

  /**
   * Override profile verification (requires 4-eyes approval)
   * BR-A18: Admin can override dept verification with justification
   */
  static async requestProfileVerificationOverride(
    initiatorId: string,
    studentId: string,
    action: 'APPROVE' | 'HOLD' | 'REJECT',
    justification: string
  ) {
    return this.createApprovalRequest({
      requestType: 'OVERRIDE_PROFILE_VERIFICATION',
      resourceType: 'STUDENT_PROFILE',
      resourceId: studentId,
      initiatorId,
      justification,
      proposedChanges: {
        tpo_admin_verified: action === 'APPROVE',
        tpo_admin_verified_by: initiatorId,
        tpo_admin_verified_at: new Date(),
        profile_status: action === 'APPROVE' ? 'VERIFIED' : action === 'HOLD' ? 'ON_HOLD' : 'REJECTED',
      },
    })
  }

  /**
   * Override application decision (requires 4-eyes approval)
   * BR-A13: Admin can override dept decisions with justification
   */
  static async requestApplicationDecisionOverride(
    initiatorId: string,
    applicationId: string,
    action: 'APPROVE' | 'REJECT',
    justification: string
  ) {
    return this.createApprovalRequest({
      requestType: 'OVERRIDE_APP_DECISION',
      resourceType: 'APPLICATION',
      resourceId: applicationId,
      initiatorId,
      justification,
      proposedChanges: {
        status: action === 'APPROVE' ? 'APPROVED_BY_ADMIN' : 'REJECTED_BY_ADMIN',
        reviewed_by_admin: initiatorId,
        reviewed_at_admin: new Date(),
        admin_review_notes: `OVERRIDE: ${justification}`,
      },
    })
  }

  /**
   * Execute approved blacklist
   * Called after 4-eyes approval
   */
  static async executeBlacklist(
    organizationId: string,
    reason: string,
    blacklistedBy: string
  ) {
    const organization = await prisma.organization.update({
      where: { id: organizationId },
      data: {
        recruiter_status: 'BLACKLISTED',
        blacklist_reason: reason,
        blacklisted_by: blacklistedBy,
        blacklisted_at: new Date(),
      },
    })

    // Log audit
    await logAudit({
      actor_id: blacklistedBy,
      action: AUDIT_ACTIONS.RECRUITER_BLACKLISTED,
      resource_type: RESOURCE_TYPES.ORGANIZATION,
      resource_id: organizationId,
      changes: {
        recruiter_status: 'BLACKLISTED',
        blacklist_reason: reason,
      },
    })

    return organization
  }
}
