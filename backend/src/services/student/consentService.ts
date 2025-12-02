import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateConsentInput {
  student_id: string;
  job_posting_id?: string;
  recruiter_id?: string;
  consent_type: 'APPLICATION' | 'RESUME_BOOK' | 'PROFILE_SHARING';
  consent_text: string;
  data_shared: string[];
  ip_address?: string;
  user_agent?: string;
}

export class ConsentService {
  /**
   * Create a new consent
   */
  async createConsent(data: CreateConsentInput) {
    const profile = await prisma.studentProfile.findUnique({
      where: { user_id: data.student_id }
    });

    if (!profile) {
      throw new Error('Student profile not found');
    }

    // Check if consent already exists for this job posting
    if (data.job_posting_id) {
      const existing = await prisma.consent.findFirst({
        where: {
          student_id: profile.id,
          job_posting_id: data.job_posting_id,
          consent_given: true,
          revoked: false
        }
      });

      if (existing) {
        throw new Error('Consent already exists for this job posting');
      }
    }

    // Calculate access expiry (1 year from now or after placement)
    const accessExpiry = new Date();
    accessExpiry.setFullYear(accessExpiry.getFullYear() + 1);

    const consent = await prisma.consent.create({
      data: {
        student_id: profile.id,
        job_posting_id: data.job_posting_id,
        recruiter_id: data.recruiter_id,
        consent_type: data.consent_type,
        consent_given: true,
        consent_text: data.consent_text,
        data_shared: data.data_shared,
        access_expiry: accessExpiry,
        ip_address: data.ip_address,
        user_agent: data.user_agent,
        revoked: false
      }
    });

    // TODO: Send notification to TPO_Dept about new consent

    return consent;
  }

  /**
   * Get all consents for a student
   */
  async getConsents(userId: string) {
    const profile = await prisma.studentProfile.findUnique({
      where: { user_id: userId }
    });

    if (!profile) {
      throw new Error('Student profile not found');
    }

    const consents = await prisma.consent.findMany({
      where: {
        student_id: profile.id
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    return consents;
  }

  /**
   * Get active consents only
   */
  async getActiveConsents(userId: string) {
    const profile = await prisma.studentProfile.findUnique({
      where: { user_id: userId }
    });

    if (!profile) {
      throw new Error('Student profile not found');
    }

    const consents = await prisma.consent.findMany({
      where: {
        student_id: profile.id,
        consent_given: true,
        revoked: false,
        access_expiry: {
          gte: new Date()
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    return consents;
  }

  /**
   * Revoke a consent
   */
  async revokeConsent(userId: string, consentId: string, reason?: string) {
    const profile = await prisma.studentProfile.findUnique({
      where: { user_id: userId }
    });

    if (!profile) {
      throw new Error('Student profile not found');
    }

    // Verify consent belongs to student
    const consent = await prisma.consent.findFirst({
      where: {
        id: consentId,
        student_id: profile.id
      }
    });

    if (!consent) {
      throw new Error('Consent not found');
    }

    if (consent.revoked) {
      throw new Error('Consent already revoked');
    }

    // Revoke consent
    const updated = await prisma.consent.update({
      where: { id: consentId },
      data: {
        revoked: true,
        revoked_at: new Date(),
        revocation_reason: reason,
        access_expiry: new Date() // Expire access immediately
      }
    });

    // TODO: Send notification to recruiter and TPO_Dept about revocation

    return updated;
  }

  /**
   * Check if student has given consent for a specific job posting
   */
  async hasConsentForJob(userId: string, jobPostingId: string): Promise<boolean> {
    const profile = await prisma.studentProfile.findUnique({
      where: { user_id: userId }
    });

    if (!profile) {
      return false;
    }

    const consent = await prisma.consent.findFirst({
      where: {
        student_id: profile.id,
        job_posting_id: jobPostingId,
        consent_given: true,
        revoked: false,
        access_expiry: {
          gte: new Date()
        }
      }
    });

    return !!consent;
  }

  /**
   * Get consent statistics for a student
   */
  async getConsentStats(userId: string) {
    const profile = await prisma.studentProfile.findUnique({
      where: { user_id: userId }
    });

    if (!profile) {
      throw new Error('Student profile not found');
    }

    const [total, active, revoked, expired] = await Promise.all([
      prisma.consent.count({
        where: { student_id: profile.id }
      }),
      prisma.consent.count({
        where: {
          student_id: profile.id,
          consent_given: true,
          revoked: false,
          access_expiry: { gte: new Date() }
        }
      }),
      prisma.consent.count({
        where: {
          student_id: profile.id,
          revoked: true
        }
      }),
      prisma.consent.count({
        where: {
          student_id: profile.id,
          revoked: false,
          access_expiry: { lt: new Date() }
        }
      })
    ]);

    return {
      total,
      active,
      revoked,
      expired
    };
  }
}

export const consentService = new ConsentService();
