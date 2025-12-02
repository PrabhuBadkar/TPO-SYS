/**
 * Google Calendar Integration Service
 * Handles OAuth and syncing with Google Calendar
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Google Calendar Service
 */
export class GoogleCalendarService {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;

  constructor() {
    this.clientId = process.env.GOOGLE_CLIENT_ID || '';
    this.clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
    this.redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/public/calendar/sync/google/callback';
  }

  /**
   * Get authorization URL
   */
  getAuthorizationUrl(userId: string): string {
    const scopes = [
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/calendar.events',
    ];

    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: scopes.join(' '),
      access_type: 'offline',
      state: userId, // Pass user ID in state
      prompt: 'consent',
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(code: string): Promise<any> {
    try {
      // TODO: Implement actual Google OAuth token exchange
      // For now, return mock data
      console.log('[GoogleCalendar] Exchanging code for tokens:', code);

      if (!this.clientId || this.clientId === 'your-google-client-id') {
        console.warn('[GoogleCalendar] Client ID not configured');
        return null;
      }

      // In production, use googleapis package:
      // const { google } = require('googleapis');
      // const oauth2Client = new google.auth.OAuth2(
      //   this.clientId,
      //   this.clientSecret,
      //   this.redirectUri
      // );
      // const { tokens } = await oauth2Client.getToken(code);
      // return tokens;

      return {
        access_token: 'mock_access_token',
        refresh_token: 'mock_refresh_token',
        expiry_date: Date.now() + 3600000, // 1 hour
      };
    } catch (error) {
      console.error('[GoogleCalendar] Error exchanging code:', error);
      return null;
    }
  }

  /**
   * Save tokens to database
   */
  async saveTokens(userId: string, tokens: any): Promise<void> {
    try {
      // TODO: Create calendar_sync_tokens table or store in user profile
      console.log('[GoogleCalendar] Saving tokens for user:', userId);
      
      // For now, store in user metadata
      await prisma.user.update({
        where: { id: userId },
        data: {
          // metadata: {
          //   google_calendar_tokens: tokens,
          // },
        },
      });
    } catch (error) {
      console.error('[GoogleCalendar] Error saving tokens:', error);
    }
  }

  /**
   * Get tokens from database
   */
  async getTokens(userId: string): Promise<any> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        // select: { metadata: true },
      });

      // return user?.metadata?.google_calendar_tokens || null;
      return null;
    } catch (error) {
      console.error('[GoogleCalendar] Error getting tokens:', error);
      return null;
    }
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken: string): Promise<any> {
    try {
      console.log('[GoogleCalendar] Refreshing access token');

      if (!this.clientId || this.clientId === 'your-google-client-id') {
        console.warn('[GoogleCalendar] Client ID not configured');
        return null;
      }

      // In production:
      // const { google } = require('googleapis');
      // const oauth2Client = new google.auth.OAuth2(
      //   this.clientId,
      //   this.clientSecret,
      //   this.redirectUri
      // );
      // oauth2Client.setCredentials({ refresh_token: refreshToken });
      // const { credentials } = await oauth2Client.refreshAccessToken();
      // return credentials;

      return {
        access_token: 'mock_refreshed_access_token',
        expiry_date: Date.now() + 3600000,
      };
    } catch (error) {
      console.error('[GoogleCalendar] Error refreshing token:', error);
      return null;
    }
  }

  /**
   * Sync events to Google Calendar
   */
  async syncEventsToGoogle(userId: string, events: any[]): Promise<number> {
    try {
      const tokens = await this.getTokens(userId);
      if (!tokens) {
        console.warn('[GoogleCalendar] No tokens found for user:', userId);
        return 0;
      }

      console.log(`[GoogleCalendar] Syncing ${events.length} events to Google Calendar`);

      // In production:
      // const { google } = require('googleapis');
      // const oauth2Client = new google.auth.OAuth2(
      //   this.clientId,
      //   this.clientSecret,
      //   this.redirectUri
      // );
      // oauth2Client.setCredentials(tokens);
      // const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
      
      // let synced = 0;
      // for (const event of events) {
      //   await calendar.events.insert({
      //     calendarId: 'primary',
      //     requestBody: {
      //       summary: event.title,
      //       description: event.description,
      //       location: event.location,
      //       start: { dateTime: event.start_time },
      //       end: { dateTime: event.end_time },
      //     },
      //   });
      //   synced++;
      // }
      // return synced;

      return events.length; // Mock: all events synced
    } catch (error) {
      console.error('[GoogleCalendar] Error syncing events:', error);
      return 0;
    }
  }

  /**
   * Import events from Google Calendar
   */
  async importEventsFromGoogle(userId: string): Promise<any[]> {
    try {
      const tokens = await this.getTokens(userId);
      if (!tokens) {
        console.warn('[GoogleCalendar] No tokens found for user:', userId);
        return [];
      }

      console.log('[GoogleCalendar] Importing events from Google Calendar');

      // In production:
      // const { google } = require('googleapis');
      // const oauth2Client = new google.auth.OAuth2(
      //   this.clientId,
      //   this.clientSecret,
      //   this.redirectUri
      // );
      // oauth2Client.setCredentials(tokens);
      // const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
      
      // const response = await calendar.events.list({
      //   calendarId: 'primary',
      //   timeMin: new Date().toISOString(),
      //   maxResults: 100,
      //   singleEvents: true,
      //   orderBy: 'startTime',
      // });
      
      // return response.data.items || [];

      return []; // Mock: no events imported
    } catch (error) {
      console.error('[GoogleCalendar] Error importing events:', error);
      return [];
    }
  }

  /**
   * Disconnect Google Calendar
   */
  async disconnect(userId: string): Promise<boolean> {
    try {
      console.log('[GoogleCalendar] Disconnecting for user:', userId);

      // Remove tokens from database
      await prisma.user.update({
        where: { id: userId },
        data: {
          // metadata: {
          //   google_calendar_tokens: null,
          // },
        },
      });

      return true;
    } catch (error) {
      console.error('[GoogleCalendar] Error disconnecting:', error);
      return false;
    }
  }
}

// Export singleton instance
export const googleCalendarService = new GoogleCalendarService();
