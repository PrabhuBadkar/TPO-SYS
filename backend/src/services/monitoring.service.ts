/**
 * Monitoring Service
 * Health checks, performance monitoring, and system metrics
 */

import { PrismaClient } from '@prisma/client';
import os from 'os';

const prisma = new PrismaClient();

interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: Record<string, any>;
  timestamp: string;
}

interface PerformanceMetrics {
  response_time_avg: number;
  requests_per_minute: number;
  error_rate: number;
  cpu_usage: number;
  memory_usage: number;
}

/**
 * Monitoring Service
 */
export class MonitoringService {
  private requestTimes: number[] = [];
  private requestCount: number = 0;
  private errorCount: number = 0;
  private startTime: number = Date.now();

  /**
   * Health check
   */
  async healthCheck(): Promise<HealthCheck> {
    const checks: Record<string, any> = {};

    // Database check
    try {
      await prisma.$queryRaw`SELECT 1`;
      checks.database = { status: 'healthy', message: 'Connected' };
    } catch (error) {
      checks.database = { status: 'unhealthy', message: 'Connection failed' };
    }

    // Memory check
    const memoryUsage = process.memoryUsage();
    const memoryPercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
    checks.memory = {
      status: memoryPercent < 80 ? 'healthy' : memoryPercent < 90 ? 'degraded' : 'unhealthy',
      usage_percent: Math.round(memoryPercent),
      heap_used: `${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
      heap_total: `${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
    };

    // CPU check
    const cpuUsage = process.cpuUsage();
    const cpuPercent = ((cpuUsage.user + cpuUsage.system) / 1000000) / os.cpus().length;
    checks.cpu = {
      status: cpuPercent < 70 ? 'healthy' : cpuPercent < 85 ? 'degraded' : 'unhealthy',
      usage_percent: Math.round(cpuPercent),
      cores: os.cpus().length,
    };

    // Uptime check
    const uptime = Date.now() - this.startTime;
    checks.uptime = {
      status: 'healthy',
      uptime_ms: uptime,
      uptime_formatted: this.formatUptime(uptime),
    };

    // Determine overall status
    const statuses = Object.values(checks).map(c => c.status);
    const overallStatus = statuses.includes('unhealthy') 
      ? 'unhealthy' 
      : statuses.includes('degraded') 
      ? 'degraded' 
      : 'healthy';

    return {
      status: overallStatus,
      checks,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): PerformanceMetrics {
    const avgResponseTime = this.requestTimes.length > 0
      ? this.requestTimes.reduce((a, b) => a + b, 0) / this.requestTimes.length
      : 0;

    const uptime = (Date.now() - this.startTime) / 1000 / 60; // minutes
    const requestsPerMinute = uptime > 0 ? this.requestCount / uptime : 0;
    const errorRate = this.requestCount > 0 ? (this.errorCount / this.requestCount) * 100 : 0;

    const memoryUsage = process.memoryUsage();
    const memoryPercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;

    const cpuUsage = process.cpuUsage();
    const cpuPercent = ((cpuUsage.user + cpuUsage.system) / 1000000) / os.cpus().length;

    return {
      response_time_avg: Math.round(avgResponseTime),
      requests_per_minute: Math.round(requestsPerMinute * 100) / 100,
      error_rate: Math.round(errorRate * 100) / 100,
      cpu_usage: Math.round(cpuPercent),
      memory_usage: Math.round(memoryPercent),
    };
  }

  /**
   * Record request
   */
  recordRequest(responseTime: number, isError: boolean = false): void {
    this.requestTimes.push(responseTime);
    this.requestCount++;

    if (isError) {
      this.errorCount++;
    }

    // Keep only last 1000 requests
    if (this.requestTimes.length > 1000) {
      this.requestTimes.shift();
    }
  }

  /**
   * Get system info
   */
  getSystemInfo(): any {
    return {
      platform: os.platform(),
      arch: os.arch(),
      node_version: process.version,
      total_memory: `${(os.totalmem() / 1024 / 1024 / 1024).toFixed(2)} GB`,
      free_memory: `${(os.freemem() / 1024 / 1024 / 1024).toFixed(2)} GB`,
      cpu_count: os.cpus().length,
      cpu_model: os.cpus()[0]?.model || 'Unknown',
      hostname: os.hostname(),
      uptime: this.formatUptime(os.uptime() * 1000),
    };
  }

  /**
   * Get database statistics
   */
  async getDatabaseStats(): Promise<any> {
    try {
      const [userCount, jobCount, applicationCount, offerCount] = await Promise.all([
        prisma.user.count(),
        prisma.jobPosting.count(),
        prisma.application.count(),
        prisma.offer.count(),
      ]);

      return {
        total_users: userCount,
        total_jobs: jobCount,
        total_applications: applicationCount,
        total_offers: offerCount,
      };
    } catch (error) {
      console.error('[Monitoring] Error getting database stats:', error);
      return null;
    }
  }

  /**
   * Format uptime
   */
  private formatUptime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }

  /**
   * Log error
   */
  logError(error: Error, context?: Record<string, any>): void {
    console.error('[Error]', {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Get error statistics
   */
  getErrorStats(): any {
    return {
      total_requests: this.requestCount,
      total_errors: this.errorCount,
      error_rate: this.requestCount > 0 
        ? Math.round((this.errorCount / this.requestCount) * 100 * 100) / 100 
        : 0,
    };
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.requestTimes = [];
    this.requestCount = 0;
    this.errorCount = 0;
    this.startTime = Date.now();
  }
}

// Export singleton instance
export const monitoringService = new MonitoringService();
