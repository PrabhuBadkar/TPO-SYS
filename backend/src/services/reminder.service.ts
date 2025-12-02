/**
 * Reminder Service
 * Bulk and automated reminder system
 */

import { PrismaClient } from '@prisma/client';
import { notificationService } from './notification.service';

const prisma = new PrismaClient();

export type ReminderType = 
  | 'PROFILE_COMPLETION' | 'DOCUMENT_UPLOAD' | 'APPLICATION_DEADLINE'
  | 'VERIFICATION_PENDING' | 'INTERVIEW_PREPARATION' | 'CUSTOM';

export interface BulkReminderRequest {
  reminder_type: ReminderType;
  audience: {
    type: 'all' | 'department' | 'year' | 'custom';
    filter?: Record<string, any>;
  };
  message: {
    subject: string;
    body: string;
  };
  channels: string[];
  schedule?: Date;
}

export interface ReminderTemplate {
  type: ReminderType;
  trigger_condition: Record<string, any>;
  frequency: 'once' | 'daily' | 'weekly';
  channels: string[];
  message_template: string;
}

/**
 * Reminder Service
 */
export class ReminderService {
  /**
   * Send bulk reminder
   */
  async sendBulkReminder(request: BulkReminderRequest, senderId: string): Promise<any> {
    try {
      // Get target users based on audience
      const users = await this.getTargetUsers(request.audience);

      if (users.length === 0) {
        return {
          success: false,
          error: 'No users match the audience criteria',
        };
      }

      // If scheduled, save for later
      if (request.schedule && request.schedule > new Date()) {
        return await this.scheduleReminder(request, users, senderId);
      }

      // Send immediately
      const results = await this.sendToUsers(users, request.message, request.channels);

      // Log reminder history
      await this.logReminderHistory({
        reminder_type: request.reminder_type,
        sender_id: senderId,
        recipient_count: users.length,
        channels: request.channels,
        message: request.message,
        sent_at: new Date(),
      });

      console.log('[Reminder] Bulk reminder sent to', users.length, 'users');

      return {
        success: true,
        sent_count: results.success,
        failed_count: results.failed,
        total_recipients: users.length,
      };
    } catch (error) {
      console.error('[Reminder] Error sending bulk reminder:', error);
      throw new Error('Failed to send bulk reminder');
    }
  }

  /**
   * Create reminder template
   */
  async createTemplate(template: ReminderTemplate, creatorId: string): Promise<any> {
    try {
      const created = await prisma.reminderTemplate.create({
        data: {
          type: template.type,
          trigger_condition: template.trigger_condition,
          frequency: template.frequency,
          channels: template.channels,
          message_template: template.message_template,
          created_by: creatorId,
          is_active: true,
        },
      });

      console.log('[Reminder] Template created:', created.id);

      return {
        success: true,
        template: created,
      };
    } catch (error) {
      console.error('[Reminder] Error creating template:', error);
      throw new Error('Failed to create reminder template');
    }
  }

  /**
   * Get active templates
   */
  async getActiveTemplates(): Promise<any> {
    try {
      const templates = await prisma.reminderTemplate.findMany({
        where: { is_active: true },
        orderBy: { created_at: 'desc' },
      });

      return {
        success: true,
        templates,
        count: templates.length,
      };
    } catch (error) {
      console.error('[Reminder] Error getting templates:', error);
      throw new Error('Failed to get reminder templates');
    }
  }

  /**
   * Process automated reminders
   */
  async processAutomatedReminders(): Promise<any> {
    try {
      const templates = await prisma.reminderTemplate.findMany({
        where: { is_active: true },
      });

      let processed = 0;
      let sent = 0;

      for (const template of templates) {
        const users = await this.getUsersMatchingCondition(template.trigger_condition);
        
        if (users.length > 0) {
          // Check if reminder should be sent based on frequency
          const shouldSend = await this.shouldSendReminder(template, users);
          
          if (shouldSend) {
            const message = this.renderTemplate(template.message_template, {});
            await this.sendToUsers(users, { subject: 'Reminder', body: message }, template.channels);
            sent += users.length;
          }
        }
        
        processed++;
      }

      console.log('[Reminder] Processed', processed, 'templates, sent', sent, 'reminders');

      return {
        success: true,
        templates_processed: processed,
        reminders_sent: sent,
      };
    } catch (error) {
      console.error('[Reminder] Error processing automated reminders:', error);
      throw new Error('Failed to process automated reminders');
    }
  }

  /**
   * Get reminder history
   */
  async getReminderHistory(filters?: {
    reminder_type?: ReminderType;
    start_date?: Date;
    end_date?: Date;
    limit?: number;
  }): Promise<any> {
    try {
      const where: any = {};

      if (filters?.reminder_type) {
        where.reminder_type = filters.reminder_type;
      }

      if (filters?.start_date || filters?.end_date) {
        where.sent_at = {};
        if (filters.start_date) where.sent_at.gte = filters.start_date;
        if (filters.end_date) where.sent_at.lte = filters.end_date;
      }

      const history = await prisma.reminderHistory.findMany({
        where,
        orderBy: { sent_at: 'desc' },
        take: filters?.limit || 100,
        include: {
          sender: {
            select: {
              email: true,
              role: true,
            },
          },
        },
      });

      return {
        success: true,
        history,
        count: history.length,
      };
    } catch (error) {
      console.error('[Reminder] Error getting history:', error);
      throw new Error('Failed to get reminder history');
    }
  }

  /**
   * Get reminder analytics
   */
  async getAnalytics(filters?: {
    start_date?: Date;
    end_date?: Date;
  }): Promise<any> {
    try {
      const where: any = {};

      if (filters?.start_date || filters?.end_date) {
        where.sent_at = {};
        if (filters.start_date) where.sent_at.gte = filters.start_date;
        if (filters.end_date) where.sent_at.lte = filters.end_date;
      }

      const [total, byType, byChannel] = await Promise.all([
        prisma.reminderHistory.count({ where }),
        prisma.reminderHistory.groupBy({
          by: ['reminder_type'],
          where,
          _count: true,
          _sum: { recipient_count: true },
        }),
        prisma.reminderHistory.findMany({
          where,
          select: { channels: true, recipient_count: true },
        }),
      ]);

      // Calculate channel statistics
      const channelStats: Record<string, number> = {};
      byChannel.forEach(item => {
        item.channels.forEach(channel => {
          channelStats[channel] = (channelStats[channel] || 0) + item.recipient_count;
        });
      });

      return {
        success: true,
        analytics: {
          total_reminders: total,
          total_recipients: byType.reduce((sum, item) => sum + (item._sum.recipient_count || 0), 0),
          by_type: byType,
          by_channel: channelStats,
        },
      };
    } catch (error) {
      console.error('[Reminder] Error getting analytics:', error);
      throw new Error('Failed to get reminder analytics');
    }
  }

  /**
   * Get target users based on audience criteria
   */
  private async getTargetUsers(audience: BulkReminderRequest['audience']): Promise<any[]> {
    const where: any = { role: 'student' };

    if (audience.type === 'department' && audience.filter?.department) {
      where.studentProfile = {
        department: audience.filter.department,
      };
    } else if (audience.type === 'year' && audience.filter?.graduation_year) {
      where.studentProfile = {
        graduation_year: audience.filter.graduation_year,
      };
    } else if (audience.type === 'custom' && audience.filter) {
      // Apply custom filters
      Object.assign(where, audience.filter);
    }

    return await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        studentProfile: {
          select: {
            full_name: true,
            enrollment_number: true,
          },
        },
      },
    });
  }

  /**
   * Send reminders to users
   */
  private async sendToUsers(
    users: any[],
    message: { subject: string; body: string },
    channels: string[]
  ): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const user of users) {
      try {
        await notificationService.sendNotification({
          user_id: user.id,
          type: 'reminder',
          title: message.subject,
          message: message.body,
          channels: channels as any,
        });
        success++;
      } catch (error) {
        console.error('[Reminder] Failed to send to user:', user.id, error);
        failed++;
      }
    }

    return { success, failed };
  }

  /**
   * Schedule reminder for later
   */
  private async scheduleReminder(
    request: BulkReminderRequest,
    users: any[],
    senderId: string
  ): Promise<any> {
    // In production, this would use a job queue (Bull, BullMQ, etc.)
    // For now, we'll just log it
    console.log('[Reminder] Scheduled reminder for', request.schedule);

    return {
      success: true,
      scheduled: true,
      scheduled_for: request.schedule,
      recipient_count: users.length,
    };
  }

  /**
   * Log reminder history
   */
  private async logReminderHistory(data: {
    reminder_type: ReminderType;
    sender_id: string;
    recipient_count: number;
    channels: string[];
    message: { subject: string; body: string };
    sent_at: Date;
  }): Promise<void> {
    try {
      await prisma.reminderHistory.create({
        data: {
          reminder_type: data.reminder_type,
          sender_id: data.sender_id,
          recipient_count: data.recipient_count,
          channels: data.channels,
          message_subject: data.message.subject,
          message_body: data.message.body,
          sent_at: data.sent_at,
        },
      });
    } catch (error) {
      console.error('[Reminder] Error logging history:', error);
    }
  }

  /**
   * Get users matching condition
   */
  private async getUsersMatchingCondition(condition: Record<string, any>): Promise<any[]> {
    // Implement condition matching logic
    // For example: profile_completion < 80%, documents missing, etc.
    return [];
  }

  /**
   * Check if reminder should be sent based on frequency
   */
  private async shouldSendReminder(template: any, users: any[]): Promise<boolean> {
    // Implement frequency check logic
    // Check last sent time and frequency setting
    return true;
  }

  /**
   * Render template with variables
   */
  private renderTemplate(template: string, variables: Record<string, any>): string {
    let rendered = template;
    
    Object.keys(variables).forEach(key => {
      rendered = rendered.replace(new RegExp(`{{${key}}}`, 'g'), variables[key]);
    });

    return rendered;
  }
}

// Export singleton instance
export const reminderService = new ReminderService();
