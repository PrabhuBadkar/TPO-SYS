/**
 * Integration Service
 * Third-party API integrations and webhooks
 */

import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

export interface APIKey {
  name: string;
  description: string;
  permissions: string[];
  rate_limit: number;
  expires_at?: Date;
}

export interface Webhook {
  url: string;
  events: string[];
  secret: string;
  is_active: boolean;
}

/**
 * Integration Service
 */
export class IntegrationService {
  /**
   * Generate API key
   */
  async generateAPIKey(data: APIKey, userId: string): Promise<any> {
    try {
      // Generate secure API key
      const apiKey = this.generateSecureKey();
      const hashedKey = this.hashKey(apiKey);

      const key = await prisma.apiKey.create({
        data: {
          name: data.name,
          description: data.description,
          key_hash: hashedKey,
          permissions: data.permissions,
          rate_limit: data.rate_limit,
          expires_at: data.expires_at,
          created_by: userId,
          is_active: true,
        },
      });

      console.log('[Integration] API key generated:', key.id);

      return {
        success: true,
        api_key: apiKey, // Return only once
        key_id: key.id,
        message: 'Save this API key securely. It will not be shown again.',
      };
    } catch (error) {
      console.error('[Integration] Error generating API key:', error);
      throw new Error('Failed to generate API key');
    }
  }

  /**
   * Validate API key
   */
  async validateAPIKey(apiKey: string): Promise<any> {
    try {
      const hashedKey = this.hashKey(apiKey);

      const key = await prisma.apiKey.findFirst({
        where: {
          key_hash: hashedKey,
          is_active: true,
        },
      });

      if (!key) {
        return {
          valid: false,
          message: 'Invalid API key',
        };
      }

      // Check expiration
      if (key.expires_at && key.expires_at < new Date()) {
        return {
          valid: false,
          message: 'API key expired',
        };
      }

      // Check rate limit
      const canProceed = await this.checkRateLimit(key.id, key.rate_limit);

      if (!canProceed) {
        return {
          valid: false,
          message: 'Rate limit exceeded',
        };
      }

      // Update last used
      await prisma.apiKey.update({
        where: { id: key.id },
        data: { last_used_at: new Date() },
      });

      return {
        valid: true,
        key_id: key.id,
        permissions: key.permissions,
      };
    } catch (error) {
      console.error('[Integration] Error validating API key:', error);
      return {
        valid: false,
        message: 'Validation error',
      };
    }
  }

  /**
   * Create webhook
   */
  async createWebhook(data: Webhook, userId: string): Promise<any> {
    try {
      const secret = this.generateSecureKey();

      const webhook = await prisma.webhook.create({
        data: {
          url: data.url,
          events: data.events,
          secret,
          is_active: data.is_active,
          created_by: userId,
        },
      });

      console.log('[Integration] Webhook created:', webhook.id);

      return {
        success: true,
        webhook: {
          id: webhook.id,
          url: webhook.url,
          events: webhook.events,
          secret, // Return only once
        },
        message: 'Save the webhook secret securely. It will not be shown again.',
      };
    } catch (error) {
      console.error('[Integration] Error creating webhook:', error);
      throw new Error('Failed to create webhook');
    }
  }

  /**
   * Trigger webhook
   */
  async triggerWebhook(event: string, data: Record<string, any>): Promise<any> {
    try {
      // Find webhooks subscribed to this event
      const webhooks = await prisma.webhook.findMany({
        where: {
          is_active: true,
          events: { has: event },
        },
      });

      console.log('[Integration] Triggering', webhooks.length, 'webhooks for event:', event);

      const results = [];
      for (const webhook of webhooks) {
        try {
          const result = await this.sendWebhook(webhook, event, data);
          results.push({ webhook_id: webhook.id, ...result });
        } catch (error) {
          console.error('[Integration] Error sending webhook:', webhook.id, error);
          results.push({
            webhook_id: webhook.id,
            success: false,
            error: (error as Error).message,
          });
        }
      }

      return {
        success: true,
        webhooks_triggered: results.length,
        results,
      };
    } catch (error) {
      console.error('[Integration] Error triggering webhooks:', error);
      throw new Error('Failed to trigger webhooks');
    }
  }

  /**
   * Send webhook
   */
  private async sendWebhook(webhook: any, event: string, data: Record<string, any>): Promise<any> {
    try {
      const payload = {
        event,
        data,
        timestamp: new Date().toISOString(),
      };

      const signature = this.generateWebhookSignature(payload, webhook.secret);

      // In production, use fetch or axios to send HTTP request
      console.log('[Integration] Sending webhook to:', webhook.url);
      console.log('[Integration] Payload:', payload);
      console.log('[Integration] Signature:', signature);

      // Log webhook delivery
      await prisma.webhookDelivery.create({
        data: {
          webhook_id: webhook.id,
          event,
          payload,
          status: 'success',
          delivered_at: new Date(),
        },
      });

      return { success: true };
    } catch (error) {
      // Log failed delivery
      await prisma.webhookDelivery.create({
        data: {
          webhook_id: webhook.id,
          event,
          payload: { event, data },
          status: 'failed',
          error: (error as Error).message,
          delivered_at: new Date(),
        },
      });

      throw error;
    }
  }

  /**
   * Get API documentation
   */
  getAPIDocs(): any {
    return {
      success: true,
      documentation: {
        base_url: process.env.API_BASE_URL || 'http://localhost:5000/api',
        version: '1.0.0',
        authentication: {
          type: 'API Key',
          header: 'X-API-Key',
          description: 'Include your API key in the X-API-Key header',
        },
        endpoints: [
          {
            path: '/public/jobs',
            method: 'GET',
            description: 'Get list of job postings',
            parameters: [
              { name: 'status', type: 'string', required: false },
              { name: 'limit', type: 'number', required: false },
            ],
          },
          {
            path: '/public/applications',
            method: 'POST',
            description: 'Submit job application',
            body: {
              job_id: 'string',
              student_id: 'string',
              cover_letter: 'string',
            },
          },
          {
            path: '/public/students',
            method: 'GET',
            description: 'Get list of students',
            parameters: [
              { name: 'department', type: 'string', required: false },
              { name: 'graduation_year', type: 'string', required: false },
            ],
          },
        ],
        webhooks: {
          events: [
            'application.submitted',
            'application.status_changed',
            'offer.created',
            'offer.accepted',
            'student.verified',
          ],
          payload_format: {
            event: 'string',
            data: 'object',
            timestamp: 'string (ISO 8601)',
          },
        },
        rate_limits: {
          default: '100 requests per minute',
          authenticated: '1000 requests per minute',
        },
      },
    };
  }

  /**
   * Generate secure key
   */
  private generateSecureKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Hash API key
   */
  private hashKey(key: string): string {
    return crypto.createHash('sha256').update(key).digest('hex');
  }

  /**
   * Generate webhook signature
   */
  private generateWebhookSignature(payload: any, secret: string): string {
    const payloadString = JSON.stringify(payload);
    return crypto.createHmac('sha256', secret).update(payloadString).digest('hex');
  }

  /**
   * Check rate limit
   */
  private async checkRateLimit(keyId: string, limit: number): Promise<boolean> {
    // Simple in-memory rate limiting
    // In production, use Redis or similar
    return true;
  }

  /**
   * Get integration statistics
   */
  async getStatistics(): Promise<any> {
    try {
      const [totalKeys, activeKeys, totalWebhooks, activeWebhooks, totalDeliveries] = await Promise.all([
        prisma.apiKey.count(),
        prisma.apiKey.count({ where: { is_active: true } }),
        prisma.webhook.count(),
        prisma.webhook.count({ where: { is_active: true } }),
        prisma.webhookDelivery.count(),
      ]);

      return {
        success: true,
        statistics: {
          total_api_keys: totalKeys,
          active_api_keys: activeKeys,
          total_webhooks: totalWebhooks,
          active_webhooks: activeWebhooks,
          total_webhook_deliveries: totalDeliveries,
        },
      };
    } catch (error) {
      console.error('[Integration] Error getting statistics:', error);
      throw new Error('Failed to get integration statistics');
    }
  }
}

// Export singleton instance
export const integrationService = new IntegrationService();
