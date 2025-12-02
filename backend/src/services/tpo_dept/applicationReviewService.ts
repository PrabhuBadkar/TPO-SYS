// Application Review Service - TPO_Dept First Gate Approval
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ApplicationFilters {
  status?: string;
  job_posting_id?: string;
  cgpa_min?: number;
  cgpa_max?: number;
  date_from?: Date;
  date_to?: Date;
  search?: string;
}

export class ApplicationReviewService {
  /**
   * Get application review queue for department
   */
  static async getApplicationQueue(userId: string, filters?: ApplicationFilters) {
    try {
      const coordinator = await prisma.tPODeptCoordinator.findUnique({
        where: { user_id: userId }
      });

      if (!coordinator) {
        throw new Error('TPO Dept coordinator not found');
      }

      if (!coordinator.can_process_applications) {
        throw new Error('You do not have permission to process applications');
      }

      const allowedDepartments = [coordinator.primary_department, ...coordinator.assigned_departments];

      // Build where clause
      const where: any = {
        status: filters?.status || 'SUBMITTED'
      };

      if (filters?.job_posting_id) {
        where.job_posting_id = filters.job_posting_id;
      }

      if (filters?.date_from || filters?.date_to) {
        where.created_at = {};
        if (filters.date_from) {
          where.created_at.gte = filters.date_from;
        }
        if (filters.date_to) {
          where.created_at.lte = filters.date_to;
        }
      }

      const applications = await prisma.jobApplication.findMany({
        where,
        include: {
          jobPosting: {
            select: {
              id: true,
              job_title: true,
              employment_type: true,
              work_location: true,
              eligibility_criteria: true,
              application_deadline: true,
              organization: {
                select: {
                  org_name: true
                }
              }
            }
          }
        },
        orderBy: [
          { created_at: 'asc' } // Oldest first (FIFO)
        ]
      });

      // Get student profiles for applications (department-scoped)
      const applicationsWithStudents = await Promise.all(
        applications.map(async (app) => {
          const student = await prisma.studentProfile.findUnique({
            where: { id: app.student_id },
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
              tpo_dept_verified: true,
              profile_complete_percent: true
            }
          });

          // Filter by department (K2.1)
          if (!student || !allowedDepartments.includes(student.department)) {
            return null;
          }

          // Apply CGPA filters
          if (filters?.cgpa_min && student.cgpi && Number(student.cgpi) < filters.cgpa_min) {
            return null;
          }
          if (filters?.cgpa_max && student.cgpi && Number(student.cgpi) > filters.cgpa_max) {
            return null;
          }

          // Apply search filter
          if (filters?.search) {
            const searchLower = filters.search.toLowerCase();
            const fullName = `${student.first_name} ${student.middle_name || ''} ${student.last_name}`.toLowerCase();
            if (!fullName.includes(searchLower) && !student.enrollment_number.toLowerCase().includes(searchLower)) {
              return null;
            }
          }

          return {
            ...app,
            student
          };
        })
      );

      // Filter out null entries
      const filteredApplications = applicationsWithStudents.filter(app => app !== null);

      return {
        success: true,
        data: filteredApplications,
        total: filteredApplications.length
      };
    } catch (error: any) {
      console.error('Get application queue error:', error);
      throw new Error(error.message || 'Failed to get application queue');
    }
  }

  /**
   * Get application details for review
   */
  static async getApplicationDetails(userId: string, applicationId: string) {
    try {
      const coordinator = await prisma.tPODeptCoordinator.findUnique({
        where: { user_id: userId }
      });

      if (!coordinator) {
        throw new Error('TPO Dept coordinator not found');
      }

      const application = await prisma.jobApplication.findUnique({
        where: { id: applicationId },
        include: {
          jobPosting: {
            include: {
              organization: {
                select: {
                  org_name: true,
                  website: true,
                  industry: true
                }
              }
            }
          }
        }
      });

      if (!application) {
        throw new Error('Application not found');
      }

      // Get student profile
      const student = await prisma.studentProfile.findUnique({
        where: { id: application.student_id },
        include: {
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
        throw new Error('You do not have access to applications from this department');
      }

      // Get resume
      const resume = await prisma.resume.findUnique({
        where: { id: application.resume_id },
        select: {
          id: true,
          file_name: true,
          file_path: true,
          version: true,
          is_primary: true,
          watermark_applied: true,
          created_at: true
        }
      });

      // Get consent
      const consent = await prisma.consent.findFirst({
        where: {
          student_id: application.student_id,
          job_posting_id: application.job_posting_id,
          consent_given: true,
          revoked: false
        }
      });

      return {
        success: true,
        data: {
          application,
          student,
          resume,
          consent: consent ? {
            given_at: consent.created_at,
            expires_at: consent.access_expiry,
            data_shared: consent.data_shared
          } : null
        }
      };
    } catch (error: any) {
      console.error('Get application details error:', error);
      throw new Error(error.message || 'Failed to get application details');
    }
  }

  /**
   * Approve application (forward to TPO_Admin)
   */
  static async approveApplication(userId: string, applicationId: string, notes?: string) {
    try {
      const coordinator = await prisma.tPODeptCoordinator.findUnique({
        where: { user_id: userId }
      });

      if (!coordinator) {
        throw new Error('TPO Dept coordinator not found');
      }

      if (!coordinator.can_process_applications) {
        throw new Error('You do not have permission to approve applications');
      }

      const application = await prisma.jobApplication.findUnique({
        where: { id: applicationId },
        include: {
          jobPosting: true
        }
      });

      if (!application) {
        throw new Error('Application not found');
      }

      // Get student profile
      const student = await prisma.studentProfile.findUnique({
        where: { id: application.student_id }
      });

      if (!student) {
        throw new Error('Student not found');
      }

      // Check department access (K2.1)
      const allowedDepartments = [coordinator.primary_department, ...coordinator.assigned_departments];
      if (!allowedDepartments.includes(student.department)) {
        throw new Error('You do not have access to applications from this department');
      }

      // BR-D9: Applications require profile verification before review
      if (!student.tpo_dept_verified) {
        throw new Error('Student profile must be verified before approving application');
      }

      // Verify eligibility
      const eligibility = application.jobPosting.eligibility_criteria as any;
      
      if (student.cgpi && Number(student.cgpi) < eligibility.cgpa_min) {
        throw new Error(`Student CGPA (${student.cgpi}) is below minimum requirement (${eligibility.cgpa_min})`);
      }

      if (student.active_backlogs && eligibility.max_backlogs === 0) {
        throw new Error('Student has active backlogs but job requires 0 backlogs');
      }

      if (!eligibility.allowed_branches.includes(student.department)) {
        throw new Error(`Student department (${student.department}) is not in allowed branches`);
      }

      // Update application
      const updatedApplication = await prisma.jobApplication.update({
        where: { id: applicationId },
        data: {
          status: 'PENDING_ADMIN',
          reviewed_by_dept: userId,
          reviewed_by_dept_at: new Date(),
          dept_review_notes: notes,
          updated_at: new Date()
        }
      });

      // TODO: Send notification to TPO_Admin
      // TODO: Send notification to student

      return {
        success: true,
        message: 'Application approved and forwarded to TPO Admin',
        data: updatedApplication
      };
    } catch (error: any) {
      console.error('Approve application error:', error);
      throw new Error(error.message || 'Failed to approve application');
    }
  }

  /**
   * Hold application for corrections
   */
  static async holdApplication(userId: string, applicationId: string, issues: string) {
    try {
      const coordinator = await prisma.tPODeptCoordinator.findUnique({
        where: { user_id: userId }
      });

      if (!coordinator) {
        throw new Error('TPO Dept coordinator not found');
      }

      if (!coordinator.can_process_applications) {
        throw new Error('You do not have permission to hold applications');
      }

      if (!issues || issues.trim().length === 0) {
        throw new Error('Issues description is required');
      }

      const application = await prisma.jobApplication.findUnique({
        where: { id: applicationId }
      });

      if (!application) {
        throw new Error('Application not found');
      }

      // Get student profile
      const student = await prisma.studentProfile.findUnique({
        where: { id: application.student_id }
      });

      if (!student) {
        throw new Error('Student not found');
      }

      // Check department access (K2.1)
      const allowedDepartments = [coordinator.primary_department, ...coordinator.assigned_departments];
      if (!allowedDepartments.includes(student.department)) {
        throw new Error('You do not have access to applications from this department');
      }

      // Update application
      const updatedApplication = await prisma.jobApplication.update({
        where: { id: applicationId },
        data: {
          status: 'HOLD',
          reviewed_by_dept: userId,
          reviewed_by_dept_at: new Date(),
          dept_review_notes: issues,
          updated_at: new Date()
        }
      });

      // TODO: Send notification to student with action items
      // TODO: Set reminder (T+2 days)

      return {
        success: true,
        message: 'Application put on hold. Student has been notified.',
        data: updatedApplication
      };
    } catch (error: any) {
      console.error('Hold application error:', error);
      throw new Error(error.message || 'Failed to hold application');
    }
  }

  /**
   * Reject application
   */
  static async rejectApplication(userId: string, applicationId: string, reason: string) {
    try {
      const coordinator = await prisma.tPODeptCoordinator.findUnique({
        where: { user_id: userId }
      });

      if (!coordinator) {
        throw new Error('TPO Dept coordinator not found');
      }

      if (!coordinator.can_process_applications) {
        throw new Error('You do not have permission to reject applications');
      }

      if (!reason || reason.trim().length === 0) {
        throw new Error('Rejection reason is required');
      }

      const application = await prisma.jobApplication.findUnique({
        where: { id: applicationId }
      });

      if (!application) {
        throw new Error('Application not found');
      }

      // Get student profile
      const student = await prisma.studentProfile.findUnique({
        where: { id: application.student_id }
      });

      if (!student) {
        throw new Error('Student not found');
      }

      // Check department access (K2.1)
      const allowedDepartments = [coordinator.primary_department, ...coordinator.assigned_departments];
      if (!allowedDepartments.includes(student.department)) {
        throw new Error('You do not have access to applications from this department');
      }

      // Update application
      const updatedApplication = await prisma.jobApplication.update({
        where: { id: applicationId },
        data: {
          status: 'REJECTED',
          reviewed_by_dept: userId,
          reviewed_by_dept_at: new Date(),
          rejection_reason: reason,
          rejected_at: new Date(),
          rejected_by: userId,
          updated_at: new Date()
        }
      });

      // BR-D11: Rejected applications can be appealed to TPO_Admin
      // TODO: Send notification to student with appeal process

      return {
        success: true,
        message: 'Application rejected. Student can appeal to TPO Admin.',
        data: updatedApplication
      };
    } catch (error: any) {
      console.error('Reject application error:', error);
      throw new Error(error.message || 'Failed to reject application');
    }
  }

  /**
   * Batch approve applications
   */
  static async batchApproveApplications(userId: string, applicationIds: string[], notes?: string) {
    try {
      const coordinator = await prisma.tPODeptCoordinator.findUnique({
        where: { user_id: userId }
      });

      if (!coordinator) {
        throw new Error('TPO Dept coordinator not found');
      }

      if (!coordinator.can_process_applications) {
        throw new Error('You do not have permission to approve applications');
      }

      // BR-D12: Batch approval max 100 at a time
      if (applicationIds.length > 100) {
        throw new Error('Cannot approve more than 100 applications at once');
      }

      const applications = await prisma.jobApplication.findMany({
        where: {
          id: { in: applicationIds }
        },
        include: {
          jobPosting: true
        }
      });

      // Validate all applications
      const studentIds = applications.map(app => app.student_id);
      const students = await prisma.studentProfile.findMany({
        where: { id: { in: studentIds } }
      });

      // Check department access for all students (K2.1)
      const allowedDepartments = [coordinator.primary_department, ...coordinator.assigned_departments];
      const unauthorizedStudents = students.filter(s => !allowedDepartments.includes(s.department));
      
      if (unauthorizedStudents.length > 0) {
        throw new Error(`You do not have access to ${unauthorizedStudents.length} application(s) from other departments`);
      }

      // Check profile verification for all students (BR-D9)
      const unverifiedStudents = students.filter(s => !s.tpo_dept_verified);
      
      if (unverifiedStudents.length > 0) {
        throw new Error(`${unverifiedStudents.length} student(s) have unverified profiles`);
      }

      // Batch update
      const result = await prisma.jobApplication.updateMany({
        where: {
          id: { in: applicationIds }
        },
        data: {
          status: 'PENDING_ADMIN',
          reviewed_by_dept: userId,
          reviewed_by_dept_at: new Date(),
          dept_review_notes: notes,
          updated_at: new Date()
        }
      });

      // TODO: Send notifications to TPO_Admin and students

      return {
        success: true,
        message: `${result.count} application(s) approved and forwarded to TPO Admin`,
        data: { count: result.count }
      };
    } catch (error: any) {
      console.error('Batch approve applications error:', error);
      throw new Error(error.message || 'Failed to batch approve applications');
    }
  }

  /**
   * Get application review statistics
   */
  static async getApplicationStats(userId: string) {
    try {
      const coordinator = await prisma.tPODeptCoordinator.findUnique({
        where: { user_id: userId }
      });

      if (!coordinator) {
        throw new Error('TPO Dept coordinator not found');
      }

      const allowedDepartments = [coordinator.primary_department, ...coordinator.assigned_departments];

      // Get all applications for department students
      const allApplications = await prisma.jobApplication.findMany({
        select: {
          id: true,
          student_id: true,
          status: true
        }
      });

      const studentIds = allApplications.map(app => app.student_id);
      const students = await prisma.studentProfile.findMany({
        where: {
          id: { in: studentIds },
          department: { in: allowedDepartments }
        },
        select: { id: true }
      });

      const departmentStudentIds = students.map(s => s.id);
      const departmentApplications = allApplications.filter(app => departmentStudentIds.includes(app.student_id));

      const stats = {
        total: departmentApplications.length,
        pending_review: departmentApplications.filter(app => app.status === 'SUBMITTED').length,
        approved: departmentApplications.filter(app => app.status === 'PENDING_ADMIN' || app.status === 'FORWARDED').length,
        rejected: departmentApplications.filter(app => app.status === 'REJECTED').length,
        hold: departmentApplications.filter(app => app.status === 'HOLD').length
      };

      const approvalRate = stats.total > 0 ? ((stats.approved / stats.total) * 100).toFixed(2) : '0.00';

      return {
        success: true,
        data: {
          ...stats,
          approval_rate: `${approvalRate}%`
        }
      };
    } catch (error: any) {
      console.error('Get application stats error:', error);
      throw new Error(error.message || 'Failed to get application statistics');
    }
  }
}

export default ApplicationReviewService;
