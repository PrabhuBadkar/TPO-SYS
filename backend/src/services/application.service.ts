import { prisma } from '../server'
import { ConsentService } from './consent.service'

/**
 * Application Service
 * Handles job applications with two-tier approval workflow
 * 
 * Business Rules:
 * - BR-S3: Verified profile required for applications
 * - BR-S5: Resume required for application
 * - BR-S11: Two-tier approval (TPO_Dept → TPO_Admin → Recruiter)
 * - BR-S12: Max applications per semester
 * - BR-S13: No edits after submission
 * - PRIVACY-1: Explicit consent required
 */

export class ApplicationService {
  private static MAX_APPLICATIONS_PER_SEMESTER = 10

  /**
   * Create job application
   * Student applies to a job posting
   */
  static async createApplication(
    studentId: string,
    jobPostingId: string,
    resumeId: string,
    coverLetter?: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    // 1. Validate student profile
    const student = await prisma.studentProfile.findUnique({
      where: { id: studentId },
      include: {
        resumes: { where: { is_active: true } },
      },
    })

    if (!student) {
      throw new Error('Student profile not found')
    }

    // BR-S3: Verified profile required
    if (!student.tpo_dept_verified) {
      throw new Error('Profile not verified. Contact your department coordinator.')
    }

    // BR-S5: Resume required
    if (!student.resumes || student.resumes.length === 0) {
      throw new Error('Upload a resume before applying')
    }

    // Validate resume belongs to student
    const resume = student.resumes.find((r) => r.id === resumeId)
    if (!resume) {
      throw new Error('Resume not found')
    }

    // 2. Validate job posting
    const jobPosting = await prisma.jobPosting.findUnique({
      where: { id: jobPostingId },
    })

    if (!jobPosting) {
      throw new Error('Job posting not found')
    }

    if (jobPosting.status !== 'ACTIVE') {
      throw new Error('Job posting is not active')
    }

    if (jobPosting.application_deadline < new Date()) {
      throw new Error('Application deadline has passed')
    }

    // 3. Check application limit (BR-S12)
    const currentSemester = this.getCurrentSemester()
    const applicationCount = await prisma.jobApplication.count({
      where: {
        student_id: studentId,
        created_at: {
          gte: currentSemester.startDate,
          lte: currentSemester.endDate,
        },
      },
    })

    if (applicationCount >= this.MAX_APPLICATIONS_PER_SEMESTER) {
      throw new Error(
        `You have reached the maximum application limit (${this.MAX_APPLICATIONS_PER_SEMESTER}) for this semester`
      )
    }

    // 4. Check if already applied
    const existingApplication = await prisma.jobApplication.findFirst({
      where: {
        student_id: studentId,
        job_posting_id: jobPostingId,
      },
    })

    if (existingApplication) {
      throw new Error('You have already applied to this job')
    }

    // 5. Check eligibility
    const eligibility = await this.checkEligibility(studentId, jobPostingId)
    if (!eligibility.isEligible) {
      throw new Error(`Not eligible: ${eligibility.reasons.join(', ')}`)
    }

    // 6. Create consent record (PRIVACY-1)
    await ConsentService.createConsent(studentId, jobPostingId, ipAddress, userAgent)

    // 7. Create application
    const application = await prisma.jobApplication.create({
      data: {
        student_id: studentId,
        job_posting_id: jobPostingId,
        resume_id: resumeId,
        cover_letter: coverLetter,
        status: 'PENDING_TPO_DEPT', // First gate
        submitted_at: new Date(),
        application_source: 'STUDENT_PORTAL',
      },
    })

    // 8. Log application creation
    await this.logApplicationEvent(studentId, application.id, 'APPLICATION_SUBMITTED', ipAddress)

    // TODO: Notify TPO_Dept about new application

    return application
  }

  /**
   * Withdraw application
   * Student can withdraw before shortlisting (BR-S13)
   */
  static async withdrawApplication(studentId: string, applicationId: string) {
    const application = await prisma.jobApplication.findFirst({
      where: {
        id: applicationId,
        student_id: studentId,
      },
    })

    if (!application) {
      throw new Error('Application not found')
    }

    // Cannot withdraw after shortlisting
    if (application.status === 'SHORTLISTED' || application.status.includes('SELECTED')) {
      throw new Error('Cannot withdraw after shortlisting')
    }

    // Update application status
    const updated = await prisma.jobApplication.update({
      where: { id: applicationId },
      data: {
        status: 'WITHDRAWN',
        withdrawn_at: new Date(),
      },
    })

    // Log withdrawal
    await this.logApplicationEvent(studentId, applicationId, 'APPLICATION_WITHDRAWN')

    return updated
  }

  /**
   * TPO_Dept review (First gate)
   * BR-S11: Two-tier approval
   */
  static async reviewByDept(
    applicationId: string,
    reviewerId: string,
    action: 'APPROVE' | 'REJECT' | 'HOLD',
    notes?: string
  ) {
    const application = await prisma.jobApplication.findUnique({
      where: { id: applicationId },
      include: {
        student: {
          select: {
            department: true,
            tpo_dept_verified: true,
          },
        },
      },
    })

    if (!application) {
      throw new Error('Application not found')
    }

    // Verify student profile is verified
    if (!application.student.tpo_dept_verified) {
      throw new Error('Student profile not verified')
    }

    // Update application status
    let newStatus = 'PENDING_TPO_DEPT'
    if (action === 'APPROVE') {
      newStatus = 'APPROVED_BY_DEPT' // Move to second gate
    } else if (action === 'REJECT') {
      newStatus = 'REJECTED_BY_DEPT'
    } else if (action === 'HOLD') {
      newStatus = 'ON_HOLD_DEPT'
    }

    const updated = await prisma.jobApplication.update({
      where: { id: applicationId },
      data: {
        status: newStatus,
        reviewed_by_dept: reviewerId,
        reviewed_at_dept: new Date(),
        dept_review_notes: notes,
      },
    })

    // Log review
    await this.logApplicationEvent(
      application.student_id,
      applicationId,
      `APPLICATION_${action}_BY_DEPT`
    )

    // TODO: Notify student about review decision
    // TODO: If approved, notify TPO_Admin

    return updated
  }

  /**
   * TPO_Admin review (Second gate)
   * BR-S11: Two-tier approval
   */
  static async reviewByAdmin(
    applicationId: string,
    reviewerId: string,
    action: 'APPROVE' | 'REJECT' | 'HOLD',
    notes?: string
  ) {
    const application = await prisma.jobApplication.findUnique({
      where: { id: applicationId },
    })

    if (!application) {
      throw new Error('Application not found')
    }

    // Must be approved by dept first
    if (application.status !== 'APPROVED_BY_DEPT') {
      throw new Error('Application must be approved by department first')
    }

    // Update application status
    let newStatus = 'APPROVED_BY_DEPT'
    if (action === 'APPROVE') {
      newStatus = 'FORWARDED_TO_RECRUITER' // Final approval
    } else if (action === 'REJECT') {
      newStatus = 'REJECTED_BY_ADMIN'
    } else if (action === 'HOLD') {
      newStatus = 'ON_HOLD_ADMIN'
    }

    const updated = await prisma.jobApplication.update({
      where: { id: applicationId },
      data: {
        status: newStatus,
        reviewed_by_admin: reviewerId,
        reviewed_at_admin: new Date(),
        admin_review_notes: notes,
      },
    })

    // Log review
    await this.logApplicationEvent(
      application.student_id,
      applicationId,
      `APPLICATION_${action}_BY_ADMIN`
    )

    // TODO: Notify student about final decision
    // TODO: If approved, notify recruiter

    return updated
  }

  /**
   * Check eligibility for job posting
   * TODO: Integrate with eligibility engine
   */
  private static async checkEligibility(studentId: string, jobPostingId: string) {
    // For now, return eligible
    // In production, this would check eligibility_results table
    return {
      isEligible: true,
      reasons: [],
    }
  }

  /**
   * Get current semester dates
   */
  private static getCurrentSemester() {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth()

    // Assume semesters: Jan-Jun (Spring), Jul-Dec (Fall)
    if (month < 6) {
      return {
        startDate: new Date(year, 0, 1),
        endDate: new Date(year, 5, 30),
      }
    } else {
      return {
        startDate: new Date(year, 6, 1),
        endDate: new Date(year, 11, 31),
      }
    }
  }

  /**
   * Log application event for audit trail
   */
  private static async logApplicationEvent(
    studentId: string,
    applicationId: string,
    action: string,
    ipAddress?: string
  ) {
    await prisma.auditEvent.create({
      data: {
        actor_id: studentId,
        action: action,
        resource_type: 'APPLICATION',
        resource_id: applicationId,
        ip_address: ipAddress,
        timestamp: new Date(),
      },
    })
  }

  /**
   * Get application statistics for student
   */
  static async getStudentStats(studentId: string) {
    const [total, pending, approved, rejected, shortlisted] = await Promise.all([
      prisma.jobApplication.count({
        where: { student_id: studentId },
      }),
      prisma.jobApplication.count({
        where: {
          student_id: studentId,
          status: {
            in: ['PENDING_TPO_DEPT', 'APPROVED_BY_DEPT', 'ON_HOLD_DEPT', 'ON_HOLD_ADMIN'],
          },
        },
      }),
      prisma.jobApplication.count({
        where: {
          student_id: studentId,
          status: 'FORWARDED_TO_RECRUITER',
        },
      }),
      prisma.jobApplication.count({
        where: {
          student_id: studentId,
          status: {
            in: ['REJECTED_BY_DEPT', 'REJECTED_BY_ADMIN', 'REJECTED_BY_RECRUITER'],
          },
        },
      }),
      prisma.jobApplication.count({
        where: {
          student_id: studentId,
          status: 'SHORTLISTED',
        },
      }),
    ])

    return {
      total,
      pending,
      approved,
      rejected,
      shortlisted,
    }
  }
}
