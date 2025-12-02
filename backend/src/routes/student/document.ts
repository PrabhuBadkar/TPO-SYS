import { Router, Request, Response } from 'express';
import multer from 'multer';
import { documentService } from '../../services/student/documentService';
import { authenticateToken, authorizeRole } from '../../middleware/auth';

const router = Router();

// Configure multer for file upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, JPG, and PNG files are allowed'));
    }
  }
});

/**
 * POST /api/public/documents/upload
 * Upload a new document
 */
router.post('/upload',
  authenticateToken,
  authorizeRole('ROLE_STUDENT'),
  upload.single('document'),
  async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Not authenticated' });
      }

      if (!req.file) {
        return res.status(400).json({ success: false, error: 'No file uploaded' });
      }

      const { document_type, document_name, description } = req.body;

      if (!document_type) {
        return res.status(400).json({ success: false, error: 'Document type is required' });
      }

      const document = await documentService.uploadDocument({
        student_id: req.user.id,
        file: req.file,
        document_type,
        document_name,
        description
      });

      res.status(201).json({
        success: true,
        message: 'Document uploaded successfully',
        data: document
      });
    } catch (error: any) {
      console.error('Document upload error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to upload document'
      });
    }
  }
);

/**
 * GET /api/public/documents/list
 * Get all documents for current student
 */
router.get('/list',
  authenticateToken,
  authorizeRole('ROLE_STUDENT'),
  async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Not authenticated' });
      }

      const documents = await documentService.getDocuments(req.user.id);

      res.json({
        success: true,
        data: documents
      });
    } catch (error: any) {
      console.error('Get documents error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to get documents'
      });
    }
  }
);

/**
 * GET /api/public/documents/type/:type
 * Get documents by type
 */
router.get('/type/:type',
  authenticateToken,
  authorizeRole('ROLE_STUDENT'),
  async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Not authenticated' });
      }

      const documents = await documentService.getDocumentsByType(req.user.id, req.params.type);

      res.json({
        success: true,
        data: documents
      });
    } catch (error: any) {
      console.error('Get documents by type error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to get documents'
      });
    }
  }
);

/**
 * DELETE /api/public/documents/:id
 * Delete a document
 */
router.delete('/:id',
  authenticateToken,
  authorizeRole('ROLE_STUDENT'),
  async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Not authenticated' });
      }

      const document = await documentService.deleteDocument(req.user.id, req.params.id);

      res.json({
        success: true,
        message: 'Document deleted successfully',
        data: document
      });
    } catch (error: any) {
      console.error('Delete document error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to delete document'
      });
    }
  }
);

/**
 * GET /api/public/documents/:id/download
 * Download a document file
 */
router.get('/:id/download',
  authenticateToken,
  authorizeRole('ROLE_STUDENT'),
  async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Not authenticated' });
      }

      const { filePath, fileName, mimeType } = await documentService.downloadDocument(
        req.user.id,
        req.params.id
      );

      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.sendFile(filePath);
    } catch (error: any) {
      console.error('Download document error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to download document'
      });
    }
  }
);

/**
 * GET /api/public/documents/stats
 * Get document statistics
 */
router.get('/stats',
  authenticateToken,
  authorizeRole('ROLE_STUDENT'),
  async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Not authenticated' });
      }

      const stats = await documentService.getDocumentStats(req.user.id);

      res.json({
        success: true,
        data: stats
      });
    } catch (error: any) {
      console.error('Get document stats error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to get document stats'
      });
    }
  }
);

export default router;
