import { Router, Request, Response } from 'express';
import multer from 'multer';
import { resumeService } from '../../services/student/resumeService';
import { authenticateToken, authorizeRole } from '../../middleware/auth';

const router = Router();

// Configure multer for file upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

/**
 * POST /api/public/resume/upload
 * Upload a new resume
 */
router.post('/upload', 
  authenticateToken, 
  authorizeRole('ROLE_STUDENT'),
  upload.single('resume'),
  async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Not authenticated' });
      }

      if (!req.file) {
        return res.status(400).json({ success: false, error: 'No file uploaded' });
      }

      const is_primary = req.body.is_primary === 'true' || req.body.is_primary === true;

      const resume = await resumeService.uploadResume({
        student_id: req.user.id,
        file: req.file,
        is_primary
      });

      res.status(201).json({
        success: true,
        message: 'Resume uploaded successfully',
        data: resume
      });
    } catch (error: any) {
      console.error('Resume upload error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to upload resume'
      });
    }
  }
);

/**
 * GET /api/public/resume/list
 * Get all resumes for current student
 */
router.get('/list',
  authenticateToken,
  authorizeRole('ROLE_STUDENT'),
  async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Not authenticated' });
      }

      const resumes = await resumeService.getResumes(req.user.id);

      res.json({
        success: true,
        data: resumes
      });
    } catch (error: any) {
      console.error('Get resumes error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to get resumes'
      });
    }
  }
);

/**
 * PUT /api/public/resume/:id/set-primary
 * Set a resume as primary
 */
router.put('/:id/set-primary',
  authenticateToken,
  authorizeRole('ROLE_STUDENT'),
  async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Not authenticated' });
      }

      const resume = await resumeService.setPrimaryResume(req.user.id, req.params.id);

      res.json({
        success: true,
        message: 'Primary resume updated successfully',
        data: resume
      });
    } catch (error: any) {
      console.error('Set primary resume error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to set primary resume'
      });
    }
  }
);

/**
 * DELETE /api/public/resume/:id
 * Delete a resume
 */
router.delete('/:id',
  authenticateToken,
  authorizeRole('ROLE_STUDENT'),
  async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Not authenticated' });
      }

      const resume = await resumeService.deleteResume(req.user.id, req.params.id);

      res.json({
        success: true,
        message: 'Resume deleted successfully',
        data: resume
      });
    } catch (error: any) {
      console.error('Delete resume error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to delete resume'
      });
    }
  }
);

/**
 * GET /api/public/resume/:id/download
 * Download a resume file
 */
router.get('/:id/download',
  authenticateToken,
  authorizeRole('ROLE_STUDENT'),
  async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Not authenticated' });
      }

      const { filePath, fileName, mimeType } = await resumeService.downloadResume(
        req.user.id,
        req.params.id
      );

      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.sendFile(filePath);
    } catch (error: any) {
      console.error('Download resume error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to download resume'
      });
    }
  }
);

export default router;
