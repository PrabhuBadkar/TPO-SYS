# 📑 TPO Admin Dashboard - Tabbed Interface Plan

## 🎯 Overview

Transform the TPO Admin Dashboard into a **tabbed interface** with 3 main sections:
1. **👥 Students Tab**
2. **💼 Recruiters Tab**
3. **📢 Job Postings Tab**

Each tab will show relevant information, statistics, and actions for that category.

---

## 🎨 UI/UX Design

### Tab Navigation Bar

```
┌─────────────────────────────────────────────────────────────┐
│  👥 Students (12)  │  💼 Recruiters (5)  │  📢 Jobs (8)     │
│  ═══════════════                                             │
└─────────────────────────────────────────────────────────────┘
```

**Features:**
- Icon + Label for each tab
- Badge showing pending count
- Active tab highlighted with underline
- Smooth transition animations
- Responsive design (stacks on mobile)

---

## 📊 Tab 1: Students

### **Top Section - Statistics Cards**

```
┌──────────────┬──────────────┬──────────────┬──────────────┐
│ Total        │ Verified     │ Pending      │ By Dept      │
│ Students     │ Students     │ Verification │ Breakdown    │
│              │              │              │              │
│    150       │    120       │     30       │  CSE: 50     │
│              │              │              │  ECE: 40     │
│ +12 this mo  │  80% rate    │  5 urgent    │  ME: 30      │
└──────────────┴──────────────┴──────────────┴──────────────┘
```

### **Middle Section - Data Table**

**Pending Verifications Table:**
| Name | URN | Department | Registered | Status | Actions |
|------|-----|------------|------------|--------|---------|
| John Doe | 2021001 | CSE | 2 days ago | Pending | ✅ Verify / ❌ Reject |
| Jane Smith | 2021002 | ECE | 5 days ago | Urgent | ✅ Verify / ❌ Reject |

**Features:**
- Sortable columns
- Search/filter by department, status
- Pagination
- Bulk actions (verify multiple)
- Quick view student profile

### **Bottom Section - Quick Actions**

```
┌─────────────────────────────────────────────────────────────┐
│  [📥 Export Student List]  [✅ Verify All Pending]          │
│  [📊 Generate Report]      [🔍 Advanced Search]             │
└─────────────────────────────────────────────────────────────┘
```

### **Additional Features:**
- Recent registrations feed
- Department-wise pie chart
- CGPA distribution graph
- Placement readiness indicator

---

## 💼 Tab 2: Recruiters

### **Top Section - Statistics Cards**

```
┌──────────────┬──────────────┬──────────────┬──────────────┐
│ Total        │ Verified     │ Pending      │ Blacklisted  │
│ Recruiters   │ Recruiters   │ Verification │ Companies    │
│              │              │              │              │
│     45       │     35       │     8        │      2       │
│              │              │              │              │
│ +5 this mo   │  78% rate    │  2 urgent    │  View List   │
└──────────────┴──────────────┴──────────────┴──────────────┘
```

### **Middle Section - Data Table**

**Pending Verifications Table:**
| Company | Industry | Contact | Registered | Documents | Actions |
|---------|----------|---------|------------|-----------|---------|
| TechCorp | IT | John | 3 days ago | ✅ Complete | ✅ Verify / ❌ Reject |
| InfoSys | IT | Jane | 7 days ago | ⚠️ Missing GST | 📄 Request Docs |

**Features:**
- View company details
- Check uploaded documents
- Verify GST, PAN, CIN
- Request additional documents
- Blacklist option with reason

### **Bottom Section - Quick Actions**

```
┌─────────────────────────────────────────────────────────────┐
│  [📥 Export Recruiter List]  [✅ Verify All Pending]        │
│  [🚫 Manage Blacklist]       [📧 Send Bulk Email]           │
└─────────────────────────────────────────────────────────────┘
```

### **Additional Features:**
- Recently verified recruiters
- Industry-wise distribution chart
- Company size breakdown
- Verification timeline

---

## 📢 Tab 3: Job Postings

### **Top Section - Statistics Cards**

```
┌──────────────┬──────────────┬──────────────┬──────────────┐
│ Total        │ Active       │ Pending      │ Applications │
│ Jobs         │ Jobs         │ Approval     │ Received     │
│              │              │              │              │
│     80       │     60       │     15       │     450      │
│              │              │              │              │
│ +10 this mo  │  75% rate    │  3 urgent    │  Avg: 5.6    │
└──────────────┴──────────────┴──────────────┴──────────────┘
```

### **Middle Section - Data Table**

**Pending Approvals Table:**
| Job Title | Company | CTC | Type | Deadline | Eligible | Actions |
|-----------|---------|-----|------|----------|----------|---------|
| SDE | TechCorp | 12 LPA | Full-time | 15 Dec | 45 students | ✅ Approve / ❌ Reject |
| Intern | InfoSys | 25k/mo | Internship | 20 Dec | 30 students | ✅ Approve / 📝 Request Changes |

**Features:**
- View full job description
- Check eligibility criteria
- See eligible student count
- Request modifications
- Approve/reject with reason

### **Bottom Section - Quick Actions**

```
┌─────────────────────────────────────────────────────────────┐
│  [📥 Export Job List]        [✅ Approve All Pending]        │
│  [📊 Application Analytics]  [📧 Notify Students]            │
└─────────────────────────────────────────────────────────────┘
```

### **Additional Features:**
- Active jobs list
- Recent applications feed
- Job type distribution (Full-time, Internship, etc.)
- CTC range distribution
- Application success rate

---

## 🏗️ Component Structure

```
TPOAdminDashboard/
├── TPOAdminDashboard.jsx (Main container)
├── components/
│   ├── TabNavigation.jsx (Tab bar)
│   ├── tabs/
│   │   ├── StudentsTab.jsx
│   │   ├── RecruitersTab.jsx
│   │   └── JobPostingsTab.jsx
│   ├── students/
│   │   ├── StudentStatsCards.jsx
│   │   ├── PendingVerificationsTable.jsx
│   │   ├── RecentStudentsList.jsx
│   │   └── DepartmentChart.jsx
│   ├── recruiters/
│   │   ├── RecruiterStatsCards.jsx
│   │   ├── PendingRecruitersTable.jsx
│   │   ├── BlacklistManager.jsx
│   │   └── IndustryChart.jsx
│   └── jobs/
│       ├── JobStatsCards.jsx
│       ├── PendingJobsTable.jsx
│       ├── ActiveJobsList.jsx
│       └── ApplicationsChart.jsx
└── styles/
    ├── TabNavigation.css
    ├── StudentsTab.css
    ├── RecruitersTab.css
    └── JobPostingsTab.css
```

---

## 🔌 Backend API Endpoints

### **Students Endpoints**

```typescript
// Statistics
GET /api/internal/admin/stats/students
Response: { total, verified, pending, byDepartment, newThisMonth }

// Lists
GET /api/internal/admin/students/pending-verification
Response: [{ id, name, urn, department, registeredAt, status }]

GET /api/internal/admin/students/recent
Response: [{ id, name, urn, department, registeredAt }]

// Actions
POST /api/internal/admin/students/:id/verify
Body: { notes }

POST /api/internal/admin/students/:id/reject
Body: { reason }
```

### **Recruiters Endpoints**

```typescript
// Statistics
GET /api/internal/admin/stats/recruiters
Response: { total, verified, pending, blacklisted, byIndustry }

// Lists
GET /api/internal/admin/recruiters/pending-verification
Response: [{ id, companyName, industry, contact, registeredAt, documents }]

GET /api/internal/admin/recruiters/blacklisted
Response: [{ id, companyName, reason, blacklistedAt }]

// Actions
POST /api/internal/admin/recruiters/:id/verify
Body: { notes }

POST /api/internal/admin/recruiters/:id/reject
Body: { reason }

POST /api/internal/admin/recruiters/:id/blacklist
Body: { reason }
```

### **Jobs Endpoints**

```typescript
// Statistics
GET /api/internal/admin/stats/jobs
Response: { total, active, pending, applications, byType }

// Lists
GET /api/internal/admin/jobs/pending-approval
Response: [{ id, title, company, ctc, type, deadline, eligibleCount }]

GET /api/internal/admin/jobs/active
Response: [{ id, title, company, ctc, applicationsCount }]

// Actions
POST /api/internal/admin/jobs/:id/approve
Body: { notes }

POST /api/internal/admin/jobs/:id/reject
Body: { reason }

POST /api/internal/admin/jobs/:id/request-changes
Body: { changes }
```

---

## 🎨 Styling Guidelines

### **Color Scheme**

```css
/* Tab Colors */
--students-color: #7B3FF2;      /* Purple */
--recruiters-color: #3B82F6;    /* Blue */
--jobs-color: #10B981;          /* Green */

/* Status Colors */
--pending-color: #F59E0B;       /* Orange */
--verified-color: #10B981;      /* Green */
--rejected-color: #EF4444;      /* Red */
--urgent-color: #DC2626;        /* Dark Red */
```

### **Tab Navigation**

```css
.tab-navigation {
  display: flex;
  border-bottom: 2px solid #E5E7EB;
  background: white;
  padding: 0 2rem;
}

.tab-button {
  padding: 1rem 2rem;
  border: none;
  background: transparent;
  cursor: pointer;
  position: relative;
  transition: all 0.3s ease;
}

.tab-button.active {
  color: var(--tab-color);
  font-weight: 600;
}

.tab-button.active::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--tab-color);
}

.tab-badge {
  background: #EF4444;
  color: white;
  border-radius: 12px;
  padding: 2px 8px;
  font-size: 0.75rem;
  margin-left: 0.5rem;
}
```

---

## 🚀 Implementation Steps

### **Phase 1: Setup (Day 1)**
1. ✅ Create tab navigation component
2. ✅ Create basic tab structure
3. ✅ Implement tab switching logic
4. ✅ Add URL routing for tabs

### **Phase 2: Students Tab (Day 2-3)**
1. ✅ Create student stats cards
2. ✅ Build pending verifications table
3. ✅ Add verify/reject actions
4. ✅ Implement department chart
5. ✅ Add export functionality

### **Phase 3: Recruiters Tab (Day 4-5)**
1. ✅ Create recruiter stats cards
2. ✅ Build pending recruiters table
3. ✅ Add document verification
4. ✅ Implement blacklist manager
5. ✅ Add industry chart

### **Phase 4: Jobs Tab (Day 6-7)**
1. ✅ Create job stats cards
2. ✅ Build pending jobs table
3. ✅ Add approve/reject actions
4. ✅ Implement applications chart
5. ✅ Add notification system

### **Phase 5: Polish & Testing (Day 8)**
1. ✅ Add loading states
2. ✅ Add error handling
3. ✅ Implement responsive design
4. ✅ Test all features
5. ✅ Optimize performance

---

## 📱 Responsive Design

### **Desktop (>1024px)**
- 3 tabs side by side
- Full data tables
- Charts visible

### **Tablet (768px - 1024px)**
- 3 tabs side by side (smaller)
- Scrollable tables
- Charts below stats

### **Mobile (<768px)**
- Tabs stack vertically or scroll horizontally
- Cards stack vertically
- Tables become cards
- Charts simplified

---

## ✅ Benefits

1. **Better Organization** - Each category has its own space
2. **Focused Actions** - Relevant actions for each category
3. **Improved Performance** - Lazy load tab content
4. **Better UX** - Clear navigation and context
5. **Scalability** - Easy to add more tabs/features
6. **Real-time Updates** - Each tab auto-refreshes independently

---

## 🎯 Success Metrics

- ✅ All tabs load within 2 seconds
- ✅ Auto-refresh every 30 seconds
- ✅ 100% real-time data (no dummy data)
- ✅ Responsive on all devices
- ✅ Accessible (keyboard navigation, screen readers)
- ✅ Error handling for all API calls

---

**This tabbed interface will make the TPO Admin Dashboard much more powerful and user-friendly!** 🚀
