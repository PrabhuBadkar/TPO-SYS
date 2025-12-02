// Offer Service - Extend and Manage Job Offers
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface OfferData {
  application_id: string;
  ctc_breakdown: {
    base_salary: number;
    variable_pay: number;
    benefits: number;
    joining_bonus: number;
    total_ctc: number;
  };
  joining_date?: Date;
  offer_letter_url?: string;
  offer_expiry: Date;
}

export class OfferService {
  /**
   * Extend job offer to a candidate
   */
  static async extendOffer(userId: string, data: OfferData) {
    try {
      const poc = await prisma.pOC.findUnique({
        where: { user_id: userId }
      });

      if (!poc) {
        throw new Error('POC not found');
      }

      // Get application
      const application = await prisma.jobApplication.findUnique({
        where: { id: data.application_id },
        include: {
          jobPosting: true
        }
      });

      if (!application) {
        throw new Error('Application not found');
      }

      if (application.jobPosting.org_id !== poc.org_id) {
        throw new Error('Unauthorized to extend offer for this application');
      }

      if (!application.shortlisted) {
        throw new Error('Can only extend offers to shortlisted candidates');
      }

      // Check if offer already exists
      const existingOffer = await prisma.offer.findFirst({
        where: {
          application_id: data.application_id,
          status: { in: ['EXTENDED', 'ACCEPTED'] }
        }
      });

      if (existingOffer) {
        throw new Error('Offer already extended for this application');
      }

      // Validate CTC
      if (data.ctc_breakdown.total_ctc <= 0) {
        throw new Error('Total CTC must be greater than 0');
      }

      // Validate offer expiry
      const expiry = new Date(data.offer_expiry);
      if (expiry <= new Date()) {
        throw new Error('Offer expiry must be in the future');
      }

      // Create offer
      const offer = await prisma.offer.create({
        data: {
          student_id: application.student_id,
          job_posting_id: application.job_posting_id,
          application_id: data.application_id,
          ctc_breakdown: data.ctc_breakdown as any,
          joining_date: data.joining_date,
          offer_letter_url: data.offer_letter_url,
          offer_expiry: expiry,
          status: 'EXTENDED'
        }
      });

      // Update application status
      await prisma.jobApplication.update({
        where: { id: data.application_id },
        data: {
          status: 'OFFERED',
          updated_at: new Date()
        }
      });

      return {
        success: true,
        message: 'Offer extended successfully',
        data: offer
      };
    } catch (error: any) {
      console.error('Extend offer error:', error);
      throw new Error(error.message || 'Failed to extend offer');
    }
  }

  /**
   * Get all offers for recruiter's organization
   */
  static async getOffers(userId: string, filters?: {
    job_posting_id?: string;
    status?: string;
    date_from?: Date;
    date_to?: Date;
  }) {
    try {
      const poc = await prisma.pOC.findUnique({
        where: { user_id: userId }
      });

      if (!poc) {
        throw new Error('POC not found');
      }

      const where: any = {
        jobPosting: {
          org_id: poc.org_id
        }
      };

      if (filters?.job_posting_id) {
        where.job_posting_id = filters.job_posting_id;
      }

      if (filters?.status) {
        where.status = filters.status;
      }

      if (filters?.date_from || filters?.date_to) {
        where.created_at = {};
        if (filters.date_from) {
          where.created_at.gte = filters.date_from;
        }
        if (filters.date_to) {
          where.created_at.lte = filters.date_to;
        }
      }

      const offers = await prisma.offer.findMany({
        where,
        include: {
          jobPosting: {
            select: {
              id: true,
              job_title: true,
              employment_type: true,
              work_location: true
            }
          },
          application: {
            select: {
              id: true,
              created_at: true
            }
          }
        },
        orderBy: { created_at: 'desc' }
      });

      // Get student details for each offer
      const offersWithStudents = await Promise.all(
        offers.map(async (offer) => {
          const student = await prisma.studentProfile.findUnique({
            where: { id: offer.student_id },
            select: {
              id: true,
              first_name: true,
              middle_name: true,
              last_name: true,
              enrollment_number: true,
              department: true,
              degree: true,
              personal_email: true,
              mobile_number: true
            }
          });

          return {
            ...offer,
            student
          };
        })
      );

      return {
        success: true,
        data: offersWithStudents
      };
    } catch (error: any) {
      console.error('Get offers error:', error);
      throw new Error(error.message || 'Failed to get offers');
    }
  }

  /**
   * Get offer details
   */
  static async getOfferDetails(userId: string, offerId: string) {
    try {
      const poc = await prisma.pOC.findUnique({
        where: { user_id: userId }
      });

      if (!poc) {
        throw new Error('POC not found');
      }

      const offer = await prisma.offer.findUnique({
        where: { id: offerId },
        include: {
          jobPosting: {
            include: {
              organization: {
                select: {
                  org_name: true
                }
              }
            }
          },
          application: true
        }
      });

      if (!offer) {
        throw new Error('Offer not found');
      }

      if (offer.jobPosting.org_id !== poc.org_id) {
        throw new Error('Unauthorized to view this offer');
      }

      // Get student details
      const student = await prisma.studentProfile.findUnique({
        where: { id: offer.student_id },
        select: {
          id: true,
          first_name: true,
          middle_name: true,
          last_name: true,
          enrollment_number: true,
          department: true,
          degree: true,
          current_semester: true,
          expected_graduation_year: true,
          cgpi: true,
          personal_email: true,
          mobile_number: true,
          alternate_mobile: true
        }
      });

      return {
        success: true,
        data: {
          offer,
          student
        }
      };
    } catch (error: any) {
      console.error('Get offer details error:', error);
      throw new Error(error.message || 'Failed to get offer details');
    }
  }

  /**
   * Extend offer deadline
   */
  static async extendOfferDeadline(userId: string, offerId: string, newExpiry: Date) {
    try {
      const poc = await prisma.pOC.findUnique({
        where: { user_id: userId }
      });

      if (!poc) {
        throw new Error('POC not found');
      }

      const offer = await prisma.offer.findUnique({
        where: { id: offerId },
        include: {
          jobPosting: true
        }
      });

      if (!offer) {
        throw new Error('Offer not found');
      }

      if (offer.jobPosting.org_id !== poc.org_id) {
        throw new Error('Unauthorized to extend this offer deadline');
      }

      if (offer.status !== 'EXTENDED') {
        throw new Error('Can only extend deadline for pending offers');
      }

      const expiry = new Date(newExpiry);
      if (expiry <= new Date()) {
        throw new Error('New expiry must be in the future');
      }

      if (expiry <= offer.offer_expiry) {
        throw new Error('New expiry must be later than current expiry');
      }

      const updatedOffer = await prisma.offer.update({
        where: { id: offerId },
        data: {
          offer_expiry: expiry,
          updated_at: new Date()
        }
      });

      return {
        success: true,
        message: 'Offer deadline extended successfully',
        data: updatedOffer
      };
    } catch (error: any) {
      console.error('Extend offer deadline error:', error);
      throw new Error(error.message || 'Failed to extend offer deadline');
    }
  }

  /**
   * Rescind offer (requires TPO Admin approval)
   */
  static async rescindOffer(userId: string, offerId: string, reason: string) {
    try {
      const poc = await prisma.pOC.findUnique({
        where: { user_id: userId }
      });

      if (!poc) {
        throw new Error('POC not found');
      }

      if (!reason || reason.trim().length === 0) {
        throw new Error('Rescind reason is required');
      }

      const offer = await prisma.offer.findUnique({
        where: { id: offerId },
        include: {
          jobPosting: true
        }
      });

      if (!offer) {
        throw new Error('Offer not found');
      }

      if (offer.jobPosting.org_id !== poc.org_id) {
        throw new Error('Unauthorized to rescind this offer');
      }

      if (!['EXTENDED', 'ACCEPTED'].includes(offer.status)) {
        throw new Error('Can only rescind extended or accepted offers');
      }

      // Note: In production, this should trigger TPO Admin approval workflow
      // For now, we'll mark it as rescinded directly
      const updatedOffer = await prisma.offer.update({
        where: { id: offerId },
        data: {
          status: 'RESCINDED',
          rescinded_at: new Date(),
          rescinded_by: userId,
          rescind_reason: reason,
          updated_at: new Date()
        }
      });

      // Update application status
      await prisma.jobApplication.update({
        where: { id: offer.application_id },
        data: {
          status: 'REJECTED',
          rejection_reason: `Offer rescinded: ${reason}`,
          updated_at: new Date()
        }
      });

      return {
        success: true,
        message: 'Offer rescind request submitted. Awaiting TPO Admin approval.',
        data: updatedOffer
      };
    } catch (error: any) {
      console.error('Rescind offer error:', error);
      throw new Error(error.message || 'Failed to rescind offer');
    }
  }

  /**
   * Get offer statistics
   */
  static async getOfferStats(userId: string, jobPostingId?: string) {
    try {
      const poc = await prisma.pOC.findUnique({
        where: { user_id: userId }
      });

      if (!poc) {
        throw new Error('POC not found');
      }

      const where: any = {
        jobPosting: {
          org_id: poc.org_id
        }
      };

      if (jobPostingId) {
        where.job_posting_id = jobPostingId;
      }

      const [
        total,
        extended,
        accepted,
        rejected,
        expired,
        rescinded
      ] = await Promise.all([
        prisma.offer.count({ where }),
        prisma.offer.count({ where: { ...where, status: 'EXTENDED' } }),
        prisma.offer.count({ where: { ...where, status: 'ACCEPTED' } }),
        prisma.offer.count({ where: { ...where, status: 'REJECTED' } }),
        prisma.offer.count({ where: { ...where, status: 'EXPIRED' } }),
        prisma.offer.count({ where: { ...where, status: 'RESCINDED' } })
      ]);

      const acceptanceRate = total > 0 ? ((accepted / total) * 100).toFixed(2) : '0.00';

      return {
        success: true,
        data: {
          total,
          extended,
          accepted,
          rejected,
          expired,
          rescinded,
          acceptance_rate: `${acceptanceRate}%`
        }
      };
    } catch (error: any) {
      console.error('Get offer stats error:', error);
      throw new Error(error.message || 'Failed to get offer statistics');
    }
  }
}

export default OfferService;
