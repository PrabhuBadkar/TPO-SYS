// Organization Routes - Recruiter Registration and Management
import express from 'express';
import { OrganizationService } from '../../services/recruiter/organizationService';
import { authenticateToken } from '../../middleware/auth';

const router = express.Router();

/**
 * POST /api/public/recruiters/register
 * Register a new organization with POC
 */
router.post('/register', async (req, res) => {
  try {
    const result = await OrganizationService.registerOrganization(req.body);
    res.status(201).json(result);
  } catch (error: any) {
    console.error('Organization registration error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to register organization'
    });
  }
});

/**
 * GET /api/public/recruiters/status
 * Get organization verification status
 */
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const result = await OrganizationService.getVerificationStatus(userId);
    res.json(result);
  } catch (error: any) {
    console.error('Get verification status error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to get verification status'
    });
  }
});

/**
 * PUT /api/public/recruiters/update
 * Update organization details
 */
router.put('/update', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const result = await OrganizationService.updateOrganization(userId, req.body);
    res.json(result);
  } catch (error: any) {
    console.error('Update organization error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update organization'
    });
  }
});

/**
 * GET /api/public/recruiters/details
 * Get organization details
 */
router.get('/details', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const result = await OrganizationService.getOrganizationDetails(userId);
    res.json(result);
  } catch (error: any) {
    console.error('Get organization details error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to get organization details'
    });
  }
});

/**
 * POST /api/public/recruiters/pocs/add
 * Request additional POC
 */
router.post('/pocs/add', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const result = await OrganizationService.requestAdditionalPOC(userId, req.body);
    res.status(201).json(result);
  } catch (error: any) {
    console.error('Add additional POC error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to add additional POC'
    });
  }
});

/**
 * GET /api/public/recruiters/pocs
 * Get all POCs for organization
 */
router.get('/pocs', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const result = await OrganizationService.getOrganizationPOCs(userId);
    res.json(result);
  } catch (error: any) {
    console.error('Get organization POCs error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to get organization POCs'
    });
  }
});

export default router;
