// Offer Routes - Extend and Manage Job Offers
import express from 'express';
import { OfferService } from '../../services/recruiter/offerService';
import { authenticateToken } from '../../middleware/auth';

const router = express.Router();

/**
 * POST /api/public/recruiters/offers/create
 * Extend job offer
 */
router.post('/create', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const result = await OfferService.extendOffer(userId, req.body);
    res.status(201).json(result);
  } catch (error: any) {
    console.error('Extend offer error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to extend offer'
    });
  }
});

/**
 * GET /api/public/recruiters/offers/list
 * Get all offers
 */
router.get('/list', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const filters = {
      job_posting_id: req.query.job_posting_id as string,
      status: req.query.status as string,
      date_from: req.query.date_from ? new Date(req.query.date_from as string) : undefined,
      date_to: req.query.date_to ? new Date(req.query.date_to as string) : undefined
    };

    const result = await OfferService.getOffers(userId, filters);
    res.json(result);
  } catch (error: any) {
    console.error('Get offers error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to get offers'
    });
  }
});

/**
 * GET /api/public/recruiters/offers/:id
 * Get offer details
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const { id } = req.params;
    const result = await OfferService.getOfferDetails(userId, id);
    res.json(result);
  } catch (error: any) {
    console.error('Get offer details error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to get offer details'
    });
  }
});

/**
 * PUT /api/public/recruiters/offers/:id/extend-deadline
 * Extend offer deadline
 */
router.put('/:id/extend-deadline', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const { id } = req.params;
    const { new_expiry } = req.body;

    if (!new_expiry) {
      return res.status(400).json({
        success: false,
        message: 'New expiry date is required'
      });
    }

    const result = await OfferService.extendOfferDeadline(userId, id, new Date(new_expiry));
    res.json(result);
  } catch (error: any) {
    console.error('Extend offer deadline error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to extend offer deadline'
    });
  }
});

/**
 * PUT /api/public/recruiters/offers/:id/rescind
 * Rescind offer
 */
router.put('/:id/rescind', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Rescind reason is required'
      });
    }

    const result = await OfferService.rescindOffer(userId, id, reason);
    res.json(result);
  } catch (error: any) {
    console.error('Rescind offer error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to rescind offer'
    });
  }
});

/**
 * GET /api/public/recruiters/offers/stats/summary
 * Get offer statistics
 */
router.get('/stats/summary', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const jobPostingId = req.query.job_posting_id as string;
    const result = await OfferService.getOfferStats(userId, jobPostingId);
    res.json(result);
  } catch (error: any) {
    console.error('Get offer stats error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to get offer statistics'
    });
  }
});

export default router;
