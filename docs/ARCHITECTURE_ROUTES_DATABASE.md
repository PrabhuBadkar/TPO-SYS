# TPO-SYS Architecture - Routes & Database Connections

## 🏗️ System Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│  (React + Vite - Port 3000)                                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Landing Page (/)                                           │
│  Student Login (/login?role=student)                        │
│  Student Register (/register?role=student)                  │
│  TPO Admin Login (/tpo-admin/login)                         │
│  TPO Admin Dashboard (/tpo-admin/dashboard)                 │
│                                                              │
└──────────────────┬──────────────────────────────────────────┘
                   │ HTTP/REST API
                   │ (fetch/axios)
┌──────────────────▼──────────────────────────────────────────┐
│                        BACKEND                               │
│  (Node.js + Express + Prisma - Port 5000)                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  /api/auth/login                                            │
│  /api/auth/login/student                                    │
│  /api/auth/register/student                                 │
│  /api/internal/admin/*                                      │
│                                                              │
└──────────────────┬──────────────────────────────────────────┘
                   │ Prisma ORM
                   │ (SQL queries)
┌──────────────────▼──────────────────────────────────────────┐
│                      DATABASE                                │
│  (PostgreSQL - NeonDB)                                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  auth.users                                                 │
│  students.profiles                                          │
│  recruiters.organizations                                   │
│  core.job_postings                                          │
│  core.applications                                          │
│  audit.logs                                                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛣️ Complete Route Map

### **Frontend Routes**

| Route | Component | Purpose | Auth Required |
|-------|-----------|---------|---------------|
| `/` | `App.jsx` | Landing page with role selection | No |
| `/login?role=student` | `StudentLogin.jsx` | Student login form | No |
| `/register?role=student` | `StudentRegister.jsx` | Student registration form | No |
| `/tpo-admin/login` | `TPOAdminLogin.jsx` | TPO Admin login form | No |
| `/tpo-admin/dashboard` | `TPOAdminDashboard.jsx` | TPO Admin dashboard | Yes (ROLE_TPO_ADMIN) |

### **Backend API Routes**

| Method | Endpoint | Purpose | Auth Required | Role |
|--------|----------|---------|---------------|------|
| POST | `/api/auth/login` | General login (email + password) | No | Any |
| POST | `/api/auth/login/student` | Student login (URN + dept + password) | No | ROLE_STUDENT |
| POST | `/api/auth/register/student` | Student registration | No | - |
| POST | `/api/auth/logout` | User logout | Yes | Any |
| GET | `/api/auth/me` | Get current user info | Yes | Any |
| POST | `/api/auth/refresh` | Refresh access token | No | - |

---

## 🔗 Data Flow Diagrams

### **1. Student Registration Flow**

```
┌─────────────┐
│   STUDENT   │
└──────┬──────┘
       │ 1. Fills registration form
       │    (firstName, lastName, URN, dept, email, mobile, password)
       ▼
┌─────────────────────────────┐
│  StudentRegister.jsx        │
│  - Validates form           │
│  - Checks password match    │
└──────┬──────────────────────┘
       │ 2. POST /api/auth/register/student
       │    Body: { firstName, lastName, urn, department, email, mobileNumber, password }
       ▼
┌─────────────────────────────┐
│  Backend: auth.routes.ts    │
│  - Validates with Zod       │
│  - Checks email exists      │
│  - Checks URN exists        │
│  - Hashes password (bcrypt) │
└──────┬──────────────────────┘
       │ 3. Database Transaction
       ▼
┌─────────────────────────────┐
│  DATABASE                   │
│                             │
│  INSERT INTO auth.users:    │
│  - email                    │
│  - encrypted_password       │
│  - role = 'ROLE_STUDENT'    │
│  - is_active = true         │
│                             │
│  INSERT INTO students.profiles: │
│  - user_id (FK)             │
│  - first_name               │
│  - middle_name              │
│  - last_name                │
│  - enrollment_number (URN)  │
│  - department               │
│  - mobile_number            │
│  - personal_email           │
└──────┬──────────────────────┘
       │ 4. Success Response
       ▼
┌─────────────────────────────┐
│  Frontend                   │
│  - Shows success toast      │
│  - Redirects to login       │
└─────────────────────────────┘
```

### **2. Student Login Flow**

```
┌─────────────┐
│   STUDENT   │
└──────┬──────┘
       │ 1. Enters credentials
       │    (URN, department, password)
       ▼
┌─────────────────────────────┐
│  StudentLogin.jsx           │
│  - Validates form           │
└──────┬──────────────────────┘
       │ 2. POST /api/auth/login/student
       │    Body: { urn, department, password }
       ▼
┌─────────────────────────────┐
│  Backend: auth.routes.ts    │
│  - Validates with Zod       │
└──────┬──────────────────────┘
       │ 3. Query Database
       ▼
┌─────────────────────────────┐
│  DATABASE                   │
│                             │
│  SELECT * FROM students.profiles │
│  WHERE enrollment_number = urn   │
│    AND department = dept         │
│  INCLUDE user                    │
└──────┬──────────────────────┘
       │ 4. Verify Password
       ▼
┌─────────────────────────────┐
│  Backend                    │
│  - bcrypt.compare()         │
│  - Generate JWT tokens      │
│  - Create session           │
└──────┬──────────────────────┘
       │ 5. Success Response
       │    { user, profile, tokens }
       ▼
┌─────────────────────────────┐
│  Frontend                   │
│  - Store tokens in localStorage │
│  - Store user data          │
│  - Shows welcome toast      │
│  - Redirects to dashboard   │
└─────────────────────────────┘
```

### **3. TPO Admin Login Flow**

```
┌─────────────┐
│  TPO ADMIN  │
└──────┬──────┘
       │ 1. Enters credentials
       │    (email, password)
       ▼
┌─────────────────────────────┐
│  TPOAdminLogin.jsx          │
│  - Validates form           │
└──────┬──────────────────────┘
       │ 2. POST /api/auth/login
       │    Body: { email, password }
       ▼
┌─────────────────────────────┐
│  Backend: auth.routes.ts    │
│  - Validates with Zod       │
└──────┬──────────────────────┘
       │ 3. Query Database
       ▼
┌─────────────────────────────┐
│  DATABASE                   │
│                             │
│  SELECT * FROM auth.users   │
│  WHERE email = email        │
│    AND role = 'ROLE_TPO_ADMIN' │
└──────┬──────────────────────┘
       │ 4. Verify Password & Role
       ▼
┌─────────────────────────────┐
│  Backend                    │
│  - bcrypt.compare()         │
│  - Check role = ROLE_TPO_ADMIN │
│  - Generate JWT tokens      │
│  - Create session           │
└──────┬──────────────────────┘
       │ 5. Success Response
       │    { user, tokens }
       ▼
┌─────────────────────────────┐
│  Frontend                   │
│  - Store tokens in localStorage │
│  - Shows welcome toast      │
│  - Redirects to /tpo-admin/dashboard │
└─────────────────────────────┘
```

---

## 📊 Database Schema Connections

### **auth.users** (Central Authentication Table)

```sql
CREATE TABLE auth.users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    encrypted_password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,  -- 'ROLE_STUDENT', 'ROLE_TPO_ADMIN', etc.
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    mobile_number VARCHAR(15),
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Relationships:**
- `students.profiles.user_id` → `auth.users.id` (One-to-One)
- `audit.logs.user_id` → `auth.users.id` (One-to-Many)
- `auth.sessions.user_id` → `auth.users.id` (One-to-Many)

### **students.profiles** (Student Data)

```sql
CREATE TABLE students.profiles (
    id UUID PRIMARY KEY,
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id),
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    enrollment_number VARCHAR(50) UNIQUE NOT NULL,  -- URN
    department VARCHAR(50) NOT NULL,
    mobile_number VARCHAR(15) NOT NULL,
    personal_email VARCHAR(255) NOT NULL,
    tpo_dept_verified BOOLEAN DEFAULT FALSE,
    tpo_admin_verified BOOLEAN DEFAULT FALSE,
    profile_complete_percent INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Used For:**
- Student registration
- Student login (URN + department lookup)
- Admin dashboard (student count, pending verifications)

---

## 🔌 API Endpoint Details

### **POST /api/auth/register/student**

**Request:**
```json
{
  "firstName": "John",
  "middleName": "Kumar",
  "lastName": "Doe",
  "urn": "2024CSE001",
  "department": "CSE",
  "email": "john@example.com",
  "mobileNumber": "9876543210",
  "password": "password123"
}
```

**Database Operations:**
1. Check if email exists: `SELECT * FROM auth.users WHERE email = ?`
2. Check if URN exists: `SELECT * FROM students.profiles WHERE enrollment_number = ?`
3. Hash password: `bcrypt.hash(password, 10)`
4. Insert user: `INSERT INTO auth.users (email, encrypted_password, role, ...)`
5. Insert profile: `INSERT INTO students.profiles (user_id, first_name, ...)`

**Response:**
```json
{
  "success": true,
  "message": "Registration successful!",
  "data": {
    "user": { "id": "...", "email": "...", "role": "ROLE_STUDENT" },
    "profile": { "id": "...", "enrollmentNumber": "...", "firstName": "..." }
  }
}
```

---

### **POST /api/auth/login/student**

**Request:**
```json
{
  "urn": "2024CSE001",
  "department": "CSE",
  "password": "password123"
}
```

**Database Operations:**
1. Find student: 
```sql
SELECT * FROM students.profiles 
WHERE enrollment_number = ? AND department = ?
INCLUDE user
```
2. Verify password: `bcrypt.compare(password, user.encrypted_password)`
3. Generate tokens: `jwt.sign({ userId, email, role })`
4. Create session: `INSERT INTO auth.sessions (...)`

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { "id": "...", "email": "...", "role": "ROLE_STUDENT" },
    "profile": { "id": "...", "enrollmentNumber": "...", "firstName": "..." },
    "tokens": {
      "accessToken": "eyJhbGc...",
      "refreshToken": "eyJhbGc...",
      "expiresIn": 86400
    }
  }
}
```

---

### **POST /api/auth/login** (TPO Admin)

**Request:**
```json
{
  "email": "admin@tpo.edu",
  "password": "password@123"
}
```

**Database Operations:**
1. Find user: `SELECT * FROM auth.users WHERE email = ?`
2. Check role: `user.role === 'ROLE_TPO_ADMIN'`
3. Verify password: `bcrypt.compare(password, user.encrypted_password)`
4. Generate tokens: `jwt.sign({ userId, email, role })`
5. Create session: `INSERT INTO auth.sessions (...)`

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { "id": "...", "email": "...", "role": "ROLE_TPO_ADMIN" },
    "tokens": {
      "accessToken": "eyJhbGc...",
      "refreshToken": "eyJhbGc...",
      "expiresIn": 86400
    }
  }
}
```

---

## 🎯 TPO Admin Dashboard - Data Connections

### **Quick Stats Cards**

**Card 1: Total Students**
```javascript
// Frontend API Call
const response = await fetch('/api/internal/admin/stats/students', {
  headers: { 'Authorization': `Bearer ${accessToken}` }
});

// Backend Query
SELECT COUNT(*) as total FROM students.profiles WHERE deleted_at IS NULL;
```

**Card 2: Pending Verifications**
```javascript
// Frontend API Call
const response = await fetch('/api/internal/admin/stats/pending-verifications', {
  headers: { 'Authorization': `Bearer ${accessToken}` }
});

// Backend Query
SELECT COUNT(*) as pending FROM students.profiles 
WHERE tpo_admin_verified = false AND deleted_at IS NULL;
```

**Card 3: Active Recruiters**
```javascript
// Frontend API Call
const response = await fetch('/api/internal/admin/stats/recruiters', {
  headers: { 'Authorization': `Bearer ${accessToken}` }
});

// Backend Query
SELECT COUNT(*) as active FROM recruiters.organizations 
WHERE is_active = true AND deleted_at IS NULL;
```

**Card 4: Active Job Postings**
```javascript
// Frontend API Call
const response = await fetch('/api/internal/admin/stats/jobs', {
  headers: { 'Authorization': `Bearer ${accessToken}` }
});

// Backend Query
SELECT COUNT(*) as active FROM core.job_postings 
WHERE status = 'ACTIVE' AND deleted_at IS NULL;
```

---

## 🔐 Authentication Flow

### **Token Storage (Frontend)**

```javascript
// After successful login
localStorage.setItem('accessToken', data.tokens.accessToken);
localStorage.setItem('refreshToken', data.tokens.refreshToken);
localStorage.setItem('user', JSON.stringify(data.user));
localStorage.setItem('profile', JSON.stringify(data.profile)); // For students
```

### **Protected Route Check**

```javascript
// In TPOAdminDashboard.jsx
useEffect(() => {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const token = localStorage.getItem('accessToken');

  if (!user || !token || user.role !== 'ROLE_TPO_ADMIN') {
    navigate('/tpo-admin/login');
  }
}, [navigate]);
```

### **API Request with Auth**

```javascript
// Making authenticated requests
const response = await fetch('/api/internal/admin/students/all', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
    'Content-Type': 'application/json'
  }
});
```

---

## 📋 Missing Backend Routes (To Be Created)

### **Admin Stats Endpoints**

```typescript
// GET /api/internal/admin/stats/students
router.get('/stats/students', authenticate, async (req, res) => {
  const total = await prisma.studentProfile.count({
    where: { deleted_at: null }
  });
  res.json({ success: true, data: { total } });
});

// GET /api/internal/admin/stats/pending-verifications
router.get('/stats/pending-verifications', authenticate, async (req, res) => {
  const pending = await prisma.studentProfile.count({
    where: { 
      tpo_admin_verified: false,
      deleted_at: null 
    }
  });
  res.json({ success: true, data: { pending } });
});

// GET /api/internal/admin/stats/recruiters
router.get('/stats/recruiters', authenticate, async (req, res) => {
  const active = await prisma.recruiterOrganization.count({
    where: { 
      is_active: true,
      deleted_at: null 
    }
  });
  res.json({ success: true, data: { active } });
});

// GET /api/internal/admin/stats/jobs
router.get('/stats/jobs', authenticate, async (req, res) => {
  const active = await prisma.jobPosting.count({
    where: { 
      status: 'ACTIVE',
      deleted_at: null 
    }
  });
  res.json({ success: true, data: { active } });
});
```

---

## 🗺️ Complete System Map

```
FRONTEND ROUTES          BACKEND ROUTES                    DATABASE TABLES
─────────────────        ──────────────────                ───────────────

/                        (No API)                          -
  └─ Landing Page

/login?role=student      POST /api/auth/login/student      students.profiles
  └─ StudentLogin.jsx    ├─ Find by URN + dept            auth.users
                         ├─ Verify password                auth.sessions
                         └─ Generate tokens

/register?role=student   POST /api/auth/register/student   auth.users
  └─ StudentRegister.jsx ├─ Check email/URN exists        students.profiles
                         ├─ Hash password
                         └─ Create user + profile

/tpo-admin/login         POST /api/auth/login              auth.users
  └─ TPOAdminLogin.jsx   ├─ Find by email                 auth.sessions
                         ├─ Check role = ROLE_TPO_ADMIN
                         ├─ Verify password
                         └─ Generate tokens

/tpo-admin/dashboard     GET /api/internal/admin/stats/*   students.profiles
  └─ TPOAdminDashboard   ├─ /students                     recruiters.organizations
                         ├─ /pending-verifications         core.job_postings
                         ├─ /recruiters                    core.applications
                         └─ /jobs                          audit.logs
```

---

## 🚀 Next Steps

### **1. Create Missing Backend Routes**
- Admin stats endpoints
- Student list endpoint
- Recruiter list endpoint
- Job posting list endpoint

### **2. Build Dashboard Components**
- Quick Stats Cards (with real API calls)
- Pending Actions Queue
- Analytics Charts
- Sidebar Navigation

### **3. Connect Frontend to Backend**
- Create API service layer
- Add authentication headers
- Handle loading states
- Error handling

### **4. Test Complete Flow**
- Student registration → Database
- Student login → Dashboard
- Admin login → Dashboard
- Dashboard stats → Real data

---

**This document shows the complete architecture. Ready to start building the missing pieces?** 🚀
