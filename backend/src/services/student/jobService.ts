import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class JobService {
  /**
   * Get all active jobs with eligibility check
   */
  async getActiveJobs(studentId: string, filters?: any) {
    const profile = await prisma.studentProfile.findUnique({
      where: { user_id: studentId },
    });

    if (!profile) {
      throw new Error('Student profile not found');
    }

    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      status: 'ACTIVE',
      application_deadline: {
        gte: new Date(),
      },
    };

    if (filters?.company) {
      where.organization = {
        organization_name: {
          contains: filters.company,
          mode: 'insensitive',
        },
      };
    }

    if (filters?.role) {
      where.job_title = {
        contains: filters.role,
        mode: 'insensitive',
      };
    }

    if (filters?.ctc_min) {
      where.ctc_min = {
        gte: parseFloat(filters.ctc_min),
      };
    }

    if (filters?.location) {
      where.job_locations = {
        has: filters.location,
      };
    }

    const [jobs, total] = await Promise.all([
      prisma.jobPosting.findMany({
        where,
        include: {
          organization: {
            select: {
              id: true,
              organization_name: true,
              industry: true,
              website: true,
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.jobPosting.count({ where }),
    ]);

    // Check eligibility for each job
    const jobsWithEligibility = await Promise.all(
      jobs.map(async (job) => {
        const eligibility = await this.checkEligibility(profile, job);
        return {
          ...job,
          eligibility,
        };
      })
    );

    // Filter by eligible_only if requested
    const filteredJobs = filters?.eligible_only
      ? jobsWithEligibility.filter((job) => job.eligibility.eligible)
      : jobsWithEligibility;

    return {
      jobs: filteredJobs,
      pagination: {
        page,
        limit,
        total: filters?.eligible_only ? filteredJobs.length : total,
        pages: Math.ceil((filters?.eligible_only ? filteredJobs.length : total) / limit),
      },
    };
  }

  /**
   * Get job details
   */
  async getJobDetails(jobId: string, studentId: string) {
    const profile = await prisma.studentProfile.findUnique({
      where: { user_id: studentId },
    });

    if (!profile) {
      throw new Error('Student profile not found');
    }

    const job = await prisma.jobPosting.findUnique({
      where: { id: jobId },
      include: {
        organization: true,
      },
    });

    if (!job) {
      throw new Error('Job posting not found');
    }

    // Check eligibility
    const eligibility = await this.checkEligibility(profile, job);

    // Check if already applied
    const application = await prisma.application.findFirst({
      where: {
        student_id: profile.id,
        job_posting_id: jobId,
        status: {
          not: 'WITHDRAWN',
        },
      },
    });

    return {
      ...job,
      eligibility,
      hasApplied: !!application,
      application: application || null,
    };
  }

  /**
   * Check eligibility for a job posting
   */
  private async checkEligibility(profile: any, jobPosting: any) {
    const reasons: string[] = [];

    // Check CGPA
    if (profile.cgpi && jobPosting.cgpa_min) {
      if (Number(profile.cgpi) < jobPosting.cgpa_min) {
        reasons.push(`CGPA ${profile.cgpi} is below minimum ${jobPosting.cgpa_min}`);
      }
    }

    // Check backlogs
    if (jobPosting.max_backlogs !== null && jobPosting.max_backlogs !== undefined) {
      const activeBacklogs = profile.active_backlogs || 0;
      if (activeBacklogs > jobPosting.max_backlogs) {
        reasons.push(`Active backlogs (${activeBacklogs}) exceed maximum allowed (${jobPosting.max_backlogs})`);
      }
    }

    // Check department
    if (jobPosting.allowed_branches && jobPosting.allowed_branches.length > 0) {
      if (!jobPosting.allowed_branches.includes(profile.department)) {
        reasons.push(`Department ${profile.department} not in allowed branches`);
      }
    }

    // Check graduation year
    if (jobPosting.graduation_years && jobPosting.graduation_years.length > 0) {
      if (!jobPosting.graduation_years.includes(profile.expected_graduation_year)) {
        reasons.push(`Graduation year ${profile.expected_graduation_year} not eligible`);
      }
    }

    // Check if profile is verified
    if (!profile.tpo_dept_verified) {
      reasons.push('Profile not verified by TPO Department');
    }

    return {
      eligible: reasons.length === 0,
      reasons,
    };
  }
}

export const jobService = new JobService();
