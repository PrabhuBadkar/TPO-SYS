import { Router, Request, Response } from 'express';
import { prisma } from '../server';
import { authenticate, authorize } from '../middleware/auth';
import { EligibilityEngineService } from '../services/eligibility-engine.service';

const router = Router();

// =====================================================
// GET /api/internal/admin/jobs/pending
// Description: Get all pending job postings for approval
// =====================================================

router.get('/pending', authenticate, authorize('ROLE_TPO_ADMIN'), async (req: Request, res: Response): Promise<void> => {
  try {
    const jobPostings = await prisma.jobPosting.findMany({
      where: {
        status: 'PENDING_APPROVAL',
        deleted_at: null,
      },
      include: {
        organization: {
          select: {
            org_name: true,
            industry: true,
          },
        },
        poc: {
          select: {
            poc_name: true,
            email: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    res.json({
      success: true,
      data: jobPostings,
    });
  } catch (error) {
    console.error('Pending jobs fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pending job postings',
    });
  }
});

// =====================================================
// GET /api/internal/admin/jobs/:id
// Description: Get job posting details for review
// =====================================================

router.get('/:id', authenticate, authorize('ROLE_TPO_ADMIN'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const jobPosting = await prisma.jobPosting.findUnique({
      where: { id },
      include: {
        organization: true,
        poc: {
          select: {
            poc_name: true,
            email: true,
            designation: true,
            department: true,
          },
        },
      },
    });

    if (!jobPosting) {
      res.status(404).json({
        success: false,
        error: 'Job posting not found',
      });
      return;
    }

    res.json({
      success: true,
      data: jobPosting,
    });
  } catch (error) {
    console.error('Job posting fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch job posting',
    });
  }
});

// =====================================================
// GET /api/internal/admin/jobs/:id/preview-eligibility
// Description: Preview eligible students before approving
// =====================================================

router.get('/:id/preview-eligibility', authenticate, authorize('ROLE_TPO_ADMIN'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const jobPosting = await prisma.jobPosting.findUnique({
      where: { id },
    });

    if (!jobPosting) {
      res.status(404).json({
        success: false,
        error: 'Job posting not found',
      });
      return;
    }

    const criteria = jobPosting.eligibility_criteria as any;

    // Build eligibility query
    const where: any = {
      tpo_admin_verified: true, // Only verified students
      is_active: true,
    };

    // CGPA filter
    if (criteria.cgpa_min) {
      where.cgpi = {
        gte: criteria.cgpa_min,
      };
    }

    // Backlogs filter
    if (criteria.max_backlogs !== undefined) {
      where.active_backlogs = {
        lte: criteria.max_backlogs,
      };
    }

    // Department filter
    if (criteria.allowed_branches && criteria.allowed_branches.length > 0) {
      where.department = {
        in: criteria.allowed_branches,
      };
    }

    // Degree filter (if needed - assuming degree is in student profile)
    // if (criteria.degree && criteria.degree.length > 0) {
    //   where.degree = {
    //     in: criteria.degree,
    //   };
    // }

    // Graduation year filter
    if (criteria.graduation_year) {
      where.graduation_year = criteria.graduation_year;
    }

    // Get eligible students count
    const totalEligible = await prisma.studentProfile.count({ where });

    // Get department-wise breakdown
    const departmentBreakdown = await prisma.studentProfile.groupBy({
      by: ['department'],
      where,
      _count: {
        id: true,
      },
    });

    // Get CGPA distribution
    const cgpaDistribution = await prisma.studentProfile.groupBy({
      by: ['cgpi'],
      where,
      _count: {
        id: true,
      },
      orderBy: {
        cgpi: 'desc',
      },
    });

    // Get backlog distribution
    const backlogDistribution = await prisma.studentProfile.groupBy({
      by: ['active_backlogs'],
      where,
      _count: {
        id: true,
      },
      orderBy: {
        active_backlogs: 'asc',
      },
    });

    res.json({
      success: true,
      data: {
        total_eligible: totalEligible,
        department_breakdown: departmentBreakdown.map(d => ({
          department: d.department,
          count: d._count.id,
        })),
        cgpa_distribution: cgpaDistribution.map(c => ({
          cgpa: c.cgpi,
          count: c._count.id,
        })),
        backlog_distribution: backlogDistribution.map(b => ({
          backlogs: b.active_backlogs,
          count: b._count.id,
        })),
      },
    });
  } catch (error) {
    console.error('Eligibility preview error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to preview eligibility',
    });
  }
});

// =====================================================
// PUT /api/internal/admin/jobs/:id/approve
// Description: Approve job posting and run eligibility engine
// =====================================================

router.put('/:id/approve', authenticate, authorize('ROLE_TPO_ADMIN'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const adminId = req.user?.id;

    const jobPosting = await prisma.jobPosting.findUnique({
      where: { id },
      include: {
        organization: true,
      },
    });

    if (!jobPosting) {
      res.status(404).json({
        success: false,
        error: 'Job posting not found',
      });
      return;
    }

    if (jobPosting.status !== 'PENDING_APPROVAL') {
      res.status(400).json({
        success: false,
        error: 'Job posting is not pending approval',
      });
      return;
    }

    // Update job posting status
    const updatedJob = await prisma.jobPosting.update({
      where: { id },
      data: {
        status: 'ACTIVE',
        approved_at: new Date(),
        approved_by: adminId,
      },
    });

    console.log('Job posting approved:', id, 'by admin:', adminId);

    // Run eligibility engine and send notifications
    const criteria = jobPosting.eligibility_criteria as any;
    const eligibilityResult = await EligibilityEngineService.processJobApproval(
      id,
      jobPosting.job_title,
      jobPosting.organization.org_name,
      criteria
    );

    console.log('Eligibility workflow completed:');
    console.log(`  - Eligible students: ${eligibilityResult.total_eligible}`);
    console.log(`  - Notifications created: ${eligibilityResult.notifications_created}`);
    console.log(`  - Emails sent: ${eligibilityResult.emails_sent}`);

    // TODO: Send notification to recruiter (job approved)
    // TODO: Create audit log entry

    res.json({
      success: true,
      message: 'Job posting approved and published to students',
      data: {
        id: updatedJob.id,
        status: updatedJob.status,
        eligible_students_count: eligibilityResult.total_eligible,
        notifications_created: eligibilityResult.notifications_created,
        emails_sent: eligibilityResult.emails_sent,
      },
    });
  } catch (error) {
    console.error('Job approval error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to approve job posting',
    });
  }
});

// =====================================================
// PUT /api/internal/admin/jobs/:id/reject
// Description: Reject job posting
// =====================================================

router.put('/:id/reject', authenticate, authorize('ROLE_TPO_ADMIN'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { rejection_reason } = req.body;

    if (!rejection_reason) {
      res.status(400).json({
        success: false,
        error: 'Rejection reason is required',
      });
      return;
    }

    const jobPosting = await prisma.jobPosting.findUnique({
      where: { id },
    });

    if (!jobPosting) {
      res.status(404).json({
        success: false,
        error: 'Job posting not found',
      });
      return;
    }

    if (jobPosting.status !== 'PENDING_APPROVAL') {
      res.status(400).json({
        success: false,
        error: 'Job posting is not pending approval',
      });
      return;
    }

    // Update job posting status
    await prisma.jobPosting.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejection_reason,
      },
    });

    console.log('Job posting rejected:', id, 'Reason:', rejection_reason);

    // TODO: Send notification to recruiter
    // TODO: Create audit log entry

    res.json({
      success: true,
      message: 'Job posting rejected',
    });
  } catch (error) {
    console.error('Job rejection error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reject job posting',
    });
  }
});

// =====================================================
// PUT /api/internal/admin/jobs/:id/request-modifications
// Description: Request modifications to job posting
// =====================================================

router.put('/:id/request-modifications', authenticate, authorize('ROLE_TPO_ADMIN'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { modifications_requested } = req.body;

    if (!modifications_requested) {
      res.status(400).json({
        success: false,
        error: 'Modification details are required',
      });
      return;
    }

    const jobPosting = await prisma.jobPosting.findUnique({
      where: { id },
    });

    if (!jobPosting) {
      res.status(404).json({
        success: false,
        error: 'Job posting not found',
      });
      return;
    }

    // Update job posting status
    await prisma.jobPosting.update({
      where: { id },
      data: {
        status: 'MODIFICATIONS_REQUESTED',
        modifications_requested,
      },
    });

    console.log('Modifications requested for job:', id);

    // TODO: Send notification to recruiter
    // TODO: Create audit log entry

    res.json({
      success: true,
      message: 'Modification request sent to recruiter',
    });
  } catch (error) {
    console.error('Request modifications error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to request modifications',
    });
  }
});

export default router;
