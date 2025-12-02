import { Router, Request, Response } from 'express';
import { prisma } from '../server';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// =====================================================
// JOB POSTING MANAGEMENT ENDPOINTS
// =====================================================

// GET /api/internal/admin/job-postings
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, search, company, employmentType } = req.query;

    const where: any = {};

    // Filter by status
    if (status && status !== 'ALL') {
      where.status = status;
    }

    // Search by job title
    if (search) {
      where.job_title = {
        contains: search as string,
        mode: 'insensitive',
      };
    }

    // Filter by company
    if (company) {
      where.organization = {
        org_name: {
          contains: company as string,
          mode: 'insensitive',
        },
      };
    }

    // Filter by employment type
    if (employmentType) {
      where.employment_type = employmentType;
    }

    const jobPostings = await prisma.jobPosting.findMany({
      where,
      orderBy: {
        created_at: 'desc',
      },
      include: {
        organization: {
          select: {
            id: true,
            org_name: true,
            industry: true,
          },
        },
      },
    });

    const formatted = jobPostings.map((jp) => ({
      id: jp.id,
      orgId: jp.org_id,
      orgName: jp.organization.org_name,
      industry: jp.organization.industry,
      jobTitle: jp.job_title,
      description: jp.description,
      requiredSkills: jp.required_skills,
      workLocation: jp.work_location,
      employmentType: jp.employment_type,
      eligibilityCriteria: jp.eligibility_criteria,
      ctcBreakdown: jp.ctc_breakdown,
      selectionProcess: jp.selection_process,
      bondTerms: jp.bond_terms,
      applicationDeadline: jp.application_deadline?.toISOString(),
      status: jp.status,
      approvedAt: jp.approved_at?.toISOString(),
      approvedBy: jp.approved_by,
      rejectionReason: jp.rejection_reason,
      modificationsRequested: jp.modifications_requested,
      createdAt: jp.created_at.toISOString(),
      updatedAt: jp.updated_at.toISOString(),
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Error fetching job postings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch job postings',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/internal/admin/job-postings/stats
router.get('/stats', async (req: Request, res: Response): Promise<void> => {
  try {
    const totalJobs = await prisma.jobPosting.count();
    const pendingApproval = await prisma.jobPosting.count({
      where: { status: 'PENDING_APPROVAL' },
    });
    const approved = await prisma.jobPosting.count({
      where: { status: 'APPROVED' },
    });
    const rejected = await prisma.jobPosting.count({
      where: { status: 'REJECTED' },
    });
    const active = await prisma.jobPosting.count({
      where: { status: 'ACTIVE' },
    });
    const closed = await prisma.jobPosting.count({
      where: { status: 'CLOSED' },
    });

    // Get approved this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const approvedThisMonth = await prisma.jobPosting.count({
      where: {
        status: { in: ['APPROVED', 'ACTIVE'] },
        approved_at: {
          gte: startOfMonth,
        },
      },
    });

    res.json({
      totalJobs,
      pendingApproval,
      approved,
      rejected,
      active,
      closed,
      approvedThisMonth,
    });
  } catch (error) {
    console.error('Error fetching job posting stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch job posting stats',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/internal/admin/job-postings/:id
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const jobPosting = await prisma.jobPosting.findUnique({
      where: { id },
      include: {
        organization: {
          select: {
            id: true,
            org_name: true,
            industry: true,
            website: true,
          },
        },
        applications: {
          select: {
            id: true,
            status: true,
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
      id: jobPosting.id,
      orgId: jobPosting.org_id,
      orgName: jobPosting.organization.org_name,
      industry: jobPosting.organization.industry,
      website: jobPosting.organization.website,
      jobTitle: jobPosting.job_title,
      description: jobPosting.description,
      requiredSkills: jobPosting.required_skills,
      qualifications: jobPosting.qualifications,
      responsibilities: jobPosting.responsibilities,
      workLocation: jobPosting.work_location,
      employmentType: jobPosting.employment_type,
      eligibilityCriteria: jobPosting.eligibility_criteria,
      ctcBreakdown: jobPosting.ctc_breakdown,
      selectionProcess: jobPosting.selection_process,
      bondTerms: jobPosting.bond_terms,
      applicationDeadline: jobPosting.application_deadline?.toISOString(),
      status: jobPosting.status,
      approvedAt: jobPosting.approved_at?.toISOString(),
      approvedBy: jobPosting.approved_by,
      rejectionReason: jobPosting.rejection_reason,
      modificationsRequested: jobPosting.modifications_requested,
      createdAt: jobPosting.created_at.toISOString(),
      updatedAt: jobPosting.updated_at.toISOString(),
      applicationsCount: jobPosting.applications.length,
      applicationsByStatus: {
        pending: jobPosting.applications.filter(a => a.status === 'PENDING_ADMIN').length,
        approved: jobPosting.applications.filter(a => a.status === 'FORWARDED').length,
        shortlisted: jobPosting.applications.filter(a => a.status === 'SHORTLISTED').length,
      },
    });
  } catch (error) {
    console.error('Error fetching job posting details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch job posting details',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/internal/admin/job-postings/:id/eligibility-preview
router.get('/:id/eligibility-preview', async (req: Request, res: Response): Promise<void> => {
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

    // Get all students
    const allStudents = await prisma.studentProfile.findMany({
      where: {
        tpo_dept_verified: true,
        tpo_admin_verified: true,
      },
    });

    // Filter eligible students
    const eligibleStudents = allStudents.filter(student => {
      const cgpa = student.cgpi ? Number(student.cgpi) : 0;
      const hasBacklogs = student.active_backlogs;
      
      // Check CGPA
      if (cgpa < criteria.cgpa_min) return false;
      
      // Check backlogs
      if (hasBacklogs && criteria.max_backlogs === 0) return false;
      
      // Check department
      if (criteria.allowed_branches && criteria.allowed_branches.length > 0) {
        if (!criteria.allowed_branches.includes(student.department)) return false;
      }
      
      // Check graduation year
      if (criteria.graduation_year && student.expected_graduation_year !== criteria.graduation_year) {
        return false;
      }
      
      return true;
    });

    // Department breakdown
    const deptMap = new Map<string, { eligible: number; total: number }>();
    allStudents.forEach(student => {
      const dept = student.department;
      if (!deptMap.has(dept)) {
        deptMap.set(dept, { eligible: 0, total: 0 });
      }
      const stats = deptMap.get(dept)!;
      stats.total++;
      if (eligibleStudents.includes(student)) {
        stats.eligible++;
      }
    });

    const departmentBreakdown = Array.from(deptMap.entries()).map(([dept, stats]) => ({
      department: dept,
      eligible: stats.eligible,
      total: stats.total,
      percentage: stats.total > 0 ? Math.round((stats.eligible / stats.total) * 100) : 0,
    }));

    // CGPA distribution
    const cgpaRanges = [
      { range: '9.0-10.0', min: 9.0, max: 10.0, count: 0 },
      { range: '8.0-8.9', min: 8.0, max: 8.9, count: 0 },
      { range: '7.0-7.9', min: 7.0, max: 7.9, count: 0 },
      { range: '6.0-6.9', min: 6.0, max: 6.9, count: 0 },
      { range: 'Below 6.0', min: 0, max: 5.9, count: 0 },
    ];

    eligibleStudents.forEach(student => {
      const cgpa = student.cgpi ? Number(student.cgpi) : 0;
      const range = cgpaRanges.find(r => cgpa >= r.min && cgpa <= r.max);
      if (range) range.count++;
    });

    const cgpaDistribution = cgpaRanges.map(r => ({
      range: r.range,
      count: r.count,
    }));

    // Backlog distribution
    const backlogDistribution = [
      { backlogs: 0, count: eligibleStudents.filter(s => !s.active_backlogs).length },
      { backlogs: 1, count: 0 }, // Simplified - would need actual backlog count
    ];

    res.json({
      totalEligible: eligibleStudents.length,
      departmentBreakdown,
      cgpaDistribution,
      backlogDistribution,
    });
  } catch (error) {
    console.error('Error fetching eligibility preview:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch eligibility preview',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// PUT /api/internal/admin/job-postings/:id/approve
router.put('/:id/approve', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;

    await prisma.jobPosting.update({
      where: { id },
      data: {
        status: 'ACTIVE',
        approved_at: new Date(),
        approved_by: userId,
      },
    });

    // TODO: Run eligibility engine
    // TODO: Notify eligible students
    // TODO: Send notification to recruiter
    // TODO: Create audit log entry

    res.json({
      success: true,
      message: 'Job posting approved successfully',
    });
  } catch (error) {
    console.error('Error approving job posting:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to approve job posting',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// PUT /api/internal/admin/job-postings/:id/reject
router.put('/:id/reject', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      res.status(400).json({
        success: false,
        error: 'Rejection reason is required',
      });
      return;
    }

    await prisma.jobPosting.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejection_reason: reason,
      },
    });

    // TODO: Send notification to recruiter
    // TODO: Create audit log entry

    res.json({
      success: true,
      message: 'Job posting rejected successfully',
    });
  } catch (error) {
    console.error('Error rejecting job posting:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reject job posting',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// PUT /api/internal/admin/job-postings/:id/request-modifications
router.put('/:id/request-modifications', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { modifications } = req.body;

    if (!modifications) {
      res.status(400).json({
        success: false,
        error: 'Modification requests are required',
      });
      return;
    }

    await prisma.jobPosting.update({
      where: { id },
      data: {
        modifications_requested: modifications,
      },
    });

    // TODO: Send notification to recruiter
    // TODO: Create audit log entry

    res.json({
      success: true,
      message: 'Modification request sent successfully',
    });
  } catch (error) {
    console.error('Error requesting modifications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to request modifications',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
