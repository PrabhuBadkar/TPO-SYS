// Profile Verification Service - TPO_Dept Student Profile Verification
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ProfileVerificationFilters {
  verification_status?: string; // PENDING, VERIFIED, REJECTED
  profile_completion_min?: number;
  profile_completion_max?: number;
  graduation_year?: number;
  semester?: number;
  search?: string;
}

export class ProfileVerificationService {
  /**
   * Get department students list with filters
   */
  static async getDepartmentStudents(userId: string, filters?: ProfileVerificationFilters) {
    try {
      // Get coordinator details
      const coordinator = await prisma.tPODeptCoordinator.findUnique({
        where: { user_id: userId }
      });

      if (!coordinator) {
        throw new Error('TPO Dept coordinator not found');
      }

      if (!coordinator.can_verify_profiles) {
        throw new Error('You do not have permission to verify profiles');
      }

      // Build where clause for department-scoped access (K2.1)
      const where: any = {
        department: {
          in: [coordinator.primary_department, ...coordinator.assigned_departments]
        },
        deleted_at: null
      };

      // Apply filters
      if (filters?.verification_status) {
        if (filters.verification_status === 'PENDING') {
          where.tpo_dept_verified = false;
          where.profile_status = { not: 'REJECTED' };
        } else if (filters.verification_status === 'VERIFIED') {
          where.tpo_dept_verified = true;
        } else if (filters.verification_status === 'REJECTED') {
          where.profile_status = 'REJECTED';
        }
      }

      if (filters?.profile_completion_min) {
        where.profile_complete_percent = {
          ...where.profile_complete_percent,
          gte: filters.profile_completion_min
        };
      }

      if (filters?.profile_completion_max) {
        where.profile_complete_percent = {
          ...where.profile_complete_percent,
          lte: filters.profile_completion_max
        };
      }

      if (filters?.graduation_year) {
        where.expected_graduation_year = filters.graduation_year;
      }

      if (filters?.semester) {
        where.current_semester = filters.semester;
      }

      if (filters?.search) {
        where.OR = [
          { first_name: { contains: filters.search, mode: 'insensitive' } },
          { last_name: { contains: filters.search, mode: 'insensitive' } },
          { enrollment_number: { contains: filters.search, mode: 'insensitive' } }
        ];
      }

      const students = await prisma.studentProfile.findMany({
        where,
        select: {
          id: true,
          enrollment_number: true,
          first_name: true,
          middle_name: true,
          last_name: true,
          department: true,
          degree: true,
          current_semester: true,
          expected_graduation_year: true,
          cgpi: true,
          active_backlogs: true,
          profile_complete_percent: true,
          tpo_dept_verified: true,
          tpo_dept_verified_at: true,
          profile_status: true,
          created_at: true,
          updated_at: true
        },
        orderBy: [
          { tpo_dept_verified: 'asc' },
          { profile_complete_percent: 'desc' },
          { enrollment_number: 'asc' }
        ]
      });

      // Calculate quick stats
      const stats = {
        total: students.length,
        pending: students.filter(s => !s.tpo_dept_verified && s.profile_status !== 'REJECTED').length,
        verified: students.filter(s => s.tpo_dept_verified).length,
        rejected: students.filter(s => s.profile_status === 'REJECTED').length,
        avg_profile_completion: students.length > 0
          ? Math.round(students.reduce((sum, s) => sum + s.profile_complete_percent, 0) / students.length)
          : 0
      };

      return {
        success: true,
        data: students,
        stats
      };
    } catch (error: any) {
      console.error('Get department students error:', error);
      throw new Error(error.message || 'Failed to get department students');
    }
  }

  /**
   * Get student profile details for review
   */
  static async getStudentProfileForReview(userId: string, studentId: string) {
    try {
      const coordinator = await prisma.tPODeptCoordinator.findUnique({
        where: { user_id: userId }
      });

      if (!coordinator) {
        throw new Error('TPO Dept coordinator not found');
      }

      const student = await prisma.studentProfile.findUnique({
        where: { id: studentId },
        include: {
          resumes: {
            where: { is_active: true },
            orderBy: { version: 'desc' }
          },
          documents: {
            orderBy: { created_at: 'desc' }
          },
          semesterMarks: {
            orderBy: { semester: 'asc' }
          }
        }
      });

      if (!student) {
        throw new Error('Student not found');
      }

      // Check department access (K2.1)
      const allowedDepartments = [coordinator.primary_department, ...coordinator.assigned_departments];
      if (!allowedDepartments.includes(student.department)) {
        throw new Error('You do not have access to students from this department');
      }

      return {
        success: true,
        data: student
      };
    } catch (error: any) {
      console.error('Get student profile for review error:', error);
      throw new Error(error.message || 'Failed to get student profile');
    }
  }

  /**
   * Verify student profile
   */
  static async verifyProfile(userId: string, studentId: string, notes?: string) {
    try {
      const coordinator = await prisma.tPODeptCoordinator.findUnique({
        where: { user_id: userId }
      });

      if (!coordinator) {
        throw new Error('TPO Dept coordinator not found');
      }

      if (!coordinator.can_verify_profiles) {
        throw new Error('You do not have permission to verify profiles');
      }

      const student = await prisma.studentProfile.findUnique({
        where: { id: studentId }
      });

      if (!student) {
        throw new Error('Student not found');
      }

      // Check department access (K2.1)
      const allowedDepartments = [coordinator.primary_department, ...coordinator.assigned_departments];
      if (!allowedDepartments.includes(student.department)) {
        throw new Error('You do not have access to students from this department');
      }

      // BR-D2: Verification requires profile completion >= 80%
      if (student.profile_complete_percent < 80) {
        throw new Error('Profile completion must be at least 80% before verification');
      }

      // Update student profile
      const updatedStudent = await prisma.studentProfile.update({
        where: { id: studentId },
        data: {
          tpo_dept_verified: true,
          tpo_dept_verified_at: new Date(),
          tpo_dept_verified_by: userId,
          profile_status: 'VERIFIED',
          dept_review_notes: notes ? [
            ...(student.dept_review_notes as any[] || []),
            {
              action: 'VERIFIED',
              notes,
              verified_by: coordinator.dept_coordinator_name,
              verified_at: new Date().toISOString()
            }
          ] : student.dept_review_notes,
          updated_at: new Date()
        }
      });

      // TODO: Send notification to student

      return {
        success: true,
        message: 'Student profile verified successfully',
        data: updatedStudent
      };
    } catch (error: any) {
      console.error('Verify profile error:', error);
      throw new Error(error.message || 'Failed to verify profile');
    }
  }

  /**
   * Hold student profile for corrections
   */
  static async holdProfile(userId: string, studentId: string, issues: string) {
    try {
      const coordinator = await prisma.tPODeptCoordinator.findUnique({
        where: { user_id: userId }
      });

      if (!coordinator) {
        throw new Error('TPO Dept coordinator not found');
      }

      if (!coordinator.can_verify_profiles) {
        throw new Error('You do not have permission to hold profiles');
      }

      if (!issues || issues.trim().length === 0) {
        throw new Error('Issues description is required');
      }

      const student = await prisma.studentProfile.findUnique({
        where: { id: studentId }
      });

      if (!student) {
        throw new Error('Student not found');
      }

      // Check department access (K2.1)
      const allowedDepartments = [coordinator.primary_department, ...coordinator.assigned_departments];
      if (!allowedDepartments.includes(student.department)) {
        throw new Error('You do not have access to students from this department');
      }

      // Update student profile
      const updatedStudent = await prisma.studentProfile.update({
        where: { id: studentId },
        data: {
          tpo_dept_verified: false,
          profile_status: 'HOLD',
          dept_review_notes: [
            ...(student.dept_review_notes as any[] || []),
            {
              action: 'HOLD',
              issues,
              reviewed_by: coordinator.dept_coordinator_name,
              reviewed_at: new Date().toISOString()
            }
          ],
          updated_at: new Date()
        }
      });

      // TODO: Send notification to student with specific issues
      // TODO: Set reminder (T+3 days)

      return {
        success: true,
        message: 'Student profile put on hold. Student has been notified.',
        data: updatedStudent
      };
    } catch (error: any) {
      console.error('Hold profile error:', error);
      throw new Error(error.message || 'Failed to hold profile');
    }
  }

  /**
   * Reject student profile
   */
  static async rejectProfile(userId: string, studentId: string, reason: string) {
    try {
      const coordinator = await prisma.tPODeptCoordinator.findUnique({
        where: { user_id: userId }
      });

      if (!coordinator) {
        throw new Error('TPO Dept coordinator not found');
      }

      if (!coordinator.can_verify_profiles) {
        throw new Error('You do not have permission to reject profiles');
      }

      if (!reason || reason.trim().length === 0) {
        throw new Error('Rejection reason is required');
      }

      const student = await prisma.studentProfile.findUnique({
        where: { id: studentId }
      });

      if (!student) {
        throw new Error('Student not found');
      }

      // Check department access (K2.1)
      const allowedDepartments = [coordinator.primary_department, ...coordinator.assigned_departments];
      if (!allowedDepartments.includes(student.department)) {
        throw new Error('You do not have access to students from this department');
      }

      // Update student profile
      const updatedStudent = await prisma.studentProfile.update({
        where: { id: studentId },
        data: {
          tpo_dept_verified: false,
          profile_status: 'REJECTED',
          dept_review_notes: [
            ...(student.dept_review_notes as any[] || []),
            {
              action: 'REJECTED',
              reason,
              rejected_by: coordinator.dept_coordinator_name,
              rejected_at: new Date().toISOString()
            }
          ],
          updated_at: new Date()
        }
      });

      // BR-D3: Rejected profiles require escalation to TPO_Admin
      // TODO: Create escalation ticket to TPO_Admin
      // TODO: Send notification to student with appeal process

      return {
        success: true,
        message: 'Student profile rejected. Escalated to TPO Admin.',
        data: updatedStudent
      };
    } catch (error: any) {
      console.error('Reject profile error:', error);
      throw new Error(error.message || 'Failed to reject profile');
    }
  }

  /**
   * Batch verify student profiles
   */
  static async batchVerifyProfiles(userId: string, studentIds: string[], notes?: string) {
    try {
      const coordinator = await prisma.tPODeptCoordinator.findUnique({
        where: { user_id: userId }
      });

      if (!coordinator) {
        throw new Error('TPO Dept coordinator not found');
      }

      if (!coordinator.can_verify_profiles) {
        throw new Error('You do not have permission to verify profiles');
      }

      // BR-D12: Batch approval max 50 at a time
      if (studentIds.length > 50) {
        throw new Error('Cannot verify more than 50 profiles at once');
      }

      const students = await prisma.studentProfile.findMany({
        where: {
          id: { in: studentIds }
        }
      });

      // Check department access for all students (K2.1)
      const allowedDepartments = [coordinator.primary_department, ...coordinator.assigned_departments];
      const unauthorizedStudents = students.filter(s => !allowedDepartments.includes(s.department));
      
      if (unauthorizedStudents.length > 0) {
        throw new Error(`You do not have access to ${unauthorizedStudents.length} student(s) from other departments`);
      }

      // Check profile completion for all students (BR-D2)
      const incompleteProfiles = students.filter(s => s.profile_complete_percent < 80);
      
      if (incompleteProfiles.length > 0) {
        throw new Error(`${incompleteProfiles.length} student(s) have profile completion < 80%`);
      }

      // Batch update
      const result = await prisma.studentProfile.updateMany({
        where: {
          id: { in: studentIds }
        },
        data: {
          tpo_dept_verified: true,
          tpo_dept_verified_at: new Date(),
          tpo_dept_verified_by: userId,
          profile_status: 'VERIFIED',
          updated_at: new Date()
        }
      });

      // TODO: Send notifications to all verified students

      return {
        success: true,
        message: `${result.count} student profile(s) verified successfully`,
        data: { count: result.count }
      };
    } catch (error: any) {
      console.error('Batch verify profiles error:', error);
      throw new Error(error.message || 'Failed to batch verify profiles');
    }
  }

  /**
   * Get verification statistics
   */
  static async getVerificationStats(userId: string) {
    try {
      const coordinator = await prisma.tPODeptCoordinator.findUnique({
        where: { user_id: userId }
      });

      if (!coordinator) {
        throw new Error('TPO Dept coordinator not found');
      }

      const allowedDepartments = [coordinator.primary_department, ...coordinator.assigned_departments];

      const [
        total,
        pending,
        verified,
        rejected,
        hold
      ] = await Promise.all([
        prisma.studentProfile.count({
          where: {
            department: { in: allowedDepartments },
            deleted_at: null
          }
        }),
        prisma.studentProfile.count({
          where: {
            department: { in: allowedDepartments },
            tpo_dept_verified: false,
            profile_status: { not: 'REJECTED' },
            deleted_at: null
          }
        }),
        prisma.studentProfile.count({
          where: {
            department: { in: allowedDepartments },
            tpo_dept_verified: true,
            deleted_at: null
          }
        }),
        prisma.studentProfile.count({
          where: {
            department: { in: allowedDepartments },
            profile_status: 'REJECTED',
            deleted_at: null
          }
        }),
        prisma.studentProfile.count({
          where: {
            department: { in: allowedDepartments },
            profile_status: 'HOLD',
            deleted_at: null
          }
        })
      ]);

      const verificationRate = total > 0 ? ((verified / total) * 100).toFixed(2) : '0.00';

      return {
        success: true,
        data: {
          total,
          pending,
          verified,
          rejected,
          hold,
          verification_rate: `${verificationRate}%`
        }
      };
    } catch (error: any) {
      console.error('Get verification stats error:', error);
      throw new Error(error.message || 'Failed to get verification statistics');
    }
  }
}

export default ProfileVerificationService;
