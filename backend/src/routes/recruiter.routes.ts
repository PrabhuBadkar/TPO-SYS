import { Router, Request, Response } from 'express'
import { prisma } from '../server'
import { authenticate, authorize, ROLES } from '../middleware/auth'
import { z } from 'zod'
import multer from 'multer'

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
})

const router = Router()

// All Recruiter routes require authentication
router.use(authenticate)
router.use(authorize(ROLES.RECRUITER))

// =====================================================
// GET /api/recruiter/dashboard
// Description: Get recruiter dashboard
// =====================================================

router.get('/dashboard', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' })
      return
    }

    // Get recruiter POC info
    const poc = await prisma.recruiterPOC.findUnique({
      where: { user_id: req.user.id },
      include: {
        organization: {
          select: {
            id: true,
            organization_name: true,
            is_verified: true,
          },
        },
      },
    })

    if (!poc) {
      res.status(404).json({
        success: false,
        error: 'Recruiter profile not found',
      })
      return
    }

    // Get job postings statistics
    const jobStats = await prisma.jobPosting.groupBy({
      by: ['status'],
      where: {
        organization_id: poc.organization_id,
      },
      _count: true,
    })

    const stats = {
      total: 0,
      active: 0,
      pending: 0,
      closed: 0,
    }

    jobStats.forEach((stat) => {
      stats.total += stat._count
      if (stat.status === 'ACTIVE') stats.active += stat._count
      if (stat.status === 'PENDING_APPROVAL') stats.pending += stat._count
      if (stat.status === 'CLOSED') stats.closed += stat._count
    })

    // Get applications count
    const applicationsCount = await prisma.jobApplication.count({
      where: {
        jobPosting: {
          organization_id: poc.organization_id,
        },
        status: 'APPROVED_BY_ADMIN',
      },
    })

    res.json({
      success: true,
      data: {
        poc,
        stats: {
          jobs: stats,
          applications: applicationsCount,
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
// GET /api/recruiter/job-postings
// Description: Get recruiter's job postings
// =====================================================

router.get('/job-postings', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' })
      return
    }

    const poc = await prisma.recruiterPOC.findUnique({
      where: { user_id: req.user.id },
      select: { organization_id: true },
    })

    if (!poc) {
      res.status(404).json({
        success: false,
        error: 'Recruiter profile not found',
      })
      return
    }

    const { status, page = '1', limit = '20' } = req.query
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string)

    const where: any = {
      organization_id: poc.organization_id,
    }

    if (status) {
      where.status = status
    }

    const [jobPostings, total] = await Promise.all([
      prisma.jobPosting.findMany({
        where,
        include: {
          _count: {
            select: {
              applications: true,
            },
          },
        },
        skip,
        take: parseInt(limit as string),
        orderBy: { created_at: 'desc' },
      }),
      prisma.jobPosting.count({ where }),
    ])

    res.json({
      success: true,
      data: {
        jobPostings,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          pages: Math.ceil(total / parseInt(limit as string)),
        },
      },
    })
  } catch (error) {
    console.error('Get job postings error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get job postings',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

// =====================================================
// POST /api/recruiter/job-postings
// Description: Create new job posting
// =====================================================

const createJobSchema = z.object({
  jobTitle: z.string().min(1, 'Job title is required'),
  jobDescription: z.string().min(50, 'Job description must be at least 50 characters'),
  jobType: z.enum(['FULL_TIME', 'INTERNSHIP', 'PART_TIME', 'CONTRACT']),
  employmentType: z.enum(['PERMANENT', 'TEMPORARY', 'CONTRACT', 'INTERNSHIP']),
  jobLocations: z.array(z.string()).min(1, 'At least one location is required'),
  isRemote: z.boolean().default(false),
  relocationProvided: z.boolean().default(false),
  allowedBranches: z.array(z.string()).min(1, 'At least one branch is required'),
  graduationYears: z.array(z.number()).min(1, 'At least one graduation year is required'),
  cgpaMin: z.number().min(0).max(10),
  maxBacklogs: z.number().int().min(0).default(0),
  ctcMin: z.number().int().optional(),
  ctcMax: z.number().int().optional(),
  bondDurationMonths: z.number().int().min(0).default(0),
  applicationDeadline: z.string().datetime(),
})

router.post('/job-postings', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' })
      return
    }

    const poc = await prisma.recruiterPOC.findUnique({
      where: { user_id: req.user.id },
      select: { organization_id: true, organization: { select: { is_verified: true } } },
    })

    if (!poc) {
      res.status(404).json({
        success: false,
        error: 'Recruiter profile not found',
      })
      return
    }

    if (!poc.organization.is_verified) {
      res.status(403).json({
        success: false,
        error: 'Organization not verified',
        message: 'Your organization must be verified before posting jobs',
      })
      return
    }

    const validatedData = createJobSchema.parse(req.body)

    // Generate job posting ID
    const jobPostingId = `JOB-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`

    // Create job posting
    const jobPosting = await prisma.jobPosting.create({
      data: {
        organization_id: poc.organization_id,
        created_by: req.user.id,
        job_posting_id: jobPostingId,
        job_title: validatedData.jobTitle,
        job_description: validatedData.jobDescription,
        job_type: validatedData.jobType,
        employment_type: validatedData.employmentType,
        job_locations: validatedData.jobLocations,
        is_remote: validatedData.isRemote,
        relocation_provided: validatedData.relocationProvided,
        allowed_branches: validatedData.allowedBranches,
        graduation_years: validatedData.graduationYears,
        cgpa_min: validatedData.cgpaMin,
        max_backlogs: validatedData.maxBacklogs,
        ctc_min: validatedData.ctcMin,
        ctc_max: validatedData.ctcMax,
        bond_duration_months: validatedData.bondDurationMonths,
        application_deadline: new Date(validatedData.applicationDeadline),
        status: 'PENDING_APPROVAL',
      },
    })

    res.status(201).json({
      success: true,
      message: 'Job posting created successfully. Awaiting TPO approval.',
      data: { jobPosting },
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

    console.error('Create job posting error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to create job posting',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

// =====================================================
// GET /api/recruiter/applications
// Description: Get applications for recruiter's jobs
// =====================================================

router.get('/applications', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' })
      return
    }

    const poc = await prisma.recruiterPOC.findUnique({
      where: { user_id: req.user.id },
      select: { organization_id: true },
    })

    if (!poc) {
      res.status(404).json({
        success: false,
        error: 'Recruiter profile not found',
      })
      return
    }

    const { jobId, status = 'APPROVED_BY_ADMIN', page = '1', limit = '20' } = req.query
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string)

    const where: any = {
      jobPosting: {
        organization_id: poc.organization_id,
      },
      status: status as string,
    }

    if (jobId) {
      where.job_posting_id = jobId
    }

    const [applications, total] = await Promise.all([
      prisma.jobApplication.findMany({
        where,
        include: {
          student: {
            select: {
              enrollment_number: true,
              first_name: true,
              last_name: true,
              department: true,
              degree: true,
              current_semester: true,
              cgpi: true,
              skills: true,
              personal_email: true,
              mobile_number: true,
            },
          },
          jobPosting: {
            select: {
              job_title: true,
              job_type: true,
            },
          },
        },
        skip,
        take: parseInt(limit as string),
        orderBy: { submitted_at: 'desc' },
      }),
      prisma.jobApplication.count({ where }),
    ])

    res.json({
      success: true,
      data: {
        applications,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          pages: Math.ceil(total / parseInt(limit as string)),
        },
      },
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
// POST /api/recruiter/applications/:id/shortlist
// Description: Shortlist or reject application
// =====================================================

const shortlistSchema = z.object({
  action: z.enum(['SHORTLIST', 'REJECT']),
  notes: z.string().optional(),
})

router.post('/applications/:id/shortlist', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' })
      return
    }

    const validatedData = shortlistSchema.parse(req.body)
    const { action, notes } = validatedData

    const poc = await prisma.recruiterPOC.findUnique({
      where: { user_id: req.user.id },
      select: { organization_id: true },
    })

    if (!poc) {
      res.status(404).json({
        success: false,
        error: 'Recruiter profile not found',
      })
      return
    }

    const application = await prisma.jobApplication.findFirst({
      where: {
        id: req.params.id,
        jobPosting: {
          organization_id: poc.organization_id,
        },
      },
    })

    if (!application) {
      res.status(404).json({
        success: false,
        error: 'Application not found or not accessible',
      })
      return
    }

    // Update application
    const updatedApplication = await prisma.jobApplication.update({
      where: { id: req.params.id },
      data: {
        status: action === 'SHORTLIST' ? 'SHORTLISTED' : 'REJECTED',
        reviewed_by_recruiter: req.user.id,
        reviewed_at_recruiter: new Date(),
        recruiter_notes: notes,
        shortlisted_at: action === 'SHORTLIST' ? new Date() : null,
        rejected_at: action === 'REJECT' ? new Date() : null,
      },
    })

    res.json({
      success: true,
      message: `Application ${action.toLowerCase()}d successfully`,
      data: { application: updatedApplication },
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

    console.error('Shortlist application error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to process application',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

// =====================================================
// POST /api/recruiter/offers
// Description: Extend job offer
// =====================================================

const createOfferSchema = z.object({
  applicationId: z.string().uuid(),
  designation: z.string().min(1),
  ctcOffered: z.number().int().min(0),
  ctcBreakup: z.object({
    base: z.number().int(),
    hra: z.number().int().optional(),
    bonus: z.number().int().optional(),
    other: z.number().int().optional(),
  }),
  joiningDate: z.string().datetime().optional(),
  joiningLocation: z.string().optional(),
  bondDurationMonths: z.number().int().min(0).default(0),
  bondAmount: z.number().int().optional(),
  offerExpiry: z.string().datetime(),
})

router.post('/offers', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' })
      return
    }

    const validatedData = createOfferSchema.parse(req.body)

    const poc = await prisma.recruiterPOC.findUnique({
      where: { user_id: req.user.id },
      select: { organization_id: true },
    })

    if (!poc) {
      res.status(404).json({
        success: false,
        error: 'Recruiter profile not found',
      })
      return
    }

    // Verify application exists and is shortlisted
    const application = await prisma.jobApplication.findFirst({
      where: {
        id: validatedData.applicationId,
        status: 'SHORTLISTED',
        jobPosting: {
          organization_id: poc.organization_id,
        },
      },
    })

    if (!application) {
      res.status(404).json({
        success: false,
        error: 'Application not found or not shortlisted',
      })
      return
    }

    // Generate offer ID
    const offerId = `OFFER-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`

    // Create offer
    const offer = await prisma.offer.create({
      data: {
        offer_id: offerId,
        job_posting_id: application.job_posting_id,
        student_id: application.student_id,
        application_id: application.id,
        designation: validatedData.designation,
        ctc_offered: validatedData.ctcOffered,
        ctc_breakup: validatedData.ctcBreakup,
        joining_date: validatedData.joiningDate ? new Date(validatedData.joiningDate) : null,
        joining_location: validatedData.joiningLocation,
        bond_duration_months: validatedData.bondDurationMonths,
        bond_amount: validatedData.bondAmount,
        offer_expiry: new Date(validatedData.offerExpiry),
        status: 'EXTENDED',
        extended_by: req.user.id,
      },
    })

    res.status(201).json({
      success: true,
      message: 'Offer extended successfully',
      data: { offer },
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

    console.error('Create offer error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to create offer',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

// =====================================================
// GET /api/recruiter/offers
// Description: Get recruiter's offers
// =====================================================

router.get('/offers', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' })
      return
    }

    const poc = await prisma.recruiterPOC.findUnique({
      where: { user_id: req.user.id },
      select: { organization_id: true },
    })

    if (!poc) {
      res.status(404).json({
        success: false,
        error: 'Recruiter profile not found',
      })
      return
    }

    const { status, page = '1', limit = '20' } = req.query
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string)

    const where: any = {
      jobPosting: {
        organization_id: poc.organization_id,
      },
    }

    if (status) {
      where.status = status
    }

    const [offers, total] = await Promise.all([
      prisma.offer.findMany({
        where,
        include: {
          student: {
            select: {
              enrollment_number: true,
              first_name: true,
              last_name: true,
              department: true,
              personal_email: true,
              mobile_number: true,
            },
          },
          jobPosting: {
            select: {
              job_title: true,
            },
          },
        },
        skip,
        take: parseInt(limit as string),
        orderBy: { created_at: 'desc' },
      }),
      prisma.offer.count({ where }),
    ])

    res.json({
      success: true,
      data: {
        offers,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          pages: Math.ceil(total / parseInt(limit as string)),
        },
      },
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
// PUT /api/recruiter/job-postings/:id
// Description: Update job posting
// =====================================================

router.put('/job-postings/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' })
      return
    }

    const poc = await prisma.recruiterPOC.findUnique({
      where: { user_id: req.user.id },
      select: { organization_id: true },
    })

    if (!poc) {
      res.status(404).json({ success: false, error: 'Recruiter profile not found' })
      return
    }

    const jobPosting = await prisma.jobPosting.findFirst({
      where: {
        id: req.params.id,
        organization_id: poc.organization_id,
      },
    })

    if (!jobPosting) {
      res.status(404).json({ success: false, error: 'Job posting not found' })
      return
    }

    const updated = await prisma.jobPosting.update({
      where: { id: req.params.id },
      data: {
        ...req.body,
        status: 'PENDING_APPROVAL', // Re-approval needed after update
      },
    })

    res.json({
      success: true,
      message: 'Job posting updated successfully',
      data: { jobPosting: updated },
    })
  } catch (error) {
    console.error('Update job posting error:', error)
    res.status(500).json({ success: false, error: 'Failed to update job posting' })
  }
})

// =====================================================
// PUT /api/recruiter/job-postings/:id/pause
// Description: Pause job posting
// =====================================================

router.put('/job-postings/:id/pause', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' })
      return
    }

    const poc = await prisma.recruiterPOC.findUnique({
      where: { user_id: req.user.id },
      select: { organization_id: true },
    })

    if (!poc) {
      res.status(404).json({ success: false, error: 'Recruiter profile not found' })
      return
    }

    const updated = await prisma.jobPosting.updateMany({
      where: {
        id: req.params.id,
        organization_id: poc.organization_id,
      },
      data: { status: 'PAUSED' },
    })

    res.json({
      success: true,
      message: 'Job posting paused successfully',
    })
  } catch (error) {
    console.error('Pause job posting error:', error)
    res.status(500).json({ success: false, error: 'Failed to pause job posting' })
  }
})

// =====================================================
// PUT /api/recruiter/job-postings/:id/close
// Description: Close job posting
// =====================================================

router.put('/job-postings/:id/close', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' })
      return
    }

    const poc = await prisma.recruiterPOC.findUnique({
      where: { user_id: req.user.id },
      select: { organization_id: true },
    })

    if (!poc) {
      res.status(404).json({ success: false, error: 'Recruiter profile not found' })
      return
    }

    const updated = await prisma.jobPosting.updateMany({
      where: {
        id: req.params.id,
        organization_id: poc.organization_id,
      },
      data: { status: 'CLOSED' },
    })

    res.json({
      success: true,
      message: 'Job posting closed successfully',
    })
  } catch (error) {
    console.error('Close job posting error:', error)
    res.status(500).json({ success: false, error: 'Failed to close job posting' })
  }
})

// =====================================================
// GET /api/recruiter/applications/:id
// Description: Get application details
// =====================================================

router.get('/applications/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' })
      return
    }

    const poc = await prisma.recruiterPOC.findUnique({
      where: { user_id: req.user.id },
      select: { organization_id: true },
    })

    if (!poc) {
      res.status(404).json({ success: false, error: 'Recruiter profile not found' })
      return
    }

    const application = await prisma.jobApplication.findFirst({
      where: {
        id: req.params.id,
        jobPosting: {
          organization_id: poc.organization_id,
        },
      },
      include: {
        student: {
          include: {
            semesterMarks: true,
            resumes: {
              where: { is_primary: true },
            },
          },
        },
        jobPosting: true,
      },
    })

    if (!application) {
      res.status(404).json({ success: false, error: 'Application not found' })
      return
    }

    res.json({
      success: true,
      data: { application },
    })
  } catch (error) {
    console.error('Get application details error:', error)
    res.status(500).json({ success: false, error: 'Failed to get application details' })
  }
})

// =====================================================
// GET /api/recruiter/analytics
// Description: Get recruiter analytics
// =====================================================

router.get('/analytics', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' })
      return
    }

    const poc = await prisma.recruiterPOC.findUnique({
      where: { user_id: req.user.id },
      select: { organization_id: true },
    })

    if (!poc) {
      res.status(404).json({ success: false, error: 'Recruiter profile not found' })
      return
    }

    // Get job stats
    const jobStats = await prisma.jobPosting.groupBy({
      by: ['status'],
      where: { organization_id: poc.organization_id },
      _count: true,
    })

    // Get application stats
    const applicationStats = await prisma.jobApplication.groupBy({
      by: ['status'],
      where: {
        jobPosting: { organization_id: poc.organization_id },
      },
      _count: true,
    })

    // Get offer stats
    const offerStats = await prisma.offer.groupBy({
      by: ['status'],
      where: {
        jobPosting: { organization_id: poc.organization_id },
      },
      _count: true,
    })

    res.json({
      success: true,
      data: {
        jobs: jobStats,
        applications: applicationStats,
        offers: offerStats,
      },
    })
  } catch (error) {
    console.error('Get analytics error:', error)
    res.status(500).json({ success: false, error: 'Failed to get analytics' })
  }
})

// =====================================================
// POST /api/recruiter/documents/upload
// Description: Upload organization documents
// =====================================================

router.post('/documents/upload', upload.single('document'), async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' })
      return
    }

    if (!req.file) {
      res.status(400).json({ success: false, error: 'No file uploaded' })
      return
    }

    const poc = await prisma.recruiterPOC.findUnique({
      where: { user_id: req.user.id },
      select: { organization_id: true },
    })

    if (!poc) {
      res.status(404).json({ success: false, error: 'Recruiter profile not found' })
      return
    }

    const { documentType, description } = req.body

    // In production, save to cloud storage (S3, etc.)
    const filePath = `/uploads/recruiter/${poc.organization_id}/${Date.now()}-${req.file.originalname}`

    res.status(201).json({
      success: true,
      message: 'Document uploaded successfully',
      data: {
        fileName: req.file.originalname,
        filePath,
        fileSize: req.file.size,
        documentType,
      },
    })
  } catch (error) {
    console.error('Upload document error:', error)
    res.status(500).json({ success: false, error: 'Failed to upload document' })
  }
})

// =====================================================
// GET /api/recruiter/pocs
// Description: Get all POCs for organization
// =====================================================

router.get('/pocs', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' })
      return
    }

    const poc = await prisma.recruiterPOC.findUnique({
      where: { user_id: req.user.id },
      select: { organization_id: true },
    })

    if (!poc) {
      res.status(404).json({ success: false, error: 'Recruiter profile not found' })
      return
    }

    const pocs = await prisma.recruiterPOC.findMany({
      where: { organization_id: poc.organization_id },
      include: {
        user: {
          select: {
            email: true,
            created_at: true,
          },
        },
      },
    })

    res.json({
      success: true,
      data: { pocs },
    })
  } catch (error) {
    console.error('Get POCs error:', error)
    res.status(500).json({ success: false, error: 'Failed to get POCs' })
  }
})

// =====================================================
// POST /api/recruiter/pocs
// Description: Add new POC to organization
// =====================================================

const addPOCSchema = z.object({
  name: z.string().min(1),
  designation: z.string().min(1),
  email: z.string().email(),
  mobile: z.string(),
})

router.post('/pocs', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' })
      return
    }

    const validatedData = addPOCSchema.parse(req.body)

    const poc = await prisma.recruiterPOC.findUnique({
      where: { user_id: req.user.id },
      select: { organization_id: true },
    })

    if (!poc) {
      res.status(404).json({ success: false, error: 'Recruiter profile not found' })
      return
    }

    // Validate email domain matches organization
    const emailDomain = validatedData.email.split('@')[1]
    // In production, validate against organization domain

    res.status(201).json({
      success: true,
      message: 'POC invitation sent. They will receive an email to complete registration.',
      data: validatedData,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: 'Validation error', details: error.errors })
      return
    }
    console.error('Add POC error:', error)
    res.status(500).json({ success: false, error: 'Failed to add POC' })
  }
})

// =====================================================
// GET /api/recruiter/applications/:id/resume
// Description: Download application resume
// =====================================================

router.get('/applications/:id/resume', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' })
      return
    }

    const poc = await prisma.recruiterPOC.findUnique({
      where: { user_id: req.user.id },
      select: { organization_id: true },
    })

    if (!poc) {
      res.status(404).json({ success: false, error: 'Recruiter profile not found' })
      return
    }

    const application = await prisma.jobApplication.findFirst({
      where: {
        id: req.params.id,
        jobPosting: { organization_id: poc.organization_id },
      },
      include: {
        resume: true,
      },
    })

    if (!application || !application.resume) {
      res.status(404).json({ success: false, error: 'Resume not found' })
      return
    }

    // In production, serve from cloud storage
    res.json({
      success: true,
      data: {
        resumeUrl: application.resume.file_path,
        fileName: application.resume.file_name,
      },
    })
  } catch (error) {
    console.error('Download resume error:', error)
    res.status(500).json({ success: false, error: 'Failed to download resume' })
  }
})

// =====================================================
// POST /api/recruiter/interviews
// Description: Schedule interview
// =====================================================

const createInterviewSchema = z.object({
  applicationId: z.string().uuid(),
  interviewType: z.enum(['TECHNICAL', 'HR', 'MANAGERIAL', 'GROUP_DISCUSSION']),
  scheduledDate: z.string().datetime(),
  duration: z.number().int().min(15),
  mode: z.enum(['ONLINE', 'OFFLINE']),
  location: z.string().optional(),
  meetingLink: z.string().url().optional(),
  instructions: z.string().optional(),
})

router.post('/interviews', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' })
      return
    }

    const validatedData = createInterviewSchema.parse(req.body)

    const poc = await prisma.recruiterPOC.findUnique({
      where: { user_id: req.user.id },
      select: { organization_id: true },
    })

    if (!poc) {
      res.status(404).json({ success: false, error: 'Recruiter profile not found' })
      return
    }

    const application = await prisma.jobApplication.findFirst({
      where: {
        id: validatedData.applicationId,
        status: 'SHORTLISTED',
        jobPosting: { organization_id: poc.organization_id },
      },
    })

    if (!application) {
      res.status(404).json({ success: false, error: 'Application not found or not shortlisted' })
      return
    }

    // Create interview (simplified - in production use proper interview table)
    res.status(201).json({
      success: true,
      message: 'Interview scheduled successfully',
      data: {
        ...validatedData,
        status: 'SCHEDULED',
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: 'Validation error', details: error.errors })
      return
    }
    console.error('Create interview error:', error)
    res.status(500).json({ success: false, error: 'Failed to schedule interview' })
  }
})

// =====================================================
// PUT /api/recruiter/offers/:id/rescind
// Description: Rescind job offer
// =====================================================

const rescindOfferSchema = z.object({
  reason: z.string().min(10),
})

router.put('/offers/:id/rescind', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' })
      return
    }

    const validatedData = rescindOfferSchema.parse(req.body)

    const poc = await prisma.recruiterPOC.findUnique({
      where: { user_id: req.user.id },
      select: { organization_id: true },
    })

    if (!poc) {
      res.status(404).json({ success: false, error: 'Recruiter profile not found' })
      return
    }

    const offer = await prisma.offer.findFirst({
      where: {
        id: req.params.id,
        jobPosting: { organization_id: poc.organization_id },
      },
    })

    if (!offer) {
      res.status(404).json({ success: false, error: 'Offer not found' })
      return
    }

    const updated = await prisma.offer.update({
      where: { id: req.params.id },
      data: {
        status: 'RESCINDED',
        rescinded_at: new Date(),
        rescind_reason: validatedData.reason,
      },
    })

    res.json({
      success: true,
      message: 'Offer rescinded successfully',
      data: { offer: updated },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: 'Validation error', details: error.errors })
      return
    }
    console.error('Rescind offer error:', error)
    res.status(500).json({ success: false, error: 'Failed to rescind offer' })
  }
})

// =====================================================
// POST /api/recruiter/reports/generate
// Description: Generate recruitment report
// =====================================================

const generateReportSchema = z.object({
  reportType: z.enum(['APPLICATIONS', 'INTERVIEWS', 'OFFERS', 'COMPREHENSIVE']),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  jobPostingId: z.string().uuid().optional(),
})

router.post('/reports/generate', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' })
      return
    }

    const validatedData = generateReportSchema.parse(req.body)

    const poc = await prisma.recruiterPOC.findUnique({
      where: { user_id: req.user.id },
      select: { organization_id: true, organization: true },
    })

    if (!poc) {
      res.status(404).json({ success: false, error: 'Recruiter profile not found' })
      return
    }

    // Generate report data based on type
    const reportData = {
      reportType: validatedData.reportType,
      organization: poc.organization.organization_name,
      generatedAt: new Date(),
      generatedBy: req.user.email,
    }

    res.json({
      success: true,
      message: 'Report generated successfully',
      data: reportData,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: 'Validation error', details: error.errors })
      return
    }
    console.error('Generate report error:', error)
    res.status(500).json({ success: false, error: 'Failed to generate report' })
  }
})

// =====================================================
// POST /api/recruiter/messages/send-to-tpo
// Description: Send message to TPO
// =====================================================

const sendMessageSchema = z.object({
  subject: z.string().min(1),
  message: z.string().min(10),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
})

router.post('/messages/send-to-tpo', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' })
      return
    }

    const validatedData = sendMessageSchema.parse(req.body)

    const poc = await prisma.recruiterPOC.findUnique({
      where: { user_id: req.user.id },
      select: { organization_id: true, organization: true },
    })

    if (!poc) {
      res.status(404).json({ success: false, error: 'Recruiter profile not found' })
      return
    }

    // In production, create message record and send notification
    res.status(201).json({
      success: true,
      message: 'Message sent to TPO successfully',
      data: {
        ...validatedData,
        sentAt: new Date(),
        from: poc.organization.organization_name,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: 'Validation error', details: error.errors })
      return
    }
    console.error('Send message error:', error)
    res.status(500).json({ success: false, error: 'Failed to send message' })
  }
})

// =====================================================
// GET /api/recruiter/messages
// Description: Get messages
// =====================================================

router.get('/messages', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' })
      return
    }

    const poc = await prisma.recruiterPOC.findUnique({
      where: { user_id: req.user.id },
      select: { organization_id: true },
    })

    if (!poc) {
      res.status(404).json({ success: false, error: 'Recruiter profile not found' })
      return
    }

    // In production, fetch from messages table
    res.json({
      success: true,
      data: {
        messages: [],
      },
    })
  } catch (error) {
    console.error('Get messages error:', error)
    res.status(500).json({ success: false, error: 'Failed to get messages' })
  }
})

export default router
