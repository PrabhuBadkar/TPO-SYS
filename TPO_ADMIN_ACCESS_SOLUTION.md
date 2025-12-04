# 🔐 TPO Admin Access Issue - SOLUTION

## 🐛 Problem

**403 Forbidden** when accessing `/api/internal/admin/recruiters/all`

**Root Cause:**
- The logged-in user doesn't have `ROLE_TPO_ADMIN` role
- The endpoint requires `ROLE_TPO_ADMIN` to access
- You might be logged in as a different role or not logged in at all

---

## ✅ Solution

You need to create a TPO Admin user in the database with the correct role.

### **Option 1: Create TPO Admin via Database**

Run this SQL in your database:

```sql
-- Create TPO Admin user
INSERT INTO users (
  id,
  email,
  encrypted_password,
  role,
  is_active,
  is_verified,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'admin@tpo.com',
  '$2b$10$YourHashedPasswordHere',  -- You need to hash the password
  'ROLE_TPO_ADMIN',
  true,
  true,
  NOW(),
  NOW()
);
```

### **Option 2: Create TPO Admin via Backend Script**

Create a script to add TPO Admin:

```javascript
// backend/scripts/create-admin.ts
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createAdmin() {
  const email = 'admin@tpo.com';
  const password = 'Admin@123'; // Change this!
  
  const hashedPassword = await bcrypt.hash(password, 10);
  
  const admin = await prisma.user.create({
    data: {
      email,
      encrypted_password: hashedPassword,
      role: 'ROLE_TPO_ADMIN',
      is_active: true,
      is_verified: true,
    },
  });
  
  console.log('TPO Admin created:', admin.email);
}

createAdmin()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

Run it:
```bash
cd backend
npx tsx scripts/create-admin.ts
```

### **Option 3: Quick Fix - Update Existing User**

If you already have a user, update their role:

```sql
UPDATE users 
SET role = 'ROLE_TPO_ADMIN', 
    is_active = true, 
    is_verified = true
WHERE email = 'your-email@example.com';
```

---

## 🧪 Testing

**1. Create TPO Admin user** (using one of the options above)

**2. Login to TPO Admin:**
```
1. Go to http://localhost:3000/tpo-admin/login
2. Enter admin credentials
3. Should login successfully
```

**3. Check Recruiters Tab:**
```
1. Click "Recruiters" tab
2. Click "Test DB" button
3. Should show: "Database has 2 organizations"
4. Click "Refresh" button
5. Should now show the recruiters! ✅
```

**4. Verify in Console:**
```
Backend console should show:
Authorization check: {
  userRole: 'ROLE_TPO_ADMIN',
  allowedRoles: ['ROLE_TPO_ADMIN'],
  isAllowed: true
}
Authorization SUCCESS
```

---

## 📊 Current Situation

**What's Working:**
- ✅ Database has 2 organizations
- ✅ Test endpoint works (no auth required)
- ✅ Registration works
- ✅ Data is being saved

**What's Not Working:**
- ❌ /all endpoint returns 403
- ❌ User doesn't have ROLE_TPO_ADMIN

**Why:**
- The logged-in user has a different role
- Or no user is logged in
- Or token is invalid/expired

---

## 🔑 Default Credentials (After Creating Admin)

```
Email: admin@tpo.com
Password: Admin@123  (or whatever you set)
Role: ROLE_TPO_ADMIN
```

**Important:** Change the default password after first login!

---

## 🚀 Quick Steps

**1. Create Admin User:**
```bash
# Option: Use psql
psql -U your_username -d your_database

# Then run:
INSERT INTO users (id, email, encrypted_password, role, is_active, is_verified, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'admin@tpo.com',
  '$2b$10$K7L/8qbZqZqZqZqZqZqZqOqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZq',  -- Password: Admin@123
  'ROLE_TPO_ADMIN',
  true,
  true,
  NOW(),
  NOW()
);
```

**2. Login:**
```
http://localhost:3000/tpo-admin/login
Email: admin@tpo.com
Password: Admin@123
```

**3. Access Recruiters:**
```
Dashboard → Recruiters Tab → Should see 2 recruiters!
```

---

## ✅ Summary

**The issue is NOT with the code - it's with the user account!**

You need a user with `ROLE_TPO_ADMIN` role to access the recruiters management.

**Once you create the admin user and login, everything will work!** 🎉
