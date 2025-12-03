# TPO Admin Dashboard - Real-Time Data Strategy

> **CRITICAL RULE:** NO DUMMY DATA. EVER. All data must come from real database queries.

---

## 🎯 Core Principle

**Backend-First, Data-Driven Development**

Every piece of information displayed on the dashboard MUST be fetched from the PostgreSQL database through Prisma queries. No hardcoded values, no mock data, no placeholder arrays.

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    TPO Admin Dashboard                       │
│                      (React Frontend)                        │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP Requests (JWT Auth)
                     ↓
┌─────────────────────────────────────────────────────────────┐
│                   Express.js Backend                         │
│              (TypeScript + Middleware)                       │
└────────────────────┬────────────────────────────────────────┘
                     │ Prisma Client Queries
                     ↓
┌─────────────────────────────────────────────────────────────┐
│                  PostgreSQL Database                         │
│         (5 Schemas: auth, students, recruiters,             │
│                  core, audit)                                │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚫 What We're Avoiding (Anti-Patterns)

### ❌ WRONG - Dummy Data in Frontend
```javascript
// DON'T DO THIS!
const DashboardStats = () => {
  const [stats] = useState({
    totalStudents: 150,
    pendingVerifications: 25,
    activeJobs: 12
  });
  
  return <StatsCard data={stats} />;
};
```

### ✅ CORRECT - Real API Calls
```javascript
// DO THIS!
const DashboardStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/internal/admin/stats/overview', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        setStats(data.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, []);
  
  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorMessage error={error} />;
  
  return <StatsCard data={stats} />;
};
```

---

## 📊 Dashboard Features (All Real-Time)

### 1. **Overview Statistics Cards**

**Data Source:** `/api/internal/admin/stats/overview`

| Metric | Database Query | Table |
|--------|---------------|-------|
| Total Students | `COUNT(*)` WHERE `deleted_at IS NULL` | `students.profiles` |
| Pending Verifications | `COUNT(*)` WHERE `tpo_admin_verified = false` | `students.profiles` |
| Active Recruiters | `COUNT(*)` WHERE `recruiter_status = 'VERIFIED'` | `recruiters.organizations` |
| Active Jobs | `COUNT(*)` WHERE `status = 'ACTIVE'` | `recruiters.job_postings` |
| New Students (This Month) | `COUNT(*)` WHERE `created_at >= start_of_month` | `students.profiles` |
| Urgent Verifications | `COUNT(*)` WHERE `created_at < 7_days_ago AND tpo_admin_verified = false` | `students.profiles` |

**Backend Implementation:**
```typescript
// backend/src/routes/admin/stats.routes.ts
router.get('/overview', authenticate, async (req, res) => {
  const [totalStudents, pendingVerifications, activeRecruiters, activeJobs] = 
    await Promise.all([
      prisma.studentProfile.count({ where: { deleted_at: null } }),
      prisma.studentProfile.count({ where: { tpo_admin_verified: false, deleted_at: null } }),
      prisma.organization.count({ where: { recruiter_status: 'VERIFIED', deleted_at: null } }),
      prisma.jobPosting.count({ where: { status: 'ACTIVE', deleted_at: null } })
    ]);
  
  res.json({ success: true, data: { totalStudents, pendingVerifications, activeRecruiters, activeJobs } });
});
```

---

### 2. **Real-Time Charts**

#### A. Applications Trend (Last 30 Days)
**Endpoint:** `/api/internal/admin/stats/applications-trend`

**Query:**
```sql
SELECT 
  DATE(created_at) as date,
  COUNT(*) as count
FROM recruiters.job_applications
WHERE created_at >= NOW() - INTERVAL '30 days'
  AND deleted_at IS NULL
GROUP BY DATE(created_at)
ORDER BY date ASC
```

**Prisma Implementation:**
```typescript
const applicationsTrend = await prisma.$queryRaw`
  SELECT 
    DATE(created_at) as date,
    COUNT(*)::int as count
  FROM recruiters.job_applications
  WHERE created_at >= NOW() - INTERVAL '30 days'
  GROUP BY DATE(created_at)
  ORDER BY date ASC
`;
```

#### B. Department-wise Student Distribution
**Endpoint:** `/api/internal/admin/stats/department-distribution`

**Query:**
```typescript
const departmentStats = await prisma.studentProfile.groupBy({
  by: ['department'],
  where: { deleted_at: null },
  _count: { department: true }
});
```

#### C. Placement Rate by Department
**Endpoint:** `/api/internal/admin/stats/placement-rate`

**Complex Query:**
```typescript
const placementRate = await prisma.$queryRaw`
  SELECT 
    sp.department,
    COUNT(DISTINCT sp.id) as total_students,
    COUNT(DISTINCT CASE WHEN o.status = 'ACCEPTED' THEN o.student_id END) as placed_students,
    ROUND(
      (COUNT(DISTINCT CASE WHEN o.status = 'ACCEPTED' THEN o.student_id END)::numeric / 
       COUNT(DISTINCT sp.id)::numeric) * 100, 
      2
    ) as placement_percentage
  FROM students.profiles sp
  LEFT JOIN recruiters.offers o ON sp.id = o.student_id
  WHERE sp.deleted_at IS NULL
  GROUP BY sp.department
  ORDER BY placement_percentage DESC
`;
```

---

### 3. **Activity Feed (Real-Time)**

**Endpoint:** `/api/internal/admin/stats/recent-activity`

**Data Sources:**
- Recent Applications (last 10)
- Recent Verifications (last 10)
- Recent Job Postings (last 10)
- Recent Offers (last 10)

**Implementation:**
```typescript
const recentActivity = await Promise.all([
  // Recent Applications
  prisma.jobApplication.findMany({
    take: 10,
    orderBy: { created_at: 'desc' },
    include: {
      jobPosting: { select: { job_title: true, organization: { select: { org_name: true } } } }
    }
  }),
  
  // Recent Verifications
  prisma.studentProfile.findMany({
    take: 10,
    where: { tpo_admin_verified: true },
    orderBy: { tpo_admin_verified_at: 'desc' },
    select: { first_name: true, last_name: true, department: true, tpo_admin_verified_at: true }
  }),
  
  // Recent Job Postings
  prisma.jobPosting.findMany({
    take: 10,
    orderBy: { created_at: 'desc' },
    include: { organization: { select: { org_name: true } } }
  })
]);
```

---

### 4. **Quick Actions (With Real Counts)**

**Pending Items Dashboard:**

| Action | Count Query | Link |
|--------|-------------|------|
| Verify Students | `COUNT(*)` WHERE `tpo_admin_verified = false` | `/admin/students?filter=pending` |
| Approve Jobs | `COUNT(*)` WHERE `status = 'PENDING_APPROVAL'` | `/admin/jobs?filter=pending` |
| Verify Recruiters | `COUNT(*)` WHERE `recruiter_status = 'PENDING_VERIFICATION'` | `/admin/recruiters?filter=pending` |
| Review Applications | `COUNT(*)` WHERE `status = 'PENDING_ADMIN'` | `/admin/applications?filter=pending` |

---

## 🔧 Implementation Steps

### Step 1: Fix Backend Issues ✅

**Issue:** Prisma query error in `stats.routes.ts`
```
Unknown argument `is_active`. Available options are marked with ?.
```

**Root Cause:** `Organization` model doesn't have `is_active` field. It uses `recruiter_status` instead.

**Fix:**
```typescript
// BEFORE (❌ Wrong)
prisma.organization.count({
  where: { is_active: true, deleted_at: null }
})

// AFTER (✅ Correct)
prisma.organization.count({
  where: { recruiter_status: 'VERIFIED', deleted_at: null }
})
```

**Files to Update:**
- `backend/src/routes/admin/stats.routes.ts` (lines 49, 79, 227, 237)

---

### Step 2: Create Realistic Seed Data

**Purpose:** Populate database with realistic test data (NOT dummy data)

**Seed Script:** `backend/prisma/seed-comprehensive.ts`

```typescript
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database with realistic data...');
  
  // 1. Create TPO Admin
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@acer.edu',
      encrypted_password: await bcrypt.hash('admin123', 10),
      role: 'ROLE_TPO_ADMIN',
      is_active: true,
      email_verified: true
    }
  });
  
  // 2. Create 20 Students across departments
  const departments = ['CSE', 'ECE', 'ME', 'CE', 'IT', 'EE'];
  for (let i = 1; i <= 20; i++) {
    const dept = departments[i % departments.length];
    const user = await prisma.user.create({
      data: {
        email: `student${i}@acer.edu`,
        encrypted_password: await bcrypt.hash('student123', 10),
        role: 'ROLE_STUDENT',
        is_active: true,
        email_verified: true
      }
    });
    
    await prisma.studentProfile.create({
      data: {
        user_id: user.id,
        first_name: `Student${i}`,
        last_name: `Test`,
        enrollment_number: `2021${dept}${String(i).padStart(3, '0')}`,
        department: dept,
        degree: 'B.Tech',
        date_of_birth: new Date('2002-01-01'),
        gender: i % 2 === 0 ? 'Male' : 'Female',
        mobile_number: `98765432${String(i).padStart(2, '0')}`,
        personal_email: `student${i}@gmail.com`,
        address_permanent: 'Test Address',
        year_of_admission: 2021,
        current_semester: 6,
        expected_graduation_year: 2025,
        cgpi: 6.5 + (Math.random() * 3), // 6.5 to 9.5
        tpo_dept_verified: i <= 15, // 15 verified, 5 pending
        tpo_admin_verified: i <= 10, // 10 verified, 10 pending
        profile_complete_percent: 70 + Math.floor(Math.random() * 30)
      }
    });
  }
  
  // 3. Create 5 Organizations
  const orgStatuses = ['VERIFIED', 'VERIFIED', 'VERIFIED', 'PENDING_VERIFICATION', 'PENDING_VERIFICATION'];
  for (let i = 1; i <= 5; i++) {
    await prisma.organization.create({
      data: {
        org_name: `Tech Company ${i}`,
        website: `https://company${i}.com`,
        industry: 'Technology',
        size: '201-500',
        headquarters: 'Bangalore',
        recruiter_status: orgStatuses[i - 1],
        verified_at: i <= 3 ? new Date() : null,
        verified_by: i <= 3 ? adminUser.id : null
      }
    });
  }
  
  // 4. Create Job Postings
  const jobStatuses = ['ACTIVE', 'ACTIVE', 'PENDING_APPROVAL', 'CLOSED'];
  // ... (create jobs with different statuses)
  
  console.log('✅ Seed completed successfully!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

**Run Seed:**
```bash
cd backend
npm run seed
```

---

### Step 3: Build Frontend API Service Layer

**File:** `frontend/src/services/api.js`

```javascript
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

class APIService {
  constructor() {
    this.baseURL = API_BASE;
  }
  
  async request(endpoint, options = {}) {
    const token = localStorage.getItem('accessToken');
    
    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
        ...options.headers
      }
    };
    
    const response = await fetch(`${this.baseURL}${endpoint}`, config);
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  // Dashboard Stats
  async getOverviewStats() {
    return this.request('/api/internal/admin/stats/overview');
  }
  
  async getApplicationsTrend() {
    return this.request('/api/internal/admin/stats/applications-trend');
  }
  
  async getDepartmentDistribution() {
    return this.request('/api/internal/admin/stats/department-distribution');
  }
  
  async getRecentActivity() {
    return this.request('/api/internal/admin/stats/recent-activity');
  }
  
  // Students
  async getStudents(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`/api/internal/admin/students?${params}`);
  }
  
  // Jobs
  async getJobPostings(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`/api/internal/admin/job-postings?${params}`);
  }
}

export default new APIService();
```

---

### Step 4: Build Dashboard Components

**File:** `frontend/src/pages/tpo-admin/Dashboard.jsx`

```javascript
import { useState, useEffect } from 'react';
import api from '../../services/api';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    loadDashboardData();
  }, []);
  
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.getOverviewStats();
      
      // Log to verify real data
      console.log('📊 Dashboard Stats Loaded:', response.data);
      
      setStats(response.data);
    } catch (err) {
      console.error('❌ Failed to load stats:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return <LoadingSkeleton />;
  }
  
  if (error) {
    return (
      <ErrorMessage 
        message={error} 
        onRetry={loadDashboardData} 
      />
    );
  }
  
  return (
    <div className="dashboard">
      <h1>TPO Admin Dashboard</h1>
      
      {/* Stats Cards */}
      <div className="stats-grid">
        <StatCard 
          title="Total Students" 
          value={stats.students.total}
          trend={`+${stats.students.newThisMonth} this month`}
          icon="👨‍🎓"
        />
        <StatCard 
          title="Pending Verifications" 
          value={stats.verifications.pending}
          urgent={stats.verifications.urgent}
          icon="⏳"
        />
        <StatCard 
          title="Active Recruiters" 
          value={stats.recruiters.active}
          trend={`+${stats.recruiters.recentlyVerified} recently`}
          icon="🏢"
        />
        <StatCard 
          title="Active Jobs" 
          value={stats.jobs.active}
          pending={stats.jobs.pendingApproval}
          icon="💼"
        />
      </div>
      
      {/* Charts */}
      <div className="charts-grid">
        <ApplicationsTrendChart />
        <DepartmentDistributionChart />
        <PlacementRateChart />
      </div>
      
      {/* Activity Feed */}
      <RecentActivityFeed />
    </div>
  );
};

export default Dashboard;
```

---

## 🛡️ Safeguards Against Dummy Data

### 1. **Code Review Checklist**

Before committing any code, verify:

- [ ] All data comes from API calls (check `useEffect` hooks)
- [ ] No hardcoded arrays like `const data = [...]`
- [ ] No hardcoded numbers in stat displays
- [ ] Loading states are implemented
- [ ] Error states are implemented
- [ ] Network tab shows real API requests
- [ ] Console logs show real data (not undefined/null)
- [ ] Backend is running during development
- [ ] Database has seed data

### 2. **Development Environment Checks**

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
# Should show: Server running on http://localhost:5000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# Should show: Local: http://localhost:5173
```

**Terminal 3 - Database:**
```bash
cd backend
npx prisma studio
# Opens Prisma Studio at http://localhost:5555
```

### 3. **Browser DevTools Verification**

**Network Tab:**
- Every dashboard load should show XHR requests to `/api/internal/admin/stats/*`
- Response should show real data (not empty objects)
- Status should be 200 OK

**Console Tab:**
- Should see logs: `📊 Dashboard Stats Loaded: { ... }`
- Should NOT see errors about undefined data
- Should NOT see warnings about missing props

### 4. **TypeScript Type Safety**

**Define interfaces matching backend responses:**

```typescript
// frontend/src/types/dashboard.ts
export interface DashboardStats {
  students: {
    total: number;
    newThisMonth: number;
  };
  verifications: {
    pending: number;
    urgent: number;
  };
  recruiters: {
    active: number;
    recentlyVerified: number;
  };
  jobs: {
    active: number;
    pendingApproval: number;
  };
}

// This forces us to use real data structure
const [stats, setStats] = useState<DashboardStats | null>(null);
```

---

## 🧪 Testing Strategy

### 1. **Backend API Testing**

**Using Thunder Client / Postman:**

```http
GET http://localhost:5000/api/internal/admin/stats/overview
Authorization: Bearer <your_jwt_token>
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "students": {
      "total": 20,
      "newThisMonth": 5
    },
    "verifications": {
      "pending": 10,
      "urgent": 3
    },
    "recruiters": {
      "active": 3,
      "recentlyVerified": 2
    },
    "jobs": {
      "active": 5,
      "pendingApproval": 2
    }
  }
}
```

### 2. **Frontend Integration Testing**

**Test Scenarios:**

1. **Empty Database:**
   - Clear all data: `npx prisma migrate reset`
   - Dashboard should show zeros (not errors)
   - Should display "No data available" messages

2. **With Seed Data:**
   - Run seed: `npm run seed`
   - Dashboard should show actual counts
   - Charts should render with real data points

3. **Network Failure:**
   - Stop backend server
   - Dashboard should show error message
   - Retry button should work

4. **Slow Network:**
   - Throttle network in DevTools (Slow 3G)
   - Loading skeletons should appear
   - Data should eventually load

---

## 📈 Performance Optimization

### 1. **Database Query Optimization**

**Use Indexes:**
```sql
-- Already defined in schema.prisma
@@index([tpo_admin_verified])
@@index([recruiter_status])
@@index([status])
@@index([created_at])
```

**Use Parallel Queries:**
```typescript
// ✅ Good - Parallel execution
const [students, jobs, recruiters] = await Promise.all([
  prisma.studentProfile.count(...),
  prisma.jobPosting.count(...),
  prisma.organization.count(...)
]);

// ❌ Bad - Sequential execution
const students = await prisma.studentProfile.count(...);
const jobs = await prisma.jobPosting.count(...);
const recruiters = await prisma.organization.count(...);
```

### 2. **Frontend Caching**

**Use React Query (Optional):**
```javascript
import { useQuery } from '@tanstack/react-query';

const useDashboardStats = () => {
  return useQuery({
    queryKey: ['dashboardStats'],
    queryFn: () => api.getOverviewStats(),
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000 // Refresh every minute
  });
};
```

---

## 🚀 Deployment Checklist

Before deploying to production:

- [ ] All API endpoints tested with real data
- [ ] No console.log statements with sensitive data
- [ ] Environment variables configured (.env.production)
- [ ] Database migrations applied
- [ ] Seed data removed (production uses real user data)
- [ ] Error tracking configured (Sentry, etc.)
- [ ] Performance monitoring enabled
- [ ] CORS configured for production domain
- [ ] JWT secrets are secure
- [ ] Rate limiting enabled
- [ ] SQL injection prevention verified (Prisma handles this)

---

## 📚 Additional Resources

### Backend Endpoints Documentation
See: `backend/API_DOCUMENTATION.md`

### Database Schema
See: `AGENTS.md` - Database Schema section

### Prisma Documentation
- [Prisma Client API](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)
- [Prisma Queries](https://www.prisma.io/docs/concepts/components/prisma-client/crud)

---

## 🎨 Dashboard Design Features

### Cool Features to Include:

1. **Real-Time Stats Cards** with animated counters
2. **Interactive Charts** (Chart.js / Recharts)
3. **Live Activity Feed** with auto-refresh
4. **Quick Actions Panel** with badge counts
5. **Department-wise Analytics** with drill-down
6. **Placement Trends** over time
7. **Recruiter Leaderboard** (most active)
8. **Student Progress Tracker**
9. **Notification Center** with real alerts
10. **Export Reports** (PDF/Excel) with real data

### UI/UX Enhancements:

- **Loading Skeletons** (not spinners)
- **Error Boundaries** with retry
- **Empty States** with helpful messages
- **Tooltips** with additional context
- **Responsive Design** (mobile-friendly)
- **Dark Mode** support
- **Keyboard Shortcuts** for power users
- **Search & Filters** with real-time updates

---

## ✅ Summary

**Key Takeaways:**

1. ✅ **NO DUMMY DATA** - Everything from database
2. ✅ **Backend First** - Fix Prisma errors, test endpoints
3. ✅ **Seed Data** - Realistic test data (not random garbage)
4. ✅ **API Service Layer** - Centralized data fetching
5. ✅ **Loading/Error States** - Handle async properly
6. ✅ **Type Safety** - TypeScript interfaces
7. ✅ **Testing** - Verify with Network tab
8. ✅ **Performance** - Optimize queries, use caching
9. ✅ **Monitoring** - Console logs during development
10. ✅ **Documentation** - Keep this updated

**Before Git Commit:**
```bash
# 1. Backend running?
curl http://localhost:5000/health

# 2. Frontend connecting?
# Check Network tab in browser

# 3. Real data flowing?
# Check console logs

# 4. No dummy data?
# Search codebase for hardcoded arrays
grep -r "const.*=.*\[{" frontend/src/

# If no results, you're good! ✅
```

---

**Last Updated:** 2025-01-15  
**Status:** Ready for Implementation  
**Next Step:** Fix backend Prisma errors → Create seed script → Build frontend
