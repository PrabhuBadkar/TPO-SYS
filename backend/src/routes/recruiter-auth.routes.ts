import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../server';
import { generateToken, generateRefreshToken } from '../middleware/auth';

const router = Router();

// =====================================================
// POST /api/auth/register/recruiter
// Description: Register new recruiter organization
// =====================================================

router.post('/register/recruiter', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      // Company Info
      org_name,
      website,
      industry,
      size,
      headquarters,
      branch_offices,
      year_established,
      description,
      
      // Legal Verification
      gst_number,
      cin,
      pan,
      registration_cert_url,
      authorization_letter_url,
      
      // POC Details
      poc_name,
      designation,
      department,
      email,
      mobile_number,
      linkedin_profile,
      
      // Password
      password,
    } = req.body;

    // Validate required fields
    if (!email || !password || !org_name || !poc_name) {
      console.log('Missing required fields:', { email: !!email, password: !!password, org_name: !!org_name, poc_name: !!poc_name });
      res.status(400).json({
        success: false,
        error: 'Missing required fields',
        details: {
          email: !email ? 'Email is required' : undefined,
          password: !password ? 'Password is required' : undefined,
          org_name: !org_name ? 'Organization name is required' : undefined,
          poc_name: !poc_name ? 'POC name is required' : undefined,
        },
      });
      return;
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log('Email already registered:', email);
      res.status(400).json({
        success: false,
        error: 'Email already registered',
      });
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user (disabled until approved)
    // Note: mobile_number is stored in POC table, not User table for recruiters
    const user = await prisma.user.create({
      data: {
        email,
        mobile_number: null, // Mobile stored in POC table instead
        encrypted_password: hashedPassword,
        role: 'ROLE_RECRUITER',
        is_active: false, // Disabled until TPO Admin approves
        is_verified: false,
      },
    });

    console.log('User created successfully:', user.id);

    // Create organization
    console.log('Creating organization with data:', {
      org_name,
      website,
      industry,
      size,
      headquarters,
      year_established,
    });

    const organization = await prisma.organization.create({
      data: {
        org_name,
        website,
        industry,
        size,
        headquarters,
        branch_offices: branch_offices || [],
        year_established: parseInt(year_established),
        description,
        gst_number,
        cin,
        pan,
        registration_cert_url,
        authorization_letter_url,
        recruiter_status: 'PENDING_VERIFICATION',
      },
    });

    console.log('Organization created successfully:', organization.id);

    // Create POC
    console.log('Creating POC for organization:', organization.id);

    const poc = await prisma.pOC.create({
      data: {
        org_id: organization.id,
        user_id: user.id,
        poc_name,
        designation,
        department,
        email,
        mobile_number,
        linkedin_profile,
        is_primary: true,
        is_active: false, // Disabled until approved
      },
    });

    console.log('POC created successfully:', poc.id);
    console.log('Registration complete - Organization ID:', organization.id, 'Status:', organization.recruiter_status);

    // TODO: Send email to recruiter (registration submitted)
    // TODO: Send email to TPO Admin (new registration pending)

    res.status(201).json({
      success: true,
      message: 'Registration submitted successfully. Awaiting TPO Admin approval.',
      data: {
        organization_id: organization.id,
        status: 'PENDING_VERIFICATION',
      },
    });
  } catch (error) {
    console.error('Recruiter registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to register recruiter',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// =====================================================
// POST /api/auth/login/recruiter
// Description: Login recruiter with approval check
// =====================================================

router.post('/login/recruiter', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || user.role !== 'ROLE_RECRUITER') {
      res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
      return;
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.encrypted_password);
    if (!isValidPassword) {
      res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
      return;
    }

    // Check if account is active
    if (!user.is_active) {
      // Get organization status
      const poc = await prisma.pOC.findUnique({
        where: { user_id: user.id },
        include: { organization: true },
      });

      if (poc?.organization.recruiter_status === 'PENDING_VERIFICATION') {
        res.status(403).json({
          success: false,
          error: 'Your account is pending TPO Admin approval',
          status: 'PENDING_VERIFICATION',
        });
        return;
      }

      if (poc?.organization.recruiter_status === 'REJECTED') {
        res.status(403).json({
          success: false,
          error: `Your registration was rejected: ${poc.organization.rejection_reason || 'No reason provided'}`,
          status: 'REJECTED',
          rejection_reason: poc.organization.rejection_reason,
        });
        return;
      }

      res.status(403).json({
        success: false,
        error: 'Your account is disabled',
      });
      return;
    }

    // Get POC and organization details
    const poc = await prisma.pOC.findUnique({
      where: { user_id: user.id },
      include: { organization: true },
    });

    if (!poc) {
      res.status(404).json({
        success: false,
        error: 'POC details not found',
      });
      return;
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: {
        last_login_at: new Date(),
        login_count: { increment: 1 },
      },
    });

    // Generate tokens
    const accessToken = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshToken = generateRefreshToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
        poc: {
          id: poc.id,
          name: poc.poc_name,
          designation: poc.designation,
          department: poc.department,
        },
        organization: {
          id: poc.organization.id,
          name: poc.organization.org_name,
          status: poc.organization.recruiter_status,
        },
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: 86400, // 24 hours in seconds
        },
      },
    });
  } catch (error) {
    console.error('Recruiter login error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to login',
    });
  }
});

// =====================================================
// GET /api/auth/recruiter/status
// Description: Check registration status
// =====================================================

router.get('/recruiter/status', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.query;

    console.log('📊 Status check requested for email:', email);

    if (!email) {
      res.status(400).json({
        success: false,
        error: 'Email is required',
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email: email as string },
    });

    if (!user || user.role !== 'ROLE_RECRUITER') {
      console.log('❌ User not found or not a recruiter');
      res.status(404).json({
        success: false,
        error: 'Recruiter not found',
      });
      return;
    }

    console.log('✅ User found:', user.id, 'Role:', user.role, 'Active:', user.is_active);

    const poc = await prisma.pOC.findUnique({
      where: { user_id: user.id },
      include: { organization: true },
    });

    if (!poc) {
      console.log('❌ POC not found for user:', user.id);
      res.status(404).json({
        success: false,
        error: 'Organization details not found',
      });
      return;
    }

    console.log('✅ POC found:', poc.id);
    console.log('✅ Organization:', poc.organization.id, poc.organization.org_name);
    console.log('✅ Recruiter Status:', poc.organization.recruiter_status);
    console.log('✅ Verified At:', poc.organization.verified_at);
    console.log('✅ Rejection Reason:', poc.organization.rejection_reason);

    const responseData = {
      status: poc.organization.recruiter_status,
      organization_name: poc.organization.org_name,
      rejection_reason: poc.organization.rejection_reason,
      submitted_at: poc.organization.created_at,
      verified_at: poc.organization.verified_at,
    };

    console.log('📤 Sending response:', JSON.stringify(responseData, null, 2));

    res.json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error('❌ Status check error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check status',
    });
  }
});

export default router;
