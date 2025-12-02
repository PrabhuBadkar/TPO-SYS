import { Router, Request, Response } from 'express';
import { prisma } from '../server';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// =====================================================
// CALENDAR MANAGEMENT ENDPOINTS
// =====================================================

// GET /api/internal/admin/calendar/events
router.get('/events', async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, eventType, department } = req.query;

    const where: any = {};

    // Filter by date range
    if (startDate && endDate) {
      where.event_date = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    }

    // Filter by event type
    if (eventType) {
      where.event_type = eventType;
    }

    // Filter by department
    if (department) {
      where.department = department;
    }

    const events = await prisma.event.findMany({
      where,
      orderBy: {
        event_date: 'asc',
      },
      include: {
        createdBy: {
          select: {
            email: true,
          },
        },
      },
    });

    const formatted = events.map((event) => ({
      id: event.id,
      title: event.title,
      description: event.description,
      eventType: event.event_type,
      eventDate: event.event_date.toISOString(),
      startTime: event.start_time,
      endTime: event.end_time,
      location: event.location,
      isOnline: event.is_online,
      meetingLink: event.meeting_link,
      department: event.department,
      targetAudience: event.target_audience,
      rsvpRequired: event.rsvp_required,
      rsvpDeadline: event.rsvp_deadline?.toISOString(),
      maxAttendees: event.max_attendees,
      attachments: event.attachments,
      reminderSettings: event.reminder_settings,
      createdBy: event.created_by,
      createdByEmail: event.createdBy?.email,
      createdAt: event.created_at.toISOString(),
      updatedAt: event.updated_at.toISOString(),
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch events',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/internal/admin/calendar/events/:id
router.get('/events/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            email: true,
          },
        },
        rsvps: {
          include: {
            user: {
              select: {
                email: true,
              },
            },
          },
        },
      },
    });

    if (!event) {
      res.status(404).json({
        success: false,
        error: 'Event not found',
      });
      return;
    }

    res.json({
      id: event.id,
      title: event.title,
      description: event.description,
      eventType: event.event_type,
      eventDate: event.event_date.toISOString(),
      startTime: event.start_time,
      endTime: event.end_time,
      location: event.location,
      isOnline: event.is_online,
      meetingLink: event.meeting_link,
      department: event.department,
      targetAudience: event.target_audience,
      rsvpRequired: event.rsvp_required,
      rsvpDeadline: event.rsvp_deadline?.toISOString(),
      maxAttendees: event.max_attendees,
      attachments: event.attachments,
      reminderSettings: event.reminder_settings,
      createdBy: event.created_by,
      createdByEmail: event.createdBy?.email,
      rsvps: event.rsvps.map(rsvp => ({
        id: rsvp.id,
        userId: rsvp.user_id,
        userEmail: rsvp.user.email,
        status: rsvp.status,
        respondedAt: rsvp.responded_at?.toISOString(),
      })),
      rsvpCount: {
        attending: event.rsvps.filter(r => r.status === 'ATTENDING').length,
        notAttending: event.rsvps.filter(r => r.status === 'NOT_ATTENDING').length,
        tentative: event.rsvps.filter(r => r.status === 'TENTATIVE').length,
      },
      createdAt: event.created_at.toISOString(),
      updatedAt: event.updated_at.toISOString(),
    });
  } catch (error) {
    console.error('Error fetching event details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch event details',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// POST /api/internal/admin/calendar/events
router.post('/events', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      title,
      description,
      eventType,
      eventDate,
      startTime,
      endTime,
      location,
      isOnline,
      meetingLink,
      department,
      targetAudience,
      rsvpRequired,
      rsvpDeadline,
      maxAttendees,
      attachments,
      reminderSettings,
    } = req.body;

    const userId = (req as any).user?.id;

    if (!title || !eventType || !eventDate) {
      res.status(400).json({
        success: false,
        error: 'Title, event type, and event date are required',
      });
      return;
    }

    const event = await prisma.event.create({
      data: {
        title,
        description,
        event_type: eventType,
        event_date: new Date(eventDate),
        start_time: startTime,
        end_time: endTime,
        location,
        is_online: isOnline || false,
        meeting_link: meetingLink,
        department,
        target_audience: targetAudience || ['ALL'],
        rsvp_required: rsvpRequired || false,
        rsvp_deadline: rsvpDeadline ? new Date(rsvpDeadline) : null,
        max_attendees: maxAttendees,
        attachments: attachments || [],
        reminder_settings: reminderSettings || { enabled: true, times: ['24h', '2h'] },
        created_by: userId,
      },
    });

    // TODO: Send notifications to target audience
    // TODO: Create calendar invites
    // TODO: Create audit log entry

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      eventId: event.id,
    });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create event',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// PUT /api/internal/admin/calendar/events/:id
router.put('/events/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      eventType,
      eventDate,
      startTime,
      endTime,
      location,
      isOnline,
      meetingLink,
      department,
      targetAudience,
      rsvpRequired,
      rsvpDeadline,
      maxAttendees,
      attachments,
      reminderSettings,
    } = req.body;

    await prisma.event.update({
      where: { id },
      data: {
        title,
        description,
        event_type: eventType,
        event_date: eventDate ? new Date(eventDate) : undefined,
        start_time: startTime,
        end_time: endTime,
        location,
        is_online: isOnline,
        meeting_link: meetingLink,
        department,
        target_audience: targetAudience,
        rsvp_required: rsvpRequired,
        rsvp_deadline: rsvpDeadline ? new Date(rsvpDeadline) : null,
        max_attendees: maxAttendees,
        attachments,
        reminder_settings: reminderSettings,
        updated_at: new Date(),
      },
    });

    // TODO: Notify attendees of changes
    // TODO: Update calendar invites
    // TODO: Create audit log entry

    res.json({
      success: true,
      message: 'Event updated successfully',
    });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update event',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// DELETE /api/internal/admin/calendar/events/:id
router.delete('/events/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    await prisma.event.delete({
      where: { id },
    });

    // TODO: Notify attendees of cancellation
    // TODO: Delete calendar invites
    // TODO: Create audit log entry

    res.json({
      success: true,
      message: 'Event deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete event',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/internal/admin/calendar/stats
router.get('/stats', async (req: Request, res: Response): Promise<void> => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const totalEvents = await prisma.event.count();
    
    const upcomingEvents = await prisma.event.count({
      where: {
        event_date: {
          gte: now,
        },
      },
    });

    const eventsThisMonth = await prisma.event.count({
      where: {
        event_date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    });

    const eventsByType = await prisma.event.groupBy({
      by: ['event_type'],
      _count: {
        id: true,
      },
    });

    res.json({
      totalEvents,
      upcomingEvents,
      eventsThisMonth,
      eventsByType: eventsByType.map(e => ({
        type: e.event_type,
        count: e._count.id,
      })),
    });
  } catch (error) {
    console.error('Error fetching calendar stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch calendar stats',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
