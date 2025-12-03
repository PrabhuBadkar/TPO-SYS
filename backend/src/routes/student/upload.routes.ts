import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { prisma } from '../../server';
import { authenticate } from '../../middleware/auth';

const router = Router();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../../../uploads/documents');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${req.user?.id}-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Accept only PDF, JPG, JPEG, PNG
  const allowedTypes = /pdf|jpg|jpeg|png/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, JPG, JPEG, and PNG files are allowed'));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: fileFilter,
});

// =====================================================
// POST /api/public/upload/document
// Description: Upload a document (marksheet, etc.)
// =====================================================

router.post('/document', authenticate, upload.single('file'), async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: 'No file uploaded',
      });
      return;
    }

    const userId = req.user?.id;
    const { documentType } = req.body; // 'ssc_marksheet', 'hsc_marksheet', 'diploma_marksheet'

    // Generate file URL
    const fileUrl = `/uploads/documents/${req.file.filename}`;

    // Update profile with document URL
    const updateData: any = {};
    
    if (documentType === 'ssc_marksheet') {
      updateData.ssc_marksheet_url = fileUrl;
    } else if (documentType === 'hsc_marksheet') {
      updateData.hsc_marksheet_url = fileUrl;
    } else if (documentType === 'diploma_marksheet') {
      updateData.diploma_marksheet_url = fileUrl;
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.studentProfile.update({
        where: { user_id: userId },
        data: {
          ...updateData,
          updated_at: new Date(),
        },
      });
    }

    res.json({
      success: true,
      message: 'Document uploaded successfully',
      data: {
        filename: req.file.filename,
        url: fileUrl,
        size: req.file.size,
        mimetype: req.file.mimetype,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload document',
    });
  }
});

// =====================================================
// DELETE /api/public/upload/document/:filename
// Description: Delete an uploaded document
// =====================================================

router.delete('/document/:filename', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { filename } = req.params;
    const userId = req.user?.id;

    // Check if file belongs to user
    if (!filename.startsWith(`${userId}-`)) {
      res.status(403).json({
        success: false,
        error: 'Unauthorized to delete this file',
      });
      return;
    }

    const filePath = path.join(uploadsDir, filename);

    // Delete file from filesystem
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({
      success: true,
      message: 'Document deleted successfully',
    });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete document',
    });
  }
});

export default router;
