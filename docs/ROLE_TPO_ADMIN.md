# ROLE: TPO_ADMIN (Placement Administrator) — Complete Role Description

**Role ID:** `ROLE_TPO_ADMIN`  
**System Access:** Internal System (Desktop, Secure Network)  
**Authentication:** VPN/ZTNA, Mandatory MFA, Device Posture Checks, Privileged Access Management  
**Primary Interface:** Desktop application or desktop-optimized web portal with advanced features

---

## 🎯 Role Purpose

TPO Admins are the **central authority** for the entire placement workflow. They:
- Verify recruiter organizations and approve job postings
- Provide final approval for student applications (second gate after TPO_Dept)
- Oversee student profiles across all departments
- Generate system-wide reports and analytics
- Manage calendar events and reminders for college-wide placement activities
- Ensure compliance, transparency, and smooth placement operations

**Key Value:** Centralized control with distributed execution, data quality assurance, recruiter trust, transparent audit trail.

**Workflow Summary:**  
Recruiter → posts job → **Admin approves** → Students apply → Dept verifies → **Admin finalizes list** → Recruiter receives clean data

---

## 👤 Intended Users

- Placement Officer (primary admin)
- Assistant Placement Officers (co-admins)
- Senior administrators with placement responsibilities
- Typically 2-5 admins per institution (for 4-eyes approval)
- Role hierarchy: Super Admin > Admin > Co-Admin (optional)

---

## 📋 Core Responsibilities

### R1.1: Global Governance of Placement Processes Across All Departments
- **What:** Centralized control of recruiter verification, JD approval, application approval, policy enforcement
- **Why:** Consistency, quality, recruiter trust, compliance
- **How:** Multi-tier approval workflows, eligibility engine, audit logging
- **Accountability:** All actions logged, 4-eyes approval for sensitive operations (K1.2)

### R1.2: Security and Compliance Oversight, Audit Review, and Incident Coordination
- **What:** Monitor audit logs, review security incidents, ensure GDPR/FERPA compliance
- **Why:** Data protection, legal compliance, risk mitigation
- **How:** Immutable audit logs, compliance reports, incident response workflows
- **Accountability:** Monthly compliance reports, 10-year audit log retention

### R1.3: Master Data Ownership (Academic Years, Departments, Programs, Company Categories)
- **What:** Manage master data (departments, degrees, academic years, company categories, eligibility policies)
- **Why:** Single source of truth, consistency across system
- **How:** Master data management UI, versioning, change tracking
- **Accountability:** All master data changes logged, 4-eyes approval for critical changes

### R1.4: Recruiter and Job Posting Verification and Approval
- **What:** Verify recruiter organizations, approve job postings, manage blacklist
- **Why:** Prevent fraud, ensure quality opportunities, protect students
- **How:** Document verification, eligibility preview, policy compliance checks
- **Accountability:** All verification actions logged, blacklisting requires 4-eyes approval

### R1.5: Final Application Approval Before Forwarding to Recruiters
- **What:** Review applications (second gate after TPO_Dept), approve/reject/flag
- **Why:** Final quality check, anomaly detection, fairness enforcement
- **How:** Application queue, batch approval, override dept decisions (with justification)
- **Accountability:** All review actions logged, overrides require 4-eyes approval

### R1.6: System-wide Reporting, Analytics, and Data Export
- **What:** Generate placement reports, analytics dashboards, compliance reports, anonymized exports
- **Why:** Stakeholder reporting, accreditation, data-driven decisions
- **How:** Real-time dashboards, custom report builder, scheduled reports
- **Accountability:** All exports logged with purpose and recipient

### R1.7: Calendar and Reminder Management for College-wide Placement Activities
- **What:** Create college-wide events, send bulk reminders, coordinate with TPO_Dept, track effectiveness
- **Why:** Centralized scheduling, deadline enforcement, student engagement
- **How:** System-wide calendar, automated reminders, task assignments, analytics
- **Accountability:** All events and reminders logged, effectiveness tracked

---

## 🔑 Capabilities (Detailed)

### C1.1: View All Student Profiles (Cross-Department) with Override Capability

**Description:** Access all student profiles across departments, override dept verification (with justification and 4-eyes approval).

**Features:**
- **Cross-Department Access:** View profiles from all departments (no K2.1 restriction)
- **Dashboard Filters:** Department, verification status, profile completion %, CGPA range, graduation year, placement status
- **Monitor Verification Status:** Department-wise verification statistics, alerts for low verification rates, SLA breaches
- **Override Verification:** Admin can override dept rejection with justification and 4-eyes approval
- **Consent Compliance:** Dashboard widget showing consent statistics, reminders to students without consent
- **Data Quality Monitoring:** Automated checks for missing fields, academic data flags, expired documents

**Business Rules:**
- BR-A17: Admin can view all student profiles across departments (no K2.1 restriction)
- BR-A18: Admin can override dept verification with justification and 4-eyes approval (K1.2)
- BR-A19: Students without consent cannot apply (enforced at application level)
- BR-A20: All admin overrides logged with justification and approver ID

**API Endpoints:**
- `GET /api/internal/admin/students/all` - Get all student profiles (cross-department)
- `PUT /api/internal/admin/students/:id/override-verification` - Override dept verification (requires 4-eyes)

**UI Screens:**
- Student Oversight Page (filters, columns, actions per row)
- Profile Review Modal (full profile, verification history, override action)
- Override Justification Form (reason, 4-eyes approval workflow)

---

### C1.2: Approve/Reject Student Applications (Final Gate) with Batch Operations

**Description:** Review applications (second gate after TPO_Dept), approve/reject/flag, batch approval, override dept decisions.

**Features:**
- **Application Queue:** Pending TPO_Admin Review (after TPO_Dept approval)
- **Queue Filters:** Status, job posting, department, CGPA range, date range
- **Review Checklist:** Profile verified, eligibility re-verification, dept review, policy compliance, fairness & anomaly detection
- **Review Actions:**
  - **✅ Approve:** Forward to recruiter, notify student
  - **❌ Reject:** Add rejection reason, notify student with appeal process
  - **🚩 Flag:** Escalate to senior admin or compliance team
- **Batch Approval:** Select multiple (max 200), preview, confirm, validate individually, summary report
- **Override Dept Decision:** Rare, requires justification and 4-eyes approval

**Business Rules:**
- BR-A12: Applications require TPO_Dept approval before admin review (two-tier approval)
- BR-A13: Admin can override dept decisions with justification and 4-eyes approval (K1.2)
- BR-A14: Batch approval max 200 applications at a time
- BR-A15: Flagged applications require investigation before approval/rejection
- BR-A16: All admin review actions logged with reviewer ID and timestamp

**API Endpoints:**
- `GET /api/internal/admin/applications/pending` - Get pending application approvals
- `PUT /api/internal/admin/applications/:id/approve` - Approve application (final gate)
- `PUT /api/internal/admin/applications/:id/reject` - Reject application
- `PUT /api/internal/admin/applications/:id/flag` - Flag application for investigation
- `POST /api/internal/admin/applications/bulk-approve` - Batch approve applications

**UI Screens:**
- Application Approval Page (tabs, filters, columns, actions per row, bulk actions)
- Application Review Modal (student profile, resume preview, eligibility check, review actions)
- Batch Approval Confirmation (summary, confirm/cancel)
- Override Justification Form (reason, 4-eyes approval workflow)

---

### C1.3: Verify Recruiters, Approve Job Postings, Manage Blacklist

**Description:** Verify recruiter organizations, approve job postings, manage blacklist, POC account management.

**Features:**
- **Recruiter Verification:**
  - Review checklist: Company details, legal verification (GST, CIN, PAN), POC details, supporting documents
  - Verification steps: Document review, cross-checks (website, LinkedIn, GST portal), POC email domain match, blacklist check
  - Actions: Approve (activate POC account), Reject (disable account), Request More Info
- **Blacklist Management:**
  - Use cases: Fraudulent companies, non-compliant recruiters, poor track record
  - Workflow: Admin selects org → Blacklist → Reason → 4-eyes approval → Existing jobs archived, POC accounts disabled
  - Whitelist: Remove from blacklist with justification and 4-eyes approval
- **POC Account Management:**
  - Multiple POCs per organization (primary + secondary)
  - Admin actions: Approve additional POC, disable POC, transfer ownership
- **Job Posting Approval:**
  - Review checklist: Job details, eligibility criteria, compensation details, selection process, bond/service agreement, policy compliance
  - Eligibility Engine Preview: Preview eligible students before approving JD (department breakdown, CGPA distribution, backlog distribution)
  - Actions: Approve (publish to students, run eligibility engine), Reject (notify recruiter), Request Modifications
  - Bulk Approval: Select multiple JDs (max 50), preview, confirm, validate individually
  - Post-Approval Monitoring: Application count vs. expected, recruiter activity, student complaints

**Business Rules:**
- BR-A1: Organization verification required before job posting (C1.3)
- BR-A2: Blacklisting requires 4-eyes approval (K1.2)
- BR-A3: POC email domain must match organization domain (exceptions allowed with justification)
- BR-A4: Minimum 1 active POC required per organization
- BR-A5: All verification actions logged with verifier ID and timestamp
- BR-A6: JD approval required before student visibility (C1.3)
- BR-A7: Eligibility criteria must align with global policies (C1.2)
- BR-A8: CTC disclosure mandatory (no "as per industry standards")
- BR-A9: Bond terms > 2 years require special approval (4-eyes)
- BR-A10: Discriminatory language auto-flagged and rejected
- BR-A11: All JD approval actions logged with approver ID and timestamp

**API Endpoints:**
- `GET /api/internal/admin/recruiters/pending` - Get pending recruiter verifications
- `PUT /api/internal/admin/recruiters/:id/verify` - Verify recruiter organization
- `PUT /api/internal/admin/recruiters/:id/reject` - Reject recruiter organization
- `PUT /api/internal/admin/recruiters/:id/blacklist` - Blacklist organization (requires 4-eyes)
- `GET /api/internal/admin/jds/pending` - Get pending JD approvals
- `GET /api/internal/admin/jds/:id/preview-eligibility` - Preview eligible students for JD
- `PUT /api/internal/admin/jds/:id/approve` - Approve job posting
- `PUT /api/internal/admin/jds/:id/reject` - Reject job posting
- `POST /api/internal/admin/jds/bulk-approve` - Batch approve job postings

**UI Screens:**
- Recruiter Management Page (tabs, filters, columns, actions per row)
- Recruiter Verification Modal (company details, documents, verification actions)
- Blacklist Management Page (blacklisted orgs, whitelist action)
- JD Approval Page (tabs, filters, columns, actions per row, bulk actions)
- JD Review Modal (full JD, eligibility preview, review actions)
- Eligibility Preview (department breakdown, CGPA distribution, backlog distribution)

---

### C1.4: Manage Placement Calendar, Deadlines, and Blackout Windows

**Description:** Create college-wide events, monitor department verification deadlines, track recruiter drive schedules, conflict detection.

**Features:**
- **System-wide Calendar View:**
  - Calendar types: Placement activities, verification deadlines, application deadlines, recruiter schedules, TPO staff meetings, college events (read-only)
  - Calendar views: Monthly, Weekly, Daily, Gantt Chart (timeline view for placement cycle phases)
  - Event details: Title, description, date/time, location, organizer, attendees, attachments
- **Create College-wide Events:**
  - Event types: Placement Drive, PPT, Test, Interview, Deadline, Meeting, Training
  - Event creation form: Type, title, description, date/time, location, attendees, RSVP, reminders, attachments
  - Workflow: Create event → Save to scheduling.events → Notify attendees → RSVP tracking → Attendance marking
- **Monitor Department Verification Deadlines:**
  - Dashboard widget: Department-wise verification deadline tracking
  - Alerts: Department approaching deadline with low verification rate, department missed deadline
  - Actions: Send reminder to TPO_Dept, escalate to HOD, extend deadline (requires justification)
- **Track Recruiter Drive Schedules:**
  - Dashboard widget: Upcoming drives timeline
  - Conflict detection: Overlapping drives, drive during exams, insufficient gap between drives
  - Actions: Reschedule drive, adjust timeline
- **Shared Calendar with TPO_Dept:**
  - TPO_Admin can view all department calendars (read-only)
  - TPO_Dept can view TPO_Admin's college-wide calendar (read-only)
  - Shared events: College-wide PPTs, mega drives, placement fairs

**Business Rules:**
- BR-A30: College-wide events visible to all users (students, TPO_Dept, recruiters)
- BR-A33: All calendar events and reminders logged for audit

**API Endpoints:**
- `POST /api/internal/admin/calendar/events/create` - Create college-wide event
- `GET /api/internal/admin/calendar/events/list` - Get all calendar events

**UI Screens:**
- Calendar Page (left sidebar, main area, right panel, features)
- Event Creation Form (type, title, description, date/time, location, attendees, RSVP, reminders)
- Department Verification Deadlines Widget (department-wise tracking, alerts)
- Recruiter Drive Schedules Widget (upcoming drives timeline, conflict detection)

---

### C1.5: Generate Placement Reports, Analytics, and Anonymized Exports

**Description:** Real-time dashboards, custom reports, data visualization, anonymized exports, compliance reports.

**Features:**
- **Real-time Dashboards:**
  - Placement overview: Total students, placement rate, avg/median/highest CTC, department-wise breakdown
  - Recruiter metrics: Active recruiters, job postings, application funnel
  - Application metrics: Total applications, avg per student, avg per drive, success rate
  - Trend analysis: Placement rate over years, top companies, popular roles, skill demand
- **Custom Reports (Exportable):**
  - Report types: Placement summary, department-wise, company-wise, student eligibility, application status, offer acceptance, audit report
  - Filters: Academic year, semester, graduation year, department, CGPA range, backlog status, verification status, placement status, date range, company, role, CTC range
  - Export formats: PDF (formatted with charts, tables, college logo, signatures), Excel (raw data, multiple sheets), CSV (single table)
  - Scheduling: One-time (download immediately), recurring (auto-generate weekly/monthly, email to stakeholders)
- **Data Visualization:**
  - Charts: Placement rate trend, CGPA distribution, application funnel, top companies, department-wise comparison, CTC distribution, skill demand heatmap
  - Interactive filters: Click to drill down, filter by year/semester/department/company/role, export chart as image
- **Anonymized Data Export:**
  - Use case: Share placement statistics with college management, accreditation bodies, external stakeholders
  - Anonymization: Remove PII, aggregate data (min 10 students per cohort), suppress small cells (< 5 students)
  - Export fields: Department, CGPA range, placement status, CTC range, company category
  - Workflow: Select dataset → Configure anonymization → Preview → Export → Log with purpose and recipient
- **Compliance Reports:**
  - Audit log reports: All user actions within date range (user management, recruiter verifications, JD approvals, application approvals, data exports)
  - Consent reports: Students who granted/revoked consent
  - Verification reports: Pending verifications, SLA breaches
  - Security reports: Failed login attempts, suspicious activities, anomalies

**Business Rules:**
- BR-A25: Exported data must be anonymized for external sharing (C1.5)
- BR-A26: Data exports logged with purpose and recipient (C1.8)
- BR-A27: Reports accessible only to authorized admins
- BR-A28: Real-time dashboards refresh every 15 minutes
- BR-A29: Compliance reports generated monthly and archived for 10 years

**API Endpoints:**
- `GET /api/internal/admin/analytics/dashboard` - Get system-wide dashboard metrics
- `POST /api/internal/admin/reports/generate` - Generate custom report
- `GET /api/internal/admin/reports/list` - Get generated reports list

**UI Screens:**
- Dashboard (header, quick stats cards, action widgets, charts, notifications panel)
- Reports Page (templates, custom builder, generated reports list, scheduled reports)
- Analytics Page (charts, metrics, comparative data, interactive filters)

---

### C1.6: Manage Communication Templates and Notification Workflows

**Description:** Create/edit communication templates, approve system-generated notifications, configure rate limits, emergency broadcast.

**Features:**
- **Communication Templates Management:**
  - Template types: Recruiter verification, JD approval, application status, drive eligibility, deadline reminders, placement confirmation
  - Template editor: Subject, body (HTML for email, plain text for SMS), variables ({{student_name}}, {{company_name}}, etc.), preview with sample data
  - Workflow: Create/edit template → Preview → Save → Templates versioned, old versions archived
- **Approve System-Generated Notifications:**
  - Use cases: Drive eligibility (auto-sent), application status updates (auto-sent), deadline reminders (auto-sent)
  - Workflow: System generates notification → If critical: auto-send, if non-critical: queue for admin approval → Admin reviews → Approve/Reject/Edit
- **Rate Limiting Configuration:**
  - Per-user limits: Students (10 emails/day, 5 SMS/day), Recruiters (50 emails/day, 20 SMS/day), TPO_Dept (100 emails/day, 50 SMS/day)
  - Global limits: Max 10,000 emails/hour, max 1,000 SMS/hour
  - Override: Admin can temporarily increase limits for urgent broadcasts
- **Emergency Broadcast:**
  - Use cases: Drive cancellation, system downtime, urgent policy change
  - Workflow: Admin clicks "Emergency Broadcast" → Compose urgent message → Select audience → Confirm (override DND and rate limits) → Send immediately via all channels

**Business Rules:**
- BR-A21: Emergency broadcasts override DND settings and rate limits (C1.10)
- BR-A22: All communications logged for audit (C1.6)
- BR-A23: Templates versioned; old versions archived
- BR-A24: Rate limits enforced per user and globally

**API Endpoints:**
- `GET /api/internal/admin/communications/templates` - Get communication templates
- `POST /api/internal/admin/communications/templates/create` - Create communication template
- `POST /api/internal/admin/communications/announce` - Send official announcement

**UI Screens:**
- Communication Templates Page (template list, create/edit, preview)
- Announcement Composer (subject, body, audience selector, preview, schedule)
- Emergency Broadcast Modal (urgent message, audience, confirm)

---

### C1.7: Manage User Accounts (TPO_Dept, Students, Recruiters) and Permissions

**Description:** Create/disable user accounts, assign roles, manage permissions, reset passwords, audit user actions.

**Features:**
- **User Account Management:**
  - Create accounts: TPO_Dept coordinators, students (bulk import), recruiters (via registration)
  - Disable accounts: Temporary suspension, permanent deletion (soft-delete)
  - Reset passwords: Admin-initiated password reset, email verification
- **Role & Permission Management:**
  - Roles: ROLE_TPO_ADMIN, ROLE_TPO_DEPT, ROLE_STUDENT, ROLE_RECRUITER
  - Permissions: Granular permissions per role (can_verify_profiles, can_approve_jds, etc.)
  - Role hierarchy: Super Admin > Admin > Co-Admin (optional)
- **Audit User Actions:**
  - Track all user actions (login, logout, profile updates, application submissions, etc.)
  - Audit log reports: Filter by user, action type, date range
  - Security reports: Failed login attempts, suspicious activities

**Business Rules:**
- User account creation/deletion logged with admin ID and timestamp
- Role changes require 4-eyes approval (K1.2)
- All user actions logged in immutable audit trail

**API Endpoints:**
- `POST /api/internal/admin/users/create` - Create user account
- `PUT /api/internal/admin/users/:id/disable` - Disable user account
- `PUT /api/internal/admin/users/:id/reset-password` - Reset user password
- `GET /api/internal/admin/audit/logs` - Get audit logs

**UI Screens:**
- User Management Page (user list, create/edit, disable, reset password)
- Role & Permission Management (role list, assign permissions)
- Audit Logs Page (filters, columns, search, export)

---

### C1.8: Access Audit Logs and Compliance Reports

**Description:** View immutable audit logs, generate compliance reports, export for external analysis.

**Features:**
- **Audit Logs:**
  - All admin actions logged: Actor, action, target, timestamp, IP, changes
  - Immutable: Append-only, cannot be edited or deleted
  - Offloaded to WORM storage periodically (DB5)
- **Compliance Reports:**
  - Audit log reports: All user actions within date range
  - Consent reports: Students who granted/revoked consent
  - Verification reports: Pending verifications, SLA breaches
  - Security reports: Failed login attempts, suspicious activities, anomalies
- **Export for External Analysis:**
  - Export formats: CSV, JSON
  - Use case: External audits, compliance reviews, security investigations

**Business Rules:**
- BR-A29: Compliance reports generated monthly and archived for 10 years
- All audit log exports logged with purpose and recipient

**API Endpoints:**
- `GET /api/internal/admin/audit/logs` - Get audit logs
- `POST /api/internal/admin/audit/compliance-report` - Generate compliance report

**UI Screens:**
- Audit Logs Page (filters, columns, search, export)
- Compliance Reports Page (report types, filters, generate, download)

---

### C1.9: Configure Global Policies (Eligibility Rules, Placement Constraints)

**Description:** Manage master data, configure eligibility policies, placement constraints, system settings.

**Features:**
- **Master Data Management:**
  - Departments: CSE, ECE, ME, CE, IT, EE, Others
  - Degrees: B.Tech, M.Tech, MCA, MBA, Diploma
  - Academic years: 2023-24, 2024-25, etc.
  - Company categories: IT, Core, Consulting, etc.
- **Eligibility Policies:**
  - CGPA cutoff range: Min 6.0, Max 9.5
  - Max active backlogs: 0-3
  - Allowed branches per JD
  - Graduation year matching
- **Placement Constraints:**
  - Max applications per student per semester: 10
  - Bond terms max duration: 2 years
  - No-show policy: 3 warnings → 5 suspension
- **System Settings:**
  - Notification rate limits
  - Calendar sync settings
  - Report access expiry: 30 days
  - Audit log retention: 10 years

**Business Rules:**
- All policy changes logged with admin ID and timestamp
- Critical policy changes require 4-eyes approval (K1.2)

**API Endpoints:**
- `GET /api/internal/admin/config/policies` - Get global policies
- `PUT /api/internal/admin/config/policies/update` - Update global policies

**UI Screens:**
- Configuration Page (master data, eligibility policies, placement constraints, system settings)
- Policy Editor (edit fields, preview, save, 4-eyes approval workflow)

---

### C1.10: Send Official Announcements and Emergency Broadcasts

**Description:** Send college-wide announcements, emergency broadcasts, track delivery and engagement.

**Features:**
- **Official Announcements:**
  - Use cases: Placement cycle kickoff, drive schedules, policy updates, training sessions
  - Workflow: Compose announcement → Select audience (all students, specific departments, specific years, TPO_Dept, custom filter) → Preview → Schedule (send immediately or later) → Delivery (email + in-app + SMS optional) → Tracking (delivery status, open rates)
- **Emergency Broadcast:**
  - Use cases: Drive cancellation, system downtime, urgent policy change
  - Workflow: Click "Emergency Broadcast" → Compose urgent message → Select audience → Confirm (override DND and rate limits) → Send immediately via all channels → Real-time delivery tracking

**Business Rules:**
- BR-A21: Emergency broadcasts override DND settings and rate limits (C1.10)
- BR-A22: All communications logged for audit (C1.6)

**API Endpoints:**
- `POST /api/internal/admin/communications/announce` - Send official announcement

**UI Screens:**
- Announcement Composer (subject, body, audience selector, preview, schedule)
- Emergency Broadcast Modal (urgent message, audience, confirm)
- Communication Tracking (delivery status, open rates, engagement metrics)

---

### C1.11: Bulk Reminder Scheduling and Automated Reminder Templates

**Description:** Send bulk reminders, create custom reminders, configure automated reminder templates, track effectiveness.

**Features:**
- **Bulk Reminder Scheduling:**
  - Use cases: Profile completion reminders, document upload reminders, application deadline reminders, verification pending reminders
  - Workflow: Select reminder type → Configure (audience filter, message template or custom, schedule, channels) → Preview (recipient count, message) → Confirm and send → Tracking (delivery status, open rates, action taken)
- **Custom Reminder Messages:**
  - Use cases: Targeted reminders for specific tasks, personalized reminders
  - Workflow: Compose custom message → Select recipients (individual students or custom filter) → Variables ({{student_name}}, {{enrollment}}, {{cgpa}}, {{pending_tasks}}) → Preview → Schedule → Delivery
- **Automated Reminder Templates:**
  - Template types: Profile completion, document upload, application deadline, interview preparation
  - Configuration: Enable/disable per template, customize message/frequency/channels, set trigger conditions
  - Execution: Cron job runs hourly → Identifies users matching triggers → Generates reminders → Adds to notifications.outbox → Delivery → Tracks delivery status and user actions
- **Reminder History & Analytics:**
  - Track: Reminders sent per user, delivery status, user actions post-reminder
  - Analytics: Reminder effectiveness (% who took action), optimal timing (T-72h vs T-24h), channel effectiveness (email vs SMS vs push)
  - Optimization: Adjust frequency based on effectiveness, personalize timing per user, A/B testing

**Business Rules:**
- BR-A31: Automated reminders respect user opt-out preferences (except critical)
- BR-A32: Reminder rate limits (max 5 reminders per day per user across all types)
- BR-A33: All calendar events and reminders logged for audit

**API Endpoints:**
- `POST /api/internal/admin/reminders/bulk-send` - Send bulk reminders
- `GET /api/internal/admin/reminders/history` - Get reminder history and analytics

**UI Screens:**
- Bulk Reminder Scheduler (type, audience, message, schedule, channels)
- Custom Reminder Composer (message, recipients, variables, preview, schedule)
- Automated Reminder Templates (template list, enable/disable, configure)
- Reminder Analytics (effectiveness metrics, channel comparison, optimization insights)

---

### C1.12: TPO Staff Coordination (Task Assignment, Workload Monitoring, Meeting Scheduling)

**Description:** Assign tasks to TPO_Dept, monitor workload, schedule meetings, track task completion.

**Features:**
- **Task Assignment:**
  - Task types: Verification, application review, report generation, data cleanup, other
  - Workflow: Admin creates task → Assigns to TPO_Dept coordinator → Sets deadline and priority → Notifications (task assigned, deadline approaching, task overdue) → TPO_Dept updates status (pending, in progress, completed) → Admin reviews completion
- **Department Workload Monitoring:**
  - Dashboard widget: Workload per department (students count, pending verifications, pending applications, workload level)
  - Alerts: Department with high workload (> 50 pending tasks)
  - Actions: Reassign tasks, extend deadlines, add additional coordinators
- **Meeting Scheduling:**
  - Meeting types: Weekly sync, drive planning, issue resolution
  - Workflow: Admin schedules meeting → Selects attendees (all TPO_Dept or specific departments) → Adds agenda (PDF or text) → RSVP tracking → Attendance marking

**Business Rules:**
- BR-A34: Task assignments tracked with deadlines and status updates
- All task assignments and completions logged for audit

**API Endpoints:**
- `POST /api/internal/admin/tasks/assign` - Assign task to TPO_Dept
- `GET /api/internal/admin/tasks/list` - Get all tasks

**UI Screens:**
- Task Assignment Page (create task, assign, set deadline, priority)
- Department Workload Dashboard (workload per department, alerts, actions)
- Meeting Scheduler (meeting type, attendees, agenda, RSVP tracking)

---

## 🚫 Constraints

### K1.1: Cannot Directly Edit Student Academic Marks
- **What:** Admin cannot edit semester marks or CGPI directly
- **Why:** Academic data integrity, Exam Cell authority
- **Enforcement:** Read-only access to students.semester_marks
- **Exception:** Can create Exam Cell correction requests (via TPO_Dept)

### K1.2: Sensitive Actions Require 4-Eyes Approval
- **What:** Blacklisting, overrides, bulk delete, policy changes require two admins
- **Why:** Prevent abuse, ensure accountability
- **Enforcement:** Application-level workflow (Admin1 initiates → Admin2 approves)
- **Audit:** Both admins logged in audit trail

---

## 📊 TPO_Admin Workflow (Complete Journey)

### Phase 1: Recruiter Management
1. Recruiter submits organization registration via Public system
2. Admin receives notification: Pending recruiter verification
3. Admin reviews company details, legal verification, POC details, supporting documents
4. Admin verifies (approve/reject/request more info)
5. On approval: POC account activated, recruiter can login and post jobs
6. Audit log: RECRUITER_VERIFIED

### Phase 2: Job Drive Approval
1. Recruiter submits JD via Public system
2. Admin receives notification: Pending JD approval
3. Admin reviews JD (job details, eligibility criteria, compensation, selection process, bond terms, policy compliance)
4. Admin clicks "Preview Eligibility" → System runs eligibility engine → Shows eligible students count and breakdown
5. Admin approves/rejects/requests modifications
6. On approval: JD published to students, eligibility engine runs, eligible students notified
7. Audit log: JD_APPROVED

### Phase 3: Student Application Final Approval (Second Gate)
1. Student submits application → TPO_Dept approves → Application forwarded to TPO_Admin
2. Admin receives notification: Pending application approval
3. Admin reviews application (profile verified, eligibility, dept review, policy compliance, anomaly detection)
4. Admin approves/rejects/flags
5. On approval: Application forwarded to recruiter, student notified
6. Audit log: APPLICATION_APPROVED_BY_ADMIN

### Phase 4: Student Profile Oversight
1. Admin views all student profiles (cross-department)
2. Admin monitors department verification status (dashboard widget)
3. Admin identifies low verification rates, SLA breaches
4. Admin contacts TPO_Dept to expedite verifications
5. Admin overrides dept rejection (rare, requires justification and 4-eyes approval)
6. Audit log: PROFILE_VERIFICATION_OVERRIDE

### Phase 5: Communication & Notifications
1. Admin composes official announcement (placement cycle kickoff, drive schedules, policy updates)
2. Admin selects audience (all students, specific departments, TPO_Dept, custom filter)
3. Admin previews and schedules (send immediately or later)
4. Admin sends announcement (email + in-app + SMS optional)
5. Admin tracks delivery status and open rates
6. Audit log: ANNOUNCEMENT_SENT

### Phase 6: Reporting & Analytics
1. Admin views real-time dashboard (placement overview, recruiter metrics, application metrics, trend analysis)
2. Admin generates custom report (placement summary, department-wise, company-wise, etc.)
3. Admin applies filters (academic year, department, CGPA range, etc.)
4. Admin selects export format (PDF, Excel, CSV)
5. Admin downloads report or schedules recurring report
6. Audit log: REPORT_GENERATED

### Phase 7: Calendar & Reminder Management (System-wide)
1. Admin creates college-wide event (placement drive, PPT, test, interview, deadline)
2. Admin selects attendees (all students, specific departments, TPO_Dept, recruiters)
3. Admin sets RSVP and reminders (T-72h, T-24h, T-2h)
4. Admin saves event → Attendees notified → Event appears on calendars
5. Admin sends bulk reminders (profile completion, document upload, application deadline)
6. Admin tracks reminder effectiveness (delivery status, open rates, action taken)
7. Admin assigns tasks to TPO_Dept (verification, application review, report generation)
8. Admin monitors department workload (dashboard widget)
9. Audit log: EVENT_CREATED, BULK_REMINDER_SENT, TASK_ASSIGNED

---

## 🗄️ TPO_Admin Data Model (Key Tables)

### core.tpo_admins
- **Purpose:** Admin profiles with permissions and settings
- **Key Fields:** admin_name, employee_id, role (SUPER_ADMIN/ADMIN/CO_ADMIN), can_verify_recruiters, can_approve_jds, can_approve_applications, can_override_dept_decisions, calendar_preferences, reminder_templates

### core.tasks
- **Purpose:** Task assignments to TPO_Dept
- **Key Fields:** task_id, task_type, title, description, assigned_to, assigned_by, department, deadline, priority, status, completion_notes

### core.jd_reviews
- **Purpose:** JD review history with eligibility preview
- **Key Fields:** job_posting_id, reviewer_id, review_action, admin_review_notes, eligibility_preview (JSONB)

---

## 🔐 Security & Privacy

### Access Control
- **System-wide access:** Can view all data across departments (no K2.1 restriction)
- **RLS policies:** Allow admin to view all student profiles, applications, offers
- **Sensitive actions:** Blacklisting, overrides, bulk delete require 4-eyes approval (K1.2)

### Audit Logging
- **All admin actions logged:** Actor, action, target, timestamp, IP, changes
- **Immutable audit logs:** Append-only, cannot be edited or deleted
- **Offloaded to WORM storage:** Periodically (DB5)
- **Compliance reports:** Generated monthly, archived for 10 years

### Data Protection
- **Exported data anonymized:** For external sharing (remove PII, aggregate, suppress small cells)
- **Reports watermarked:** Admin name and timestamp
- **Report files auto-deleted:** After access expiry (default: 30 days)
- **Sensitive data encrypted:** Recruiter credentials, student PII (AES-256-GCM)

### 4-Eyes Approval (K1.2)
- **Required for:** Blacklisting organizations, overriding dept verification, overriding dept application decisions, bulk delete operations, policy changes
- **Workflow:** Admin1 initiates → Admin2 reviews → Approve/Reject
- **Audit:** Both admins logged in audit trail

---

## 📱 UI/UX Specifications

### Dashboard Layout
1. **Header:** Admin name, role badge, last login, system health indicator
2. **Quick Stats Cards:** Total Students, Pending Verifications, Active Drives, System Alerts
3. **Action Widgets:** Recruiter Verification Queue, JD Approval Queue, Application Approval Queue, Upcoming Events
4. **Charts:** Placement Rate Trend, Application Funnel, Department-wise Placement Comparison, Top Companies
5. **Notifications Panel:** Unread notifications with filters

### Recruiter Management Page
- **Tabs:** Pending Verifications / Verified / Rejected / Blacklisted
- **Filters:** Company name, industry, submission date
- **Columns:** Company Name, POC Name, Email, Submission Date, Status, Actions
- **Actions per row:** View Details, Verify, Reject, Request More Info, Blacklist

### JD Approval Page
- **Tabs:** Pending Approval / Approved / Rejected / Active / Closed
- **Filters:** Company, role, deadline, submission date
- **Columns:** Company, Role, CTC, Eligibility Criteria, Deadline, Status, Actions
- **Actions per row:** View JD, Preview Eligibility, Approve, Reject, Request Modifications
- **Bulk Actions:** Select multiple → Batch Approve

### Application Approval Page
- **Tabs:** Pending Admin Review / Approved / Rejected / Flagged
- **Filters:** Department, company, CGPA range, date range
- **Columns:** Student Name, Enrollment, Department, CGPA, Company, Role, Dept Status, Actions
- **Actions per row:** View Application, Approve, Reject, Flag
- **Bulk Actions:** Select multiple → Batch Approve

### Student Oversight Page
- **Filters:** Department, verification status, profile completion %, CGPA range, placement status
- **Columns:** Enrollment, Name, Department, Year, CGPA, Profile %, Verification Status, Placement Status, Actions
- **Actions per row:** View Profile, Override Verification, Send Reminder

### Calendar Page
- **Left Sidebar:** Mini calendar, event filters (type, department), upcoming events list
- **Main Area:** Calendar grid (month/week/day/Gantt views)
- **Right Panel:** Event details, RSVP list, attendance tracking
- **Features:** Create Event button, view all department calendars, export to ICS

### Reports Page
- **Report Templates:** Pre-defined report types with filters
- **Custom Report Builder:** Select fields, filters, format
- **Generated Reports List:** Download, view, delete, schedule
- **Scheduled Reports:** Set up recurring reports with email delivery

### Audit Logs Page
- **Filters:** Date range, actor, action type, resource type, success/failure
- **Columns:** Timestamp, Actor, Role, Action, Resource, Changes, IP, Status
- **Search:** Full-text search on action, resource, changes
- **Export:** CSV, JSON for external analysis

---

## 🔗 Integration Points

1. **With Recruiters:** Verification, JD approval, communication
2. **With TPO_Dept:** Application forwarding, task assignment, shared calendar, reporting
3. **With Students:** Indirect (via TPO_Dept), profile oversight, bulk communications
4. **With Exam Cell:** Indirect (via TPO_Dept correction requests)
5. **With Notification Services:** Email, SMS, Push for announcements and reminders
6. **With External Systems:** GST portal (recruiter verification), MCA database (CIN verification), Academic calendar sync

---

## 📈 Success Metrics

### Recruiter Verification Efficiency
- **Target:** 95%+ recruiters verified within 48 hours
- **Metric:** (Recruiters verified within 48h / Total pending verifications) × 100%

### JD Approval Speed
- **Target:** 90%+ JDs approved within 24 hours
- **Metric:** (JDs approved within 24h / Total pending JD approvals) × 100%

### Application Processing Speed
- **Target:** 95%+ applications reviewed within 48 hours
- **Metric:** (Applications reviewed within 48h / Total pending applications) × 100%

### Placement Rate
- **Target:** 70%+ placement rate for eligible students
- **Metric:** (Placed students / Eligible students) × 100%

### Data Quality
- **Target:** < 2% application rejections due to data quality issues
- **Metric:** (Rejected applications / Total applications) × 100%

---

## 🆘 Support & Help

### In-App Help
- **Tooltips:** Contextual help on verification checklist, review actions, policy configuration
- **FAQs:** Common questions about recruiter verification, JD approval, application review, reporting
- **Video Tutorials:** Recruiter verification, JD approval, application review, calendar management, reporting

### Contact Support
- **IT Help Desk:** Technical issues, login problems, access requests
- **System Administrator:** System configuration, policy changes, compliance issues
- **Email:** tpo-admin-support@college.edu

---

## 📚 Additional Resources

- **Recruiter Verification Guidelines:** Detailed checklist for recruiter verification
- **JD Approval Policy:** Criteria for approving/rejecting job postings
- **Application Review Policy:** Criteria for approving/rejecting applications
- **Reporting Guide:** How to generate and interpret system-wide reports
- **Compliance Manual:** GDPR/FERPA compliance guidelines, audit log retention policy

---

**Document Version:** 1.0  
**Last Updated:** 2024-01-15  
**Maintained By:** TPO Development Team  
**For:** TPO Administrators of [College Name]
