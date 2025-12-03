# ROLE: TPO_DEPT (Department Coordinator) — Complete Role Description

**Role ID:** `ROLE_TPO_DEPT`  
**System Access:** Internal System (Desktop, Local Network)  
**Authentication:** VPN/ZTNA, Mandatory MFA, Device Posture Checks  
**Primary Interface:** Desktop application or desktop-optimized web portal

---

## 🎯 Role Purpose

Department TPO Coordinators are the **first line of quality control** in the placement process. They:
- Verify student profiles and documents for their department
- Review and approve applications before forwarding to TPO_Admin
- Coordinate with students for profile corrections and application guidance
- Generate department-level reports and analytics
- Manage department-specific calendar events and reminders

**Key Value:** Distributed workload, department-level expertise, faster processing, clear accountability.

---

## 👤 Intended Users

- Department-level placement coordinators (faculty or authorized staff/students)
- Faculty members designated as placement coordinators
- Senior students appointed as department placement representatives
- Department heads with placement responsibilities
- One or more coordinators per department (CSE, ECE, ME, CE, IT, EE, etc.)

---

## 📋 Core Responsibilities

### R2.1: Manage Department-Specific Student Data Quality and Eligibility Checks
- **What:** Verify student profiles, documents, and academic data for department students only
- **Why:** Department coordinators know their students better, ensuring data quality
- **How:** Profile review checklist, document verification, academic data cross-checking
- **Accountability:** Verification status tracked, SLA monitoring, escalation to TPO_Admin for issues

### R2.2: Coordinate Applications, Shortlisting, and Interview Logistics for the Department
- **What:** Review applications (first gate), manage shortlists, coordinate interview schedules
- **Why:** Department-level filtering reduces TPO_Admin workload, ensures quality applications
- **How:** Application queue management, batch approval, shortlist validation
- **Accountability:** All review actions logged, approval/rejection reasons documented

### R2.3: Provide Feedback to TPO_Admin for Policy Tuning
- **What:** Report data quality issues, suggest policy improvements, escalate anomalies
- **Why:** Ground-level insights help refine placement policies
- **How:** Regular reports, feedback forms, escalation workflow
- **Accountability:** Feedback tracked, policy changes documented

---

## 🔑 Capabilities (Detailed)

### C2.1: View and Manage Department Roster, Validate Profiles, Lock/Unlock Edits

**Description:** Access department students list, review profiles, verify documents, approve/reject/hold profiles.

**Features:**
- **Department Roster View:**
  - List of all students in assigned department(s)
  - Filters: Verification status (Pending/Verified/Rejected), profile completion %, graduation year, semester
  - Sort: Enrollment number, name, last updated, profile completion %
  - Quick stats: Total students, Pending verification, Verified, Rejected, Avg profile completion %
- **Profile Review Checklist:**
  - Personal information accuracy (name, contact, address, category)
  - Document uploads (SSC/HSC/Diploma marksheets - clear, readable, data match)
  - Resume quality (PDF format, watermark, content quality)
  - Contact information verification (mobile OTP, email verified)
- **Verification Actions:**
  - **✅ Verify:** All documents correct → Set tpo_dept_verified = TRUE → Notify student
  - **⏸️ Hold:** Issues found → Add dept_review_notes → Notify student with specific issues → Set reminder (T+3 days)
  - **❌ Reject:** Major discrepancies → Add rejection reason → Escalate to TPO_Admin → Notify student with appeal process
- **Bulk Verification:**
  - Select multiple students (max 50 at a time)
  - Batch verify with confirmation dialog
  - Individual audit logs for each student

**Business Rules:**
- BR-D1: TPO_Dept can only verify students in assigned department (K2.1)
- BR-D2: Verification requires profile completion >= 80%
- BR-D3: Rejected profiles require escalation to TPO_Admin
- BR-D4: All verification actions logged with timestamp and verifier ID

**API Endpoints:**
- `GET /api/internal/dept/students/list` - Get department students with filters
- `PUT /api/internal/dept/students/:id/verify` - Verify student profile
- `PUT /api/internal/dept/students/:id/hold` - Hold profile for corrections
- `PUT /api/internal/dept/students/:id/reject` - Reject student profile
- `POST /api/internal/dept/students/bulk-verify` - Batch verify students

**UI Screens:**
- Student Roster Page (filters, columns, actions per row, bulk actions)
- Profile Review Modal (checklist, documents preview, verification actions)
- Bulk Verification Confirmation (summary, confirm/cancel)

---

### C2.2: Run Eligibility Filters, Manage Shortlists, Propose Corrections

**Description:** Review applications (first gate), run eligibility checks, manage shortlists, propose corrections.

**Features:**
- **Application Queue Management:**
  - Receive applications from students (status: Submitted → Pending TPO_Dept Review)
  - Queue filters: Status, job posting (company, role), student (enrollment, CGPA), date range
  - Queue sorting: Priority (deadline first), CGPA (high to low), submission date (oldest first)
  - Bulk actions: Select multiple, batch approve (max 100 at a time), batch reject
- **Application Review Checklist:**
  - Profile verification status (tpo_dept_verified = TRUE required)
  - Eligibility re-verification (CGPA >= cutoff, backlogs <= max, department match, graduation year)
  - Resume quality check (primary resume attached, active version, watermark, file size <= 2MB)
  - Consent verification (consent given, not revoked, timestamp and IP logged)
  - Department constraints (max applications per student, no duplicates, deadline not passed)
- **Review Actions:**
  - **✅ Approve:** All checklist passed → Forward to TPO_Admin → Notify student
  - **⏸️ Hold:** Issues found → Add dept_review_notes → Notify student with action items → Set reminder (T+2 days)
  - **❌ Reject:** Major issues → Add rejection reason → Notify student with appeal process
- **Batch Approval Workflow:**
  - Filter applications (verified profiles, eligible, complete)
  - Preview list with key details
  - Confirm batch approval
  - System validates each individually
  - Summary report (X approved, Y flagged, Z rejected)

**Business Rules:**
- BR-D9: Applications require profile verification before review
- BR-D10: TPO_Dept can only review applications from department students (K2.1)
- BR-D11: Rejected applications can be appealed to TPO_Admin
- BR-D12: Batch approval max 100 applications at a time
- BR-D13: All review actions logged with reviewer ID and timestamp

**API Endpoints:**
- `GET /api/internal/dept/applications/queue` - Get application review queue
- `PUT /api/internal/dept/applications/:id/approve` - Approve application
- `PUT /api/internal/dept/applications/:id/hold` - Hold application
- `PUT /api/internal/dept/applications/:id/reject` - Reject application
- `POST /api/internal/dept/applications/bulk-approve` - Batch approve applications

**UI Screens:**
- Application Queue Page (filters, columns, actions per row, bulk actions)
- Application Review Modal (student profile, resume preview, eligibility check, review actions)
- Batch Approval Confirmation (summary, confirm/cancel)

---

### C2.3: Create Department Announcements and Schedule Department-Specific Events

**Description:** Send announcements to department students, create calendar events, manage reminders.

**Features:**
- **Department Announcements:**
  - Compose message (subject, body)
  - Select audience: All department students / Specific year / Specific semester / Custom filter
  - Preview: Recipient count, message preview
  - Schedule: Send immediately / Schedule for later
  - Delivery: Email + In-app notification (SMS optional for critical)
  - Tracking: Delivery status (sent, delivered, read), open rates
- **Department Calendar Events:**
  - Event types: Verification deadlines, application deadlines, PPTs, tests, interviews, department meetings
  - Event creation form: Type, title, description, date/time, location (physical/virtual), attendees, RSVP, reminders, attachments
  - Workflow: Create event → Save to scheduling.events → Notify attendees → RSVP tracking → Attendance marking
- **Student Reminder System:**
  - Reminder types: Profile completion, verification pending, application deadline, document correction, interview/test
  - Automated reminders: Configurable triggers, frequency, channels (email/SMS/push)
  - Custom reminders: Compose message, select recipients, schedule
  - Reminder history: Track sent reminders, delivery status, student actions

**Business Rules:**
- BR-D14: Bulk communications rate-limited (1 per day per department)
- BR-D15: All communications logged for audit
- BR-D16: Students can opt-out of non-critical notifications
- BR-D17: Critical messages (deadlines, urgent actions) override opt-out
- BR-D22: Department events visible only to department students and TPO_Admin
- BR-D23: Automated reminders respect student opt-out preferences (except critical)
- BR-D24: Reminder rate limits (max 3 reminders per day per student across all types)

**API Endpoints:**
- `POST /api/internal/dept/announcements/create` - Send department announcement
- `POST /api/internal/dept/events/create` - Create department event
- `GET /api/internal/dept/events/list` - Get department events
- `POST /api/internal/dept/reminders/send` - Send reminder to students
- `GET /api/internal/dept/reminders/history` - Get reminder history

**UI Screens:**
- Announcement Composer (subject, body, audience selector, preview, schedule)
- Event Creation Form (type, title, description, date/time, location, attendees, RSVP, reminders)
- Reminder Composer (type, message, recipients, schedule, channels)
- Reminder History (list with delivery status, student actions)

---

### C2.4: Manage Slot Requests for Department Rounds, Coordinate Panel Schedules

**Description:** Propose interview schedules, coordinate with recruiters, manage conflicts, track attendance.

**Features:**
- **Schedule Proposal:**
  - Respect blackout windows and department priorities (C1.4)
  - Coordinate with recruiter panel availability
  - Central Scheduling Service allocates slots
- **Conflict Detection:**
  - Overlapping events, exam conflicts
  - Resolution workflow: Student requests reschedule → TPO_Dept coordinates → Updated schedule pushed
- **Attendance Tracking:**
  - Mark attendance post-event
  - No-show policy enforcement (3 warnings → 5 suspension)
  - Escalation to TPO_Admin for policy violations

**Business Rules:**
- Schedule finalization requires TPO_Dept confirmation
- All changes trigger notifications and audit entries
- No-show policy enforced (CAL5)

**API Endpoints:**
- `POST /api/internal/dept/scheduling/slots/create` - Create interview slots
- `PUT /api/internal/dept/scheduling/slots/:id/update` - Update slot
- `POST /api/internal/dept/scheduling/attendance/mark` - Mark attendance

**UI Screens:**
- Scheduling Page (calendar view, slot creation, conflict detection)
- Attendance Tracking (event list, mark attendance, no-show alerts)

---

### C2.5: Record and Verify Offers for Department Students, Handle Exceptions/Appeals

**Description:** Verify offers, handle conflicts (multiple offers), manage exceptions and appeals.

**Features:**
- **Offer Verification:**
  - Recruiter submits offer → TPO_Dept verifies
  - Check: Offer details, CTC breakdown, joining date, documents
  - Handle conflicts: Multiple offers, policy violations
- **Exception Handling:**
  - Student appeals (application rejection, profile rejection)
  - Internal notes (not shared with public system)
  - Escalation to TPO_Admin for complex cases

**Business Rules:**
- Critical updates (rescinds) require multi-party confirmation
- Full audit trail maintained
- Internal notes do not leave Internal boundary (INT3)

**API Endpoints:**
- `PUT /api/internal/dept/offers/:id/verify` - Verify offer
- `POST /api/internal/dept/exceptions/create` - Create exception/appeal
- `GET /api/internal/dept/exceptions/list` - Get exceptions list

**UI Screens:**
- Offer Verification Page (offer details, verification actions)
- Exception Handling Page (appeals list, internal notes, escalation)

---

### C2.6: Limited Analytics and Exports Scoped to Department

**Description:** Department-level dashboards, custom reports, data visualization, feed metrics to TPO_Admin.

**Features:**
- **Department Dashboard (Real-time):**
  - Student metrics: Total, verified, pending, rejected, avg profile completion %, avg CGPA
  - Application metrics: Total, pending review, approved, rejected, success rate
  - Placement metrics: Eligible, applied, shortlisted, placed, avg CTC, median CTC, highest CTC
  - Trend analysis: Placement rate over years, top companies, popular roles, skill demand
- **Custom Reports (Exportable):**
  - Report types: Placement summary, student eligibility, application status, verification pending, offer acceptance
  - Filters: Academic year, semester, graduation year, CGPA range, backlog status, verification status, placement status
  - Export formats: PDF (formatted with charts), Excel (raw data, multiple sheets), CSV (single table)
  - Scheduling: One-time (download immediately), recurring (auto-generate weekly/monthly, email to TPO_Dept and TPO_Admin)
- **Data Visualization:**
  - Charts: Placement rate trend, CGPA distribution, application funnel, top companies, skill demand heatmap
  - Interactive filters: Click to drill down, filter by year/semester/company/role
- **Feed Metrics to TPO_Admin:**
  - Department-level aggregates sent to TPO_Admin for college-wide analytics
  - Data shared: Total students, verified count, applied count, placed count, avg CTC
  - Anonymized: No individual student PII shared (K2.1)

**Business Rules:**
- BR-D18: Reports scoped to department only (K2.1, FERPA/PII safeguards)
- BR-D19: Exported data anonymized (no individual student PII in shared reports)
- BR-D20: Report generation logged for audit
- BR-D21: Sensitive reports (with PII) require justification and approval

**API Endpoints:**
- `GET /api/internal/dept/analytics/dashboard` - Get department dashboard metrics
- `POST /api/internal/dept/reports/generate` - Generate custom report
- `GET /api/internal/dept/reports/list` - Get generated reports list

**UI Screens:**
- Department Dashboard (quick stats, charts, trend analysis)
- Reports Page (templates, custom builder, generated reports list, scheduled reports)

---

### C2.7: Initiate Communication to Department Students

**Description:** Send templated, rate-limited, opt-out compliant communications to department students.

**Features:**
- **Communication Channels:** Email, SMS, In-app, Bulk announcements
- **Notification Templates:** Profile verified, document request, application status, pre-drive instructions
- **Student Support Workflows:** Document correction guidance, Exam Cell documentation help, application guidance
- **Bulk Communication:** Pre-drive announcements, deadline reminders, policy updates
- **Rate Limiting:** Max 1 bulk email per day per department, critical messages override with TPO_Admin approval

**Business Rules:**
- BR-D14: Bulk communications rate-limited (1 per day per department)
- BR-D15: All communications logged for audit
- BR-D16: Students can opt-out of non-critical notifications
- BR-D17: Critical messages override opt-out

**API Endpoints:**
- `POST /api/internal/dept/communications/send` - Send communication to students
- `POST /api/internal/dept/communications/bulk` - Send bulk announcement
- `GET /api/internal/dept/communications/log` - Get communication log

**UI Screens:**
- Communication Composer (template selector, custom message, audience, schedule)
- Communication Log (sent messages, delivery status, open rates)

---

## 🚫 Constraints

### K2.1: No Access to Other Departments' Student PII
- **What:** TPO_Dept can only view/edit students in assigned department(s)
- **Why:** Privacy protection, department-scoped responsibility
- **Enforcement:** Row-Level Security (RLS) policies at database level
- **Exception:** None (strict enforcement)

### K2.2: No Authority to Approve New Recruiters
- **What:** TPO_Dept cannot verify recruiter organizations or approve job postings
- **Why:** Centralized control by TPO_Admin for consistency
- **Enforcement:** Application-level access control
- **Exception:** Can recommend recruiters to TPO_Admin

---

## 📊 TPO_Dept Workflow (Complete Journey)

### Phase 1: Student Profile Review & Verification
1. Login to department dashboard
2. View assigned department students list
3. Filter by verification status (Pending)
4. Review student profile (checklist: personal info, documents, resume, contact)
5. Verify/Hold/Reject with notes
6. Notify student
7. Track verification progress (dashboard widget)

### Phase 2: Academic Data Review (View-Only)
1. View student's semester-wise marks (synced from Exam Portal)
2. Cross-check with uploaded marksheets
3. Flag discrepancies (CGPI mismatch, backlog count mismatch)
4. Create Exam Cell correction request (with supporting documents)
5. Monitor correction status
6. Notify student on resolution

### Phase 3: Application Review & Forwarding (First Gate)
1. Receive applications from students (Submitted → Pending TPO_Dept Review)
2. Review application (checklist: profile verified, eligibility, resume, consent, department constraints)
3. Approve/Hold/Reject with notes
4. Forward approved applications to TPO_Admin
5. Notify student
6. Track application progress (dashboard widget)

### Phase 4: Student Coordination & Support
1. Send notifications (profile verified, document request, application status)
2. Provide guidance (document correction, Exam Cell documentation, application feedback)
3. Send bulk announcements (pre-drive instructions, deadline reminders)
4. Track communication delivery and student actions

### Phase 5: Department-Level Reporting & Analytics
1. View department dashboard (real-time metrics)
2. Generate custom reports (placement summary, student eligibility, application status)
3. Export reports (PDF, Excel, CSV)
4. Schedule recurring reports (weekly/monthly)
5. Feed metrics to TPO_Admin (anonymized aggregates)

### Phase 6: Calendar & Reminder Management
1. Create department events (verification deadlines, PPTs, tests, interviews)
2. Send automated reminders (profile completion, verification pending, application deadline)
3. Send custom reminders (targeted messages)
4. Track reminder effectiveness (delivery status, student actions)
5. Coordinate with TPO_Admin (shared calendar, conflict detection)

---

## 🗄️ TPO_Dept Data Model (Key Tables)

### core.tpo_dept_coordinators
- **Purpose:** TPO_Dept coordinator profiles with permissions and settings
- **Key Fields:** dept_coordinator_name, employee_id, primary_department, assigned_departments, can_verify_profiles, can_process_applications, calendar_preferences, reminder_templates

### core.exam_correction_requests
- **Purpose:** Exam Cell correction workflow
- **Key Fields:** request_id, student_id, issue_type, description, supporting_docs, status, exam_cell_notes, created_by, reviewed_by

### core.communication_log
- **Purpose:** All communications tracking
- **Key Fields:** message_id, sender_id, recipient_type, recipient_ids, subject, body, message_type, delivery_status, sent_count, delivered_count, read_count

### core.reminder_history
- **Purpose:** Reminder effectiveness tracking
- **Key Fields:** reminder_id, student_id, reminder_type, subject, body, channel, delivery_status, action_taken, action_type

### core.report_exports
- **Purpose:** Generated reports with access control
- **Key Fields:** report_id, report_type, filters, format, file_path, generated_by, access_expiry, download_count

---

## 🔐 Security & Privacy

### Access Control
- **Department-scoped access:** Can only view/edit students in assigned department(s) (K2.1)
- **RLS policies:** Enforce department boundary at database level
- **No access to other departments' student PII**

### Audit Logging
- **All verification actions logged:** Actor, action, target, timestamp, notes
- **All application review actions logged**
- **All communications logged:** Sender, recipients, message, delivery status
- **All report generations logged:** Type, filters, generated_by

### Data Protection
- **Student PII encrypted at rest:** Column-level AES-256-GCM
- **Exported reports watermarked:** Dept coordinator name and timestamp
- **Report files auto-deleted:** After access expiry (default: 30 days)

---

## 📱 UI/UX Specifications

### Dashboard Layout
1. **Header:** Dept coordinator name, department badge, last login
2. **Quick Stats Cards:** Total Students, Pending Verifications, Pending Applications, Placed Students
3. **Action Widgets:** Verification Queue (top 5), Application Queue (top 5), Upcoming Events, Recent Reminders
4. **Charts:** Profile Verification Trend, Application Funnel, Placement Rate by Year
5. **Notifications Panel:** Unread notifications with filters

### Student Roster Page
- **Filters:** Verification status, profile completion %, year, semester, CGPA range
- **Columns:** Enrollment, Name, Year, CGPA, Profile %, Verification Status, Actions
- **Actions per row:** View Profile, Verify, Hold, Reject, Send Reminder
- **Bulk Actions:** Select multiple → Batch Verify

### Application Queue Page
- **Filters:** Status, company, deadline, CGPA range
- **Columns:** Student Name, Enrollment, Company, Role, CGPA, Resume, Status, Actions
- **Actions per row:** View Application, Approve, Hold, Reject
- **Bulk Actions:** Select multiple → Batch Approve

### Calendar Page
- **Left Sidebar:** Mini calendar, event filters (type), upcoming events list
- **Main Area:** Calendar grid (month/week/day views)
- **Right Panel:** Event details, RSVP list, attendance tracking
- **Features:** Create Event button, sync with TPO_Admin calendar, export to ICS

### Reports Page
- **Report Templates:** Pre-defined report types with filters
- **Custom Report Builder:** Select fields, filters, format
- **Generated Reports List:** Download, view, delete
- **Scheduled Reports:** Set up recurring reports

---

## 🔗 Integration Points

1. **With Students:** Profile verification, application guidance, reminders
2. **With TPO_Admin:** Application forwarding, reporting, shared calendar
3. **With Exam Cell:** Correction requests, academic data sync
4. **With Recruiters:** Indirect (through TPO_Admin approval)
5. **With Notification Services:** Email, SMS, Push for student communications

---

## 📈 Success Metrics

### Verification Efficiency
- **Target:** 90%+ students verified within 7 days of profile completion
- **Metric:** (Verified students within 7 days / Total pending verifications) × 100%

### Application Processing Speed
- **Target:** 95%+ applications reviewed within 48 hours
- **Metric:** (Applications reviewed within 48h / Total pending applications) × 100%

### Data Quality
- **Target:** < 5% profile rejections due to data quality issues
- **Metric:** (Rejected profiles / Total profiles reviewed) × 100%

### Student Engagement
- **Target:** 80%+ students respond to reminders within 24 hours
- **Metric:** (Students who took action after reminder / Total reminders sent) × 100%

---

## 🆘 Support & Help

### In-App Help
- **Tooltips:** Contextual help on verification checklist, review actions
- **FAQs:** Common questions about verification, application review, reporting
- **Video Tutorials:** Profile verification, application review, calendar management

### Contact Support
- **TPO_Admin:** System-wide issues, policy questions, escalations
- **IT Help Desk:** Technical issues, login problems, access requests
- **Email:** tpo-dept-support@college.edu

---

## 📚 Additional Resources

- **Verification Guidelines:** Detailed checklist for profile verification
- **Application Review Policy:** Criteria for approving/rejecting applications
- **Communication Templates:** Pre-approved templates for student communications
- **Reporting Guide:** How to generate and interpret department reports

---

**Document Version:** 1.0  
**Last Updated:** 2024-01-15  
**Maintained By:** TPO Development Team  
**For:** Department TPO Coordinators of [College Name]
