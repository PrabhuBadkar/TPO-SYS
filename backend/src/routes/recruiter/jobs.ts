// Job Posting Routes - Create and Manage Job Descriptions
import express from 'express';
import { JobPostingService } from '../../services/recruiter/jobPostingService';
import { authenticateToken } from '../../middleware/auth';

const router = express.Router();

/**
 * POST /api/public/recruiters/jobs/create
 * Create a new job posting
 */
router.post('/create', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const result = await JobPostingService.createJobPosting(userId, req.body);
    res.status(201).json(result);
  } catch (error: any) {
    console.error('Create job posting error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create job posting'
    });
  }
});

/**
 * PUT /api/public/recruiters/jobs/:id/update
 * Update job posting
 */
router.put('/:id/update', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const { id } = req.params;
    const result = await JobPostingService.updateJobPosting(userId, id, req.body);
    res.json(result);
  } catch (error: any) {
    console.error('Update job posting error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update job posting'
    });
  }
});

/**
 * POST /api/public/recruiters/jobs/:id/submit
 * Submit job posting for approval
 */
router.post('/:id/submit', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const { id } = req.params;
    const result = await JobPostingService.submitForApproval(userId, id);
    res.json(result);
  } catch (error: any) {
    console.error('Submit for approval error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to submit job posting'
    });
  }
});

/**
 * GET /api/public/recruiters/jobs/list
 * Get all job postings
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
      status: req.query.status as string,
      employment_type: req.query.employment_type as string,
      search: req.query.search as string
    };

    const result = await JobPostingService.getJobPostings(userId, filters);
    res.json(result);
  } catch (error: any) {
    console.error('Get job postings error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to get job postings'
    });
  }
});

/**
 * GET /api/public/recruiters/jobs/:id
 * Get job posting details
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
    const result = await JobPostingService.getJobPostingDetails(userId, id);
    res.json(result);
  } catch (error: any) {
    console.error('Get job posting details error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to get job posting details'
    });
  }
});

/**
 * PUT /api/public/recruiters/jobs/:id/pause
 * Pause job posting
 */
router.put('/:id/pause', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const { id } = req.params;
    const result = await JobPostingService.pauseJobPosting(userId, id);
    res.json(result);
  } catch (error: any) {
    console.error('Pause job posting error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to pause job posting'
    });
  }
});

/**
 * PUT /api/public/recruiters/jobs/:id/resume
 * Resume job posting
 */
router.put('/:id/resume', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const { id } = req.params;
    const result = await JobPostingService.resumeJobPosting(userId, id);
    res.json(result);
  } catch (error: any) {
    console.error('Resume job posting error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to resume job posting'
    });
  }
});

/**
 * PUT /api/public/recruiters/jobs/:id/close
 * Close job posting
 */
router.put('/:id/close', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const { id } = req.params;
    const result = await JobPostingService.closeJobPosting(userId, id);
    res.json(result);
  } catch (error: any) {
    console.error('Close job posting error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to close job posting'
    });
  }
});

/**
 * POST /api/public/recruiters/jobs/:id/clone
 * Clone job posting
 */
router.post('/:id/clone', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const { id } = req.params;
    const result = await JobPostingService.cloneJobPosting(userId, id);
    res.status(201).json(result);
  } catch (error: any) {
    console.error('Clone job posting error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to clone job posting'
    });
  }
});

export default router;
