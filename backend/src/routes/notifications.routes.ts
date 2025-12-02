/**
 * Notification Routes
 * Handles notification-related endpoints for all roles
 */

import { Router, Request, Response } from 'express';
import { notificationService, NotificationPayload } from '../services/notification.service';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

/**
 * PUBLIC ROUTES (Students, Recruiters, TPO)
 */

/**
 * GET /api/public/notifications/unread
 * Get unread notifications for current user
 */
router.get('/public/notifications/unread', async (req: Request, res: Response) => {
  try {
    // TODO: Get user ID from auth middleware
    const userId = (req as any).user?.id || 'test-user-id';

    const notifications = await notificationService.getUnread(userId);

    res.json({
      success: true,
      count: notifications.length,
      notifications,
    });
  } catch (error) {
    console.error('[Notifications] Error getting unread:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get unread notifications',
    });
  }
});

/**
 * GET /api/public/notifications/list
 * Get all notifications for current user
 */
router.get('/public/notifications/list', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || 'test-user-id';
    const limit = parseInt(req.query.limit as string) || 50;

    const notifications = await notificationService.getHistory(userId, limit);

    res.json({
      success: true,
      count: notifications.length,
      notifications,
    });
  } catch (error) {
    console.error('[Notifications] Error getting list:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get notifications',
    });
  }
});

/**
 * PUT /api/public/notifications/:id/mark-read
 * Mark notification as read
 */
router.put('/public/notifications/:id/mark-read', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const success = await notificationService.markAsRead(id);

    if (success) {
      res.json({
        success: true,
        message: 'Notification marked as read',
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Failed to mark notification as read',
      });
    }
  } catch (error) {
    console.error('[Notifications] Error marking as read:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark notification as read',
    });
  }
});

/**
 * PUT /api/public/notifications/mark-all-read
 * Mark all notifications as read for current user
 */
router.put('/public/notifications/mark-all-read', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || 'test-user-id';

    const success = await notificationService.markAllAsRead(userId);

    if (success) {
      res.json({
        success: true,
        message: 'All notifications marked as read',
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Failed to mark all notifications as read',
      });
    }
  } catch (error) {
    console.error('[Notifications] Error marking all as read:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark all notifications as read',
    });
  }
});

/**
 * GET /api/public/notifications/preferences
 * Get notification preferences for current user
 */
router.get('/public/notifications/preferences', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || 'test-user-id';

    // Get user's notification preferences from profile
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        studentProfile: {
          select: { notification_preferences: true },
        },
      },
    });

    const preferences = user?.studentProfile?.notification_preferences || {
      email: true,
      sms: true,
      push: true,
      dnd_windows: [],
    };

    res.json({
      success: true,
      preferences,
    });
  } catch (error) {
    console.error('[Notifications] Error getting preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get notification preferences',
    });
  }
});

/**
 * PUT /api/public/notifications/preferences
 * Update notification preferences for current user
 */
router.put('/public/notifications/preferences', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || 'test-user-id';
    const { email, sms, push, dnd_windows } = req.body;

    // Update user's notification preferences
    await prisma.studentProfile.updateMany({
      where: { user_id: userId },
      data: {
        notification_preferences: {
          email: email !== undefined ? email : true,
          sms: sms !== undefined ? sms : true,
          push: push !== undefined ? push : true,
          dnd_windows: dnd_windows || [],
        },
      },
    });

    res.json({
      success: true,
      message: 'Notification preferences updated',
    });
  } catch (error) {
    console.error('[Notifications] Error updating preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update notification preferences',
    });
  }
});

/**
 * INTERNAL ROUTES (TPO Admin, TPO Dept)
 */

/**
 * POST /api/internal/notifications/send
 * Send notification to users
 */
router.post('/internal/notifications/send', async (req: Request, res: Response) => {
  try {
    const payload: NotificationPayload = req.body;

    // Validate payload
    if (!payload.recipients || payload.recipients.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Recipients are required',
      });
    }

    if (!payload.type) {
      return res.status(400).json({
        success: false,
        error: 'Notification type is required',
      });
    }

    if (!payload.message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required',
      });
    }

    // Send notification
    const result = await notificationService.send(payload);

    res.json({
      success: result.success,
      sent: result.sent,
      failed: result.failed,
      message: `Sent ${result.sent} notifications, ${result.failed} failed`,
    });
  } catch (error) {
    console.error('[Notifications] Error sending:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send notifications',
    });
  }
});

/**
 * POST /api/internal/notifications/bulk-send
 * Send bulk notifications (with filters)
 */
router.post('/internal/notifications/bulk-send', async (req: Request, res: Response) => {
  try {
    const { filters, type, template, subject, message, variables, priority } = req.body;

    // Build query based on filters
    const where: any = {};
    
    if (filters.role) {
      where.role = filters.role;
    }
    
    if (filters.department) {
      where.studentProfile = {
        department: filters.department,
      };
    }

    if (filters.year) {
      where.studentProfile = {
        ...where.studentProfile,
        expected_graduation_year: filters.year,
      };
    }

    // Get matching users
    const users = await prisma.user.findMany({
      where,
      select: { id: true },
    });

    const recipients = users.map(u => u.id);

    console.log(`[Notifications] Bulk send to ${recipients.length} users`);

    // Send notifications
    const result = await notificationService.send({
      recipients,
      type,
      template,
      subject,
      message,
      variables,
      priority,
    });

    res.json({
      success: result.success,
      sent: result.sent,
      failed: result.failed,
      total: recipients.length,
      message: `Sent ${result.sent} notifications to ${recipients.length} users`,
    });
  } catch (error) {
    console.error('[Notifications] Error bulk sending:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send bulk notifications',
    });
  }
});

/**
 * GET /api/internal/notifications/history
 * Get notification history (admin only)
 */
router.get('/internal/notifications/history', async (req: Request, res: Response) => {
  try {
    const { userId, type, status, limit } = req.query;

    const where: any = {};
    
    if (userId) where.user_id = userId as string;
    if (type) where.type = type as string;
    if (status) where.status = status as string;

    const notifications = await prisma.notificationOutbox.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take: parseInt(limit as string) || 100,
      include: {
        user: {
          select: {
            email: true,
            role: true,
          },
        },
      },
    });

    res.json({
      success: true,
      count: notifications.length,
      notifications,
    });
  } catch (error) {
    console.error('[Notifications] Error getting history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get notification history',
    });
  }
});

/**
 * GET /api/internal/notifications/stats
 * Get notification statistics
 */
router.get('/internal/notifications/stats', async (req: Request, res: Response) => {
  try {
    const { start, end } = req.query;

    const where: any = {};
    
    if (start && end) {
      where.created_at = {
        gte: new Date(start as string),
        lte: new Date(end as string),
      };
    }

    const [total, sent, failed, read] = await Promise.all([
      prisma.notificationOutbox.count({ where }),
      prisma.notificationOutbox.count({ where: { ...where, status: 'sent' } }),
      prisma.notificationOutbox.count({ where: { ...where, status: 'failed' } }),
      prisma.notificationOutbox.count({ where: { ...where, status: 'read' } }),
    ]);

    // Get counts by type
    const byType = await prisma.notificationOutbox.groupBy({
      by: ['type'],
      where,
      _count: true,
    });

    res.json({
      success: true,
      stats: {
        total,
        sent,
        failed,
        read,
        byType: byType.reduce((acc, item) => {
          acc[item.type] = item._count;
          return acc;
        }, {} as Record<string, number>),
      },
    });
  } catch (error) {
    console.error('[Notifications] Error getting stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get notification statistics',
    });
  }
});

/**
 * POST /api/internal/notifications/test
 * Send test notification (for testing purposes)
 */
router.post('/internal/notifications/test', async (req: Request, res: Response) => {
  try {
    const { type, recipient } = req.body;

    const result = await notificationService.send({
      recipients: [recipient],
      type,
      subject: 'Test Notification',
      message: 'This is a test notification from the TPO Management System.',
      priority: 'normal',
    });

    res.json({
      success: result.success,
      message: result.success ? 'Test notification sent successfully' : 'Failed to send test notification',
    });
  } catch (error) {
    console.error('[Notifications] Error sending test:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send test notification',
    });
  }
});

export default router;
