/**
 * Audit Service
 * Enhanced audit logging and compliance reporting
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export type AuditAction = 
  | 'CREATE' | 'READ' | 'UPDATE' | 'DELETE'
  | 'LOGIN' | 'LOGOUT' | 'LOGIN_FAILED'
  | 'APPROVE' | 'REJECT' | 'VERIFY'
  | 'UPLOAD' | 'DOWNLOAD' | 'EXPORT'
  | 'SEND' | 'RECEIVE'
  | 'GRANT' | 'REVOKE';

export type ResourceType =
  | 'USER' | 'STUDENT_PROFILE' | 'JOB_POSTING' | 'APPLICATION'
  | 'OFFER' | 'CONSENT' | 'DOCUMENT' | 'RESUME'
  | 'EVENT' | 'NOTIFICATION' | 'ORGANIZATION'
  | 'APPROVAL_REQUEST' | 'REPORT';

export interface AuditLogEntry {
  actor_id: string;
  action: AuditAction;
  resource_type: ResourceType;
  resource_id?: string;
  changes?: Record<string, any>;
  metadata?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
}

/**
 * Audit Service
 */
export class AuditService {
  /**
   * Log an audit event
   */
  async log(entry: AuditLogEntry): Promise<void> {
    try {
      await prisma.auditEvent.create({
        data: {
          actor_id: entry.actor_id,
          action: entry.action,
          resource_type: entry.resource_type,
          resource_id: entry.resource_id || null,
          changes: entry.changes || {},
          metadata: entry.metadata || {},
          ip_address: entry.ip_address || null,
          user_agent: entry.user_agent || null,
        },
      });

      console.log('[Audit] Logged:', entry.action, entry.resource_type, entry.resource_id);
    } catch (error) {
      console.error('[Audit] Error logging event:', error);
      // Don't throw - audit logging should not break the main flow
    }
  }

  /**
   * Get audit logs with filters
   */
  async getLogs(filters: {
    actor_id?: string;
    action?: AuditAction;
    resource_type?: ResourceType;
    resource_id?: string;
    start_date?: Date;
    end_date?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{ logs: any[]; total: number }> {
    try {
      const where: any = {};

      if (filters.actor_id) where.actor_id = filters.actor_id;
      if (filters.action) where.action = filters.action;
      if (filters.resource_type) where.resource_type = filters.resource_type;
      if (filters.resource_id) where.resource_id = filters.resource_id;

      if (filters.start_date || filters.end_date) {
        where.created_at = {};
        if (filters.start_date) where.created_at.gte = filters.start_date;
        if (filters.end_date) where.created_at.lte = filters.end_date;
      }

      const [logs, total] = await Promise.all([
        prisma.auditEvent.findMany({
          where,
          orderBy: { created_at: 'desc' },
          take: filters.limit || 100,
          skip: filters.offset || 0,
          include: {
            actor: {
              select: {
                email: true,
                role: true,
                studentProfile: {
                  select: {
                    full_name: true,
                  },
                },
              },
            },
          },
        }),
        prisma.auditEvent.count({ where }),
      ]);

      return { logs, total };
    } catch (error) {
      console.error('[Audit] Error getting logs:', error);
      return { logs: [], total: 0 };
    }
  }

  /**
   * Get audit logs for a specific resource
   */
  async getResourceHistory(resourceType: ResourceType, resourceId: string): Promise<any[]> {
    try {
      return await prisma.auditEvent.findMany({
        where: {
          resource_type: resourceType,
          resource_id: resourceId,
        },
        orderBy: { created_at: 'desc' },
        include: {
          actor: {
            select: {
              email: true,
              role: true,
            },
          },
        },
      });
    } catch (error) {
      console.error('[Audit] Error getting resource history:', error);
      return [];
    }
  }

  /**
   * Get user activity
   */
  async getUserActivity(userId: string, limit: number = 50): Promise<any[]> {
    try {
      return await prisma.auditEvent.findMany({
        where: { actor_id: userId },
        orderBy: { created_at: 'desc' },
        take: limit,
      });
    } catch (error) {
      console.error('[Audit] Error getting user activity:', error);
      return [];
    }
  }

  /**
   * Generate compliance report
   */
  async generateComplianceReport(type: 'audit_log' | 'consent' | 'verification' | 'security', filters: {
    start_date: Date;
    end_date: Date;
  }): Promise<any> {
    try {
      if (type === 'audit_log') {
        return await this.generateAuditLogReport(filters);
      } else if (type === 'consent') {
        return await this.generateConsentReport(filters);
      } else if (type === 'verification') {
        return await this.generateVerificationReport(filters);
      } else if (type === 'security') {
        return await this.generateSecurityReport(filters);
      }

      return null;
    } catch (error) {
      console.error('[Audit] Error generating compliance report:', error);
      return null;
    }
  }

  /**
   * Generate audit log report
   */
  private async generateAuditLogReport(filters: { start_date: Date; end_date: Date }): Promise<any> {
    const where = {
      created_at: {
        gte: filters.start_date,
        lte: filters.end_date,
      },
    };

    const [total, byAction, byResourceType, byActor] = await Promise.all([
      prisma.auditEvent.count({ where }),
      prisma.auditEvent.groupBy({
        by: ['action'],
        where,
        _count: true,
      }),
      prisma.auditEvent.groupBy({
        by: ['resource_type'],
        where,
        _count: true,
      }),
      prisma.auditEvent.groupBy({
        by: ['actor_id'],
        where,
        _count: true,
        orderBy: { _count: { actor_id: 'desc' } },
        take: 10,
      }),
    ]);

    return {
      type: 'audit_log',
      period: {
        start: filters.start_date,
        end: filters.end_date,
      },
      summary: {
        total_events: total,
        by_action: byAction,
        by_resource_type: byResourceType,
        top_actors: byActor,
      },
    };
  }

  /**
   * Generate consent report
   */
  private async generateConsentReport(filters: { start_date: Date; end_date: Date }): Promise<any> {
    const where = {
      created_at: {
        gte: filters.start_date,
        lte: filters.end_date,
      },
    };

    const [totalGranted, totalRevoked, byType] = await Promise.all([
      prisma.consent.count({
        where: {
          ...where,
          status: 'granted',
        },
      }),
      prisma.consent.count({
        where: {
          ...where,
          status: 'revoked',
        },
      }),
      prisma.consent.groupBy({
        by: ['consent_type'],
        where,
        _count: true,
      }),
    ]);

    return {
      type: 'consent',
      period: {
        start: filters.start_date,
        end: filters.end_date,
      },
      summary: {
        total_granted: totalGranted,
        total_revoked: totalRevoked,
        by_type: byType,
      },
    };
  }

  /**
   * Generate verification report
   */
  private async generateVerificationReport(filters: { start_date: Date; end_date: Date }): Promise<any> {
    const where = {
      updated_at: {
        gte: filters.start_date,
        lte: filters.end_date,
      },
    };

    const [totalVerified, totalPending, totalRejected] = await Promise.all([
      prisma.studentProfile.count({
        where: {
          ...where,
          verification_status: 'verified',
        },
      }),
      prisma.studentProfile.count({
        where: {
          ...where,
          verification_status: 'pending',
        },
      }),
      prisma.studentProfile.count({
        where: {
          ...where,
          verification_status: 'rejected',
        },
      }),
    ]);

    return {
      type: 'verification',
      period: {
        start: filters.start_date,
        end: filters.end_date,
      },
      summary: {
        total_verified: totalVerified,
        total_pending: totalPending,
        total_rejected: totalRejected,
      },
    };
  }

  /**
   * Generate security report
   */
  private async generateSecurityReport(filters: { start_date: Date; end_date: Date }): Promise<any> {
    const where = {
      created_at: {
        gte: filters.start_date,
        lte: filters.end_date,
      },
    };

    const [failedLogins, successfulLogins, suspiciousActivities] = await Promise.all([
      prisma.loginHistory.count({
        where: {
          ...where,
          success: false,
        },
      }),
      prisma.loginHistory.count({
        where: {
          ...where,
          success: true,
        },
      }),
      prisma.auditEvent.count({
        where: {
          ...where,
          action: { in: ['DELETE', 'EXPORT'] },
        },
      }),
    ]);

    return {
      type: 'security',
      period: {
        start: filters.start_date,
        end: filters.end_date,
      },
      summary: {
        failed_logins: failedLogins,
        successful_logins: successfulLogins,
        suspicious_activities: suspiciousActivities,
      },
    };
  }

  /**
   * Export audit logs to CSV
   */
  async exportToCSV(filters: {
    start_date: Date;
    end_date: Date;
  }): Promise<string> {
    try {
      const { logs } = await this.getLogs({
        start_date: filters.start_date,
        end_date: filters.end_date,
        limit: 10000, // Max export limit
      });

      // CSV header
      const header = 'Timestamp,Actor,Action,Resource Type,Resource ID,IP Address,Changes\n';

      // CSV rows
      const rows = logs.map(log => {
        const timestamp = new Date(log.created_at).toISOString();
        const actor = log.actor?.email || log.actor_id;
        const changes = JSON.stringify(log.changes || {}).replace(/"/g, '""');
        
        return `"${timestamp}","${actor}","${log.action}","${log.resource_type}","${log.resource_id || ''}","${log.ip_address || ''}","${changes}"`;
      }).join('\n');

      return header + rows;
    } catch (error) {
      console.error('[Audit] Error exporting to CSV:', error);
      return '';
    }
  }

  /**
   * Get audit statistics
   */
  async getStatistics(filters: {
    start_date?: Date;
    end_date?: Date;
  }): Promise<any> {
    try {
      const where: any = {};

      if (filters.start_date || filters.end_date) {
        where.created_at = {};
        if (filters.start_date) where.created_at.gte = filters.start_date;
        if (filters.end_date) where.created_at.lte = filters.end_date;
      }

      const [total, byAction, byResourceType, recentActivity] = await Promise.all([
        prisma.auditEvent.count({ where }),
        prisma.auditEvent.groupBy({
          by: ['action'],
          where,
          _count: true,
        }),
        prisma.auditEvent.groupBy({
          by: ['resource_type'],
          where,
          _count: true,
        }),
        prisma.auditEvent.findMany({
          where,
          orderBy: { created_at: 'desc' },
          take: 10,
          include: {
            actor: {
              select: {
                email: true,
                role: true,
              },
            },
          },
        }),
      ]);

      return {
        total,
        by_action: byAction.reduce((acc, item) => {
          acc[item.action] = item._count;
          return acc;
        }, {} as Record<string, number>),
        by_resource_type: byResourceType.reduce((acc, item) => {
          acc[item.resource_type] = item._count;
          return acc;
        }, {} as Record<string, number>),
        recent_activity: recentActivity,
      };
    } catch (error) {
      console.error('[Audit] Error getting statistics:', error);
      return null;
    }
  }
}

// Export singleton instance
export const auditService = new AuditService();
