/**
 * Production Routes
 * Health checks, monitoring, and production utilities
 */

import { Router, Request, Response } from 'express';
import { monitoringService } from '../services/monitoring.service';
import { cacheService } from '../services/cache.service';
import { securityService } from '../services/security.service';

const router = Router();

/**
 * PUBLIC ROUTES
 */

/**
 * GET /health
 * Health check endpoint
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const health = await monitoringService.healthCheck();
    
    const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503;
    
    res.status(statusCode).json(health);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: 'Health check failed',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /health/ready
 * Readiness probe
 */
router.get('/health/ready', async (req: Request, res: Response) => {
  try {
    const health = await monitoringService.healthCheck();
    
    if (health.status === 'unhealthy') {
      return res.status(503).json({ ready: false });
    }

    res.json({ ready: true });
  } catch (error) {
    res.status(503).json({ ready: false });
  }
});

/**
 * GET /health/live
 * Liveness probe
 */
router.get('/health/live', (req: Request, res: Response) => {
  res.json({ alive: true });
});

/**
 * INTERNAL ROUTES (Admin only)
 */

/**
 * GET /api/internal/admin/monitoring/metrics
 * Get performance metrics
 */
router.get('/api/internal/admin/monitoring/metrics', (req: Request, res: Response) => {
  try {
    const metrics = monitoringService.getPerformanceMetrics();
    
    res.json({
      success: true,
      metrics,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/internal/admin/monitoring/system
 * Get system information
 */
router.get('/api/internal/admin/monitoring/system', (req: Request, res: Response) => {
  try {
    const systemInfo = monitoringService.getSystemInfo();
    
    res.json({
      success: true,
      system: systemInfo,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/internal/admin/monitoring/database
 * Get database statistics
 */
router.get('/api/internal/admin/monitoring/database', async (req: Request, res: Response) => {
  try {
    const stats = await monitoringService.getDatabaseStats();
    
    res.json({
      success: true,
      stats,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/internal/admin/monitoring/cache
 * Get cache statistics
 */
router.get('/api/internal/admin/monitoring/cache', (req: Request, res: Response) => {
  try {
    const stats = cacheService.getStats();
    
    res.json({
      success: true,
      stats,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/internal/admin/monitoring/cache/clear
 * Clear cache
 */
router.post('/api/internal/admin/monitoring/cache/clear', (req: Request, res: Response) => {
  try {
    cacheService.clear();
    
    res.json({
      success: true,
      message: 'Cache cleared successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/internal/admin/monitoring/errors
 * Get error statistics
 */
router.get('/api/internal/admin/monitoring/errors', (req: Request, res: Response) => {
  try {
    const stats = monitoringService.getErrorStats();
    
    res.json({
      success: true,
      stats,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/internal/admin/security/audit
 * Security audit
 */
router.post('/api/internal/admin/security/audit', (req: Request, res: Response) => {
  try {
    const audit = securityService.securityAudit(req.body);
    
    res.json({
      success: true,
      audit,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/internal/admin/security/headers
 * Get security headers
 */
router.get('/api/internal/admin/security/headers', (req: Request, res: Response) => {
  try {
    const headers = securityService.getSecurityHeaders();
    
    res.json({
      success: true,
      headers,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
