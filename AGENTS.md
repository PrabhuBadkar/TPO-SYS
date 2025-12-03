# TPO Management System - Agent Documentation

> **Project:** Training & Placement Office Management System  
> **College:** ACER (Akhil College of Engineering & Research)  
> **Last Updated:** 2025-01-15

---

## 📋 Table of Contents

1. [Database Schema](#database-schema)
2. [Backend API Routes](#backend-api-routes)
3. [API Endpoints Reference](#api-endpoints-reference)
4. [Frontend Theme & Design](#frontend-theme--design)
5. [Technology Stack](#technology-stack)

---

## 🗄️ Database Schema

### Database Provider
- **Type:** PostgreSQL (NeonDB)
- **ORM:** Prisma
- **Multi-Schema Architecture:** Yes (5 schemas)

### Database Schemas

#### 1. **AUTH Schema** - Authentication & Session Management

**Tables:**

##### `users`
- **Purpose:** Core user authentication and account management
- **Key Fields:**
  - `id` (UUID, Primary Key)
  - `email` (Unique)
  - `mobile_number`
  - `encrypted_password`
  - `role` (ROLE_STUDENT, ROLE_RECRUITER, ROLE_TPO_DEPT, ROLE_TPO_ADMIN)
  - `email_verified`, `mobile_verified`
  - `mfa_enabled`, `mfa_secret`, `mfa_backup_codes`
  - `password_reset_token`, `password_reset_expires_at`
  - `is_active`, `is_locked`, `locked_reason`
  - `last_login_at`, `last_login_ip`
  - `failed_login_attempts`
  - `created_at`, `updated_at`, `deleted_at`

##### `sessions`
- **Purpose:** JWT token and session tracking
- **Key Fields:**
  - `id` (UUID, Primary Key)
  - `user_id` (Foreign Key → users)
  - `access_token_hash`, `refresh_token_hash`
  - `ip_address`, `user_agent`, `device_info`
  - `access_token_expires_at`, `refresh_token_expires_at`
  - `is_active`, `revoked_at`, `revoked_reason`
  - `created_at`, `last_activity_at`

##### `login_history`
- **Purpose:** Audit trail for login attempts
- **Key Fields:**
  - `id` (UUID, Primary Key)
  - `user_id`, `email`
  - `success` (Boolean)
  - `failure_reason`
  - `ip_address`, `user_agent`, `device_info`
  - `attempted_at`

---

#### 2. **STUDENTS Schema** - Student Profile & Academic Data

**Tables:**

##### `profiles` (StudentProfile)
- **Purpose:** Complete student profile and academic information
- **Key Fields:**
  - **Personal Info:** `first_name`, `middle_name`, `last_name`, `mother_name`, `date_of_birth`, `gender`, `mobile_number`, `alternate_mobile`, `personal_email`, `address_permanent`, `address_current`, `photo_url`, `college_name`, `category`
  - **Academic Info:** `enrollment_number` (Unique), `roll_number`, `department`, `degree`, `year_of_admission`, `current_semester`, `expected_graduation_year`, `cgpi`, `active_backlogs`, `backlog_history` (JSON)
  - **Documents:** `ssc_*`, `hsc_*`, `diploma_*` fields with marksheets
  - **Career Preferences:** `skills` (JSON), `projects` (JSON), `certifications` (JSON), `internships` (JSON), `competitive_profiles` (JSON), `preferred_job_roles`, `preferred_employment_type`, `preferred_locations`, `expected_ctc_min`, `expected_ctc_max`
  - **TPO Workflow:** `tpo_dept_assigned`, `tpo_dept_verified`, `tpo_dept_verified_at`, `tpo_dept_verified_by`, `tpo_admin_verified`, `tpo_admin_verified_at`, `tpo_admin_verified_by`, `dept_review_notes` (JSON), `academic_data_flagged`, `academic_flag_notes` (JSON), `data_sharing_consent`, `profile_complete_percent`, `profile_status`
  - **Calendar & Notifications:** `calendar_preferences` (JSON), `google_calendar_sync`, `outlook_calendar_sync`, `calendar_token`, `notification_preferences` (JSON)

##### `semester_marks`
- **Purpose:** Semester-wise academic performance
- **Key Fields:**
  - `student_id` (Foreign Key → profiles)
  - `semester`, `academic_year`
  - `subjects` (JSON array)
  - `total_credits`, `earned_credits`, `spi`
  - `has_backlogs`, `backlog_subjects`
  - `is_editable`, `edit_count`, `last_edited_at`

##### `resumes`
- **Purpose:** Student resume management
- **Key Fields:**
  - `student_id` (Foreign Key → profiles)
  - `version`, `file_name`, `file_path`, `file_size`, `file_hash`
  - `parsed_data` (JSON), `parser_confidence_score`, `parsing_status`
  - `is_primary`, `is_active`
  - `watermark_applied`, `watermark_text`

##### `consents`
- **Purpose:** Data sharing consent tracking (GDPR compliance)
- **Key Fields:**
  - `student_id` (Foreign Key → profiles)
  - `job_posting_id`, `recruiter_id`
  - `consent_type`, `consent_given`, `consent_text`
  - `data_shared` (Array), `access_expiry`
  - `revoked`, `revoked_at`, `revocation_reason`
  - `ip_address`, `user_agent`

##### `eligibility_results`
- **Purpose:** Cached eligibility computation results
- **Key Fields:**
  - `student_id` (Foreign Key → profiles)
  - `job_posting_id`
  - `is_eligible`, `reason_codes` (JSON)
  - `computed_at`, `rule_set_hash`, `jd_version`, `engine_version`

##### `documents`
- **Purpose:** Student document storage (marksheets, certificates, etc.)
- **Key Fields:**
  - `student_id` (Foreign Key → profiles)
  - `document_type`, `document_name`, `file_path`, `file_size`, `file_hash`
  - `watermark_applied`, `verified`, `verified_by`, `verified_at`

---

#### 3. **RECRUITERS Schema** - Company & Job Management

**Tables:**

##### `organizations`
- **Purpose:** Recruiter company information
- **Key Fields:**
  - `org_name`, `website`, `industry`, `size`, `headquarters`, `branch_offices`, `year_established`, `description`
  - **Legal Verification:** `gst_number`, `cin`, `pan`, `registration_cert_url`, `authorization_letter_url`
  - **Verification Status:** `recruiter_status` (PENDING_VERIFICATION, VERIFIED, REJECTED, BLACKLISTED), `verified_at`, `verified_by`, `rejection_reason`, `blacklist_reason`, `blacklisted_at`, `blacklisted_by`

##### `pocs` (Point of Contact)
- **Purpose:** Recruiter representatives
- **Key Fields:**
  - `org_id` (Foreign Key → organizations)
  - `user_id` (Foreign Key → users)
  - `poc_name`, `designation`, `department`, `email`, `mobile_number`, `linkedin_profile`
  - `is_primary`, `is_active`

##### `job_postings`
- **Purpose:** Job opportunities posted by recruiters
- **Key Fields:**
  - `org_id` (Foreign Key → organizations)
  - `created_by` (Foreign Key → pocs.user_id)
  - **Job Details:** `job_title`, `description`, `required_skills`, `qualifications`, `responsibilities`
  - **Work Details:** `work_location`, `employment_type` (Full-Time, Internship, Part-Time, Contract)
  - **Eligibility Criteria (JSON):** `cgpa_min`, `max_backlogs`, `allowed_branches`, `graduation_year`, `degree`
  - **Compensation (JSON):** `base_salary`, `variable_pay`, `benefits`, `joining_bonus`, `total_ctc`
  - **Selection Process (JSON):** `rounds`, `timeline`, `mode`
  - **Bond Terms (JSON):** `duration_months`, `amount`, `terms`, `notice_period_days`
  - `application_deadline`
  - **Status:** `status` (DRAFT, PENDING_APPROVAL, APPROVED, REJECTED, ACTIVE, PAUSED, CLOSED), `approved_at`, `approved_by`, `rejection_reason`, `modifications_requested`

##### `job_applications`
- **Purpose:** Student applications to jobs
- **Key Fields:**
  - `student_id`, `job_posting_id`, `resume_id`, `consent_id`
  - `cover_letter`
  - **Status:** `status` (SUBMITTED, PENDING_DEPT, PENDING_ADMIN, FORWARDED, SHORTLISTED, REJECTED, OFFERED, ACCEPTED)
  - **Review Workflow:** `reviewed_by_dept`, `reviewed_by_dept_at`, `dept_review_notes`, `reviewed_by_admin`, `reviewed_by_admin_at`, `admin_review_notes`
  - `forwarded_to_recruiter`, `forwarded_at`
  - **Shortlisting:** `shortlisted`, `shortlisted_at`, `shortlisted_by`, `shortlist_notes`
  - **Rejection:** `rejection_reason`, `rejected_at`, `rejected_by`

##### `offers`
- **Purpose:** Job offers extended to students
- **Key Fields:**
  - `student_id`, `job_posting_id`, `application_id`
  - **Offer Details:** `ctc_breakdown` (JSON), `joining_date`, `offer_letter_url`, `offer_expiry`
  - **Status:** `status` (EXTENDED, ACCEPTED, REJECTED, EXPIRED, RESCINDED)
  - **Acceptance/Rejection:** `accepted_at`, `rejected_at`, `rejection_reason`
  - **Rescind:** `rescinded_at`, `rescinded_by`, `rescind_reason`, `rescind_approved_by`

---

#### 4. **CORE Schema** - TPO Operations & Shared Resources

**Tables:**

##### `tpo_dept_coordinators`
- **Purpose:** Department-level TPO coordinators
- **Key Fields:**
  - `user_id` (Foreign Key → users)
  - `dept_coordinator_name`, `employee_id`
  - `primary_department`, `assigned_departments` (Array)
  - **Permissions:** `can_verify_profiles`, `can_process_applications`, `can_create_events`, `can_send_communications`
  - `calendar_preferences` (JSON), `reminder_templates` (JSON)
  - `is_active`

##### `exam_correction_requests`
- **Purpose:** Academic data correction workflow
- **Key Fields:**
  - `student_id`, `created_by` (TPO_Dept coordinator)
  - `issue_type` (CGPI_MISMATCH, BACKLOG_MISMATCH, MARKS_ERROR, OTHER)
  - `description`, `supporting_docs` (Array)
  - `status` (PENDING, APPROVED, REJECTED, IN_PROGRESS)
  - `exam_cell_notes`, `reviewed_by`, `reviewed_at`

##### `communication_log`
- **Purpose:** Mass communication tracking
- **Key Fields:**
  - `sender_id`, `sender_type` (TPO_DEPT, TPO_ADMIN, SYSTEM)
  - `recipient_type` (STUDENT, DEPARTMENT, ALL, CUSTOM), `recipient_ids` (Array)
  - `subject`, `body`, `message_type` (ANNOUNCEMENT, REMINDER, NOTIFICATION, ALERT)
  - `delivery_status` (PENDING, SENT, DELIVERED, FAILED)
  - `sent_count`, `delivered_count`, `read_count`
  - `scheduled_at`, `sent_at`

##### `reminder_history`
- **Purpose:** Automated reminder tracking
- **Key Fields:**
  - `student_id`
  - `reminder_type` (PROFILE_COMPLETION, VERIFICATION_PENDING, APPLICATION_DEADLINE, DOCUMENT_CORRECTION, INTERVIEW_TEST)
  - `subject`, `body`, `channel` (EMAIL, SMS, PUSH, IN_APP)
  - `delivery_status` (SENT, DELIVERED, FAILED, READ)
  - `action_taken`, `action_type`, `action_at`

##### `report_exports`
- **Purpose:** Generated reports and exports
- **Key Fields:**
  - `report_type` (PLACEMENT_SUMMARY, STUDENT_ELIGIBILITY, APPLICATION_STATUS, VERIFICATION_PENDING, OFFER_ACCEPTANCE)
  - `report_name`, `filters` (JSON), `format` (PDF, EXCEL, CSV)
  - `file_path`, `file_size`
  - `generated_by`, `department`, `access_expiry`, `download_count`

##### `approval_requests`
- **Purpose:** Multi-level approval workflow
- **Key Fields:**
  - `request_type` (BLACKLIST_ORG, OVERRIDE_PROFILE_VERIFICATION, OVERRIDE_APP_DECISION, POLICY_CHANGE, OFFER_RESCIND)
  - `resource_type`, `resource_id`
  - `initiator_id`, `approver_id`
  - `status` (PENDING, APPROVED, REJECTED)
  - `justification`, `proposed_changes` (JSON)
  - `decision_notes`, `decided_at`

---

#### 5. **AUDIT Schema** - Audit Trail & Compliance

**Tables:**

##### `events` (AuditEvent)
- **Purpose:** Complete audit trail of all system actions
- **Key Fields:**
  - `actor_id` (User who performed action)
  - `action` (e.g., "CREATE_PROFILE", "UPDATE_APPLICATION", "APPROVE_JOB")
  - `resource_type`, `resource_id`
  - `changes` (JSON - before/after values)
  - `ip_address`, `user_agent`, `metadata` (JSON)
  - `timestamp`

---

## 🛣️ Backend API Routes

### Base URL
- **Development:** `http://localhost:5000` or `http://localhost:3001`
- **Production:** TBD

### Route Structure

#### **Authentication Routes** (`/api/auth`)
- `POST /api/auth/login` - Standard email/password login
- `POST /api/auth/login/student` - Student login with URN + Department
- `POST /api/auth/register/student` - Student registration
- `POST /api/auth/register/recruiter` - Recruiter registration
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/refresh` - Refresh access token

#### **Student Routes** (`/api/student` or `/api/public`)

**Profile Management:**
- `GET /api/student/dashboard` - Student dashboard data
- `GET /api/student/profile` - Get student profile
- `POST /api/student/profile` - Create student profile
- `PUT /api/student/profile` - Update student profile
- `POST /api/student/profile/verify-request` - Request profile verification
- `GET /api/student/profile/completion` - Get profile completion status

**Resume Management:**
- `POST /api/student/resume/upload` - Upload resume
- `GET /api/student/resumes` - Get all resumes
- `DELETE /api/student/resumes/:id` - Delete resume
- `PUT /api/student/resumes/:id/primary` - Set primary resume

**Document Management:**
- `POST /api/student/documents/upload` - Upload document
- `GET /api/student/documents` - Get all documents
- `GET /api/student/documents/:id/download` - Download document
- `DELETE /api/student/documents/:id` - Delete document

**Job Applications:**
- `GET /api/student/jobs` - Get available jobs with eligibility
- `GET /api/student/applications` - Get student's applications
- `POST /api/student/applications/create` - Create job application
- `DELETE /api/student/applications/:id/withdraw` - Withdraw application
- `GET /api/student/offers` - Get job offers

**Consent Management:**
- `GET /api/student/consents` - Get consent records
- `POST /api/student/consents/:jobPostingId/revoke` - Revoke consent
- `GET /api/student/consents/preferences` - Get consent preferences
- `PUT /api/student/consents/preferences` - Update consent preferences

**Notifications:**
- `GET /api/student/notifications` - Get notifications
- `PUT /api/student/notifications/:id/read` - Mark notification as read
- `PUT /api/student/notifications/preferences` - Update notification preferences

**Calendar:**
- `GET /api/student/calendar/events` - Get calendar events
- `POST /api/student/calendar/rsvp` - RSVP to event

**Analytics:**
- `GET /api/student/analytics/personal` - Personal analytics
- `GET /api/student/analytics/comparative` - Comparative analytics (peer data)

#### **Recruiter Routes** (`/api/public/recruiters`)

**Organization Management:**
- `GET /api/public/recruiters` - Get organization details
- `POST /api/public/recruiters` - Create organization
- `PUT /api/public/recruiters/:id` - Update organization

**Job Posting Management:**
- `GET /api/public/recruiters/jobs` - Get job postings
- `POST /api/public/recruiters/jobs` - Create job posting
- `PUT /api/public/recruiters/jobs/:id` - Update job posting
- `DELETE /api/public/recruiters/jobs/:id` - Delete job posting

**Application Management:**
- `GET /api/public/recruiters/applications` - Get applications
- `POST /api/public/recruiters/applications/:id/shortlist` - Shortlist/Reject application

**Offer Management:**
- `GET /api/public/recruiters/offers` - Get offers
- `POST /api/public/recruiters/offers` - Create offer
- `PUT /api/public/recruiters/offers/:id` - Update offer

**Analytics:**
- `GET /api/public/recruiters/analytics` - Recruiter analytics

#### **TPO Department Routes** (`/api/internal/dept`)

**Dashboard:**
- `GET /api/internal/dept/dashboard` - TPO Dept dashboard

**Student Management:**
- `GET /api/internal/dept/students` - Get students (with filters)
- `GET /api/internal/dept/students/:id` - Get student details
- `POST /api/internal/dept/students/:id/verify` - Verify student profile

**Application Review:**
- `GET /api/internal/dept/applications` - Get applications for review
- `POST /api/internal/dept/applications/:id/review` - Review application

#### **TPO Admin Routes** (`/api/internal/admin` or `/api/tpo-admin`)

**Dashboard:**
- `GET /api/internal/admin/dashboard` - TPO Admin dashboard
- `GET /api/internal/admin/stats` - System statistics

**Recruiter Management:**
- `GET /api/internal/admin/recruiters` - Get recruiters
- `POST /api/internal/admin/recruiters/:id/verify` - Verify/Reject/Blacklist recruiter

**Job Posting Approval:**
- `GET /api/internal/admin/job-postings` - Get job postings for approval
- `POST /api/internal/admin/job-postings/:id/approve` - Approve/Reject job posting

**Application Management:**
- `GET /api/internal/admin/applications` - Get applications (final review)
- `POST /api/internal/admin/applications/:id/review` - Final review

**Student Management:**
- `GET /api/internal/admin/students` - Get all students
- `GET /api/internal/admin/students/:id` - Get student details

**Calendar Management:**
- `GET /api/internal/admin/calendar` - Get calendar events
- `POST /api/internal/admin/calendar` - Create event
- `PUT /api/internal/admin/calendar/:id` - Update event
- `DELETE /api/internal/admin/calendar/:id` - Delete event

**Communications:**
- `GET /api/internal/admin/communications` - Get communication logs
- `POST /api/internal/admin/communications` - Send communication

**Approvals:**
- `GET /api/tpo-admin/approvals` - Get approval requests
- `POST /api/tpo-admin/approvals/:id` - Approve/Reject request

#### **Shared Routes**

**Notifications:**
- `GET /api/notifications` - Get notifications
- `POST /api/notifications` - Create notification

**Calendar:**
- `GET /api/calendar` - Get calendar events
- `POST /api/calendar` - Create calendar event

**Audit:**
- `GET /api/audit` - Get audit logs

**Analytics:**
- `GET /api/analytics` - System-wide analytics

**Job Matching:**
- `GET /api/job-matching` - Job matching algorithm

**Workflow Integration:**
- `GET /api/workflow-integration` - Workflow status

**Production:**
- `GET /health` - Health check
- `GET /` - Production routes

---

## 📡 API Endpoints Reference

### Authentication Endpoints

#### Login (Standard)
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "student@acer.edu",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "email": "student@acer.edu",
      "role": "ROLE_STUDENT",
      "emailVerified": true
    },
    "tokens": {
      "accessToken": "jwt_token",
      "refreshToken": "refresh_token",
      "expiresIn": 86400
    }
  }
}
```

#### Student Login (URN + Department)
```http
POST /api/auth/login/student
Content-Type: application/json

{
  "urn": "2021CSE001",
  "department": "CSE",
  "password": "password123"
}
```

#### Student Registration
```http
POST /api/auth/register/student
Content-Type: application/json

{
  "firstName": "John",
  "middleName": "M",
  "lastName": "Doe",
  "mobileNumber": "9876543210",
  "email": "john@acer.edu",
  "urn": "2021CSE001",
  "department": "CSE",
  "password": "securepassword"
}
```

### Student Endpoints

#### Get Dashboard
```http
GET /api/student/dashboard
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "profile": {
      "profile_complete_percent": 95,
      "tpo_dept_verified": true
    },
    "stats": {
      "total_applications": 5,
      "pending_applications": 2,
      "shortlisted_applications": 1,
      "total_offers": 1
    }
  }
}
```

#### Get Available Jobs
```http
GET /api/student/jobs
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "jobs": [
      {
        "id": "uuid",
        "job_title": "Software Engineer",
        "organization": {
          "organization_name": "Tech Corp"
        },
        "eligibility": {
          "isEligible": true,
          "reasons": [],
          "reasonMessages": []
        }
      }
    ]
  }
}
```

#### Create Application
```http
POST /api/student/applications/create
Authorization: Bearer <token>
Content-Type: application/json

{
  "jobPostingId": "uuid",
  "resumeId": "uuid",
  "coverLetter": "I am interested...",
  "consentGiven": true
}
```

### TPO Department Endpoints

#### Get Students for Verification
```http
GET /api/internal/dept/students?status=PENDING_VERIFICATION&page=1&limit=20
Authorization: Bearer <token>
```

#### Verify Student Profile
```http
POST /api/internal/dept/students/:id/verify
Authorization: Bearer <token>
Content-Type: application/json

{
  "action": "APPROVE",
  "notes": "Profile verified successfully"
}
```

**Actions:** `APPROVE`, `REJECT`, `HOLD`

### TPO Admin Endpoints

#### Get Dashboard
```http
GET /api/internal/admin/dashboard
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "students": { "total": 500, "verified": 450 },
      "recruiters": { "total": 50, "verified": 45 },
      "jobs": { "active": 20 },
      "applications": { "total": 1000, "pending": 50 },
      "offers": { "total": 100 }
    }
  }
}
```

#### Verify Recruiter
```http
POST /api/internal/admin/recruiters/:id/verify
Authorization: Bearer <token>
Content-Type: application/json

{
  "action": "APPROVE",
  "reason": "Organization verified"
}
```

**Actions:** `APPROVE`, `REJECT`, `BLACKLIST`

### Recruiter Endpoints

#### Create Job Posting
```http
POST /api/public/recruiters/jobs
Authorization: Bearer <token>
Content-Type: application/json

{
  "jobTitle": "Software Engineer",
  "description": "We are looking for...",
  "employmentType": "Full-Time",
  "workLocation": "Bangalore",
  "eligibilityCriteria": {
    "cgpa_min": 7.0,
    "max_backlogs": 0,
    "allowed_branches": ["CSE", "IT"],
    "graduation_years": [2025]
  },
  "ctcBreakdown": {
    "base_salary": 600000,
    "variable_pay": 200000,
    "total_ctc": 1000000
  },
  "applicationDeadline": "2024-12-31T23:59:59.000Z"
}
```

---

## 🎨 Frontend Theme & Design

### Design Philosophy
**Modern Dark Theme with Glassmorphism & Neon Accents**

### Color Palette

#### Primary Colors
- **Background Gradient:** 
  - From: `#020617` (slate-950)
  - Via: `#172554` (blue-950)
  - To: `#0f172a` (slate-900)

#### Role-Based Accent Colors
- **Student (Blue):** `#60a5fa` (blue-400), `#93c5fd` (blue-300)
- **Recruiter (Green):** `#4ade80` (green-400), `#34c562` (green-500)
- **TPO Admin (Purple):** `#c084fc` (purple-400), `#a855f7` (purple-500)
- **TPO Dept (Orange):** `#fb923c` (orange-400), `#f97316` (orange-500)

#### Neutral Colors
- **Text Primary:** `#ffffff` (white)
- **Text Secondary:** `#cbd5e1` (slate-300)
- **Text Muted:** `#94a3b8` (slate-400)

### Design Elements

#### 1. **Animated Background**
- **Component:** `Squares` (Three.js/React Three Fiber)
- **Effect:** Diagonal moving squares with subtle glow
- **Properties:**
  - Speed: 0.3
  - Square Size: 50px
  - Border Color: `rgba(59, 130, 246, 0.2)` (blue with transparency)
  - Hover Fill: `rgba(59, 130, 246, 0.08)`

#### 2. **Glassmorphism Cards**
- **Background:** `rgba(30, 41, 59, 0.5)` with backdrop blur
- **Border:** `1px solid rgba(51, 65, 85, 0.8)`
- **Border Radius:** `1rem` (16px)
- **Padding:** `2rem` (32px)
- **Min Height:** `340px`

#### 3. **Card Hover Effects**
- **Transform:** `translateY(-8px) scale(1.02)`
- **Shadow:** Multi-layered with role-specific color glow
  - Blue: `0 20px 40px -12px rgba(59, 130, 246, 0.3)`
  - Green: `0 20px 40px -12px rgba(34, 197, 94, 0.3)`
  - Purple: `0 20px 40px -12px rgba(168, 85, 247, 0.3)`
  - Orange: `0 20px 40px -12px rgba(249, 115, 22, 0.3)`

#### 4. **Icon Design**
- **Size:** `2.5rem` (40px) width/height
- **Background:** Semi-transparent role color with `0.1` opacity
- **Hover Effect:** 
  - Scale: `1.1`
  - Rotate: `5deg`
  - Radial glow effect

#### 5. **Typography**
- **Font Family:** System fonts (Apple, Segoe UI, Roboto, etc.)
- **Headings:**
  - Hero Title: `8rem` (lg), `6rem` (md), `4.5rem` (base)
  - Card Title: `1.5rem`, Font Weight: 700
- **Body Text:** `0.9375rem` (15px), Line Height: 1.6
- **Letter Spacing:** `-0.025em` (tight tracking)

#### 6. **Button Styles**

**Dual Action Buttons (Login & Register):**
- **Login Button:**
  - Background: `rgba(59, 130, 246, 0.15)`
  - Border: `1.5px solid rgba(59, 130, 246, 0.4)`
  - Hover: Lift effect with enhanced glow

- **Register Button:**
  - Background: `rgba(59, 130, 246, 0.2)`
  - Border: `1.5px solid rgba(59, 130, 246, 0.5)`
  - Hover: Stronger lift and glow

#### 7. **Scrollbar Styling**
- **Width:** `10px`
- **Track:** `#0f172a` (slate-900)
- **Thumb:** `#334155` (slate-700)
- **Thumb Hover:** `#475569` (slate-600)

### Component Structure

#### Landing Page Layout
```
┌─────────────────────────────────────────┐
│  Animated Squares Background (z-index:0)│
│                                         │
│  ┌───────────────────────────────────┐ │
│  │  ACER TPO SYSTEM (Hero Title)    │ │
│  │  Tagline                          │ │
│  │                                   │ │
│  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──┐│ │
│  │  │Student│ │Recrui│ │TPO   │ │TP││ │
│  │  │       │ │ter   │ │Admin │ │O ││ │
│  │  │[Login]│ │      │ │      │ │De││ │
│  │  │[Regis]│ │      │ │      │ │pt││ │
│  │  └──────┘ └──────┘ └──────┘ └──┘│ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### Responsive Design
- **Mobile:** Single column grid
- **Tablet (md):** 2 column grid
- **Desktop (lg):** 4 column grid

### Animations & Transitions
- **Duration:** `300ms` (0.3s)
- **Easing:** `cubic-bezier(0.4, 0, 0.2, 1)`
- **Properties:** color, background-color, border-color, transform, box-shadow

### Accessibility Features
- **Selection Color:** `rgba(59, 130, 246, 0.3)` with white text
- **Smooth Scrolling:** Enabled
- **Focus States:** Visible outlines on interactive elements

---

## 🛠️ Technology Stack

### Backend
- **Runtime:** Node.js (>=18.0.0)
- **Framework:** Express.js 4.21.2
- **Language:** TypeScript 5.7.2
- **Database ORM:** Prisma 5.22.0
- **Database:** PostgreSQL (NeonDB)
- **Authentication:** JWT (jsonwebtoken 9.0.2)
- **Password Hashing:** bcrypt 5.1.1
- **Validation:** Zod 3.23.8
- **File Upload:** Multer 2.0.2
- **Security:** Helmet 8.0.0
- **CORS:** cors 2.8.5
- **Logging:** Morgan 1.10.0

### Frontend
- **Framework:** React 18.2.0
- **Build Tool:** Vite 5.0.8
- **Routing:** React Router DOM 6.20.0
- **3D Graphics:** Three.js 0.160.1, React Three Fiber 8.18.0
- **Language:** JavaScript (JSX)
- **Styling:** Custom CSS (Tailwind-inspired utility classes)

### Development Tools
- **Backend Dev Server:** tsx 4.19.2 (watch mode)
- **Linting:** ESLint
- **Code Formatting:** Prettier
- **Package Manager:** npm (>=9.0.0)

### Database Architecture
- **Multi-Schema Design:** 5 schemas (auth, students, recruiters, core, audit)
- **UUID Primary Keys:** All tables use UUID v4
- **Soft Deletes:** `deleted_at` timestamp fields
- **Audit Trail:** Comprehensive logging in audit schema
- **Indexing:** Strategic indexes on foreign keys and frequently queried fields

---

## 📝 Notes for AI Agents

### Key Workflows

1. **Student Registration Flow:**
   - Register → Create User (auth.users) → Create Profile (students.profiles) → Email Verification → Profile Completion → TPO Dept Verification → TPO Admin Verification → Active

2. **Job Application Flow:**
   - Student applies → Consent created → Application status: SUBMITTED → TPO Dept review (PENDING_DEPT) → TPO Admin review (PENDING_ADMIN) → Forwarded to Recruiter (FORWARDED) → Recruiter shortlists (SHORTLISTED) → Offer extended (OFFERED) → Student accepts (ACCEPTED)

3. **Recruiter Onboarding:**
   - Register → Create User → Create Organization → TPO Admin verification → Active → Can post jobs

4. **Job Posting Approval:**
   - Recruiter creates job (DRAFT) → Submit for approval (PENDING_APPROVAL) → TPO Admin reviews → Approved (ACTIVE) or Rejected

### Security Considerations
- All passwords are bcrypt hashed
- JWT tokens with refresh mechanism
- Session tracking with IP and user agent
- Login history for audit
- MFA support (optional)
- GDPR-compliant consent management
- Role-based access control (RBAC)

### Data Integrity
- Foreign key constraints
- Unique constraints on critical fields (email, enrollment_number)
- JSON validation for complex fields
- Cascading deletes where appropriate
- Soft deletes for audit trail

---

**End of Documentation**

*This document should be updated whenever significant changes are made to the database schema, API routes, or frontend design.*
