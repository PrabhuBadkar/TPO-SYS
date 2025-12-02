/**
 * Calendar Routes
 * Handles calendar and event-related endpoints
 */

import { Router, Request, Response } from 'express';
import { calendarService, EventPayload, RSVPStatus } from '../services/calendar.service';
import { googleCalendarService } from '../services/google-calendar.service';
import { icsFeedService } from '../services/ics-feed.service';

const router = Router();

/**
 * PUBLIC ROUTES (All authenticated users)
 */

/**
 * GET /api/public/calendar/events
 * Get events for current user
 */
router.get('/public/calendar/events', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || 'test-user-id';
    const { start, end, type } = req.query;

    const events = await calendarService.getEvents({
      start: start ? new Date(start as string) : undefined,
      end: end ? new Date(end as string) : undefined,
      type: type as any,
      userId,
    });

    res.json({
      success: true,
      count: events.length,
      events,
    });
  } catch (error) {
    console.error('[Calendar] Error getting events:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get events',
    });
  }
});

/**
 * GET /api/public/calendar/events/:id
 * Get event details
 */
router.get('/public/calendar/events/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const event = await calendarService.getEventById(id);

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found',
      });
    }

    res.json({
      success: true,
      event,
    });
  } catch (error) {
    console.error('[Calendar] Error getting event:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get event',
    });
  }
});

/**
 * POST /api/public/calendar/events/:id/rsvp
 * RSVP to event
 */
router.post('/public/calendar/events/:id/rsvp', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id || 'test-user-id';
    const { status } = req.body;

    if (!['attending', 'not_attending', 'tentative'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid RSVP status',
      });
    }

    const rsvp = await calendarService.rsvpToEvent(id, userId, status as RSVPStatus);

    res.json({
      success: true,
      message: 'RSVP recorded successfully',
      rsvp,
    });
  } catch (error: any) {
    console.error('[Calendar] Error recording RSVP:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to record RSVP',
    });
  }
});

/**
 * GET /api/public/calendar/upcoming
 * Get upcoming events for current user
 */
router.get('/public/calendar/upcoming', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || 'test-user-id';
    const limit = parseInt(req.query.limit as string) || 10;

    const events = await calendarService.getUserUpcomingEvents(userId, limit);

    res.json({
      success: true,
      count: events.length,
      events,
    });
  } catch (error) {
    console.error('[Calendar] Error getting upcoming events:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get upcoming events',
    });
  }
});

/**
 * INTERNAL ROUTES (TPO Admin, TPO Dept)
 */

/**
 * POST /api/internal/calendar/events/create
 * Create new event
 */
router.post('/internal/calendar/events/create', async (req: Request, res: Response) => {
  try {
    const createdBy = (req as any).user?.id || 'test-admin-id';
    const payload: EventPayload = req.body;

    // Validate payload
    if (!payload.title || !payload.start_time || !payload.end_time) {
      return res.status(400).json({
        success: false,
        error: 'Title, start_time, and end_time are required',
      });
    }

    // Check for conflicts
    if (payload.attendees) {
      const conflicts = await calendarService.checkConflicts(
        new Date(payload.start_time),
        new Date(payload.end_time),
        payload.attendees
      );

      if (conflicts.length > 0) {
        return res.status(409).json({
          success: false,
          error: 'Event conflicts with existing events',
          conflicts,
        });
      }
    }

    const event = await calendarService.createEvent(payload, createdBy);

    res.json({
      success: true,
      message: 'Event created successfully',
      event,
    });
  } catch (error) {
    console.error('[Calendar] Error creating event:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create event',
    });
  }
});

/**
 * PUT /api/internal/calendar/events/:id/update
 * Update event
 */
router.put('/internal/calendar/events/:id/update', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates: Partial<EventPayload> = req.body;

    const event = await calendarService.updateEvent(id, updates);

    res.json({
      success: true,
      message: 'Event updated successfully',
      event,
    });
  } catch (error) {
    console.error('[Calendar] Error updating event:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update event',
    });
  }
});

/**
 * DELETE /api/internal/calendar/events/:id/delete
 * Delete event
 */
router.delete('/internal/calendar/events/:id/delete', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const success = await calendarService.deleteEvent(id);

    if (success) {
      res.json({
        success: true,
        message: 'Event deleted successfully',
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Failed to delete event',
      });
    }
  } catch (error) {
    console.error('[Calendar] Error deleting event:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete event',
    });
  }
});

/**
 * GET /api/internal/calendar/events/:id/rsvps
 * Get RSVPs for event
 */
router.get('/internal/calendar/events/:id/rsvps', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const rsvps = await calendarService.getEventRSVPs(id);

    res.json({
      success: true,
      count: rsvps.length,
      rsvps,
    });
  } catch (error) {
    console.error('[Calendar] Error getting RSVPs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get RSVPs',
    });
  }
});

/**
 * POST /api/internal/calendar/events/:id/attendance
 * Mark attendance for event
 */
router.post('/internal/calendar/events/:id/attendance', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { attendees } = req.body; // Array of {userId, attended}

    if (!Array.isArray(attendees)) {
      return res.status(400).json({
        success: false,
        error: 'Attendees must be an array',
      });
    }

    const count = await calendarService.bulkMarkAttendance(id, attendees);

    res.json({
      success: true,
      message: `Attendance marked for ${count} attendees`,
      count,
    });
  } catch (error) {
    console.error('[Calendar] Error marking attendance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark attendance',
    });
  }
});

/**
 * GET /api/internal/calendar/events/:id/attendance
 * Get attendance for event
 */
router.get('/internal/calendar/events/:id/attendance', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const attendance = await calendarService.getEventAttendance(id);

    res.json({
      success: true,
      count: attendance.length,
      attendance,
    });
  } catch (error) {
    console.error('[Calendar] Error getting attendance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get attendance',
    });
  }
});

/**
 * GET /api/internal/calendar/events/:id/stats
 * Get event statistics
 */
router.get('/internal/calendar/events/:id/stats', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const stats = await calendarService.getEventStats(id);

    if (!stats) {
      return res.status(404).json({
        success: false,
        error: 'Event not found',
      });
    }

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('[Calendar] Error getting stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get event statistics',
    });
  }
});

/**
 * POST /api/internal/calendar/check-conflicts
 * Check for event conflicts
 */
router.post('/internal/calendar/check-conflicts', async (req: Request, res: Response) => {
  try {
    const { start_time, end_time, attendees } = req.body;

    if (!start_time || !end_time) {
      return res.status(400).json({
        success: false,
        error: 'start_time and end_time are required',
      });
    }

    const conflicts = await calendarService.checkConflicts(
      new Date(start_time),
      new Date(end_time),
      attendees || []
    );

    res.json({
      success: true,
      has_conflicts: conflicts.length > 0,
      count: conflicts.length,
      conflicts,
    });
  } catch (error) {
    console.error('[Calendar] Error checking conflicts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check conflicts',
    });
  }
});

/**
 * CALENDAR INTEGRATION ROUTES
 */

/**
 * GET /api/public/calendar/sync/google/authorize
 * Get Google Calendar authorization URL
 */
router.get('/public/calendar/sync/google/authorize', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || 'test-user-id';

    const authUrl = googleCalendarService.getAuthorizationUrl(userId);

    res.json({
      success: true,
      auth_url: authUrl,
    });
  } catch (error) {
    console.error('[Calendar] Error getting auth URL:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get authorization URL',
    });
  }
});

/**
 * GET /api/public/calendar/sync/google/callback
 * Google Calendar OAuth callback
 */
router.get('/public/calendar/sync/google/callback', async (req: Request, res: Response) => {
  try {
    const { code, state } = req.query;
    const userId = state as string;

    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Authorization code not provided',
      });
    }

    // Exchange code for tokens
    const tokens = await googleCalendarService.exchangeCodeForTokens(code as string);

    if (tokens) {
      // Save tokens
      await googleCalendarService.saveTokens(userId, tokens);

      res.send('<html><body><h1>Google Calendar Connected!</h1><p>You can close this window.</p><script>window.close();</script></body></html>');
    } else {
      res.status(400).send('<html><body><h1>Failed to connect Google Calendar</h1><p>Please try again.</p></body></html>');
    }
  } catch (error) {
    console.error('[Calendar] Error in OAuth callback:', error);
    res.status(500).send('<html><body><h1>Error</h1><p>An error occurred during authorization.</p></body></html>');
  }
});

/**
 * POST /api/public/calendar/sync/google/disconnect
 * Disconnect Google Calendar
 */
router.post('/public/calendar/sync/google/disconnect', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || 'test-user-id';

    const success = await googleCalendarService.disconnect(userId);

    res.json({
      success,
      message: success ? 'Google Calendar disconnected' : 'Failed to disconnect',
    });
  } catch (error) {
    console.error('[Calendar] Error disconnecting:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to disconnect Google Calendar',
    });
  }
});

/**
 * GET /api/public/calendar/ics-feed
 * Get ICS feed URL for user
 */
router.get('/public/calendar/ics-feed', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || 'test-user-id';

    // Generate or get existing token
    const token = await icsFeedService.generateFeedToken(userId);
    const feedUrl = icsFeedService.getFeedUrl(token);

    res.json({
      success: true,
      feed_url: feedUrl,
      message: 'Copy this URL to your calendar app to subscribe to your events',
    });
  } catch (error) {
    console.error('[Calendar] Error generating ICS feed URL:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate ICS feed URL',
    });
  }
});

/**
 * GET /api/public/calendar/feed/:token.ics
 * Serve ICS feed
 */
router.get('/public/calendar/feed/:token.ics', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    // Verify token and get user ID
    const userId = await icsFeedService.verifyFeedToken(token.replace('.ics', ''));

    if (!userId) {
      return res.status(401).send('Invalid or expired feed token');
    }

    // Generate ICS feed
    const icsContent = await icsFeedService.generateICSFeed(userId);

    // Set headers for ICS file
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="tpo-calendar.ics"');
    res.send(icsContent);
  } catch (error) {
    console.error('[Calendar] Error serving ICS feed:', error);
    res.status(500).send('Error generating calendar feed');
  }
});

export default router;
