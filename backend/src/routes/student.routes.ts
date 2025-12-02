import { Router, Request, Response } from 'express'
import { prisma } from '../server'
import { authenticate, authorize, ROLES } from '../middleware/auth'
import { z } from 'zod'
import { ProfileService } from '../services/profile.service'
import { UploadService } from '../services/upload.service'
import { ApplicationService } from '../services/application.service'
import { ConsentService } from '../services/consent.service'
import { checkEligibility, getReasonMessage } from '../services/eligibility.service'
import multer from 'multer'

const router = Router()

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
})

// All student routes require authentication
router.use(authenticate)
router.use(authorize(ROLES.STUDENT))

// =====================================================
// GET /api/student/dashboard
// Description: Get student dashboard data
// =====================================================

router.get('/dashboard', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' })
      return
    }

    // Get student profile
    const profile = await prisma.studentProfile.findUnique({
      where: { user_id: req.user.id },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        enrollment_number: true,
        department: true,
        current_semester: true,
        cgpi: true,
        profile_complete_percent: true,
        tpo_dept_verified: true,
        tpo_admin_verified: true,
        profile_status: true,
      },
    })

    // If no profile exists, return default data
    if (!profile) {
      res.json({
        success: true,
        data: {
          profile: null,
          stats: {
            total_applications: 0,
            pending_applications: 0,
            shortlisted_applications: 0,
            total_offers: 0,
          },
        },
      })
      return
    }

    // Get application statistics
    const applicationStats = await prisma.jobApplication.groupBy({
      by: ['status'],
      where: { student_id: profile.id },
      _count: true,
    })

    const stats = {
      total: 0,
      pending: 0,
      shortlisted: 0,
      rejected: 0,
    }

    applicationStats.forEach((stat) => {
      stats.total += stat._count
      if (stat.status.includes('PENDING')) stats.pending += stat._count
      if (stat.status === 'SHORTLISTED') stats.shortlisted += stat._count
      if (stat.status.includes('REJECTED')) stats.rejected += stat._count
    })

    // Get offers count
    const offersCount = await prisma.offer.count({
      where: { student_id: profile.id },
    })

    res.json({
      success: true,
      data: {
        profile: {
          profile_complete_percent: profile.profile_complete_percent || 0,
          tpo_dept_verified: profile.tpo_dept_verified || false,
        },
        stats: {
          total_applications: stats.total,
          pending_applications: stats.pending,
          shortlisted_applications: stats.shortlisted,
          total_offers: offersCount,
        },
      },
    })
  } catch (error) {
    console.error('Dashboard error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to load dashboard',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

// =====================================================
// GET /api/student/profile
// Description: Get student profile
// =====================================================

router.get('/profile', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' })
      return
    }

    const profile = await prisma.studentProfile.findUnique({
      where: { user_id: req.user.id },
      include: {
        user: {
          select: {
            email: true,
            email_verified: true,
            created_at: true,
          },
        },
        semesterMarks: {
          orderBy: { semester: 'asc' },
        },
        resumes: {
          where: { is_active: true },
          orderBy: { created_at: 'desc' },
        },
      },
    })

    if (!profile) {
      res.status(404).json({
        success: false,
        error: 'Profile not found',
        message: 'Please complete your profile',
      })
      return
    }

    res.json({
      success: true,
      data: { profile },
    })
  } catch (error) {
    console.error('Get profile error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get profile',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

// =====================================================
// POST /api/student/profile
// Description: Create student profile
// =====================================================

const createProfileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  middleName: z.string().optional(),
  lastName: z.string().min(1, 'Last name is required'),
  dateOfBirth: z.string().datetime(),
  gender: z.enum(['Male', 'Female', 'Other', 'Prefer not to say']),
  mobileNumber: z.string().regex(/^\+91-\d{10}$/, 'Invalid mobile number format'),
  personalEmail: z.string().email(),
  addressPermanent: z.string().min(10, 'Address is required'),
  enrollmentNumber: z.string().min(1, 'Enrollment number is required'),
  department: z.enum(['CSE', 'ECE', 'ME', 'CE', 'IT', 'EE', 'Others']),
  degree: z.enum(['B.Tech', 'M.Tech', 'MCA', 'MBA', 'Diploma']),
  yearOfAdmission: z.number().int().min(2000),
  currentSemester: z.number().int().min(1).max(12),
  expectedGraduationYear: z.number().int(),
})

const updateProfileSchema = z.object({
  firstName: z.string().optional(),
  middleName: z.string().optional(),
  lastName: z.string().optional(),
  mobileNumber: z.string().regex(/^\+91-\d{10}$/, 'Invalid mobile number format').optional(),
  personalEmail: z.string().email().optional(),
  addressPermanent: z.string().optional(),
  department: z.enum(['CSE', 'ECE', 'ME', 'CE', 'IT', 'EE', 'Others']).optional(),
  cgpi: z.number().min(0).max(10).optional(),
})

router.post('/profile', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' })
      return
    }

    // Check if profile already exists
    const existingProfile = await prisma.studentProfile.findUnique({
      where: { user_id: req.user.id },
    })

    if (existingProfile) {
      res.status(409).json({
        success: false,
        error: 'Profile already exists',
        message: 'Use PUT /api/student/profile to update',
      })
      return
    }

    // Validate data
    const validatedData = createProfileSchema.parse(req.body)

    // Create profile using service
    const profile = await ProfileService.createProfile(req.user.id, validatedData)

    res.status(201).json({
      success: true,
      message: 'Profile created successfully',
      data: { profile },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      })
      return
    }

    console.error('Create profile error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to create profile',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

// =====================================================
// PUT /api/student/profile
// Description: Update student profile (triggers re-verification on critical field changes)
// =====================================================

router.put('/profile', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' })
      return
    }

    // Validate input
    const payload = updateProfileSchema.parse(req.body)

    const profile = await prisma.studentProfile.findUnique({
      where: { user_id: req.user.id },
    })

    if (!profile) {
      res.status(404).json({ success: false, error: 'Profile not found' })
      return
    }

    // Determine if critical fields changed (enrollment_number, cgpi, department)
    const criticalChanged = (
      (payload.department && payload.department !== profile.department) ||
      (typeof payload.cgpi === 'number' && payload.cgpi !== (profile.cgpi || 0))
    )

    const updated = await prisma.studentProfile.update({
      where: { id: profile.id },
      data: {
        first_name: payload.firstName ?? profile.first_name,
        middle_name: payload.middleName ?? profile.middle_name,
        last_name: payload.lastName ?? profile.last_name,
        mobile_number: payload.mobileNumber ?? profile.mobile_number,
        personal_email: payload.personalEmail ?? profile.personal_email,
        address_permanent: payload.addressPermanent ?? profile.address_permanent,
        department: payload.department ?? profile.department,
        cgpi: typeof payload.cgpi === 'number' ? payload.cgpi : profile.cgpi,
        ...(criticalChanged ? { tpo_dept_verified: false } : {}),
      },
    })

    res.json({ success: true, message: 'Profile updated successfully', data: { profile: updated } })
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: 'Validation error', details: error.errors })
      return
    }
    console.error('Update profile error:', error)
    res.status(500).json({ success: false, error: 'Failed to update profile' })
  }
})

// =====================================================
// POST /api/student/applications/create
// Description: Create job application (with consent)
// =====================================================

const createApplicationSchema = z.object({
  jobPostingId: z.string().uuid(),
  resumeId: z.string().uuid(),
  coverLetter: z.string().optional(),
  consentGiven: z.boolean().refine((val) => val === true, {
    message: 'Consent is required to apply',
  }),
})

router.post('/applications/create', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' })
      return
    }

    const profile = await prisma.studentProfile.findUnique({
      where: { user_id: req.user.id },
      select: { id: true },
    })

    if (!profile) {
      res.status(404).json({
        success: false,
        error: 'Profile not found',
        message: 'Please complete your profile first',
      })
      return
    }

    // Validate data
    const validatedData = createApplicationSchema.parse(req.body)

    // Get IP address and user agent
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress
    const userAgent = req.headers['user-agent']

    // Create application (includes consent creation)
    const application = await ApplicationService.createApplication(
      profile.id,
      validatedData.jobPostingId,
      validatedData.resumeId,
      validatedData.coverLetter,
      ipAddress,
      userAgent
    )

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: { application },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      })
      return
    }

    console.error('Create application error:', error)
    res.status(400).json({
      success: false,
      error: 'Failed to create application',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

// =====================================================
// DELETE /api/student/applications/:id/withdraw
// Description: Withdraw application
// =====================================================

router.delete('/applications/:id/withdraw', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' })
      return
    }

    const profile = await prisma.studentProfile.findUnique({
      where: { user_id: req.user.id },
      select: { id: true },
    })

    if (!profile) {
      res.status(404).json({
        success: false,
        error: 'Profile not found',
      })
      return
    }

    await ApplicationService.withdrawApplication(profile.id, req.params.id)

    res.json({
      success: true,
      message: 'Application withdrawn successfully',
    })
  } catch (error) {
    console.error('Withdraw application error:', error)
    res.status(400).json({
      success: false,
      error: 'Failed to withdraw application',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

// =====================================================
// GET /api/student/applications
// Description: Get student's job applications
// =====================================================

router.get('/applications', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' })
      return
    }

    const profile = await prisma.studentProfile.findUnique({
      where: { user_id: req.user.id },
      select: { id: true },
    })

    if (!profile) {
      res.json({
        success: true,
        data: { applications: [] },
      })
      return
    }

    const applications = await prisma.jobApplication.findMany({
      where: { student_id: profile.id },
      include: {
        jobPosting: {
          select: {
            job_title: true,
            job_type: true,
            organization: {
              select: {
                organization_name: true,
              },
            },
          },
        },
      },
      orderBy: { created_at: 'desc' },
    })

    res.json({
      success: true,
      data: { applications },
    })
  } catch (error) {
    console.error('Get applications error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get applications',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

// =====================================================
// GET /api/student/offers
// Description: Get student's job offers
// =====================================================

router.get('/offers', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' })
      return
    }

    const profile = await prisma.studentProfile.findUnique({
      where: { user_id: req.user.id },
      select: { id: true },
    })

    if (!profile) {
      res.json({
        success: true,
        data: { offers: [] },
      })
      return
    }

    const offers = await prisma.offer.findMany({
      where: { student_id: profile.id },
      include: {
        jobPosting: {
          select: {
            job_title: true,
            organization: {
              select: {
                organization_name: true,
              },
            },
          },
        },
      },
      orderBy: { created_at: 'desc' },
    })

    res.json({
      success: true,
      data: { offers },
    })
  } catch (error) {
    console.error('Get offers error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get offers',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

// =====================================================
// GET /api/student/jobs
// Description: Get available job postings with eligibility
// =====================================================

router.get('/jobs', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' })
      return
    }

    // Get student profile
    const profile = await prisma.studentProfile.findUnique({
      where: { user_id: req.user.id },
      select: {
        id: true,
        cgpi: true,
        active_backlogs: true,
        department: true,
        expected_graduation_year: true,
        profile_complete_percent: true,
        tpo_dept_verified: true,
      },
    })

    const jobs = await prisma.jobPosting.findMany({
      where: {
        status: 'ACTIVE',
        application_deadline: {
          gte: new Date(),
        },
      },
      include: {
        organization: {
          select: {
            organization_name: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    })

    // Add eligibility information to each job
    const jobsWithEligibility = jobs.map((job) => {
      let eligibility = { isEligible: false, reasons: ['PROFILE_NOT_FOUND'], reasonMessages: ['Complete your profile first'] }
      
      if (profile) {
        const result = checkEligibility(
          {
            cgpi: profile.cgpi,
            active_backlogs: profile.active_backlogs || 0,
            department: profile.department,
            expected_graduation_year: profile.expected_graduation_year || 0,
            profile_complete_percent: profile.profile_complete_percent || 0,
            tpo_dept_verified: profile.tpo_dept_verified || false,
          },
          {
            cgpa_min: job.cgpa_min,
            max_backlogs: job.max_backlogs,
            allowed_branches: job.allowed_branches,
            graduation_years: job.graduation_years,
          }
        )
        
        eligibility = {
          isEligible: result.isEligible,
          reasons: result.reasons,
          reasonMessages: result.reasons.map(getReasonMessage),
        }
      }

      return {
        ...job,
        eligibility,
      }
    })

    res.json({
      success: true,
      data: { jobs: jobsWithEligibility },
    })
  } catch (error) {
    console.error('Get jobs error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get jobs',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

// =====================================================
// POST /api/student/profile/verify-request
// Description: Request profile verification from TPO_Dept
// =====================================================

router.post('/profile/verify-request', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' })
      return
    }

    const profile = await prisma.studentProfile.findUnique({
      where: { user_id: req.user.id },
      select: { id: true },
    })

    if (!profile) {
      res.status(404).json({
        success: false,
        error: 'Profile not found',
        message: 'Please complete your profile first',
      })
      return
    }

    await ProfileService.requestVerification(profile.id)

    res.json({
      success: true,
      message: 'Verification request submitted successfully',
    })
  } catch (error) {
    console.error('Verification request error:', error)
    res.status(400).json({
      success: false,
      error: 'Failed to request verification',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

// =====================================================
// GET /api/student/profile/completion
// Description: Get profile completion status
// =====================================================

router.get('/profile/completion', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' })
      return
    }

    const profile = await prisma.studentProfile.findUnique({
      where: { user_id: req.user.id },
      select: {
        id: true,
        profile_complete_percent: true,
        profile_status: true,
        tpo_dept_verified: true,
      },
    })

    if (!profile) {
      res.json({
        success: true,
        data: {
          completion: 0,
          status: 'NOT_STARTED',
          verified: false,
        },
      })
      return
    }

    res.json({
      success: true,
      data: {
        completion: profile.profile_complete_percent || 0,
        status: profile.profile_status,
        verified: profile.tpo_dept_verified || false,
      },
    })
  } catch (error) {
    console.error('Get completion error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get completion status',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

// =====================================================
// POST /api/student/resume/upload
// Description: Upload resume
// =====================================================

router.post('/resume/upload', upload.single('resume'), async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' })
      return
    }

    if (!req.file) {
      res.status(400).json({
        success: false,
        error: 'No file uploaded',
      })
      return
    }

    const profile = await prisma.studentProfile.findUnique({
      where: { user_id: req.user.id },
      select: { id: true },
    })

    if (!profile) {
      res.status(404).json({
        success: false,
        error: 'Profile not found',
        message: 'Please complete your profile first',
      })
      return
    }

    const isPrimary = req.body.isPrimary === 'true' || req.body.isPrimary === true

    const resume = await UploadService.uploadResume(profile.id, req.file, isPrimary)

    res.status(201).json({
      success: true,
      message: 'Resume uploaded successfully',
      data: { resume },
    })
  } catch (error) {
    console.error('Upload resume error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to upload resume',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

// =====================================================
// GET /api/student/resumes
// Description: Get all resumes
// =====================================================

router.get('/resumes', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' })
      return
    }

    const profile = await prisma.studentProfile.findUnique({
      where: { user_id: req.user.id },
      select: { id: true },
    })

    if (!profile) {
      res.json({
        success: true,
        data: { resumes: [] },
      })
      return
    }

    const resumes = await prisma.resume.findMany({
      where: {
        student_id: profile.id,
        is_active: true,
      },
      orderBy: { created_at: 'desc' },
    })

    res.json({
      success: true,
      data: { resumes },
    })
  } catch (error) {
    console.error('Get resumes error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get resumes',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

// =====================================================
// DELETE /api/student/resumes/:id
// Description: Delete resume
// =====================================================

router.delete('/resumes/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' })
      return
    }

    const profile = await prisma.studentProfile.findUnique({
      where: { user_id: req.user.id },
      select: { id: true },
    })

    if (!profile) {
      res.status(404).json({
        success: false,
        error: 'Profile not found',
      })
      return
    }

    await UploadService.deleteResume(req.params.id, profile.id)

    res.json({
      success: true,
      message: 'Resume deleted successfully',
    })
  } catch (error) {
    console.error('Delete resume error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to delete resume',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

// =====================================================
// PUT /api/student/resumes/:id/primary
// Description: Set resume as primary
// =====================================================

router.put('/resumes/:id/primary', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' })
      return
    }

    const profile = await prisma.studentProfile.findUnique({
      where: { user_id: req.user.id },
      select: { id: true },
    })

    if (!profile) {
      res.status(404).json({
        success: false,
        error: 'Profile not found',
      })
      return
    }

    await UploadService.setPrimaryResume(req.params.id, profile.id)

    res.json({
      success: true,
      message: 'Primary resume updated successfully',
    })
  } catch (error) {
    console.error('Set primary resume error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to set primary resume',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

// =====================================================
// POST /api/student/documents/upload
// Description: Upload document
// =====================================================

router.post('/documents/upload', upload.single('document'), async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' })
      return
    }

    if (!req.file) {
      res.status(400).json({
        success: false,
        error: 'No file uploaded',
      })
      return
    }

    const profile = await prisma.studentProfile.findUnique({
      where: { user_id: req.user.id },
      select: { id: true },
    })

    if (!profile) {
      res.status(404).json({
        success: false,
        error: 'Profile not found',
        message: 'Please complete your profile first',
      })
      return
    }

    const { documentType, description } = req.body

    if (!documentType) {
      res.status(400).json({
        success: false,
        error: 'Document type is required',
      })
      return
    }

    const document = await UploadService.uploadDocument(
      profile.id,
      req.file,
      documentType,
      description
    )

    res.status(201).json({
      success: true,
      message: 'Document uploaded successfully',
      data: { document },
    })
  } catch (error) {
    console.error('Upload document error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to upload document',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

// =====================================================
// GET /api/student/documents
// Description: Get all documents
// =====================================================

router.get('/documents', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' })
      return
    }

    const profile = await prisma.studentProfile.findUnique({
      where: { user_id: req.user.id },
      select: { id: true },
    })

    if (!profile) {
      res.json({
        success: true,
        data: { documents: [] },
      })
      return
    }

    const documents = await prisma.studentDocument.findMany({
      where: { student_id: profile.id },
      orderBy: { created_at: 'desc' },
    })

    res.json({
      success: true,
      data: { documents },
    })
  } catch (error) {
    console.error('Get documents error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get documents',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

// =====================================================
// GET /api/student/documents/:id/download
// Description: Download document
// =====================================================

router.get('/documents/:id/download', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' })
      return
    }

    const profile = await prisma.studentProfile.findUnique({
      where: { user_id: req.user.id },
      select: { id: true },
    })

    if (!profile) {
      res.status(404).json({
        success: false,
        error: 'Profile not found',
      })
      return
    }

    const document = await prisma.studentDocument.findFirst({
      where: {
        id: req.params.id,
        student_id: profile.id,
      },
    })

    if (!document) {
      res.status(404).json({
        success: false,
        error: 'Document not found',
      })
      return
    }

    // Send file
    res.download(document.file_path, document.document_name)
  } catch (error) {
    console.error('Download document error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to download document',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

// =====================================================
// DELETE /api/student/documents/:id
// Description: Delete document
// =====================================================

router.delete('/documents/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' })
      return
    }

    const profile = await prisma.studentProfile.findUnique({
      where: { user_id: req.user.id },
      select: { id: true },
    })

    if (!profile) {
      res.status(404).json({
        success: false,
        error: 'Profile not found',
      })
      return
    }

    await UploadService.deleteDocument(req.params.id, profile.id)

    res.json({
      success: true,
      message: 'Document deleted successfully',
    })
  } catch (error) {
    console.error('Delete document error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to delete document',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

// =====================================================
// GET /api/student/consents
// Description: Get student's consent records
// =====================================================

router.get('/consents', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' })
      return
    }

    const profile = await prisma.studentProfile.findUnique({
      where: { user_id: req.user.id },
      select: { id: true },
    })

    if (!profile) {
      res.json({
        success: true,
        data: { consents: [] },
      })
      return
    }

    const consents = await ConsentService.getStudentConsents(profile.id)

    res.json({
      success: true,
      data: { consents },
    })
  } catch (error) {
    console.error('Get consents error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get consents',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

// =====================================================
// POST /api/student/consents/:jobPostingId/revoke
// Description: Revoke consent for a job posting
// =====================================================

router.post('/consents/:jobPostingId/revoke', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' })
      return
    }

    const profile = await prisma.studentProfile.findUnique({
      where: { user_id: req.user.id },
      select: { id: true },
    })

    if (!profile) {
      res.status(404).json({
        success: false,
        error: 'Profile not found',
      })
      return
    }

    const { reason } = req.body
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress

    await ConsentService.revokeConsent(profile.id, req.params.jobPostingId, reason, ipAddress)

    res.json({
      success: true,
      message: 'Consent revoked successfully',
    })
  } catch (error) {
    console.error('Revoke consent error:', error)
    res.status(400).json({
      success: false,
      error: 'Failed to revoke consent',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

// =====================================================
// GET /api/student/consents/preferences
// Description: Get consent preferences
// =====================================================

router.get('/consents/preferences', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' })
      return
    }

    const profile = await prisma.studentProfile.findUnique({
      where: { user_id: req.user.id },
      select: {
        id: true,
        data_sharing_consent: true,
        placement_consent: true,
      },
    })

    if (!profile) {
      res.status(404).json({
        success: false,
        error: 'Profile not found',
      })
      return
    }

    res.json({
      success: true,
      data: {
        dataSharingConsent: profile.data_sharing_consent || false,
        placementConsent: profile.placement_consent || false,
      },
    })
  } catch (error) {
    console.error('Get consent preferences error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get consent preferences',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

// =====================================================
// PUT /api/student/consents/preferences
// Description: Update consent preferences
// =====================================================

const consentPreferencesSchema = z.object({
  dataSharingConsent: z.boolean().optional(),
  placementConsent: z.boolean().optional(),
})

router.put('/consents/preferences', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' })
      return
    }

    const profile = await prisma.studentProfile.findUnique({
      where: { user_id: req.user.id },
      select: { id: true },
    })

    if (!profile) {
      res.status(404).json({
        success: false,
        error: 'Profile not found',
      })
      return
    }

    const validatedData = consentPreferencesSchema.parse(req.body)

    const updated = await prisma.studentProfile.update({
      where: { id: profile.id },
      data: {
        data_sharing_consent: validatedData.dataSharingConsent,
        placement_consent: validatedData.placementConsent,
      },
    })

    res.json({
      success: true,
      message: 'Consent preferences updated',
      data: {
        dataSharingConsent: updated.data_sharing_consent,
        placementConsent: updated.placement_consent,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      })
      return
    }

    console.error('Update consent preferences error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update consent preferences',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

// =====================================================
// GET /api/student/notifications
// Description: Get student's notifications
// =====================================================

router.get('/notifications', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' })
      return
    }

    const profile = await prisma.studentProfile.findUnique({
      where: { user_id: req.user.id },
      select: { id: true },
    })

    if (!profile) {
      res.json({
        success: true,
        data: { notifications: [] },
      })
      return
    }

    const notifications = await prisma.notificationOutbox.findMany({
      where: {
        recipient_id: req.user.id,
        recipient_type: 'STUDENT',
      },
      orderBy: { created_at: 'desc' },
      take: 50,
    })

    res.json({
      success: true,
      data: { notifications },
    })
  } catch (error) {
    console.error('Get notifications error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get notifications',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

// =====================================================
// PUT /api/student/notifications/:id/read
// Description: Mark notification as read
// =====================================================

router.put('/notifications/:id/read', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' })
      return
    }

    await prisma.notificationOutbox.update({
      where: {
        id: req.params.id,
        recipient_id: req.user.id,
      },
      data: {
        read_at: new Date(),
      },
    })

    res.json({
      success: true,
      message: 'Notification marked as read',
    })
  } catch (error) {
    console.error('Mark notification read error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to mark notification as read',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

// =====================================================
// PUT /api/student/notifications/preferences
// Description: Update notification preferences
// =====================================================

const notificationPreferencesSchema = z.object({
  emailEnabled: z.boolean().optional(),
  smsEnabled: z.boolean().optional(),
  pushEnabled: z.boolean().optional(),
})

router.put('/notifications/preferences', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' })
      return
    }

    const validatedData = notificationPreferencesSchema.parse(req.body)

    const preferences = await prisma.notificationPreferences.upsert({
      where: { user_id: req.user.id },
      create: {
        user_id: req.user.id,
        email_enabled: validatedData.emailEnabled ?? true,
        sms_enabled: validatedData.smsEnabled ?? false,
        push_enabled: validatedData.pushEnabled ?? true,
      },
      update: {
        email_enabled: validatedData.emailEnabled,
        sms_enabled: validatedData.smsEnabled,
        push_enabled: validatedData.pushEnabled,
      },
    })

    res.json({
      success: true,
      message: 'Notification preferences updated',
      data: { preferences },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      })
      return
    }

    console.error('Update notification preferences error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update notification preferences',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

// =====================================================
// GET /api/student/calendar/events
// Description: Get student's calendar events
// =====================================================

router.get('/calendar/events', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' })
      return
    }

    const profile = await prisma.studentProfile.findUnique({
      where: { user_id: req.user.id },
      select: { id: true, department: true },
    })

    if (!profile) {
      res.json({
        success: true,
        data: { events: [] },
      })
      return
    }

    // Get events for the student (personal + department-wide + college-wide)
    const events = await prisma.event.findMany({
      where: {
        OR: [
          { visibility: 'COLLEGE_WIDE' },
          {
            visibility: 'DEPARTMENT',
            target_departments: {
              has: profile.department,
            },
          },
          {
            visibility: 'SPECIFIC_STUDENTS',
            target_student_ids: {
              has: profile.id,
            },
          },
        ],
        event_date: {
          gte: new Date(),
        },
      },
      orderBy: { event_date: 'asc' },
    })

    // Get RSVP status for each event
    const eventsWithRSVP = await Promise.all(
      events.map(async (event) => {
        const rsvp = await prisma.eventRSVP.findUnique({
          where: {
            event_id_student_id: {
              event_id: event.id,
              student_id: profile.id,
            },
          },
        })

        return {
          ...event,
          rsvpStatus: rsvp?.status || 'PENDING',
        }
      })
    )

    res.json({
      success: true,
      data: { events: eventsWithRSVP },
    })
  } catch (error) {
    console.error('Get calendar events error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get calendar events',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

// =====================================================
// POST /api/student/calendar/rsvp
// Description: RSVP to an event
// =====================================================

const rsvpSchema = z.object({
  eventId: z.string().uuid(),
  status: z.enum(['ACCEPTED', 'DECLINED']),
})

router.post('/calendar/rsvp', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' })
      return
    }

    const profile = await prisma.studentProfile.findUnique({
      where: { user_id: req.user.id },
      select: { id: true },
    })

    if (!profile) {
      res.status(404).json({
        success: false,
        error: 'Profile not found',
      })
      return
    }

    const validatedData = rsvpSchema.parse(req.body)

    const rsvp = await prisma.eventRSVP.upsert({
      where: {
        event_id_student_id: {
          event_id: validatedData.eventId,
          student_id: profile.id,
        },
      },
      create: {
        event_id: validatedData.eventId,
        student_id: profile.id,
        status: validatedData.status,
      },
      update: {
        status: validatedData.status,
      },
    })

    res.json({
      success: true,
      message: 'RSVP updated successfully',
      data: { rsvp },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      })
      return
    }

    console.error('RSVP error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update RSVP',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

// =====================================================
// GET /api/student/analytics/personal
// Description: Get personal analytics
// =====================================================

router.get('/analytics/personal', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' })
      return
    }

    const profile = await prisma.studentProfile.findUnique({
      where: { user_id: req.user.id },
      select: {
        id: true,
        profile_complete_percent: true,
      },
    })

    if (!profile) {
      res.json({
        success: true,
        data: {
          profileCompleteness: 0,
          applicationsSubmitted: 0,
          interviewsAttended: 0,
          offersReceived: 0,
        },
      })
      return
    }

    // Get application stats
    const applicationsCount = await prisma.jobApplication.count({
      where: { student_id: profile.id },
    })

    // Get interviews count (assuming interviews are tracked in a separate table or status)
    const interviewsCount = await prisma.jobApplication.count({
      where: {
        student_id: profile.id,
        status: { in: ['INTERVIEW_SCHEDULED', 'INTERVIEW_COMPLETED'] },
      },
    })

    // Get offers count
    const offersCount = await prisma.offer.count({
      where: { student_id: profile.id },
    })

    res.json({
      success: true,
      data: {
        profileCompleteness: profile.profile_complete_percent || 0,
        applicationsSubmitted: applicationsCount,
        interviewsAttended: interviewsCount,
        offersReceived: offersCount,
      },
    })
  } catch (error) {
    console.error('Get personal analytics error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get personal analytics',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

// =====================================================
// GET /api/student/analytics/comparative
// Description: Get comparative analytics (anonymized peer data)
// =====================================================

router.get('/analytics/comparative', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' })
      return
    }

    const profile = await prisma.studentProfile.findUnique({
      where: { user_id: req.user.id },
      select: {
        id: true,
        department: true,
        expected_graduation_year: true,
      },
    })

    if (!profile) {
      res.json({
        success: true,
        data: {
          avgApplications: 0,
          avgInterviews: 0,
          avgOffers: 0,
          placementRate: 0,
        },
      })
      return
    }

    // Get peer students (same department and graduation year)
    const peerStudents = await prisma.studentProfile.findMany({
      where: {
        department: profile.department,
        expected_graduation_year: profile.expected_graduation_year,
        id: { not: profile.id }, // Exclude current student
      },
      select: { id: true },
    })

    const peerIds = peerStudents.map((p) => p.id)

    if (peerIds.length === 0) {
      res.json({
        success: true,
        data: {
          avgApplications: 0,
          avgInterviews: 0,
          avgOffers: 0,
          placementRate: 0,
        },
      })
      return
    }

    // Calculate averages
    const totalApplications = await prisma.jobApplication.count({
      where: { student_id: { in: peerIds } },
    })

    const totalInterviews = await prisma.jobApplication.count({
      where: {
        student_id: { in: peerIds },
        status: { in: ['INTERVIEW_SCHEDULED', 'INTERVIEW_COMPLETED'] },
      },
    })

    const totalOffers = await prisma.offer.count({
      where: { student_id: { in: peerIds } },
    })

    const studentsWithOffers = await prisma.offer.groupBy({
      by: ['student_id'],
      where: { student_id: { in: peerIds } },
    })

    const placementRate = (studentsWithOffers.length / peerIds.length) * 100

    res.json({
      success: true,
      data: {
        avgApplications: Math.round(totalApplications / peerIds.length),
        avgInterviews: Math.round(totalInterviews / peerIds.length),
        avgOffers: Math.round(totalOffers / peerIds.length),
        placementRate: Math.round(placementRate),
      },
    })
  } catch (error) {
    console.error('Get comparative analytics error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get comparative analytics',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

export default router
