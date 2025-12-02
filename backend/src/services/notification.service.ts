/**
 * Notification Service
 * Handles email, SMS, and push notifications
 * Supports templates, rate limiting, and delivery tracking
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Notification types
export type NotificationType = 'email' | 'sms' | 'push' | 'in-app';
export type NotificationPriority = 'critical' | 'high' | 'normal' | 'low';
export type NotificationStatus = 'pending' | 'sent' | 'delivered' | 'failed' | 'read';

// Notification payload interface
export interface NotificationPayload {
  recipients: string[]; // user IDs
  type: NotificationType;
  template?: string; // template name
  subject?: string; // for email
  message: string; // message body or template variables
  variables?: Record<string, any>; // template variables
  priority?: NotificationPriority;
  scheduledFor?: Date; // for scheduled notifications
  metadata?: Record<string, any>; // additional data
}

// Email provider interface
interface EmailProvider {
  send(to: string, subject: string, html: string): Promise<boolean>;
}

// SMS provider interface
interface SMSProvider {
  send(to: string, message: string): Promise<boolean>;
}

// Push provider interface
interface PushProvider {
  send(token: string, title: string, body: string, data?: any): Promise<boolean>;
  sendToTopic(topic: string, title: string, body: string, data?: any): Promise<boolean>;
}

/**
 * SendGrid Email Provider
 */
class SendGridProvider implements EmailProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async send(to: string, subject: string, html: string): Promise<boolean> {
    try {
      // TODO: Implement actual SendGrid API call
      // For now, log to console
      console.log('[SendGrid] Sending email:', { to, subject });
      console.log('[SendGrid] HTML:', html.substring(0, 100) + '...');
      
      // Simulate API call
      if (!this.apiKey || this.apiKey === 'your-sendgrid-api-key') {
        console.warn('[SendGrid] API key not configured, email not sent');
        return false;
      }

      // In production, use @sendgrid/mail:
      // const sgMail = require('@sendgrid/mail');
      // sgMail.setApiKey(this.apiKey);
      // await sgMail.send({ to, subject, html, from: 'noreply@tpo.edu' });
      
      return true;
    } catch (error) {
      console.error('[SendGrid] Error sending email:', error);
      return false;
    }
  }
}

/**
 * Twilio SMS Provider
 */
class TwilioProvider implements SMSProvider {
  private accountSid: string;
  private authToken: string;
  private fromNumber: string;

  constructor(accountSid: string, authToken: string, fromNumber: string) {
    this.accountSid = accountSid;
    this.authToken = authToken;
    this.fromNumber = fromNumber;
  }

  async send(to: string, message: string): Promise<boolean> {
    try {
      // TODO: Implement actual Twilio API call
      // For now, log to console
      console.log('[Twilio] Sending SMS:', { to, from: this.fromNumber });
      console.log('[Twilio] Message:', message);
      
      // Simulate API call
      if (!this.accountSid || this.accountSid === 'your-twilio-account-sid') {
        console.warn('[Twilio] Credentials not configured, SMS not sent');
        return false;
      }

      // In production, use twilio:
      // const client = require('twilio')(this.accountSid, this.authToken);
      // await client.messages.create({ body: message, from: this.fromNumber, to });
      
      return true;
    } catch (error) {
      console.error('[Twilio] Error sending SMS:', error);
      return false;
    }
  }
}

/**
 * Firebase Cloud Messaging Provider
 */
class FCMProvider implements PushProvider {
  private serverKey: string;

  constructor(serverKey: string) {
    this.serverKey = serverKey;
  }

  async send(token: string, title: string, body: string, data?: any): Promise<boolean> {
    try {
      // TODO: Implement actual FCM API call
      // For now, log to console
      console.log('[FCM] Sending push notification:', { token, title, body });
      if (data) console.log('[FCM] Data:', data);
      
      // Simulate API call
      if (!this.serverKey || this.serverKey === 'your-firebase-server-key') {
        console.warn('[FCM] Server key not configured, push notification not sent');
        return false;
      }

      // In production, use firebase-admin:
      // const admin = require('firebase-admin');
      // await admin.messaging().send({ token, notification: { title, body }, data });
      
      return true;
    } catch (error) {
      console.error('[FCM] Error sending push notification:', error);
      return false;
    }
  }

  async sendToTopic(topic: string, title: string, body: string, data?: any): Promise<boolean> {
    try {
      console.log('[FCM] Sending to topic:', { topic, title, body });
      if (data) console.log('[FCM] Data:', data);
      
      if (!this.serverKey || this.serverKey === 'your-firebase-server-key') {
        console.warn('[FCM] Server key not configured, push notification not sent');
        return false;
      }

      // In production:
      // const admin = require('firebase-admin');
      // await admin.messaging().send({ topic, notification: { title, body }, data });
      
      return true;
    } catch (error) {
      console.error('[FCM] Error sending to topic:', error);
      return false;
    }
  }
}

/**
 * Main Notification Service
 */
export class NotificationService {
  private emailProvider: EmailProvider;
  private smsProvider: SMSProvider;
  private pushProvider: PushProvider;

  // Rate limiting configuration
  private rateLimits = {
    student: { email: 10, sms: 5, push: 100 }, // per day
    recruiter: { email: 50, sms: 20, push: 200 },
    tpo_dept: { email: 100, sms: 50, push: 500 },
    tpo_admin: { email: 200, sms: 100, push: 1000 },
  };

  // Global rate limits (per hour)
  private globalLimits = {
    email: 10000,
    sms: 1000,
    push: 50000,
  };

  constructor() {
    // Initialize providers with environment variables
    this.emailProvider = new SendGridProvider(
      process.env.SENDGRID_API_KEY || 'your-sendgrid-api-key'
    );
    
    this.smsProvider = new TwilioProvider(
      process.env.TWILIO_ACCOUNT_SID || 'your-twilio-account-sid',
      process.env.TWILIO_AUTH_TOKEN || 'your-twilio-auth-token',
      process.env.TWILIO_PHONE_NUMBER || '+1234567890'
    );
    
    this.pushProvider = new FCMProvider(
      process.env.FIREBASE_SERVER_KEY || 'your-firebase-server-key'
    );
  }

  /**
   * Send notification
   */
  async send(payload: NotificationPayload): Promise<{ success: boolean; sent: number; failed: number }> {
    const { recipients, type, template, subject, message, variables, priority, scheduledFor, metadata } = payload;

    console.log(`[NotificationService] Sending ${type} notification to ${recipients.length} recipients`);

    let sent = 0;
    let failed = 0;

    // Process each recipient
    for (const userId of recipients) {
      try {
        // Check rate limits
        const canSend = await this.checkRateLimit(userId, type);
        if (!canSend) {
          console.warn(`[NotificationService] Rate limit exceeded for user ${userId}`);
          failed++;
          continue;
        }

        // Get user details
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { email: true, mobile_number: true, role: true },
        });

        if (!user) {
          console.warn(`[NotificationService] User ${userId} not found`);
          failed++;
          continue;
        }

        // Render message with template if provided
        let renderedMessage = message;
        if (template && variables) {
          renderedMessage = await this.renderTemplate(template, variables);
        }

        // Send based on type
        let success = false;
        switch (type) {
          case 'email':
            if (user.email) {
              success = await this.sendEmail(user.email, subject || 'Notification', renderedMessage);
            }
            break;
          case 'sms':
            if (user.mobile_number) {
              success = await this.sendSMS(user.mobile_number, renderedMessage);
            }
            break;
          case 'push':
            // TODO: Get device token from database
            success = await this.sendPush('device-token', subject || 'Notification', renderedMessage);
            break;
          case 'in-app':
            success = await this.sendInApp(userId, subject || 'Notification', renderedMessage, metadata);
            break;
        }

        if (success) {
          sent++;
          // Log to notifications.outbox
          await this.logNotification(userId, type, subject || '', renderedMessage, 'sent', metadata);
        } else {
          failed++;
          await this.logNotification(userId, type, subject || '', renderedMessage, 'failed', metadata);
        }

      } catch (error) {
        console.error(`[NotificationService] Error sending to user ${userId}:`, error);
        failed++;
      }
    }

    console.log(`[NotificationService] Sent: ${sent}, Failed: ${failed}`);
    return { success: sent > 0, sent, failed };
  }

  /**
   * Send email
   */
  private async sendEmail(to: string, subject: string, html: string): Promise<boolean> {
    return await this.emailProvider.send(to, subject, html);
  }

  /**
   * Send SMS
   */
  private async sendSMS(to: string, message: string): Promise<boolean> {
    return await this.smsProvider.send(to, message);
  }

  /**
   * Send push notification
   */
  private async sendPush(token: string, title: string, body: string, data?: any): Promise<boolean> {
    return await this.pushProvider.send(token, title, body, data);
  }

  /**
   * Send in-app notification
   */
  private async sendInApp(userId: string, title: string, message: string, metadata?: any): Promise<boolean> {
    try {
      await prisma.notificationOutbox.create({
        data: {
          user_id: userId,
          type: 'in-app',
          title,
          message,
          status: 'sent',
          metadata: metadata || {},
          sent_at: new Date(),
        },
      });
      return true;
    } catch (error) {
      console.error('[NotificationService] Error creating in-app notification:', error);
      return false;
    }
  }

  /**
   * Render template with variables
   */
  private async renderTemplate(templateName: string, variables: Record<string, any>): Promise<string> {
    try {
      // Get template from database
      const template = await prisma.notificationTemplate.findFirst({
        where: { template_id: templateName, is_active: true },
      });

      if (!template) {
        console.warn(`[NotificationService] Template ${templateName} not found`);
        return JSON.stringify(variables);
      }

      // Use HTML template if available, otherwise body template
      let rendered = template.html_template || template.body_template;
      
      // Simple variable replacement
      for (const [key, value] of Object.entries(variables)) {
        rendered = rendered.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
      }

      return rendered;
    } catch (error) {
      console.error('[NotificationService] Error rendering template:', error);
      return JSON.stringify(variables);
    }
  }

  /**
   * Check rate limit for user
   */
  private async checkRateLimit(userId: string, type: NotificationType): Promise<boolean> {
    try {
      // Get user role
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      if (!user) return false;

      // Get role-specific limits
      const roleKey = user.role.toLowerCase().replace('role_', '') as keyof typeof this.rateLimits;
      const limits = this.rateLimits[roleKey] || this.rateLimits.student;

      // Count notifications sent today
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const count = await prisma.notificationOutbox.count({
        where: {
          user_id: userId,
          type,
          created_at: { gte: today },
        },
      });

      const limit = limits[type as keyof typeof limits] || 10;
      return count < limit;
    } catch (error) {
      console.error('[NotificationService] Error checking rate limit:', error);
      return true; // Allow on error
    }
  }

  /**
   * Log notification to database
   */
  private async logNotification(
    userId: string,
    type: string,
    title: string,
    message: string,
    status: string,
    metadata?: any
  ): Promise<void> {
    try {
      await prisma.notificationOutbox.create({
        data: {
          user_id: userId,
          type,
          title,
          message,
          status,
          metadata: metadata || {},
          sent_at: status === 'sent' ? new Date() : null,
        },
      });
    } catch (error) {
      console.error('[NotificationService] Error logging notification:', error);
    }
  }

  /**
   * Get notification history for user
   */
  async getHistory(userId: string, limit: number = 50): Promise<any[]> {
    try {
      return await prisma.notificationOutbox.findMany({
        where: { user_id: userId },
        orderBy: { created_at: 'desc' },
        take: limit,
      });
    } catch (error) {
      console.error('[NotificationService] Error getting history:', error);
      return [];
    }
  }

  /**
   * Get unread notifications for user
   */
  async getUnread(userId: string): Promise<any[]> {
    try {
      return await prisma.notificationOutbox.findMany({
        where: {
          user_id: userId,
          type: 'in-app',
          status: { in: ['sent', 'delivered'] },
        },
        orderBy: { created_at: 'desc' },
      });
    } catch (error) {
      console.error('[NotificationService] Error getting unread:', error);
      return [];
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<boolean> {
    try {
      await prisma.notificationOutbox.update({
        where: { id: notificationId },
        data: { status: 'read', read_at: new Date() },
      });
      return true;
    } catch (error) {
      console.error('[NotificationService] Error marking as read:', error);
      return false;
    }
  }

  /**
   * Mark all notifications as read for user
   */
  async markAllAsRead(userId: string): Promise<boolean> {
    try {
      await prisma.notificationOutbox.updateMany({
        where: {
          user_id: userId,
          type: 'in-app',
          status: { in: ['sent', 'delivered'] },
        },
        data: { status: 'read', read_at: new Date() },
      });
      return true;
    } catch (error) {
      console.error('[NotificationService] Error marking all as read:', error);
      return false;
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
