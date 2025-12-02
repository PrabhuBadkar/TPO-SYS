// Analytics Service - Recruitment Metrics and Reports
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class AnalyticsService {
  /**
   * Get recruitment dashboard metrics
   */
  static async getDashboardMetrics(userId: string) {
    try {
      const poc = await prisma.pOC.findUnique({
        where: { user_id: userId }
      });

      if (!poc) {
        throw new Error('POC not found');
      }

      // Job Posting Metrics
      const [
        totalJobPostings,
        activeJobPostings,
        closedJobPostings,
        pendingApprovalJobPostings
      ] = await Promise.all([
        prisma.jobPosting.count({
          where: { org_id: poc.org_id, deleted_at: null }
        }),
        prisma.jobPosting.count({
          where: { org_id: poc.org_id, status: 'ACTIVE', deleted_at: null }
        }),
        prisma.jobPosting.count({
          where: { org_id: poc.org_id, status: 'CLOSED', deleted_at: null }
        }),
        prisma.jobPosting.count({
          where: { org_id: poc.org_id, status: 'PENDING_APPROVAL', deleted_at: null }
        })
      ]);

      // Application Metrics
      const [
        totalApplications,
        shortlistedApplications,
        rejectedApplications
      ] = await Promise.all([
        prisma.jobApplication.count({
          where: {
            jobPosting: { org_id: poc.org_id },
            forwarded_to_recruiter: true
          }
        }),
        prisma.jobApplication.count({
          where: {
            jobPosting: { org_id: poc.org_id },
            forwarded_to_recruiter: true,
            status: 'SHORTLISTED'
          }
        }),
        prisma.jobApplication.count({
          where: {
            jobPosting: { org_id: poc.org_id },
            forwarded_to_recruiter: true,
            status: 'REJECTED'
          }
        })
      ]);

      // Offer Metrics
      const [
        totalOffers,
        acceptedOffers,
        rejectedOffers,
        pendingOffers
      ] = await Promise.all([
        prisma.offer.count({
          where: { jobPosting: { org_id: poc.org_id } }
        }),
        prisma.offer.count({
          where: { jobPosting: { org_id: poc.org_id }, status: 'ACCEPTED' }
        }),
        prisma.offer.count({
          where: { jobPosting: { org_id: poc.org_id }, status: 'REJECTED' }
        }),
        prisma.offer.count({
          where: { jobPosting: { org_id: poc.org_id }, status: 'EXTENDED' }
        })
      ]);

      // Calculate rates
      const applicationSuccessRate = totalApplications > 0
        ? ((shortlistedApplications / totalApplications) * 100).toFixed(2)
        : '0.00';

      const offerAcceptanceRate = totalOffers > 0
        ? ((acceptedOffers / totalOffers) * 100).toFixed(2)
        : '0.00';

      // Get average CGPA of applicants
      const applications = await prisma.jobApplication.findMany({
        where: {
          jobPosting: { org_id: poc.org_id },
          forwarded_to_recruiter: true
        },
        select: {
          student_id: true
        }
      });

      const studentIds = applications.map(app => app.student_id);
      const students = await prisma.studentProfile.findMany({
        where: { id: { in: studentIds } },
        select: { cgpi: true }
      });

      const validCGPAs = students
        .map(s => s.cgpi)
        .filter(cgpi => cgpi !== null)
        .map(cgpi => Number(cgpi));

      const avgCGPA = validCGPAs.length > 0
        ? (validCGPAs.reduce((sum, cgpi) => sum + cgpi, 0) / validCGPAs.length).toFixed(2)
        : '0.00';

      return {
        success: true,
        data: {
          job_postings: {
            total: totalJobPostings,
            active: activeJobPostings,
            closed: closedJobPostings,
            pending_approval: pendingApprovalJobPostings
          },
          applications: {
            total: totalApplications,
            shortlisted: shortlistedApplications,
            rejected: rejectedApplications,
            pending: totalApplications - shortlistedApplications - rejectedApplications,
            success_rate: `${applicationSuccessRate}%`
          },
          offers: {
            total: totalOffers,
            accepted: acceptedOffers,
            rejected: rejectedOffers,
            pending: pendingOffers,
            acceptance_rate: `${offerAcceptanceRate}%`
          },
          candidates: {
            avg_cgpa: avgCGPA,
            total_unique: studentIds.length
          }
        }
      };
    } catch (error: any) {
      console.error('Get dashboard metrics error:', error);
      throw new Error(error.message || 'Failed to get dashboard metrics');
    }
  }

  /**
   * Get application funnel data
   */
  static async getApplicationFunnel(userId: string, jobPostingId?: string) {
    try {
      const poc = await prisma.pOC.findUnique({
        where: { user_id: userId }
      });

      if (!poc) {
        throw new Error('POC not found');
      }

      const where: any = {
        jobPosting: { org_id: poc.org_id },
        forwarded_to_recruiter: true
      };

      if (jobPostingId) {
        where.job_posting_id = jobPostingId;
      }

      const [
        applied,
        shortlisted,
        offered,
        accepted
      ] = await Promise.all([
        prisma.jobApplication.count({ where }),
        prisma.jobApplication.count({ where: { ...where, status: 'SHORTLISTED' } }),
        prisma.jobApplication.count({ where: { ...where, status: 'OFFERED' } }),
        prisma.jobApplication.count({ where: { ...where, status: 'ACCEPTED' } })
      ]);

      return {
        success: true,
        data: {
          funnel: [
            { stage: 'Applied', count: applied },
            { stage: 'Shortlisted', count: shortlisted },
            { stage: 'Offered', count: offered },
            { stage: 'Accepted', count: accepted }
          ],
          conversion_rates: {
            applied_to_shortlisted: applied > 0 ? ((shortlisted / applied) * 100).toFixed(2) : '0.00',
            shortlisted_to_offered: shortlisted > 0 ? ((offered / shortlisted) * 100).toFixed(2) : '0.00',
            offered_to_accepted: offered > 0 ? ((accepted / offered) * 100).toFixed(2) : '0.00'
          }
        }
      };
    } catch (error: any) {
      console.error('Get application funnel error:', error);
      throw new Error(error.message || 'Failed to get application funnel');
    }
  }

  /**
   * Get department-wise application breakdown
   */
  static async getDepartmentBreakdown(userId: string, jobPostingId?: string) {
    try {
      const poc = await prisma.pOC.findUnique({
        where: { user_id: userId }
      });

      if (!poc) {
        throw new Error('POC not found');
      }

      const where: any = {
        jobPosting: { org_id: poc.org_id },
        forwarded_to_recruiter: true
      };

      if (jobPostingId) {
        where.job_posting_id = jobPostingId;
      }

      const applications = await prisma.jobApplication.findMany({
        where,
        select: {
          student_id: true,
          status: true
        }
      });

      const studentIds = applications.map(app => app.student_id);
      const students = await prisma.studentProfile.findMany({
        where: { id: { in: studentIds } },
        select: {
          id: true,
          department: true
        }
      });

      // Create department map
      const deptMap = new Map<string, { total: number; shortlisted: number }>();

      students.forEach(student => {
        const app = applications.find(a => a.student_id === student.id);
        if (!app) return;

        const dept = student.department;
        if (!deptMap.has(dept)) {
          deptMap.set(dept, { total: 0, shortlisted: 0 });
        }

        const stats = deptMap.get(dept)!;
        stats.total++;
        if (app.status === 'SHORTLISTED' || app.status === 'OFFERED' || app.status === 'ACCEPTED') {
          stats.shortlisted++;
        }
      });

      const breakdown = Array.from(deptMap.entries()).map(([dept, stats]) => ({
        department: dept,
        total_applications: stats.total,
        shortlisted: stats.shortlisted,
        shortlist_rate: stats.total > 0 ? ((stats.shortlisted / stats.total) * 100).toFixed(2) : '0.00'
      }));

      return {
        success: true,
        data: breakdown.sort((a, b) => b.total_applications - a.total_applications)
      };
    } catch (error: any) {
      console.error('Get department breakdown error:', error);
      throw new Error(error.message || 'Failed to get department breakdown');
    }
  }

  /**
   * Get CGPA distribution
   */
  static async getCGPADistribution(userId: string, jobPostingId?: string) {
    try {
      const poc = await prisma.pOC.findUnique({
        where: { user_id: userId }
      });

      if (!poc) {
        throw new Error('POC not found');
      }

      const where: any = {
        jobPosting: { org_id: poc.org_id },
        forwarded_to_recruiter: true
      };

      if (jobPostingId) {
        where.job_posting_id = jobPostingId;
      }

      const applications = await prisma.jobApplication.findMany({
        where,
        select: {
          student_id: true
        }
      });

      const studentIds = applications.map(app => app.student_id);
      const students = await prisma.studentProfile.findMany({
        where: { id: { in: studentIds } },
        select: {
          cgpi: true
        }
      });

      const cgpas = students
        .map(s => s.cgpi)
        .filter(cgpi => cgpi !== null)
        .map(cgpi => Number(cgpi));

      // Create CGPA ranges
      const ranges = [
        { label: '9.0 - 10.0', min: 9.0, max: 10.0, count: 0 },
        { label: '8.0 - 8.9', min: 8.0, max: 8.9, count: 0 },
        { label: '7.0 - 7.9', min: 7.0, max: 7.9, count: 0 },
        { label: '6.0 - 6.9', min: 6.0, max: 6.9, count: 0 },
        { label: 'Below 6.0', min: 0.0, max: 5.9, count: 0 }
      ];

      cgpas.forEach(cgpa => {
        const range = ranges.find(r => cgpa >= r.min && cgpa <= r.max);
        if (range) {
          range.count++;
        }
      });

      return {
        success: true,
        data: ranges.map(r => ({
          range: r.label,
          count: r.count,
          percentage: cgpas.length > 0 ? ((r.count / cgpas.length) * 100).toFixed(2) : '0.00'
        }))
      };
    } catch (error: any) {
      console.error('Get CGPA distribution error:', error);
      throw new Error(error.message || 'Failed to get CGPA distribution');
    }
  }

  /**
   * Get time-to-fill metrics
   */
  static async getTimeToFill(userId: string) {
    try {
      const poc = await prisma.pOC.findUnique({
        where: { user_id: userId }
      });

      if (!poc) {
        throw new Error('POC not found');
      }

      const offers = await prisma.offer.findMany({
        where: {
          jobPosting: { org_id: poc.org_id },
          status: 'ACCEPTED'
        },
        include: {
          jobPosting: {
            select: {
              created_at: true,
              job_title: true
            }
          }
        }
      });

      const timeToFillData = offers.map(offer => {
        const postingDate = new Date(offer.jobPosting.created_at);
        const acceptanceDate = new Date(offer.accepted_at!);
        const daysToFill = Math.ceil((acceptanceDate.getTime() - postingDate.getTime()) / (1000 * 60 * 60 * 24));

        return {
          job_title: offer.jobPosting.job_title,
          days_to_fill: daysToFill,
          posted_at: postingDate,
          accepted_at: acceptanceDate
        };
      });

      const avgTimeToFill = timeToFillData.length > 0
        ? Math.ceil(timeToFillData.reduce((sum, item) => sum + item.days_to_fill, 0) / timeToFillData.length)
        : 0;

      return {
        success: true,
        data: {
          average_days: avgTimeToFill,
          positions_filled: timeToFillData.length,
          details: timeToFillData.sort((a, b) => b.accepted_at.getTime() - a.accepted_at.getTime())
        }
      };
    } catch (error: any) {
      console.error('Get time to fill error:', error);
      throw new Error(error.message || 'Failed to get time-to-fill metrics');
    }
  }

  /**
   * Export recruitment data
   */
  static async exportRecruitmentData(userId: string, reportType: string, filters?: any) {
    try {
      const poc = await prisma.pOC.findUnique({
        where: { user_id: userId }
      });

      if (!poc) {
        throw new Error('POC not found');
      }

      let data: any[] = [];

      switch (reportType) {
        case 'applications':
          data = await this.getApplicationsExportData(poc.org_id, filters);
          break;
        case 'offers':
          data = await this.getOffersExportData(poc.org_id, filters);
          break;
        case 'job_postings':
          data = await this.getJobPostingsExportData(poc.org_id, filters);
          break;
        default:
          throw new Error('Invalid report type');
      }

      return {
        success: true,
        data,
        report_type: reportType,
        generated_at: new Date()
      };
    } catch (error: any) {
      console.error('Export recruitment data error:', error);
      throw new Error(error.message || 'Failed to export recruitment data');
    }
  }

  private static async getApplicationsExportData(orgId: string, filters?: any) {
    const applications = await prisma.jobApplication.findMany({
      where: {
        jobPosting: { org_id: orgId },
        forwarded_to_recruiter: true,
        ...(filters?.job_posting_id && { job_posting_id: filters.job_posting_id }),
        ...(filters?.status && { status: filters.status })
      },
      include: {
        jobPosting: {
          select: {
            job_title: true,
            employment_type: true
          }
        }
      }
    });

    const studentIds = applications.map(app => app.student_id);
    const students = await prisma.studentProfile.findMany({
      where: { id: { in: studentIds } },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        enrollment_number: true,
        department: true,
        cgpi: true
      }
    });

    return applications.map(app => {
      const student = students.find(s => s.id === app.student_id);
      return {
        application_id: app.id,
        student_name: student ? `${student.first_name} ${student.last_name}` : 'N/A',
        enrollment_number: student?.enrollment_number || 'N/A',
        department: student?.department || 'N/A',
        cgpa: student?.cgpi || 'N/A',
        job_title: app.jobPosting.job_title,
        employment_type: app.jobPosting.employment_type,
        status: app.status,
        applied_at: app.created_at,
        shortlisted: app.shortlisted ? 'Yes' : 'No'
      };
    });
  }

  private static async getOffersExportData(orgId: string, filters?: any) {
    const offers = await prisma.offer.findMany({
      where: {
        jobPosting: { org_id: orgId },
        ...(filters?.job_posting_id && { job_posting_id: filters.job_posting_id }),
        ...(filters?.status && { status: filters.status })
      },
      include: {
        jobPosting: {
          select: {
            job_title: true
          }
        }
      }
    });

    const studentIds = offers.map(offer => offer.student_id);
    const students = await prisma.studentProfile.findMany({
      where: { id: { in: studentIds } },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        enrollment_number: true,
        department: true
      }
    });

    return offers.map(offer => {
      const student = students.find(s => s.id === offer.student_id);
      const ctc = offer.ctc_breakdown as any;
      return {
        offer_id: offer.id,
        student_name: student ? `${student.first_name} ${student.last_name}` : 'N/A',
        enrollment_number: student?.enrollment_number || 'N/A',
        department: student?.department || 'N/A',
        job_title: offer.jobPosting.job_title,
        total_ctc: ctc.total_ctc,
        joining_date: offer.joining_date,
        offer_expiry: offer.offer_expiry,
        status: offer.status,
        extended_at: offer.created_at,
        accepted_at: offer.accepted_at
      };
    });
  }

  private static async getJobPostingsExportData(orgId: string, filters?: any) {
    const jobPostings = await prisma.jobPosting.findMany({
      where: {
        org_id: orgId,
        deleted_at: null,
        ...(filters?.status && { status: filters.status })
      },
      include: {
        _count: {
          select: {
            applications: true,
            offers: true
          }
        }
      }
    });

    return jobPostings.map(jp => {
      const ctc = jp.ctc_breakdown as any;
      const eligibility = jp.eligibility_criteria as any;
      return {
        job_id: jp.id,
        job_title: jp.job_title,
        employment_type: jp.employment_type,
        work_location: jp.work_location,
        total_ctc: ctc.total_ctc,
        cgpa_min: eligibility.cgpa_min,
        max_backlogs: eligibility.max_backlogs,
        application_deadline: jp.application_deadline,
        status: jp.status,
        total_applications: jp._count.applications,
        total_offers: jp._count.offers,
        created_at: jp.created_at
      };
    });
  }
}

export default AnalyticsService;
