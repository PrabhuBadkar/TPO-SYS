import { prisma } from '../server';

interface EligibilityCriteria {
  degree?: string[];
  cgpa_min: number;
  max_backlogs: number;
  graduation_year: number;
  allowed_branches: string[];
}

interface EligibleStudent {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  department: string;
  cgpi: number;
  active_backlogs: number;
  graduation_year: number;
}

interface EligibilityResult {
  total_eligible: number;
  eligible_students: EligibleStudent[];
  department_breakdown: { department: string; count: number }[];
  cgpa_distribution: { cgpa: number; count: number }[];
  backlog_distribution: { backlogs: number; count: number }[];
}

export class EligibilityEngineService {
  /**
   * Run eligibility engine for a job posting
   * Finds all eligible students based on criteria
   */
  static async runEligibilityEngine(
    jobPostingId: string,
    criteria: EligibilityCriteria
  ): Promise<EligibilityResult> {
    console.log('🔍 Running Eligibility Engine for job:', jobPostingId);
    console.log('Criteria:', JSON.stringify(criteria, null, 2));

    // Build eligibility query
    const where: any = {
      tpo_admin_verified: true, // Only verified students
      is_active: true, // Only active students
    };

    // CGPA filter
    if (criteria.cgpa_min) {
      where.cgpi = {
        gte: criteria.cgpa_min,
      };
    }

    // Backlogs filter
    if (criteria.max_backlogs !== undefined) {
      where.active_backlogs = {
        lte: criteria.max_backlogs,
      };
    }

    // Department filter
    if (criteria.allowed_branches && criteria.allowed_branches.length > 0) {
      where.department = {
        in: criteria.allowed_branches,
      };
    }

    // Graduation year filter
    if (criteria.graduation_year) {
      where.graduation_year = criteria.graduation_year;
    }

    console.log('Query filters:', JSON.stringify(where, null, 2));

    // Get eligible students
    const eligibleStudents = await prisma.studentProfile.findMany({
      where,
      select: {
        id: true,
        user_id: true,
        first_name: true,
        last_name: true,
        email: true,
        department: true,
        cgpi: true,
        active_backlogs: true,
        graduation_year: true,
      },
    });

    console.log(`✅ Found ${eligibleStudents.length} eligible students`);

    // Calculate department breakdown
    const departmentMap = new Map<string, number>();
    eligibleStudents.forEach(student => {
      const count = departmentMap.get(student.department) || 0;
      departmentMap.set(student.department, count + 1);
    });
    const department_breakdown = Array.from(departmentMap.entries()).map(([department, count]) => ({
      department,
      count,
    }));

    // Calculate CGPA distribution
    const cgpaMap = new Map<number, number>();
    eligibleStudents.forEach(student => {
      const cgpa = Math.floor(student.cgpi * 10) / 10; // Round to 1 decimal
      const count = cgpaMap.get(cgpa) || 0;
      cgpaMap.set(cgpa, count + 1);
    });
    const cgpa_distribution = Array.from(cgpaMap.entries())
      .map(([cgpa, count]) => ({ cgpa, count }))
      .sort((a, b) => b.cgpa - a.cgpa);

    // Calculate backlog distribution
    const backlogMap = new Map<number, number>();
    eligibleStudents.forEach(student => {
      const count = backlogMap.get(student.active_backlogs) || 0;
      backlogMap.set(student.active_backlogs, count + 1);
    });
    const backlog_distribution = Array.from(backlogMap.entries())
      .map(([backlogs, count]) => ({ backlogs, count }))
      .sort((a, b) => a.backlogs - b.backlogs);

    return {
      total_eligible: eligibleStudents.length,
      eligible_students: eligibleStudents as EligibleStudent[],
      department_breakdown,
      cgpa_distribution,
      backlog_distribution,
    };
  }

  /**
   * Create notifications for eligible students
   */
  static async createNotifications(
    jobPostingId: string,
    eligibleStudents: EligibleStudent[],
    jobTitle: string,
    companyName: string
  ): Promise<number> {
    console.log(`📧 Creating notifications for ${eligibleStudents.length} students`);

    const notifications = eligibleStudents.map(student => ({
      user_id: student.user_id,
      type: 'NEW_JOB_POSTING',
      title: `New Job Opportunity: ${jobTitle}`,
      message: `${companyName} has posted a new job opportunity that matches your profile. Check it out!`,
      data: JSON.stringify({
        job_posting_id: jobPostingId,
        company_name: companyName,
        job_title: jobTitle,
      }),
      is_read: false,
      created_at: new Date(),
    }));

    // Create notifications in batches of 100
    const batchSize = 100;
    let created = 0;

    for (let i = 0; i < notifications.length; i += batchSize) {
      const batch = notifications.slice(i, i + batchSize);
      
      try {
        await prisma.notification.createMany({
          data: batch,
          skipDuplicates: true,
        });
        created += batch.length;
        console.log(`Created ${created}/${notifications.length} notifications`);
      } catch (error) {
        console.error('Error creating notification batch:', error);
      }
    }

    console.log(`✅ Created ${created} notifications`);
    return created;
  }

  /**
   * Send email notifications to eligible students
   */
  static async sendEmailNotifications(
    eligibleStudents: EligibleStudent[],
    jobTitle: string,
    companyName: string,
    jobPostingId: string
  ): Promise<number> {
    console.log(`📨 Sending email notifications to ${eligibleStudents.length} students`);

    // TODO: Implement actual email sending
    // For now, just log the emails that would be sent

    let sent = 0;

    for (const student of eligibleStudents) {
      const emailContent = {
        to: student.email,
        subject: `New Job Opportunity: ${jobTitle} at ${companyName}`,
        body: `
Dear ${student.first_name} ${student.last_name},

Great news! A new job opportunity has been posted that matches your profile.

Company: ${companyName}
Position: ${jobTitle}

Your Profile:
- Department: ${student.department}
- CGPA: ${student.cgpi}
- Graduation Year: ${student.graduation_year}

Login to the TPO portal to view details and apply:
http://localhost:3000/student/dashboard

Best regards,
Training & Placement Office
        `,
      };

      console.log(`📧 Email to ${student.email}:`, emailContent.subject);
      
      // TODO: Replace with actual email service
      // await emailService.send(emailContent);
      
      sent++;
    }

    console.log(`✅ Would send ${sent} emails (email service not implemented yet)`);
    return sent;
  }

  /**
   * Complete eligibility workflow
   * Runs engine, creates notifications, sends emails
   */
  static async processJobApproval(
    jobPostingId: string,
    jobTitle: string,
    companyName: string,
    criteria: EligibilityCriteria
  ): Promise<{
    total_eligible: number;
    notifications_created: number;
    emails_sent: number;
  }> {
    console.log('🚀 Starting eligibility workflow for job:', jobPostingId);
    console.log('Job:', jobTitle, 'at', companyName);

    // Step 1: Run eligibility engine
    const eligibilityResult = await this.runEligibilityEngine(jobPostingId, criteria);

    console.log('📊 Eligibility Results:');
    console.log(`  Total Eligible: ${eligibilityResult.total_eligible}`);
    console.log(`  Department Breakdown:`, eligibilityResult.department_breakdown);
    console.log(`  CGPA Distribution:`, eligibilityResult.cgpa_distribution.slice(0, 5));

    if (eligibilityResult.total_eligible === 0) {
      console.log('⚠️  No eligible students found');
      return {
        total_eligible: 0,
        notifications_created: 0,
        emails_sent: 0,
      };
    }

    // Step 2: Create in-app notifications
    const notifications_created = await this.createNotifications(
      jobPostingId,
      eligibilityResult.eligible_students,
      jobTitle,
      companyName
    );

    // Step 3: Send email notifications
    const emails_sent = await this.sendEmailNotifications(
      eligibilityResult.eligible_students,
      jobTitle,
      companyName,
      jobPostingId
    );

    console.log('✅ Eligibility workflow completed');
    console.log(`  Eligible Students: ${eligibilityResult.total_eligible}`);
    console.log(`  Notifications Created: ${notifications_created}`);
    console.log(`  Emails Sent: ${emails_sent}`);

    return {
      total_eligible: eligibilityResult.total_eligible,
      notifications_created,
      emails_sent,
    };
  }
}
