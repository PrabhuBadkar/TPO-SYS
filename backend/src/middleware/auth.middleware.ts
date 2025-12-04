import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { prisma } from '../server'

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      id?: string
      user?: {
        id: string
        email: string
        role: string
      }
    }
  }
}

// JWT payload interface
interface JWTPayload {
  userId: string
  email: string
  role: string
  iat?: number
  exp?: number
}

// =====================================================
// Authentication Middleware
// =====================================================

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'No token provided',
        message: 'Authorization header must be in format: Bearer <token>',
      })
      return
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix

    // Verify token
    const secret = process.env.JWT_SECRET
    if (!secret) {
      throw new Error('JWT_SECRET not configured')
    }

    const decoded = jwt.verify(token, secret) as JWTPayload

    // Check if user exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true,
        is_active: true,
      },
    })

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'User not found',
        message: 'The user associated with this token no longer exists',
      })
      return
    }

    if (!user.is_active) {
      res.status(401).json({
        success: false,
        error: 'Account inactive',
        message: 'Your account has been deactivated',
      })
      return
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
    }

    next()
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        error: 'Token expired',
        message: 'Your session has expired. Please login again.',
      })
      return
    }

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        error: 'Invalid token',
        message: 'The provided token is invalid',
      })
      return
    }

    res.status(500).json({
      success: false,
      error: 'Authentication error',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

// =====================================================
// Role-Based Authorization Middleware
// =====================================================

export const authorize = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      console.log('Authorization failed: No user in request');
      res.status(401).json({
        success: false,
        error: 'Not authenticated',
        message: 'You must be logged in to access this resource',
      })
      return
    }

    console.log('Authorization check:', {
      userRole: req.user.role,
      allowedRoles,
      isAllowed: allowedRoles.includes(req.user.role),
    });

    if (!allowedRoles.includes(req.user.role)) {
      console.log(`Authorization DENIED: User has role '${req.user.role}', required: ${allowedRoles.join(', ')}`);
      res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: `Access denied. Required roles: ${allowedRoles.join(', ')}`,
        userRole: req.user.role,
      })
      return
    }

    console.log('Authorization SUCCESS');
    next()
  }
}

// =====================================================
// Optional Authentication (for public routes that can benefit from user context)
// =====================================================

export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue without user context
      next()
      return
    }

    const token = authHeader.substring(7)
    const secret = process.env.JWT_SECRET

    if (!secret) {
      next()
      return
    }

    const decoded = jwt.verify(token, secret) as JWTPayload

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true,
        is_active: true,
      },
    })

    if (user && user.is_active) {
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
      }
    }

    next()
  } catch (error) {
    // Ignore errors for optional auth
    next()
  }
}

// =====================================================
// Role Constants
// =====================================================

export const ROLES = {
  STUDENT: 'ROLE_STUDENT',
  TPO_DEPT: 'ROLE_TPO_DEPT',
  TPO_ADMIN: 'ROLE_TPO_ADMIN',
  RECRUITER: 'ROLE_RECRUITER',
} as const

// =====================================================
// Helper Functions
// =====================================================

export const generateToken = (payload: Omit<JWTPayload, 'iat' | 'exp'>): string => {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET not configured')
  }

  const expiresIn = process.env.JWT_EXPIRY || '24h'

  return jwt.sign(payload, secret, { expiresIn })
}

export const generateRefreshToken = (payload: Omit<JWTPayload, 'iat' | 'exp'>): string => {
  const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_REFRESH_SECRET not configured')
  }

  const expiresIn = process.env.JWT_REFRESH_EXPIRY || '7d'

  return jwt.sign(payload, secret, { expiresIn })
}
