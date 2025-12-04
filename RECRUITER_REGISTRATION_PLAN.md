# 🏢 Recruiter Registration System - Complete Plan

## 📋 Overview

**Critical Flow:** Recruiter registers → TPO Admin approves → Recruiter can login

**Key Difference from Student:**
- Students can login immediately after registration
- **Recruiters CANNOT login until TPO Admin approves their organization**

---

## 🎯 Requirements Analysis

### **From Documentation:**

#### **Organization Registration Form Fields:**

**1. Company Details (8 fields):**
- Company name (required)
- Website (required, URL validation)
- Industry (required, dropdown)
- Company size (required, dropdown: 1-10, 11-50, 51-200, 201-500, 501-1000, 1000+)
- Headquarters location (required)
- Branch offices (optional, array)
- Year of establishment (required, 1800-current year)
- Company description (required, min 50 chars)

**2. Legal Verification (4 fields + 2 documents):**
- GST Number (required, format validation)
- CIN - Corporate Identification Number (required, format validation)
- PAN - Permanent Account Number (required, format validation)
- Company registration certificate (required, PDF upload)
- Authorization letter (required, PDF upload)

**3. POC (Point of Contact) Details (6 fields):**
- Full Name (required)
- Designation (required)
- Department (required, dropdown: HR, Campus Relations, Hiring Manager, Other)
- Email (required, must match company domain)
- Mobile Number (required, Indian format: 10 digits)
- LinkedIn Profile (optional, URL validation)

**Total:** 18 fields + 2 document uploads

---

## 🎨 Multi-Step Registration Design

### **Step 1: Company Information** (8 fields)
- Company name
- Website
- Industry
- Company size
- Headquarters location
- Branch offices
- Year of establishment
- Company description

### **Step 2: Legal Verification** (4 fields + 2 documents)
- GST Number
- CIN
- PAN
- Company registration certificate (upload)
- Authorization letter (upload)

### **Step 3: POC Details** (6 fields)
- Full Name
- Designation
- Department
- Email
- Mobile Number
- LinkedIn Profile

### **Step 4: Review & Submit**
- Review all information
- Terms & conditions checkbox
- Submit for verification

---

## 🔐 Authentication Flow

### **Registration Flow:**
```
1. Recruiter fills 4-step registration form
2. Submits → Organization created with status: PENDING_VERIFICATION
3. POC account created but DISABLED
4. Email sent to recruiter: "Registration submitted, awaiting approval"
5. Email sent to TPO Admin: "New recruiter registration pending"
6. Recruiter CANNOT login (account disabled)
```

### **Approval Flow:**
```
1. TPO Admin reviews organization details
2. TPO Admin approves/rejects
3. If approved:
   - Organization status → VERIFIED
   - POC account → ENABLED
   - Email to recruiter: "Account approved, you can now login"
4. If rejected:
   - Organization status → REJECTED
   - Email to recruiter: "Registration rejected: [reason]"
   - Option to resubmit
```

### **Login Flow:**
```
1. Recruiter enters email + password
2. Backend checks:
   - User exists?
   - Account enabled?
   - Organization verified?
3. If all checks pass → Login successful
4. If account disabled → "Account pending approval"
5. If organization rejected → "Registration rejected: [reason]"
```

---

## 🗄️ Database Schema

### **Organizations Table (Already exists):**
```prisma
model Organization {
  id                       String       @id @default(uuid())
  org_name                 String
  website                  String?
  industry                 String?
  size                     String?
  headquarters             String?
  branch_offices           String[]
  year_established         Int?
  description              String?
  gst_number               String?
  cin                      String?
  pan                      String?
  registration_cert_url    String?
  authorization_letter_url String?
  recruiter_status         String       @default("PENDING_VERIFICATION")
  verified_at              DateTime?
  verified_by              String?      @db.Uuid
  rejection_reason         String?
  created_at               DateTime     @default(now())
  updated_at               DateTime     @updatedAt
  pocs                     POC[]
}
```

### **POC Table (Need to check/create):**
```prisma
model POC {
  id              String       @id @default(uuid())
  user_id         String       @unique @db.Uuid
  org_id          String       @db.Uuid
  full_name       String
  designation     String
  department      String
  mobile_number   String
  linkedin_url    String?
  is_primary      Boolean      @default(true)
  is_active       Boolean      @default(false)  // Disabled until approved
  created_at      DateTime     @default(now())
  updated_at      DateTime     @updatedAt
  
  organization    Organization @relation(fields: [org_id], references: [id])
  user            User         @relation(fields: [user_id], references: [id])
}
```

### **User Table (Existing):**
```prisma
model User {
  id              String       @id @default(uuid())
  email           String       @unique
  password_hash   String
  role            String       // ROLE_RECRUITER
  is_active       Boolean      @default(false)  // Disabled until approved
  created_at      DateTime     @default(now())
  updated_at      DateTime     @updatedAt
}
```

---

## 🔌 Backend API Endpoints

### **1. Registration:**
```
POST /api/auth/register/recruiter

Body:
{
  // Step 1: Company Info
  org_name: string
  website: string
  industry: string
  size: string
  headquarters: string
  branch_offices: string[]
  year_established: number
  description: string
  
  // Step 2: Legal Verification
  gst_number: string
  cin: string
  pan: string
  registration_cert_url: string  // From file upload
  authorization_letter_url: string  // From file upload
  
  // Step 3: POC Details
  poc_full_name: string
  poc_designation: string
  poc_department: string
  poc_email: string
  poc_mobile: string
  poc_linkedin: string?
  
  // Password
  password: string
  confirm_password: string
}

Response:
{
  success: true,
  message: "Registration submitted successfully. Awaiting TPO Admin approval.",
  data: {
    organization_id: uuid,
    status: "PENDING_VERIFICATION"
  }
}
```

### **2. Login:**
```
POST /api/auth/login/recruiter

Body:
{
  email: string
  password: string
}

Response (if approved):
{
  success: true,
  data: {
    user: {...},
    organization: {...},
    tokens: {...}
  }
}

Response (if pending):
{
  success: false,
  error: "Your account is pending TPO Admin approval"
}

Response (if rejected):
{
  success: false,
  error: "Your registration was rejected: [reason]"
}
```

### **3. Check Status:**
```
GET /api/auth/recruiter/status?email={email}

Response:
{
  success: true,
  data: {
    status: "PENDING_VERIFICATION" | "VERIFIED" | "REJECTED",
    rejection_reason: string?,
    submitted_at: datetime,
    verified_at: datetime?
  }
}
```

---

## 🎨 Frontend Components

### **Pages:**
1. `RecruiterRegister.jsx` - Main registration wizard
2. `RecruiterLogin.jsx` - Login page with status check
3. `RecruiterStatus.jsx` - Check registration status

### **Step Components:**
1. `CompanyInfoStep.jsx` - Step 1
2. `LegalVerificationStep.jsx` - Step 2 (with file uploads)
3. `POCDetailsStep.jsx` - Step 3
4. `ReviewSubmitStep.jsx` - Step 4

### **Shared:**
1. `RecruiterAuth.css` - Shared styling
2. File upload component (reuse from student profile)

---

## ✅ Validation Rules

### **Step 1: Company Info**
- Company name: Required, min 2 chars
- Website: Required, valid URL format
- Industry: Required, from dropdown
- Size: Required, from dropdown
- Headquarters: Required, min 5 chars
- Year established: Required, 1800 ≤ year ≤ current year
- Description: Required, min 50 chars

### **Step 2: Legal Verification**
- GST: Required, format: `\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}`
- CIN: Required, format: `[UL]\d{5}[A-Z]{2}\d{4}[A-Z]{3}\d{6}`
- PAN: Required, format: `[A-Z]{5}\d{4}[A-Z]{1}`
- Registration cert: Required, PDF only, max 5MB
- Authorization letter: Required, PDF only, max 5MB

### **Step 3: POC Details**
- Full name: Required, min 2 chars
- Designation: Required, min 2 chars
- Department: Required, from dropdown
- Email: Required, valid email, must match company domain
- Mobile: Required, 10 digits, Indian format
- LinkedIn: Optional, valid URL if provided

### **Step 4: Review**
- Terms & conditions: Must be checked

---

## 🎯 User Experience Flow

### **Registration Journey:**
```
1. Recruiter visits /register?role=recruiter
2. Sees 4-step wizard with progress indicator
3. Fills Step 1 (Company Info) → Next
4. Fills Step 2 (Legal Verification + uploads) → Next
5. Fills Step 3 (POC Details) → Next
6. Reviews all info in Step 4 → Submit
7. Sees success message: "Registration submitted!"
8. Receives email: "Awaiting approval"
9. Can check status at /recruiter/status
```

### **Login Journey (Before Approval):**
```
1. Recruiter visits /login?role=recruiter
2. Enters email + password
3. Sees message: "Account pending approval"
4. Link to check status
```

### **Login Journey (After Approval):**
```
1. Recruiter visits /login?role=recruiter
2. Enters email + password
3. Redirected to /recruiter/dashboard
4. Can post jobs, view applications, etc.
```

---

## 🔔 Notifications

### **Email Templates:**

**1. Registration Submitted (to Recruiter):**
```
Subject: Registration Submitted - Awaiting Approval

Dear [POC Name],

Thank you for registering with [College Name] TPO System.

Your organization: [Company Name]
Registration ID: [ID]
Status: Pending Verification

Our TPO Admin team will review your registration within 24-48 hours.
You will receive an email once your account is approved.

Check status: [Link]

Best regards,
TPO Team
```

**2. Registration Submitted (to TPO Admin):**
```
Subject: New Recruiter Registration - Action Required

A new recruiter has registered:

Company: [Company Name]
Industry: [Industry]
POC: [Name] ([Email])
Submitted: [Date]

Review now: [Admin Dashboard Link]
```

**3. Registration Approved (to Recruiter):**
```
Subject: Account Approved - Welcome to TPO System!

Dear [POC Name],

Great news! Your registration has been approved.

Company: [Company Name]
Status: Verified

You can now login and start posting jobs:
Login: [Link]

Best regards,
TPO Team
```

**4. Registration Rejected (to Recruiter):**
```
Subject: Registration Update Required

Dear [POC Name],

Your registration requires attention.

Company: [Company Name]
Status: Rejected
Reason: [Rejection Reason]

Please review and resubmit:
Update Registration: [Link]

Best regards,
TPO Team
```

---

## 🎨 UI Design Considerations

### **Theme:**
- Match student registration theme
- Professional, corporate feel
- Blue/Purple gradient (business-oriented)
- Clean, modern forms

### **Progress Indicator:**
```
[1] Company Info → [2] Legal Verification → [3] POC Details → [4] Review
```

### **Status Page:**
```
┌─────────────────────────────────┐
│  Registration Status            │
│                                 │
│  Company: ABC Corp              │
│  Status: ⏳ Pending Approval    │
│  Submitted: 2 days ago          │
│                                 │
│  Your registration is being     │
│  reviewed by TPO Admin.         │
│  You will receive an email      │
│  once approved.                 │
│                                 │
│  [Refresh Status]               │
└─────────────────────────────────┘
```

---

## 📊 Implementation Checklist

### **Backend:**
- [ ] Create POC model (if not exists)
- [ ] Create registration endpoint
- [ ] Create login endpoint with approval check
- [ ] Create status check endpoint
- [ ] Add file upload for documents
- [ ] Add email notifications
- [ ] Add validation middleware

### **Frontend:**
- [ ] Create RecruiterRegister.jsx (wizard)
- [ ] Create CompanyInfoStep.jsx
- [ ] Create LegalVerificationStep.jsx
- [ ] Create POCDetailsStep.jsx
- [ ] Create ReviewSubmitStep.jsx
- [ ] Create RecruiterLogin.jsx
- [ ] Create RecruiterStatus.jsx
- [ ] Add routes to main.jsx
- [ ] Add validation
- [ ] Add file upload UI

### **Database:**
- [ ] Verify Organization model
- [ ] Create/verify POC model
- [ ] Add indexes
- [ ] Test relationships

---

## 🚀 Next Steps

1. **Review this plan** - Confirm approach
2. **Check database schema** - Verify POC model exists
3. **Create backend routes** - Registration, login, status
4. **Create frontend components** - 4-step wizard
5. **Test complete flow** - Registration → Approval → Login
6. **Add TPO Admin approval UI** - (separate task)

---

## ⚠️ Critical Points

1. **Account Disabled by Default** - POC account created but disabled
2. **Email Domain Validation** - POC email must match company domain
3. **Document Upload** - Both PDFs required before submission
4. **Status Check** - Allow checking status without login
5. **Clear Messaging** - User knows why they can't login
6. **Approval Workflow** - TPO Admin can approve/reject with reason

---

**This is a comprehensive plan. Ready to implement?** 🚀
