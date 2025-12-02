# TPO Management System - Database

This directory contains all database schemas, migrations, and seed data for the TPO Management System using **NeonDB** (Serverless PostgreSQL).

## 📊 Database Information

- **Provider**: NeonDB (Serverless PostgreSQL)
- **Version**: PostgreSQL 17.5
- **Region**: us-east-1 (AWS)
- **SSL**: Required
- **Connection Pooling**: Enabled

## 🗂️ Directory Structure

```
database/
├── schemas/              # SQL schema files
│   ├── 01_auth.sql      # Authentication & user management
│   ├── 02_students.sql  # Student profiles & academic data
│   ├── 03_recruiters.sql # Recruiters & job postings
│   ├── 04_core.sql      # TPO staff & core operations
│   ├── 05_scheduling.sql # Events & scheduling
│   ├── 06_notifications.sql # Notification system
│   ├── 07_audit.sql     # Audit logging
│   └── 08_analytics.sql # Analytics views
├── migrations/          # Database migrations
├── seeds/              # Seed data for development
├── apply-schemas.sh    # Script to apply all schemas
├── DATABASE_SETUP.md   # Detailed setup documentation
└── README.md           # This file
```

## 🚀 Quick Start

### 1. Set Environment Variable

```bash
export DATABASE_URL="postgresql://username:password@host-pooler.region.aws.neon.tech/database?sslmode=require"
```

Or add it to your `.env` file in the backend directory.

### 2. Apply All Schemas

```bash
cd database
./apply-schemas.sh
```

This will:
- Test database connection
- Apply all schema files in order
- Show summary of applied schemas
- List all created tables

### 3. Verify Installation

```bash
# Check database connection
psql "$DATABASE_URL" -c "SELECT version();"

# List all schemas
psql "$DATABASE_URL" -c "\\dn"

# List all tables
psql "$DATABASE_URL" -c "\\dt *.*"
```

## 📋 Schema Overview

### 1. Authentication Schema (`01_auth.sql`)

**Tables:**
- `auth.users` - All system users (students, TPO staff, recruiters)
- `auth.sessions` - JWT token management
- `auth.permissions` - Role-based access control
- `auth.login_history` - Login attempt tracking

**Features:**
- UUID primary keys
- Email & mobile verification
- Multi-factor authentication (MFA)
- Password reset functionality
- Account locking mechanism
- Row-Level Security (RLS) policies

### 2. Students Schema (`02_students.sql`)

**Tables:**
- `students.profiles` - Complete student profiles
- `students.semester_marks` - Semester-wise marks & SPI
- `students.resumes` - Resume versions with watermarking
- `students.consents` - Data sharing consents
- `students.eligibility_results` - Job eligibility computation
- `students.documents` - Additional documents

**Features:**
- Auto CGPI calculation
- Resume versioning
- Consent management
- Eligibility tracking

### 3. Recruiters Schema (`03_recruiters.sql`)

**Tables:**
- `recruiters.organizations` - Company information
- `recruiters.pocs` - Points of contact
- `recruiters.job_postings` - Job postings
- `recruiters.job_applications` - Student applications
- `recruiters.offers` - Job offers

**Features:**
- Organization verification
- Job posting approval workflow
- Application tracking
- Offer management

### 4. Core Schema (`04_core.sql`)

**Tables:**
- `core.tpo_dept_coordinators` - Department coordinators
- `core.exam_correction_requests` - Academic corrections
- `core.communication_log` - Communications tracking
- `core.reminder_history` - Reminder history
- `core.report_exports` - Generated reports

### 5. Scheduling Schema (`05_scheduling.sql`)

**Tables:**
- `scheduling.events` - Calendar events
- `scheduling.event_rsvp` - RSVP tracking
- `scheduling.attendance` - Attendance records

### 6. Notifications Schema (`06_notifications.sql`)

**Tables:**
- `notifications.outbox` - Notification queue
- `notifications.templates` - Notification templates

### 7. Audit Schema (`07_audit.sql`)

**Tables:**
- `audit.events` - Immutable audit log
- `core.approval_requests` - Approval workflow

### 8. Analytics Schema (`08_analytics.sql`)

**Views:**
- Placement statistics
- Student analytics
- Recruiter insights
- Department reports

## 🔧 Manual Schema Application

If you prefer to apply schemas manually:

```bash
# Apply individual schema
psql "$DATABASE_URL" -f schemas/01_auth.sql

# Apply all schemas in order
for file in schemas/*.sql; do
  echo "Applying $file..."
  psql "$DATABASE_URL" -f "$file"
done
```

## 🌱 Seed Data

Apply seed data for development:

```bash
# Apply test data
psql "$DATABASE_URL" -f seeds/01_test_data.sql

# Apply notification templates
psql "$DATABASE_URL" -f seeds/02_notification_templates.sql
```

## 🔍 Database Inspection

### List All Schemas
```bash
psql "$DATABASE_URL" -c "SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT IN ('pg_catalog', 'information_schema') ORDER BY schema_name;"
```

### List Tables in a Schema
```bash
# Auth schema
psql "$DATABASE_URL" -c "\\dt auth.*"

# Students schema
psql "$DATABASE_URL" -c "\\dt students.*"

# All schemas
psql "$DATABASE_URL" -c "\\dt *.*"
```

### Describe Table Structure
```bash
psql "$DATABASE_URL" -c "\\d auth.users"
psql "$DATABASE_URL" -c "\\d students.profiles"
```

### Count Records
```bash
# Count users
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM auth.users;"

# Count students
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM students.profiles;"
```

## 🔐 Security Features

- **SSL Required**: All connections must use SSL
- **Row-Level Security (RLS)**: Enabled on sensitive tables
- **Password Hashing**: bcrypt with cost factor 12
- **Token Hashing**: SHA-256 for session tokens
- **Audit Logging**: All critical actions logged
- **Connection Pooling**: Automatic via NeonDB pooler

## 🔄 Migrations

Database migrations are stored in the `migrations/` directory. To apply migrations:

```bash
psql "$DATABASE_URL" -f migrations/004_add_audit_and_approvals.sql
```

## 🧪 Testing

### Test Database Connection
```bash
psql "$DATABASE_URL" -c "SELECT 1;"
```

### Test Schema Existence
```bash
psql "$DATABASE_URL" -c "SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'auth';"
```

### Test Table Creation
```bash
psql "$DATABASE_URL" -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'auth';"
```

## 📊 Database Maintenance

### Clean Expired Sessions
```bash
psql "$DATABASE_URL" -c "SELECT auth.clean_expired_sessions();"
```

### Backup Database
```bash
pg_dump "$DATABASE_URL" > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restore Database
```bash
psql "$DATABASE_URL" < backup_20241202_120000.sql
```

### Vacuum Database
```bash
psql "$DATABASE_URL" -c "VACUUM ANALYZE;"
```

## 🔗 Integration with Backend

The backend uses Prisma ORM which connects to this database. The Prisma schema (`backend/prisma/schema.prisma`) should match these SQL schemas.

### Sync Prisma with Database
```bash
cd ../backend
npx prisma db pull  # Pull schema from database
npx prisma generate # Generate Prisma Client
```

## 📝 Environment Variables

Required environment variables:

```bash
# Database connection (use your actual credentials from .env file)
DATABASE_URL="postgresql://username:password@host-pooler.region.aws.neon.tech/database?sslmode=require"

# Optional: Direct connection (non-pooled)
DIRECT_URL="postgresql://username:password@host.region.aws.neon.tech/database?sslmode=require"
```

## 🚨 Important Notes

1. **Never commit `.env` files** with actual credentials
2. **Always use SSL** when connecting to NeonDB
3. **Use connection pooling** for production (pooler endpoint)
4. **Regular backups** are recommended
5. **Test migrations** in development before production
6. **Monitor database size** (NeonDB has storage limits)

## 🆘 Troubleshooting

### Connection Refused
- Check if DATABASE_URL is correct
- Verify SSL mode is set to `require`
- Check network connectivity

### Permission Denied
- Verify database user has correct permissions
- Check if RLS policies are blocking access

### Schema Already Exists
- Schemas are created with `IF NOT EXISTS`
- Safe to re-run schema files

### Table Already Exists
- Tables are created with `IF NOT EXISTS`
- Safe to re-run schema files

## 📚 Additional Resources

- [NeonDB Documentation](https://neon.tech/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Prisma Documentation](https://www.prisma.io/docs/)

## 👥 Support

For issues or questions:
1. Check `DATABASE_SETUP.md` for detailed setup instructions
2. Review schema files for table structures
3. Contact the TPO development team

---

**Last Updated**: December 2024  
**Maintained By**: TPO Development Team
