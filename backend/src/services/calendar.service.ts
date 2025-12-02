/**
 * Calendar Service
 * Handles events, RSVP, attendance tracking, and calendar integrations
 */

import { PrismaClient } from '@prisma/client';
import { notificationService } from './notification.service';

const prisma = new PrismaClient();

// Event types
export type EventType = 'placement_drive' | 'ppt' | 'test' | 'interview' | 'deadline' | 'meeting' | 'training' | 'other';
export type EventVisibility = 'public' | 'department' | 'role' | 'private';
export type RSVPStatus = 'attending' | 'not_attending' | 'tentative';

// Event payload interface
export interface EventPayload {
  title: string;
  description?: string;
  event_type: EventType;
  start_time: Date;
  end_time: Date;
  location?: string;
  visibility: EventVisibility;
  attendees?: string[]; // user IDs or 'all' or 'department:CSE'
  rsvp_required?: boolean;
  rsvp_deadline?: Date;
  reminders?: Array<{ time: string; channels: string[] }>; // e.g., [{time: '-72h', channels: ['email']}]
  metadata?: Record<string, any>;
}

/**
 * Main Calendar Service
 */
export class CalendarService {
  /**
   * Create event
   */
  async createEvent(payload: EventPayload, createdBy: string): Promise<any> {
    try {
      console.log('[CalendarService] Creating event:', payload.title);

      // Create event
      const event = await prisma.event.create({
        data: {
          title: payload.title,
          description: payload.description || '',
          event_type: payload.event_type,
          start_time: payload.start_time,
          end_time: payload.end_time,
          location: payload.location || '',
          visibility: payload.visibility,
          rsvp_required: payload.rsvp_required || false,
          rsvp_deadline: payload.rsvp_deadline,
          metadata: payload.metadata || {},
          created_by: createdBy,
        },
      });

      // Process attendees
      if (payload.attendees && payload.attendees.length > 0) {
        await this.addAttendees(event.id, payload.attendees);
      }

      // Schedule reminders
      if (payload.reminders && payload.reminders.length > 0) {
        await this.scheduleReminders(event.id, payload.reminders);
      }

      console.log('[CalendarService] Event created:', event.id);
      return event;
    } catch (error) {
      console.error('[CalendarService] Error creating event:', error);
      throw error;
    }
  }

  /**
   * Get events
   */
  async getEvents(filters: {
    start?: Date;
    end?: Date;
    type?: EventType;
    userId?: string;
    visibility?: EventVisibility;
  }): Promise<any[]> {
    try {
      const where: any = {};

      if (filters.start && filters.end) {
        where.start_time = {
          gte: filters.start,
          lte: filters.end,
        };
      }

      if (filters.type) {
        where.event_type = filters.type;
      }

      if (filters.visibility) {
        where.visibility = filters.visibility;
      }

      const events = await prisma.event.findMany({
        where,
        orderBy: { start_time: 'asc' },
        include: {
          rsvps: filters.userId ? {
            where: { user_id: filters.userId },
          } : false,
          attendance: filters.userId ? {
            where: { user_id: filters.userId },
          } : false,
        },
      });

      return events;
    } catch (error) {
      console.error('[CalendarService] Error getting events:', error);
      return [];
    }
  }

  /**
   * Get event by ID
   */
  async getEventById(eventId: string): Promise<any> {
    try {
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: {
          rsvps: {
            include: {
              user: {
                select: {
                  email: true,
                  studentProfile: {
                    select: {
                      full_name: true,
                      enrollment_number: true,
                    },
                  },
                },
              },
            },
          },
          attendance: {
            include: {
              user: {
                select: {
                  email: true,
                  studentProfile: {
                    select: {
                      full_name: true,
                      enrollment_number: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      return event;
    } catch (error) {
      console.error('[CalendarService] Error getting event:', error);
      return null;
    }
  }

  /**
   * Update event
   */
  async updateEvent(eventId: string, updates: Partial<EventPayload>): Promise<any> {
    try {
      const event = await prisma.event.update({
        where: { id: eventId },
        data: {
          title: updates.title,
          description: updates.description,
          event_type: updates.event_type,
          start_time: updates.start_time,
          end_time: updates.end_time,
          location: updates.location,
          visibility: updates.visibility,
          rsvp_required: updates.rsvp_required,
          rsvp_deadline: updates.rsvp_deadline,
          metadata: updates.metadata,
        },
      });

      // Notify attendees about update
      await this.notifyEventUpdate(eventId);

      return event;
    } catch (error) {
      console.error('[CalendarService] Error updating event:', error);
      throw error;
    }
  }

  /**
   * Delete event
   */
  async deleteEvent(eventId: string): Promise<boolean> {
    try {
      // Delete RSVPs and attendance first
      await prisma.rSVP.deleteMany({ where: { event_id: eventId } });
      await prisma.attendance.deleteMany({ where: { event_id: eventId } });

      // Delete event
      await prisma.event.delete({ where: { id: eventId } });

      console.log('[CalendarService] Event deleted:', eventId);
      return true;
    } catch (error) {
      console.error('[CalendarService] Error deleting event:', error);
      return false;
    }
  }

  /**
   * RSVP to event
   */
  async rsvpToEvent(eventId: string, userId: string, status: RSVPStatus): Promise<any> {
    try {
      // Check if event exists and RSVP is required
      const event = await prisma.event.findUnique({
        where: { id: eventId },
      });

      if (!event) {
        throw new Error('Event not found');
      }

      if (!event.rsvp_required) {
        throw new Error('RSVP not required for this event');
      }

      // Check RSVP deadline
      if (event.rsvp_deadline && new Date() > event.rsvp_deadline) {
        throw new Error('RSVP deadline has passed');
      }

      // Create or update RSVP
      const rsvp = await prisma.rSVP.upsert({
        where: {
          event_id_user_id: {
            event_id: eventId,
            user_id: userId,
          },
        },
        create: {
          event_id: eventId,
          user_id: userId,
          status,
          responded_at: new Date(),
        },
        update: {
          status,
          responded_at: new Date(),
        },
      });

      console.log('[CalendarService] RSVP recorded:', { eventId, userId, status });
      return rsvp;
    } catch (error) {
      console.error('[CalendarService] Error recording RSVP:', error);
      throw error;
    }
  }

  /**
   * Get RSVPs for event
   */
  async getEventRSVPs(eventId: string): Promise<any[]> {
    try {
      const rsvps = await prisma.rSVP.findMany({
        where: { event_id: eventId },
        include: {
          user: {
            select: {
              email: true,
              studentProfile: {
                select: {
                  full_name: true,
                  enrollment_number: true,
                  department: true,
                },
              },
            },
          },
        },
      });

      return rsvps;
    } catch (error) {
      console.error('[CalendarService] Error getting RSVPs:', error);
      return [];
    }
  }

  /**
   * Mark attendance
   */
  async markAttendance(eventId: string, userId: string, attended: boolean): Promise<any> {
    try {
      const attendance = await prisma.attendance.upsert({
        where: {
          event_id_user_id: {
            event_id: eventId,
            user_id: userId,
          },
        },
        create: {
          event_id: eventId,
          user_id: userId,
          attended,
          marked_at: new Date(),
        },
        update: {
          attended,
          marked_at: new Date(),
        },
      });

      // Track no-shows
      if (!attended) {
        await this.trackNoShow(userId);
      }

      return attendance;
    } catch (error) {
      console.error('[CalendarService] Error marking attendance:', error);
      throw error;
    }
  }

  /**
   * Bulk mark attendance
   */
  async bulkMarkAttendance(eventId: string, attendees: Array<{ userId: string; attended: boolean }>): Promise<number> {
    try {
      let count = 0;
      for (const attendee of attendees) {
        await this.markAttendance(eventId, attendee.userId, attendee.attended);
        count++;
      }
      return count;
    } catch (error) {
      console.error('[CalendarService] Error bulk marking attendance:', error);
      return 0;
    }
  }

  /**
   * Get attendance for event
   */
  async getEventAttendance(eventId: string): Promise<any[]> {
    try {
      const attendance = await prisma.attendance.findMany({
        where: { event_id: eventId },
        include: {
          user: {
            select: {
              email: true,
              studentProfile: {
                select: {
                  full_name: true,
                  enrollment_number: true,
                  department: true,
                },
              },
            },
          },
        },
      });

      return attendance;
    } catch (error) {
      console.error('[CalendarService] Error getting attendance:', error);
      return [];
    }
  }

  /**
   * Check for conflicts
   */
  async checkConflicts(startTime: Date, endTime: Date, attendees: string[]): Promise<any[]> {
    try {
      // Find overlapping events for the given attendees
      const conflicts = await prisma.event.findMany({
        where: {
          OR: [
            {
              start_time: {
                gte: startTime,
                lt: endTime,
              },
            },
            {
              end_time: {
                gt: startTime,
                lte: endTime,
              },
            },
            {
              AND: [
                { start_time: { lte: startTime } },
                { end_time: { gte: endTime } },
              ],
            },
          ],
        },
      });

      return conflicts;
    } catch (error) {
      console.error('[CalendarService] Error checking conflicts:', error);
      return [];
    }
  }

  /**
   * Add attendees to event
   */
  private async addAttendees(eventId: string, attendees: string[]): Promise<void> {
    try {
      // Process attendees (could be user IDs, 'all', or 'department:CSE')
      let userIds: string[] = [];

      for (const attendee of attendees) {
        if (attendee === 'all') {
          // Get all students
          const students = await prisma.user.findMany({
            where: { role: 'ROLE_STUDENT' },
            select: { id: true },
          });
          userIds = students.map(s => s.id);
        } else if (attendee.startsWith('department:')) {
          // Get students from specific department
          const dept = attendee.split(':')[1];
          const students = await prisma.user.findMany({
            where: {
              role: 'ROLE_STUDENT',
              studentProfile: {
                department: dept,
              },
            },
            select: { id: true },
          });
          userIds.push(...students.map(s => s.id));
        } else {
          // Individual user ID
          userIds.push(attendee);
        }
      }

      // Create RSVP entries for all attendees
      for (const userId of userIds) {
        await prisma.rSVP.create({
          data: {
            event_id: eventId,
            user_id: userId,
            status: 'tentative',
          },
        });
      }

      console.log(`[CalendarService] Added ${userIds.length} attendees to event ${eventId}`);
    } catch (error) {
      console.error('[CalendarService] Error adding attendees:', error);
    }
  }

  /**
   * Schedule reminders
   */
  private async scheduleReminders(eventId: string, reminders: Array<{ time: string; channels: string[] }>): Promise<void> {
    try {
      // TODO: Implement reminder scheduling
      // This would typically use a job queue (Bull, Agenda, etc.)
      console.log('[CalendarService] Reminders scheduled for event:', eventId);
    } catch (error) {
      console.error('[CalendarService] Error scheduling reminders:', error);
    }
  }

  /**
   * Notify attendees about event update
   */
  private async notifyEventUpdate(eventId: string): Promise<void> {
    try {
      const event = await this.getEventById(eventId);
      if (!event) return;

      const rsvps = await this.getEventRSVPs(eventId);
      const attendeeIds = rsvps.map(r => r.user_id);

      if (attendeeIds.length > 0) {
        await notificationService.send({
          recipients: attendeeIds,
          type: 'in-app',
          subject: 'Event Updated',
          message: `The event "${event.title}" has been updated. Please check the latest details.`,
          metadata: { event_id: eventId },
        });
      }
    } catch (error) {
      console.error('[CalendarService] Error notifying event update:', error);
    }
  }

  /**
   * Track no-show
   */
  private async trackNoShow(userId: string): Promise<void> {
    try {
      // TODO: Implement no-show tracking
      // Count no-shows and apply penalties if threshold exceeded
      const noShowCount = await prisma.attendance.count({
        where: {
          user_id: userId,
          attended: false,
        },
      });

      console.log(`[CalendarService] User ${userId} has ${noShowCount} no-shows`);

      // Apply penalty if threshold exceeded (e.g., 3 no-shows)
      if (noShowCount >= 3) {
        console.warn(`[CalendarService] User ${userId} exceeded no-show threshold`);
        // TODO: Apply suspension or warning
      }
    } catch (error) {
      console.error('[CalendarService] Error tracking no-show:', error);
    }
  }

  /**
   * Get user's upcoming events
   */
  async getUserUpcomingEvents(userId: string, limit: number = 10): Promise<any[]> {
    try {
      const events = await prisma.event.findMany({
        where: {
          start_time: {
            gte: new Date(),
          },
          rsvps: {
            some: {
              user_id: userId,
            },
          },
        },
        orderBy: { start_time: 'asc' },
        take: limit,
        include: {
          rsvps: {
            where: { user_id: userId },
          },
        },
      });

      return events;
    } catch (error) {
      console.error('[CalendarService] Error getting upcoming events:', error);
      return [];
    }
  }

  /**
   * Get event statistics
   */
  async getEventStats(eventId: string): Promise<any> {
    try {
      const [totalRSVPs, attending, notAttending, tentative, totalAttendance, attended] = await Promise.all([
        prisma.rSVP.count({ where: { event_id: eventId } }),
        prisma.rSVP.count({ where: { event_id: eventId, status: 'attending' } }),
        prisma.rSVP.count({ where: { event_id: eventId, status: 'not_attending' } }),
        prisma.rSVP.count({ where: { event_id: eventId, status: 'tentative' } }),
        prisma.attendance.count({ where: { event_id: eventId } }),
        prisma.attendance.count({ where: { event_id: eventId, attended: true } }),
      ]);

      return {
        rsvp: {
          total: totalRSVPs,
          attending,
          not_attending: notAttending,
          tentative,
        },
        attendance: {
          total: totalAttendance,
          attended,
          absent: totalAttendance - attended,
          attendance_rate: totalAttendance > 0 ? (attended / totalAttendance) * 100 : 0,
        },
      };
    } catch (error) {
      console.error('[CalendarService] Error getting event stats:', error);
      return null;
    }
  }
}

// Export singleton instance
export const calendarService = new CalendarService();
