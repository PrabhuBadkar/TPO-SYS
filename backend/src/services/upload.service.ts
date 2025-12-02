import { prisma } from '../server'
import * as fs from 'fs/promises'
import * as path from 'path'
import { v4 as uuidv4 } from 'uuid'

/**
 * Upload Service
 * Handles file uploads for resumes and documents
 */

export class UploadService {
  private static UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads'
  private static MAX_FILE_SIZE = {
    RESUME: 2 * 1024 * 1024, // 2MB
    DOCUMENT: 5 * 1024 * 1024, // 5MB
  }

  private static ALLOWED_TYPES = {
    RESUME: ['application/pdf'],
    DOCUMENT: ['application/pdf', 'image/jpeg', 'image/png'],
  }

  /**
   * Initialize upload directories
   */
  static async init() {
    const dirs = [
      path.join(this.UPLOAD_DIR, 'resumes'),
      path.join(this.UPLOAD_DIR, 'documents'),
      path.join(this.UPLOAD_DIR, 'temp'),
    ]

    for (const dir of dirs) {
      try {
        await fs.mkdir(dir, { recursive: true })
      } catch (error) {
        console.error(`Failed to create directory ${dir}:`, error)
      }
    }
  }

  /**
   * Validate file
   */
  static validateFile(
    file: Express.Multer.File,
    type: 'RESUME' | 'DOCUMENT'
  ): { valid: boolean; error?: string } {
    // Check file size
    if (file.size > this.MAX_FILE_SIZE[type]) {
      return {
        valid: false,
        error: `File size exceeds limit (${this.MAX_FILE_SIZE[type] / 1024 / 1024}MB)`,
      }
    }

    // Check file type
    if (!this.ALLOWED_TYPES[type].includes(file.mimetype)) {
      return {
        valid: false,
        error: `Invalid file type. Allowed: ${this.ALLOWED_TYPES[type].join(', ')}`,
      }
    }

    return { valid: true }
  }

  /**
   * Upload resume
   */
  static async uploadResume(
    studentId: string,
    file: Express.Multer.File,
    isPrimary: boolean = false
  ) {
    // Validate file
    const validation = this.validateFile(file, 'RESUME')
    if (!validation.valid) {
      throw new Error(validation.error)
    }

    // Generate unique filename
    const filename = `${uuidv4()}-${file.originalname}`
    const filepath = path.join(this.UPLOAD_DIR, 'resumes', filename)

    // Save file
    await fs.writeFile(filepath, file.buffer)

    // If this is primary, unset other primary resumes
    if (isPrimary) {
      await prisma.resume.updateMany({
        where: {
          student_id: studentId,
          is_primary: true,
        },
        data: {
          is_primary: false,
        },
      })
    }

    // Create resume record
    const resume = await prisma.resume.create({
      data: {
        student_id: studentId,
        file_name: file.originalname,
        file_path: filepath,
        file_size: file.size,
        file_hash: `hash-${Date.now()}`,
        version: 1,
        is_primary: isPrimary,
        is_active: true,
      },
    })

    // Update profile completion
    await this.updateProfileCompletion(studentId)

    return resume
  }

  /**
   * Upload document
   */
  static async uploadDocument(
    studentId: string,
    file: Express.Multer.File,
    documentType: string,
    description?: string
  ) {
    // Validate file
    const validation = this.validateFile(file, 'DOCUMENT')
    if (!validation.valid) {
      throw new Error(validation.error)
    }

    // Generate unique filename
    const filename = `${uuidv4()}-${file.originalname}`
    const filepath = path.join(this.UPLOAD_DIR, 'documents', filename)

    // Save file
    await fs.writeFile(filepath, file.buffer)

    // Create document record
    const document = await prisma.studentDocument.create({
      data: {
        student_id: studentId,
        document_type: documentType,
        document_name: file.originalname,
        file_path: filepath,
        file_size: file.size,
        file_hash: `hash-${Date.now()}`,
      },
    })

    // Update profile completion
    await this.updateProfileCompletion(studentId)

    return document
  }

  /**
   * Delete resume
   */
  static async deleteResume(resumeId: string, studentId: string) {
    const resume = await prisma.resume.findFirst({
      where: {
        id: resumeId,
        student_id: studentId,
      },
    })

    if (!resume) {
      throw new Error('Resume not found')
    }

    // Delete file
    try {
      await fs.unlink(resume.file_path)
    } catch (error) {
      console.error('Failed to delete file:', error)
    }

    // Delete record
    await prisma.resume.delete({
      where: { id: resumeId },
    })

    // Update profile completion
    await this.updateProfileCompletion(studentId)

    return true
  }

  /**
   * Delete document
   */
  static async deleteDocument(documentId: string, studentId: string) {
    const document = await prisma.studentDocument.findFirst({
      where: {
        id: documentId,
        student_id: studentId,
      },
    })

    if (!document) {
      throw new Error('Document not found')
    }

    // Delete file
    try {
      await fs.unlink(document.file_path)
    } catch (error) {
      console.error('Failed to delete file:', error)
    }

    // Delete record
    await prisma.studentDocument.delete({
      where: { id: documentId },
    })

    // Update profile completion
    await this.updateProfileCompletion(studentId)

    return true
  }

  /**
   * Set primary resume
   */
  static async setPrimaryResume(resumeId: string, studentId: string) {
    // Verify resume belongs to student
    const resume = await prisma.resume.findFirst({
      where: {
        id: resumeId,
        student_id: studentId,
      },
    })

    if (!resume) {
      throw new Error('Resume not found')
    }

    // Unset other primary resumes
    await prisma.resume.updateMany({
      where: {
        student_id: studentId,
        is_primary: true,
      },
      data: {
        is_primary: false,
      },
    })

    // Set this as primary
    await prisma.resume.update({
      where: { id: resumeId },
      data: { is_primary: true },
    })

    return true
  }

  /**
   * Update profile completion after upload
   */
  private static async updateProfileCompletion(studentId: string) {
    const profile = await prisma.studentProfile.findUnique({
      where: { id: studentId },
      include: {
        resumes: { where: { is_active: true } },
      },
    })

    if (!profile) return

    let completion = profile.profile_complete_percent || 0

    // Add resume completion (20%) if not already counted
    const hasResume = profile.resumes && profile.resumes.length > 0
    if (hasResume && completion < 100) {
      // Check if resume completion was already added
      // This is a simplified version - in production, track this separately
      completion = Math.min(completion + 20, 100)
    }

    await prisma.studentProfile.update({
      where: { id: studentId },
      data: { profile_complete_percent: completion },
    })
  }

  /**
   * Get file URL (for serving files)
   */
  static getFileUrl(filepath: string): string {
    // In production, this would return a signed S3 URL
    // For now, return a local path
    return `/uploads/${path.basename(filepath)}`
  }
}

// Initialize upload directories on module load
UploadService.init().catch(console.error)
