# ROLE: STUDENT — Complete Role Description

**Role ID:** `ROLE_STUDENT`  
**System Access:** Public System (Web + Mobile)  
**Authentication:** Email/Mobile OTP, Optional MFA  
**Primary Interface:** Responsive web app, Mobile app (iOS/Android)

---

## 🎯 Role Purpose

Students are the primary beneficiaries of the TPO Management System. They use the platform to:
- Create and maintain their placement profile
- Discover and apply to job opportunities
- Manage interview schedules and track application status
- Provide consent for data sharing with recruiters
- Access placement analytics and insights

---

## 👤 Intended Users

- Eligible students within the institution
- Undergraduate students (B.Tech, BCA, etc.)
- Postgraduate students (M.Tech, MCA, MBA, etc.)
- Diploma students (for direct 2nd year entry)
- Current students in their final year or pre-final year (as per placement cycle)

---

## 📋 Core Responsibilities

### R3.1: Maintain Accurate Profile, Academics, and Resume(s)
- **What:** Keep personal, academic, and career information up-to-date
- **Why:** Ensures accurate eligibility computation and quality applications to recruiters
- **How:** Regular profile updates, document uploads, resume versioning
- **Accountability:** Profile verification by TPO_Dept required before placement eligibility

### R3.2: Discover, Apply to, and Manage Placement Opportunities
- **What:** Browse job postings, submit applications, track status
- **Why:** Active participation in placement process
- **How:** One-click applications with pre-filled data, application tracking dashboard
- **Accountability:** Two-tier approval (TPO_Dept → TPO_Admin) before recruiter access

### R3.3: Provide Consent for Data Sharing and Comply with Placement Policies
- **What:** Explicit consent for sharing profile/resume with recruiters
- **Why:** Privacy-by-design, GDPR/FERPA compliance
- **How:** Mandatory consent checkbox per application, revocable anytime
- **Accountability:** Consent logged with timestamp and IP, access expiry on revocation

---

## 🔑 Capabilities (Detailed)

### C3.1: Profile Management with Verification Workflow

**Description:** Create, update, and manage personal, academic, and career profile with TPO_Dept verification.

**Features:**
- **Personal Information:**
  - Name (first, middle/father's name, last), mother's name
  - Date of birth, gender (Male/Female/Other/Prefer not to say)
  - Mobile number (verified via OTP), alternate number (optional)
  - Personal email (verified), addresses (permanent, current)
  - Photo upload (optional), category (General/OBC/SC/ST/Other)
  - College selection (ACER default, extendable)
- **Academic Information:**
  - Enrollment number (unique, immutable after verification)
  - Department (CSE/ECE/ME/CE/IT/EE/Others)
  - Degree (B.Tech/M.Tech/MCA/MBA/Diploma)
  - Year of admission, current semester
  - Expected graduation year (auto-calculated)
- **Profile Completion Indicator:**
  - Real-time progress bar (0-100%)
  - Breakdown: Personal (15%), Academic (20%), Documents (25%), Career (20%), Resume (20%)
  - Minimum 80% required for placement eligibility
- **Verification Workflow:**
  - Student completes profile → Requests verification
  - TPO_Dept reviews → Approve/Reject/Request corrections
  - On approval: `tpo_dept_verified = TRUE`, profile unlocked for placement

**Business Rules:**
- Profile completion >= 80% required for verification request
- Verified profiles can apply to job postings
- Edits to verified data may require re-verification (K3.2)
- All profile updates logged in audit trail

**API Endpoints:**
- `POST /api/public/profile/create` - Create initial profile
- `PUT /api/public/profile/update` - Update profile (partial updates)
- `GET /api/public/profile/me` - Get current student's profile
- `POST /api/public/profile/verify-request` - Request TPO_Dept verification

**UI Screens:**
- Profile Dashboard (completion %, verification status)
- Personal Information Form (editable fields with validation)
- Academic Information Form (enrollment, department, degree)
- Document Upload (SSC/HSC/Diploma marksheets)
- Verification Status (badges, timeline)

---

### C3.2: Resume Upload/Versioning and Optional Auto-Parsing

**Description:** Upload multiple resume versions, select primary resume, optional AI-powered parsing.

**Features:**
- **Resume Upload:**
  - File format: PDF only (max 2MB)
  - Watermarking: Student name + enrollment number + "Confidential" embedded
  - Encrypted storage: S3 buckets with signed URLs (1-hour expiry)
- **Resume Versioning:**
  - Max 5 active versions per student
  - Each version tagged: v1, v2, v3, etc. with upload timestamp
  - Student selects "primary" resume for applications
  - Version history maintained; old versions soft-deleted after 1 year
- **Resume Parser (Optional):**
  - Auto-extracts: skills, education, experience, projects
  - Parser confidence score displayed (0.00 to 1.00)
  - Low-confidence fields flagged for manual review
  - Student reviews and confirms/edits parsed data
  - Parsing requires explicit student confirmation before saving
- **Resume Quality Checks:**
  - File size validation (<= 2MB)
  - PDF format validation
  - Watermark application
  - Virus scan (optional)

**Business Rules:**
- BR-S5: Resume required for application submission
- BR-S6: Primary resume auto-attached unless alternate selected
- BR-S7: Resume parsing requires explicit student confirmation
- Max 5 active resume versions at a time

**API Endpoints:**
- `POST /api/public/resume/upload` - Upload new resume version
- `PUT /api/public/resume/:id/set-primary` - Set resume as primary
- `GET /api/public/resume/list` - Get all resume versions
- `DELETE /api/public/resume/:id` - Soft-delete resume version

**UI Screens:**
- Resume Upload Page (drag-and-drop, file picker)
- Resume Version List (v1, v2, v3 with timestamps, primary badge)
- Resume Parser Results (parsed data with confidence scores, edit fields)
- Resume Preview (PDF viewer with watermark)

---

### C3.3: View Job Postings, Eligibility, Submit/Withdraw Applications

**Description:** Browse eligible job postings, submit one-click applications, withdraw before shortlisting.

**Features:**
- **Job Posting Discovery:**
  - Browse all active job postings (TPO_Admin approved)
  - Filters: Company, role, CTC, location, deadline, eligibility status
  - Sort: Deadline (nearest first), CTC (high to low), posted date
  - Search: Company name, role, skills
- **Eligibility Indication:**
  - Green badge: "You are eligible" (CGPA >= cutoff, backlogs <= max, department match)
  - Red badge: "Not eligible" with reason codes (CGPA low, backlog exceeded, branch mismatch)
  - Eligibility computed by engine, updated on profile changes
- **One-Click Application:**
  - Pre-filled form: Profile data auto-populated
  - Primary resume auto-attached (student can select alternate version)
  - Cover letter (optional, max 500 words)
  - Mandatory consent checkbox: "I consent to share my profile and resume with [Company Name]"
  - Validation: Deadline not passed, profile verified, consent given
  - Confirmation email sent on submission
- **Application Withdrawal:**
  - Allowed only before recruiter shortlisting
  - Triggers: Application status → Withdrawn, consent revoked, notifications sent
  - Audit: Withdrawal reason (optional), timestamp

**Business Rules:**
- BR-S8: Eligibility computed only for verified profiles
- BR-S9: Eligibility re-computed on profile updates
- BR-S11: Two-tier approval (TPO_Dept → TPO_Admin) before recruiter access
- BR-S12: Max N applications per semester (configurable, e.g., 10)
- BR-S13: No edits after submission; withdrawal and reapply required
- BR-S14: Consent revocation triggers immediate access expiry for recruiter

**API Endpoints:**
- `GET /api/public/jobs/list` - Get all active job postings with eligibility
- `GET /api/public/jobs/:id` - Get job posting details
- `POST /api/public/applications/create` - Submit application
- `DELETE /api/public/applications/:id/withdraw` - Withdraw application
- `GET /api/public/applications/me` - Get all applications for current student

**UI Screens:**
- Job Listings Page (cards with company logo, role, CTC, deadline, eligibility badge)
- Job Details Page (full JD, eligibility criteria, selection process, apply button)
- Application Form (pre-filled data, resume selector, cover letter, consent checkbox)
- Application Confirmation (success message, application ID, next steps)

---

### C3.4: Manage Interview Schedules, RSVP, Track Outcomes

**Description:** View calendar events, RSVP for interviews/tests, track attendance, manage conflicts.

**Features:**
- **Personal Calendar:**
  - Multi-source: Placement events + Academic calendar + Personal events
  - Views: Monthly, Weekly, Daily, Agenda (list)
  - Color-coded categories: Drives (blue), Interviews (red), Tests (orange), Exams (purple), Deadlines (yellow), Personal (green)
- **Event Details:**
  - Title, description, date/time, duration
  - Location: Physical (room number) or Virtual (meeting link)
  - Organizer: Company name, TPO contact
  - Preparation notes: Topics, dress code, documents required
  - Attachments: JD, company profile, test syllabus
- **RSVP & Attendance:**
  - RSVP options: Attending / Not Attending / Tentative
  - RSVP deadline: Typically T-24h before event
  - Late RSVP: Requires TPO_Dept approval
  - Attendance: Marked via mobile app (geofencing for physical events)
  - No-show policy: 3 warnings → 5 suspension from placements
- **External Calendar Integration:**
  - Google Calendar: OAuth 2.0, one-way or two-way sync, real-time webhooks or 15-min polling
  - Outlook Calendar: Microsoft Graph API, similar OAuth flow
  - ICS Feed: Unique URL with secret token, read-only, updates hourly, token rotation every 6 months
- **Event Reminders:**
  - Default: T-72h (email), T-24h (email + SMS), T-2h (push)
  - Custom: Student-configurable per event
  - Channels: Email, SMS, Push (based on preferences)
- **Conflict Detection:**
  - Overlapping events, exam conflicts
  - Resolution: Student requests reschedule → TPO_Dept coordinates → Updated schedule pushed

**Business Rules:**
- BR-S17: RSVP required; default = Tentative if not responded
- BR-S18: No-show policy enforced (3 → warning email)
- BR-S19: Calendar sync tokens auto-expire 90 days
- BR-S20: External calendar sync optional; student can opt-out

**API Endpoints:**
- `GET /api/public/schedule/events` - Get calendar events for student
- `POST /api/public/schedule/rsvp` - Submit RSVP for event
- `POST /api/public/calendar/sync/google` - Initiate Google Calendar OAuth
- `POST /api/public/calendar/sync/outlook` - Initiate Outlook Calendar OAuth
- `GET /api/public/calendar/ics-feed` - Get ICS feed URL

**UI Screens:**
- Calendar Page (month/week/day views, color-coded events)
- Event Details Modal (title, description, location, RSVP button, attachments)
- RSVP Confirmation (success message, calendar sync options)
- Calendar Settings (sync preferences, reminder settings, timezone)

---

### C3.5: Consent Management for Data Sharing with Recruiters

**Description:** Explicit consent for sharing profile/resume with specific recruiters, opt-in resume books, revocable anytime.

**Features:**
- **Consent Types:**
  - **Application Consent:** Per job posting, mandatory checkbox during application
  - **Resume Book Consent:** Opt-in for inclusion in department resume books (shared with multiple recruiters)
  - **Profile Sharing Consent:** Selective sharing with specific recruiters (for direct outreach)
- **Consent Lifecycle:**
  - **Grant:** Explicit user action (checkbox), timestamp and IP logged
  - **Revoke:** Student can revoke anytime via Privacy Settings
  - **Expiry:** Auto-revoke after placement or 1 year (whichever earlier)
- **Consent Details:**
  - Consent text: Full statement shown to student (e.g., "I consent to share my profile and resume with [Company Name] for this application.")
  - Data shared: Profile, resume, contact (specified per consent)
  - Access expiry: Timestamp after which recruiter access expires
- **Consent Tracking:**
  - All consents logged in `students.consents` table
  - Audit trail: consent_given, consent_type, data_shared, ip_address, user_agent, created_at
  - Revocation triggers: Access expiry for recruiter, notification to TPO_Dept

**Business Rules:**
- BR-S14: Consent revocation triggers immediate access expiry for recruiter
- Consent required for application submission
- Consent logged with timestamp and IP for audit
- Students can view all consents and revoke individually

**API Endpoints:**
- `POST /api/public/consents/create` - Grant consent (during application)
- `DELETE /api/public/consents/:id/revoke` - Revoke consent
- `GET /api/public/consents/list` - Get all consents for current student
- `GET /api/public/privacy/consents` - Privacy settings page

**UI Screens:**
- Application Form (consent checkbox with full text)
- Privacy Settings (list of all consents with revoke buttons)
- Consent Confirmation (success message, data shared details)
- Consent Revocation Confirmation (warning, impact explanation)

---

### C3.6: Notifications and Communication Preferences

**Description:** Configure notification channels, frequency, do-not-disturb windows, opt-out of non-critical messages.

**Features:**
- **Notification Channels:**
  - Email: Institutional email or personal email
  - SMS: Mobile number (verified)
  - Push: Mobile app notifications (FCM, OneSignal)
  - In-app: Notification bell in web/mobile app
- **Notification Types:**
  - Drive eligibility (critical, cannot opt-out)
  - Application status updates (critical, cannot opt-out)
  - Deadline reminders (critical, cannot opt-out)
  - Profile completion reminders (non-critical, can opt-out)
  - General announcements (non-critical, can opt-out)
- **Notification Preferences:**
  - Enable/disable per channel (email, SMS, push)
  - Frequency: Immediate / Daily digest / Weekly digest
  - Do-not-disturb windows: Specify hours (e.g., 10 PM - 8 AM)
  - Opt-out: Non-critical notifications only
- **Rate Limits:**
  - Max 10 emails/day per student
  - Max 5 SMS/day per student
  - Push: Unlimited (with user opt-out)
- **Critical Notifications Override:**
  - Deadline < 24h: Override DND settings
  - Interview reminders: Override DND settings
  - Emergency broadcasts: Override all settings

**Business Rules:**
- BR-S10: Notification rate limits (10 emails/day, 5 SMS/day)
- Critical notifications override DND and opt-out settings
- Students can opt-out of non-critical notifications only

**API Endpoints:**
- `PUT /api/public/notifications/preferences/update` - Update notification preferences
- `GET /api/public/notifications/preferences` - Get current preferences
- `GET /api/public/notifications/list` - Get all notifications (read/unread)
- `PUT /api/public/notifications/:id/mark-read` - Mark notification as read

**UI Screens:**
- Notification Settings Page (channel toggles, frequency dropdowns, DND windows)
- Notification Bell (dropdown with recent notifications, mark as read)
- Notification Details (full message, action buttons)

---

### C3.7: View Personal Analytics (Application Status, Offers, Timelines, Compliance Checklist)

**Description:** Dashboard with placement status, application summary, upcoming events, analytics, compliance checklist.

**Features:**
- **Placement Status Widget:**
  - Current status: Unplaced / Placed / Multiple Offers
  - If placed: Company name, role, CTC, joining date
- **Application Summary:**
  - Total applications: Count
  - Status breakdown: Pending Review / Under Recruiter Review / Shortlisted / Rejected / Withdrawn
  - Success rate: (Shortlisted / Total) × 100%
- **Upcoming Events:**
  - Next 7 days: Interviews, tests, deadlines
  - Calendar integration (see C3.4)
- **Application Tracking:**
  - List view: All applications with status, company, role, applied date, last updated
  - Filters: Status, company, date range
  - Status timeline: Submitted → TPO_Dept → TPO_Admin → Recruiter → Shortlisted/Rejected
  - Notifications on status changes
- **Analytics & Insights:**
  - **Personal Metrics:**
    - Applications submitted vs. eligible opportunities
    - Shortlist rate: (Shortlisted / Applied) × 100%
    - Offer rate: (Offers / Applied) × 100%
    - Average time to shortlist
  - **Comparative Analytics (Anonymized):**
    - Department average CGPA, placement rate
    - Popular companies, roles
    - Skill demand trends
  - **Compliance Checklist:**
    - Profile completion: 100% ✓
    - Resume uploaded: ✓
    - Consent given: ✓
    - Pending actions: [List with links]

**Business Rules:**
- BR-S15: Students see only own data (K3.1)
- BR-S16: Comparative analytics anonymized and aggregated (min 10 students per cohort)

**API Endpoints:**
- `GET /api/public/analytics/me` - Get personal analytics dashboard
- `GET /api/public/analytics/comparative` - Get anonymized comparative analytics
- `GET /api/public/compliance/checklist` - Get compliance checklist

**UI Screens:**
- Dashboard (placement status, application summary, upcoming events, quick stats)
- Application Tracking Page (list view, filters, status timeline)
- Analytics Page (charts, metrics, comparative data)
- Compliance Checklist (progress bars, pending actions with links)

---

## 🚫 Constraints

### K3.1: Cannot Access Other Students' Data
- **What:** Students can only view their own profile, applications, offers
- **Why:** Privacy protection, FERPA/GDPR compliance
- **Enforcement:** Row-Level Security (RLS) policies at database level
- **Exception:** Anonymized comparative analytics (min 10 students per cohort)

### K3.2: Edits to Verified Data May Require Re-Verification
- **What:** Changes to verified profile fields trigger re-verification workflow
- **Why:** Maintain data quality and accuracy
- **Enforcement:** Application-level validation, TPO_Dept notification
- **Audit:** All edits logged with timestamp and changed fields

---

## 📊 Student Workflow (Complete Journey)

### Phase 1: Registration & Profile Creation (Week 1)
1. Sign up with institutional email or enrollment number
2. Email/mobile OTP verification
3. Password creation (min 12 chars, complexity rules)
4. Personal information entry (15% completion)
5. Academic information entry (20% completion)
6. Profile completion indicator shows 35%

### Phase 2: Academic Data Entry & Verification (Week 2-3)
1. Semester marks entry (via exam portal or manual) (15% completion)
2. Backlog management (Active/Cleared status)
3. SSC/HSC/Diploma marksheet upload (25% completion)
4. Profile completion reaches 75%
5. Request TPO_Dept verification
6. TPO_Dept reviews and approves
7. Profile status: VERIFIED

### Phase 3: Placement Preparation (Week 4)
1. Resume upload (PDF, max 2MB) (20% completion)
2. Optional resume parsing (auto-extract skills, experience)
3. Skills & competencies entry
4. Projects, certifications, internships entry
5. Competitive profiles (LinkedIn, GitHub, etc.)
6. Job preferences (roles, locations, employment type)
7. Profile completion reaches 100%

### Phase 4: Drive Eligibility & Notifications (Ongoing)
1. Recruiter posts JD → TPO_Admin approves
2. Eligibility engine runs (CGPA, backlogs, department, graduation year)
3. Student receives notification: "You are eligible for [Company Name]"
4. Student views JD details, eligibility criteria

### Phase 5: Application Process (Per Drive)
1. Student browses eligible job postings
2. Clicks "Apply" on JD details page
3. Pre-filled application form (profile, resume, cover letter)
4. Mandatory consent checkbox
5. Submit application
6. Application status: Submitted → Pending TPO_Dept Review
7. TPO_Dept approves → Pending TPO_Admin Review
8. TPO_Admin approves → Forwarded to Recruiter
9. Student receives notifications at each status change

### Phase 6: Tracking & Status Management (Ongoing)
1. Dashboard shows application summary
2. Application tracking page shows status timeline
3. Notifications on status changes (shortlisted, rejected)
4. Analytics page shows personal metrics

### Phase 7: Calendar & Schedule Management (Per Interview)
1. TPO_Dept schedules interview event
2. Student receives notification with event details
3. Student RSVPs (Attending/Not Attending/Tentative)
4. Event appears on personal calendar
5. Reminders sent (T-72h, T-24h, T-2h)
6. Student attends interview
7. Attendance marked (via mobile app or TPO_Dept)

---

## 🗄️ Student Data Model (Key Tables)

### students.profiles
- **Purpose:** Primary student profile with PII and academic data
- **Key Fields:** enrollment_number, department, degree, cgpi, active_backlogs, profile_complete_percent, tpo_dept_verified, profile_status
- **RLS Policy:** Students can view/update only their own profile

### students.semester_marks
- **Purpose:** Semester-wise academic performance
- **Key Fields:** semester, academic_year, subjects (JSONB), spi, has_backlogs
- **Trigger:** Update CGPI in students.profiles on INSERT/UPDATE

### students.resumes
- **Purpose:** Resume versioning and metadata
- **Key Fields:** version, file_path, is_primary, parsed_data, parser_confidence_score
- **Trigger:** Ensure only one primary resume per student

### students.consents
- **Purpose:** Data sharing consent tracking
- **Key Fields:** consent_type, consent_given, data_shared, access_expiry, revoked
- **Index:** Active consents (consent_given = TRUE AND revoked = FALSE)

### students.eligibility_results
- **Purpose:** Eligibility computation results per student-JD pair
- **Key Fields:** is_eligible, reason_codes, rule_set_hash, jd_version, engine_version
- **Unique:** (student_id, job_posting_id, computed_at)

---

## 🔐 Security & Privacy

### Data Protection
- **PII Encryption:** Column-level AES-256-GCM (mobile_number, personal_email, addresses)
- **File Security:** Encrypted S3 buckets, signed URLs (1-hour expiry), watermarked PDFs
- **Key Rotation:** Every 90 days

### Consent Management
- **Types:** Application (per JD), Resume Book (opt-in), Profile Sharing (selective)
- **Lifecycle:** Grant (explicit action + timestamp + IP) → Revoke (anytime) → Expiry (auto-revoke after placement or 1 year)

### Audit Logging
- **Events:** Profile creation/updates/verification, resume uploads, application submissions/withdrawals, consent grants/revocations, calendar syncs, RSVP submissions
- **Schema:** audit.events (actor_id, action, resource_type, resource_id, changes JSONB, ip_address, timestamp)

### Row-Level Security (RLS)
- **Policy:** Students can view/update only their own profile
- **Enforcement:** Database-level RLS policies on students.profiles, students.resumes, students.consents, etc.

---

## 📱 UI/UX Specifications

### Dashboard Layout
1. **Header:** Student name, profile photo, profile completion %
2. **Quick Stats:** Applications (total, pending, shortlisted), Placement status, Upcoming events (next 7 days)
3. **Action Cards:** Complete Profile, Browse Jobs, Upload Resume, View Calendar
4. **Recent Activity Feed:** Application status updates, new job postings, event reminders
5. **Notifications Panel:** Unread notifications with filters

### Profile Management Page
1. **Personal Information:** Editable form with real-time validation
2. **Academic Information:** Semester-wise marks table, CGPI display
3. **Documents:** Upload/view SSC/HSC/Diploma marksheets
4. **Skills & Projects:** Tag input for skills, project cards
5. **Preferences:** Job roles, locations, employment type
6. **Verification Status:** TPO_Dept and TPO_Admin verification badges

### Calendar Page
- **Left Sidebar:** Mini calendar, event filters (type, company), upcoming events list
- **Main Area:** Calendar grid (month/week/day views)
- **Right Panel:** Event details on click
- **Features:** Drag-and-drop (personal events only), color-coded events, RSVP buttons, export to ICS, sync with Google/Outlook

### Application Tracking Page
- **Filters:** Status, company, date range
- **List View:** Application cards with status badges
- **Detail View:** Timeline of status changes, recruiter feedback
- **Features:** Withdraw button (before shortlisting), status timeline visualization, download application PDF

---

## 🔗 Integration Points

1. **Exam Portal Integration:** Auto-import semester marks via API or CSV, student confirmation required
2. **Resume Parser:** Self-hosted (Apache Tika + NLP) or SaaS (Affinda, Sovren, HireAbility), confidence threshold >= 0.7
3. **Google Calendar Sync:** OAuth 2.0, Calendar API v3, real-time webhooks or 15-min polling
4. **Outlook Calendar Sync:** Microsoft Graph API, similar OAuth flow
5. **Notification Services:** Email (SendGrid, AWS SES, Mailgun), SMS (Twilio, AWS SNS, MSG91), Push (FCM, OneSignal)

---

## 📈 Success Metrics

### Profile Completion
- **Target:** 100% of eligible students with verified profiles
- **Metric:** % of students with profile_complete_percent >= 80% and tpo_dept_verified = TRUE

### Application Activity
- **Target:** Avg 5-10 applications per student per semester
- **Metric:** Total applications / Total eligible students

### Placement Rate
- **Target:** 70%+ placement rate for eligible students
- **Metric:** (Placed students / Eligible students) × 100%

### User Engagement
- **Target:** 80%+ daily active users during placement season
- **Metric:** Daily active users / Total eligible students

---

## 🆘 Support & Help

### In-App Help
- **Tooltips:** Contextual help on form fields
- **FAQs:** Common questions with answers
- **Video Tutorials:** Profile creation, application submission, calendar sync

### Contact Support
- **TPO_Dept Coordinator:** Department-specific support (profile verification, application guidance)
- **TPO_Admin:** System-wide issues (login problems, technical errors)
- **Help Desk:** Email support@tpo.college.edu, Phone: +91-XXX-XXX-XXXX

---

## 📚 Additional Resources

- **Placement Policy Document:** College placement rules, eligibility criteria, code of conduct
- **Resume Writing Guide:** Tips for creating effective resumes
- **Interview Preparation:** Common interview questions, dress code, etiquette
- **Company Research:** How to research companies before applying

---

**Document Version:** 1.0  
**Last Updated:** 2024-01-15  
**Maintained By:** TPO Development Team  
**For:** Students of [College Name]
