# TPO Admin Dashboard - Design Specification

## 🎯 Dashboard Philosophy

**Clean | Informative | Cool Theme | Real Data**

Based on the TPO Admin role documentation, the dashboard should be:
- **Action-Oriented**: Quick access to pending tasks
- **Data-Driven**: Real-time metrics and analytics
- **Visually Appealing**: Purple theme with Silk background
- **Efficient**: Minimal clicks to complete tasks

---

## 📊 Dashboard Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│  HEADER (Purple gradient bar)                               │
│  Logo | TPO Admin Dashboard | Notifications | Profile      │
└─────────────────────────────────────────────────────────────┘
┌──────────┬──────────────────────────────────────────────────┐
│          │                                                  │
│ SIDEBAR  │           MAIN CONTENT AREA                      │
│          │                                                  │
│ - Home   │  ┌────────────────────────────────────────┐     │
│ - Pending│  │  QUICK STATS CARDS (4 cards)           │     │
│ - Students│  └────────────────────────────────────────┘     │
│ - Recruiters│                                              │
│ - Jobs   │  ┌────────────────────────────────────────┐     │
│ - Reports│  │  PENDING ACTIONS (Priority Queue)      │     │
│ - Calendar│  └────────────────────────────────────────┘     │
│ - Settings│                                              │
│          │  ┌────────────────────────────────────────┐     │
│          │  │  ANALYTICS CHARTS (2-3 charts)         │     │
│          │  └────────────────────────────────────────┘     │
│          │                                                  │
└──────────┴──────────────────────────────────────────────────┘
```

---

## 🎨 Visual Design Elements

### Color Scheme (Purple Theme)
- **Primary**: #7B3FF2 (Purple)
- **Secondary**: #9333ea (Deep Purple)
- **Accent**: #c084fc (Light Purple)
- **Background**: Silk shader animation
- **Cards**: Glassmorphism (rgba(30, 20, 50, 0.7))
- **Text**: White (#ffffff), Light Purple (#e9d5ff)
- **Success**: #4ade80 (Green)
- **Warning**: #fb923c (Orange)
- **Error**: #f87171 (Red)

### Typography
- **Headings**: Bold, 1.5-2rem
- **Body**: Regular, 0.9375rem
- **Stats**: Bold, 2-3rem

### Components Style
- **Cards**: Glassmorphism with purple borders
- **Buttons**: Purple gradient with glow on hover
- **Tables**: Transparent with purple accents
- **Charts**: Purple/Blue gradient fills

---

## 📋 Phase 1: Essential Dashboard Components

### 1. HEADER BAR
```
┌─────────────────────────────────────────────────────────────┐
│ 🎓 TPO Admin | Dashboard    🔔(3) 👤 Admin | Logout        │
└─────────────────────────────────────────────────────────────┘
```

**Components:**
- Logo + Title
- Notification bell with count
- Admin profile dropdown
- Logout button

---

### 2. QUICK STATS CARDS (Top Priority)

**Card 1: Total Students**
```
┌──────────────────────┐
│ 👥 Total Students    │
│                      │
│      1,234          │
│                      │
│ ↑ 45 this month     │
└──────────────────────┘
```
- **Data**: Count from `students.profiles`
- **Metric**: Total active students
- **Trend**: New registrations this month

**Card 2: Pending Verifications**
```
┌──────────────────────┐
│ ⏳ Pending Reviews   │
│                      │
│       23            │
│                      │
│ 🔴 5 urgent         │
└──────────────────────┘
```
- **Data**: Count from `students.profiles` WHERE `tpo_admin_verified = false`
- **Metric**: Students awaiting admin verification
- **Alert**: Urgent (> 7 days pending)

**Card 3: Active Recruiters**
```
┌──────────────────────┐
│ 💼 Active Recruiters │
│                      │
│       45            │
│                      │
│ ✅ 12 verified      │
└──────────────────────┘
```
- **Data**: Count from `recruiters.organizations` WHERE `is_active = true`
- **Metric**: Total active recruiters
- **Sub-metric**: Recently verified

**Card 4: Active Job Postings**
```
┌──────────────────────┐
│ 📢 Active Jobs       │
│                      │
│       18            │
│                      │
│ 🆕 3 pending        │
└──────────────────────┘
```
- **Data**: Count from `core.job_postings` WHERE `status = 'ACTIVE'`
- **Metric**: Live job postings
- **Alert**: Pending approval

---

### 3. PENDING ACTIONS QUEUE (Critical)

```
┌─────────────────────────────────────────────────────────┐
│ 🚨 PENDING ACTIONS                                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ ⚠️  5 Recruiters awaiting verification    [Review →]  │
│ ⚠️  23 Students pending admin approval     [Review →]  │
│ ⚠️  3 Job postings need approval           [Review →]  │
│ ⚠️  12 Applications awaiting final review  [Review →]  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Priority Order:**
1. Recruiter verifications (fraud prevention)
2. Job posting approvals (time-sensitive)
3. Student profile verifications
4. Application final approvals

---

### 4. ANALYTICS CHARTS (Visual Insights)

**Chart 1: Placement Overview (Donut Chart)**
```
┌──────────────────────────────┐
│ Placement Status             │
│                              │
│      ╱───╲                   │
│     │ 68% │  Placed: 850     │
│      ╲───╱   Pending: 400    │
│                              │
└──────────────────────────────┘
```
- **Data**: Placement statistics
- **Visual**: Donut chart with percentages

**Chart 2: Department-wise Breakdown (Bar Chart)**
```
┌──────────────────────────────┐
│ Students by Department       │
│                              │
│ CSE  ████████████ 450        │
│ ECE  ████████ 320            │
│ ME   ██████ 250              │
│ CE   █████ 214               │
│                              │
└──────────────────────────────┘
```
- **Data**: Student count per department
- **Visual**: Horizontal bar chart

**Chart 3: Recent Activity Timeline**
```
┌──────────────────────────────┐
│ Recent Activity              │
│                              │
│ 2h ago  ✅ Approved JD #123  │
│ 5h ago  👤 Verified Student  │
│ 1d ago  💼 Verified Recruiter│
│ 2d ago  📊 Generated Report  │
│                              │
└──────────────────────────────┘
```
- **Data**: Recent admin actions from audit logs
- **Visual**: Timeline list

---

## 🎯 Phase 2: Detailed Pages (Future)

### Student Management
- List all students with filters
- Verification queue
- Profile override capability
- Bulk actions

### Recruiter Management
- Pending verifications
- Verified recruiters list
- Blacklist management
- POC account management

### Job Posting Management
- Pending approvals
- Active jobs
- Eligibility preview
- Batch approval

### Application Management
- Final approval queue
- Application review
- Batch operations
- Override dept decisions

### Reports & Analytics
- Custom report builder
- Pre-defined templates
- Export functionality
- Scheduled reports

### Calendar & Events
- College-wide calendar
- Event creation
- Reminder management
- Task assignment

---

## 📊 Database Queries Needed

### Quick Stats
```sql
-- Total Students
SELECT COUNT(*) FROM students.profiles WHERE deleted_at IS NULL;

-- Pending Admin Verifications
SELECT COUNT(*) FROM students.profiles 
WHERE tpo_admin_verified = false AND deleted_at IS NULL;

-- Active Recruiters
SELECT COUNT(*) FROM recruiters.organizations 
WHERE is_active = true AND deleted_at IS NULL;

-- Active Job Postings
SELECT COUNT(*) FROM core.job_postings 
WHERE status = 'ACTIVE' AND deleted_at IS NULL;
```

### Department Breakdown
```sql
SELECT department, COUNT(*) as count 
FROM students.profiles 
WHERE deleted_at IS NULL 
GROUP BY department 
ORDER BY count DESC;
```

### Recent Activity
```sql
SELECT * FROM audit.logs 
WHERE actor_role = 'ROLE_TPO_ADMIN' 
ORDER BY timestamp DESC 
LIMIT 10;
```

---

## 🎨 Component Recommendations

### For Charts
- **Library**: Recharts or Chart.js
- **Style**: Purple gradient fills
- **Animation**: Smooth transitions
- **Responsive**: Mobile-friendly

### For Tables
- **Library**: TanStack Table (React Table)
- **Features**: Sorting, filtering, pagination
- **Style**: Glassmorphism with purple accents

### For Notifications
- **Use**: Toast component (already built)
- **Position**: Top-right
- **Types**: Success, Error, Info, Warning

---

## 🚀 Implementation Priority

### MVP (Minimum Viable Product)
1. ✅ Header with profile
2. ✅ Quick Stats Cards (4 cards)
3. ✅ Pending Actions Queue
4. ✅ Sidebar Navigation
5. ✅ Logout functionality

### Phase 2
6. Analytics Charts (2-3 charts)
7. Recent Activity Timeline
8. Student List Page
9. Recruiter List Page

### Phase 3
10. Job Posting Management
11. Application Review
12. Reports & Analytics
13. Calendar & Events

---

## 💡 Key Features to Highlight

### Real-Time Data
- Auto-refresh every 30 seconds
- Live notification updates
- Real-time charts

### Quick Actions
- One-click access to pending tasks
- Batch operations
- Keyboard shortcuts

### Visual Feedback
- Loading states
- Success/Error animations
- Progress indicators

### Responsive Design
- Desktop-first (admin tool)
- Tablet support
- Mobile-friendly sidebar

---

## 🎯 Success Metrics

### Dashboard Performance
- Load time < 2 seconds
- Real-time updates < 1 second
- Smooth animations (60fps)

### User Experience
- < 3 clicks to complete common tasks
- Clear visual hierarchy
- Intuitive navigation

### Data Accuracy
- 100% real-time data
- No stale metrics
- Accurate counts

---

## 📝 Next Steps

1. **Approve this design** ✅
2. **Build MVP components**:
   - Header
   - Quick Stats Cards
   - Pending Actions Queue
   - Sidebar
3. **Connect to real database**
4. **Add charts and analytics**
5. **Build detailed pages**

---

**What do you think? Should we proceed with this design?** 🚀
