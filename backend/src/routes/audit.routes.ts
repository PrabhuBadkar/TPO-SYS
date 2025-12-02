/**
 * Audit Routes
 * Endpoints for audit logs and compliance reports
 */

import { Router, Request, Response } from 'express';
import { auditService } from '../services/audit.service';

const router = Router();

/**
 * INTERNAL ROUTES (TPO Admin only)
 */

/**
 * GET /api/internal/audit/logs
 * Get audit logs with filters
 */
router.get('/internal/audit/logs', async (req: Request, res: Response) => {
  try {
    const {
      actor_id,
      action,
      resource_type,
      resource_id,
      start_date,
      end_date,
      limit,
      offset,
    } = req.query;

    const filters: any = {};
    if (actor_id) filters.actor_id = actor_id as string;
    if (action) filters.action = action as any;
    if (resource_type) filters.resource_type = resource_type as any;
    if (resource_id) filters.resource_id = resource_id as string;
    if (start_date) filters.start_date = new Date(start_date as string);
    if (end_date) filters.end_date = new Date(end_date as string);
    if (limit) filters.limit = parseInt(limit as string);
    if (offset) filters.offset = parseInt(offset as string);

    const result = await auditService.getLogs(filters);

    res.json({
      success: true,
      logs: result.logs,
      total: result.total,
      page: Math.floor((filters.offset || 0) / (filters.limit || 100)) + 1,
      pages: Math.ceil(result.total / (filters.limit || 100)),
    });
  } catch (error) {
    console.error('[Audit] Error getting logs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get audit logs',
    });
  }
});

/**
 * GET /api/internal/audit/resource/:type/:id
 * Get audit history for a specific resource
 */
router.get('/internal/audit/resource/:type/:id', async (req: Request, res: Response) => {
  try {
    const { type, id } = req.params;

    const history = await auditService.getResourceHistory(type as any, id);

    res.json({
      success: true,
      history,
      count: history.length,
    });
  } catch (error) {
    console.error('[Audit] Error getting resource history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get resource history',
    });
  }
});

/**
 * GET /api/internal/audit/user/:id/activity
 * Get user activity
 */
router.get('/internal/audit/user/:id/activity', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;

    const activity = await auditService.getUserActivity(id, limit);

    res.json({
      success: true,
      activity,
      count: activity.length,
    });
  } catch (error) {
    console.error('[Audit] Error getting user activity:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user activity',
    });
  }
});

/**
 * GET /api/internal/audit/statistics
 * Get audit statistics
 */
router.get('/internal/audit/statistics', async (req: Request, res: Response) => {
  try {
    const { start_date, end_date } = req.query;

    const filters: any = {};
    if (start_date) filters.start_date = new Date(start_date as string);
    if (end_date) filters.end_date = new Date(end_date as string);

    const statistics = await auditService.getStatistics(filters);

    res.json({
      success: true,
      statistics,
    });
  } catch (error) {
    console.error('[Audit] Error getting statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get audit statistics',
    });
  }
});

/**
 * POST /api/internal/audit/reports/generate
 * Generate compliance report
 */
router.post('/internal/audit/reports/generate', async (req: Request, res: Response) => {
  try {
    const { type, start_date, end_date } = req.body;

    if (!type || !start_date || !end_date) {
      return res.status(400).json({
        success: false,
        error: 'Report type, start_date, and end_date are required',
      });
    }

    const report = await auditService.generateComplianceReport(type, {
      start_date: new Date(start_date),
      end_date: new Date(end_date),
    });

    if (!report) {
      return res.status(400).json({
        success: false,
        error: 'Failed to generate report',
      });
    }

    res.json({
      success: true,
      report,
    });
  } catch (error) {
    console.error('[Audit] Error generating report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate compliance report',
    });
  }
});

/**
 * GET /api/internal/audit/export/csv
 * Export audit logs to CSV
 */
router.get('/internal/audit/export/csv', async (req: Request, res: Response) => {
  try {
    const { start_date, end_date } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({
        success: false,
        error: 'start_date and end_date are required',
      });
    }

    const csv = await auditService.exportToCSV({
      start_date: new Date(start_date as string),
      end_date: new Date(end_date as string),
    });

    // Set headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="audit-logs-${start_date}-${end_date}.csv"`);
    res.send(csv);
  } catch (error) {
    console.error('[Audit] Error exporting CSV:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export audit logs',
    });
  }
});

/**
 * POST /api/internal/audit/log
 * Manually log an audit event (for testing)
 */
router.post('/internal/audit/log', async (req: Request, res: Response) => {
  try {
    const entry = req.body;

    await auditService.log(entry);

    res.json({
      success: true,
      message: 'Audit event logged successfully',
    });
  } catch (error) {
    console.error('[Audit] Error logging event:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to log audit event',
    });
  }
});

export default router;
