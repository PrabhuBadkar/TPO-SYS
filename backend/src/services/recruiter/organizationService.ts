// Organization Service - Recruiter Registration and Management
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

interface OrganizationRegistrationData {
  // Company Details
  org_name: string;
  website?: string;
  industry?: string;
  size?: string;
  headquarters?: string;
  branch_offices?: string[];
  year_established?: number;
  description?: string;
  
  // Legal Verification
  gst_number?: string;
  cin?: string;
  pan?: string;
  registration_cert_url?: string;
  authorization_letter_url?: string;
  
  // POC Details
  poc_name: string;
  designation: string;
  department?: string;
  email: string;
  mobile_number: string;
  linkedin_profile?: string;
  password: string;
}

interface OrganizationUpdateData {
  org_name?: string;
  website?: string;
  industry?: string;
  size?: string;
  headquarters?: string;
  branch_offices?: string[];
  year_established?: number;
  description?: string;
  gst_number?: string;
  cin?: string;
  pan?: string;
  registration_cert_url?: string;
  authorization_letter_url?: string;
}

export class OrganizationService {
  /**
   * Register a new organization with POC
   */
  static async registerOrganization(data: OrganizationRegistrationData) {
    try {
      // Check if email already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email }
      });

      if (existingUser) {
        throw new Error('Email already registered');
      }

      // Validate POC email domain matches organization domain
      if (data.website) {
        const orgDomain = new URL(data.website).hostname.replace('www.', '');
        const emailDomain = data.email.split('@')[1];
        
        // Allow exceptions for common email providers (will require manual verification)
        const commonProviders = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com'];
        if (!commonProviders.includes(emailDomain) && !emailDomain.includes(orgDomain)) {
          console.warn(`Email domain mismatch: ${emailDomain} vs ${orgDomain}`);
        }
      }

      // Hash password
      const password_hash = await bcrypt.hash(data.password, 12);

      // Create organization, user, and POC in a transaction
      const result = await prisma.$transaction(async (tx) => {
        // Create organization
        const organization = await tx.organization.create({
          data: {
            org_name: data.org_name,
            website: data.website,
            industry: data.industry,
            size: data.size,
            headquarters: data.headquarters,
            branch_offices: data.branch_offices || [],
            year_established: data.year_established,
            description: data.description,
            gst_number: data.gst_number,
            cin: data.cin,
            pan: data.pan,
            registration_cert_url: data.registration_cert_url,
            authorization_letter_url: data.authorization_letter_url,
            recruiter_status: 'PENDING_VERIFICATION'
          }
        });

        // Create user account for POC
        const user = await tx.user.create({
          data: {
            email: data.email,
            mobile_number: data.mobile_number,
            password_hash,
            role: 'ROLE_RECRUITER',
            is_active: true,
            is_verified: false
          }
        });

        // Create POC
        const poc = await tx.pOC.create({
          data: {
            org_id: organization.id,
            user_id: user.id,
            poc_name: data.poc_name,
            designation: data.designation,
            department: data.department,
            email: data.email,
            mobile_number: data.mobile_number,
            linkedin_profile: data.linkedin_profile,
            is_primary: true,
            is_active: true
          }
        });

        return { organization, user, poc };
      });

      return {
        success: true,
        message: 'Organization registered successfully. Awaiting TPO Admin verification.',
        data: {
          organization_id: result.organization.id,
          org_name: result.organization.org_name,
          status: result.organization.recruiter_status,
          poc_email: result.user.email
        }
      };
    } catch (error: any) {
      console.error('Organization registration error:', error);
      throw new Error(error.message || 'Failed to register organization');
    }
  }

  /**
   * Get organization verification status
   */
  static async getVerificationStatus(userId: string) {
    try {
      const poc = await prisma.pOC.findUnique({
        where: { user_id: userId },
        include: {
          organization: {
            select: {
              id: true,
              org_name: true,
              recruiter_status: true,
              verified_at: true,
              rejection_reason: true,
              created_at: true
            }
          }
        }
      });

      if (!poc) {
        throw new Error('POC not found');
      }

      return {
        success: true,
        data: {
          organization_id: poc.organization.id,
          org_name: poc.organization.org_name,
          status: poc.organization.recruiter_status,
          verified_at: poc.organization.verified_at,
          rejection_reason: poc.organization.rejection_reason,
          registered_at: poc.organization.created_at
        }
      };
    } catch (error: any) {
      console.error('Get verification status error:', error);
      throw new Error(error.message || 'Failed to get verification status');
    }
  }

  /**
   * Update organization details (only if pending verification or more info requested)
   */
  static async updateOrganization(userId: string, data: OrganizationUpdateData) {
    try {
      const poc = await prisma.pOC.findUnique({
        where: { user_id: userId },
        include: { organization: true }
      });

      if (!poc) {
        throw new Error('POC not found');
      }

      // Only allow updates if pending verification or rejected
      if (!['PENDING_VERIFICATION', 'REJECTED'].includes(poc.organization.recruiter_status)) {
        throw new Error('Organization details cannot be updated after verification');
      }

      const updatedOrg = await prisma.organization.update({
        where: { id: poc.org_id },
        data: {
          ...data,
          recruiter_status: 'PENDING_VERIFICATION', // Reset to pending after update
          updated_at: new Date()
        }
      });

      return {
        success: true,
        message: 'Organization details updated successfully',
        data: updatedOrg
      };
    } catch (error: any) {
      console.error('Update organization error:', error);
      throw new Error(error.message || 'Failed to update organization');
    }
  }

  /**
   * Get organization details
   */
  static async getOrganizationDetails(userId: string) {
    try {
      const poc = await prisma.pOC.findUnique({
        where: { user_id: userId },
        include: {
          organization: true,
          jobPostings: {
            select: {
              id: true,
              job_title: true,
              status: true,
              created_at: true
            },
            orderBy: { created_at: 'desc' },
            take: 5
          }
        }
      });

      if (!poc) {
        throw new Error('POC not found');
      }

      return {
        success: true,
        data: {
          organization: poc.organization,
          poc: {
            id: poc.id,
            poc_name: poc.poc_name,
            designation: poc.designation,
            department: poc.department,
            email: poc.email,
            mobile_number: poc.mobile_number,
            is_primary: poc.is_primary
          },
          recent_job_postings: poc.jobPostings
        }
      };
    } catch (error: any) {
      console.error('Get organization details error:', error);
      throw new Error(error.message || 'Failed to get organization details');
    }
  }

  /**
   * Request additional POC
   */
  static async requestAdditionalPOC(userId: string, pocData: {
    poc_name: string;
    designation: string;
    department?: string;
    email: string;
    mobile_number: string;
    linkedin_profile?: string;
    password: string;
  }) {
    try {
      const primaryPOC = await prisma.pOC.findUnique({
        where: { user_id: userId },
        include: { organization: true }
      });

      if (!primaryPOC) {
        throw new Error('Primary POC not found');
      }

      if (!primaryPOC.is_primary) {
        throw new Error('Only primary POC can add additional POCs');
      }

      if (primaryPOC.organization.recruiter_status !== 'VERIFIED') {
        throw new Error('Organization must be verified before adding additional POCs');
      }

      // Check if email already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: pocData.email }
      });

      if (existingUser) {
        throw new Error('Email already registered');
      }

      // Hash password
      const password_hash = await bcrypt.hash(pocData.password, 12);

      // Create user and POC
      const result = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email: pocData.email,
            mobile_number: pocData.mobile_number,
            password_hash,
            role: 'ROLE_RECRUITER',
            is_active: true,
            is_verified: true // Auto-verify since org is already verified
          }
        });

        const poc = await tx.pOC.create({
          data: {
            org_id: primaryPOC.org_id,
            user_id: user.id,
            poc_name: pocData.poc_name,
            designation: pocData.designation,
            department: pocData.department,
            email: pocData.email,
            mobile_number: pocData.mobile_number,
            linkedin_profile: pocData.linkedin_profile,
            is_primary: false,
            is_active: true
          }
        });

        return { user, poc };
      });

      return {
        success: true,
        message: 'Additional POC added successfully',
        data: {
          poc_id: result.poc.id,
          poc_name: result.poc.poc_name,
          email: result.poc.email
        }
      };
    } catch (error: any) {
      console.error('Add additional POC error:', error);
      throw new Error(error.message || 'Failed to add additional POC');
    }
  }

  /**
   * Get all POCs for organization
   */
  static async getOrganizationPOCs(userId: string) {
    try {
      const poc = await prisma.pOC.findUnique({
        where: { user_id: userId }
      });

      if (!poc) {
        throw new Error('POC not found');
      }

      const allPOCs = await prisma.pOC.findMany({
        where: { org_id: poc.org_id },
        select: {
          id: true,
          poc_name: true,
          designation: true,
          department: true,
          email: true,
          mobile_number: true,
          is_primary: true,
          is_active: true,
          created_at: true
        },
        orderBy: [
          { is_primary: 'desc' },
          { created_at: 'asc' }
        ]
      });

      return {
        success: true,
        data: allPOCs
      };
    } catch (error: any) {
      console.error('Get organization POCs error:', error);
      throw new Error(error.message || 'Failed to get organization POCs');
    }
  }
}

export default OrganizationService;
