# Actual Database Tables (From Production DB)

> **Source:** Pulled from NeonDB using `npx prisma db pull`  
> **Date:** 2024-12-03  
> **Database:** PostgreSQL (NeonDB)  
> **Total Tables:** 20 tables across 5 schemas

---

## 📊 Database Schema Summary

### **AUTH Schema** (2 tables)
1. ✅ `auth.users` - User authentication
2. ✅ `auth.sessions` - JWT session tracking

### **STUDENTS Schema** (6 tables)
1. ✅ `students.profiles` - Student profiles
2. ✅ `students.semester_marks` - Academic records
3. ✅ `students.resumes` - Resume uploads
4. ✅ `students.consents` - GDPR consent tracking
5. ✅ `students.eligibility_results` - Job eligibility cache
6. ✅ `students.documents` - Document uploads

### **RECRUITERS Schema** (5 tables)
1. ✅ `recruiters.organizations` - Company information
2. ✅ `recruiters.pocs` - Points of contact
3. ✅ `recruiters.job_postings` - Job opportunities
4. ✅ `recruiters.job_applications` - Student applications
5. ✅ `recruiters.offers` - Job offers

### **CORE Schema** (6 tables)
1. ✅ `core.tpo_dept_coordinators` - TPO department staff
2. ✅ `core.exam_correction_requests` - Academic corrections
3. ✅ `core.communication_log` - Mass communications
4. ✅ `core.reminder_history` - Automated reminders
5. ✅ `core.report_exports` - Generated reports
6. ✅ `core.approval_requests` - Approval workflow

### **AUDIT Schema** (1 table)
1. ✅ `audit.events` - Complete audit trail

---

## 🔍 Key Differences from Original Schema

### **Organization Table**
**Column:** `recruiter_status` ✅ **EXISTS**

```sql
recruiter_status VARCHAR(50) NOT NULL DEFAULT 'PENDING_VERIFICATION'
```

**Possible Values:**
- `PENDING_VERIFICATION`
- `VERIFIED`
- `REJECTED`
- `BLACKLISTED`

**Index:** ✅ `organizations_recruiter_status_idx`

---

## 📋 Complete Table Structures

### 1. `auth.users`

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | UUID | NO | gen_random_uuid() | Primary Key |
| email | VARCHAR | NO | - | Unique |
| mobile_number | VARCHAR | YES | - | Unique |
| encrypted_password | VARCHAR | NO | - | bcrypt hashed |
| role | VARCHAR | NO | - | ROLE_STUDENT, ROLE_RECRUITER, etc. |
| is_active | BOOLEAN | NO | true | Account status |
| is_verified | BOOLEAN | NO | false | Email verification |
| email_verified_at | TIMESTAMP | YES | - | |
| mobile_verified_at | TIMESTAMP | YES | - | |
| last_login_at | TIMESTAMP | YES | - | |
| login_count | INTEGER | NO | 0 | |
| failed_login_attempts | INTEGER | NO | 0 | |
| locked_until | TIMESTAMP | YES | - | |
| mfa_enabled | BOOLEAN | NO | false | |
| mfa_secret | VARCHAR | YES | - | |
| created_at | TIMESTAMP | NO | now() | |
| updated_at | TIMESTAMP | NO | now() | Auto-updated |
| deleted_at | TIMESTAMP | YES | - | Soft delete |

---

### 2. `auth.sessions`

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | UUID | NO | gen_random_uuid() | Primary Key |
| user_id | UUID | NO | - | FK to users |
| token | VARCHAR | NO | - | Unique, JWT access token |
| refresh_token | VARCHAR | YES | - | Unique |
| ip_address | INET | YES | - | |
| user_agent | VARCHAR | YES | - | |
| expires_at | TIMESTAMP | NO | - | |
| created_at | TIMESTAMP | NO | now() | |
| revoked_at | TIMESTAMP | YES | - | |

**Indexes:**
- `sessions_user_id_idx`
- `sessions_token_idx`

---

### 3. `students.profiles`

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | UUID | NO | gen_random_uuid() | Primary Key |
| user_id | UUID | NO | - | Unique, FK to users |
| first_name | VARCHAR(100) | NO | - | |
| middle_name | VARCHAR(100) | YES | - | |
| last_name | VARCHAR(100) | NO | - | |
| mother_name | VARCHAR(100) | YES | - | |
| date_of_birth | DATE | NO | - | |
| gender | VARCHAR(50) | NO | - | |
| mobile_number | VARCHAR(15) | NO | - | |
| alternate_mobile | VARCHAR(15) | YES | - | |
| personal_email | VARCHAR(255) | NO | - | |
| address_permanent | TEXT | NO | - | |
| address_current | TEXT | YES | - | |
| photo_url | TEXT | YES | - | |
| college_name | VARCHAR(100) | NO | 'ACER' | |
| category | VARCHAR(50) | YES | - | |
| enrollment_number | VARCHAR(50) | NO | - | Unique |
| roll_number | VARCHAR(50) | YES | - | Unique |
| department | VARCHAR(50) | NO | - | CSE, ECE, ME, etc. |
| degree | VARCHAR(50) | NO | - | B.Tech, M.Tech, etc. |
| year_of_admission | INTEGER | NO | - | |
| current_semester | INTEGER | NO | - | |
| expected_graduation_year | INTEGER | NO | - | |
| cgpi | DECIMAL(4,2) | YES | - | |
| active_backlogs | BOOLEAN | NO | false | |
| backlog_history | JSON | NO | {...} | |
| tpo_dept_verified | BOOLEAN | NO | false | |
| tpo_dept_verified_at | TIMESTAMP | YES | - | |
| tpo_dept_verified_by | UUID | YES | - | |
| tpo_admin_verified | BOOLEAN | NO | false | |
| tpo_admin_verified_at | TIMESTAMP | YES | - | |
| tpo_admin_verified_by | UUID | YES | - | |
| profile_complete_percent | INTEGER | NO | 0 | |
| profile_status | VARCHAR(50) | NO | 'DRAFT' | |
| created_at | TIMESTAMP | NO | now() | |
| updated_at | TIMESTAMP | NO | now() | |
| deleted_at | TIMESTAMP | YES | - | |

**Indexes:**
- `profiles_enrollment_number_idx`
- `profiles_department_idx`
- `profiles_expected_graduation_year_idx`
- `profiles_tpo_dept_verified_tpo_admin_verified_idx`
- `profiles_user_id_idx`

---

### 4. `recruiters.organizations`

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | UUID | NO | gen_random_uuid() | Primary Key |
| org_name | VARCHAR(255) | NO | - | |
| website | VARCHAR(255) | YES | - | |
| industry | VARCHAR(100) | YES | - | |
| size | VARCHAR(50) | YES | - | 1-10, 11-50, etc. |
| headquarters | VARCHAR(255) | YES | - | |
| branch_offices | TEXT[] | NO | {} | Array |
| year_established | INTEGER | YES | - | |
| description | TEXT | YES | - | |
| gst_number | VARCHAR(50) | YES | - | |
| cin | VARCHAR(50) | YES | - | |
| pan | VARCHAR(50) | YES | - | |
| registration_cert_url | TEXT | YES | - | |
| authorization_letter_url | TEXT | YES | - | |
| **recruiter_status** | **VARCHAR(50)** | **NO** | **'PENDING_VERIFICATION'** | ✅ **EXISTS** |
| verified_at | TIMESTAMP | YES | - | |
| verified_by | UUID | YES | - | |
| rejection_reason | TEXT | YES | - | |
| blacklist_reason | TEXT | YES | - | |
| blacklisted_at | TIMESTAMP | YES | - | |
| blacklisted_by | UUID | YES | - | |
| created_at | TIMESTAMP | NO | now() | |
| updated_at | TIMESTAMP | NO | now() | |
| deleted_at | TIMESTAMP | YES | - | |

**Indexes:**
- ✅ `organizations_recruiter_status_idx`
- `organizations_org_name_idx`

---

### 5. `recruiters.job_postings`

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | UUID | NO | gen_random_uuid() | Primary Key |
| org_id | UUID | NO | - | FK to organizations |
| created_by | UUID | NO | - | FK to pocs.user_id |
| job_title | VARCHAR(255) | NO | - | |
| description | TEXT | NO | - | |
| required_skills | TEXT[] | NO | {} | Array |
| qualifications | TEXT | YES | - | |
| responsibilities | TEXT | YES | - | |
| work_location | VARCHAR(255) | NO | - | |
| employment_type | VARCHAR(50) | NO | - | Full-Time, Internship, etc. |
| eligibility_criteria | JSON | NO | {...} | |
| ctc_breakdown | JSON | NO | {...} | |
| selection_process | JSON | NO | {...} | |
| bond_terms | JSON | YES | {...} | |
| application_deadline | TIMESTAMP | NO | - | |
| status | VARCHAR(50) | NO | 'DRAFT' | DRAFT, ACTIVE, PENDING_APPROVAL, etc. |
| approved_at | TIMESTAMP | YES | - | |
| approved_by | UUID | YES | - | |
| rejection_reason | TEXT | YES | - | |
| modifications_requested | TEXT | YES | - | |
| created_at | TIMESTAMP | NO | now() | |
| updated_at | TIMESTAMP | NO | now() | |
| deleted_at | TIMESTAMP | YES | - | |

**Indexes:**
- `job_postings_org_id_idx`
- `job_postings_status_idx`
- `job_postings_application_deadline_idx`
- `job_postings_created_by_idx`

---

## 🔧 Backend Code Fix

### ✅ Correct Query (Using `recruiter_status`)

```typescript
// backend/src/routes/admin/stats.routes.ts

// Active Recruiters (VERIFIED status)
prisma.organization.count({
  where: {
    recruiter_status: 'VERIFIED',  // ✅ Correct
    deleted_at: null,
  },
})
```

### ❌ Incorrect Query (Using `is_active`)

```typescript
// DON'T USE THIS - Column doesn't exist!
prisma.organization.count({
  where: {
    is_active: true,  // ❌ Wrong - column doesn't exist
    deleted_at: null,
  },
})
```

---

## 📊 Query Examples

### Get All Verified Organizations
```typescript
const verifiedOrgs = await prisma.organization.findMany({
  where: {
    recruiter_status: 'VERIFIED',
    deleted_at: null
  }
});
```

### Get Pending Verifications
```typescript
const pendingOrgs = await prisma.organization.findMany({
  where: {
    recruiter_status: 'PENDING_VERIFICATION',
    deleted_at: null
  }
});
```

### Get Blacklisted Organizations
```typescript
const blacklistedOrgs = await prisma.organization.findMany({
  where: {
    recruiter_status: 'BLACKLISTED',
    deleted_at: null
  }
});
```

### Count by Status
```typescript
const statusCounts = await prisma.organization.groupBy({
  by: ['recruiter_status'],
  where: { deleted_at: null },
  _count: { recruiter_status: true }
});

// Result:
// [
//   { recruiter_status: 'VERIFIED', _count: { recruiter_status: 5 } },
//   { recruiter_status: 'PENDING_VERIFICATION', _count: { recruiter_status: 3 } },
//   { recruiter_status: 'BLACKLISTED', _count: { recruiter_status: 1 } }
// ]
```

---

## ✅ Verification Steps

### 1. Check Prisma Client Generated
```bash
cd backend
npx prisma generate
# Should show: ✔ Generated Prisma Client
```

### 2. Test Backend Endpoint
```bash
# Start backend
npm run dev

# In another terminal, test the endpoint
curl http://localhost:5000/api/internal/admin/stats/overview \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Expected Response
```json
{
  "success": true,
  "data": {
    "students": {
      "total": 0,
      "newThisMonth": 0
    },
    "verifications": {
      "pending": 0,
      "urgent": 0
    },
    "recruiters": {
      "active": 0,
      "recentlyVerified": 0
    },
    "jobs": {
      "active": 0,
      "pendingApproval": 0
    }
  }
}
```

---

## 🎯 Summary

**Issue:** Backend code was using `is_active` field that doesn't exist in the database.

**Root Cause:** Database schema was pulled from production, which uses `recruiter_status` instead.

**Solution:**
1. ✅ Pulled actual schema from database (`npx prisma db pull`)
2. ✅ Regenerated Prisma Client (`npx prisma generate`)
3. ✅ Updated backend code to use `recruiter_status`
4. ✅ Documented actual database structure

**Status:** ✅ **FIXED** - Backend now matches actual database schema

---

**Last Updated:** 2024-12-03  
**Database:** NeonDB (PostgreSQL)  
**Prisma Version:** 5.22.0
