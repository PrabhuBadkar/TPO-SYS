/**
 * Job Matching Service
 * AI-powered job matching and recommendations
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface StudentProfile {
  id: string;
  department: string;
  cgpa: number;
  graduation_year: string;
  skills: string[];
  interests: string[];
  preferred_locations: string[];
  min_expected_ctc: number;
}

interface JobPosting {
  id: string;
  title: string;
  organization_id: string;
  required_skills: string[];
  preferred_skills: string[];
  min_cgpa: number;
  eligible_branches: string[];
  eligible_years: string[];
  ctc_min: number;
  ctc_max: number;
  location: string;
  work_mode: string;
}

interface JobMatch {
  job: JobPosting;
  match_score: number;
  match_reasons: string[];
  matching_skills: string[];
  missing_skills: string[];
}

/**
 * Job Matching Service
 */
export class JobMatchingService {
  /**
   * Get job recommendations for a student
   */
  async getRecommendations(studentId: string, limit: number = 10): Promise<any> {
    try {
      // Get student profile
      const student = await this.getStudentProfile(studentId);
      
      if (!student) {
        throw new Error('Student profile not found');
      }

      // Get eligible jobs
      const jobs = await this.getEligibleJobs(student);

      // Calculate match scores
      const matches = jobs.map(job => this.calculateMatch(student, job));

      // Sort by match score
      matches.sort((a, b) => b.match_score - a.match_score);

      // Return top matches
      const recommendations = matches.slice(0, limit);

      return {
        success: true,
        recommendations,
        total: matches.length,
      };
    } catch (error) {
      console.error('[JobMatching] Error getting recommendations:', error);
      throw error;
    }
  }

  /**
   * Get student profile
   */
  private async getStudentProfile(studentId: string): Promise<StudentProfile | null> {
    const user = await prisma.user.findUnique({
      where: { id: studentId },
      include: {
        studentProfile: true,
      },
    });

    if (!user || !user.studentProfile) {
      return null;
    }

    return {
      id: user.id,
      department: user.studentProfile.department,
      cgpa: user.studentProfile.cgpa,
      graduation_year: user.studentProfile.graduation_year,
      skills: user.studentProfile.skills || [],
      interests: user.studentProfile.interests || [],
      preferred_locations: user.studentProfile.preferred_locations || [],
      min_expected_ctc: user.studentProfile.min_expected_ctc || 0,
    };
  }

  /**
   * Get eligible jobs
   */
  private async getEligibleJobs(student: StudentProfile): Promise<JobPosting[]> {
    const jobs = await prisma.jobPosting.findMany({
      where: {
        status: 'approved',
        application_deadline: { gte: new Date() },
        min_cgpa: { lte: student.cgpa },
        eligible_branches: { has: student.department },
        eligible_years: { has: student.graduation_year },
      },
      include: {
        organization: {
          select: {
            name: true,
          },
        },
      },
    });

    return jobs.map(job => ({
      id: job.id,
      title: job.title,
      organization_id: job.organization_id,
      required_skills: job.required_skills || [],
      preferred_skills: job.preferred_skills || [],
      min_cgpa: job.min_cgpa,
      eligible_branches: job.eligible_branches,
      eligible_years: job.eligible_years,
      ctc_min: job.ctc_min,
      ctc_max: job.ctc_max,
      location: job.location,
      work_mode: job.work_mode,
    }));
  }

  /**
   * Calculate match score between student and job
   */
  private calculateMatch(student: StudentProfile, job: JobPosting): JobMatch {
    let score = 0;
    const reasons: string[] = [];
    const matchingSkills: string[] = [];
    const missingSkills: string[] = [];

    // 1. Skills match (40% weight)
    const requiredSkillsMatch = this.calculateSkillsMatch(
      student.skills,
      job.required_skills
    );
    const preferredSkillsMatch = this.calculateSkillsMatch(
      student.skills,
      job.preferred_skills
    );

    score += requiredSkillsMatch.percentage * 0.3; // 30% for required skills
    score += preferredSkillsMatch.percentage * 0.1; // 10% for preferred skills

    matchingSkills.push(...requiredSkillsMatch.matching);
    matchingSkills.push(...preferredSkillsMatch.matching);
    missingSkills.push(...requiredSkillsMatch.missing);

    if (requiredSkillsMatch.percentage >= 80) {
      reasons.push('Strong match on required skills');
    } else if (requiredSkillsMatch.percentage >= 60) {
      reasons.push('Good match on required skills');
    }

    // 2. CGPA match (20% weight)
    const cgpaScore = this.calculateCGPAScore(student.cgpa, job.min_cgpa);
    score += cgpaScore * 0.2;

    if (student.cgpa >= job.min_cgpa + 1) {
      reasons.push('CGPA exceeds requirement significantly');
    } else if (student.cgpa >= job.min_cgpa) {
      reasons.push('CGPA meets requirement');
    }

    // 3. CTC match (15% weight)
    const ctcScore = this.calculateCTCScore(student.min_expected_ctc, job.ctc_min, job.ctc_max);
    score += ctcScore * 0.15;

    if (job.ctc_max >= student.min_expected_ctc) {
      reasons.push('Salary meets expectations');
    }

    // 4. Location preference (10% weight)
    const locationScore = this.calculateLocationScore(student.preferred_locations, job.location);
    score += locationScore * 0.1;

    if (locationScore > 0) {
      reasons.push('Preferred location match');
    }

    // 5. Work mode preference (5% weight)
    if (job.work_mode === 'remote' || job.work_mode === 'hybrid') {
      score += 5;
      reasons.push('Flexible work mode available');
    }

    // 6. Department alignment (10% weight)
    if (job.eligible_branches.includes(student.department)) {
      score += 10;
      reasons.push('Department is eligible');
    }

    return {
      job,
      match_score: Math.min(100, Math.round(score)),
      match_reasons: reasons,
      matching_skills: [...new Set(matchingSkills)],
      missing_skills: [...new Set(missingSkills)],
    };
  }

  /**
   * Calculate skills match
   */
  private calculateSkillsMatch(
    studentSkills: string[],
    requiredSkills: string[]
  ): { percentage: number; matching: string[]; missing: string[] } {
    if (requiredSkills.length === 0) {
      return { percentage: 100, matching: [], missing: [] };
    }

    const studentSkillsLower = studentSkills.map(s => s.toLowerCase());
    const requiredSkillsLower = requiredSkills.map(s => s.toLowerCase());

    const matching = requiredSkillsLower.filter(skill =>
      studentSkillsLower.includes(skill)
    );

    const missing = requiredSkillsLower.filter(skill =>
      !studentSkillsLower.includes(skill)
    );

    const percentage = (matching.length / requiredSkillsLower.length) * 100;

    return {
      percentage,
      matching: requiredSkills.filter(s => matching.includes(s.toLowerCase())),
      missing: requiredSkills.filter(s => missing.includes(s.toLowerCase())),
    };
  }

  /**
   * Calculate CGPA score
   */
  private calculateCGPAScore(studentCGPA: number, minCGPA: number): number {
    if (studentCGPA >= minCGPA + 2) return 20; // Excellent
    if (studentCGPA >= minCGPA + 1) return 15; // Very good
    if (studentCGPA >= minCGPA + 0.5) return 10; // Good
    if (studentCGPA >= minCGPA) return 5; // Meets requirement
    return 0; // Below requirement
  }

  /**
   * Calculate CTC score
   */
  private calculateCTCScore(expectedCTC: number, minCTC: number, maxCTC: number): number {
    if (expectedCTC === 0) return 15; // No preference
    if (maxCTC >= expectedCTC + 2) return 15; // Exceeds significantly
    if (maxCTC >= expectedCTC) return 10; // Meets expectation
    if (minCTC >= expectedCTC * 0.8) return 5; // Close to expectation
    return 0; // Below expectation
  }

  /**
   * Calculate location score
   */
  private calculateLocationScore(preferredLocations: string[], jobLocation: string): number {
    if (preferredLocations.length === 0) return 10; // No preference
    
    const locationLower = jobLocation.toLowerCase();
    const hasMatch = preferredLocations.some(loc => 
      locationLower.includes(loc.toLowerCase()) || loc.toLowerCase().includes(locationLower)
    );

    return hasMatch ? 10 : 0;
  }

  /**
   * Get similar students who got placed
   */
  async getSimilarPlacedStudents(studentId: string, limit: number = 5): Promise<any> {
    try {
      const student = await this.getStudentProfile(studentId);
      
      if (!student) {
        throw new Error('Student profile not found');
      }

      // Find students with similar profiles who got placed
      const placedStudents = await prisma.offer.findMany({
        where: {
          status: 'accepted',
          student: {
            studentProfile: {
              department: student.department,
              graduation_year: student.graduation_year,
              cgpa: {
                gte: student.cgpa - 0.5,
                lte: student.cgpa + 0.5,
              },
            },
          },
        },
        take: limit,
        include: {
          student: {
            select: {
              studentProfile: {
                select: {
                  full_name: true,
                  department: true,
                  cgpa: true,
                  skills: true,
                },
              },
            },
          },
          job: {
            select: {
              title: true,
              organization: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });

      return {
        success: true,
        similar_students: placedStudents,
      };
    } catch (error) {
      console.error('[JobMatching] Error getting similar students:', error);
      throw error;
    }
  }

  /**
   * Get skill gap analysis
   */
  async getSkillGapAnalysis(studentId: string): Promise<any> {
    try {
      const student = await this.getStudentProfile(studentId);
      
      if (!student) {
        throw new Error('Student profile not found');
      }

      // Get all active jobs
      const jobs = await this.getEligibleJobs(student);

      // Collect all required skills
      const allRequiredSkills: Record<string, number> = {};
      jobs.forEach(job => {
        job.required_skills.forEach(skill => {
          allRequiredSkills[skill] = (allRequiredSkills[skill] || 0) + 1;
        });
      });

      // Find missing skills
      const studentSkillsLower = student.skills.map(s => s.toLowerCase());
      const missingSkills = Object.entries(allRequiredSkills)
        .filter(([skill]) => !studentSkillsLower.includes(skill.toLowerCase()))
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([skill, count]) => ({
          skill,
          demand: count,
          priority: count > jobs.length * 0.5 ? 'high' : count > jobs.length * 0.25 ? 'medium' : 'low',
        }));

      return {
        success: true,
        current_skills: student.skills,
        missing_skills: missingSkills,
        total_jobs_analyzed: jobs.length,
      };
    } catch (error) {
      console.error('[JobMatching] Error getting skill gap:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const jobMatchingService = new JobMatchingService();
