import { Router, Request, Response } from 'express';
import { prisma } from '../server';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// =====================================================
// STUDENT MANAGEMENT ENDPOINTS
// =====================================================

// GET /api/internal/admin/students
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      search, 
      department, 
      verificationStatus, 
      cgpaMin, 
      cgpaMax,
      graduationYear,
      placementStatus 
    } = req.query;

    const where: any = {};

    // Filter by department
    if (department) {
      where.department = department;
    }

    // Filter by graduation year
    if (graduationYear) {
      where.expected_graduation_year = Number(graduationYear);
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
        applications: {
          select: {
            id: true,
            status: true,
          },
        },
        offers: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    // Apply additional filters
    let filtered = students;

    // Search filter
    if (search) {
      filtered = filtered.filter(s => 
        s.first_name.toLowerCase().includes((search as string).toLowerCase()) ||
        s.last_name.toLowerCase().includes((search as string).toLowerCase()) ||
        s.enrollment_number.toLowerCase().includes((search as string).toLowerCase())
      );
    }

    // Verification status filter
    if (verificationStatus) {
      if (verificationStatus === 'VERIFIED') {
        filtered = filtered.filter(s => s.tpo_dept_verified && s.tpo_admin_verified);
      } else if (verificationStatus === 'PENDING_DEPT') {
        filtered = filtered.filter(s => !s.tpo_dept_verified);
      } else if (verificationStatus === 'PENDING_ADMIN') {
        filtered = filtered.filter(s => s.tpo_dept_verified && !s.tpo_admin_verified);
      } else if (verificationStatus === 'UNVERIFIED') {
        filtered = filtered.filter(s => !s.tpo_dept_verified || !s.tpo_admin_verified);
      }
    }

    // CGPA filters
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

    // Placement status filter
    if (placementStatus) {
      if (placementStatus === 'PLACED') {
        filtered = filtered.filter(s => 
          s.offers.some(o => o.status === 'ACCEPTED')
        );
      } else if (placementStatus === 'NOT_PLACED') {
        filtered = filtered.filter(s => 
          !s.offers.some(o => o.status === 'ACCEPTED')
        );
      }
    }

    const formatted = filtered.map((s) => {
      const acceptedOffer = s.offers.find(o => o.status === 'ACCEPTED');
      
      return {
        id: s.id,
        enrollmentNumber: s.enrollment_number,
        firstName: s.first_name,
        lastName: s.last_name,
        email: s.user.email,
        mobile: s.mobile_number,
        department: s.department,
        degree: s.degree,
        expectedGraduation: s.expected_graduation_year,
        cgpa: s.cgpi ? Number(s.cgpi) : 0,
        activeBacklogs: s.active_backlogs,
        profileComplete: s.profile_complete_percent,
        tpoDeptVerified: s.tpo_dept_verified,
        tpoAdminVerified: s.tpo_admin_verified,
        hasResume: s.resumes.length > 0,
        applicationsCount: s.applications.length,
        placementStatus: acceptedOffer ? 'PLACED' : 'NOT_PLACED',
        createdAt: s.created_at.toISOString(),
      };
    });

    res.json(formatted);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch students',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/internal/admin/students/stats
router.get('/stats', async (req: Request, res: Response): Promise<void> => {
  try {
    const totalStudents = await prisma.studentProfile.count();
    
    const pendingDeptVerification = await prisma.studentProfile.count({
      where: { tpo_dept_verified: false },
    });
    
    const pendingAdminVerification = await prisma.studentProfile.count({
      where: { 
        tpo_dept_verified: true,
        tpo_admin_verified: false,
      },
    });
    
    const verified = await prisma.studentProfile.count({
      where: { 
        tpo_dept_verified: true,
        tpo_admin_verified: true,
      },
    });

    // Get placed students (those with accepted offers)
    const placedStudentsData = await prisma.offer.groupBy({
      by: ['student_id'],
      where: {
        status: 'ACCEPTED',
      },
    });
    const placed = placedStudentsData.length;

    // Get students with incomplete profiles
    const incompleteProfiles = await prisma.studentProfile.count({
      where: {
        profile_complete_percent: {
          lt: 80,
        },
      },
    });

    // Get verified this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const verifiedThisMonth = await prisma.studentProfile.count({
      where: {
        tpo_admin_verified: true,
        updated_at: {
          gte: startOfMonth,
        },
      },
    });

    res.json({
      totalStudents,
      pendingDeptVerification,
      pendingAdminVerification,
      verified,
      placed,
      notPlaced: totalStudents - placed,
      incompleteProfiles,
      verifiedThisMonth,
    });
  } catch (error) {
    console.error('Error fetching student stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch student stats',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/internal/admin/students/:id
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const student = await prisma.studentProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            email: true,
          },
        },
        resumes: true,
        documents: true,
        applications: {
          include: {
            jobPosting: {
              include: {
                organization: true,
              },
            },
          },
        },
        offers: {
          include: {
            jobPosting: {
              include: {
                organization: true,
              },
            },
          },
        },
      },
    });

    if (!student) {
      res.status(404).json({
        success: false,
        error: 'Student not found',
      });
      return;
    }

    res.json({
      id: student.id,
      enrollmentNumber: student.enrollment_number,
      firstName: student.first_name,
      lastName: student.last_name,
      email: student.user.email,
      mobile: student.mobile_number,
      dateOfBirth: student.date_of_birth?.toISOString(),
      gender: student.gender,
      category: student.category,
      department: student.department,
      degree: student.degree,
      semester: student.semester,
      expectedGraduation: student.expected_graduation_year,
      cgpi: student.cgpi ? Number(student.cgpi) : 0,
      activeBacklogs: student.active_backlogs,
      permanentAddress: student.permanent_address,
      currentAddress: student.current_address,
      profileComplete: student.profile_complete_percent,
      tpoDeptVerified: student.tpo_dept_verified,
      tpoAdminVerified: student.tpo_admin_verified,
      deptVerificationNotes: student.dept_verification_notes,
      adminVerificationNotes: student.admin_verification_notes,
      resumes: student.resumes.map(r => ({
        id: r.id,
        fileName: r.file_name,
        filePath: r.file_path,
        isPrimary: r.is_primary,
        uploadedAt: r.uploaded_at.toISOString(),
      })),
      documents: student.documents.map(d => ({
        id: d.id,
        documentType: d.document_type,
        fileName: d.file_name,
        filePath: d.file_path,
        uploadedAt: d.uploaded_at.toISOString(),
      })),
      applications: student.applications.map(a => ({
        id: a.id,
        companyName: a.jobPosting.organization.org_name,
        jobTitle: a.jobPosting.job_title,
        status: a.status,
        appliedAt: a.created_at.toISOString(),
      })),
      offers: student.offers.map(o => ({
        id: o.id,
        companyName: o.jobPosting.organization.org_name,
        jobTitle: o.jobPosting.job_title,
        ctc: o.ctc_breakdown,
        status: o.status,
        offeredAt: o.created_at.toISOString(),
      })),
      createdAt: student.created_at.toISOString(),
      updatedAt: student.updated_at.toISOString(),
    });
  } catch (error) {
    console.error('Error fetching student details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch student details',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// PUT /api/internal/admin/students/:id/verify
router.put('/:id/verify', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const userId = (req as any).user?.id;

    await prisma.studentProfile.update({
      where: { id },
      data: {
        tpo_admin_verified: true,
        admin_verification_notes: notes || null,
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

// PUT /api/internal/admin/students/:id/reject-verification
router.put('/:id/reject-verification', async (req: Request, res: Response): Promise<void> => {
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
        tpo_admin_verified: false,
        admin_verification_notes: reason,
        updated_at: new Date(),
      },
    });

    // TODO: Notify student with required corrections
    // TODO: Create audit log entry

    res.json({
      success: true,
      message: 'Verification rejected successfully',
    });
  } catch (error) {
    console.error('Error rejecting verification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reject verification',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// POST /api/internal/admin/students/bulk-verify
router.post('/bulk-verify', async (req: Request, res: Response): Promise<void> => {
  try {
    const { studentIds, notes } = req.body;

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      res.status(400).json({
        success: false,
        error: 'Student IDs are required',
      });
      return;
    }

    if (studentIds.length > 100) {
      res.status(400).json({
        success: false,
        error: 'Maximum 100 students can be verified at once',
      });
      return;
    }

    await prisma.studentProfile.updateMany({
      where: {
        id: { in: studentIds },
        tpo_dept_verified: true,
      },
      data: {
        tpo_admin_verified: true,
        admin_verification_notes: notes || null,
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

export default router;
