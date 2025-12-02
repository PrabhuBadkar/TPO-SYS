// Analytics Routes - Recruitment Metrics and Reports
import express from 'express';
import { AnalyticsService } from '../../services/recruiter/analyticsService';
import { authenticateToken } from '../../middleware/auth';

const router = express.Router();

/**
 * GET /api/public/recruiters/analytics/dashboard
 * Get recruitment dashboard metrics
 */
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const result = await AnalyticsService.getDashboardMetrics(userId);
    res.json(result);
  } catch (error: any) {
    console.error('Get dashboard metrics error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to get dashboard metrics'
    });
  }
});

/**
 * GET /api/public/recruiters/analytics/funnel
 * Get application funnel data
 */
router.get('/funnel', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const jobPostingId = req.query.job_posting_id as string;
    const result = await AnalyticsService.getApplicationFunnel(userId, jobPostingId);
    res.json(result);
  } catch (error: any) {
    console.error('Get application funnel error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to get application funnel'
    });
  }
});

/**
 * GET /api/public/recruiters/analytics/department-breakdown
 * Get department-wise application breakdown
 */
router.get('/department-breakdown', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const jobPostingId = req.query.job_posting_id as string;
    const result = await AnalyticsService.getDepartmentBreakdown(userId, jobPostingId);
    res.json(result);
  } catch (error: any) {
    console.error('Get department breakdown error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to get department breakdown'
    });
  }
});

/**
 * GET /api/public/recruiters/analytics/cgpa-distribution
 * Get CGPA distribution
 */
router.get('/cgpa-distribution', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const jobPostingId = req.query.job_posting_id as string;
    const result = await AnalyticsService.getCGPADistribution(userId, jobPostingId);
    res.json(result);
  } catch (error: any) {
    console.error('Get CGPA distribution error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to get CGPA distribution'
    });
  }
});

/**
 * GET /api/public/recruiters/analytics/time-to-fill
 * Get time-to-fill metrics
 */
router.get('/time-to-fill', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const result = await AnalyticsService.getTimeToFill(userId);
    res.json(result);
  } catch (error: any) {
    console.error('Get time to fill error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to get time-to-fill metrics'
    });
  }
});

/**
 * POST /api/public/recruiters/reports/generate
 * Export recruitment data
 */
router.post('/reports/generate', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const { report_type, filters } = req.body;

    if (!report_type) {
      return res.status(400).json({
        success: false,
        message: 'Report type is required'
      });
    }

    const result = await AnalyticsService.exportRecruitmentData(userId, report_type, filters);
    res.json(result);
  } catch (error: any) {
    console.error('Export recruitment data error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to export recruitment data'
    });
  }
});

export default router;
