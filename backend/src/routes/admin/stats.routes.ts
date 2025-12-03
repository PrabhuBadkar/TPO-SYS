import { Router, Request, Response } from 'express';
import { prisma } from '../../server';
import { authenticate } from '../../middleware/auth';

const router = Router();

// =====================================================
// GET /api/internal/admin/stats/overview
// Description: Get all dashboard stats in one call
// =====================================================

router.get('/overview', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    // Check if user is TPO Admin
    if (req.user?.role !== 'ROLE_TPO_ADMIN') {
      res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'Only TPO Admins can access this resource',
      });
      return;
    }

    // Get all stats in parallel for better performance
    const [
      totalStudents,
      pendingVerifications,
      activeRecruiters,
      activeJobs,
      newStudentsThisMonth,
      urgentVerifications,
      recentlyVerifiedRecruiters,
      pendingJobApprovals,
    ] = await Promise.all([
      // Total Students
      prisma.studentProfile.count({
        where: { deleted_at: null },
      }),

      // Pending Admin Verifications
      prisma.studentProfile.count({
        where: {
          tpo_admin_verified: false,
          deleted_at: null,
        },
      }),

      // Active Recruiters (VERIFIED status)
      prisma.organization.count({
        where: {
          recruiter_status: 'VERIFIED',
          deleted_at: null,
        },
      }),

      // Active Job Postings
      prisma.jobPosting.count({
        where: {
          status: 'ACTIVE',
          deleted_at: null,
        },
      }),

      // New Students This Month
      prisma.studentProfile.count({
        where: {
          created_at: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
          deleted_at: null,
        },
      }),

      // Urgent Verifications (pending > 7 days)
      prisma.studentProfile.count({
        where: {
          tpo_admin_verified: false,
          created_at: {
            lte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
          deleted_at: null,
        },
      }),

      // Recently Verified Recruiters (last 30 days)
      prisma.organization.count({
        where: {
          recruiter_status: 'VERIFIED',
          verified_at: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
          deleted_at: null,
        },
      }),

      // Pending Job Approvals
      prisma.jobPosting.count({
        where: {
          status: 'PENDING_APPROVAL',
          deleted_at: null,
        },
      }),
    ]);

    res.json({
      success: true,
      data: {
        students: {
          total: totalStudents,
          newThisMonth: newStudentsThisMonth,
        },
        verifications: {
          pending: pendingVerifications,
          urgent: urgentVerifications,
        },
        recruiters: {
          active: activeRecruiters,
          recentlyVerified: recentlyVerifiedRecruiters,
        },
        jobs: {
          active: activeJobs,
          pendingApproval: pendingJobApprovals,
        },
      },
    });
  } catch (error) {
    console.error('Stats overview error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch stats',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// =====================================================
// GET /api/internal/admin/stats/students
// Description: Get student statistics
// =====================================================

router.get('/students', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== 'ROLE_TPO_ADMIN') {
      res.status(403).json({
        success: false,
        error: 'Access denied',
      });
      return;
    }

    const total = await prisma.studentProfile.count({
      where: { deleted_at: null },
    });

    const newThisMonth = await prisma.studentProfile.count({
      where: {
        created_at: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
        deleted_at: null,
      },
    });

    res.json({
      success: true,
      data: {
        total,
        newThisMonth,
      },
    });
  } catch (error) {
    console.error('Student stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch student stats',
    });
  }
});

// =====================================================
// GET /api/internal/admin/stats/pending-verifications
// Description: Get pending verification statistics
// =====================================================

router.get('/pending-verifications', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== 'ROLE_TPO_ADMIN') {
      res.status(403).json({
        success: false,
        error: 'Access denied',
      });
      return;
    }

    const pending = await prisma.studentProfile.count({
      where: {
        tpo_admin_verified: false,
        deleted_at: null,
      },
    });

    const urgent = await prisma.studentProfile.count({
      where: {
        tpo_admin_verified: false,
        created_at: {
          lte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
        deleted_at: null,
      },
    });

    res.json({
      success: true,
      data: {
        pending,
        urgent,
      },
    });
  } catch (error) {
    console.error('Verification stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch verification stats',
    });
  }
});

// =====================================================
// GET /api/internal/admin/stats/recruiters
// Description: Get recruiter statistics
// =====================================================

router.get('/recruiters', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== 'ROLE_TPO_ADMIN') {
      res.status(403).json({
        success: false,
        error: 'Access denied',
      });
      return;
    }

    const active = await prisma.organization.count({
      where: {
        recruiter_status: 'VERIFIED',
        deleted_at: null,
      },
    });

    const recentlyVerified = await prisma.organization.count({
      where: {
        recruiter_status: 'VERIFIED',
        verified_at: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
        deleted_at: null,
      },
    });

    res.json({
      success: true,
      data: {
        active,
        recentlyVerified,
      },
    });
  } catch (error) {
    console.error('Recruiter stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recruiter stats',
    });
  }
});

// =====================================================
// GET /api/internal/admin/stats/jobs
// Description: Get job posting statistics
// =====================================================

router.get('/jobs', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== 'ROLE_TPO_ADMIN') {
      res.status(403).json({
        success: false,
        error: 'Access denied',
      });
      return;
    }

    const active = await prisma.jobPosting.count({
      where: {
        status: 'ACTIVE',
        deleted_at: null,
      },
    });

    const pendingApproval = await prisma.jobPosting.count({
      where: {
        status: 'PENDING_APPROVAL',
        deleted_at: null,
      },
    });

    res.json({
      success: true,
      data: {
        active,
        pendingApproval,
      },
    });
  } catch (error) {
    console.error('Job stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch job stats',
    });
  }
});

export default router;
