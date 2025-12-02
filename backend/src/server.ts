import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { PrismaClient } from '@prisma/client';

// Load environment variables
dotenv.config();

// Initialize Prisma Client
export const prisma = new PrismaClient();

// Import routes
import authRoutes from './routes/auth.routes';
import studentProfileRoutes from './routes/student/profile';
import studentResumeRoutes from './routes/student/resume';
import studentConsentRoutes from './routes/student/consent';
import studentDocumentRoutes from './routes/student/document';
import studentApplicationRoutes from './routes/student/applications';
import studentJobRoutes from './routes/student/jobs';
import studentDashboardRoutes from './routes/student/dashboard';

// Recruiter routes
import recruiterOrganizationRoutes from './routes/recruiter/organization';
import recruiterJobRoutes from './routes/recruiter/jobs';
import recruiterApplicationRoutes from './routes/recruiter/applications';
import recruiterOfferRoutes from './routes/recruiter/offers';
import recruiterAnalyticsRoutes from './routes/recruiter/analytics';

// TPO Admin routes
import tpoAdminRoutes from './routes/tpo-admin.routes';
import tpoAdminApprovalsRoutes from './routes/tpo-admin-approvals.routes';
import tpoAdminJobsRoutes from './routes/tpo-admin-jobs.routes';
import tpoAdminApplicationsRoutes from './routes/tpo-admin-applications.routes';
import tpoAdminStudentsRoutes from './routes/tpo-admin-students.routes';
import tpoAdminCalendarRoutes from './routes/tpo-admin-calendar.routes';
import tpoAdminCommunicationsRoutes from './routes/tpo-admin-communications.routes';

// TPO Dept routes
import tpoDeptRoutes from './routes/tpo-dept.routes';

// Notification routes
import notificationRoutes from './routes/notifications.routes';

// Calendar routes
import calendarRoutes from './routes/calendar.routes';

// Audit routes
import auditRoutes from './routes/audit.routes';

// Recruiter analytics routes
import recruiterAnalyticsRoutes from './routes/recruiter-analytics.routes';

// Approval routes
import approvalRoutes from './routes/approval.routes';

// Reminder routes
import reminderRoutes from './routes/reminder.routes';

// Analytics routes
import analyticsRoutes from './routes/analytics.routes';

// Job matching routes
import jobMatchingRoutes from './routes/job-matching.routes';

// Workflow and integration routes
import workflowIntegrationRoutes from './routes/workflow-integration.routes';

// Production routes
import productionRoutes from './routes/production.routes';

// Services
import { securityService } from './services/security.service';
import { monitoringService } from './services/monitoring.service';

const app: Express = express();
const PORT = process.env.PORT || 5000;

// =====================================================
// Middleware
// =====================================================

// Security headers
app.use(helmet());

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security headers
app.use((req, res, next) => {
  const headers = securityService.getSecurityHeaders();
  Object.entries(headers).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
  next();
});

// Request monitoring
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const isError = res.statusCode >= 400;
    monitoringService.recordRequest(duration, isError);
  });
  
  next();
});

// Logging
app.use(morgan('dev'));

// Static files (for uploaded files)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// =====================================================
// Routes
// =====================================================

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API routes - Auth
app.use('/api/auth', authRoutes);

// API routes - Student
app.use('/api/public/profile', studentProfileRoutes);
app.use('/api/public/resume', studentResumeRoutes);
app.use('/api/public/consents', studentConsentRoutes);
app.use('/api/public/documents', studentDocumentRoutes);
app.use('/api/public/applications', studentApplicationRoutes);
app.use('/api/public/jobs', studentJobRoutes);
app.use('/api/public/dashboard', studentDashboardRoutes);

// API routes - Recruiter
app.use('/api/public/recruiters', recruiterOrganizationRoutes);
app.use('/api/public/recruiters/jobs', recruiterJobRoutes);
app.use('/api/public/recruiters/applications', recruiterApplicationRoutes);
app.use('/api/public/recruiters/offers', recruiterOfferRoutes);
app.use('/api/public/recruiters/analytics', recruiterAnalyticsRoutes);

// API routes - TPO Admin
app.use('/api/internal/admin', tpoAdminRoutes);
app.use('/api/internal/admin/job-postings', tpoAdminJobsRoutes);
app.use('/api/internal/admin/applications', tpoAdminApplicationsRoutes);
app.use('/api/internal/admin/students', tpoAdminStudentsRoutes);
app.use('/api/internal/admin/calendar', tpoAdminCalendarRoutes);
app.use('/api/internal/admin/communications', tpoAdminCommunicationsRoutes);
app.use('/api/tpo-admin', tpoAdminRoutes); // Legacy path
app.use('/api/tpo-admin/approvals', tpoAdminApprovalsRoutes);

// API routes - TPO Dept
app.use('/api/internal/dept', tpoDeptRoutes);

// API routes - Notifications
app.use('/api', notificationRoutes);

// API routes - Calendar
app.use('/api', calendarRoutes);

// API routes - Audit
app.use('/api', auditRoutes);

// API routes - Recruiter Analytics
app.use('/api', recruiterAnalyticsRoutes);

// API routes - Approval
app.use('/api', approvalRoutes);

// API routes - Reminder
app.use('/api', reminderRoutes);

// API routes - Analytics
app.use('/api', analyticsRoutes);

// API routes - Job Matching
app.use('/api', jobMatchingRoutes);

// API routes - Workflow and Integration
app.use('/api', workflowIntegrationRoutes);

// Production routes (health checks, monitoring)
app.use('/', productionRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Error handler
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

// =====================================================
// Start Server
// =====================================================

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   TPO Management System - Backend API                ║
║                                                       ║
║   Server running on: http://localhost:${PORT}        ║
║   Environment: ${process.env.NODE_ENV || 'development'}                    ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
  `);
});

export default app;
