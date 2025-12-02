import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();

export interface UploadResumeInput {
  student_id: string;
  file: Express.Multer.File;
  is_primary?: boolean;
}

export class ResumeService {
  private readonly uploadDir = path.join(__dirname, '../../../uploads/resumes');
  private readonly maxFileSize = 2 * 1024 * 1024; // 2MB
  private readonly allowedMimeTypes = ['application/pdf'];

  /**
   * Upload a new resume
   */
  async uploadResume(data: UploadResumeInput) {
    const { student_id, file, is_primary = false } = data;

    // Validate file
    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new Error('Only PDF files are allowed');
    }

    if (file.size > this.maxFileSize) {
      throw new Error('File size must be less than 2MB');
    }

    // Get student profile
    const profile = await prisma.studentProfile.findUnique({
      where: { user_id: student_id },
      include: {
        resumes: {
          where: { is_active: true },
          orderBy: { version: 'desc' },
          take: 1
        }
      }
    });

    if (!profile) {
      throw new Error('Student profile not found');
    }

    // Check max resume limit (5 active versions)
    const activeResumes = await prisma.resume.count({
      where: {
        student_id: profile.id,
        is_active: true
      }
    });

    if (activeResumes >= 5) {
      throw new Error('Maximum 5 active resume versions allowed. Please delete an old version first.');
    }

    // Calculate next version number
    const nextVersion = profile.resumes.length > 0 ? profile.resumes[0].version + 1 : 1;

    // Generate file hash
    const fileHash = crypto.createHash('sha256').update(file.buffer).digest('hex');

    // Generate unique filename
    const fileName = `${profile.enrollment_number}_v${nextVersion}_${Date.now()}.pdf`;
    const filePath = path.join(this.uploadDir, fileName);

    // Ensure upload directory exists
    await fs.mkdir(this.uploadDir, { recursive: true });

    // Save file
    await fs.writeFile(filePath, file.buffer);

    // Create resume record
    const resume = await prisma.resume.create({
      data: {
        student_id: profile.id,
        version: nextVersion,
        file_name: file.originalname,
        file_path: filePath,
        file_size: file.size,
        file_hash: fileHash,
        is_primary: is_primary || activeResumes === 0, // First resume is automatically primary
        watermark_applied: false, // TODO: Implement watermarking
        watermark_text: `${profile.first_name} ${profile.last_name} - ${profile.enrollment_number} - Confidential`,
        parsing_status: 'PENDING' // TODO: Implement resume parsing
      }
    });

    // Update profile completion percentage
    await this.updateProfileCompletion(profile.id);

    return resume;
  }

  /**
   * Get all resumes for a student
   */
  async getResumes(userId: string) {
    const profile = await prisma.studentProfile.findUnique({
      where: { user_id: userId }
    });

    if (!profile) {
      throw new Error('Student profile not found');
    }

    const resumes = await prisma.resume.findMany({
      where: {
        student_id: profile.id,
        is_active: true
      },
      orderBy: { created_at: 'desc' }
    });

    return resumes;
  }

  /**
   * Set a resume as primary
   */
  async setPrimaryResume(userId: string, resumeId: string) {
    const profile = await prisma.studentProfile.findUnique({
      where: { user_id: userId }
    });

    if (!profile) {
      throw new Error('Student profile not found');
    }

    // Verify resume belongs to student
    const resume = await prisma.resume.findFirst({
      where: {
        id: resumeId,
        student_id: profile.id,
        is_active: true
      }
    });

    if (!resume) {
      throw new Error('Resume not found');
    }

    // Update resume (trigger will handle setting others to non-primary)
    const updated = await prisma.resume.update({
      where: { id: resumeId },
      data: { is_primary: true }
    });

    return updated;
  }

  /**
   * Delete (soft-delete) a resume
   */
  async deleteResume(userId: string, resumeId: string) {
    const profile = await prisma.studentProfile.findUnique({
      where: { user_id: userId }
    });

    if (!profile) {
      throw new Error('Student profile not found');
    }

    // Verify resume belongs to student
    const resume = await prisma.resume.findFirst({
      where: {
        id: resumeId,
        student_id: profile.id,
        is_active: true
      }
    });

    if (!resume) {
      throw new Error('Resume not found');
    }

    // Check if it's the only resume
    const activeCount = await prisma.resume.count({
      where: {
        student_id: profile.id,
        is_active: true
      }
    });

    if (activeCount === 1) {
      throw new Error('Cannot delete the only active resume');
    }

    // Soft delete
    const deleted = await prisma.resume.update({
      where: { id: resumeId },
      data: { is_active: false }
    });

    // If it was primary, set another resume as primary
    if (resume.is_primary) {
      const nextResume = await prisma.resume.findFirst({
        where: {
          student_id: profile.id,
          is_active: true,
          id: { not: resumeId }
        },
        orderBy: { created_at: 'desc' }
      });

      if (nextResume) {
        await prisma.resume.update({
          where: { id: nextResume.id },
          data: { is_primary: true }
        });
      }
    }

    // Update profile completion
    await this.updateProfileCompletion(profile.id);

    return deleted;
  }

  /**
   * Download resume file
   */
  async downloadResume(userId: string, resumeId: string) {
    const profile = await prisma.studentProfile.findUnique({
      where: { user_id: userId }
    });

    if (!profile) {
      throw new Error('Student profile not found');
    }

    const resume = await prisma.resume.findFirst({
      where: {
        id: resumeId,
        student_id: profile.id,
        is_active: true
      }
    });

    if (!resume) {
      throw new Error('Resume not found');
    }

    // Check if file exists
    try {
      await fs.access(resume.file_path);
    } catch {
      throw new Error('Resume file not found on server');
    }

    return {
      filePath: resume.file_path,
      fileName: resume.file_name,
      mimeType: 'application/pdf'
    };
  }

  /**
   * Update profile completion percentage when resume is added/removed
   */
  private async updateProfileCompletion(studentId: string) {
    const resumeCount = await prisma.resume.count({
      where: {
        student_id: studentId,
        is_active: true
      }
    });

    const profile = await prisma.studentProfile.findUnique({
      where: { id: studentId }
    });

    if (profile) {
      // Resume contributes 20% to completion
      const resumeScore = resumeCount > 0 ? 20 : 0;
      const otherScore = profile.profile_complete_percent - (profile.profile_complete_percent >= 20 ? 20 : 0);
      const newScore = Math.min(100, otherScore + resumeScore);

      await prisma.studentProfile.update({
        where: { id: studentId },
        data: { profile_complete_percent: newScore }
      });
    }
  }
}

export const resumeService = new ResumeService();
