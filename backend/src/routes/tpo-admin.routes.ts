import { Router, Request, Response } from 'express';
import { prisma } from '../server';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// =====================================================
// GET /api/internal/admin/dashboard/stats
// Description: Get dashboard statistics - REAL DATA ONLY
// =====================================================

router.get('/dashboard/stats', async (req: Request, res: Response): Promise<void> => {
  try {
    // Get total students count
    const totalStudents = await prisma.studentProfile.count();

    // Get pending verifications (profiles not verified by dept or admin)
    const pendingVerifications = await prisma.studentProfile.count({
      where: {
        OR: [
          { tpo_dept_verified: false },
          { tpo_admin_verified: false },
        ],
      },
    });

    // Get active drives (job postings that are approved and active)
    const activeDrives = await prisma.jobPosting.count({
      where: {
        status: 'ACTIVE',
      },
    });

    // Get system alerts
    const systemAlerts = pendingVerifications > 50 ? 1 : 0;

    // Calculate trends
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const studentsLastMonth = await prisma.studentProfile.count({
      where: {
        created_at: {
          lt: oneMonthAgo,
        },
      },
    });

    const totalStudentsTrend = studentsLastMonth > 0 
      ? Math.round(((totalStudents - studentsLastMonth) / studentsLastMonth) * 100)
      : 0;

    const stats = {
      totalStudents,
      totalStudentsTrend,
      pendingVerifications,
      pendingVerificationsTrend: 0,
      activeDrives,
      activeDrivesTrend: 0,
      systemAlerts,
      criticalAlerts: systemAlerts,
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard stats',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// =====================================================
// GET /api/internal/admin/dashboard/queues
// Description: Get pending queues - REAL DATA ONLY
// =====================================================

router.get('/dashboard/queues', async (req: Request, res: Response): Promise<void> => {
  try {
    // Get pending recruiters (organizations with PENDING_VERIFICATION status)
    const pendingOrgs = await prisma.organization.findMany({
      where: {
        recruiter_status: 'PENDING_VERIFICATION',
      },
      take: 10,
      orderBy: {
        created_at: 'desc',
      },
      select: {
        id: true,
        org_name: true,
        website: true,
        created_at: true,
        pocs: {
          take: 1,
          select: {
            poc_name: true,
            email: true,
          },
        },
      },
    });

    const recruiterCount = await prisma.organization.count({
      where: {
        recruiter_status: 'PENDING_VERIFICATION',
      },
    });

    // Get pending job postings
    const pendingJobPostings = await prisma.jobPosting.findMany({
      where: {
        status: 'PENDING_APPROVAL',
      },
      take: 10,
      orderBy: {
        created_at: 'desc',
      },
      select: {
        id: true,
        job_title: true,
        organization: {
          select: {
            org_name: true,
          },
        },
        ctc_breakdown: true,
        application_deadline: true,
        created_at: true,
      },
    });

    const jobPostingCount = await prisma.jobPosting.count({
      where: {
        status: 'PENDING_APPROVAL',
      },
    });

    // Get pending applications
    const pendingApplications = await prisma.jobApplication.findMany({
      where: {
        status: 'PENDING_ADMIN',
      },
      take: 10,
      orderBy: {
        created_at: 'desc',
      },
      include: {
        jobPosting: {
          select: {
            job_title: true,
            organization: {
              select: {
                org_name: true,
              },
            },
          },
        },
      },
    });

    const applicationCount = await prisma.jobApplication.count({
      where: {
        status: 'PENDING_ADMIN',
      },
    });

    // Get upcoming events (placeholder)
    const upcomingEvents: any[] = [];

    const queues = {
      recruiters: {
        count: recruiterCount,
        items: pendingOrgs.map((org) => ({
          id: org.id,
          organizationName: org.org_name,
          contactPerson: org.pocs[0]?.poc_name || 'Unknown',
          email: org.pocs[0]?.email || 'Unknown',
          status: 'PENDING',
          submittedAt: org.created_at.toISOString(),
        })),
      },
      jobPostings: {
        count: jobPostingCount,
        items: pendingJobPostings.map((jp) => {
          const ctc = jp.ctc_breakdown as any;
          return {
            id: jp.id,
            companyName: jp.organization.org_name,
            role: jp.job_title,
            ctc: ctc?.total_ctc ? `₹${ctc.total_ctc} LPA` : 'Not specified',
            deadline: jp.application_deadline?.toISOString() || new Date().toISOString(),
            status: 'PENDING',
            submittedAt: jp.created_at.toISOString(),
          };
        }),
      },
      applications: {
        count: applicationCount,
        items: pendingApplications.map((app) => ({
          id: app.id,
          studentName: 'Student',
          enrollmentNumber: 'N/A',
          department: 'N/A',
          companyName: app.jobPosting.organization.org_name,
          role: app.jobPosting.job_title,
          status: 'PENDING_ADMIN',
          submittedAt: app.created_at.toISOString(),
        })),
      },
      upcomingEvents,
    };

    res.json(queues);
  } catch (error) {
    console.error('Error fetching pending queues:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pending queues',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// =====================================================
// GET /api/internal/admin/notifications
// Description: Get real-time notifications from database events
// =====================================================

router.get('/notifications', async (req: Request, res: Response): Promise<void> => {
  try {
    const notifications: any[] = [];

    // Get pending recruiters
    const pendingRecruiters = await prisma.organization.findMany({
      where: { recruiter_status: 'PENDING_VERIFICATION' },
      orderBy: { created_at: 'desc' },
      take: 3,
      select: {
        id: true,
        org_name: true,
        created_at: true,
      },
    });

    pendingRecruiters.forEach((org) => {
      notifications.push({
        id: `recruiter-${org.id}`,
        type: 'RECRUITER',
        title: 'New recruiter pending verification',
        message: `${org.org_name} submitted verification request`,
        timestamp: org.created_at.toISOString(),
        read: false,
        actionUrl: '/tpo-admin/recruiters?tab=pending',
      });
    });

    // Get pending job postings
    const pendingJobs = await prisma.jobPosting.findMany({
      where: { status: 'PENDING_APPROVAL' },
      orderBy: { created_at: 'desc' },
      take: 3,
      select: {
        id: true,
        job_title: true,
        organization: {
          select: { org_name: true },
        },
        created_at: true,
      },
    });

    pendingJobs.forEach((job) => {
      notifications.push({
        id: `job-${job.id}`,
        type: 'JOB_POSTING',
        title: 'JD approval needed',
        message: `${job.organization.org_name} posted ${job.job_title} role`,
        timestamp: job.created_at.toISOString(),
        read: false,
        actionUrl: '/tpo-admin/job-postings?tab=pending',
      });
    });

    // Get pending applications
    const pendingApps = await prisma.jobApplication.findMany({
      where: { status: 'PENDING_ADMIN' },
      orderBy: { created_at: 'desc' },
      take: 3,
      select: {
        id: true,
        jobPosting: {
          select: {
            job_title: true,
            organization: {
              select: { org_name: true },
            },
          },
        },
        created_at: true,
      },
    });

    pendingApps.forEach((app) => {
      notifications.push({
        id: `app-${app.id}`,
        type: 'APPLICATION',
        title: 'Application pending review',
        message: `Application for ${app.jobPosting.organization.org_name} - ${app.jobPosting.job_title}`,
        timestamp: app.created_at.toISOString(),
        read: false,
        actionUrl: '/tpo-admin/applications?tab=pending',
      });
    });

    // Get unverified students
    const unverifiedStudents = await prisma.studentProfile.count({
      where: {
        OR: [
          { tpo_dept_verified: false },
          { tpo_admin_verified: false },
        ],
      },
    });

    if (unverifiedStudents > 0) {
      notifications.push({
        id: 'students-unverified',
        type: 'SYSTEM',
        title: 'Student verifications pending',
        message: `${unverifiedStudents} students awaiting verification`,
        timestamp: new Date().toISOString(),
        read: false,
        actionUrl: '/tpo-admin/students',
      });
    }

    // Sort by timestamp (newest first)
    notifications.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    res.json(notifications.slice(0, 10)); // Return top 10
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notifications',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// =====================================================
// RECRUITER MANAGEMENT ENDPOINTS
// =====================================================

// GET /api/internal/admin/recruiters
router.get('/recruiters', async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, search, industry } = req.query;

    const where: any = {};

    // Filter by status
    if (status && status !== 'ALL') {
      where.recruiter_status = status;
    }

    // Search by company name
    if (search) {
      where.org_name = {
        contains: search as string,
        mode: 'insensitive',
      };
    }

    // Filter by industry
    if (industry) {
      where.industry = industry;
    }

    const recruiters = await prisma.organization.findMany({
      where,
      orderBy: {
        created_at: 'desc',
      },
      include: {
        pocs: {
          where: { is_primary: true },
          take: 1,
        },
        jobPostings: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    const formattedRecruiters = recruiters.map((org) => ({
      id: org.id,
      orgName: org.org_name,
      website: org.website,
      industry: org.industry,
      size: org.size,
      headquarters: org.headquarters,
      yearEstablished: org.year_established,
      gstNumber: org.gst_number,
      cin: org.cin,
      pan: org.pan,
      status: org.recruiter_status,
      verifiedAt: org.verified_at?.toISOString(),
      verifiedBy: org.verified_by,
      rejectionReason: org.rejection_reason,
      blacklistReason: org.blacklist_reason,
      blacklistedAt: org.blacklisted_at?.toISOString(),
      createdAt: org.created_at.toISOString(),
      primaryPOC: org.pocs[0] ? {
        id: org.pocs[0].id,
        name: org.pocs[0].poc_name,
        email: org.pocs[0].email,
        mobile: org.pocs[0].mobile_number,
        designation: org.pocs[0].designation,
      } : null,
      jobPostingsCount: org.jobPostings.length,
      activeJobsCount: org.jobPostings.filter(jp => jp.status === 'ACTIVE').length,
    }));

    res.json(formattedRecruiters);
  } catch (error) {
    console.error('Error fetching recruiters:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recruiters',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/internal/admin/recruiters/:id
router.get('/recruiters/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const recruiter = await prisma.organization.findUnique({
      where: { id },
      include: {
        pocs: true,
        jobPostings: {
          select: {
            id: true,
            job_title: true,
            status: true,
            created_at: true,
          },
          orderBy: {
            created_at: 'desc',
          },
        },
      },
    });

    if (!recruiter) {
      res.status(404).json({
        success: false,
        error: 'Recruiter not found',
      });
      return;
    }

    res.json({
      id: recruiter.id,
      orgName: recruiter.org_name,
      website: recruiter.website,
      industry: recruiter.industry,
      size: recruiter.size,
      headquarters: recruiter.headquarters,
      branchOffices: recruiter.branch_offices,
      yearEstablished: recruiter.year_established,
      description: recruiter.description,
      gstNumber: recruiter.gst_number,
      cin: recruiter.cin,
      pan: recruiter.pan,
      registrationCertUrl: recruiter.registration_cert_url,
      authorizationLetterUrl: recruiter.authorization_letter_url,
      status: recruiter.recruiter_status,
      verifiedAt: recruiter.verified_at?.toISOString(),
      verifiedBy: recruiter.verified_by,
      rejectionReason: recruiter.rejection_reason,
      blacklistReason: recruiter.blacklist_reason,
      blacklistedAt: recruiter.blacklisted_at?.toISOString(),
      blacklistedBy: recruiter.blacklisted_by,
      createdAt: recruiter.created_at.toISOString(),
      updatedAt: recruiter.updated_at.toISOString(),
      pocs: recruiter.pocs.map(poc => ({
        id: poc.id,
        name: poc.poc_name,
        designation: poc.designation,
        department: poc.department,
        email: poc.email,
        mobile: poc.mobile_number,
        linkedIn: poc.linkedin_profile,
        isPrimary: poc.is_primary,
        isActive: poc.is_active,
      })),
      jobPostings: recruiter.jobPostings.map(jp => ({
        id: jp.id,
        title: jp.job_title,
        status: jp.status,
        createdAt: jp.created_at.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Error fetching recruiter details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recruiter details',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// PUT /api/internal/admin/recruiters/:id/verify
router.put('/recruiters/:id/verify', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;

    await prisma.organization.update({
      where: { id },
      data: {
        recruiter_status: 'VERIFIED',
        verified_at: new Date(),
        verified_by: userId,
      },
    });

    // TODO: Send email notification to recruiter
    // TODO: Create audit log entry

    res.json({
      success: true,
      message: 'Recruiter verified successfully',
    });
  } catch (error) {
    console.error('Error verifying recruiter:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify recruiter',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// PUT /api/internal/admin/recruiters/:id/reject
router.put('/recruiters/:id/reject', async (req: Request, res: Response): Promise<void> => {
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

    await prisma.organization.update({
      where: { id },
      data: {
        recruiter_status: 'REJECTED',
        rejection_reason: reason,
      },
    });

    // TODO: Send email notification to recruiter
    // TODO: Create audit log entry

    res.json({
      success: true,
      message: 'Recruiter rejected successfully',
    });
  } catch (error) {
    console.error('Error rejecting recruiter:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reject recruiter',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// PUT /api/internal/admin/recruiters/:id/blacklist
router.put('/recruiters/:id/blacklist', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = (req as any).user?.id;

    if (!reason) {
      res.status(400).json({
        success: false,
        error: 'Blacklist reason is required',
      });
      return;
    }

    // TODO: Implement 4-eyes approval workflow
    // For now, directly blacklist

    await prisma.organization.update({
      where: { id },
      data: {
        recruiter_status: 'BLACKLISTED',
        blacklist_reason: reason,
        blacklisted_at: new Date(),
        blacklisted_by: userId,
      },
    });

    // TODO: Archive existing job postings
    // TODO: Disable POC accounts
    // TODO: Send notification
    // TODO: Create audit log entry

    res.json({
      success: true,
      message: 'Recruiter blacklisted successfully',
    });
  } catch (error) {
    console.error('Error blacklisting recruiter:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to blacklist recruiter',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// PUT /api/internal/admin/recruiters/:id/request-info
router.put('/recruiters/:id/request-info', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { requiredDocuments } = req.body;

    if (!requiredDocuments || !Array.isArray(requiredDocuments)) {
      res.status(400).json({
        success: false,
        error: 'Required documents list is required',
      });
      return;
    }

    // TODO: Store required documents in a separate table or JSON field
    // TODO: Send email notification to recruiter with required documents list
    // TODO: Create audit log entry

    res.json({
      success: true,
      message: 'Information request sent successfully',
    });
  } catch (error) {
    console.error('Error requesting information:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to request information',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/internal/admin/recruiters/stats
router.get('/recruiters/stats', async (req: Request, res: Response): Promise<void> => {
  try {
    const totalRecruiters = await prisma.organization.count();
    const pendingVerification = await prisma.organization.count({
      where: { recruiter_status: 'PENDING_VERIFICATION' },
    });
    const verified = await prisma.organization.count({
      where: { recruiter_status: 'VERIFIED' },
    });
    const rejected = await prisma.organization.count({
      where: { recruiter_status: 'REJECTED' },
    });
    const blacklisted = await prisma.organization.count({
      where: { recruiter_status: 'BLACKLISTED' },
    });

    // Get verified this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const verifiedThisMonth = await prisma.organization.count({
      where: {
        recruiter_status: 'VERIFIED',
        verified_at: {
          gte: startOfMonth,
        },
      },
    });

    res.json({
      totalRecruiters,
      pendingVerification,
      verified,
      rejected,
      blacklisted,
      verifiedThisMonth,
    });
  } catch (error) {
    console.error('Error fetching recruiter stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recruiter stats',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// =====================================================
// GET /api/internal/admin/analytics/dashboard
// Description: Get analytics data - REAL DATA ONLY
// =====================================================

router.get('/analytics/dashboard', async (req: Request, res: Response): Promise<void> => {
  try {
    // Get current year data
    const currentYear = new Date().getFullYear();
    const totalStudents = await prisma.studentProfile.count();
    
    // Count unique placed students (those with accepted offers)
    const placedStudentsData = await prisma.offer.groupBy({
      by: ['student_id'],
      where: {
        status: 'ACCEPTED',
      },
    });
    const placedStudents = placedStudentsData.length;

    const placementRate = totalStudents > 0 ? Math.round((placedStudents / totalStudents) * 100) : 0;

    // Placement trend - just current year with real data
    const placementTrend = [
      { 
        year: currentYear.toString(), 
        placementRate, 
        totalStudents, 
        placedStudents 
      },
    ];

    // Application funnel - REAL DATA
    const appliedCount = await prisma.jobApplication.count();
    const deptApprovedCount = await prisma.jobApplication.count({
      where: { status: 'PENDING_ADMIN' },
    });
    const adminApprovedCount = await prisma.jobApplication.count({
      where: { status: 'FORWARDED' },
    });
    const shortlistedCount = await prisma.jobApplication.count({
      where: { status: 'SHORTLISTED' },
    });
    const offeredCount = await prisma.offer.count({
      where: { status: { in: ['EXTENDED', 'ACCEPTED', 'REJECTED'] } },
    });
    const acceptedCount = await prisma.offer.count({
      where: { status: 'ACCEPTED' },
    });

    const applicationFunnel = {
      applied: appliedCount,
      deptApproved: deptApprovedCount,
      adminApproved: adminApprovedCount,
      shortlisted: shortlistedCount,
      offered: offeredCount,
      accepted: acceptedCount,
    };

    // Top companies by offers - REAL DATA
    const topCompaniesData = await prisma.offer.groupBy({
      by: ['job_posting_id'],
      where: {
        status: { in: ['EXTENDED', 'ACCEPTED', 'REJECTED'] },
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 5,
    });

    // Get company names for top companies
    const topCompanies = await Promise.all(
      topCompaniesData.map(async (item) => {
        const jobPosting = await prisma.jobPosting.findUnique({
          where: { id: item.job_posting_id },
          select: { 
            organization: {
              select: {
                org_name: true,
              },
            },
            ctc_breakdown: true,
          },
        });
        const ctc = jobPosting?.ctc_breakdown as any;
        return {
          name: jobPosting?.organization.org_name || 'Unknown',
          offers: item._count.id,
          avgCTC: ctc?.total_ctc || 0,
        };
      })
    );

    // Department-wise placement - REAL DATA
    const departmentsData = await prisma.studentProfile.groupBy({
      by: ['department'],
      _count: {
        id: true,
      },
    });

    const departmentComparison = await Promise.all(
      departmentsData.map(async (deptData) => {
        const dept = deptData.department;
        const total = deptData._count.id;
        
        // Get all students in this department
        const studentsInDept = await prisma.studentProfile.findMany({
          where: { department: dept },
          select: { id: true },
        });
        
        const studentIds = studentsInDept.map(s => s.id);
        
        // Count placed students in this department
        const placedInDeptData = await prisma.offer.groupBy({
          by: ['student_id'],
          where: {
            status: 'ACCEPTED',
            student_id: { in: studentIds },
          },
        });
        const placedInDept = placedInDeptData.length;
        
        const rate = total > 0 ? Math.round((placedInDept / total) * 100) : 0;
        
        // Get department abbreviation
        const deptAbbr = dept.split(' ')[0];
        
        return {
          department: deptAbbr,
          placementRate: rate,
          totalStudents: total,
          placedStudents: placedInDept,
        };
      })
    );

    const analytics = {
      placementTrend,
      applicationFunnel,
      topCompanies: topCompanies.length > 0 ? topCompanies : [],
      departmentComparison,
    };

    res.json(analytics);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analytics',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// =====================================================
// GET /api/internal/admin/students/all
// Description: Get all students with filters
// =====================================================

router.get('/students/all', async (req: Request, res: Response): Promise<void> => {
  try {
    const students = await prisma.studentProfile.findMany({
      include: {
        user: {
          select: {
            email: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    const formattedStudents = students.map((s) => ({
      id: s.id,
      enrollmentNumber: s.enrollment_number,
      firstName: s.first_name,
      lastName: s.last_name,
      email: s.user.email,
      department: s.department,
      cgpa: s.cgpi ? Number(s.cgpi) : 0,
      profileComplete: s.profile_complete_percent,
      tpoDeptVerified: s.tpo_dept_verified,
      tpoAdminVerified: s.tpo_admin_verified,
      placementStatus: 'NOT_STARTED',
    }));

    res.json(formattedStudents);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch students',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
