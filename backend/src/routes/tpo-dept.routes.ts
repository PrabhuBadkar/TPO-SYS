import { Router, Request, Response } from 'express';
import { prisma } from '../server';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// =====================================================
// TPO DEPT - STUDENT VERIFICATION ENDPOINTS
// =====================================================

// GET /api/internal/dept/students/list
router.get('/students/list', async (req: Request, res: Response): Promise<void> => {
  try {
    const { verificationStatus, profileCompletion, year, semester, cgpaMin, cgpaMax, department } = req.query;
    const userId = (req as any).user?.id;

    // TODO: Get user's assigned department from tpo_dept_coordinators table
    // For now, using department from query or default
    const assignedDepartment = department || 'Computer Science & Engineering';

    const where: any = {
      department: assignedDepartment, // Department-scoped access (K2.1)
    };

    // Filter by verification status
    if (verificationStatus) {
      if (verificationStatus === 'VERIFIED') {
        where.tpo_dept_verified = true;
      } else if (verificationStatus === 'PENDING') {
        where.tpo_dept_verified = false;
      } else if (verificationStatus === 'REJECTED') {
        where.dept_verification_notes = { not: null };
        where.tpo_dept_verified = false;
      }
    }

    // Filter by profile completion
    if (profileCompletion) {
      where.profile_complete_percent = { gte: Number(profileCompletion) };
    }

    // Filter by graduation year
    if (year) {
      where.expected_graduation_year = Number(year);
    }

    // Filter by semester
    if (semester) {
      where.semester = Number(semester);
    }

    const students = await prisma.studentProfile.findMany({
      where,
      orderBy: {
        created_at: 'desc',
      },
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
        documents: true,
      },
    });

    // Apply CGPA filters
    let filtered = students;
    if (cgpaMin) {
      filtered = filtered.filter(s => {
        const cgpa = s.cgpi ? Number(s.cgpi) : 0;
        return cgpa >= Number(cgpaMin);
      });
    }
    if (cgpaMax) {
      filtered = filtered.filter(s => {
        const cgpa = s.cgpi ? Number(s.cgpi) : 0;
        return cgpa <= Number(cgpaMax);
      });
    }

    const formatted = filtered.map((s) => ({
      id: s.id,
      enrollmentNumber: s.enrollment_number,
      firstName: s.first_name,
      lastName: s.last_name,
      email: s.user.email,
      mobile: s.mobile_number,
      department: s.department,
      semester: s.semester,
      expectedGraduation: s.expected_graduation_year,
      cgpa: s.cgpi ? Number(s.cgpi) : 0,
      activeBacklogs: s.active_backlogs,
      profileComplete: s.profile_complete_percent,
      tpoDeptVerified: s.tpo_dept_verified,
      deptVerificationNotes: s.dept_verification_notes,
      hasResume: s.resumes.length > 0,
      documentsCount: s.documents.length,
      createdAt: s.created_at.toISOString(),
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Error fetching department students:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch students',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/internal/dept/students/stats
router.get('/students/stats', async (req: Request, res: Response): Promise<void> => {
  try {
    const { department } = req.query;
    const assignedDepartment = department || 'Computer Science & Engineering';

    const totalStudents = await prisma.studentProfile.count({
      where: { department: assignedDepartment },
    });

    const verified = await prisma.studentProfile.count({
      where: {
        department: assignedDepartment,
        tpo_dept_verified: true,
      },
    });

    const pending = await prisma.studentProfile.count({
      where: {
        department: assignedDepartment,
        tpo_dept_verified: false,
        profile_complete_percent: { gte: 80 },
      },
    });

    const rejected = await prisma.studentProfile.count({
      where: {
        department: assignedDepartment,
        tpo_dept_verified: false,
        dept_verification_notes: { not: null },
      },
    });

    // Get average profile completion
    const students = await prisma.studentProfile.findMany({
      where: { department: assignedDepartment },
      select: { profile_complete_percent: true, cgpi: true },
    });

    const avgProfileCompletion = students.length > 0
      ? Math.round(students.reduce((sum, s) => sum + s.profile_complete_percent, 0) / students.length)
      : 0;

    const avgCGPA = students.length > 0
      ? students.reduce((sum, s) => sum + (s.cgpi ? Number(s.cgpi) : 0), 0) / students.length
      : 0;

    res.json({
      totalStudents,
      verified,
      pending,
      rejected,
      avgProfileCompletion,
      avgCGPA: avgCGPA.toFixed(2),
    });
  } catch (error) {
    console.error('Error fetching department stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch stats',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// PUT /api/internal/dept/students/:id/verify
router.put('/students/:id/verify', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const userId = (req as any).user?.id;

    await prisma.studentProfile.update({
      where: { id },
      data: {
        tpo_dept_verified: true,
        dept_verification_notes: notes || 'Profile verified by department',
        updated_at: new Date(),
      },
    });

    // TODO: Notify student
    // TODO: Create audit log entry

    res.json({
      success: true,
      message: 'Student verified successfully',
    });
  } catch (error) {
    console.error('Error verifying student:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify student',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// PUT /api/internal/dept/students/:id/hold
router.put('/students/:id/hold', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    if (!notes) {
      res.status(400).json({
        success: false,
        error: 'Notes are required for holding verification',
      });
      return;
    }

    await prisma.studentProfile.update({
      where: { id },
      data: {
        tpo_dept_verified: false,
        dept_verification_notes: `HOLD: ${notes}`,
        updated_at: new Date(),
      },
    });

    // TODO: Notify student with specific issues
    // TODO: Set reminder (T+3 days)
    // TODO: Create audit log entry

    res.json({
      success: true,
      message: 'Student profile held for corrections',
    });
  } catch (error) {
    console.error('Error holding student verification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to hold verification',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// PUT /api/internal/dept/students/:id/reject
router.put('/students/:id/reject', async (req: Request, res: Response): Promise<void> => {
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

    await prisma.studentProfile.update({
      where: { id },
      data: {
        tpo_dept_verified: false,
        dept_verification_notes: `REJECTED: ${reason}`,
        updated_at: new Date(),
      },
    });

    // TODO: Escalate to TPO_Admin
    // TODO: Notify student with appeal process
    // TODO: Create audit log entry

    res.json({
      success: true,
      message: 'Student profile rejected',
    });
  } catch (error) {
    console.error('Error rejecting student:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reject student',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// POST /api/internal/dept/students/bulk-verify
router.post('/students/bulk-verify', async (req: Request, res: Response): Promise<void> => {
  try {
    const { studentIds, notes } = req.body;

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      res.status(400).json({
        success: false,
        error: 'Student IDs are required',
      });
      return;
    }

    if (studentIds.length > 50) {
      res.status(400).json({
        success: false,
        error: 'Maximum 50 students can be verified at once',
      });
      return;
    }

    await prisma.studentProfile.updateMany({
      where: {
        id: { in: studentIds },
        profile_complete_percent: { gte: 80 }, // BR-D2
      },
      data: {
        tpo_dept_verified: true,
        dept_verification_notes: notes || 'Bulk verified by department',
        updated_at: new Date(),
      },
    });

    // TODO: Notify students
    // TODO: Create audit log entries

    res.json({
      success: true,
      message: `${studentIds.length} students verified successfully`,
    });
  } catch (error) {
    console.error('Error bulk verifying students:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to bulk verify students',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// =====================================================
// TPO DEPT - APPLICATION REVIEW ENDPOINTS
// =====================================================

// GET /api/internal/dept/applications/queue
router.get('/applications/queue', async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, company, department } = req.query;
    const assignedDepartment = department || 'Computer Science & Engineering';

    const where: any = {
      student: {
        department: assignedDepartment, // Department-scoped access (K2.1)
      },
    };

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
          },
        },
      },
    });

    const formatted = applications.map((app) => ({
      id: app.id,
      studentId: app.student_id,
      studentName: `${app.student.first_name} ${app.student.last_name}`,
      enrollmentNumber: app.student.enrollment_number,
      cgpa: app.student.cgpi ? Number(app.student.cgpi) : 0,
      companyName: app.jobPosting.organization.org_name,
      jobTitle: app.jobPosting.job_title,
      status: app.status,
      reviewedByDept: app.reviewed_by_dept,
      deptReviewNotes: app.dept_review_notes,
      createdAt: app.created_at.toISOString(),
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Error fetching application queue:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch applications',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// PUT /api/internal/dept/applications/:id/approve
router.put('/applications/:id/approve', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const userId = (req as any).user?.id;

    await prisma.jobApplication.update({
      where: { id },
      data: {
        status: 'PENDING_ADMIN',
        reviewed_by_dept: userId,
        dept_review_notes: notes || 'Approved by department',
        updated_at: new Date(),
      },
    });

    // TODO: Forward to TPO_Admin
    // TODO: Notify student
    // TODO: Create audit log entry

    res.json({
      success: true,
      message: 'Application approved and forwarded to TPO Admin',
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

// POST /api/internal/dept/applications/bulk-approve
router.post('/applications/bulk-approve', async (req: Request, res: Response): Promise<void> => {
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

    if (applicationIds.length > 100) {
      res.status(400).json({
        success: false,
        error: 'Maximum 100 applications can be approved at once',
      });
      return;
    }

    await prisma.jobApplication.updateMany({
      where: {
        id: { in: applicationIds },
        status: 'PENDING_DEPT',
      },
      data: {
        status: 'PENDING_ADMIN',
        reviewed_by_dept: userId,
        dept_review_notes: notes || 'Bulk approved by department',
        updated_at: new Date(),
      },
    });

    // TODO: Notify students
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
