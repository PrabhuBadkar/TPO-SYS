import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyTables() {
  console.log('🔍 Verifying database tables...\n');

  try {
    // Check auth schema tables
    console.log('📋 AUTH SCHEMA:');
    const usersCount = await prisma.user.count();
    console.log(`  ✅ users: ${usersCount} records`);

    const sessionsCount = await prisma.session.count();
    console.log(`  ✅ sessions: ${sessionsCount} records`);

    // Check students schema tables
    console.log('\n📋 STUDENTS SCHEMA:');
    const studentProfilesCount = await prisma.studentProfile.count();
    console.log(`  ✅ student_profiles: ${studentProfilesCount} records`);

    // Check recruiters schema tables
    console.log('\n📋 RECRUITERS SCHEMA:');
    const organizationsCount = await prisma.organization.count();
    console.log(`  ✅ organizations: ${organizationsCount} records`);

    const pocsCount = await prisma.pOC.count();
    console.log(`  ✅ pocs: ${pocsCount} records`);

    const jobPostingsCount = await prisma.jobPosting.count();
    console.log(`  ✅ job_postings: ${jobPostingsCount} records`);

    const jobApplicationsCount = await prisma.jobApplication.count();
    console.log(`  ✅ job_applications: ${jobApplicationsCount} records`);

    const offersCount = await prisma.offer.count();
    console.log(`  ✅ offers: ${offersCount} records`);

    // Check core schema tables
    console.log('\n📋 CORE SCHEMA:');
    const notificationsCount = await prisma.notification.count();
    console.log(`  ✅ notifications: ${notificationsCount} records`);

    // Summary
    console.log('\n✅ All tables verified successfully!');
    console.log('\n📊 SUMMARY:');
    console.log(`  Total Users: ${usersCount}`);
    console.log(`  Total Students: ${studentProfilesCount}`);
    console.log(`  Total Organizations: ${organizationsCount}`);
    console.log(`  Total POCs: ${pocsCount}`);
    console.log(`  Total Job Postings: ${jobPostingsCount}`);
    console.log(`  Total Applications: ${jobApplicationsCount}`);
    console.log(`  Total Offers: ${offersCount}`);
    console.log(`  Total Notifications: ${notificationsCount}`);

  } catch (error) {
    console.error('❌ Error verifying tables:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

verifyTables();
