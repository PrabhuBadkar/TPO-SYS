# 🏢 Recruiter Registration Form - Complete Implementation

## ✅ What's Being Created

A **fully connected 4-step recruiter registration wizard** with:
- ✅ Waves animated background
- ✅ 4-step form wizard
- ✅ Complete validation
- ✅ File upload for documents
- ✅ Backend integration
- ✅ Beautiful UI matching theme

---

## 📁 Files Being Created

### **Components:**
1. `Waves.jsx` ✅ - Animated background
2. `Waves.css` ✅ - Waves styling
3. `RecruiterRegister.jsx` ⏳ - Main wizard
4. `RecruiterRegister.css` ⏳ - Wizard styling
5. `CompanyInfoStep.jsx` ⏳ - Step 1
6. `LegalVerificationStep.jsx` ⏳ - Step 2
7. `POCDetailsStep.jsx` ⏳ - Step 3
8. `ReviewSubmitStep.jsx` ⏳ - Step 4

### **Shared:**
- Reuse `StepForm.css` from student profile
- Reuse file upload component

---

## 🎨 Design Theme

### **Background:**
```jsx
<Waves
  lineColor="rgba(168, 85, 247, 0.3)"
  backgroundColor="linear-gradient(135deg, #1a0b2e 0%, #2d1b4e 100%)"
  waveSpeedX={0.02}
  waveSpeedY={0.01}
  waveAmpX={40}
  waveAmpY={20}
  friction={0.9}
  tension={0.01}
  maxCursorMove={120}
  xGap={12}
  yGap={36}
/>
```

### **Colors:**
- Primary: Purple (#a855f7)
- Background: Dark purple gradient
- Text: White/Light purple
- Borders: Purple with transparency
- Glassmorphism effects

---

## 📋 Form Structure

### **Step 1: Company Information** (8 fields)
```
Company Name *
Website *
Industry * (dropdown)
Company Size * (dropdown)
Headquarters Location *
Branch Offices (optional, array)
Year Established *
Company Description * (textarea, min 50 chars)
```

### **Step 2: Legal Verification** (4 fields + 2 uploads)
```
GST Number * (format validation)
CIN * (format validation)
PAN * (format validation)
Company Registration Certificate * (PDF upload)
Authorization Letter * (PDF upload)
```

### **Step 3: POC Details** (6 fields)
```
Full Name *
Designation *
Department * (dropdown)
Email * (must match company domain)
Mobile Number * (10 digits)
LinkedIn Profile (optional)
```

### **Step 4: Review & Submit**
```
Review all information
Terms & Conditions checkbox *
Submit button
```

---

## 🔌 API Integration

### **Registration:**
```javascript
POST /api/auth/register/recruiter

Body: {
  // All form fields
}

Response: {
  success: true,
  message: "Registration submitted successfully. Awaiting TPO Admin approval.",
  data: {
    organization_id: uuid,
    status: "PENDING_VERIFICATION"
  }
}
```

### **File Upload:**
```javascript
POST /api/public/upload/document

FormData: {
  file: File,
  documentType: 'registration_cert' | 'authorization_letter'
}

Response: {
  success: true,
  data: {
    url: "/uploads/documents/filename.pdf"
  }
}
```

---

## ✅ Validation Rules

### **Company Info:**
- Company name: Required, min 2 chars
- Website: Required, valid URL (https://...)
- Industry: Required, from dropdown
- Size: Required, from dropdown
- Headquarters: Required, min 5 chars
- Year established: Required, 1800 ≤ year ≤ current year
- Description: Required, min 50 chars, max 500 chars

### **Legal Verification:**
- GST: Required, format: `\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}`
- CIN: Required, format: `[UL]\d{5}[A-Z]{2}\d{4}[A-Z]{3}\d{6}`
- PAN: Required, format: `[A-Z]{5}\d{4}[A-Z]{1}`
- Registration cert: Required, PDF only, max 5MB
- Authorization letter: Required, PDF only, max 5MB

### **POC Details:**
- Full name: Required, min 2 chars
- Designation: Required, min 2 chars
- Department: Required, from dropdown
- Email: Required, valid email, must match company domain
- Mobile: Required, exactly 10 digits, Indian format
- LinkedIn: Optional, valid URL if provided

### **Review:**
- Terms & conditions: Must be checked

---

## 🎯 User Flow

```
1. Visit /register/recruiter
2. See Step 1 (Company Info)
3. Fill form → Click "Next"
4. See Step 2 (Legal Verification)
5. Upload documents → Click "Next"
6. See Step 3 (POC Details)
7. Fill form → Click "Next"
8. See Step 4 (Review)
9. Review all info → Check T&C → Click "Submit"
10. See success message
11. Redirect to status page
12. Email sent to recruiter & TPO Admin
```

---

## 🎨 UI Components

### **Progress Indicator:**
```
[1] Company Info → [2] Legal Verification → [3] POC Details → [4] Review
```

### **Form Card:**
```
┌─────────────────────────────────────┐
│  Step 1 of 4: Company Information   │
│  ─────────────────────────────────  │
│                                     │
│  [Form Fields]                      │
│                                     │
│  [Back]              [Next →]       │
└─────────────────────────────────────┘
```

### **Success Screen:**
```
┌─────────────────────────────────────┐
│  ✅ Registration Submitted!         │
│                                     │
│  Your organization: ABC Corp        │
│  Status: Pending Verification       │
│                                     │
│  You will receive an email once     │
│  your account is approved by        │
│  TPO Admin.                         │
│                                     │
│  [Check Status]  [Go to Login]      │
└─────────────────────────────────────┘
```

---

## 📊 Implementation Plan

### **Phase 1: Main Wizard** ⏳
- Create RecruiterRegister.jsx
- Add Waves background
- Add progress indicator
- Add step navigation
- Add state management

### **Phase 2: Step Components** ⏳
- Create CompanyInfoStep.jsx
- Create LegalVerificationStep.jsx
- Create POCDetailsStep.jsx
- Create ReviewSubmitStep.jsx

### **Phase 3: Validation** ⏳
- Add field validation
- Add format validation (GST, CIN, PAN)
- Add email domain validation
- Add file validation

### **Phase 4: API Integration** ⏳
- Connect to registration endpoint
- Connect to file upload endpoint
- Handle success/error responses
- Add loading states

### **Phase 5: Styling** ⏳
- Match purple theme
- Add glassmorphism effects
- Add animations
- Make responsive

---

## 🚀 Ready to Implement

**Next:** Create all components in one go!

**Estimated:** ~1,500 lines of code
**Time:** ~10 minutes

**Proceed?** ✅
