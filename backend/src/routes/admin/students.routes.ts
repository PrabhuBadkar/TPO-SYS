import { Router, Request, Response } from 'express';
import { prisma } from '../../server';
import { authenticate } from '../../middleware/auth';

const router = Router();

// =====================================================
// GET /api/internal/admin/students/department-stats
// Description: Get department-wise student statistics
// =====================================================

router.get('/department-stats', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    // Check if user is TPO Admin
    if (req.user?.role !== 'ROLE_TPO_ADMIN') {
      res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'Only TPO Admins can access this resource',
      });
      return;
    }

    // Define all possible departments (matching registration form)
    const allDepartments = [
      'CSE',  // Computer Science Engineering
      'ECE',  // Electronics and Communication Engineering
      'ME',   // Mechanical Engineering
      'CE',   // Civil Engineering
      'IT',   // Information Technology
      'EE',   // Electrical Engineering
      'Others'
    ];

    // Get department-wise count from database
    const departmentStats = await prisma.studentProfile.groupBy({
      by: ['department'],
      where: {
        deleted_at: null,
      },
      _count: {
        id: true,
      },
    });

    // Create a map of actual counts
    const countsMap = new Map(
      departmentStats.map((dept) => [dept.department, dept._count.id])
    );

    // Merge all departments with actual counts (0 if not found)
    const departments = allDepartments.map((deptName) => ({
      name: deptName,
      count: countsMap.get(deptName) || 0,
    }));

    // Sort by count (descending), then by name (ascending)
    departments.sort((a, b) => {
      if (b.count !== a.count) {
        return b.count - a.count;
      }
      return a.name.localeCompare(b.name);
    });

    // Calculate total
    const total = departments.reduce((sum, dept) => sum + dept.count, 0);

    res.json({
      success: true,
      data: {
        departments,
        total,
      },
    });
  } catch (error) {
    console.error('Department stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch department stats',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
