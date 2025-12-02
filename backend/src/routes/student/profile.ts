import { Router, Request, Response } from 'express';
import { profileService } from '../../services/student/profileService';
import { authenticateToken, authorizeRole } from '../../middleware/auth';
import { z } from 'zod';

const router = Router();

// Validation schemas
const createProfileSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  mobile_number: z.string().optional(),
  first_name: z.string().min(1),
  middle_name: z.string().optional(),
  last_name: z.string().min(1),
  mother_name: z.string().optional(),
  date_of_birth: z.string().transform(str => new Date(str)),
  gender: z.enum(['Male', 'Female', 'Other', 'Prefer not to say']),
  personal_email: z.string().email(),
  address_permanent: z.string().min(10),
  address_current: z.string().optional(),
  category: z.enum(['General', 'OBC', 'SC', 'ST', 'Other']).optional(),
  enrollment_number: z.string().min(1),
  roll_number: z.string().optional(),
  department: z.enum(['CSE', 'ECE', 'ME', 'CE', 'IT', 'EE', 'Others']),
  degree: z.enum(['B.Tech', 'M.Tech', 'MCA', 'MBA', 'Diploma']),
  year_of_admission: z.number().int().min(2000),
  current_semester: z.number().int().min(1).max(12),
  expected_graduation_year: z.number().int().min(2024)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

const updateProfileSchema = z.object({
  first_name: z.string().optional(),
  middle_name: z.string().optional(),
  last_name: z.string().optional(),
  mother_name: z.string().optional(),
  date_of_birth: z.string().transform(str => new Date(str)).optional(),
  gender: z.enum(['Male', 'Female', 'Other', 'Prefer not to say']).optional(),
  mobile_number: z.string().optional(),
  alternate_mobile: z.string().optional(),
  personal_email: z.string().email().optional(),
  address_permanent: z.string().optional(),
  address_current: z.string().optional(),
  photo_url: z.string().optional(),
  category: z.enum(['General', 'OBC', 'SC', 'ST', 'Other']).optional(),
  current_semester: z.number().int().min(1).max(12).optional(),
  skills: z.any().optional(),
  projects: z.any().optional(),
  certifications: z.any().optional(),
  internships: z.any().optional(),
  competitive_profiles: z.any().optional(),
  preferred_job_roles: z.array(z.string()).optional(),
  preferred_employment_type: z.enum(['Full-Time', 'Internship', 'Part-Time', 'Contract']).optional(),
  preferred_locations: z.array(z.string()).optional(),
  expected_ctc_min: z.number().optional(),
  expected_ctc_max: z.number().optional(),
  notification_preferences: z.any().optional(),
  calendar_preferences: z.any().optional()
});

/**
 * POST /api/public/profile/create
 * Create a new student profile
 */
router.post('/create', async (req: Request, res: Response) => {
  try {
    const validatedData = createProfileSchema.parse(req.body);
    const result = await profileService.createProfile(validatedData);
    
    res.status(201).json({
      success: true,
      message: 'Profile created successfully',
      data: result
    });
  } catch (error: any) {
    console.error('Create profile error:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to create profile'
    });
  }
});

/**
 * POST /api/public/profile/login
 * Student login
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const result = await profileService.login(email, password);
    
    res.json({
      success: true,
      message: 'Login successful',
      data: result
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(401).json({
      success: false,
      error: error.message || 'Login failed'
    });
  }
});

/**
 * GET /api/public/profile/me
 * Get current student's profile
 */
router.get('/me', authenticateToken, authorizeRole('ROLE_STUDENT'), async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const profile = await profileService.getProfile(req.user.id);
    
    res.json({
      success: true,
      data: profile
    });
  } catch (error: any) {
    console.error('Get profile error:', error);
    res.status(404).json({
      success: false,
      error: error.message || 'Profile not found'
    });
  }
});

/**
 * PUT /api/public/profile/update
 * Update student profile
 */
router.put('/update', authenticateToken, authorizeRole('ROLE_STUDENT'), async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const validatedData = updateProfileSchema.parse(req.body);
    const profile = await profileService.updateProfile(req.user.id, validatedData);
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: profile
    });
  } catch (error: any) {
    console.error('Update profile error:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to update profile'
    });
  }
});

/**
 * POST /api/public/profile/verify-request
 * Request profile verification from TPO_Dept
 */
router.post('/verify-request', authenticateToken, authorizeRole('ROLE_STUDENT'), async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const profile = await profileService.requestVerification(req.user.id);
    
    res.json({
      success: true,
      message: 'Verification request submitted successfully',
      data: profile
    });
  } catch (error: any) {
    console.error('Verification request error:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to request verification'
    });
  }
});

export default router;
