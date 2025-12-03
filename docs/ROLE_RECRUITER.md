# ROLE: RECRUITER (Company Representative) — Complete Role Description

**Role ID:** `ROLE_RECRUITER`  
**System Access:** Public System (Web Portal)  
**Authentication:** Email/Password, Optional MFA, POC Email Domain Verification  
**Primary Interface:** Responsive web portal optimized for desktop and tablet

---

## 🎯 Role Purpose

Recruiters are **external stakeholders** representing companies/organizations seeking to hire students. They:
- Register their organization and get verified by TPO_Admin
- Post job descriptions (JDs) for placement drives
- Access verified, curated student applications (after TPO approval)
- Manage shortlists, schedule interviews, and extend offers
- Track recruitment pipeline and analytics

**Key Value:** Access to quality, verified student profiles; streamlined recruitment process; transparent communication with TPO.

---

## 👤 Intended Users

- HR managers from recruiting companies
- Campus recruitment coordinators
- Hiring managers and technical leads
- Talent acquisition specialists
- Third-party recruitment agencies (with authorization)
- Multiple POCs (Points of Contact) per organization (primary + secondary)

---

## 📋 Core Responsibilities

### R4.1: Register Organization and Get Verified by TPO_Admin
- **What:** Submit organization details, legal documents, POC information for TPO_Admin verification
- **Why:** Establish trust, prevent fraud, ensure legitimacy
- **How:** Online registration form, document upload, email verification, TPO_Admin review
- **Accountability:** Verification status tracked, rejection reasons provided, appeal process available

### R4.2: Post Job Descriptions (JDs) and Manage Placement Drives
- **What:** Create job postings with eligibility criteria, compensation details, selection process
- **Why:** Attract quality candidates, set clear expectations
- **How:** JD creation form, eligibility criteria builder, TPO_Admin approval workflow
- **Accountability:** JD approval required before student visibility, policy compliance enforced

### R4.3: Access Verified Student Applications (Post-TPO Approval)
- **What:** View student profiles, resumes, and applications (only after TPO_Admin approval)
- **Why:** Quality assurance, consent compliance, privacy protection
- **How:** Application dashboard, filters, search, profile preview
- **Accountability:** Access logged, consent-based, time-limited

### R4.4: Manage Shortlists, Schedule Interviews, and Extend Offers
- **What:** Shortlist candidates, schedule interview rounds, extend job offers
- **Why:** Streamlined recruitment pipeline, transparent communication
- **How:** Shortlist management, interview scheduling, offer creation, status tracking
- **Accountability:** All actions logged, notifications sent to students and TPO

### R4.5: Track Recruitment Pipeline and Analytics
- **What:** View recruitment metrics, application funnel, offer acceptance rates
- **Why:** Data-driven decisions, process optimization
- **How:** Analytics dashboard, custom reports, export data
- **Accountability:** Analytics scoped to own organization only

---

## 🔑 Capabilities (Detailed)

### C4.1: Organization Registration and Verification

**Description:** Submit organization details, legal documents, POC information for TPO_Admin verification.

**Features:**
- **Organization Registration Form:**
  - **Company Details:**
    - Company name, website, industry, size (employees count)
    - Headquarters location, branch offices
    - Year of establishment, company description
  - **Legal Verification:**
    - GST number (validate format)
    - CIN (Corporate Identification Number)
    - PAN (Permanent Account Number)
    - Company registration certificate (upload PDF)
  - **POC (Point of Contact) Details:**
    - Name, designation, department (HR/Campus Relations/Hiring Manager)
    - Email (must match company domain, e.g., @company.com)
    - Mobile number (Indian format validation)
    - LinkedIn profile (optional)
  - **Supporting Documents:**
    - Authorization letter (on company letterhead, signed by authorized signatory)
    - POC's business card or employee ID (optional)
    - Previous placement records (if returning recruiter)
- **Verification Workflow:**
  - Recruiter submits registration → Status: Pending Verification
  - TPO_Admin reviews → Approve/Reject/Request More Info
  - On approval: POC account activated, recruiter can login and post jobs
  - On rejection: Notification with rejection reason, appeal process
  - On request more info: Notification with required documents, recruiter can update and resubmit
- **Multiple POCs:**
  - Primary POC (main contact, full access)
  - Secondary POCs (limited access, can view but not edit)
  - Primary POC can request additional POCs → TPO_Admin approves

**Business Rules:**
- POC email domain must match organization domain (exceptions allowed with justification)
- Minimum 1 active POC required per organization
- Organization verification required before job posting
- All verification actions logged with verifier ID and timestamp

**API Endpoints:**
- `POST /api/public/recruiters/register` - Submit organization registration
- `GET /api/public/recruiters/status` - Get verification status
- `PUT /api/public/recruiters/update` - Update organization details (if more info requested)
- `POST /api/public/recruiters/pocs/add` - Request additional POC

**UI Screens:**
- Registration Form (company details, legal verification, POC details, supporting documents)
- Verification Status Page (pending/approved/rejected, timeline, next steps)
- Update Organization Page (edit details, upload additional documents)
- POC Management Page (primary POC, secondary POCs, add POC request)

---

### C4.2: Create and Manage Job Postings (JDs)

**Description:** Create job postings with eligibility criteria, compensation details, selection process; submit for TPO_Admin approval.

**Features:**
- **Job Posting Creation Form:**
  - **Job Details:**
    - Job title, description, responsibilities (rich text editor)
    - Required skills, qualifications, experience
    - Work location (city, state, remote/hybrid/onsite)
    - Employment type (Full-Time/Internship/Part-Time/Contract)
  - **Eligibility Criteria:**
    - CGPA cutoff (within policy bounds, e.g., >= 6.0, <= 9.5)
    - Max active backlogs allowed (within policy, e.g., 0-3)
    - Allowed branches/departments (CSE, ECE, ME, CE, IT, EE, Others)
    - Graduation year (matches current placement cycle)
    - Degree (B.Tech, M.Tech, MCA, MBA, Diploma)
  - **Compensation Details:**
    - CTC breakdown: Base salary, variable pay, benefits, joining bonus
    - CTC >= minimum wage laws (configurable per state)
    - Transparency: No "as per industry standards" (must specify amount)
  - **Selection Process:**
    - Rounds: Aptitude, Technical, HR, etc.
    - Timeline: Expected duration from application to offer
    - Interview mode: Online/Offline/Hybrid
  - **Bond/Service Agreement:**
    - Bond duration (if any, max 2 years as per policy)
    - Bond amount, terms, conditions
    - Notice period
  - **Application Deadline:**
    - Last date to apply (date picker)
    - Auto-close applications after deadline
- **JD Approval Workflow:**
  - Recruiter submits JD → Status: Pending TPO_Admin Approval
  - TPO_Admin reviews → Approve/Reject/Request Modifications
  - On approval: JD published to students, eligibility engine runs, eligible students notified
  - On rejection: Notification with rejection reason, recruiter can edit and resubmit
  - On request modifications: Notification with required changes, recruiter edits and resubmits
- **JD Management:**
  - View all JDs (draft, pending approval, active, closed)
  - Edit draft JDs (before submission)
  - Pause active JDs (temporarily hide from students)
  - Close JDs (stop accepting applications)
  - Clone JDs (create new JD from existing template)

**Business Rules:**
- JD approval required before student visibility
- Eligibility criteria must align with global policies
- CTC disclosure mandatory (no "as per industry standards")
- Bond terms > 2 years require special approval (4-eyes)
- Discriminatory language auto-flagged and rejected
- All JD approval actions logged with approver ID and timestamp

**API Endpoints:**
- `POST /api/public/recruiters/jobs/create` - Create job posting
- `PUT /api/public/recruiters/jobs/:id/update` - Update job posting (draft or modifications required)
- `GET /api/public/recruiters/jobs/list` - Get all job postings for recruiter
- `GET /api/public/recruiters/jobs/:id` - Get job posting details
- `PUT /api/public/recruiters/jobs/:id/pause` - Pause job posting
- `PUT /api/public/recruiters/jobs/:id/close` - Close job posting

**UI Screens:**
- Job Posting Creation Form (job details, eligibility criteria, compensation, selection process, bond terms, deadline)
- Job Posting List (tabs: draft, pending approval, active, closed; filters, columns, actions per row)
- Job Posting Details (full JD, approval status, application count, shortlist count)
- Job Posting Editor (edit draft or modifications required)

---

### C4.3: View and Filter Student Applications

**Description:** Access verified student applications (only after TPO_Admin approval), view profiles and resumes, filter and search.

**Features:**
- **Application Dashboard:**
  - List of all applications for recruiter's job postings
  - Filters: Job posting, application status (new, shortlisted, rejected, offered, accepted), CGPA range, department, date range
  - Sort: CGPA (high to low), application date (oldest first), name (A-Z)
  - Search: Student name, enrollment number, skills
- **Application Details:**
  - Student profile: Name, enrollment, department, degree, year, CGPA, active backlogs
  - Resume: PDF preview, download (watermarked)
  - Cover letter (if provided)
  - Contact information: Email, mobile (only for shortlisted students)
  - Application date, status, timeline
- **Consent Verification:**
  - All applications have valid consent (consent_given = TRUE, not revoked)
  - Consent timestamp and IP logged
  - Access expires on consent revocation
- **Bulk Actions:**
  - Select multiple applications
  - Batch shortlist (max 100 at a time)
  - Batch reject with common reason
  - Export to Excel/CSV

**Business Rules:**
- Recruiters can only view applications for their own job postings
- Applications visible only after TPO_Admin approval (two-tier approval)
- Contact information visible only for shortlisted students
- All application views logged for audit
- Access expires on consent revocation

**API Endpoints:**
- `GET /api/public/recruiters/applications/list` - Get all applications for recruiter's job postings
- `GET /api/public/recruiters/applications/:id` - Get application details
- `GET /api/public/recruiters/applications/:id/resume` - Download resume (watermarked)

**UI Screens:**
- Application Dashboard (filters, columns, actions per row, bulk actions)
- Application Details Modal (student profile, resume preview, cover letter, contact info, timeline)
- Resume Viewer (PDF preview with watermark, download button)

---

### C4.4: Shortlist Candidates and Manage Interview Schedules

**Description:** Shortlist candidates, schedule interview rounds, manage interview logistics, track attendance.

**Features:**
- **Shortlist Management:**
  - Select applications → Shortlist → Notify students and TPO
  - Shortlist status: Shortlisted / Not Shortlisted / Rejected
  - Shortlist notes: Internal notes (not visible to students)
  - Bulk shortlist: Select multiple (max 100), confirm, notify
- **Interview Scheduling:**
  - Create interview event: Title, description, date/time, location (physical/virtual), attendees (shortlisted students)
  - Interview rounds: Aptitude, Technical, HR, etc.
  - Interview mode: Online (meeting link) / Offline (room number) / Hybrid
  - RSVP required: Yes/No, RSVP deadline
  - Reminders: Default (T-72h, T-24h, T-2h) or custom
  - Attachments: Interview instructions, test syllabus, company profile
- **Interview Logistics:**
  - Coordinate with TPO_Dept for slot allocation
  - Respect blackout windows and department priorities
  - Conflict detection: Overlapping events, exam conflicts
  - Resolution: Reschedule interview, adjust timeline
- **Attendance Tracking:**
  - Mark attendance post-interview
  - No-show tracking: Students who didn't attend
  - Escalation to TPO_Admin for policy violations

**Business Rules:**
- Shortlisting triggers notifications to students and TPO
- Interview scheduling requires TPO_Dept confirmation
- All changes trigger notifications and audit entries
- No-show policy enforced (3 warnings → 5 suspension)

**API Endpoints:**
- `POST /api/public/recruiters/applications/shortlist` - Shortlist applications
- `POST /api/public/recruiters/interviews/create` - Create interview event
- `PUT /api/public/recruiters/interviews/:id/update` - Update interview event
- `POST /api/public/recruiters/interviews/attendance/mark` - Mark attendance

**UI Screens:**
- Shortlist Management Page (application list, shortlist actions, bulk shortlist)
- Interview Scheduling Form (title, description, date/time, location, attendees, RSVP, reminders)
- Interview Calendar (calendar view, event details, RSVP list, attendance tracking)

---

### C4.5: Extend Offers and Track Acceptance

**Description:** Extend job offers to selected candidates, track offer acceptance/rejection, manage offer lifecycle.

**Features:**
- **Offer Creation:**
  - Select shortlisted student → Extend Offer
  - Offer details: Job title, CTC breakdown, joining date, location, bond terms, offer letter (upload PDF)
  - Offer expiry: Deadline for student to accept/reject
  - Offer notes: Internal notes (not visible to students)
- **Offer Lifecycle:**
  - Offer status: Extended → Accepted / Rejected / Expired
  - Student actions: Accept (confirm joining), Reject (provide reason), Request Extension
  - Recruiter actions: Rescind offer (with reason), Extend deadline
- **Offer Verification:**
  - TPO_Dept verifies offer details (CTC, joining date, documents)
  - Handle conflicts: Multiple offers, policy violations
  - Critical updates (rescinds) require multi-party confirmation
- **Offer Tracking:**
  - Dashboard: All offers with status, student details, offer date, expiry date
  - Filters: Status, job posting, date range
  - Export: Excel/CSV for reporting

**Business Rules:**
- Offer extension triggers notifications to student and TPO
- Offer acceptance/rejection triggers notifications to recruiter and TPO
- Offer rescind requires justification and TPO_Admin approval
- All offer actions logged for audit
- Full audit trail maintained

**API Endpoints:**
- `POST /api/public/recruiters/offers/create` - Extend job offer
- `PUT /api/public/recruiters/offers/:id/rescind` - Rescind offer
- `PUT /api/public/recruiters/offers/:id/extend-deadline` - Extend offer deadline
- `GET /api/public/recruiters/offers/list` - Get all offers for recruiter

**UI Screens:**
- Offer Creation Form (student, job title, CTC breakdown, joining date, offer letter, expiry)
- Offer Dashboard (filters, columns, actions per row)
- Offer Details Modal (student profile, offer details, status timeline, actions)

---

### C4.6: View Recruitment Analytics and Reports

**Description:** View recruitment metrics, application funnel, offer acceptance rates, export data.

**Features:**
- **Recruitment Dashboard:**
  - **Job Posting Metrics:**
    - Total job postings: Active, closed, pending approval
    - Avg applications per job posting
    - Avg time to fill (from posting to offer acceptance)
  - **Application Metrics:**
    - Total applications: Count, trend over time
    - Application funnel: Applied → Shortlisted → Interviewed → Offered → Accepted
    - Application success rate: (Shortlisted / Total) × 100%
  - **Offer Metrics:**
    - Total offers: Extended, accepted, rejected, expired
    - Offer acceptance rate: (Accepted / Extended) × 100%
    - Avg time to accept (from offer to acceptance)
  - **Candidate Metrics:**
    - Avg CGPA of applicants, shortlisted, offered, accepted
    - Department-wise breakdown
    - Skill distribution
- **Custom Reports (Exportable):**
  - Report types: Application summary, shortlist summary, offer summary, candidate profile summary
  - Filters: Job posting, date range, status, department, CGPA range
  - Export formats: Excel (raw data, multiple sheets), CSV (single table)
- **Data Visualization:**
  - Charts: Application funnel, offer acceptance rate trend, department-wise applications, CGPA distribution
  - Interactive filters: Click to drill down, filter by job posting/date range

**Business Rules:**
- Analytics scoped to recruiter's own organization only
- No access to other recruiters' data
- All data exports logged for audit

**API Endpoints:**
- `GET /api/public/recruiters/analytics/dashboard` - Get recruitment dashboard metrics
- `POST /api/public/recruiters/reports/generate` - Generate custom report
- `GET /api/public/recruiters/reports/list` - Get generated reports list

**UI Screens:**
- Recruitment Dashboard (quick stats, charts, trend analysis)
- Reports Page (templates, custom builder, generated reports list)
- Analytics Page (charts, metrics, interactive filters)

---

### C4.7: Communicate with TPO and Students (Controlled)

**Description:** Send messages to TPO, communicate with shortlisted students (via TPO), request clarifications.

**Features:**
- **Communication with TPO:**
  - Send messages to TPO_Admin or TPO_Dept
  - Use cases: Request JD modifications, report issues, request deadline extension, coordinate interview schedules
  - Message thread: View conversation history
  - Notifications: Email + in-app on new messages
- **Communication with Students (Controlled):**
  - Recruiters cannot directly email/SMS students
  - All communications routed through TPO
  - Use cases: Interview instructions, offer details, joining formalities
  - TPO approves message before delivery to students
- **Notification Preferences:**
  - Configure notification channels (email, in-app)
  - Frequency: Immediate / Daily digest
  - Opt-out: Non-critical notifications only

**Business Rules:**
- Direct student contact only for shortlisted candidates (email/mobile visible)
- All communications logged for audit
- TPO can moderate/block messages if policy violations detected

**API Endpoints:**
- `POST /api/public/recruiters/messages/send-to-tpo` - Send message to TPO
- `GET /api/public/recruiters/messages/list` - Get message thread with TPO
- `PUT /api/public/recruiters/notifications/preferences/update` - Update notification preferences

**UI Screens:**
- Message Composer (to TPO, subject, body, attachments)
- Message Thread (conversation history with TPO)
- Notification Settings (channels, frequency, opt-out)

---

## 🚫 Constraints

### K4.1: No Access to Unverified or Non-Consented Student Data
- **What:** Recruiters can only view students who have applied and given consent
- **Why:** Privacy protection, GDPR/FERPA compliance
- **Enforcement:** Application-level access control, consent verification
- **Exception:** None (strict enforcement)

### K4.2: Cannot Directly Contact Students (Except Shortlisted)
- **What:** Recruiters cannot directly email/SMS students (except shortlisted candidates)
- **Why:** Prevent spam, maintain TPO control, protect student privacy
- **Enforcement:** Contact information visible only for shortlisted students
- **Exception:** Shortlisted students (email/mobile visible)

### K4.3: JD Approval Required Before Student Visibility
- **What:** Job postings must be approved by TPO_Admin before students can view
- **Why:** Quality control, policy compliance, prevent fraudulent postings
- **Enforcement:** Application-level workflow, JD status check
- **Exception:** None (strict enforcement)

---

## 📊 Recruiter Workflow (Complete Journey)

### Phase 1: Organization Registration and Verification
1. Recruiter visits registration page
2. Fills organization details (company, legal, POC, documents)
3. Submits registration → Status: Pending Verification
4. TPO_Admin reviews → Approve/Reject/Request More Info
5. On approval: POC account activated, recruiter receives login credentials
6. Recruiter logs in and accesses dashboard

### Phase 2: Job Posting Creation and Approval
1. Recruiter clicks "Create Job Posting"
2. Fills JD form (job details, eligibility, compensation, selection process, bond terms, deadline)
3. Submits JD → Status: Pending TPO_Admin Approval
4. TPO_Admin reviews → Approve/Reject/Request Modifications
5. On approval: JD published to students, eligibility engine runs, eligible students notified
6. Recruiter receives notification: "Your job posting has been approved"

### Phase 3: Application Review and Shortlisting
1. Students apply → TPO_Dept approves → TPO_Admin approves → Applications forwarded to recruiter
2. Recruiter receives notification: "New applications for [Job Title]"
3. Recruiter views application dashboard (filters, search)
4. Recruiter reviews applications (profile, resume, cover letter)
5. Recruiter shortlists candidates (individual or batch)
6. Students and TPO receive notification: "You have been shortlisted for [Company]"

### Phase 4: Interview Scheduling and Coordination
1. Recruiter creates interview event (title, date/time, location, attendees, RSVP, reminders)
2. TPO_Dept confirms slot allocation
3. Students receive notification with interview details
4. Students RSVP (Attending/Not Attending/Tentative)
5. Recruiter conducts interview
6. Recruiter marks attendance

### Phase 5: Offer Extension and Tracking
1. Recruiter selects candidate → Extend Offer
2. Fills offer details (CTC, joining date, offer letter, expiry)
3. Submits offer → TPO_Dept verifies
4. Student receives notification: "You have received an offer from [Company]"
5. Student accepts/rejects offer
6. Recruiter receives notification: "Offer accepted/rejected by [Student Name]"
7. Recruiter tracks offer status (dashboard)

### Phase 6: Recruitment Analytics and Reporting
1. Recruiter views recruitment dashboard (job posting metrics, application metrics, offer metrics, candidate metrics)
2. Recruiter generates custom report (application summary, shortlist summary, offer summary)
3. Recruiter applies filters (job posting, date range, status, department)
4. Recruiter exports report (Excel, CSV)
5. Recruiter analyzes data for process optimization

---

## 🗄️ Recruiter Data Model (Key Tables)

### recruiters.organizations
- **Purpose:** Recruiter organization profiles
- **Key Fields:** org_name, website, industry, size, headquarters, gst_number, cin, pan, recruiter_status, verified_at, verified_by

### recruiters.pocs
- **Purpose:** Points of Contact for organizations
- **Key Fields:** poc_name, designation, email, mobile_number, is_primary, org_id, is_active

### recruiters.job_postings
- **Purpose:** Job postings (JDs)
- **Key Fields:** job_title, description, eligibility_criteria (JSONB), ctc_breakdown (JSONB), selection_process (JSONB), bond_terms (JSONB), application_deadline, status, approved_at, approved_by

### recruiters.job_applications
- **Purpose:** Student applications for job postings
- **Key Fields:** student_id, job_posting_id, resume_id, cover_letter, consent_id, status, reviewed_by_dept, reviewed_by_admin, forwarded_to_recruiter

### recruiters.offers
- **Purpose:** Job offers extended to students
- **Key Fields:** student_id, job_posting_id, ctc_breakdown (JSONB), joining_date, offer_letter_path, offer_expiry, status, accepted_at, rejected_at

---

## 🔐 Security & Privacy

### Access Control
- **Organization-scoped access:** Can only view applications for own job postings
- **Consent-based access:** Can only view students who have applied and given consent
- **Time-limited access:** Access expires on consent revocation

### Audit Logging
- **All recruiter actions logged:** Actor, action, target, timestamp, IP
- **Application views logged:** Which recruiter viewed which student profile, when
- **Communication logged:** All messages to TPO, students

### Data Protection
- **Student PII encrypted:** Contact information, addresses
- **Resume watermarked:** Student name + enrollment number + "Confidential"
- **Signed URLs:** 1-hour expiry for resume downloads

---

## 📱 UI/UX Specifications

### Dashboard Layout
1. **Header:** Company name, POC name, last login
2. **Quick Stats Cards:** Active Job Postings, Total Applications, Shortlisted Candidates, Offers Extended
3. **Action Widgets:** Pending JD Approvals, New Applications, Upcoming Interviews, Pending Offer Responses
4. **Charts:** Application Funnel, Offer Acceptance Rate, Department-wise Applications
5. **Notifications Panel:** Unread notifications with filters

### Job Posting List Page
- **Tabs:** Draft / Pending Approval / Active / Closed
- **Filters:** Status, deadline, date range
- **Columns:** Job Title, Eligibility Criteria, Application Deadline, Applications Count, Status, Actions
- **Actions per row:** View Details, Edit (draft), Pause (active), Close (active), Clone

### Application Dashboard Page
- **Filters:** Job posting, status, CGPA range, department, date range
- **Columns:** Student Name, Enrollment, Department, CGPA, Resume, Application Date, Status, Actions
- **Actions per row:** View Profile, Shortlist, Reject, Download Resume
- **Bulk Actions:** Select multiple → Batch Shortlist / Batch Reject

### Interview Calendar Page
- **Left Sidebar:** Mini calendar, event filters (type), upcoming events list
- **Main Area:** Calendar grid (month/week/day views)
- **Right Panel:** Event details, RSVP list, attendance tracking
- **Features:** Create Interview button, export to ICS

### Offer Dashboard Page
- **Filters:** Status, job posting, date range
- **Columns:** Student Name, Job Title, CTC, Joining Date, Offer Date, Expiry Date, Status, Actions
- **Actions per row:** View Details, Rescind, Extend Deadline

---

## 🔗 Integration Points

1. **With TPO_Admin:** Organization verification, JD approval, communication
2. **With TPO_Dept:** Interview scheduling, offer verification, coordination
3. **With Students:** Indirect (via TPO approval), shortlisted students (direct contact)
4. **With Notification Services:** Email for notifications and communications

---

## 📈 Success Metrics

### JD Approval Speed
- **Target:** 90%+ JDs approved within 24 hours
- **Metric:** (JDs approved within 24h / Total JD submissions) × 100%

### Application Quality
- **Target:** 80%+ applications meet eligibility criteria
- **Metric:** (Eligible applications / Total applications) × 100%

### Offer Acceptance Rate
- **Target:** 70%+ offers accepted
- **Metric:** (Accepted offers / Extended offers) × 100%

### Time to Fill
- **Target:** Avg 30 days from posting to offer acceptance
- **Metric:** Avg (Offer acceptance date - Job posting date)

---

## 🆘 Support & Help

### In-App Help
- **Tooltips:** Contextual help on JD creation, application review, offer extension
- **FAQs:** Common questions about registration, JD approval, application access, interview scheduling
- **Video Tutorials:** Organization registration, JD creation, application review, interview scheduling

### Contact Support
- **TPO_Admin:** JD approval issues, policy questions, escalations
- **TPO_Dept:** Interview scheduling, offer verification, coordination
- **Email:** recruiter-support@college.edu

---

## 📚 Additional Resources

- **Recruiter Handbook:** Complete guide to using the TPO system
- **JD Creation Guidelines:** Best practices for writing effective job descriptions
- **Interview Scheduling Guide:** How to coordinate with TPO for interview slots
- **Offer Management Guide:** How to extend and track job offers

---

**Document Version:** 1.0  
**Last Updated:** 2024-01-15  
**Maintained By:** TPO Development Team  
**For:** Recruiters partnering with [College Name]
