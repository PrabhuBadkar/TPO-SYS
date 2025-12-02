import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class DashboardService {
  async getDashboard(studentId: string) {
    const profile = await prisma.studentProfile.findUnique({
      where: { user_id: studentId },
    });

    if (!profile) {
      throw new Error('Student profile not found');
    }

    const [totalApplications, pendingApplications, shortlistedApplications] = await Promise.all([
      prisma.application.count({ where: { student_id: profile.id } }),
      prisma.application.count({
        where: {
          student_id: profile.id,
          status: { in: ['SUBMITTED', 'PENDING_DEPT_REVIEW', 'PENDING_ADMIN_REVIEW'] },
        },
      }),
      prisma.application.count({
        where: { student_id: profile.id, status: 'SHORTLISTED' },
      }),
    ]);

    const recentApplications = await prisma.application.findMany({
      where: { student_id: profile.id },
      include: {
        jobPosting: {
          include: {
            organization: { select: { organization_name: true } },
          },
        },
      },
      orderBy: { submitted_at: 'desc' },
      take: 5,
    });

    return {
      profile: {
        firstName: profile.first_name,
        lastName: profile.last_name,
        enrollmentNumber: profile.enrollment_number,
        department: profile.department,
        cgpi: profile.cgpi,
        profileCompletePercent: profile.profile_complete_percent,
        tpoDeptVerified: profile.tpo_dept_verified,
      },
      stats: {
        applications: {
          total: totalApplications,
          pending: pendingApplications,
          shortlisted: shortlistedApplications,
        },
      },
      recentApplications,
    };
  }
}

export const dashboardService = new DashboardService();
