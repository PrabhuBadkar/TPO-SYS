/**
 * TPO Admin Approval Routes
 * 4-eyes approval workflow for sensitive actions (K1.2)
 * BR-A2: Blacklisting requires 4-eyes approval
 * BR-A13: Overrides require 4-eyes approval
 */

import { Router, Request, Response } from 'express'
import { authenticate, authorize, ROLES } from '../middleware/auth'
import { ApprovalService } from '../services/admin/approvalService'
import { logAudit, AUDIT_ACTIONS, RESOURCE_TYPES, extractRequestMetadata } from '../utils/audit'
import { z } from 'zod'

const router = Router()

// All approval routes require TPO Admin authentication
router.use(authenticate)
router.use(authorize(ROLES.TPO_ADMIN))

// =====================================================
// POST /api/tpo-admin/approvals/blacklist-org
// Description: Request organization blacklist (requires 4-eyes)
// BR-A2: Blacklisting requires 4-eyes approval
// =====================================================

const blacklistOrgSchema = z.object({
  organizationId: z.string().uuid(),
  reason: z.string().min(20, 'Reason must be at least 20 characters'),
})

router.post('/blacklist-org', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' })
      return
    }

    const validatedData = blacklistOrgSchema.parse(req.body)
    const { organizationId, reason } = validatedData

    const result = await ApprovalService.requestBlacklistOrganization(
      req.user.id,
      organizationId,
      reason
    )

    res.json(result)
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      })
      return
    }

    console.error('Blacklist org request error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to create blacklist request',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

// =====================================================
// POST /api/tpo-admin/approvals/override-profile
// Description: Request profile verification override (requires 4-eyes)
// BR-A18: Admin can override dept verification with justification
// =====================================================

const overrideProfileSchema = z.object({
  studentId: z.string().uuid(),
  action: z.enum(['APPROVE', 'HOLD', 'REJECT']),
  justification: z.string().min(20, 'Justification must be at least 20 characters'),
})

router.post('/override-profile', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' })
      return
    }

    const validatedData = overrideProfileSchema.parse(req.body)
    const { studentId, action, justification } = validatedData

    const result = await ApprovalService.requestProfileVerificationOverride(
      req.user.id,
      studentId,
      action,
      justification
    )

    res.json(result)
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      })
      return
    }

    console.error('Override profile request error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to create override request',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

// =====================================================
// POST /api/tpo-admin/approvals/override-application
// Description: Request application decision override (requires 4-eyes)
// BR-A13: Admin can override dept decisions with justification
// =====================================================

const overrideApplicationSchema = z.object({
  applicationId: z.string().uuid(),
  action: z.enum(['APPROVE', 'REJECT']),
  justification: z.string().min(20, 'Justification must be at least 20 characters'),
})

router.post('/override-application', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' })
      return
    }

    const validatedData = overrideApplicationSchema.parse(req.body)
    const { applicationId, action, justification } = validatedData

    const result = await ApprovalService.requestApplicationDecisionOverride(
      req.user.id,
      applicationId,
      action,
      justification
    )

    res.json(result)
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      })
      return
    }

    console.error('Override application request error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to create override request',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

// =====================================================
// GET /api/tpo-admin/approvals
// Description: List approval requests
// =====================================================

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, requestType, page = '1', limit = '20' } = req.query

    const result = await ApprovalService.listApprovalRequests({
      status: status as any,
      requestType: requestType as any,
      page: parseInt(page as string),
      limit: parseInt(limit as string),
    })

    res.json(result)
  } catch (error) {
    console.error('List approvals error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to list approval requests',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

// =====================================================
// POST /api/tpo-admin/approvals/:id/decide
// Description: Approve or reject approval request (second admin)
// K1.2: Second admin must be different from initiator
// =====================================================

const decideApprovalSchema = z.object({
  decision: z.enum(['APPROVE', 'REJECT']),
  notes: z.string().optional(),
})

router.post('/:id/decide', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' })
      return
    }

    const validatedData = decideApprovalSchema.parse(req.body)
    const { decision, notes } = validatedData

    // TODO: Validate that approver !== initiator
    // This would be done in the service layer with actual DB lookup

    const result = await ApprovalService.decideApprovalRequest({
      approvalId: req.params.id,
      approverId: req.user.id,
      decision,
      notes,
    })

    res.json(result)
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      })
      return
    }

    console.error('Decide approval error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to decide approval request',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

export default router
