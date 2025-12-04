# 🔧 Troubleshooting: Forbidden Error

## ❌ Problem

You're getting a "Forbidden" error when trying to create a job posting.

---

## 🔍 Root Cause

You're currently logged in as **TPO Admin**, but job posting creation requires **ROLE_RECRUITER**.

**Evidence:**
```
Fetching recruiters with filter: {}
Found 3 organizations
GET /api/internal/admin/recruiters/all 304
```
This shows you're accessing TPO Admin endpoints, which means you're logged in as TPO Admin.

---

## ✅ Solution

You need to **login as a recruiter** to create job postings.

### **Option 1: Login as Recruiter (Recommended)**

**Step 1: Logout from TPO Admin**
```
1. Click on your avatar (top right)
2. Click "Logout"
```

**Step 2: Login as Recruiter**
```
1. Go to: http://localhost:3000/login?role=recruiter
2. Enter recruiter credentials:
   - Email: (your registered recruiter email)
   - Password: (your recruiter password)
3. Should redirect to: /recruiter/dashboard
```

**Step 3: Create Job Posting**
```
1. Click "Create Job Posting" button
2. Fill the form
3. Submit
4. Should work! ✅
```

---

### **Option 2: Register New Recruiter**

If you don't have a recruiter account:

**Step 1: Register**
```
1. Go to: http://localhost:3000/register?role=recruiter
2. Fill all 4 steps
3. Submit
4. Status: PENDING_VERIFICATION
```

**Step 2: Approve as TPO Admin**
```
1. Login as TPO Admin
2. Go to Recruiters tab
3. Find your recruiter
4. Click "Approve"
5. Status: VERIFIED
```

**Step 3: Login as Recruiter**
```
1. Logout from TPO Admin
2. Login as recruiter
3. Create job posting
```

---

## 🔐 Role Requirements

### **Job Posting Creation:**
```
Endpoint: POST /api/public/recruiters/jobs/create
Required Role: ROLE_RECRUITER
Authorization: Bearer token with ROLE_RECRUITER
```

### **Job Posting Approval:**
```
Endpoint: PUT /api/internal/admin/jobs/:id/approve
Required Role: ROLE_TPO_ADMIN
Authorization: Bearer token with ROLE_TPO_ADMIN
```

---

## 📊 Complete Workflow

```
1. Recruiter Registration
   ↓
2. TPO Admin Approval
   ↓
3. Recruiter Login
   ↓
4. Recruiter Creates Job Posting (status: PENDING_APPROVAL)
   ↓
5. TPO Admin Reviews & Approves
   ↓
6. Eligibility Engine Runs
   ↓
7. Students Notified
```

**You're currently at step 5 (TPO Admin), but trying to do step 4 (Recruiter action).**

---

## 🧪 Quick Test

**Check your current role:**
```javascript
// Open browser console (F12)
console.log('User Role:', localStorage.getItem('userRole'));
console.log('User:', JSON.parse(localStorage.getItem('user')));
```

**Expected for Recruiter:**
```javascript
userRole: "ROLE_RECRUITER"
user: { role: "ROLE_RECRUITER", ... }
```

**Expected for TPO Admin:**
```javascript
userRole: "ROLE_TPO_ADMIN"
user: { role: "ROLE_TPO_ADMIN", ... }
```

---

## 🎯 Next Steps

**1. Logout from TPO Admin:**
```
Click avatar → Logout
```

**2. Login as Recruiter:**
```
http://localhost:3000/login?role=recruiter
Email: (your recruiter email)
Password: (your recruiter password)
```

**3. Verify you're logged in as recruiter:**
```
Check browser console:
localStorage.getItem('userRole') // should be "ROLE_RECRUITER"
```

**4. Create Job Posting:**
```
Dashboard → Create Job Posting → Fill form → Submit
```

**5. Should work!** ✅

---

## 📝 Error Details

When you submit the form now, you'll see an alert with:
- Error message
- Status code
- Console logs

**Check browser console for:**
```
Submitting job posting...
User role: ROLE_TPO_ADMIN  ← This is the problem!
Response status: 403
Response data: { error: "Forbidden", ... }
```

**Should be:**
```
User role: ROLE_RECRUITER  ← Correct!
Response status: 201
Response data: { success: true, ... }
```

---

## ✅ Summary

**Problem:** You're logged in as TPO Admin
**Solution:** Login as Recruiter
**Then:** Create job posting will work!

**The system is working correctly - it's just a role mismatch!** 🎯
