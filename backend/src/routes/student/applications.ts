import { Router, Request, Response } from 'express';
import { authenticate, authorize, ROLES } from '../../middleware/auth';
import { applicationService } from '../../services/student/applicationService';
import { z } from 'zod';

const router = Router();

// Validation schemas
const submitApplicationSchema = z.object({
  job_posting_id: z.string().uuid('Invalid job posting ID'),
  resume_id: z.string().uuid('Invalid resume ID').optional(),
  cover_letter: z.string().max(1000, 'Cover letter must be less than 1000 characters').optional(),
  consent_given: z.boolean().refine(val => val === true, {
    message: 'Consent must be given to submit application',
  }),
});

// =====================================================
// POST /api/public/applications/submit
// Description: Submit application to a job posting
// =====================================================

router.post('/submit', authenticate, authorize(ROLES.STUDENT), async (req: Request, res: Response): Promise<void> => {
  try {
    const validatedData = submitApplicationSchema.parse(req.body);
    const userId = req.user!.id;

    const application = await applicationService.submitApplication(userId, validatedData);

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: { application },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
      return;
    }

    console.error('Submit application error:', error);
    res.status(400).json({
      success: false,
      error: 'Application submission failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// =====================================================
// GET /api/public/applications/me
// Description: Get student's applications
// =====================================================

router.get('/me', authenticate, authorize(ROLES.STUDENT), async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const filters = {
      status: req.query.status as string,
      company: req.query.company as string,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
    };

    const result = await applicationService.getMyApplications(userId, filters);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get applications',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// =====================================================
// DELETE /api/public/applications/:id/withdraw
// Description: Withdraw application
// =====================================================

router.delete('/:id/withdraw', authenticate, authorize(ROLES.STUDENT), async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const applicationId = req.params.id;
    const { reason } = req.body;

    const application = await applicationService.withdrawApplication(applicationId, userId, reason);

    res.json({
      success: true,
      message: 'Application withdrawn successfully',
      data: { application },
    });
  } catch (error) {
    console.error('Withdraw application error:', error);
    res.status(400).json({
      success: false,
      error: 'Failed to withdraw application',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
