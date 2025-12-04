import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createTPOAdmin() {
  try {
    const email = 'admin@tpo.com';
    const password = 'Admin@123'; // Change this after first login!
    
    console.log('Creating TPO Admin user...');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('');
    
    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email },
    });
    
    if (existing) {
      console.log('❌ User already exists with this email!');
      console.log('Updating role to ROLE_TPO_ADMIN...');
      
      const updated = await prisma.user.update({
        where: { email },
        data: {
          role: 'ROLE_TPO_ADMIN',
          is_active: true,
          is_verified: true,
        },
      });
      
      console.log('✅ User updated successfully!');
      console.log('User ID:', updated.id);
      console.log('Role:', updated.role);
      return;
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create admin user
    const admin = await prisma.user.create({
      data: {
        email,
        encrypted_password: hashedPassword,
        role: 'ROLE_TPO_ADMIN',
        is_active: true,
        is_verified: true,
      },
    });
    
    console.log('✅ TPO Admin created successfully!');
    console.log('');
    console.log('Login Credentials:');
    console.log('==================');
    console.log('URL: http://localhost:3000/tpo-admin/login');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('');
    console.log('⚠️  IMPORTANT: Change the password after first login!');
    
  } catch (error) {
    console.error('❌ Error creating TPO Admin:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createTPOAdmin()
  .then(() => {
    console.log('');
    console.log('Done! You can now login to TPO Admin dashboard.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed:', error);
    process.exit(1);
  });
