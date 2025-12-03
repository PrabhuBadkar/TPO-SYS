# 🔐 TPO Admin Credentials

## ✅ Admin User Created Successfully!

### Login Credentials:

| Field | Value |
|-------|-------|
| **Email** | `admin@tpo.edu` |
| **Password** | `password@123` |
| **Role** | `ROLE_TPO_ADMIN` |
| **User ID** | `4b17b9c8-0702-46a1-a4fa-10de930a815b` |

---

## 🚀 How to Login

### Option 1: Using API

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@tpo.edu",
    "password": "password@123"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "4b17b9c8-0702-46a1-a4fa-10de930a815b",
      "email": "admin@tpo.edu",
      "role": "ROLE_TPO_ADMIN",
      "emailVerified": true
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": 86400
    }
  }
}
```

### Option 2: Using Frontend

1. Go to: `http://localhost:5173` (or your frontend URL)
2. Click on **TPO Admin** card
3. Enter credentials:
   - Email: `admin@tpo.edu`
   - Password: `password@123`
4. Click **Login**

---

## 🔧 Managing Admin User

### Create Another Admin

```bash
cd backend
npm run create-admin
```

**Note:** The script will check if the user already exists and prevent duplicates.

### Reset Admin Password

If you need to reset the password, you can:

1. **Delete the existing user:**
   ```bash
   npx prisma studio
   # Navigate to users table
   # Find admin@tpo.edu
   # Delete the record
   ```

2. **Run create-admin again:**
   ```bash
   npm run create-admin
   ```

### View Admin in Database

```bash
cd backend
npx prisma studio
```

Then navigate to:
- Schema: `auth`
- Table: `users`
- Find: `admin@tpo.edu`

---

## 📊 Admin Capabilities

As a TPO Admin, you can:

- ✅ View all students
- ✅ Verify student profiles
- ✅ Approve/reject job postings
- ✅ Verify recruiters
- ✅ Manage applications
- ✅ View analytics and reports
- ✅ Manage calendar events
- ✅ Send communications
- ✅ Access all admin endpoints

---

## 🔒 Security Notes

### ⚠️ Important:

1. **Change the password** after first login in production
2. **Don't commit** this file to git (it's in .gitignore)
3. **Use strong passwords** in production
4. **Enable MFA** for admin accounts in production

### Production Checklist:

- [ ] Change default password
- [ ] Enable MFA
- [ ] Use environment-specific credentials
- [ ] Rotate JWT secrets
- [ ] Enable rate limiting
- [ ] Set up audit logging

---

## 🧪 Testing Admin Access

### Test Dashboard Access

```bash
# 1. Login to get token
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@tpo.edu","password":"password@123"}' \
  | jq -r '.data.tokens.accessToken')

# 2. Access admin dashboard
curl http://localhost:5000/api/internal/admin/stats/overview \
  -H "Authorization: Bearer $TOKEN"
```

**Expected:** JSON response with dashboard statistics

---

## 📝 Script Location

The admin creation script is located at:
```
backend/scripts/create-admin.ts
```

You can modify it to:
- Create different admin users
- Set different roles
- Add additional fields

---

## 🎯 Quick Reference

**Login Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "email": "admin@tpo.edu",
  "password": "password@123"
}
```

**Admin Dashboard:** `GET /api/internal/admin/stats/overview`

**Required Header:** `Authorization: Bearer <token>`

---

**Created:** 2024-12-03  
**Status:** ✅ Active  
**Environment:** Development
