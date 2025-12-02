// Job Posting Service - Create and Manage Job Descriptions
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface JobPostingData {
  job_title: string;
  description: string;
  required_skills?: string[];
  qualifications?: string;
  responsibilities?: string;
  work_location: string;
  employment_type: string;
  eligibility_criteria: {
    cgpa_min: number;
    max_backlogs: number;
    allowed_branches: string[];
    graduation_year: number;
    degree: string[];
  };
  ctc_breakdown: {
    base_salary: number;
    variable_pay: number;
    benefits: number;
    joining_bonus: number;
    total_ctc: number;
  };
  selection_process: {
    rounds: string[];
    timeline: string;
    mode: string;
  };
  bond_terms?: {
    duration_months: number;
    amount: number;
    terms: string;
    notice_period_days: number;
  };
  application_deadline: Date;
}

export class JobPostingService {
  /**
   * Create a new job posting
   */
  static async createJobPosting(userId: string, data: JobPostingData) {
    try {
      // Get POC and organization
      const poc = await prisma.pOC.findUnique({
        where: { user_id: userId },
        include: { organization: true }
      });

      if (!poc) {
        throw new Error('POC not found');
      }

      if (poc.organization.recruiter_status !== 'VERIFIED') {
        throw new Error('Organization must be verified before posting jobs');
      }

      // Validate eligibility criteria
      if (data.eligibility_criteria.cgpa_min < 0 || data.eligibility_criteria.cgpa_min > 10) {
        throw new Error('CGPA must be between 0 and 10');
      }

      if (data.eligibility_criteria.max_backlogs < 0 || data.eligibility_criteria.max_backlogs > 5) {
        throw new Error('Max backlogs must be between 0 and 5');
      }

      // Validate CTC
      if (data.ctc_breakdown.total_ctc <= 0) {
        throw new Error('Total CTC must be greater than 0');
      }

      // Validate bond terms
      if (data.bond_terms && data.bond_terms.duration_months > 24) {
        console.warn('Bond duration > 24 months requires special approval');
      }

      // Validate application deadline
      const deadline = new Date(data.application_deadline);
      if (deadline <= new Date()) {
        throw new Error('Application deadline must be in the future');
      }

      // Create job posting
      const jobPosting = await prisma.jobPosting.create({
        data: {
          org_id: poc.org_id,
          created_by: userId,
          job_title: data.job_title,
          description: data.description,
          required_skills: data.required_skills || [],
          qualifications: data.qualifications,
          responsibilities: data.responsibilities,
          work_location: data.work_location,
          employment_type: data.employment_type,
          eligibility_criteria: data.eligibility_criteria as any,
          ctc_breakdown: data.ctc_breakdown as any,
          selection_process: data.selection_process as any,
          bond_terms: data.bond_terms as any,
          application_deadline: deadline,
          status: 'DRAFT'
        }
      });

      return {
        success: true,
        message: 'Job posting created successfully',
        data: jobPosting
      };
    } catch (error: any) {
      console.error('Create job posting error:', error);
      throw new Error(error.message || 'Failed to create job posting');
    }
  }

  /**
   * Update job posting (only if draft or modifications requested)
   */
  static async updateJobPosting(userId: string, jobPostingId: string, data: Partial<JobPostingData>) {
    try {
      const poc = await prisma.pOC.findUnique({
        where: { user_id: userId }
      });

      if (!poc) {
        throw new Error('POC not found');
      }

      const jobPosting = await prisma.jobPosting.findUnique({
        where: { id: jobPostingId }
      });

      if (!jobPosting) {
        throw new Error('Job posting not found');
      }

      if (jobPosting.org_id !== poc.org_id) {
        throw new Error('Unauthorized to update this job posting');
      }

      if (!['DRAFT', 'REJECTED'].includes(jobPosting.status)) {
        throw new Error('Can only update draft or rejected job postings');
      }

      const updatedJobPosting = await prisma.jobPosting.update({
        where: { id: jobPostingId },
        data: {
          ...data,
          eligibility_criteria: data.eligibility_criteria as any,
          ctc_breakdown: data.ctc_breakdown as any,
          selection_process: data.selection_process as any,
          bond_terms: data.bond_terms as any,
          status: 'DRAFT', // Reset to draft after update
          updated_at: new Date()
        }
      });

      return {
        success: true,
        message: 'Job posting updated successfully',
        data: updatedJobPosting
      };
    } catch (error: any) {
      console.error('Update job posting error:', error);
      throw new Error(error.message || 'Failed to update job posting');
    }
  }

  /**
   * Submit job posting for approval
   */
  static async submitForApproval(userId: string, jobPostingId: string) {
    try {
      const poc = await prisma.pOC.findUnique({
        where: { user_id: userId }
      });

      if (!poc) {
        throw new Error('POC not found');
      }

      const jobPosting = await prisma.jobPosting.findUnique({
        where: { id: jobPostingId }
      });

      if (!jobPosting) {
        throw new Error('Job posting not found');
      }

      if (jobPosting.org_id !== poc.org_id) {
        throw new Error('Unauthorized to submit this job posting');
      }

      if (jobPosting.status !== 'DRAFT') {
        throw new Error('Only draft job postings can be submitted for approval');
      }

      const updatedJobPosting = await prisma.jobPosting.update({
        where: { id: jobPostingId },
        data: {
          status: 'PENDING_APPROVAL',
          updated_at: new Date()
        }
      });

      return {
        success: true,
        message: 'Job posting submitted for TPO Admin approval',
        data: updatedJobPosting
      };
    } catch (error: any) {
      console.error('Submit for approval error:', error);
      throw new Error(error.message || 'Failed to submit job posting');
    }
  }

  /**
   * Get all job postings for recruiter's organization
   */
  static async getJobPostings(userId: string, filters?: {
    status?: string;
    employment_type?: string;
    search?: string;
  }) {
    try {
      const poc = await prisma.pOC.findUnique({
        where: { user_id: userId }
      });

      if (!poc) {
        throw new Error('POC not found');
      }

      const where: any = {
        org_id: poc.org_id,
        deleted_at: null
      };

      if (filters?.status) {
        where.status = filters.status;
      }

      if (filters?.employment_type) {
        where.employment_type = filters.employment_type;
      }

      if (filters?.search) {
        where.OR = [
          { job_title: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } }
        ];
      }

      const jobPostings = await prisma.jobPosting.findMany({
        where,
        include: {
          _count: {
            select: {
              applications: true
            }
          }
        },
        orderBy: { created_at: 'desc' }
      });

      return {
        success: true,
        data: jobPostings
      };
    } catch (error: any) {
      console.error('Get job postings error:', error);
      throw new Error(error.message || 'Failed to get job postings');
    }
  }

  /**
   * Get job posting details
   */
  static async getJobPostingDetails(userId: string, jobPostingId: string) {
    try {
      const poc = await prisma.pOC.findUnique({
        where: { user_id: userId }
      });

      if (!poc) {
        throw new Error('POC not found');
      }

      const jobPosting = await prisma.jobPosting.findUnique({
        where: { id: jobPostingId },
        include: {
          organization: {
            select: {
              org_name: true,
              website: true,
              industry: true
            }
          },
          _count: {
            select: {
              applications: true,
              offers: true
            }
          }
        }
      });

      if (!jobPosting) {
        throw new Error('Job posting not found');
      }

      if (jobPosting.org_id !== poc.org_id) {
        throw new Error('Unauthorized to view this job posting');
      }

      return {
        success: true,
        data: jobPosting
      };
    } catch (error: any) {
      console.error('Get job posting details error:', error);
      throw new Error(error.message || 'Failed to get job posting details');
    }
  }

  /**
   * Pause job posting
   */
  static async pauseJobPosting(userId: string, jobPostingId: string) {
    try {
      const poc = await prisma.pOC.findUnique({
        where: { user_id: userId }
      });

      if (!poc) {
        throw new Error('POC not found');
      }

      const jobPosting = await prisma.jobPosting.findUnique({
        where: { id: jobPostingId }
      });

      if (!jobPosting) {
        throw new Error('Job posting not found');
      }

      if (jobPosting.org_id !== poc.org_id) {
        throw new Error('Unauthorized to pause this job posting');
      }

      if (jobPosting.status !== 'ACTIVE') {
        throw new Error('Only active job postings can be paused');
      }

      const updatedJobPosting = await prisma.jobPosting.update({
        where: { id: jobPostingId },
        data: {
          status: 'PAUSED',
          updated_at: new Date()
        }
      });

      return {
        success: true,
        message: 'Job posting paused successfully',
        data: updatedJobPosting
      };
    } catch (error: any) {
      console.error('Pause job posting error:', error);
      throw new Error(error.message || 'Failed to pause job posting');
    }
  }

  /**
   * Resume job posting
   */
  static async resumeJobPosting(userId: string, jobPostingId: string) {
    try {
      const poc = await prisma.pOC.findUnique({
        where: { user_id: userId }
      });

      if (!poc) {
        throw new Error('POC not found');
      }

      const jobPosting = await prisma.jobPosting.findUnique({
        where: { id: jobPostingId }
      });

      if (!jobPosting) {
        throw new Error('Job posting not found');
      }

      if (jobPosting.org_id !== poc.org_id) {
        throw new Error('Unauthorized to resume this job posting');
      }

      if (jobPosting.status !== 'PAUSED') {
        throw new Error('Only paused job postings can be resumed');
      }

      const updatedJobPosting = await prisma.jobPosting.update({
        where: { id: jobPostingId },
        data: {
          status: 'ACTIVE',
          updated_at: new Date()
        }
      });

      return {
        success: true,
        message: 'Job posting resumed successfully',
        data: updatedJobPosting
      };
    } catch (error: any) {
      console.error('Resume job posting error:', error);
      throw new Error(error.message || 'Failed to resume job posting');
    }
  }

  /**
   * Close job posting
   */
  static async closeJobPosting(userId: string, jobPostingId: string) {
    try {
      const poc = await prisma.pOC.findUnique({
        where: { user_id: userId }
      });

      if (!poc) {
        throw new Error('POC not found');
      }

      const jobPosting = await prisma.jobPosting.findUnique({
        where: { id: jobPostingId }
      });

      if (!jobPosting) {
        throw new Error('Job posting not found');
      }

      if (jobPosting.org_id !== poc.org_id) {
        throw new Error('Unauthorized to close this job posting');
      }

      if (!['ACTIVE', 'PAUSED'].includes(jobPosting.status)) {
        throw new Error('Only active or paused job postings can be closed');
      }

      const updatedJobPosting = await prisma.jobPosting.update({
        where: { id: jobPostingId },
        data: {
          status: 'CLOSED',
          updated_at: new Date()
        }
      });

      return {
        success: true,
        message: 'Job posting closed successfully',
        data: updatedJobPosting
      };
    } catch (error: any) {
      console.error('Close job posting error:', error);
      throw new Error(error.message || 'Failed to close job posting');
    }
  }

  /**
   * Clone job posting
   */
  static async cloneJobPosting(userId: string, jobPostingId: string) {
    try {
      const poc = await prisma.pOC.findUnique({
        where: { user_id: userId }
      });

      if (!poc) {
        throw new Error('POC not found');
      }

      const jobPosting = await prisma.jobPosting.findUnique({
        where: { id: jobPostingId }
      });

      if (!jobPosting) {
        throw new Error('Job posting not found');
      }

      if (jobPosting.org_id !== poc.org_id) {
        throw new Error('Unauthorized to clone this job posting');
      }

      // Create new job posting with same data
      const clonedJobPosting = await prisma.jobPosting.create({
        data: {
          org_id: jobPosting.org_id,
          created_by: userId,
          job_title: `${jobPosting.job_title} (Copy)`,
          description: jobPosting.description,
          required_skills: jobPosting.required_skills,
          qualifications: jobPosting.qualifications,
          responsibilities: jobPosting.responsibilities,
          work_location: jobPosting.work_location,
          employment_type: jobPosting.employment_type,
          eligibility_criteria: jobPosting.eligibility_criteria,
          ctc_breakdown: jobPosting.ctc_breakdown,
          selection_process: jobPosting.selection_process,
          bond_terms: jobPosting.bond_terms,
          application_deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          status: 'DRAFT'
        }
      });

      return {
        success: true,
        message: 'Job posting cloned successfully',
        data: clonedJobPosting
      };
    } catch (error: any) {
      console.error('Clone job posting error:', error);
      throw new Error(error.message || 'Failed to clone job posting');
    }
  }
}

export default JobPostingService;
