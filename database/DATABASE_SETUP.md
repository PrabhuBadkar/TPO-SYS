# TPO Management System - Database Setup

**Database:** NeonDB PostgreSQL 17.5  
**Status:** ✅ Connected and Configured  
**Date:** 2024-01-15

---

## 🎯 Database Information

**Provider:** NeonDB (Serverless PostgreSQL)  
**Version:** PostgreSQL 17.5  
**Region:** us-east-1 (AWS)  
**SSL:** Required  
**Connection Pooling:** Enabled

---

## 📊 Applied Schemas

### ✅ 01_auth.sql (Applied)

**Tables Created:**
- `auth.users` — All system users (students, TPO staff, recruiters)
- `auth.sessions` — JWT token management and session tracking
- `auth.permissions` — Role-based access control permissions
- `auth.login_history` — Login attempt history for security auditing

**Features:**
- ✅ UUID primary keys
- ✅ Email and mobile verification
- ✅ Multi-factor authentication (MFA) support
- ✅ Password reset functionality
- ✅ Account locking mechanism
- ✅ Failed login attempt tracking
- ✅ Session management with token hashing
- ✅ Row-Level Security (RLS) policies
- ✅ Automatic timestamp updates
- ✅ Initial permissions data for all 4 roles

**Indexes:**
- Email, role, email_verified, is_active (users)
- User_id, token hashes, is_active, expires_at (sessions)
- Role, resource (permissions)
- User_id, email, attempted_at, success (login_history)

---

## 🔄 Pending Schemas

### ⏳ 02_students.sql (Pending)
- Student profiles, semester marks, resumes, consents, eligibility

### ⏳ 03_recruiters.sql (Pending)
- Organizations, POCs, job postings, applications, offers

### ⏳ 04_core.sql (Pending)
- TPO admins, dept coordinators, tasks, reviews

### ⏳ 05_scheduling.sql (Pending)
- Events, RSVP, attendance

### ⏳ 06_notifications.sql (Pending)
- Notification outbox, templates

### ⏳ 07_audit.sql (Pending)
- Audit events log (immutable)

### ⏳ 08_analytics.sql (Pending)
- Views and materialized views

---

## 🔐 Connection Details

**Connection String:**
```
postgresql://username:password@host-pooler.region.aws.neon.tech/database?sslmode=require
```

**Environment Variable:**
```bash
DATABASE_URL=postgresql://username:password@host-pooler.region.aws.neon.tech/database?sslmode=require
```

**Note:** Use your actual credentials from the `.env` file or backend configuration.

---

## 🚀 Quick Commands

### Connect to Database
```bash
psql "$DATABASE_URL"
```

### Apply All Schemas
```bash
cd database
./apply-schemas.sh
```

### Apply Single Schema
```bash
psql "$DATABASE_URL" -f database/schemas/01_auth.sql
```

### List All Tables
```bash
psql "$DATABASE_URL" -c "\dt *.*"
```

### List Auth Tables
```bash
psql "$DATABASE_URL" -c "\dt auth.*"
```

### Check Table Structure
```bash
psql "$DATABASE_URL" -c "\d auth.users"
```

---

## 📋 Schema Files

| File | Status | Tables | Description |
|------|--------|--------|-------------|
| `01_auth.sql` | ✅ Applied | 4 | Authentication and user management |
| `02_students.sql` | ⏳ Pending | 5 | Student data and profiles |
| `03_recruiters.sql` | ⏳ Pending | 5 | Recruiter and job posting data |
| `04_core.sql` | ⏳ Pending | 5 | TPO staff and core operations |
| `05_scheduling.sql` | ⏳ Pending | 3 | Events and scheduling |
| `06_notifications.sql` | ⏳ Pending | 2 | Notification system |
| `07_audit.sql` | ⏳ Pending | 1 | Audit logging |
| `08_analytics.sql` | ⏳ Pending | 0 | Views and analytics |

---

## ✅ Verification

### Check Connection
```bash
psql "$DATABASE_URL" -c "SELECT version();"
```

**Expected Output:**
```
PostgreSQL 17.5 (6bc9ef8) on aarch64-unknown-linux-gnu
```

### Check Auth Schema
```bash
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM auth.users;"
```

**Expected Output:**
```
 count 
-------
     0
(1 row)
```

### Check Permissions
```bash
psql "$DATABASE_URL" -c "SELECT role, COUNT(*) FROM auth.permissions GROUP BY role;"
```

**Expected Output:**
```
      role       | count 
-----------------+-------
 ROLE_STUDENT    |     8
 ROLE_TPO_DEPT   |     6
 ROLE_TPO_ADMIN  |     7
 ROLE_RECRUITER  |     5
(4 rows)
```

---

## 🔧 Maintenance

### Backup Database
```bash
pg_dump "$DATABASE_URL" > backup_$(date +%Y%m%d).sql
```

### Restore Database
```bash
psql "$DATABASE_URL" < backup_20240115.sql
```

### Clean Expired Sessions
```bash
psql "$DATABASE_URL" -c "SELECT auth.clean_expired_sessions();"
```

---

## 📝 Notes

- **SSL Required:** All connections must use SSL
- **Connection Pooling:** Enabled via pooler endpoint
- **Row-Level Security:** Enabled on auth.users and auth.sessions
- **Auto-cleanup:** Expired sessions can be cleaned with `auth.clean_expired_sessions()`
- **Password Hashing:** Use bcrypt with cost factor 12
- **MFA:** TOTP-based, backup codes supported

---

## 🎯 Next Steps

1. ⏳ Create remaining schema files (02-08)
2. ⏳ Apply all schemas to database
3. ⏳ Create seed data for development
4. ⏳ Setup database migrations
5. ⏳ Create database backup strategy

---

**Last Updated:** 2024-01-15  
**Maintained By:** TPO Development Team
