/**
 * Analytics Service
 * Comprehensive analytics and reporting
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AnalyticsFilters {
  start_date?: Date;
  end_date?: Date;
  department?: string;
  graduation_year?: string;
}

/**
 * Analytics Service
 */
export class AnalyticsService {
  /**
   * Get placement overview
   */
  async getPlacementOverview(filters?: AnalyticsFilters): Promise<any> {
    try {
      const where: any = {};

      if (filters?.department) {
        where.student = {
          studentProfile: {
            department: filters.department,
          },
        };
      }

      if (filters?.graduation_year) {
        where.student = {
          ...where.student,
          studentProfile: {
            ...where.student?.studentProfile,
            graduation_year: filters.graduation_year,
          },
        };
      }

      const [totalStudents, totalApplications, totalOffers, placedStudents] = await Promise.all([
        prisma.user.count({
          where: {
            role: 'student',
            ...(filters?.department || filters?.graduation_year ? {
              studentProfile: {
                ...(filters.department ? { department: filters.department } : {}),
                ...(filters.graduation_year ? { graduation_year: filters.graduation_year } : {}),
              },
            } : {}),
          },
        }),
        prisma.application.count({ where }),
        prisma.offer.count({
          where: {
            ...where,
            status: { in: ['accepted', 'pending'] },
          },
        }),
        prisma.offer.count({
          where: {
            ...where,
            status: 'accepted',
          },
        }),
      ]);

      const placementRate = totalStudents > 0 ? (placedStudents / totalStudents) * 100 : 0;

      return {
        success: true,
        overview: {
          total_students: totalStudents,
          total_applications: totalApplications,
          total_offers: totalOffers,
          placed_students: placedStudents,
          placement_rate: Math.round(placementRate * 100) / 100,
          avg_applications_per_student: totalStudents > 0 
            ? Math.round((totalApplications / totalStudents) * 100) / 100 
            : 0,
        },
      };
    } catch (error) {
      console.error('[Analytics] Error getting placement overview:', error);
      throw new Error('Failed to get placement overview');
    }
  }

  /**
   * Get company statistics
   */
  async getCompanyStatistics(filters?: AnalyticsFilters): Promise<any> {
    try {
      const where: any = {};

      if (filters?.start_date || filters?.end_date) {
        where.created_at = {};
        if (filters.start_date) where.created_at.gte = filters.start_date;
        if (filters.end_date) where.created_at.lte = filters.end_date;
      }

      const [totalCompanies, activeJobs, topCompanies] = await Promise.all([
        prisma.organization.count({
          where: { blacklisted: false },
        }),
        prisma.jobPosting.count({
          where: {
            ...where,
            status: 'approved',
            application_deadline: { gte: new Date() },
          },
        }),
        prisma.jobPosting.groupBy({
          by: ['organization_id'],
          where,
          _count: { id: true },
          orderBy: { _count: { id: 'desc' } },
          take: 10,
        }),
      ]);

      return {
        success: true,
        statistics: {
          total_companies: totalCompanies,
          active_jobs: activeJobs,
          top_companies: topCompanies,
        },
      };
    } catch (error) {
      console.error('[Analytics] Error getting company statistics:', error);
      throw new Error('Failed to get company statistics');
    }
  }

  /**
   * Get salary statistics
   */
  async getSalaryStatistics(filters?: AnalyticsFilters): Promise<any> {
    try {
      const where: any = { status: 'accepted' };

      if (filters?.department) {
        where.student = {
          studentProfile: {
            department: filters.department,
          },
        };
      }

      const offers = await prisma.offer.findMany({
        where,
        select: { ctc: true },
      });

      if (offers.length === 0) {
        return {
          success: true,
          statistics: {
            average_ctc: 0,
            highest_ctc: 0,
            lowest_ctc: 0,
            median_ctc: 0,
            total_offers: 0,
          },
        };
      }

      const ctcs = offers.map(o => o.ctc).sort((a, b) => a - b);
      const sum = ctcs.reduce((acc, val) => acc + val, 0);
      const average = sum / ctcs.length;
      const median = ctcs.length % 2 === 0
        ? (ctcs[ctcs.length / 2 - 1] + ctcs[ctcs.length / 2]) / 2
        : ctcs[Math.floor(ctcs.length / 2)];

      return {
        success: true,
        statistics: {
          average_ctc: Math.round(average * 100) / 100,
          highest_ctc: Math.max(...ctcs),
          lowest_ctc: Math.min(...ctcs),
          median_ctc: Math.round(median * 100) / 100,
          total_offers: offers.length,
        },
      };
    } catch (error) {
      console.error('[Analytics] Error getting salary statistics:', error);
      throw new Error('Failed to get salary statistics');
    }
  }

  /**
   * Get department-wise statistics
   */
  async getDepartmentStatistics(filters?: AnalyticsFilters): Promise<any> {
    try {
      const departments = ['CSE', 'ECE', 'ME', 'CE', 'IT', 'EE'];
      const stats = [];

      for (const dept of departments) {
        const [students, applications, offers] = await Promise.all([
          prisma.user.count({
            where: {
              role: 'student',
              studentProfile: { department: dept },
            },
          }),
          prisma.application.count({
            where: {
              student: {
                studentProfile: { department: dept },
              },
            },
          }),
          prisma.offer.count({
            where: {
              status: 'accepted',
              student: {
                studentProfile: { department: dept },
              },
            },
          }),
        ]);

        stats.push({
          department: dept,
          total_students: students,
          total_applications: applications,
          placed_students: offers,
          placement_rate: students > 0 ? Math.round((offers / students) * 100 * 100) / 100 : 0,
        });
      }

      return {
        success: true,
        statistics: stats,
      };
    } catch (error) {
      console.error('[Analytics] Error getting department statistics:', error);
      throw new Error('Failed to get department statistics');
    }
  }

  /**
   * Get application funnel
   */
  async getApplicationFunnel(filters?: AnalyticsFilters): Promise<any> {
    try {
      const where: any = {};

      if (filters?.start_date || filters?.end_date) {
        where.applied_at = {};
        if (filters.start_date) where.applied_at.gte = filters.start_date;
        if (filters.end_date) where.applied_at.lte = filters.end_date;
      }

      const [total, pending, underReview, shortlisted, rejected, selected] = await Promise.all([
        prisma.application.count({ where }),
        prisma.application.count({ where: { ...where, status: 'pending' } }),
        prisma.application.count({ where: { ...where, status: 'under_review' } }),
        prisma.application.count({ where: { ...where, status: 'shortlisted' } }),
        prisma.application.count({ where: { ...where, status: 'rejected' } }),
        prisma.application.count({ where: { ...where, status: 'selected' } }),
      ]);

      return {
        success: true,
        funnel: {
          total_applications: total,
          pending,
          under_review: underReview,
          shortlisted,
          rejected,
          selected,
          conversion_rate: total > 0 ? Math.round((selected / total) * 100 * 100) / 100 : 0,
        },
      };
    } catch (error) {
      console.error('[Analytics] Error getting application funnel:', error);
      throw new Error('Failed to get application funnel');
    }
  }

  /**
   * Get timeline data
   */
  async getTimelineData(filters?: AnalyticsFilters): Promise<any> {
    try {
      const where: any = {};

      if (filters?.start_date || filters?.end_date) {
        where.applied_at = {};
        if (filters.start_date) where.applied_at.gte = filters.start_date;
        if (filters.end_date) where.applied_at.lte = filters.end_date;
      }

      // Get applications by month
      const applications = await prisma.application.findMany({
        where,
        select: { applied_at: true },
      });

      // Group by month
      const monthlyData: Record<string, number> = {};
      applications.forEach(app => {
        const month = new Date(app.applied_at).toISOString().slice(0, 7); // YYYY-MM
        monthlyData[month] = (monthlyData[month] || 0) + 1;
      });

      return {
        success: true,
        timeline: Object.entries(monthlyData).map(([month, count]) => ({
          month,
          applications: count,
        })),
      };
    } catch (error) {
      console.error('[Analytics] Error getting timeline data:', error);
      throw new Error('Failed to get timeline data');
    }
  }

  /**
   * Generate custom report
   */
  async generateCustomReport(config: {
    metrics: string[];
    filters?: AnalyticsFilters;
    groupBy?: string;
  }): Promise<any> {
    try {
      const results: Record<string, any> = {};

      for (const metric of config.metrics) {
        switch (metric) {
          case 'placement_overview':
            results[metric] = await this.getPlacementOverview(config.filters);
            break;
          case 'company_statistics':
            results[metric] = await this.getCompanyStatistics(config.filters);
            break;
          case 'salary_statistics':
            results[metric] = await this.getSalaryStatistics(config.filters);
            break;
          case 'department_statistics':
            results[metric] = await this.getDepartmentStatistics(config.filters);
            break;
          case 'application_funnel':
            results[metric] = await this.getApplicationFunnel(config.filters);
            break;
          case 'timeline':
            results[metric] = await this.getTimelineData(config.filters);
            break;
        }
      }

      return {
        success: true,
        report: results,
        generated_at: new Date(),
      };
    } catch (error) {
      console.error('[Analytics] Error generating custom report:', error);
      throw new Error('Failed to generate custom report');
    }
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();
