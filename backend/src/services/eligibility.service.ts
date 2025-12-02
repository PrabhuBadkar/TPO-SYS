/**
 * Eligibility Service
 * Computes student eligibility for job postings based on criteria
 */

interface Student {
  cgpi: number | null
  active_backlogs: number
  department: string
  expected_graduation_year: number
  profile_complete_percent: number
  tpo_dept_verified: boolean
}

interface JobPosting {
  cgpa_min: number
  max_backlogs: number
  allowed_branches: string[]
  graduation_years: number[]
}

interface EligibilityResult {
  isEligible: boolean
  reasons: string[]
}

/**
 * Check if a student is eligible for a specific job posting
 */
export const checkEligibility = (
  student: Student,
  job: JobPosting
): EligibilityResult => {
  const reasons: string[] = []

  // Check profile verification
  if (!student.tpo_dept_verified) {
    reasons.push('PROFILE_NOT_VERIFIED')
  }

  // Check profile completion
  if (student.profile_complete_percent < 80) {
    reasons.push('PROFILE_INCOMPLETE')
  }

  // Check CGPA
  if (student.cgpi === null || student.cgpi < job.cgpa_min) {
    reasons.push('CGPA_LOW')
  }

  // Check backlogs
  if (student.active_backlogs > job.max_backlogs) {
    reasons.push('BACKLOG_EXCEEDED')
  }

  // Check department/branch
  if (!job.allowed_branches.includes(student.department)) {
    reasons.push('BRANCH_MISMATCH')
  }

  // Check graduation year
  if (!job.graduation_years.includes(student.expected_graduation_year)) {
    reasons.push('GRADUATION_YEAR_MISMATCH')
  }

  return {
    isEligible: reasons.length === 0,
    reasons,
  }
}

/**
 * Get human-readable reason messages
 */
export const getReasonMessage = (reason: string): string => {
  const messages: Record<string, string> = {
    PROFILE_NOT_VERIFIED: 'Profile not verified by TPO',
    PROFILE_INCOMPLETE: 'Profile completion must be at least 80%',
    CGPA_LOW: 'CGPA below minimum requirement',
    BACKLOG_EXCEEDED: 'Active backlogs exceed maximum allowed',
    BRANCH_MISMATCH: 'Your department is not eligible',
    GRADUATION_YEAR_MISMATCH: 'Graduation year does not match',
  }

  return messages[reason] || reason
}

/**
 * Batch check eligibility for multiple jobs
 */
export const checkEligibilityBatch = (
  student: Student,
  jobs: JobPosting[]
): Map<string, EligibilityResult> => {
  const results = new Map<string, EligibilityResult>()

  jobs.forEach((job: any) => {
    results.set(job.id, checkEligibility(student, job))
  })

  return results
}
