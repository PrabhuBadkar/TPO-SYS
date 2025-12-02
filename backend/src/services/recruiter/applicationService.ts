// Application Service - View and Manage Student Applications
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ApplicationFilters {
  job_posting_id?: string;
  status?: string;
  cgpa_min?: number;
  cgpa_max?: number;
  department?: string;
  date_from?: Date;
  date_to?: Date;
  search?: string;
}

export class ApplicationService {
  /**
   * Get all applications for recruiter's job postings
   */
  static async getApplications(userId: string, filters?: ApplicationFilters) {
    try {
      const poc = await prisma.pOC.findUnique({
        where: { user_id: userId }
      });

      if (!poc) {
        throw new Error('POC not found');
      }

      // Build where clause
      const where: any = {
        jobPosting: {
          org_id: poc.org_id
        },
        forwarded_to_recruiter: true // Only show applications forwarded by TPO Admin
      };

      if (filters?.job_posting_id) {
        where.job_posting_id = filters.job_posting_id;
      }

      if (filters?.status) {
        where.status = filters.status;
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
              work_location: true
            }
          }
        },
        orderBy: { created_at: 'desc' }
      });

      // Get student profiles for applications (with consent check)
      const applicationsWithStudents = await Promise.all(
        applications.map(async (app) => {
          // Check consent
          const consent = await prisma.consent.findFirst({
            where: {
              student_id: app.student_id,
              job_posting_id: app.job_posting_id,
              consent_given: true,
              revoked: false
            }
          });

          if (!consent) {
            return {
              ...app,
              student: null,
              consent_status: 'NO_CONSENT'
            };
          }

          // Check if consent expired
          if (consent.access_expiry && consent.access_expiry < new Date()) {
            return {
              ...app,
              student: null,
              consent_status: 'CONSENT_EXPIRED'
            };
          }

          // Get student profile
          const student = await prisma.studentProfile.findUnique({
            where: { id: app.student_id },
            select: {
              id: true,
              first_name: true,
              middle_name: true,
              last_name: true,
              enrollment_number: true,
              department: true,
              degree: true,
              current_semester: true,
              expected_graduation_year: true,
              cgpi: true,
              active_backlogs: true,
              skills: true,
              // Contact info only for shortlisted candidates
              ...(app.shortlisted ? {
                personal_email: true,
                mobile_number: true
              } : {})
            }
          });

          // Apply filters on student data
          if (filters?.cgpa_min && student && student.cgpi && Number(student.cgpi) < filters.cgpa_min) {
            return null;
          }
          if (filters?.cgpa_max && student && student.cgpi && Number(student.cgpi) > filters.cgpa_max) {
            return null;
          }
          if (filters?.department && student && student.department !== filters.department) {
            return null;
          }
          if (filters?.search && student) {
            const searchLower = filters.search.toLowerCase();
            const fullName = `${student.first_name} ${student.middle_name || ''} ${student.last_name}`.toLowerCase();
            if (!fullName.includes(searchLower) && !student.enrollment_number.toLowerCase().includes(searchLower)) {
              return null;
            }
          }

          return {
            ...app,
            student,
            consent_status: 'VALID'
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
      console.error('Get applications error:', error);
      throw new Error(error.message || 'Failed to get applications');
    }
  }

  /**
   * Get application details
   */
  static async getApplicationDetails(userId: string, applicationId: string) {
    try {
      const poc = await prisma.pOC.findUnique({
        where: { user_id: userId }
      });

      if (!poc) {
        throw new Error('POC not found');
      }

      const application = await prisma.jobApplication.findUnique({
        where: { id: applicationId },
        include: {
          jobPosting: {
            include: {
              organization: {
                select: {
                  org_name: true
                }
              }
            }
          }
        }
      });

      if (!application) {
        throw new Error('Application not found');
      }

      if (application.jobPosting.org_id !== poc.org_id) {
        throw new Error('Unauthorized to view this application');
      }

      if (!application.forwarded_to_recruiter) {
        throw new Error('Application not yet forwarded by TPO Admin');
      }

      // Check consent
      const consent = await prisma.consent.findFirst({
        where: {
          student_id: application.student_id,
          job_posting_id: application.job_posting_id,
          consent_given: true,
          revoked: false
        }
      });

      if (!consent) {
        throw new Error('Student has not given consent or consent has been revoked');
      }

      if (consent.access_expiry && consent.access_expiry < new Date()) {
        throw new Error('Consent has expired');
      }

      // Get student profile
      const student = await prisma.studentProfile.findUnique({
        where: { id: application.student_id },
        select: {
          id: true,
          first_name: true,
          middle_name: true,
          last_name: true,
          enrollment_number: true,
          department: true,
          degree: true,
          current_semester: true,
          expected_graduation_year: true,
          cgpi: true,
          active_backlogs: true,
          backlog_history: true,
          skills: true,
          projects: true,
          certifications: true,
          internships: true,
          competitive_profiles: true,
          // Contact info only for shortlisted candidates
          ...(application.shortlisted ? {
            personal_email: true,
            mobile_number: true,
            alternate_mobile: true
          } : {})
        }
      });

      // Get resume
      const resume = await prisma.resume.findUnique({
        where: { id: application.resume_id },
        select: {
          id: true,
          file_name: true,
          file_path: true,
          version: true,
          watermark_applied: true,
          created_at: true
        }
      });

      return {
        success: true,
        data: {
          application,
          student,
          resume,
          consent: {
            given_at: consent.created_at,
            expires_at: consent.access_expiry,
            data_shared: consent.data_shared
          }
        }
      };
    } catch (error: any) {
      console.error('Get application details error:', error);
      throw new Error(error.message || 'Failed to get application details');
    }
  }

  /**
   * Shortlist applications
   */
  static async shortlistApplications(userId: string, applicationIds: string[], notes?: string) {
    try {
      const poc = await prisma.pOC.findUnique({
        where: { user_id: userId }
      });

      if (!poc) {
        throw new Error('POC not found');
      }

      // Validate all applications belong to recruiter's organization
      const applications = await prisma.jobApplication.findMany({
        where: {
          id: { in: applicationIds },
          jobPosting: {
            org_id: poc.org_id
          },
          forwarded_to_recruiter: true
        }
      });

      if (applications.length !== applicationIds.length) {
        throw new Error('Some applications not found or unauthorized');
      }

      // Batch update
      const result = await prisma.jobApplication.updateMany({
        where: {
          id: { in: applicationIds }
        },
        data: {
          shortlisted: true,
          shortlisted_at: new Date(),
          shortlisted_by: userId,
          shortlist_notes: notes,
          status: 'SHORTLISTED',
          updated_at: new Date()
        }
      });

      return {
        success: true,
        message: `${result.count} application(s) shortlisted successfully`,
        data: { count: result.count }
      };
    } catch (error: any) {
      console.error('Shortlist applications error:', error);
      throw new Error(error.message || 'Failed to shortlist applications');
    }
  }

  /**
   * Reject applications
   */
  static async rejectApplications(userId: string, applicationIds: string[], reason: string) {
    try {
      const poc = await prisma.pOC.findUnique({
        where: { user_id: userId }
      });

      if (!poc) {
        throw new Error('POC not found');
      }

      if (!reason || reason.trim().length === 0) {
        throw new Error('Rejection reason is required');
      }

      // Validate all applications belong to recruiter's organization
      const applications = await prisma.jobApplication.findMany({
        where: {
          id: { in: applicationIds },
          jobPosting: {
            org_id: poc.org_id
          },
          forwarded_to_recruiter: true
        }
      });

      if (applications.length !== applicationIds.length) {
        throw new Error('Some applications not found or unauthorized');
      }

      // Batch update
      const result = await prisma.jobApplication.updateMany({
        where: {
          id: { in: applicationIds }
        },
        data: {
          status: 'REJECTED',
          rejection_reason: reason,
          rejected_at: new Date(),
          rejected_by: userId,
          updated_at: new Date()
        }
      });

      return {
        success: true,
        message: `${result.count} application(s) rejected`,
        data: { count: result.count }
      };
    } catch (error: any) {
      console.error('Reject applications error:', error);
      throw new Error(error.message || 'Failed to reject applications');
    }
  }

  /**
   * Download resume (watermarked)
   */
  static async downloadResume(userId: string, applicationId: string) {
    try {
      const poc = await prisma.pOC.findUnique({
        where: { user_id: userId }
      });

      if (!poc) {
        throw new Error('POC not found');
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

      if (application.jobPosting.org_id !== poc.org_id) {
        throw new Error('Unauthorized to download this resume');
      }

      if (!application.forwarded_to_recruiter) {
        throw new Error('Application not yet forwarded by TPO Admin');
      }

      // Check consent
      const consent = await prisma.consent.findFirst({
        where: {
          student_id: application.student_id,
          job_posting_id: application.job_posting_id,
          consent_given: true,
          revoked: false
        }
      });

      if (!consent) {
        throw new Error('Student has not given consent or consent has been revoked');
      }

      const resume = await prisma.resume.findUnique({
        where: { id: application.resume_id }
      });

      if (!resume) {
        throw new Error('Resume not found');
      }

      return {
        success: true,
        data: {
          file_path: resume.file_path,
          file_name: resume.file_name,
          watermark_applied: resume.watermark_applied
        }
      };
    } catch (error: any) {
      console.error('Download resume error:', error);
      throw new Error(error.message || 'Failed to download resume');
    }
  }

  /**
   * Get application statistics
   */
  static async getApplicationStats(userId: string, jobPostingId?: string) {
    try {
      const poc = await prisma.pOC.findUnique({
        where: { user_id: userId }
      });

      if (!poc) {
        throw new Error('POC not found');
      }

      const where: any = {
        jobPosting: {
          org_id: poc.org_id
        },
        forwarded_to_recruiter: true
      };

      if (jobPostingId) {
        where.job_posting_id = jobPostingId;
      }

      const [
        total,
        shortlisted,
        rejected,
        offered,
        accepted
      ] = await Promise.all([
        prisma.jobApplication.count({ where }),
        prisma.jobApplication.count({ where: { ...where, status: 'SHORTLISTED' } }),
        prisma.jobApplication.count({ where: { ...where, status: 'REJECTED' } }),
        prisma.jobApplication.count({ where: { ...where, status: 'OFFERED' } }),
        prisma.jobApplication.count({ where: { ...where, status: 'ACCEPTED' } })
      ]);

      return {
        success: true,
        data: {
          total,
          shortlisted,
          rejected,
          offered,
          accepted,
          pending: total - shortlisted - rejected - offered - accepted
        }
      };
    } catch (error: any) {
      console.error('Get application stats error:', error);
      throw new Error(error.message || 'Failed to get application statistics');
    }
  }
}

export default ApplicationService;
