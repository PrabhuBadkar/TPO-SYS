const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function checkAdmin() {
  try {
    console.log('Checking admin user...\n');

    // Find admin user
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@tpo.edu' }
    });

    if (!admin) {
      console.log('❌ Admin user NOT found!');
      console.log('Creating new admin user...\n');
      
      // Create new admin
      const hashedPassword = await bcrypt.hash('password@123', 10);
      const newAdmin = await prisma.user.create({
        data: {
          email: 'admin@tpo.edu',
          encrypted_password: hashedPassword,
          role: 'ROLE_TPO_ADMIN',
          is_active: true,
          email_verified: true,
        }
      });
      
      console.log('✅ New admin created!');
      console.log('Email:', newAdmin.email);
      console.log('Role:', newAdmin.role);
      return;
    }

    console.log('✅ Admin user found!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Email:', admin.email);
    console.log('Role:', admin.role);
    console.log('Is Active:', admin.is_active);
    console.log('Email Verified:', admin.email_verified);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Test password
    console.log('Testing password: password@123');
    const isPasswordValid = await bcrypt.compare('password@123', admin.encrypted_password);
    
    if (isPasswordValid) {
      console.log('✅ Password is CORRECT!\n');
    } else {
      console.log('❌ Password is INCORRECT!');
      console.log('Updating password to: password@123\n');
      
      // Update password
      const hashedPassword = await bcrypt.hash('password@123', 10);
      await prisma.user.update({
        where: { id: admin.id },
        data: { encrypted_password: hashedPassword }
      });
      
      console.log('✅ Password updated successfully!\n');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Login Credentials:');
    console.log('Email: admin@tpo.edu');
    console.log('Password: password@123');
    console.log('URL: http://localhost:3000/tpo-admin/login');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdmin();
