import { Router, Request, Response } from 'express';
import { prisma } from '../../server';
import { authenticate } from '../../middleware/auth';

const router = Router();

// =====================================================
// GET /api/public/profile/completion-status
// Description: Get profile completion status
// =====================================================

router.get('/completion-status', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    const profile = await prisma.studentProfile.findUnique({
      where: { user_id: userId },
    });

    if (!profile) {
      res.status(404).json({
        success: false,
        error: 'Profile not found',
      });
      return;
    }

    // Calculate completion percentage
    const requiredFields = [
      'first_name', 'last_name', 'mother_name', 'date_of_birth', 'gender',
      'mobile_number', 'personal_email', 'address_permanent', 'category',
      'enrollment_number', 'department', 'degree', 'year_of_admission',
      'current_semester', 'expected_graduation_year', 'cgpi',
      'ssc_percentage', 'hsc_percentage', 'data_sharing_consent'
    ];

    const filledFields = requiredFields.filter(field => {
      const value = profile[field as keyof typeof profile];
      return value !== null && value !== undefined && value !== '';
    });

    const completionPercent = Math.round((filledFields.length / requiredFields.length) * 100);

    res.json({
      success: true,
      data: {
        completionPercent,
        profileStatus: profile.profile_status,
        isComplete: completionPercent === 100,
      },
    });
  } catch (error) {
    console.error('Completion status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch completion status',
    });
  }
});

// =====================================================
// PUT /api/public/profile/step1
// Description: Update personal information (Step 1)
// =====================================================

router.put('/step1', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const {
      mother_name,
      date_of_birth,
      gender,
      category,
      alternate_mobile,
      address_permanent,
      address_current,
    } = req.body;

    const profile = await prisma.studentProfile.update({
      where: { user_id: userId },
      data: {
        mother_name,
        date_of_birth: date_of_birth ? new Date(date_of_birth) : undefined,
        gender,
        category,
        alternate_mobile,
        address_permanent,
        address_current,
        updated_at: new Date(),
      },
    });

    res.json({
      success: true,
      message: 'Personal information updated successfully',
      data: profile,
    });
  } catch (error) {
    console.error('Step 1 update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update personal information',
    });
  }
});

// =====================================================
// PUT /api/public/profile/step2
// Description: Update academic details (Step 2)
// =====================================================

router.put('/step2', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const {
      degree,
      roll_number,
      year_of_admission,
      current_semester,
      expected_graduation_year,
      cgpi,
      active_backlogs,
      is_direct_second_year,
      ssc_year_of_passing,
      ssc_board,
      ssc_percentage,
      hsc_year_of_passing,
      hsc_board,
      hsc_percentage,
      diploma_year_of_passing,
      diploma_percentage,
    } = req.body;

    const profile = await prisma.studentProfile.update({
      where: { user_id: userId },
      data: {
        degree,
        roll_number,
        year_of_admission: year_of_admission ? parseInt(year_of_admission) : undefined,
        current_semester: current_semester ? parseInt(current_semester) : undefined,
        expected_graduation_year: expected_graduation_year ? parseInt(expected_graduation_year) : undefined,
        cgpi: cgpi ? parseFloat(cgpi) : undefined,
        active_backlogs: active_backlogs === 'true' || active_backlogs === true,
        is_direct_second_year: is_direct_second_year === 'true' || is_direct_second_year === true,
        ssc_year_of_passing: ssc_year_of_passing ? parseInt(ssc_year_of_passing) : undefined,
        ssc_board,
        ssc_percentage: ssc_percentage ? parseFloat(ssc_percentage) : undefined,
        hsc_year_of_passing: hsc_year_of_passing ? parseInt(hsc_year_of_passing) : undefined,
        hsc_board,
        hsc_percentage: hsc_percentage ? parseFloat(hsc_percentage) : undefined,
        diploma_year_of_passing: diploma_year_of_passing ? parseInt(diploma_year_of_passing) : undefined,
        diploma_percentage: diploma_percentage ? parseFloat(diploma_percentage) : undefined,
        updated_at: new Date(),
      },
    });

    res.json({
      success: true,
      message: 'Academic details updated successfully',
      data: profile,
    });
  } catch (error) {
    console.error('Step 2 update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update academic details',
    });
  }
});

// =====================================================
// PUT /api/public/profile/step3
// Description: Update skills & experience (Step 3)
// =====================================================

router.put('/step3', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const {
      skills,
      projects,
      certifications,
      internships,
      competitive_profiles,
    } = req.body;

    const profile = await prisma.studentProfile.update({
      where: { user_id: userId },
      data: {
        skills: skills || { skills: [] },
        projects: projects || [],
        certifications: certifications || [],
        internships: internships || [],
        competitive_profiles: competitive_profiles || {},
        updated_at: new Date(),
      },
    });

    res.json({
      success: true,
      message: 'Skills and experience updated successfully',
      data: profile,
    });
  } catch (error) {
    console.error('Step 3 update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update skills and experience',
    });
  }
});

// =====================================================
// PUT /api/public/profile/step4
// Description: Update job preferences & submit (Step 4)
// =====================================================

router.put('/step4', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const {
      preferred_job_roles,
      preferred_employment_type,
      preferred_locations,
      expected_ctc_min,
      expected_ctc_max,
      data_sharing_consent,
    } = req.body;

    // Calculate profile completion
    const currentProfile = await prisma.studentProfile.findUnique({
      where: { user_id: userId },
    });

    if (!currentProfile) {
      res.status(404).json({
        success: false,
        error: 'Profile not found',
      });
      return;
    }

    const requiredFields = [
      'first_name', 'last_name', 'mother_name', 'date_of_birth', 'gender',
      'mobile_number', 'personal_email', 'address_permanent', 'category',
      'enrollment_number', 'department', 'degree', 'year_of_admission',
      'current_semester', 'expected_graduation_year', 'cgpi',
      'ssc_percentage', 'hsc_percentage', 'data_sharing_consent'
    ];

    const filledFields = requiredFields.filter(field => {
      const value = currentProfile[field as keyof typeof currentProfile];
      return value !== null && value !== undefined && value !== '';
    });

    const completionPercent = Math.round((filledFields.length / requiredFields.length) * 100);

    const profile = await prisma.studentProfile.update({
      where: { user_id: userId },
      data: {
        preferred_job_roles: preferred_job_roles || [],
        preferred_employment_type,
        preferred_locations: preferred_locations || [],
        expected_ctc_min: expected_ctc_min ? parseInt(expected_ctc_min) : undefined,
        expected_ctc_max: expected_ctc_max ? parseInt(expected_ctc_max) : undefined,
        data_sharing_consent: data_sharing_consent === 'true' || data_sharing_consent === true,
        profile_complete_percent: completionPercent,
        profile_status: completionPercent === 100 ? 'PENDING_VERIFICATION' : 'DRAFT',
        updated_at: new Date(),
      },
    });

    res.json({
      success: true,
      message: completionPercent === 100 
        ? 'Profile completed and submitted for verification!' 
        : 'Job preferences updated successfully',
      data: {
        profile,
        completionPercent,
        status: profile.profile_status,
      },
    });
  } catch (error) {
    console.error('Step 4 update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update job preferences',
    });
  }
});

export default router;
