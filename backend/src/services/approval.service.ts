/**
 * Approval Service
 * 4-eyes approval workflow for critical actions
 */

import { PrismaClient } from '@prisma/client';
import { notificationService } from './notification.service';

const prisma = new PrismaClient();

export type ApprovalRequestType = 
  | 'BLACKLIST_ORG' | 'WHITELIST_ORG' | 'RESCIND_OFFER'
  | 'MODIFY_PLACEMENT_POLICY' | 'BULK_STUDENT_UPDATE'
  | 'DELETE_JOB_POSTING' | 'EMERGENCY_NOTIFICATION';

export interface CreateApprovalRequest {
  request_type: ApprovalRequestType;
  resource_type: string;
  resource_id: string;
  justification: string;
  proposed_changes: Record<string, any>;
  initiator_id: string;
}

/**
 * Approval Service
 */
export class ApprovalService {
  /**
   * Create approval request
   */
  async createApprovalRequest(data: CreateApprovalRequest): Promise<any> {
    try {
      // Create approval request
      const request = await prisma.approvalRequest.create({
        data: {
          request_type: data.request_type,
          resource_type: data.resource_type,
          resource_id: data.resource_id,
          justification: data.justification,
          proposed_changes: data.proposed_changes,
          initiator_id: data.initiator_id,
          status: 'pending',
        },
        include: {
          initiator: {
            select: {
              email: true,
              role: true,
            },
          },
        },
      });

      // Notify approvers
      await this.notifyApprovers(request);

      console.log('[Approval] Request created:', request.id);

      return {
        success: true,
        request,
      };
    } catch (error) {
      console.error('[Approval] Error creating request:', error);
      throw new Error('Failed to create approval request');
    }
  }

  /**
   * Get pending approvals
   */
  async getPendingApprovals(filters?: {
    request_type?: ApprovalRequestType;
    initiator_id?: string;
  }): Promise<any> {
    try {
      const where: any = { status: 'pending' };

      if (filters?.request_type) {
        where.request_type = filters.request_type;
      }

      if (filters?.initiator_id) {
        where.initiator_id = filters.initiator_id;
      }

      const requests = await prisma.approvalRequest.findMany({
        where,
        orderBy: { created_at: 'desc' },
        include: {
          initiator: {
            select: {
              email: true,
              role: true,
              studentProfile: {
                select: { full_name: true },
              },
            },
          },
          approver: {
            select: {
              email: true,
              role: true,
            },
          },
        },
      });

      return {
        success: true,
        requests,
        count: requests.length,
      };
    } catch (error) {
      console.error('[Approval] Error getting pending approvals:', error);
      throw new Error('Failed to get pending approvals');
    }
  }

  /**
   * Approve request
   */
  async approveRequest(
    requestId: string,
    approverId: string,
    decisionNotes?: string
  ): Promise<any> {
    try {
      // Get request
      const request = await prisma.approvalRequest.findUnique({
        where: { id: requestId },
        include: {
          initiator: {
            select: { email: true },
          },
        },
      });

      if (!request) {
        throw new Error('Approval request not found');
      }

      if (request.status !== 'pending') {
        throw new Error('Request is not pending');
      }

      // Update request
      const updatedRequest = await prisma.approvalRequest.update({
        where: { id: requestId },
        data: {
          status: 'approved',
          approver_id: approverId,
          decision_notes: decisionNotes,
          decided_at: new Date(),
        },
      });

      // Execute the approved action
      await this.executeApprovedAction(updatedRequest);

      // Notify initiator
      await notificationService.sendNotification({
        user_id: request.initiator_id,
        type: 'approval_decision',
        title: 'Approval Request Approved',
        message: `Your ${request.request_type} request has been approved.`,
        channels: ['in_app', 'email'],
      });

      console.log('[Approval] Request approved:', requestId);

      return {
        success: true,
        request: updatedRequest,
      };
    } catch (error) {
      console.error('[Approval] Error approving request:', error);
      throw error;
    }
  }

  /**
   * Reject request
   */
  async rejectRequest(
    requestId: string,
    approverId: string,
    decisionNotes: string
  ): Promise<any> {
    try {
      // Get request
      const request = await prisma.approvalRequest.findUnique({
        where: { id: requestId },
        include: {
          initiator: {
            select: { email: true },
          },
        },
      });

      if (!request) {
        throw new Error('Approval request not found');
      }

      if (request.status !== 'pending') {
        throw new Error('Request is not pending');
      }

      // Update request
      const updatedRequest = await prisma.approvalRequest.update({
        where: { id: requestId },
        data: {
          status: 'rejected',
          approver_id: approverId,
          decision_notes: decisionNotes,
          decided_at: new Date(),
        },
      });

      // Notify initiator
      await notificationService.sendNotification({
        user_id: request.initiator_id,
        type: 'approval_decision',
        title: 'Approval Request Rejected',
        message: `Your ${request.request_type} request has been rejected. Reason: ${decisionNotes}`,
        channels: ['in_app', 'email'],
      });

      console.log('[Approval] Request rejected:', requestId);

      return {
        success: true,
        request: updatedRequest,
      };
    } catch (error) {
      console.error('[Approval] Error rejecting request:', error);
      throw error;
    }
  }

  /**
   * Get approval history
   */
  async getApprovalHistory(filters?: {
    request_type?: ApprovalRequestType;
    status?: string;
    start_date?: Date;
    end_date?: Date;
  }): Promise<any> {
    try {
      const where: any = {};

      if (filters?.request_type) {
        where.request_type = filters.request_type;
      }

      if (filters?.status) {
        where.status = filters.status;
      }

      if (filters?.start_date || filters?.end_date) {
        where.created_at = {};
        if (filters.start_date) where.created_at.gte = filters.start_date;
        if (filters.end_date) where.created_at.lte = filters.end_date;
      }

      const requests = await prisma.approvalRequest.findMany({
        where,
        orderBy: { created_at: 'desc' },
        include: {
          initiator: {
            select: {
              email: true,
              role: true,
            },
          },
          approver: {
            select: {
              email: true,
              role: true,
            },
          },
        },
      });

      return {
        success: true,
        requests,
        count: requests.length,
      };
    } catch (error) {
      console.error('[Approval] Error getting history:', error);
      throw new Error('Failed to get approval history');
    }
  }

  /**
   * Notify approvers about new request
   */
  private async notifyApprovers(request: any): Promise<void> {
    try {
      // Get all TPO admins (approvers)
      const approvers = await prisma.user.findMany({
        where: {
          role: { in: ['tpo_admin', 'dept_coordinator'] },
        },
      });

      // Send notification to all approvers
      for (const approver of approvers) {
        await notificationService.sendNotification({
          user_id: approver.id,
          type: 'approval_request',
          title: 'New Approval Request',
          message: `${request.initiator.email} has requested approval for ${request.request_type}`,
          channels: ['in_app', 'email'],
          metadata: {
            request_id: request.id,
            request_type: request.request_type,
          },
        });
      }
    } catch (error) {
      console.error('[Approval] Error notifying approvers:', error);
    }
  }

  /**
   * Execute approved action
   */
  private async executeApprovedAction(request: any): Promise<void> {
    try {
      switch (request.request_type) {
        case 'BLACKLIST_ORG':
          await this.blacklistOrganization(request);
          break;
        case 'WHITELIST_ORG':
          await this.whitelistOrganization(request);
          break;
        case 'RESCIND_OFFER':
          await this.rescindOffer(request);
          break;
        case 'DELETE_JOB_POSTING':
          await this.deleteJobPosting(request);
          break;
        // Add more cases as needed
        default:
          console.log('[Approval] No action handler for:', request.request_type);
      }
    } catch (error) {
      console.error('[Approval] Error executing action:', error);
    }
  }

  /**
   * Blacklist organization
   */
  private async blacklistOrganization(request: any): Promise<void> {
    await prisma.organization.update({
      where: { id: request.resource_id },
      data: {
        blacklisted: true,
        blacklist_reason: request.justification,
        blacklisted_at: new Date(),
      },
    });
  }

  /**
   * Whitelist organization
   */
  private async whitelistOrganization(request: any): Promise<void> {
    await prisma.organization.update({
      where: { id: request.resource_id },
      data: {
        blacklisted: false,
        blacklist_reason: null,
        blacklisted_at: null,
      },
    });
  }

  /**
   * Rescind offer
   */
  private async rescindOffer(request: any): Promise<void> {
    await prisma.offer.update({
      where: { id: request.resource_id },
      data: {
        status: 'withdrawn',
        rescind_reason: request.justification,
      },
    });
  }

  /**
   * Delete job posting
   */
  private async deleteJobPosting(request: any): Promise<void> {
    await prisma.jobPosting.update({
      where: { id: request.resource_id },
      data: {
        status: 'deleted',
      },
    });
  }

  /**
   * Get approval statistics
   */
  async getStatistics(filters?: {
    start_date?: Date;
    end_date?: Date;
  }): Promise<any> {
    try {
      const where: any = {};

      if (filters?.start_date || filters?.end_date) {
        where.created_at = {};
        if (filters.start_date) where.created_at.gte = filters.start_date;
        if (filters.end_date) where.created_at.lte = filters.end_date;
      }

      const [total, pending, approved, rejected, byType] = await Promise.all([
        prisma.approvalRequest.count({ where }),
        prisma.approvalRequest.count({ where: { ...where, status: 'pending' } }),
        prisma.approvalRequest.count({ where: { ...where, status: 'approved' } }),
        prisma.approvalRequest.count({ where: { ...where, status: 'rejected' } }),
        prisma.approvalRequest.groupBy({
          by: ['request_type'],
          where,
          _count: true,
        }),
      ]);

      return {
        success: true,
        statistics: {
          total,
          pending,
          approved,
          rejected,
          approval_rate: total > 0 ? Math.round((approved / total) * 100) : 0,
          by_type: byType,
        },
      };
    } catch (error) {
      console.error('[Approval] Error getting statistics:', error);
      throw new Error('Failed to get approval statistics');
    }
  }
}

// Export singleton instance
export const approvalService = new ApprovalService();
