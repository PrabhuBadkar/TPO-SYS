/**
 * Recruiter Analytics Routes
 * Dashboard statistics and analytics for recruiters
 */

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/public/recruiters/analytics/dashboard
 * Get dashboard statistics
 */
router.get('/public/recruiters/analytics/dashboard', async (req: Request, res: Response) => {
  try {
    const recruiterId = (req as any).user?.id || 'test-recruiter-id';

    // Get organization for recruiter
    const organization = await prisma.organization.findFirst({
      where: { created_by: recruiterId },
    });

    if (!organization) {
      return res.json({
        success: true,
        stats: {
          active_jobs: 0,
          total_applications: 0,
          pending_applications: 0,
          shortlisted: 0,
          offers_sent: 0,
          offers_accepted: 0,
          profile_views: 0,
          avg_time_to_hire: 0,
        },
      });
    }

    // Get statistics
    const [activeJobs, applications, offers] = await Promise.all([
      prisma.jobPosting.count({
        where: {
          organization_id: organization.id,
          status: 'approved',
          application_deadline: { gte: new Date() },
        },
      }),
      prisma.application.findMany({
        where: {
          job: { organization_id: organization.id },
        },
        select: { status: true },
      }),
      prisma.offer.findMany({
        where: {
          job: { organization_id: organization.id },
        },
        select: { status: true },
      }),
    ]);

    const stats = {
      active_jobs: activeJobs,
      total_applications: applications.length,
      pending_applications: applications.filter(a => a.status === 'pending').length,
      shortlisted: applications.filter(a => a.status === 'shortlisted').length,
      offers_sent: offers.length,
      offers_accepted: offers.filter(o => o.status === 'accepted').length,
      profile_views: Math.floor(Math.random() * 1000), // TODO: Implement actual tracking
      avg_time_to_hire: 30, // TODO: Calculate from actual data
    };

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('[RecruiterAnalytics] Error getting dashboard stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get dashboard statistics',
    });
  }
});

/**
 * GET /api/public/recruiters/analytics/recent-activity
 * Get recent activity
 */
router.get('/public/recruiters/analytics/recent-activity', async (req: Request, res: Response) => {
  try {
    const recruiterId = (req as any).user?.id || 'test-recruiter-id';

    const organization = await prisma.organization.findFirst({
      where: { created_by: recruiterId },
    });

    if (!organization) {
      return res.json({
        success: true,
        activities: [],
      });
    }

    // Get recent applications
    const recentApplications = await prisma.application.findMany({
      where: {
        job: { organization_id: organization.id },
      },
      orderBy: { applied_at: 'desc' },
      take: 10,
      include: {
        student: {
          select: {
            studentProfile: {
              select: { full_name: true },
            },
          },
        },
        job: {
          select: { title: true },
        },
      },
    });

    const activities = recentApplications.map(app => ({
      id: app.id,
      type: 'application',
      message: `New application from ${app.student.studentProfile?.full_name} for ${app.job.title}`,
      timestamp: app.applied_at,
    }));

    res.json({
      success: true,
      activities,
    });
  } catch (error) {
    console.error('[RecruiterAnalytics] Error getting recent activity:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get recent activity',
    });
  }
});

/**
 * GET /api/public/recruiters/analytics/job-stats/:jobId
 * Get statistics for a specific job
 */
router.get('/public/recruiters/analytics/job-stats/:jobId', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;

    const [applications, views] = await Promise.all([
      prisma.application.findMany({
        where: { job_id: jobId },
        select: { status: true },
      }),
      prisma.jobPosting.findUnique({
        where: { id: jobId },
        select: { views_count: true },
      }),
    ]);

    const stats = {
      total_applications: applications.length,
      pending: applications.filter(a => a.status === 'pending').length,
      under_review: applications.filter(a => a.status === 'under_review').length,
      shortlisted: applications.filter(a => a.status === 'shortlisted').length,
      rejected: applications.filter(a => a.status === 'rejected').length,
      selected: applications.filter(a => a.status === 'selected').length,
      views: views?.views_count || 0,
    };

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('[RecruiterAnalytics] Error getting job stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get job statistics',
    });
  }
});

export default router;
