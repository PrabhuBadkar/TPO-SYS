/**
 * Job Matching Routes
 * AI-powered job matching and recommendations
 */

import { Router, Request, Response } from 'express';
import { jobMatchingService } from '../services/job-matching.service';

const router = Router();

/**
 * PUBLIC ROUTES (Students)
 */

/**
 * GET /api/public/jobs/recommendations
 * Get AI-powered job recommendations
 */
router.get('/public/jobs/recommendations', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || 'test-student-id';
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await jobMatchingService.getRecommendations(userId, limit);

    res.json(result);
  } catch (error: any) {
    console.error('[JobMatching] Error getting recommendations:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get job recommendations',
    });
  }
});

/**
 * GET /api/public/jobs/similar-placements
 * Get similar students who got placed
 */
router.get('/public/jobs/similar-placements', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || 'test-student-id';
    const limit = parseInt(req.query.limit as string) || 5;

    const result = await jobMatchingService.getSimilarPlacedStudents(userId, limit);

    res.json(result);
  } catch (error: any) {
    console.error('[JobMatching] Error getting similar placements:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get similar placements',
    });
  }
});

/**
 * GET /api/public/jobs/skill-gap
 * Get skill gap analysis
 */
router.get('/public/jobs/skill-gap', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || 'test-student-id';

    const result = await jobMatchingService.getSkillGapAnalysis(userId);

    res.json(result);
  } catch (error: any) {
    console.error('[JobMatching] Error getting skill gap:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get skill gap analysis',
    });
  }
});

export default router;
