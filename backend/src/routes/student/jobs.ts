import { Router, Request, Response } from 'express';
import { authenticate, authorize, ROLES } from '../../middleware/auth';
import { jobService } from '../../services/student/jobService';

const router = Router();

// =====================================================
// GET /api/public/jobs
// Description: Get all active job postings with eligibility
// =====================================================

router.get('/', authenticate, authorize(ROLES.STUDENT), async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const filters = {
      company: req.query.company as string,
      role: req.query.role as string,
      ctc_min: req.query.ctc_min as string,
      location: req.query.location as string,
      eligible_only: req.query.eligible_only === 'true',
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
    };

    const result = await jobService.getActiveJobs(userId, filters);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get job postings',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// =====================================================
// GET /api/public/jobs/:id
// Description: Get job posting details
// =====================================================

router.get('/:id', authenticate, authorize(ROLES.STUDENT), async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const jobId = req.params.id;

    const job = await jobService.getJobDetails(jobId, userId);

    res.json({
      success: true,
      data: { job },
    });
  } catch (error) {
    console.error('Get job details error:', error);
    res.status(404).json({
      success: false,
      error: 'Job posting not found',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
