/**
 * Reminder Routes
 * Bulk and automated reminder endpoints
 */

import { Router, Request, Response } from 'express';
import { reminderService } from '../services/reminder.service';

const router = Router();

/**
 * INTERNAL ROUTES (TPO Admin/Dept Coordinator)
 */

/**
 * POST /api/internal/admin/reminders/bulk-send
 * Send bulk reminder
 */
router.post('/internal/admin/reminders/bulk-send', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || 'test-admin-id';

    const result = await reminderService.sendBulkReminder(req.body, userId);

    res.json(result);
  } catch (error: any) {
    console.error('[Reminder] Error sending bulk reminder:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to send bulk reminder',
    });
  }
});

/**
 * POST /api/internal/admin/reminders/templates/create
 * Create reminder template
 */
router.post('/internal/admin/reminders/templates/create', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || 'test-admin-id';

    const result = await reminderService.createTemplate(req.body, userId);

    res.status(201).json(result);
  } catch (error: any) {
    console.error('[Reminder] Error creating template:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to create reminder template',
    });
  }
});

/**
 * GET /api/internal/admin/reminders/templates
 * Get active templates
 */
router.get('/internal/admin/reminders/templates', async (req: Request, res: Response) => {
  try {
    const result = await reminderService.getActiveTemplates();

    res.json(result);
  } catch (error: any) {
    console.error('[Reminder] Error getting templates:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get reminder templates',
    });
  }
});

/**
 * POST /api/internal/admin/reminders/process-automated
 * Process automated reminders (cron job endpoint)
 */
router.post('/internal/admin/reminders/process-automated', async (req: Request, res: Response) => {
  try {
    const result = await reminderService.processAutomatedReminders();

    res.json(result);
  } catch (error: any) {
    console.error('[Reminder] Error processing automated reminders:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process automated reminders',
    });
  }
});

/**
 * GET /api/internal/admin/reminders/history
 * Get reminder history
 */
router.get('/internal/admin/reminders/history', async (req: Request, res: Response) => {
  try {
    const filters: any = {};

    if (req.query.reminder_type) {
      filters.reminder_type = req.query.reminder_type;
    }

    if (req.query.start_date) {
      filters.start_date = new Date(req.query.start_date as string);
    }

    if (req.query.end_date) {
      filters.end_date = new Date(req.query.end_date as string);
    }

    if (req.query.limit) {
      filters.limit = parseInt(req.query.limit as string);
    }

    const result = await reminderService.getReminderHistory(filters);

    res.json(result);
  } catch (error: any) {
    console.error('[Reminder] Error getting history:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get reminder history',
    });
  }
});

/**
 * GET /api/internal/admin/reminders/analytics
 * Get reminder analytics
 */
router.get('/internal/admin/reminders/analytics', async (req: Request, res: Response) => {
  try {
    const filters: any = {};

    if (req.query.start_date) {
      filters.start_date = new Date(req.query.start_date as string);
    }

    if (req.query.end_date) {
      filters.end_date = new Date(req.query.end_date as string);
    }

    const result = await reminderService.getAnalytics(filters);

    res.json(result);
  } catch (error: any) {
    console.error('[Reminder] Error getting analytics:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get reminder analytics',
    });
  }
});

export default router;
