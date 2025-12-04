import { Router, Request, Response } from 'express';
import { prisma } from '../server';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// =====================================================
// GET /api/internal/admin/recruiters/test
// Description: Test endpoint to check database
// =====================================================

router.get('/test', async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('TEST: Checking database connection...');
    
    const count = await prisma.organization.count();
    console.log('TEST: Total organizations in database:', count);
    
    const orgs = await prisma.organization.findMany({
      take: 5,
      orderBy: { created_at: 'desc' },
    });
    
    console.log('TEST: Recent organizations:', orgs.map(o => ({
      id: o.id,
      name: o.org_name,
      status: o.recruiter_status,
      created: o.created_at,
    })));
    
    res.json({
      success: true,
      count,
      organizations: orgs,
    });
  } catch (error) {
    console.error('TEST: Database error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// =====================================================
// GET /api/internal/admin/recruiters/all
// Description: Get all recruiters with filters
// NOTE: This must come BEFORE /:id route
// =====================================================

router.get('/all', authenticate, authorize('ROLE_TPO_ADMIN'), async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    console.log('User accessing /all endpoint:', { id: user?.id, email: user?.email, role: user?.role });
    
    const { status } = req.query;

    const where: any = {};
    if (status) {
      where.recruiter_status = status;
    }

    console.log('Fetching recruiters with filter:', where);

    const organizations = await prisma.organization.findMany({
      where,
      include: {
        pocs: {
          where: { is_primary: true },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    console.log(`Found ${organizations.length} organizations`);

    res.json({
      success: true,
      data: organizations,
    });
  } catch (error) {
    console.error('Fetch recruiters error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recruiters',
    });
  }
});

// =====================================================
// GET /api/internal/admin/recruiters/pending
// Description: Get all pending recruiter registrations
// =====================================================

router.get('/pending', authenticate, authorize('ROLE_TPO_ADMIN'), async (req: Request, res: Response): Promise<void> => {
  try {
    const organizations = await prisma.organization.findMany({
      where: {
        recruiter_status: 'PENDING_VERIFICATION',
      },
      include: {
        pocs: {
          where: { is_primary: true },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    res.json({
      success: true,
      data: organizations,
    });
  } catch (error) {
    console.error('Fetch pending recruiters error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pending recruiters',
    });
  }
});

// =====================================================
// GET /api/internal/admin/recruiters/:id
// Description: Get recruiter details
// =====================================================

router.get('/:id', authenticate, authorize('ROLE_TPO_ADMIN'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const organization = await prisma.organization.findUnique({
      where: { id },
      include: {
        pocs: true,
      },
    });

    if (!organization) {
      res.status(404).json({
        success: false,
        error: 'Organization not found',
      });
      return;
    }

    res.json({
      success: true,
      data: organization,
    });
  } catch (error) {
    console.error('Fetch recruiter details error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recruiter details',
    });
  }
});

// =====================================================
// PUT /api/internal/admin/recruiters/:id/approve
// Description: Approve recruiter registration
// =====================================================

router.put('/:id/approve', authenticate, authorize('ROLE_TPO_ADMIN'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const adminId = req.user?.id;

    // Update organization status
    const organization = await prisma.organization.update({
      where: { id },
      data: {
        recruiter_status: 'VERIFIED',
        verified_at: new Date(),
        verified_by: adminId,
        rejection_reason: null,
      },
      include: {
        pocs: true,
      },
    });

    // Enable all POCs for this organization
    await prisma.pOC.updateMany({
      where: { org_id: id },
      data: { is_active: true },
    });

    // Enable user accounts for all POCs
    const pocUserIds = organization.pocs.map(poc => poc.user_id);
    await prisma.user.updateMany({
      where: { id: { in: pocUserIds } },
      data: { is_active: true },
    });

    // TODO: Send approval email to recruiter

    res.json({
      success: true,
      message: 'Recruiter approved successfully',
      data: organization,
    });
  } catch (error) {
    console.error('Approve recruiter error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to approve recruiter',
    });
  }
});

// =====================================================
// PUT /api/internal/admin/recruiters/:id/reject
// Description: Reject recruiter registration
// =====================================================

router.put('/:id/reject', authenticate, authorize('ROLE_TPO_ADMIN'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { rejection_reason } = req.body;

    if (!rejection_reason) {
      res.status(400).json({
        success: false,
        error: 'Rejection reason is required',
      });
      return;
    }

    const organization = await prisma.organization.update({
      where: { id },
      data: {
        recruiter_status: 'REJECTED',
        rejection_reason,
      },
    });

    // TODO: Send rejection email to recruiter

    res.json({
      success: true,
      message: 'Recruiter rejected successfully',
      data: organization,
    });
  } catch (error) {
    console.error('Reject recruiter error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reject recruiter',
    });
  }
});

// =====================================================
// PUT /api/internal/admin/recruiters/:id/request-info
// Description: Request more information from recruiter
// =====================================================

router.put('/:id/request-info', authenticate, authorize(['ROLE_TPO_ADMIN']), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    if (!message) {
      res.status(400).json({
        success: false,
        error: 'Message is required',
      });
      return;
    }

    const organization = await prisma.organization.update({
      where: { id },
      data: {
        recruiter_status: 'INFO_REQUESTED',
        rejection_reason: message, // Reusing this field for info request message
      },
    });

    // TODO: Send info request email to recruiter

    res.json({
      success: true,
      message: 'Information request sent successfully',
      data: organization,
    });
  } catch (error) {
    console.error('Request info error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to request information',
    });
  }
});

export default router;
