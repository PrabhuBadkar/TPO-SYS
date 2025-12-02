import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();

export interface UploadDocumentInput {
  student_id: string;
  file: Express.Multer.File;
  document_type: 'SSC_MARKSHEET' | 'HSC_MARKSHEET' | 'DIPLOMA_MARKSHEET' | 'CERTIFICATE' | 'ID_PROOF' | 'OTHER';
  document_name?: string;
}

export class DocumentService {
  private readonly uploadDir = path.join(__dirname, '../../../uploads/documents');
  private readonly maxFileSize = 5 * 1024 * 1024; // 5MB
  private readonly allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];

  /**
   * Upload a new document
   */
  async uploadDocument(data: UploadDocumentInput) {
    const { student_id, file, document_type, document_name } = data;

    // Validate file
    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new Error('Only PDF, JPG, and PNG files are allowed');
    }

    if (file.size > this.maxFileSize) {
      throw new Error('File size must be less than 5MB');
    }

    // Get student profile
    const profile = await prisma.studentProfile.findUnique({
      where: { user_id: student_id }
    });

    if (!profile) {
      throw new Error('Student profile not found');
    }

    // Generate file hash
    const fileHash = crypto.createHash('sha256').update(file.buffer).digest('hex');

    // Check for duplicate
    const existingDoc = await prisma.document.findFirst({
      where: {
        student_id: profile.id,
        file_hash: fileHash
      }
    });

    if (existingDoc) {
      throw new Error('This document has already been uploaded');
    }

    // Generate unique filename
    const ext = path.extname(file.originalname);
    const fileName = `${profile.enrollment_number}_${document_type}_${Date.now()}${ext}`;
    const filePath = path.join(this.uploadDir, fileName);

    // Ensure upload directory exists
    await fs.mkdir(this.uploadDir, { recursive: true });

    // Save file
    await fs.writeFile(filePath, file.buffer);

    // Create document record
    const document = await prisma.document.create({
      data: {
        student_id: profile.id,
        document_type,
        document_name: document_name || file.originalname,
        file_path: filePath,
        file_size: file.size,
        file_hash: fileHash,
        watermark_applied: false,
        verified: false
      }
    });

    // Update profile URLs based on document type
    await this.updateProfileDocumentUrls(profile.id, document_type, filePath);

    return document;
  }

  /**
   * Get all documents for a student
   */
  async getDocuments(userId: string) {
    const profile = await prisma.studentProfile.findUnique({
      where: { user_id: userId }
    });

    if (!profile) {
      throw new Error('Student profile not found');
    }

    const documents = await prisma.document.findMany({
      where: {
        student_id: profile.id
      },
      orderBy: { created_at: 'desc' }
    });

    return documents;
  }

  /**
   * Get documents by type
   */
  async getDocumentsByType(userId: string, documentType: string) {
    const profile = await prisma.studentProfile.findUnique({
      where: { user_id: userId }
    });

    if (!profile) {
      throw new Error('Student profile not found');
    }

    const documents = await prisma.document.findMany({
      where: {
        student_id: profile.id,
        document_type: documentType
      },
      orderBy: { created_at: 'desc' }
    });

    return documents;
  }

  /**
   * Delete a document
   */
  async deleteDocument(userId: string, documentId: string) {
    const profile = await prisma.studentProfile.findUnique({
      where: { user_id: userId }
    });

    if (!profile) {
      throw new Error('Student profile not found');
    }

    // Verify document belongs to student
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        student_id: profile.id
      }
    });

    if (!document) {
      throw new Error('Document not found');
    }

    // Delete file from filesystem
    try {
      await fs.unlink(document.file_path);
    } catch (error) {
      console.error('Failed to delete file:', error);
    }

    // Delete from database
    const deleted = await prisma.document.delete({
      where: { id: documentId }
    });

    // Clear profile URL if this was the active document
    await this.clearProfileDocumentUrl(profile.id, document.document_type);

    return deleted;
  }

  /**
   * Download document file
   */
  async downloadDocument(userId: string, documentId: string) {
    const profile = await prisma.studentProfile.findUnique({
      where: { user_id: userId }
    });

    if (!profile) {
      throw new Error('Student profile not found');
    }

    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        student_id: profile.id
      }
    });

    if (!document) {
      throw new Error('Document not found');
    }

    // Check if file exists
    try {
      await fs.access(document.file_path);
    } catch {
      throw new Error('Document file not found on server');
    }

    return {
      filePath: document.file_path,
      fileName: document.document_name,
      mimeType: 'application/pdf' // Default, could be stored in DB
    };
  }

  /**
   * Update profile document URLs
   */
  private async updateProfileDocumentUrls(studentId: string, documentType: string, filePath: string) {
    const updateData: any = {};

    switch (documentType) {
      case 'SSC_MARKSHEET':
        updateData.ssc_marksheet_url = filePath;
        break;
      case 'HSC_MARKSHEET':
        updateData.hsc_marksheet_url = filePath;
        break;
      case 'DIPLOMA_MARKSHEET':
        updateData.diploma_marksheet_url = filePath;
        break;
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.studentProfile.update({
        where: { id: studentId },
        data: updateData
      });
    }
  }

  /**
   * Clear profile document URL
   */
  private async clearProfileDocumentUrl(studentId: string, documentType: string) {
    const updateData: any = {};

    switch (documentType) {
      case 'SSC_MARKSHEET':
        updateData.ssc_marksheet_url = null;
        break;
      case 'HSC_MARKSHEET':
        updateData.hsc_marksheet_url = null;
        break;
      case 'DIPLOMA_MARKSHEET':
        updateData.diploma_marksheet_url = null;
        break;
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.studentProfile.update({
        where: { id: studentId },
        data: updateData
      });
    }
  }

  /**
   * Get document statistics
   */
  async getDocumentStats(userId: string) {
    const profile = await prisma.studentProfile.findUnique({
      where: { user_id: userId }
    });

    if (!profile) {
      throw new Error('Student profile not found');
    }

    const [total, verified, pending] = await Promise.all([
      prisma.document.count({
        where: { student_id: profile.id }
      }),
      prisma.document.count({
        where: { student_id: profile.id, verified: true }
      }),
      prisma.document.count({
        where: { student_id: profile.id, verified: false }
      })
    ]);

    return {
      total,
      verified,
      pending
    };
  }
}

export const documentService = new DocumentService();
