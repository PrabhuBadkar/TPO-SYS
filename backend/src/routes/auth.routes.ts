import { Router, Request, Response } from 'express'
import bcrypt from 'bcrypt'
import { prisma } from '../server'
import { authenticate, generateToken, generateRefreshToken, ROLES } from '../middleware/auth'
import { z } from 'zod'

const router = Router()

// =====================================================
// Validation Schemas
// =====================================================

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
})

const studentLoginSchema = z.object({
  urn: z.string().min(1, 'URN is required'),
  department: z.enum(['CSE', 'ECE', 'ME', 'CE', 'IT', 'EE', 'Others'], {
    errorMap: () => ({ message: 'Department must be one of: CSE, ECE, ME, CE, IT, EE, Others' })
  }),
  password: z.string().min(1, 'Password is required'),
})

const registerStudentSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  middleName: z.string().optional(),
  lastName: z.string().min(1, 'Last name is required'),
  mobileNumber: z.string().regex(/^[0-9]{10}$/, 'Mobile number must be 10 digits'),
  email: z.string().email('Invalid email format'),
  urn: z.string().min(1, 'URN is required'),
  department: z.enum(['CSE', 'ECE', 'ME', 'CE', 'IT', 'EE', 'Others'], {
    errorMap: () => ({ message: 'Department must be one of: CSE, ECE, ME, CE, IT, EE, Others' })
  }),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

const registerRecruiterSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  organizationName: z.string().min(1, 'Organization name is required'),
  contactPerson: z.string().min(1, 'Contact person name is required'),
  mobileNumber: z.string().regex(/^[0-9]{10}$/, 'Mobile number must be 10 digits'),
})

// =====================================================
// POST /api/auth/login
// Description: User login
// =====================================================

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request body
    const validatedData = loginSchema.parse(req.body)
    const { email, password } = validatedData

    console.log('Login attempt for:', email)

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        encrypted_password: true,
        role: true,
        is_active: true,
        email_verified: true,
      },
    })

    if (!user) {
      console.log('User not found:', email)
      res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        message: 'Email or password is incorrect',
      })
      return
    }

    // Check if account is active
    if (!user.is_active) {
      console.log('Account inactive:', email)
      res.status(401).json({
        success: false,
        error: 'Account inactive',
        message: 'Your account has been deactivated. Please contact support.',
      })
      return
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.encrypted_password)

    if (!isPasswordValid) {
      console.log('Invalid password for:', email)
      
      // Try to log failed login attempt (skip if table doesn't exist)
      try {
        await prisma.loginHistory.create({
          data: {
            user_id: user.id,
            email: email.toLowerCase(),
            success: false,
            ip_address: req.ip,
            user_agent: req.headers['user-agent'],
          },
        })
      } catch (err) {
        console.log('Could not log failed login (table may not exist)')
      }

      res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        message: 'Email or password is incorrect',
      })
      return
    }

    console.log('Password valid for:', email)

    // Generate tokens
    const accessToken = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    const refreshToken = generateRefreshToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    console.log('Tokens generated for:', email)

    // Try to create session (skip if table doesn't exist)
    try {
      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + 24) // 24 hours

      await prisma.session.create({
        data: {
          user_id: user.id,
          access_token: accessToken,
          refresh_token: refreshToken,
          ip_address: req.ip,
          user_agent: req.headers['user-agent'],
          expires_at: expiresAt,
          is_active: true,
        },
      })
      console.log('Session created for:', email)
    } catch (err) {
      console.log('Could not create session (table may not exist), continuing anyway')
    }

    // Try to log successful login (skip if table doesn't exist)
    try {
      await prisma.loginHistory.create({
        data: {
          user_id: user.id,
          email: email.toLowerCase(),
          success: true,
          ip_address: req.ip,
          user_agent: req.headers['user-agent'],
        },
      })
    } catch (err) {
      console.log('Could not log successful login (table may not exist)')
    }

    // Update last login
    try {
      await prisma.user.update({
        where: { id: user.id },
        data: { last_login_at: new Date() },
      })
    } catch (err) {
      console.log('Could not update last login')
    }

    console.log('Login successful for:', email, 'Role:', user.role)

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          emailVerified: user.email_verified,
        },
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: 86400, // 24 hours in seconds
        },
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      })
      return
    }

    console.error('Login error:', error)
    res.status(500).json({
      success: false,
      error: 'Login failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

// =====================================================
// POST /api/auth/login/student
// Description: Student login with URN and department
// =====================================================

router.post('/login/student', async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request body
    const validatedData = studentLoginSchema.parse(req.body)
    const { urn, department, password } = validatedData

    console.log('Student login attempt for URN:', urn, 'Department:', department)

    // Find student profile by URN and department
    const profile = await prisma.studentProfile.findFirst({
      where: {
        enrollment_number: urn,
        department: department,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            encrypted_password: true,
            role: true,
            is_active: true,
            email_verified: true,
          },
        },
      },
    })

    if (!profile || !profile.user) {
      console.log('Student not found - URN:', urn, 'Department:', department)
      res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        message: 'URN, department, or password is incorrect',
      })
      return
    }

    const user = profile.user

    // Check if account is active
    if (!user.is_active) {
      console.log('Account inactive for URN:', urn)
      res.status(401).json({
        success: false,
        error: 'Account inactive',
        message: 'Your account has been deactivated. Please contact TPO.',
      })
      return
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.encrypted_password)

    if (!isPasswordValid) {
      console.log('Invalid password for URN:', urn)
      res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        message: 'URN, department, or password is incorrect',
      })
      return
    }

    console.log('Password valid for URN:', urn)

    // Generate tokens
    const accessToken = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    const refreshToken = generateRefreshToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    console.log('Tokens generated for URN:', urn)

    // Try to create session (skip if table doesn't exist)
    try {
      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + 24) // 24 hours

      await prisma.session.create({
        data: {
          user_id: user.id,
          token: accessToken,
          refresh_token: refreshToken,
          ip_address: req.ip,
          user_agent: req.headers['user-agent'],
          expires_at: expiresAt,
        },
      })
      console.log('Session created for URN:', urn)
    } catch (err) {
      console.log('Could not create session (table may not exist), continuing anyway')
    }

    // Update last login
    try {
      await prisma.user.update({
        where: { id: user.id },
        data: { 
          last_login_at: new Date(),
          login_count: { increment: 1 },
        },
      })
    } catch (err) {
      console.log('Could not update last login')
    }

    console.log('Student login successful - URN:', urn, 'Email:', user.email)

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          emailVerified: user.email_verified,
        },
        profile: {
          id: profile.id,
          enrollmentNumber: profile.enrollment_number,
          firstName: profile.first_name,
          middleName: profile.middle_name,
          lastName: profile.last_name,
          department: profile.department,
          profileCompletePercent: profile.profile_complete_percent,
        },
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: 86400, // 24 hours in seconds
        },
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      })
      return
    }

    console.error('Student login error:', error)
    res.status(500).json({
      success: false,
      error: 'Login failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

// =====================================================
// POST /api/auth/register/student
// Description: Student registration
// =====================================================

router.post('/register/student', async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request body
    const validatedData = registerStudentSchema.parse(req.body)
    const { firstName, middleName, lastName, mobileNumber, email, urn, department, password } = validatedData

    console.log('Student registration attempt for:', email, 'URN:', urn)

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (existingUser) {
      console.log('User already exists:', email)
      res.status(409).json({
        success: false,
        error: 'User already exists',
        message: 'An account with this email already exists',
      })
      return
    }

    // Check if URN already exists
    const existingProfile = await prisma.studentProfile.findUnique({
      where: { enrollment_number: urn },
    })

    if (existingProfile) {
      console.log('URN already exists:', urn)
      res.status(409).json({
        success: false,
        error: 'URN already exists',
        message: 'A student with this URN already exists',
      })
      return
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user and student profile in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email: email.toLowerCase(),
          encrypted_password: hashedPassword,
          role: 'ROLE_STUDENT',
          is_active: true,
          email_verified: false,
        },
      })

      // Create student profile with all required fields
      const profile = await tx.studentProfile.create({
        data: {
          user_id: user.id,
          enrollment_number: urn,
          first_name: firstName,
          middle_name: middleName || null,
          last_name: lastName,
          mobile_number: mobileNumber,
          personal_email: email.toLowerCase(),
          department: department,
          // Required fields with defaults
          date_of_birth: new Date('2000-01-01'), // Placeholder - to be updated in profile
          gender: 'Prefer not to say', // Placeholder
          address_permanent: 'To be updated', // Placeholder
          degree: 'B.Tech', // Default - to be updated
          year_of_admission: new Date().getFullYear() - 2, // Estimate
          current_semester: 1, // Default
          expected_graduation_year: new Date().getFullYear() + 2, // Estimate
          preferred_job_roles: [],
          preferred_locations: [],
          profile_complete_percent: 30, // Basic info filled
          tpo_dept_verified: false,
          tpo_admin_verified: false,
        },
      })

      return { user, profile }
    })

    console.log('Student registered successfully:', email, 'URN:', urn)

    res.status(201).json({
      success: true,
      message: 'Registration successful! Please login to continue.',
      data: {
        user: {
          id: result.user.id,
          email: result.user.email,
          role: result.user.role,
        },
        profile: {
          id: result.profile.id,
          enrollmentNumber: result.profile.enrollment_number,
          firstName: result.profile.first_name,
          lastName: result.profile.last_name,
        },
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      })
      return
    }

    console.error('Student registration error:', error)
    res.status(500).json({
      success: false,
      error: 'Registration failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

// =====================================================
// POST /api/auth/register/recruiter
// Description: Recruiter registration
// =====================================================

router.post('/register/recruiter', async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request body
    const validatedData = registerRecruiterSchema.parse(req.body)
    const { email, password, organizationName, contactPerson, mobileNumber } = validatedData

    console.log('Recruiter registration attempt for:', email)

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (existingUser) {
      res.status(409).json({
        success: false,
        error: 'User already exists',
        message: 'An account with this email already exists',
      })
      return
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        encrypted_password: hashedPassword,
        role: 'ROLE_RECRUITER',
        is_active: false, // Requires TPO Admin verification
        email_verified: false,
      },
    })

    console.log('Recruiter registered successfully:', email)

    res.status(201).json({
      success: true,
      message: 'Registration successful! Your account is pending verification by TPO Admin.',
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      })
      return
    }

    console.error('Recruiter registration error:', error)
    res.status(500).json({
      success: false,
      error: 'Registration failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

// =====================================================
// POST /api/auth/logout
// Description: User logout
// =====================================================

router.post('/logout', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader?.substring(7) // Remove 'Bearer ' prefix

    if (token) {
      // Try to deactivate session (skip if table doesn't exist)
      try {
        await prisma.session.updateMany({
          where: {
            access_token: token,
            is_active: true,
          },
          data: {
            is_active: false,
          },
        })
      } catch (err) {
        console.log('Could not deactivate session (table may not exist)')
      }
    }

    res.json({
      success: true,
      message: 'Logout successful',
    })
  } catch (error) {
    console.error('Logout error:', error)
    res.status(500).json({
      success: false,
      error: 'Logout failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

// =====================================================
// GET /api/auth/me
// Description: Get current user info
// =====================================================

router.get('/me', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Not authenticated',
      })
      return
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        role: true,
        is_active: true,
        email_verified: true,
        created_at: true,
        last_login_at: true,
      },
    })

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      })
      return
    }

    res.json({
      success: true,
      data: { user },
    })
  } catch (error) {
    console.error('Get user error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get user info',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

// =====================================================
// POST /api/auth/refresh
// Description: Refresh access token
// =====================================================

router.post('/refresh', async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body

    if (!refreshToken) {
      res.status(400).json({
        success: false,
        error: 'Refresh token required',
      })
      return
    }

    // Try to find session (skip if table doesn't exist)
    try {
      const session = await prisma.session.findFirst({
        where: {
          refresh_token: refreshToken,
          is_active: true,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true,
              is_active: true,
            },
          },
        },
      })

      if (!session || !session.user.is_active) {
        res.status(401).json({
          success: false,
          error: 'Invalid refresh token',
        })
        return
      }

      // Generate new access token
      const newAccessToken = generateToken({
        userId: session.user.id,
        email: session.user.email,
        role: session.user.role,
      })

      // Update session
      await prisma.session.update({
        where: { id: session.id },
        data: {
          access_token: newAccessToken,
        },
      })

      res.json({
        success: true,
        data: {
          accessToken: newAccessToken,
          expiresIn: 86400,
        },
      })
    } catch (err) {
      console.log('Session table not available, refresh not supported')
      res.status(501).json({
        success: false,
        error: 'Refresh not supported',
        message: 'Session management not available',
      })
    }
  } catch (error) {
    console.error('Token refresh error:', error)
    res.status(500).json({
      success: false,
      error: 'Token refresh failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

export default router
