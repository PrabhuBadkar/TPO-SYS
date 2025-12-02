import { Router, Request, Response } from 'express';
import { prisma } from '../server';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// =====================================================
// COMMUNICATION MANAGEMENT ENDPOINTS
// =====================================================

// GET /api/internal/admin/communications
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { type, status, startDate, endDate } = req.query;

    const where: any = {};

    // Filter by type
    if (type) {
      where.communication_type = type;
    }

    // Filter by status
    if (status) {
      where.status = status;
    }

    // Filter by date range
    if (startDate && endDate) {
      where.sent_at = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    }

    const communications = await prisma.communicationLog.findMany({
      where,
      orderBy: {
        created_at: 'desc',
      },
      include: {
        sentBy: {
          select: {
            email: true,
          },
        },
      },
    });

    const formatted = communications.map((comm) => ({
      id: comm.id,
      subject: comm.subject,
      message: comm.message,
      communicationType: comm.communication_type,
      channels: comm.channels,
      targetAudience: comm.target_audience,
      recipientCount: comm.recipient_count,
      status: comm.status,
      sentAt: comm.sent_at?.toISOString(),
      sentBy: comm.sent_by,
      sentByEmail: comm.sentBy?.email,
      deliveryStats: comm.delivery_stats,
      createdAt: comm.created_at.toISOString(),
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Error fetching communications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch communications',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/internal/admin/communications/:id
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const communication = await prisma.communicationLog.findUnique({
      where: { id },
      include: {
        sentBy: {
          select: {
            email: true,
          },
        },
      },
    });

    if (!communication) {
      res.status(404).json({
        success: false,
        error: 'Communication not found',
      });
      return;
    }

    res.json({
      id: communication.id,
      subject: communication.subject,
      message: communication.message,
      communicationType: communication.communication_type,
      channels: communication.channels,
      targetAudience: communication.target_audience,
      recipientCount: communication.recipient_count,
      status: communication.status,
      sentAt: communication.sent_at?.toISOString(),
      sentBy: communication.sent_by,
      sentByEmail: communication.sentBy?.email,
      deliveryStats: communication.delivery_stats,
      createdAt: communication.created_at.toISOString(),
    });
  } catch (error) {
    console.error('Error fetching communication details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch communication details',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// POST /api/internal/admin/communications/send
router.post('/send', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      subject,
      message,
      communicationType,
      channels,
      targetAudience,
      scheduleFor,
    } = req.body;

    const userId = (req as any).user?.id;

    if (!subject || !message || !communicationType || !channels || !targetAudience) {
      res.status(400).json({
        success: false,
        error: 'Subject, message, type, channels, and target audience are required',
      });
      return;
    }

    // Calculate recipient count based on target audience
    let recipientCount = 0;
    
    if (targetAudience.includes('ALL_STUDENTS')) {
      recipientCount += await prisma.studentProfile.count();
    }
    
    if (targetAudience.includes('ALL_RECRUITERS')) {
      recipientCount += await prisma.organization.count({
        where: { recruiter_status: 'VERIFIED' },
      });
    }

    const communication = await prisma.communicationLog.create({
      data: {
        subject,
        message,
        communication_type: communicationType,
        channels: channels,
        target_audience: targetAudience,
        recipient_count: recipientCount,
        status: scheduleFor ? 'SCHEDULED' : 'SENT',
        sent_at: scheduleFor ? new Date(scheduleFor) : new Date(),
        sent_by: userId,
        delivery_stats: {
          sent: 0,
          delivered: 0,
          failed: 0,
          opened: 0,
        },
      },
    });

    // TODO: Send actual emails/SMS/push notifications
    // TODO: Queue for scheduled sending
    // TODO: Track delivery status
    // TODO: Create audit log entry

    res.status(201).json({
      success: true,
      message: scheduleFor ? 'Communication scheduled successfully' : 'Communication sent successfully',
      communicationId: communication.id,
    });
  } catch (error) {
    console.error('Error sending communication:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send communication',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/internal/admin/communications/templates
router.get('/templates/list', async (req: Request, res: Response): Promise<void> => {
  try {
    const templates = await prisma.communicationTemplate.findMany({
      orderBy: {
        created_at: 'desc',
      },
      include: {
        createdBy: {
          select: {
            email: true,
          },
        },
      },
    });

    const formatted = templates.map((template) => ({
      id: template.id,
      name: template.name,
      subject: template.subject,
      body: template.body,
      templateType: template.template_type,
      variables: template.variables,
      isActive: template.is_active,
      createdBy: template.created_by,
      createdByEmail: template.createdBy?.email,
      createdAt: template.created_at.toISOString(),
      updatedAt: template.updated_at.toISOString(),
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch templates',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// POST /api/internal/admin/communications/templates
router.post('/templates', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, subject, body, templateType, variables } = req.body;
    const userId = (req as any).user?.id;

    if (!name || !subject || !body || !templateType) {
      res.status(400).json({
        success: false,
        error: 'Name, subject, body, and template type are required',
      });
      return;
    }

    const template = await prisma.communicationTemplate.create({
      data: {
        name,
        subject,
        body,
        template_type: templateType,
        variables: variables || [],
        is_active: true,
        created_by: userId,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Template created successfully',
      templateId: template.id,
    });
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create template',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/internal/admin/communications/stats
router.get('/stats/overview', async (req: Request, res: Response): Promise<void> => {
  try {
    const totalCommunications = await prisma.communicationLog.count();
    
    const sentToday = await prisma.communicationLog.count({
      where: {
        sent_at: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    });

    const scheduled = await prisma.communicationLog.count({
      where: {
        status: 'SCHEDULED',
      },
    });

    const templates = await prisma.communicationTemplate.count({
      where: {
        is_active: true,
      },
    });

    const byType = await prisma.communicationLog.groupBy({
      by: ['communication_type'],
      _count: {
        id: true,
      },
    });

    res.json({
      totalCommunications,
      sentToday,
      scheduled,
      activeTemplates: templates,
      byType: byType.map(t => ({
        type: t.communication_type,
        count: t._count.id,
      })),
    });
  } catch (error) {
    console.error('Error fetching communication stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch communication stats',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
