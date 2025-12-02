// Application Routes - View and Manage Student Applications
import express from 'express';
import { ApplicationService } from '../../services/recruiter/applicationService';
import { authenticateToken } from '../../middleware/auth';

const router = express.Router();

/**
 * GET /api/public/recruiters/applications/list
 * Get all applications
 */
router.get('/list', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const filters = {
      job_posting_id: req.query.job_posting_id as string,
      status: req.query.status as string,
      cgpa_min: req.query.cgpa_min ? parseFloat(req.query.cgpa_min as string) : undefined,
      cgpa_max: req.query.cgpa_max ? parseFloat(req.query.cgpa_max as string) : undefined,
      department: req.query.department as string,
      date_from: req.query.date_from ? new Date(req.query.date_from as string) : undefined,
      date_to: req.query.date_to ? new Date(req.query.date_to as string) : undefined,
      search: req.query.search as string
    };

    const result = await ApplicationService.getApplications(userId, filters);
    res.json(result);
  } catch (error: any) {
    console.error('Get applications error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to get applications'
    });
  }
});

/**
 * GET /api/public/recruiters/applications/:id
 * Get application details
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const { id } = req.params;
    const result = await ApplicationService.getApplicationDetails(userId, id);
    res.json(result);
  } catch (error: any) {
    console.error('Get application details error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to get application details'
    });
  }
});

/**
 * POST /api/public/recruiters/applications/shortlist
 * Shortlist applications
 */
router.post('/shortlist', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const { application_ids, notes } = req.body;
    
    if (!application_ids || !Array.isArray(application_ids) || application_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Application IDs are required'
      });
    }

    const result = await ApplicationService.shortlistApplications(userId, application_ids, notes);
    res.json(result);
  } catch (error: any) {
    console.error('Shortlist applications error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to shortlist applications'
    });
  }
});

/**
 * POST /api/public/recruiters/applications/reject
 * Reject applications
 */
router.post('/reject', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const { application_ids, reason } = req.body;
    
    if (!application_ids || !Array.isArray(application_ids) || application_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Application IDs are required'
      });
    }

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    const result = await ApplicationService.rejectApplications(userId, application_ids, reason);
    res.json(result);
  } catch (error: any) {
    console.error('Reject applications error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to reject applications'
    });
  }
});

/**
 * GET /api/public/recruiters/applications/:id/resume
 * Download resume
 */
router.get('/:id/resume', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const { id } = req.params;
    const result = await ApplicationService.downloadResume(userId, id);
    
    // In production, this would return a signed URL or stream the file
    res.json(result);
  } catch (error: any) {
    console.error('Download resume error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to download resume'
    });
  }
});

/**
 * GET /api/public/recruiters/applications/stats
 * Get application statistics
 */
router.get('/stats/summary', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const jobPostingId = req.query.job_posting_id as string;
    const result = await ApplicationService.getApplicationStats(userId, jobPostingId);
    res.json(result);
  } catch (error: any) {
    console.error('Get application stats error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to get application statistics'
    });
  }
});

export default router;
