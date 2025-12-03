# 🔴 DATABASE MISMATCH - Root Cause Found!

## 🔍 The Problem

**Admin user exists in Database A, but backend connects to Database B!**

### Database A (Correct - Has Admin User):
```
Host: ep-hidden-glade-a4ob20yk-pooler.us-east-1.aws.neon.tech
Database: neondb
Status: ✅ Admin user exists here
```

### Database B (Wrong - Empty):
```
Host: ep-shy-credit-ade8wr68-pooler.c-2.us-east-1.aws.neon.tech
Database: tpo
Status: ❌ Backend trying to connect here (unreachable)
```

---

## 🎯 Root Cause

**System environment variable is overriding .env file!**

```bash
# System environment variable (WRONG):
$ printenv DATABASE_URL
postgresql://...@ep-shy-credit-ade8wr68.../tpo

# .env file (CORRECT):
DATABASE_URL="postgresql://...@ep-hidden-glade-a4ob20yk.../neondb"
```

**Environment variables take precedence over .env files**, so the backend ignores the `.env` file and uses the wrong database!

---

## ✅ SOLUTION - Option 1: Use Startup Script

### **Stop current backend:**
```bash
Ctrl + C
```

### **Start with correct database:**
```bash
cd /home/aki/TPO-SYS/backend
./start-backend-correct-db.sh
```

This script:
1. Unsets the wrong DATABASE_URL
2. Sets the correct DATABASE_URL
3. Starts the backend

---

## ✅ SOLUTION - Option 2: Manual Fix

### **Stop current backend:**
```bash
Ctrl + C
```

### **Unset the environment variable:**
```bash
unset DATABASE_URL
```

### **Start backend:**
```bash
npm run dev
```

Now it will use the `.env` file with the correct database.

---

## ✅ SOLUTION - Option 3: Remove from Shell Config

The DATABASE_URL is probably set in your shell configuration file.

### **Check your shell config:**
```bash
# For bash:
grep DATABASE_URL ~/.bashrc

# For zsh:
grep DATABASE_URL ~/.zshrc
```

### **If found, comment it out:**
```bash
# Edit the file:
nano ~/.zshrc  # or ~/.bashrc

# Find the line:
export DATABASE_URL="postgresql://...@ep-shy-credit..."

# Comment it out:
# export DATABASE_URL="postgresql://...@ep-shy-credit..."

# Save and reload:
source ~/.zshrc  # or source ~/.bashrc
```

---

## 🧪 Verification

### **After restarting backend, test:**

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@tpo.edu","password":"password@123"}'
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
      "role": "ROLE_TPO_ADMIN"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
}
```

---

## 📊 Database Status

### **Admin User Location:**
```
✅ Database: ep-hidden-glade (neondb)
✅ Email: admin@tpo.edu
✅ Password: password@123
✅ Role: ROLE_TPO_ADMIN
✅ Active: true
✅ Verified: true
```

### **Backend Connection:**
```
❌ Currently: ep-shy-credit (wrong)
✅ Should be: ep-hidden-glade (correct)
```

---

## 🔧 Quick Fix Commands

```bash
# Terminal where backend runs:

# 1. Stop backend
Ctrl + C

# 2. Unset wrong DATABASE_URL
unset DATABASE_URL

# 3. Start backend
npm run dev

# 4. Test login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@tpo.edu","password":"password@123"}'
```

---

## 📝 Summary

**Issue:** System environment variable pointing to wrong database

**Admin User:** Exists in `ep-hidden-glade` database

**Backend:** Trying to connect to `ep-shy-credit` database

**Solution:** Unset environment variable, use `.env` file

**Status:** 
- ✅ Admin user created
- ✅ Password correct
- ✅ .env file correct
- ❌ Environment variable wrong
- ⏳ **Restart backend with correct database**

---

**After fixing, login will work immediately!** 🚀
