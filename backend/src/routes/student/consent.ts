import { Router, Request, Response } from 'express';
import { consentService } from '../../services/student/consentService';
import { authenticateToken, authorizeRole } from '../../middleware/auth';
import { z } from 'zod';

const router = Router();

// Validation schemas
const createConsentSchema = z.object({
  job_posting_id: z.string().optional(),
  recruiter_id: z.string().optional(),
  consent_type: z.enum(['APPLICATION', 'RESUME_BOOK', 'PROFILE_SHARING']),
  consent_text: z.string().min(10),
  data_shared: z.array(z.string()).min(1)
});

const revokeConsentSchema = z.object({
  reason: z.string().optional()
});

/**
 * POST /api/public/consents/create
 * Create a new consent
 */
router.post('/create', authenticateToken, authorizeRole('ROLE_STUDENT'), async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const validatedData = createConsentSchema.parse(req.body);
    
    const consent = await consentService.createConsent({
      student_id: req.user.id,
      ...validatedData,
      ip_address: req.ip,
      user_agent: req.get('user-agent')
    });

    res.status(201).json({
      success: true,
      message: 'Consent created successfully',
      data: consent
    });
  } catch (error: any) {
    console.error('Create consent error:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to create consent'
    });
  }
});

/**
 * GET /api/public/consents/list
 * Get all consents for current student
 */
router.get('/list', authenticateToken, authorizeRole('ROLE_STUDENT'), async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const consents = await consentService.getConsents(req.user.id);

    res.json({
      success: true,
      data: consents
    });
  } catch (error: any) {
    console.error('Get consents error:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to get consents'
    });
  }
});

/**
 * GET /api/public/consents/active
 * Get active consents only
 */
router.get('/active', authenticateToken, authorizeRole('ROLE_STUDENT'), async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const consents = await consentService.getActiveConsents(req.user.id);

    res.json({
      success: true,
      data: consents
    });
  } catch (error: any) {
    console.error('Get active consents error:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to get active consents'
    });
  }
});

/**
 * DELETE /api/public/consents/:id/revoke
 * Revoke a consent
 */
router.delete('/:id/revoke', authenticateToken, authorizeRole('ROLE_STUDENT'), async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const { reason } = req.body;
    const consent = await consentService.revokeConsent(req.user.id, req.params.id, reason);

    res.json({
      success: true,
      message: 'Consent revoked successfully',
      data: consent
    });
  } catch (error: any) {
    console.error('Revoke consent error:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to revoke consent'
    });
  }
});

/**
 * GET /api/public/consents/stats
 * Get consent statistics
 */
router.get('/stats', authenticateToken, authorizeRole('ROLE_STUDENT'), async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const stats = await consentService.getConsentStats(req.user.id);

    res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    console.error('Get consent stats error:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to get consent stats'
    });
  }
});

/**
 * GET /api/public/consents/check/:jobId
 * Check if consent exists for a job
 */
router.get('/check/:jobId', authenticateToken, authorizeRole('ROLE_STUDENT'), async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const hasConsent = await consentService.hasConsentForJob(req.user.id, req.params.jobId);

    res.json({
      success: true,
      data: { hasConsent }
    });
  } catch (error: any) {
    console.error('Check consent error:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to check consent'
    });
  }
});

export default router;
