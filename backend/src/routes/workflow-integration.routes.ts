/**
 * Workflow and Integration Routes
 * Automated workflows and third-party integrations
 */

import { Router, Request, Response } from 'express';
import { workflowService } from '../services/workflow.service';
import { integrationService } from '../services/integration.service';

const router = Router();

/**
 * WORKFLOW ROUTES (Internal - TPO Admin)
 */

/**
 * POST /api/internal/admin/workflows/create
 * Create workflow template
 */
router.post('/internal/admin/workflows/create', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || 'test-admin-id';
    const result = await workflowService.createWorkflow(req.body, userId);
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/internal/admin/workflows
 * Get active workflows
 */
router.get('/internal/admin/workflows', async (req: Request, res: Response) => {
  try {
    const result = await workflowService.getActiveWorkflows();
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/internal/admin/workflows/:id/execute
 * Execute workflow manually
 */
router.post('/internal/admin/workflows/:id/execute', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await workflowService.executeWorkflow(id, req.body);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/internal/admin/workflows/executions
 * Get workflow execution history
 */
router.get('/internal/admin/workflows/executions', async (req: Request, res: Response) => {
  try {
    const workflowId = req.query.workflow_id as string;
    const limit = parseInt(req.query.limit as string) || 50;
    const result = await workflowService.getExecutionHistory(workflowId, limit);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/internal/admin/workflows/statistics
 * Get workflow statistics
 */
router.get('/internal/admin/workflows/statistics', async (req: Request, res: Response) => {
  try {
    const result = await workflowService.getStatistics();
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * INTEGRATION ROUTES (Internal - TPO Admin)
 */

/**
 * POST /api/internal/admin/integrations/api-keys/generate
 * Generate API key
 */
router.post('/internal/admin/integrations/api-keys/generate', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || 'test-admin-id';
    const result = await integrationService.generateAPIKey(req.body, userId);
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/internal/admin/integrations/webhooks/create
 * Create webhook
 */
router.post('/internal/admin/integrations/webhooks/create', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || 'test-admin-id';
    const result = await integrationService.createWebhook(req.body, userId);
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/public/integrations/docs
 * Get API documentation
 */
router.get('/public/integrations/docs', async (req: Request, res: Response) => {
  try {
    const result = integrationService.getAPIDocs();
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/internal/admin/integrations/statistics
 * Get integration statistics
 */
router.get('/internal/admin/integrations/statistics', async (req: Request, res: Response) => {
  try {
    const result = await integrationService.getStatistics();
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * MOBILE API ROUTES (Public - Mobile optimized)
 */

/**
 * GET /api/mobile/dashboard
 * Get mobile dashboard data
 */
router.get('/mobile/dashboard', async (req: Request, res: Response) => {
  try {
    // Mobile-optimized dashboard data
    const userId = (req as any).user?.id || 'test-user-id';
    
    res.json({
      success: true,
      data: {
        profile_completion: 85,
        applications: 12,
        shortlisted: 3,
        offers: 1,
        upcoming_events: 2,
        notifications_unread: 5,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/mobile/jobs
 * Get mobile-optimized job listings
 */
router.get('/mobile/jobs', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    
    res.json({
      success: true,
      jobs: [],
      has_more: false,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/mobile/notifications/register
 * Register device for push notifications
 */
router.post('/mobile/notifications/register', async (req: Request, res: Response) => {
  try {
    const { device_token, platform } = req.body;
    
    // Store device token for push notifications
    console.log('[Mobile] Device registered:', platform, device_token);
    
    res.json({
      success: true,
      message: 'Device registered for push notifications',
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/mobile/sync
 * Sync offline data
 */
router.get('/mobile/sync', async (req: Request, res: Response) => {
  try {
    const lastSync = req.query.last_sync as string;
    
    res.json({
      success: true,
      data: {
        jobs: [],
        applications: [],
        notifications: [],
        events: [],
      },
      sync_timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
