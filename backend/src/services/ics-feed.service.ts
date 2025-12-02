/**
 * ICS Feed Service
 * Generates ICS (iCalendar) feeds for calendar export
 */

import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

/**
 * ICS Feed Service
 */
export class ICSFeedService {
  /**
   * Generate ICS feed token for user
   */
  async generateFeedToken(userId: string): Promise<string> {
    try {
      // Generate unique token
      const token = crypto.randomBytes(32).toString('hex');

      // Store token in user profile or separate table
      // For now, we'll use a simple approach
      console.log('[ICSFeed] Generated token for user:', userId);

      // TODO: Store token in database
      // await prisma.calendarSyncToken.create({
      //   data: {
      //     user_id: userId,
      //     token,
      //     provider: 'ics_feed',
      //   },
      // });

      return token;
    } catch (error) {
      console.error('[ICSFeed] Error generating token:', error);
      throw error;
    }
  }

  /**
   * Verify feed token
   */
  async verifyFeedToken(token: string): Promise<string | null> {
    try {
      // TODO: Verify token from database
      // const syncToken = await prisma.calendarSyncToken.findFirst({
      //   where: { token, provider: 'ics_feed' },
      // });
      // return syncToken?.user_id || null;

      // Mock: return test user ID
      return 'test-user-id';
    } catch (error) {
      console.error('[ICSFeed] Error verifying token:', error);
      return null;
    }
  }

  /**
   * Generate ICS feed content
   */
  async generateICSFeed(userId: string): Promise<string> {
    try {
      // Get user's events
      const events = await prisma.event.findMany({
        where: {
          rsvps: {
            some: {
              user_id: userId,
            },
          },
        },
        orderBy: { start_time: 'asc' },
      });

      // Generate ICS content
      const icsLines: string[] = [];

      // Calendar header
      icsLines.push('BEGIN:VCALENDAR');
      icsLines.push('VERSION:2.0');
      icsLines.push('PRODID:-//TPO Management System//Calendar//EN');
      icsLines.push('CALSCALE:GREGORIAN');
      icsLines.push('METHOD:PUBLISH');
      icsLines.push('X-WR-CALNAME:TPO Events');
      icsLines.push('X-WR-TIMEZONE:UTC');

      // Add events
      for (const event of events) {
        icsLines.push('BEGIN:VEVENT');
        icsLines.push(`UID:${event.id}@tpo.edu`);
        icsLines.push(`DTSTAMP:${this.formatICSDate(new Date())}`);
        icsLines.push(`DTSTART:${this.formatICSDate(new Date(event.start_time))}`);
        icsLines.push(`DTEND:${this.formatICSDate(new Date(event.end_time))}`);
        icsLines.push(`SUMMARY:${this.escapeICSText(event.title)}`);
        
        if (event.description) {
          icsLines.push(`DESCRIPTION:${this.escapeICSText(event.description)}`);
        }
        
        if (event.location) {
          icsLines.push(`LOCATION:${this.escapeICSText(event.location)}`);
        }

        icsLines.push(`STATUS:CONFIRMED`);
        icsLines.push(`SEQUENCE:0`);
        icsLines.push('END:VEVENT');
      }

      // Calendar footer
      icsLines.push('END:VCALENDAR');

      return icsLines.join('\r\n');
    } catch (error) {
      console.error('[ICSFeed] Error generating ICS feed:', error);
      throw error;
    }
  }

  /**
   * Format date for ICS (YYYYMMDDTHHMMSSZ)
   */
  private formatICSDate(date: Date): string {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    const seconds = String(date.getUTCSeconds()).padStart(2, '0');

    return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
  }

  /**
   * Escape special characters for ICS
   */
  private escapeICSText(text: string): string {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n');
  }

  /**
   * Get feed URL for user
   */
  getFeedUrl(token: string): string {
    const baseUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    return `${baseUrl}/api/public/calendar/feed/${token}.ics`;
  }
}

// Export singleton instance
export const icsFeedService = new ICSFeedService();
