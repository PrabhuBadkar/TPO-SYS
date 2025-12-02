import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...\n')

  // Clear existing data (in reverse order of dependencies)
  console.log('🧹 Cleaning existing data...')
  await prisma.jobApplication.deleteMany()
  await prisma.offer.deleteMany()
  await prisma.jobPosting.deleteMany()
  await prisma.recruiterPOC.deleteMany()
  await prisma.organization.deleteMany()
  await prisma.studentDocument.deleteMany()
  await prisma.eligibilityResult.deleteMany()
  await prisma.consent.deleteMany()
  await prisma.resume.deleteMany()
  await prisma.semesterMarks.deleteMany()
  await prisma.studentProfile.deleteMany()
  await prisma.tPODeptCoordinator.deleteMany()
  await prisma.session.deleteMany()
  await prisma.loginHistory.deleteMany()
  await prisma.user.deleteMany()
  console.log('✅ Cleaned existing data\n')

  // Hash password
  const password = await bcrypt.hash('password123', 10)

  // 1. Create Users
  console.log('👥 Creating users...')
  
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@acer.edu',
      encrypted_password: password,
      role: 'ROLE_TPO_ADMIN',
      is_active: true,
      email_verified: true,
    },
  })

  const deptUser = await prisma.user.create({
    data: {
      email: 'dept.cse@acer.edu',
      encrypted_password: password,
      role: 'ROLE_TPO_DEPT',
      is_active: true,
      email_verified: true,
    },
  })

  const student1User = await prisma.user.create({
    data: {
      email: 'student1@acer.edu',
      encrypted_password: password,
      role: 'ROLE_STUDENT',
      is_active: true,
      email_verified: true,
    },
  })

  const student2User = await prisma.user.create({
    data: {
      email: 'student2@acer.edu',
      encrypted_password: password,
      role: 'ROLE_STUDENT',
      is_active: true,
      email_verified: true,
    },
  })

  const recruiterUser = await prisma.user.create({
    data: {
      email: 'hr@techcorp.com',
      encrypted_password: password,
      role: 'ROLE_RECRUITER',
      is_active: true,
      email_verified: true,
    },
  })

  console.log('✅ Created 5 users\n')

  // 2. Create TPO Dept Coordinator
  console.log('👨‍💼 Creating TPO Dept Coordinator...')
  
  const deptCoord = await prisma.tPODeptCoordinator.create({
    data: {
      user_id: deptUser.id,
      dept_coordinator_name: 'Dr. Rajesh Kumar',
      employee_id: 'EMP001',
      email: 'dept.cse@acer.edu',
      mobile_number: '+91-9876543210',
      designation: 'Assistant Professor',
      primary_department: 'CSE',
      assigned_departments: ['CSE', 'IT'],
      is_active: true,
    },
  })

  console.log('✅ Created TPO Dept Coordinator\n')

  // 3. Create Student Profiles
  console.log('🎓 Creating student profiles...')
  
  const student1 = await prisma.studentProfile.create({
    data: {
      user_id: student1User.id,
      first_name: 'Amit',
      middle_name: 'Kumar',
      last_name: 'Sharma',
      mother_name: 'Sunita Sharma',
      date_of_birth: new Date('2002-05-15'),
      gender: 'Male',
      mobile_number: '+91-9876543211',
      personal_email: 'amit.sharma@gmail.com',
      address_permanent: '123, MG Road, Mumbai, Maharashtra - 400001',
      address_current: 'Hostel A, Room 101, ACER Campus',
      college_name: 'ACER',
      category: 'General',
      enrollment_number: '2021CSE001',
      roll_number: 'CSE21001',
      department: 'CSE',
      degree: 'B.Tech',
      year_of_admission: 2021,
      current_semester: 6,
      expected_graduation_year: 2025,
      cgpi: 8.5,
      active_backlogs: false,
      ssc_year_of_passing: 2018,
      ssc_board: 'CBSE',
      ssc_percentage: 92.5,
      hsc_year_of_passing: 2020,
      hsc_board: 'CBSE',
      hsc_percentage: 88.0,
      skills: { skills: ['JavaScript', 'React', 'Node.js', 'Python', 'SQL'] },
      preferred_job_roles: ['Software Developer', 'Full Stack Developer'],
      preferred_employment_type: 'Full-Time',
      preferred_locations: ['Mumbai', 'Pune', 'Bangalore'],
      expected_ctc_min: 600000,
      expected_ctc_max: 1200000,
      tpo_dept_verified: true,
      tpo_dept_verified_at: new Date(),
      tpo_dept_verified_by: deptUser.id,
      data_sharing_consent: true,
      profile_complete_percent: 95,
      profile_status: 'VERIFIED',
    },
  })

  const student2 = await prisma.studentProfile.create({
    data: {
      user_id: student2User.id,
      first_name: 'Priya',
      middle_name: 'Rajesh',
      last_name: 'Patel',
      mother_name: 'Meena Patel',
      date_of_birth: new Date('2002-08-20'),
      gender: 'Female',
      mobile_number: '+91-9876543212',
      personal_email: 'priya.patel@gmail.com',
      address_permanent: '456, Park Street, Ahmedabad, Gujarat - 380001',
      address_current: 'Hostel B, Room 205, ACER Campus',
      college_name: 'ACER',
      category: 'General',
      enrollment_number: '2021CSE002',
      roll_number: 'CSE21002',
      department: 'CSE',
      degree: 'B.Tech',
      year_of_admission: 2021,
      current_semester: 6,
      expected_graduation_year: 2025,
      cgpi: 9.2,
      active_backlogs: false,
      ssc_year_of_passing: 2018,
      ssc_board: 'GSEB',
      ssc_percentage: 95.0,
      hsc_year_of_passing: 2020,
      hsc_board: 'GSEB',
      hsc_percentage: 92.5,
      skills: { skills: ['Java', 'Spring Boot', 'Angular', 'MySQL', 'AWS'] },
      preferred_job_roles: ['Backend Developer', 'Cloud Engineer'],
      preferred_employment_type: 'Full-Time',
      preferred_locations: ['Ahmedabad', 'Bangalore', 'Hyderabad'],
      expected_ctc_min: 700000,
      expected_ctc_max: 1500000,
      tpo_dept_verified: true,
      tpo_dept_verified_at: new Date(),
      tpo_dept_verified_by: deptUser.id,
      data_sharing_consent: true,
      profile_complete_percent: 98,
      profile_status: 'VERIFIED',
    },
  })

  console.log('✅ Created 2 student profiles\n')

  // 4. Create Semester Marks
  console.log('📚 Creating semester marks...')
  
  await prisma.semesterMarks.createMany({
    data: [
      {
        student_id: student1.id,
        semester: 1,
        academic_year: '2021-22',
        subjects: [
          { code: 'CS101', name: 'Programming', credits: 4, grade: 'A', grade_points: 9 },
          { code: 'MA101', name: 'Mathematics', credits: 4, grade: 'A+', grade_points: 10 },
        ],
        total_credits: 20,
        earned_credits: 20,
        spi: 8.8,
        has_backlogs: false,
      },
      {
        student_id: student2.id,
        semester: 1,
        academic_year: '2021-22',
        subjects: [
          { code: 'CS101', name: 'Programming', credits: 4, grade: 'A+', grade_points: 10 },
          { code: 'MA101', name: 'Mathematics', credits: 4, grade: 'A+', grade_points: 10 },
        ],
        total_credits: 20,
        earned_credits: 20,
        spi: 9.5,
        has_backlogs: false,
      },
    ],
  })

  console.log('✅ Created semester marks\n')

  // 5. Create Organization
  console.log('🏢 Creating organization...')
  
  const organization = await prisma.organization.create({
    data: {
      organization_name: 'TechCorp Solutions',
      organization_type: 'PRODUCT',
      industry: 'Information Technology',
      website: 'https://techcorp.com',
      headquarters_location: 'Bangalore, Karnataka',
      employee_count: '1000-5000',
      founded_year: 2010,
      description: 'Leading software product company',
      is_verified: true,
      verified_by: adminUser.id,
      verified_at: new Date(),
      gst_number: '29ABCDE1234F1Z5',
      pan_number: 'ABCDE1234F',
    },
  })

  console.log('✅ Created organization\n')

  // 6. Create Recruiter POC
  console.log('👔 Creating recruiter POC...')
  
  const recruiterPOC = await prisma.recruiterPOC.create({
    data: {
      user_id: recruiterUser.id,
      organization_id: organization.id,
      full_name: 'Rahul Verma',
      designation: 'HR Manager',
      email: 'hr@techcorp.com',
      mobile_number: '+91-9876543213',
      is_primary: true,
      is_active: true,
      email_verified: true,
      mobile_verified: true,
    },
  })

  console.log('✅ Created recruiter POC\n')

  // 7. Create Job Posting
  console.log('💼 Creating job posting...')
  
  const jobPosting = await prisma.jobPosting.create({
    data: {
      organization_id: organization.id,
      created_by: recruiterUser.id,
      job_posting_id: 'JOB-2024-001',
      job_title: 'Software Development Engineer',
      job_description: 'Looking for talented software engineers to join our team',
      job_type: 'FULL_TIME',
      employment_type: 'PERMANENT',
      job_locations: ['Bangalore', 'Pune'],
      is_remote: false,
      relocation_provided: true,
      eligibility_criteria: {
        min_cgpa: 7.0,
        max_backlogs: 0,
        branches: ['CSE', 'IT'],
        graduation_year: 2025,
      },
      required_skills: ['JavaScript', 'React', 'Node.js'],
      preferred_skills: ['AWS', 'Docker', 'Kubernetes'],
      allowed_branches: ['CSE', 'IT'],
      graduation_years: [2025],
      cgpa_min: 7.0,
      max_backlogs: 0,
      ctc_min: 800000,
      ctc_max: 1200000,
      ctc_breakup: {
        base: 600000,
        hra: 200000,
        bonus: 200000,
        other: 200000,
      },
      bond_duration_months: 24,
      bond_amount: 200000,
      application_deadline: new Date('2024-12-31'),
      max_applications: 100,
      current_applications: 0,
      status: 'ACTIVE',
      approved_by: adminUser.id,
      approved_at: new Date(),
      published_at: new Date(),
    },
  })

  console.log('✅ Created job posting\n')

  // 8. Create Permissions
  console.log('🔐 Creating permissions...')
  
  const permissions = [
    // Student permissions
    { role: 'ROLE_STUDENT', resource: 'profile', action: 'read' },
    { role: 'ROLE_STUDENT', resource: 'profile', action: 'update' },
    { role: 'ROLE_STUDENT', resource: 'applications', action: 'create' },
    { role: 'ROLE_STUDENT', resource: 'applications', action: 'read' },
    
    // TPO Dept permissions
    { role: 'ROLE_TPO_DEPT', resource: 'students', action: 'read' },
    { role: 'ROLE_TPO_DEPT', resource: 'students', action: 'verify' },
    { role: 'ROLE_TPO_DEPT', resource: 'applications', action: 'review' },
    
    // TPO Admin permissions
    { role: 'ROLE_TPO_ADMIN', resource: '*', action: '*' },
    
    // Recruiter permissions
    { role: 'ROLE_RECRUITER', resource: 'jobs', action: 'create' },
    { role: 'ROLE_RECRUITER', resource: 'jobs', action: 'read' },
    { role: 'ROLE_RECRUITER', resource: 'applications', action: 'read' },
  ]

  await prisma.permission.createMany({ data: permissions })

  console.log('✅ Created permissions\n')

  console.log('🎉 Seeding completed successfully!\n')
  console.log('📊 Summary:')
  console.log('  - Users: 5 (1 admin, 1 dept, 2 students, 1 recruiter)')
  console.log('  - Student Profiles: 2')
  console.log('  - Organizations: 1')
  console.log('  - Job Postings: 1')
  console.log('  - Permissions: 11')
  console.log('\n✅ Database is ready for development!\n')
  console.log('🔑 Test Credentials:')
  console.log('  Admin:     admin@acer.edu / password123')
  console.log('  TPO Dept:  dept.cse@acer.edu / password123')
  console.log('  Student 1: student1@acer.edu / password123')
  console.log('  Student 2: student2@acer.edu / password123')
  console.log('  Recruiter: hr@techcorp.com / password123\n')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
