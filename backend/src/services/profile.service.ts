import { prisma } from '../server'

/**
 * Profile Service
 * Handles student profile creation, updates, and completion tracking
 */

export class ProfileService {
  /**
   * Calculate profile completion percentage
   */
  static calculateCompletion(profile: any): number {
    let completion = 0

    // Personal Information (15%)
    if (profile.first_name && profile.last_name && profile.date_of_birth && 
        profile.gender && profile.mobile_number && profile.address_permanent) {
      completion += 15
    }

    // Academic Information (20%)
    if (profile.enrollment_number && profile.department && profile.degree && 
        profile.year_of_admission && profile.current_semester && 
        profile.expected_graduation_year) {
      completion += 20
    }

    // Contact Information (10%)
    if (profile.personal_email && profile.mobile_number) {
      completion += 10
    }

    // Category & Additional Info (5%)
    if (profile.category) {
      completion += 5
    }

    // Resume (20%) - checked separately
    // Documents (25%) - checked separately
    // Skills & Career (20%) - checked separately

    return completion
  }

  /**
   * Create student profile
   */
  static async createProfile(userId: string, data: any) {
    // Check if profile already exists
    const existing = await prisma.studentProfile.findUnique({
      where: { user_id: userId },
    })

    if (existing) {
      throw new Error('Profile already exists')
    }

    // Calculate initial completion
    const completion = this.calculateCompletion(data)

    // Create profile
    const profile = await prisma.studentProfile.create({
      data: {
        user_id: userId,
        first_name: data.firstName,
        middle_name: data.middleName,
        last_name: data.lastName,
        mother_name: data.motherName,
        date_of_birth: new Date(data.dateOfBirth),
        gender: data.gender,
        mobile_number: data.mobileNumber,
        personal_email: data.personalEmail,
        address_permanent: data.permanentAddress,
        address_current: data.currentAddress || data.permanentAddress,
        category: data.category,
        enrollment_number: data.enrollmentNumber,
        department: data.department,
        degree: data.degree,
        year_of_admission: data.yearOfAdmission,
        current_semester: data.currentSemester,
        expected_graduation_year: data.expectedGraduationYear,
        profile_complete_percent: completion,
        profile_status: 'DRAFT',
        tpo_dept_verified: false,
        tpo_admin_verified: false,
      },
    })

    return profile
  }

  /**
   * Update profile completion percentage
   */
  static async updateCompletion(profileId: string) {
    const profile = await prisma.studentProfile.findUnique({
      where: { id: profileId },
      include: {
        resumes: { where: { is_active: true } },
        semesterMarks: true,
      },
    })

    if (!profile) {
      throw new Error('Profile not found')
    }

    let completion = this.calculateCompletion(profile)

    // Add resume completion (20%)
    if (profile.resumes && profile.resumes.length > 0) {
      completion += 20
    }

    // Add documents completion (25%)
    // TODO: Check if documents are uploaded
    // For now, assume 0%

    // Add skills & career completion (20%)
    // TODO: Check if skills, projects, etc. are added
    // For now, assume 0%

    // Update profile
    await prisma.studentProfile.update({
      where: { id: profileId },
      data: { profile_complete_percent: completion },
    })

    return completion
  }

  /**
   * Request profile verification
   */
  static async requestVerification(profileId: string) {
    const profile = await prisma.studentProfile.findUnique({
      where: { id: profileId },
    })

    if (!profile) {
      throw new Error('Profile not found')
    }

    // Check if profile is at least 80% complete
    if ((profile.profile_complete_percent || 0) < 80) {
      throw new Error('Profile must be at least 80% complete to request verification')
    }

    // Update profile status
    await prisma.studentProfile.update({
      where: { id: profileId },
      data: {
        profile_status: 'PENDING_VERIFICATION',
        verification_requested_at: new Date(),
      },
    })

    // TODO: Notify TPO_Dept

    return true
  }

  /**
   * Verify profile (TPO_Dept)
   */
  static async verifyProfile(profileId: string, verifierId: string, notes?: string) {
    const profile = await prisma.studentProfile.update({
      where: { id: profileId },
      data: {
        tpo_dept_verified: true,
        profile_status: 'VERIFIED',
        verified_at: new Date(),
        verified_by: verifierId,
        dept_review_notes: notes,
      },
    })

    // TODO: Notify student

    return profile
  }

  /**
   * Hold profile for corrections (TPO_Dept)
   */
  static async holdProfile(profileId: string, verifierId: string, notes: string) {
    const profile = await prisma.studentProfile.update({
      where: { id: profileId },
      data: {
        profile_status: 'ON_HOLD',
        dept_review_notes: notes,
        verified_by: verifierId,
      },
    })

    // TODO: Notify student with specific issues

    return profile
  }

  /**
   * Reject profile (TPO_Dept)
   */
  static async rejectProfile(profileId: string, verifierId: string, reason: string) {
    const profile = await prisma.studentProfile.update({
      where: { id: profileId },
      data: {
        profile_status: 'REJECTED',
        dept_review_notes: reason,
        verified_by: verifierId,
      },
    })

    // TODO: Escalate to TPO_Admin
    // TODO: Notify student with appeal process

    return profile
  }
}
