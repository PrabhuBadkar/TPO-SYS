import { prisma } from '../server'

/**
 * Consent Service
 * Handles student consent for data sharing with recruiters
 * 
 * Business Rules:
 * - PRIVACY-1: Explicit consent required for data sharing
 * - PRIVACY-2: Consent revocable anytime
 * - BR-S14: Consent revocation triggers access expiry
 */

export class ConsentService {
  /**
   * Create consent record
   * Called when student applies to a job
   */
  static async createConsent(
    studentId: string,
    jobPostingId: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    // Check if consent already exists
    const existing = await prisma.consent.findFirst({
      where: {
        student_id: studentId,
        job_posting_id: jobPostingId,
        is_active: true,
      },
    })

    if (existing) {
      return existing
    }

    // Create new consent
    const consent = await prisma.consent.create({
      data: {
        student_id: studentId,
        job_posting_id: jobPostingId,
        consent_given_at: new Date(),
        ip_address: ipAddress,
        user_agent: userAgent,
        is_active: true,
      },
    })

    // Log consent creation
    await this.logConsentEvent(studentId, jobPostingId, 'CONSENT_GIVEN', ipAddress)

    return consent
  }

  /**
   * Revoke consent
   * Student can revoke consent anytime
   */
  static async revokeConsent(
    studentId: string,
    jobPostingId: string,
    reason?: string,
    ipAddress?: string
  ) {
    // Find active consent
    const consent = await prisma.consent.findFirst({
      where: {
        student_id: studentId,
        job_posting_id: jobPostingId,
        is_active: true,
      },
    })

    if (!consent) {
      throw new Error('No active consent found')
    }

    // Revoke consent
    const updated = await prisma.consent.update({
      where: { id: consent.id },
      data: {
        is_active: false,
        revoked_at: new Date(),
        revocation_reason: reason,
      },
    })

    // Expire recruiter access immediately
    await this.expireRecruiterAccess(studentId, jobPostingId)

    // Log consent revocation
    await this.logConsentEvent(studentId, jobPostingId, 'CONSENT_REVOKED', ipAddress)

    // TODO: Notify recruiter about consent revocation

    return updated
  }

  /**
   * Check if student has given consent for a job posting
   */
  static async hasConsent(studentId: string, jobPostingId: string): Promise<boolean> {
    const consent = await prisma.consent.findFirst({
      where: {
        student_id: studentId,
        job_posting_id: jobPostingId,
        is_active: true,
      },
    })

    return !!consent
  }

  /**
   * Get all consents for a student
   */
  static async getStudentConsents(studentId: string) {
    const consents = await prisma.consent.findMany({
      where: { student_id: studentId },
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
      orderBy: { consent_given_at: 'desc' },
    })

    return consents
  }

  /**
   * Expire recruiter access when consent is revoked
   * BR-S14: Consent revocation triggers access expiry
   */
  private static async expireRecruiterAccess(studentId: string, jobPostingId: string) {
    // Update all applications for this job posting
    await prisma.jobApplication.updateMany({
      where: {
        student_id: studentId,
        job_posting_id: jobPostingId,
      },
      data: {
        recruiter_access_expired: true,
        recruiter_access_expired_at: new Date(),
      },
    })
  }

  /**
   * Log consent event for audit trail
   */
  private static async logConsentEvent(
    studentId: string,
    jobPostingId: string,
    action: string,
    ipAddress?: string
  ) {
    await prisma.auditEvent.create({
      data: {
        actor_id: studentId,
        action: action,
        resource_type: 'CONSENT',
        resource_id: jobPostingId,
        ip_address: ipAddress,
        timestamp: new Date(),
      },
    })
  }

  /**
   * Validate consent before allowing recruiter access
   * Used as middleware check
   */
  static async validateConsent(studentId: string, jobPostingId: string) {
    const hasConsent = await this.hasConsent(studentId, jobPostingId)

    if (!hasConsent) {
      throw new Error('Student has not given consent or has revoked consent')
    }

    return true
  }

  /**
   * Get consent statistics for a student
   */
  static async getConsentStats(studentId: string) {
    const [total, active, revoked] = await Promise.all([
      prisma.consent.count({
        where: { student_id: studentId },
      }),
      prisma.consent.count({
        where: {
          student_id: studentId,
          is_active: true,
        },
      }),
      prisma.consent.count({
        where: {
          student_id: studentId,
          is_active: false,
        },
      }),
    ])

    return {
      total,
      active,
      revoked,
    }
  }
}
