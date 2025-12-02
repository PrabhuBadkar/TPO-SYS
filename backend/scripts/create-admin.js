const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    console.log('Creating TPO Admin user...');

    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@tpo.edu' }
    });

    if (existingAdmin) {
      console.log('❌ Admin user already exists!');
      console.log('Email:', existingAdmin.email);
      console.log('Role:', existingAdmin.role);
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
        email_verified: true,
      }
    });

    console.log('✅ TPO Admin user created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Email:', admin.email);
    console.log('Password: password@123');
    console.log('Role:', admin.role);
    console.log('ID:', admin.id);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\nYou can now login at: http://localhost:3000/tpo-admin/login');

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
