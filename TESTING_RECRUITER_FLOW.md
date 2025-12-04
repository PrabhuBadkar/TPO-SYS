# 🧪 Testing Recruiter Registration & Approval Flow

## 📋 Complete Flow to Test

### **Step 1: Recruiter Registration**
```
1. Visit http://localhost:3000
2. Click "Register" on Recruiter card
3. URL should be: /register?role=recruiter
4. Complete 4-step wizard:
   - Step 1: Company Info (8 fields)
   - Step 2: Legal Verification (4 fields + 2 PDFs)
   - Step 3: POC Details (6 fields + password)
   - Step 4: Review & Submit
5. Submit registration
6. Redirect to /recruiter/status
7. Status should show "PENDING_VERIFICATION"
```

### **Step 2: Check Database**
```
Backend should have created:
- Organization (recruiter_status: PENDING_VERIFICATION)
- User (is_active: false, role: ROLE_RECRUITER)
- POC (is_active: false)
```

### **Step 3: TPO Admin Dashboard**
```
1. Login to TPO Admin Dashboard
2. Click "Recruiters" tab
3. Should see:
   - Total Recruiters: 1
   - Pending Approvals: 1 (with pulse indicator)
   - Verified Recruiters: 0
4. Click "Pending" filter tab
5. Should see the new recruiter in list
6. Click on recruiter to view details
```

### **Step 4: Approve Recruiter**
```
1. In modal, review all information
2. Check documents (PDFs)
3. Click "Approve" button
4. Backend updates:
   - Organization → VERIFIED
   - User → is_active: true
   - POC → is_active: true
5. Modal closes
6. Stats update:
   - Pending Approvals: 0
   - Verified Recruiters: 1
```

### **Step 5: Recruiter Login**
```
1. Go to /login?role=recruiter
2. Enter email + password
3. Should login successfully
4. Redirect to recruiter dashboard (when created)
```

---

## ✅ What to Check

### **Frontend:**
- [ ] Registration form loads correctly
- [ ] All 4 steps work
- [ ] File upload works
- [ ] Validation works
- [ ] Submit redirects to status page
- [ ] Status page shows "PENDING_VERIFICATION"

### **Backend:**
- [ ] POST /api/auth/register/recruiter works
- [ ] Organization created in database
- [ ] User created with is_active: false
- [ ] POC created with is_active: false
- [ ] Files uploaded to /uploads/documents/

### **TPO Admin:**
- [ ] Stats cards show correct counts
- [ ] Pending card shows 1 with pulse
- [ ] Recruiter appears in list
- [ ] Click opens modal with all details
- [ ] Documents are viewable
- [ ] Approve button works
- [ ] Stats update after approval

### **After Approval:**
- [ ] Organization status → VERIFIED
- [ ] User is_active → true
- [ ] POC is_active → true
- [ ] Recruiter can login
- [ ] Status page shows "VERIFIED"

---

## 🐛 Common Issues to Check

### **Issue 1: Registration doesn't submit**
**Check:**
- Browser console for errors
- Network tab for API call
- Backend logs for errors
- Database connection

### **Issue 2: Doesn't appear in TPO Admin**
**Check:**
- GET /api/internal/admin/recruiters/all endpoint
- Authorization header (token)
- Database query results
- Frontend state management

### **Issue 3: Approve doesn't work**
**Check:**
- PUT /api/internal/admin/recruiters/:id/approve endpoint
- Authorization (TPO Admin role)
- Database update query
- Frontend refresh after approval

### **Issue 4: Can't login after approval**
**Check:**
- User is_active field in database
- Organization recruiter_status field
- Login endpoint logic
- Token generation

---

## 📊 Expected Database State

### **After Registration:**
```sql
-- Organization
recruiter_status: 'PENDING_VERIFICATION'
verified_at: NULL
verified_by: NULL

-- User
is_active: false
role: 'ROLE_RECRUITER'

-- POC
is_active: false
```

### **After Approval:**
```sql
-- Organization
recruiter_status: 'VERIFIED'
verified_at: '2024-01-15 10:30:00'
verified_by: '<tpo_admin_user_id>'

-- User
is_active: true
role: 'ROLE_RECRUITER'

-- POC
is_active: true
```

---

## 🎯 Test Data

### **Sample Company Info:**
```
Company Name: Tech Solutions Inc
Website: https://techsolutions.com
Industry: Information Technology
Size: 51-200 employees
Headquarters: Mumbai, Maharashtra, India
Year Established: 2015
Description: Leading IT solutions provider specializing in cloud computing and AI technologies. We help businesses transform digitally.
```

### **Sample Legal Info:**
```
GST: 27AAAAA0000A1Z5
CIN: U72900MH2015PTC123456
PAN: AAAAA1234A
```

### **Sample POC Info:**
```
Name: John Doe
Designation: HR Manager
Department: HR
Email: john@techsolutions.com
Mobile: 9876543210
Password: Test@1234
```

---

## 🚀 Quick Test Commands

### **Check Backend is Running:**
```bash
curl http://localhost:5000/api/auth/recruiter/status?email=john@techsolutions.com
```

### **Check Database:**
```sql
-- Check organization
SELECT * FROM organizations ORDER BY created_at DESC LIMIT 1;

-- Check user
SELECT * FROM users WHERE role = 'ROLE_RECRUITER' ORDER BY created_at DESC LIMIT 1;

-- Check POC
SELECT * FROM pocs ORDER BY created_at DESC LIMIT 1;
```

### **Check Files:**
```bash
ls -la backend/uploads/documents/
```

---

## ✅ Success Criteria

**Registration is successful if:**
1. ✅ All 4 steps complete without errors
2. ✅ Redirects to status page
3. ✅ Status shows "PENDING_VERIFICATION"
4. ✅ Database has all 3 records (Org, User, POC)
5. ✅ Files uploaded successfully

**TPO Admin view is successful if:**
1. ✅ Stats cards show correct counts
2. ✅ Pending card has pulse indicator
3. ✅ Recruiter appears in list
4. ✅ Modal shows all details
5. ✅ Documents are viewable

**Approval is successful if:**
1. ✅ Approve button works
2. ✅ Database updates correctly
3. ✅ Stats update in real-time
4. ✅ Recruiter can login
5. ✅ Status page shows "VERIFIED"

---

## 🎉 Ready to Test!

**Start Testing:**
1. Make sure backend is running (port 5000)
2. Make sure frontend is running (port 3000)
3. Have TPO Admin credentials ready
4. Follow the steps above
5. Check each checkpoint

**Let's test the complete flow!** 🚀
