import { Router, Request, Response } from 'express';
import { authenticate, authorize, ROLES } from '../../middleware/auth';
import { dashboardService } from '../../services/student/dashboardService';

const router = Router();

// =====================================================
// GET /api/public/dashboard
// Description: Get student dashboard data
// =====================================================

router.get('/', authenticate, authorize(ROLES.STUDENT), async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const dashboard = await dashboardService.getDashboard(userId);

    res.json({
      success: true,
      data: dashboard,
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get dashboard data',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
