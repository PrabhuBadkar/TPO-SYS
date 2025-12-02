import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export interface CreateProfileInput {
  // User credentials
  email: string;
  password: string;
  mobile_number?: string;
  
  // Personal Information
  first_name: string;
  middle_name?: string;
  last_name: string;
  mother_name?: string;
  date_of_birth: Date;
  gender: string;
  personal_email: string;
  address_permanent: string;
  address_current?: string;
  category?: string;
  
  // Academic Information
  enrollment_number: string;
  roll_number?: string;
  department: string;
  degree: string;
  year_of_admission: number;
  current_semester: number;
  expected_graduation_year: number;
}

export interface UpdateProfileInput {
  // Personal Information
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  mother_name?: string;
  date_of_birth?: Date;
  gender?: string;
  mobile_number?: string;
  alternate_mobile?: string;
  personal_email?: string;
  address_permanent?: string;
  address_current?: string;
  photo_url?: string;
  category?: string;
  
  // Academic Information (some fields immutable after verification)
  current_semester?: number;
  
  // Career Preferences
  skills?: any;
  projects?: any;
  certifications?: any;
  internships?: any;
  competitive_profiles?: any;
  preferred_job_roles?: string[];
  preferred_employment_type?: string;
  preferred_locations?: string[];
  expected_ctc_min?: number;
  expected_ctc_max?: number;
  
  // Notifications
  notification_preferences?: any;
  calendar_preferences?: any;
}

export class ProfileService {
  /**
   * Create a new student profile with user account
   */
  async createProfile(data: CreateProfileInput) {
    // Check if email or enrollment already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: data.email },
          { mobile_number: data.mobile_number }
        ]
      }
    });

    if (existingUser) {
      throw new Error('Email or mobile number already registered');
    }

    const existingProfile = await prisma.studentProfile.findUnique({
      where: { enrollment_number: data.enrollment_number }
    });

    if (existingProfile) {
      throw new Error('Enrollment number already exists');
    }

    // Hash password
    const password_hash = await bcrypt.hash(data.password, 10);

    // Create user and profile in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email: data.email,
          mobile_number: data.mobile_number,
          password_hash,
          role: 'ROLE_STUDENT',
          is_active: true,
          is_verified: false
        }
      });

      // Create student profile
      const profile = await tx.studentProfile.create({
        data: {
          user_id: user.id,
          first_name: data.first_name,
          middle_name: data.middle_name,
          last_name: data.last_name,
          mother_name: data.mother_name,
          date_of_birth: data.date_of_birth,
          gender: data.gender,
          mobile_number: data.mobile_number || '',
          personal_email: data.personal_email,
          address_permanent: data.address_permanent,
          address_current: data.address_current,
          category: data.category,
          enrollment_number: data.enrollment_number,
          roll_number: data.roll_number,
          department: data.department,
          degree: data.degree,
          year_of_admission: data.year_of_admission,
          current_semester: data.current_semester,
          expected_graduation_year: data.expected_graduation_year,
          created_by: user.id,
          profile_complete_percent: this.calculateCompletionPercent({
            first_name: data.first_name,
            last_name: data.last_name,
            enrollment_number: data.enrollment_number,
            department: data.department
          })
        }
      });

      return { user, profile };
    });

    // Generate JWT token
    const token = this.generateToken(result.user);

    return {
      user: {
        id: result.user.id,
        email: result.user.email,
        role: result.user.role
      },
      profile: result.profile,
      token
    };
  }

  /**
   * Login student
   */
  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        studentProfile: true
      }
    });

    if (!user || user.role !== 'ROLE_STUDENT') {
      throw new Error('Invalid credentials');
    }

    if (!user.is_active) {
      throw new Error('Account is inactive');
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      // Increment failed login attempts
      await prisma.user.update({
        where: { id: user.id },
        data: { failed_login_attempts: { increment: 1 } }
      });
      throw new Error('Invalid credentials');
    }

    // Update login stats
    await prisma.user.update({
      where: { id: user.id },
      data: {
        last_login_at: new Date(),
        login_count: { increment: 1 },
        failed_login_attempts: 0
      }
    });

    const token = this.generateToken(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      },
      profile: user.studentProfile,
      token
    };
  }

  /**
   * Get student profile by user ID
   */
  async getProfile(userId: string) {
    const profile = await prisma.studentProfile.findUnique({
      where: { user_id: userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            mobile_number: true,
            is_verified: true,
            email_verified_at: true
          }
        },
        resumes: {
          where: { is_active: true },
          orderBy: { created_at: 'desc' }
        }
      }
    });

    if (!profile) {
      throw new Error('Profile not found');
    }

    return profile;
  }

  /**
   * Update student profile
   */
  async updateProfile(userId: string, data: UpdateProfileInput) {
    const existingProfile = await prisma.studentProfile.findUnique({
      where: { user_id: userId }
    });

    if (!existingProfile) {
      throw new Error('Profile not found');
    }

    // Check if verified fields are being changed
    const verifiedFieldsChanged = existingProfile.tpo_dept_verified && (
      data.mobile_number !== undefined ||
      data.personal_email !== undefined
    );

    const profile = await prisma.studentProfile.update({
      where: { user_id: userId },
      data: {
        ...data,
        updated_by: userId,
        updated_at: new Date(),
        // Reset verification if critical fields changed
        tpo_dept_verified: verifiedFieldsChanged ? false : existingProfile.tpo_dept_verified,
        profile_complete_percent: this.calculateCompletionPercent({
          ...existingProfile,
          ...data
        })
      }
    });

    return profile;
  }

  /**
   * Request profile verification
   */
  async requestVerification(userId: string) {
    const profile = await prisma.studentProfile.findUnique({
      where: { user_id: userId }
    });

    if (!profile) {
      throw new Error('Profile not found');
    }

    if (profile.profile_complete_percent < 80) {
      throw new Error('Profile must be at least 80% complete before verification');
    }

    if (profile.tpo_dept_verified) {
      throw new Error('Profile is already verified');
    }

    const updated = await prisma.studentProfile.update({
      where: { user_id: userId },
      data: {
        profile_status: 'PENDING_VERIFICATION',
        updated_at: new Date()
      }
    });

    // TODO: Send notification to TPO_Dept

    return updated;
  }

  /**
   * Calculate profile completion percentage
   */
  private calculateCompletionPercent(data: any): number {
    let score = 0;
    const weights = {
      personal: 15,
      academic: 20,
      documents: 25,
      career: 20,
      resume: 20
    };

    // Personal (15%)
    const personalFields = ['first_name', 'last_name', 'date_of_birth', 'gender', 
                           'mobile_number', 'personal_email', 'address_permanent'];
    const personalComplete = personalFields.filter(f => data[f]).length;
    score += (personalComplete / personalFields.length) * weights.personal;

    // Academic (20%)
    const academicFields = ['enrollment_number', 'department', 'degree', 
                           'year_of_admission', 'current_semester', 'expected_graduation_year'];
    const academicComplete = academicFields.filter(f => data[f]).length;
    score += (academicComplete / academicFields.length) * weights.academic;

    // Documents (25%) - simplified for now
    const documentFields = ['ssc_marksheet_url', 'hsc_marksheet_url'];
    const documentComplete = documentFields.filter(f => data[f]).length;
    score += (documentComplete / documentFields.length) * weights.documents;

    // Career (20%)
    const careerFields = ['skills', 'preferred_job_roles', 'preferred_locations'];
    const careerComplete = careerFields.filter(f => {
      const value = data[f];
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === 'object') return Object.keys(value).length > 0;
      return !!value;
    }).length;
    score += (careerComplete / careerFields.length) * weights.career;

    // Resume (20%) - will be updated when resume is uploaded
    // For now, assume 0

    return Math.round(score);
  }

  /**
   * Generate JWT token
   */
  private generateToken(user: any): string {
    const secret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role
      },
      secret,
      { expiresIn: '7d' }
    );
  }
}

export const profileService = new ProfileService();
