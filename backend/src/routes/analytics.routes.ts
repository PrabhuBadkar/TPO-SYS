/**
 * Analytics Routes
 * Comprehensive analytics and reporting endpoints
 */

import { Router, Request, Response } from 'express';
import { analyticsService } from '../services/analytics.service';

const router = Router();

/**
 * INTERNAL ROUTES (TPO Admin/Dept Coordinator)
 */

/**
 * GET /api/internal/admin/analytics/placement-overview
 * Get placement overview
 */
router.get('/internal/admin/analytics/placement-overview', async (req: Request, res: Response) => {
  try {
    const filters: any = {};

    if (req.query.department) filters.department = req.query.department as string;
    if (req.query.graduation_year) filters.graduation_year = req.query.graduation_year as string;
    if (req.query.start_date) filters.start_date = new Date(req.query.start_date as string);
    if (req.query.end_date) filters.end_date = new Date(req.query.end_date as string);

    const result = await analyticsService.getPlacementOverview(filters);

    res.json(result);
  } catch (error: any) {
    console.error('[Analytics] Error getting placement overview:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get placement overview',
    });
  }
});

/**
 * GET /api/internal/admin/analytics/company-statistics
 * Get company statistics
 */
router.get('/internal/admin/analytics/company-statistics', async (req: Request, res: Response) => {
  try {
    const filters: any = {};

    if (req.query.start_date) filters.start_date = new Date(req.query.start_date as string);
    if (req.query.end_date) filters.end_date = new Date(req.query.end_date as string);

    const result = await analyticsService.getCompanyStatistics(filters);

    res.json(result);
  } catch (error: any) {
    console.error('[Analytics] Error getting company statistics:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get company statistics',
    });
  }
});

/**
 * GET /api/internal/admin/analytics/salary-statistics
 * Get salary statistics
 */
router.get('/internal/admin/analytics/salary-statistics', async (req: Request, res: Response) => {
  try {
    const filters: any = {};

    if (req.query.department) filters.department = req.query.department as string;

    const result = await analyticsService.getSalaryStatistics(filters);

    res.json(result);
  } catch (error: any) {
    console.error('[Analytics] Error getting salary statistics:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get salary statistics',
    });
  }
});

/**
 * GET /api/internal/admin/analytics/department-statistics
 * Get department-wise statistics
 */
router.get('/internal/admin/analytics/department-statistics', async (req: Request, res: Response) => {
  try {
    const result = await analyticsService.getDepartmentStatistics();

    res.json(result);
  } catch (error: any) {
    console.error('[Analytics] Error getting department statistics:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get department statistics',
    });
  }
});

/**
 * GET /api/internal/admin/analytics/application-funnel
 * Get application funnel
 */
router.get('/internal/admin/analytics/application-funnel', async (req: Request, res: Response) => {
  try {
    const filters: any = {};

    if (req.query.start_date) filters.start_date = new Date(req.query.start_date as string);
    if (req.query.end_date) filters.end_date = new Date(req.query.end_date as string);

    const result = await analyticsService.getApplicationFunnel(filters);

    res.json(result);
  } catch (error: any) {
    console.error('[Analytics] Error getting application funnel:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get application funnel',
    });
  }
});

/**
 * GET /api/internal/admin/analytics/timeline
 * Get timeline data
 */
router.get('/internal/admin/analytics/timeline', async (req: Request, res: Response) => {
  try {
    const filters: any = {};

    if (req.query.start_date) filters.start_date = new Date(req.query.start_date as string);
    if (req.query.end_date) filters.end_date = new Date(req.query.end_date as string);

    const result = await analyticsService.getTimelineData(filters);

    res.json(result);
  } catch (error: any) {
    console.error('[Analytics] Error getting timeline data:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get timeline data',
    });
  }
});

/**
 * POST /api/internal/admin/analytics/custom-report
 * Generate custom report
 */
router.post('/internal/admin/analytics/custom-report', async (req: Request, res: Response) => {
  try {
    const result = await analyticsService.generateCustomReport(req.body);

    res.json(result);
  } catch (error: any) {
    console.error('[Analytics] Error generating custom report:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate custom report',
    });
  }
});

export default router;
