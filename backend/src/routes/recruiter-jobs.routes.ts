import { Router, Request, Response } from 'express';
import { prisma } from '../server';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// =====================================================
// POST /api/public/recruiters/jobs/create
// Description: Create job posting (status: PENDING_APPROVAL)
// =====================================================

router.post('/create', authenticate, authorize('ROLE_RECRUITER'), async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    
    // Get POC and organization details
    const poc = await prisma.pOC.findUnique({
      where: { user_id: userId },
      include: { organization: true },
    });

    if (!poc) {
      res.status(404).json({
        success: false,
        error: 'POC details not found',
      });
      return;
    }

    if (poc.organization.recruiter_status !== 'VERIFIED') {
      res.status(403).json({
        success: false,
        error: 'Organization must be verified before posting jobs',
      });
      return;
    }

    const {
      job_title,
      description,
      responsibilities,
      required_skills,
      qualifications,
      work_location,
      employment_type,
      eligibility_criteria,
      ctc_breakdown,
      selection_process,
      bond_terms,
      application_deadline,
    } = req.body;

    // Validate required fields
    if (!job_title || !description || !work_location || !application_deadline) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields',
      });
      return;
    }

    // Validate eligibility criteria
    if (!eligibility_criteria.degree || eligibility_criteria.degree.length === 0) {
      res.status(400).json({
        success: false,
        error: 'At least one degree must be selected',
      });
      return;
    }

    if (!eligibility_criteria.allowed_branches || eligibility_criteria.allowed_branches.length === 0) {
      res.status(400).json({
        success: false,
        error: 'At least one branch must be selected',
      });
      return;
    }

    // Validate CGPA
    if (eligibility_criteria.cgpa_min < 6.0 || eligibility_criteria.cgpa_min > 10.0) {
      res.status(400).json({
        success: false,
        error: 'CGPA must be between 6.0 and 10.0',
      });
      return;
    }

    // Validate bond duration
    if (bond_terms && bond_terms.duration_months > 24) {
      res.status(400).json({
        success: false,
        error: 'Bond duration cannot exceed 24 months (2 years)',
      });
      return;
    }

    // Create job posting
    const jobPosting = await prisma.jobPosting.create({
      data: {
        org_id: poc.org_id,
        created_by: userId,
        job_title,
        description,
        responsibilities: responsibilities || '',
        required_skills: required_skills || [],
        qualifications: qualifications || '',
        work_location,
        employment_type,
        eligibility_criteria,
        ctc_breakdown,
        selection_process,
        bond_terms: bond_terms || null,
        application_deadline: new Date(application_deadline),
        status: 'PENDING_APPROVAL', // Requires TPO Admin approval
      },
    });

    console.log('Job posting created:', jobPosting.id, 'by', poc.poc_name, 'for', poc.organization.org_name);

    // TODO: Send notification to TPO Admin
    // TODO: Create audit log entry

    res.status(201).json({
      success: true,
      message: 'Job posting submitted for TPO Admin approval',
      data: {
        id: jobPosting.id,
        status: jobPosting.status,
        job_title: jobPosting.job_title,
      },
    });
  } catch (error) {
    console.error('Job posting creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create job posting',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// =====================================================
// GET /api/public/recruiters/jobs/list
// Description: Get all job postings for recruiter
// =====================================================

router.get('/list', authenticate, authorize('ROLE_RECRUITER'), async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    
    const poc = await prisma.pOC.findUnique({
      where: { user_id: userId },
    });

    if (!poc) {
      res.status(404).json({
        success: false,
        error: 'POC details not found',
      });
      return;
    }

    const jobPostings = await prisma.jobPosting.findMany({
      where: {
        org_id: poc.org_id,
        deleted_at: null,
      },
      orderBy: {
        created_at: 'desc',
      },
      include: {
        _count: {
          select: {
            applications: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: jobPostings,
    });
  } catch (error) {
    console.error('Job postings fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch job postings',
    });
  }
});

// =====================================================
// GET /api/public/recruiters/jobs/:id
// Description: Get job posting details
// =====================================================

router.get('/:id', authenticate, authorize('ROLE_RECRUITER'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    
    const poc = await prisma.pOC.findUnique({
      where: { user_id: userId },
    });

    if (!poc) {
      res.status(404).json({
        success: false,
        error: 'POC details not found',
      });
      return;
    }

    const jobPosting = await prisma.jobPosting.findFirst({
      where: {
        id,
        org_id: poc.org_id,
        deleted_at: null,
      },
      include: {
        _count: {
          select: {
            applications: true,
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

export default router;
