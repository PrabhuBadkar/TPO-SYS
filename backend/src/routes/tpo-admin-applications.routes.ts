import { Router, Request, Response } from 'express';
import { prisma } from '../server';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// =====================================================
// APPLICATION MANAGEMENT ENDPOINTS
// =====================================================

// GET /api/internal/admin/applications
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, search, company, department, cgpaMin, cgpaMax } = req.query;

    const where: any = {};

    // Filter by status
    if (status && status !== 'ALL') {
      where.status = status;
    }

    // Filter by company
    if (company) {
      where.jobPosting = {
        organization: {
          org_name: {
            contains: company as string,
            mode: 'insensitive',
          },
        },
      };
    }

    const applications = await prisma.jobApplication.findMany({
      where,
      orderBy: {
        created_at: 'desc',
      },
      include: {
        jobPosting: {
          include: {
            organization: {
              select: {
                id: true,
                org_name: true,
                industry: true,
              },
            },
          },
        },
        student: {
          include: {
            user: {
              select: {
                email: true,
              },
            },
          },
        },
      },
    });

    // Apply additional filters
    let filtered = applications;

    if (department) {
      filtered = filtered.filter(app => app.student.department === department);
    }

    if (cgpaMin) {
      filtered = filtered.filter(app => {
        const cgpa = app.student.cgpi ? Number(app.student.cgpi) : 0;
        return cgpa >= Number(cgpaMin);
      });
    }

    if (cgpaMax) {
      filtered = filtered.filter(app => {
        const cgpa = app.student.cgpi ? Number(app.student.cgpi) : 0;
        return cgpa <= Number(cgpaMax);
      });
    }

    if (search) {
      filtered = filtered.filter(app => 
        app.student.first_name.toLowerCase().includes((search as string).toLowerCase()) ||
        app.student.last_name.toLowerCase().includes((search as string).toLowerCase()) ||
        app.student.enrollment_number.toLowerCase().includes((search as string).toLowerCase())
      );
    }

    const formatted = filtered.map((app) => ({
      id: app.id,
      studentId: app.student_id,
      studentName: `${app.student.first_name} ${app.student.last_name}`,
      enrollmentNumber: app.student.enrollment_number,
      email: app.student.user.email,
      department: app.student.department,
      cgpa: app.student.cgpi ? Number(app.student.cgpi) : 0,
      activeBacklogs: app.student.active_backlogs,
      jobPostingId: app.job_posting_id,
      companyName: app.jobPosting.organization.org_name,
      jobTitle: app.jobPosting.job_title,
      industry: app.jobPosting.organization.industry,
      resumeId: app.resume_id,
      coverLetter: app.cover_letter,
      status: app.status,
      reviewedByDept: app.reviewed_by_dept,
      reviewedByAdmin: app.reviewed_by_admin,
      deptReviewNotes: app.dept_review_notes,
      adminReviewNotes: app.admin_review_notes,
      rejectionReason: app.rejection_reason,
      flagReason: app.flag_reason,
      createdAt: app.created_at.toISOString(),
      updatedAt: app.updated_at.toISOString(),
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch applications',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/internal/admin/applications/stats
router.get('/stats', async (req: Request, res: Response): Promise<void> => {
  try {
    const totalApplications = await prisma.jobApplication.count();
    const pendingDept = await prisma.jobApplication.count({
      where: { status: 'PENDING_DEPT' },
    });
    const pendingAdmin = await prisma.jobApplication.count({
      where: { status: 'PENDING_ADMIN' },
    });
    const approved = await prisma.jobApplication.count({
      where: { status: 'FORWARDED' },
    });
    const rejected = await prisma.jobApplication.count({
      where: { status: 'REJECTED' },
    });
    const flagged = await prisma.jobApplication.count({
      where: { status: 'FLAGGED' },
    });

    // Get approved this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const approvedThisMonth = await prisma.jobApplication.count({
      where: {
        status: 'FORWARDED',
        updated_at: {
          gte: startOfMonth,
        },
      },
    });

    res.json({
      totalApplications,
      pendingDept,
      pendingAdmin,
      approved,
      rejected,
      flagged,
      approvedThisMonth,
    });
  } catch (error) {
    console.error('Error fetching application stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch application stats',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/internal/admin/applications/:id
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const application = await prisma.jobApplication.findUnique({
      where: { id },
      include: {
        jobPosting: {
          include: {
            organization: true,
          },
        },
        student: {
          include: {
            user: {
              select: {
                email: true,
              },
            },
            resumes: {
              where: { is_primary: true },
              take: 1,
            },
          },
        },
      },
    });

    if (!application) {
      res.status(404).json({
        success: false,
        error: 'Application not found',
      });
      return;
    }

    res.json({
      id: application.id,
      studentId: application.student_id,
      studentName: `${application.student.first_name} ${application.student.last_name}`,
      enrollmentNumber: application.student.enrollment_number,
      email: application.student.user.email,
      mobile: application.student.mobile_number,
      department: application.student.department,
      degree: application.student.degree,
      expectedGraduation: application.student.expected_graduation_year,
      cgpa: application.student.cgpi ? Number(application.student.cgpi) : 0,
      activeBacklogs: application.student.active_backlogs,
      tpoDeptVerified: application.student.tpo_dept_verified,
      tpoAdminVerified: application.student.tpo_admin_verified,
      jobPostingId: application.job_posting_id,
      companyName: application.jobPosting.organization.org_name,
      jobTitle: application.jobPosting.job_title,
      industry: application.jobPosting.organization.industry,
      eligibilityCriteria: application.jobPosting.eligibility_criteria,
      ctcBreakdown: application.jobPosting.ctc_breakdown,
      resumeId: application.resume_id,
      resumeUrl: application.student.resumes[0]?.file_path,
      coverLetter: application.cover_letter,
      status: application.status,
      reviewedByDept: application.reviewed_by_dept,
      reviewedByAdmin: application.reviewed_by_admin,
      deptReviewNotes: application.dept_review_notes,
      adminReviewNotes: application.admin_review_notes,
      rejectionReason: application.rejection_reason,
      flagReason: application.flag_reason,
      createdAt: application.created_at.toISOString(),
      updatedAt: application.updated_at.toISOString(),
    });
  } catch (error) {
    console.error('Error fetching application details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch application details',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// PUT /api/internal/admin/applications/:id/approve
router.put('/:id/approve', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const userId = (req as any).user?.id;

    await prisma.jobApplication.update({
      where: { id },
      data: {
        status: 'FORWARDED',
        reviewed_by_admin: userId,
        admin_review_notes: notes || null,
        updated_at: new Date(),
      },
    });

    // TODO: Notify student
    // TODO: Forward to recruiter
    // TODO: Create audit log entry

    res.json({
      success: true,
      message: 'Application approved successfully',
    });
  } catch (error) {
    console.error('Error approving application:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to approve application',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// PUT /api/internal/admin/applications/:id/reject
router.put('/:id/reject', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = (req as any).user?.id;

    if (!reason) {
      res.status(400).json({
        success: false,
        error: 'Rejection reason is required',
      });
      return;
    }

    await prisma.jobApplication.update({
      where: { id },
      data: {
        status: 'REJECTED',
        reviewed_by_admin: userId,
        rejection_reason: reason,
        updated_at: new Date(),
      },
    });

    // TODO: Notify student with appeal process
    // TODO: Create audit log entry

    res.json({
      success: true,
      message: 'Application rejected successfully',
    });
  } catch (error) {
    console.error('Error rejecting application:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reject application',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// PUT /api/internal/admin/applications/:id/flag
router.put('/:id/flag', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = (req as any).user?.id;

    if (!reason) {
      res.status(400).json({
        success: false,
        error: 'Flag reason is required',
      });
      return;
    }

    await prisma.jobApplication.update({
      where: { id },
      data: {
        status: 'FLAGGED',
        reviewed_by_admin: userId,
        flag_reason: reason,
        updated_at: new Date(),
      },
    });

    // TODO: Notify compliance team
    // TODO: Create audit log entry

    res.json({
      success: true,
      message: 'Application flagged successfully',
    });
  } catch (error) {
    console.error('Error flagging application:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to flag application',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// POST /api/internal/admin/applications/bulk-approve
router.post('/bulk-approve', async (req: Request, res: Response): Promise<void> => {
  try {
    const { applicationIds, notes } = req.body;
    const userId = (req as any).user?.id;

    if (!applicationIds || !Array.isArray(applicationIds) || applicationIds.length === 0) {
      res.status(400).json({
        success: false,
        error: 'Application IDs are required',
      });
      return;
    }

    if (applicationIds.length > 200) {
      res.status(400).json({
        success: false,
        error: 'Maximum 200 applications can be approved at once',
      });
      return;
    }

    await prisma.jobApplication.updateMany({
      where: {
        id: { in: applicationIds },
        status: 'PENDING_ADMIN',
      },
      data: {
        status: 'FORWARDED',
        reviewed_by_admin: userId,
        admin_review_notes: notes || null,
        updated_at: new Date(),
      },
    });

    // TODO: Notify students
    // TODO: Forward to recruiters
    // TODO: Create audit log entries

    res.json({
      success: true,
      message: `${applicationIds.length} applications approved successfully`,
    });
  } catch (error) {
    console.error('Error bulk approving applications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to bulk approve applications',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
