import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function testAdminLogin() {
  try {
    console.log('🧪 Testing Admin Login...\n');

    // Step 1: Find user
    console.log('Step 1: Finding user in database...');
    const user = await prisma.user.findUnique({
      where: { email: 'admin@tpo.edu' },
    });

    if (!user) {
      console.log('❌ User not found in database!');
      console.log('Run: npm run create-admin');
      return;
    }

    console.log('✅ User found:');
    console.log('   Email:', user.email);
    console.log('   Role:', user.role);
    console.log('   Active:', user.is_active);
    console.log('   Verified:', user.is_verified);
    console.log('');

    // Step 2: Test password
    console.log('Step 2: Testing password...');
    const passwordMatch = await bcrypt.compare('password@123', user.encrypted_password);
    
    if (!passwordMatch) {
      console.log('❌ Password does NOT match!');
      console.log('   Expected: password@123');
      console.log('   Hash in DB:', user.encrypted_password);
      return;
    }

    console.log('✅ Password matches!');
    console.log('');

    // Step 3: Check if active
    console.log('Step 3: Checking account status...');
    if (!user.is_active) {
      console.log('❌ Account is INACTIVE!');
      return;
    }

    console.log('✅ Account is active!');
    console.log('');

    // Summary
    console.log('═══════════════════════════════════════');
    console.log('✅ ALL CHECKS PASSED!');
    console.log('═══════════════════════════════════════');
    console.log('');
    console.log('Login credentials:');
    console.log('  Email: admin@tpo.edu');
    console.log('  Password: password@123');
    console.log('');
    console.log('If login still fails, the backend server');
    console.log('needs to be restarted to load the fixed code.');
    console.log('');
    console.log('To restart:');
    console.log('  1. Press Ctrl+C in backend terminal');
    console.log('  2. Run: npm run dev');
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAdminLogin();
