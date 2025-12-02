/**
 * Approval Routes
 * 4-eyes approval workflow endpoints
 */

import { Router, Request, Response } from 'express';
import { approvalService } from '../services/approval.service';

const router = Router();

/**
 * INTERNAL ROUTES (TPO Admin/Dept Coordinator)
 */

/**
 * POST /api/internal/admin/approvals/create
 * Create approval request
 */
router.post('/internal/admin/approvals/create', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || 'test-user-id';
    
    const result = await approvalService.createApprovalRequest({
      ...req.body,
      initiator_id: userId,
    });

    res.status(201).json(result);
  } catch (error: any) {
    console.error('[Approval] Error creating request:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to create approval request',
    });
  }
});

/**
 * GET /api/internal/admin/approvals/pending
 * Get pending approvals
 */
router.get('/internal/admin/approvals/pending', async (req: Request, res: Response) => {
  try {
    const filters: any = {};
    
    if (req.query.request_type) {
      filters.request_type = req.query.request_type;
    }
    
    if (req.query.initiator_id) {
      filters.initiator_id = req.query.initiator_id;
    }

    const result = await approvalService.getPendingApprovals(filters);

    res.json(result);
  } catch (error: any) {
    console.error('[Approval] Error getting pending approvals:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get pending approvals',
    });
  }
});

/**
 * PUT /api/internal/admin/approvals/:id/approve
 * Approve request
 */
router.put('/internal/admin/approvals/:id/approve', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id || 'test-approver-id';
    const { decision_notes } = req.body;

    const result = await approvalService.approveRequest(id, userId, decision_notes);

    res.json(result);
  } catch (error: any) {
    console.error('[Approval] Error approving request:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to approve request',
    });
  }
});

/**
 * PUT /api/internal/admin/approvals/:id/reject
 * Reject request
 */
router.put('/internal/admin/approvals/:id/reject', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id || 'test-approver-id';
    const { decision_notes } = req.body;

    if (!decision_notes) {
      return res.status(400).json({
        success: false,
        error: 'Decision notes are required for rejection',
      });
    }

    const result = await approvalService.rejectRequest(id, userId, decision_notes);

    res.json(result);
  } catch (error: any) {
    console.error('[Approval] Error rejecting request:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to reject request',
    });
  }
});

/**
 * GET /api/internal/admin/approvals/history
 * Get approval history
 */
router.get('/internal/admin/approvals/history', async (req: Request, res: Response) => {
  try {
    const filters: any = {};
    
    if (req.query.request_type) {
      filters.request_type = req.query.request_type;
    }
    
    if (req.query.status) {
      filters.status = req.query.status;
    }
    
    if (req.query.start_date) {
      filters.start_date = new Date(req.query.start_date as string);
    }
    
    if (req.query.end_date) {
      filters.end_date = new Date(req.query.end_date as string);
    }

    const result = await approvalService.getApprovalHistory(filters);

    res.json(result);
  } catch (error: any) {
    console.error('[Approval] Error getting history:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get approval history',
    });
  }
});

/**
 * GET /api/internal/admin/approvals/statistics
 * Get approval statistics
 */
router.get('/internal/admin/approvals/statistics', async (req: Request, res: Response) => {
  try {
    const filters: any = {};
    
    if (req.query.start_date) {
      filters.start_date = new Date(req.query.start_date as string);
    }
    
    if (req.query.end_date) {
      filters.end_date = new Date(req.query.end_date as string);
    }

    const result = await approvalService.getStatistics(filters);

    res.json(result);
  } catch (error: any) {
    console.error('[Approval] Error getting statistics:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get approval statistics',
    });
  }
});

export default router;
