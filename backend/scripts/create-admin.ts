import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    console.log('🔧 Creating TPO Admin user...\n');

    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@tpo.edu' },
    });

    if (existingAdmin) {
      console.log('⚠️  Admin user already exists!');
      console.log('Email:', existingAdmin.email);
      console.log('Role:', existingAdmin.role);
      console.log('\nIf you want to reset the password, delete the user first.');
      return;
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash('password@123', 10);

    // Create the admin user
    const admin = await prisma.user.create({
      data: {
        email: 'admin@tpo.edu',
        encrypted_password: hashedPassword,
        role: 'ROLE_TPO_ADMIN',
        is_active: true,
        is_verified: true,
        email_verified_at: new Date(),
      },
    });

    console.log('✅ TPO Admin user created successfully!\n');
    console.log('📧 Email:', admin.email);
    console.log('🔑 Password: password@123');
    console.log('👤 Role:', admin.role);
    console.log('🆔 User ID:', admin.id);
    console.log('\n✨ You can now login with these credentials!');
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
