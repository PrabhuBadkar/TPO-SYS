import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface SubmitApplicationInput {
  job_posting_id: string;
  resume_id?: string;
  cover_letter?: string;
  consent_given: boolean;
}

export class ApplicationService {
  /**
   * Submit application to a job posting
   */
  async submitApplication(studentId: string, data: SubmitApplicationInput) {
    if (!data.consent_given) {
      throw new Error('Consent is required to submit application');
    }

    const profile = await prisma.studentProfile.findUnique({
      where: { user_id: studentId },
    });

    if (!profile) {
      throw new Error('Student profile not found');
    }

    if (!profile.tpo_dept_verified) {
      throw new Error('Profile must be verified by TPO Department before applying');
    }

    const jobPosting = await prisma.jobPosting.findUnique({
      where: { id: data.job_posting_id },
    });

    if (!jobPosting) {
      throw new Error('Job posting not found');
    }

    if (jobPosting.status !== 'ACTIVE') {
      throw new Error('This job posting is not accepting applications');
    }

    const existingApplication = await prisma.application.findFirst({
      where: {
        student_id: profile.id,
        job_posting_id: data.job_posting_id,
        status: { not: 'WITHDRAWN' },
      },
    });

    if (existingApplication) {
      throw new Error('You have already applied to this job posting');
    }

    let resumeId = data.resume_id;
    if (!resumeId) {
      const primaryResume = await prisma.resume.findFirst({
        where: {
          student_id: profile.id,
          is_primary: true,
          is_active: true,
        },
      });

      if (!primaryResume) {
        throw new Error('No resume found. Please upload a resume first.');
      }

      resumeId = primaryResume.id;
    }

    const application = await prisma.application.create({
      data: {
        student_id: profile.id,
        job_posting_id: data.job_posting_id,
        resume_id: resumeId!,
        cover_letter: data.cover_letter,
        status: 'SUBMITTED',
        submitted_at: new Date(),
      },
    });

    return application;
  }

  /**
   * Get student's applications
   */
  async getMyApplications(studentId: string, filters?: any) {
    const profile = await prisma.studentProfile.findUnique({
      where: { user_id: studentId },
    });

    if (!profile) {
      throw new Error('Student profile not found');
    }

    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { student_id: profile.id };

    if (filters?.status) {
      where.status = filters.status;
    }

    const [applications, total] = await Promise.all([
      prisma.application.findMany({
        where,
        include: {
          jobPosting: {
            include: {
              organization: {
                select: {
                  organization_name: true,
                  industry: true,
                },
              },
            },
          },
        },
        orderBy: { submitted_at: 'desc' },
        skip,
        take: limit,
      }),
      prisma.application.count({ where }),
    ]);

    return {
      applications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Withdraw application
   */
  async withdrawApplication(applicationId: string, studentId: string, reason?: string) {
    const profile = await prisma.studentProfile.findUnique({
      where: { user_id: studentId },
    });

    if (!profile) {
      throw new Error('Student profile not found');
    }

    const application = await prisma.application.findFirst({
      where: {
        id: applicationId,
        student_id: profile.id,
      },
    });

    if (!application) {
      throw new Error('Application not found');
    }

    const cannotWithdrawStatuses = ['SHORTLISTED', 'SELECTED', 'OFFER_EXTENDED'];

    if (cannotWithdrawStatuses.includes(application.status)) {
      throw new Error('Cannot withdraw application after shortlisting');
    }

    const updated = await prisma.application.update({
      where: { id: applicationId },
      data: {
        status: 'WITHDRAWN',
        withdrawn_at: new Date(),
        withdrawal_reason: reason,
      },
    });

    return updated;
  }
}

export const applicationService = new ApplicationService();
