# Database Quick Reference Guide

Quick commands for common database operations with NeonDB.

## 🔗 Connection

```bash
# Set environment variable (use your actual credentials)
export DATABASE_URL="postgresql://username:password@host-pooler.region.aws.neon.tech/database?sslmode=require"

# Connect to database
psql "$DATABASE_URL"

# Or load from .env file
source ../backend/.env
psql "$DATABASE_URL"
```

## 🚀 Setup

```bash
# Apply all schemas
cd database
./apply-schemas.sh

# Apply single schema
psql "$DATABASE_URL" -f schemas/01_auth.sql

# Apply seed data
psql "$DATABASE_URL" -f seeds/01_test_data.sql
```

## 🔍 Inspection

```bash
# List all schemas
psql "$DATABASE_URL" -c "\dn"

# List all tables
psql "$DATABASE_URL" -c "\dt *.*"

# List tables in auth schema
psql "$DATABASE_URL" -c "\dt auth.*"

# Describe table structure
psql "$DATABASE_URL" -c "\d auth.users"

# Show table indexes
psql "$DATABASE_URL" -c "\di auth.*"
```

## 📊 Queries

```bash
# Count users
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM auth.users;"

# Count by role
psql "$DATABASE_URL" -c "SELECT role, COUNT(*) FROM auth.users GROUP BY role;"

# List all students
psql "$DATABASE_URL" -c "SELECT first_name, last_name, enrollment_number FROM students.profiles LIMIT 10;"

# Check permissions
psql "$DATABASE_URL" -c "SELECT role, resource, action FROM auth.permissions ORDER BY role, resource;"
```

## 🧹 Maintenance

```bash
# Clean expired sessions
psql "$DATABASE_URL" -c "SELECT auth.clean_expired_sessions();"

# Vacuum database
psql "$DATABASE_URL" -c "VACUUM ANALYZE;"

# Check database size
psql "$DATABASE_URL" -c "SELECT pg_size_pretty(pg_database_size('neondb'));"

# Check table sizes
psql "$DATABASE_URL" -c "
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
"
```

## 💾 Backup & Restore

```bash
# Backup entire database
pg_dump "$DATABASE_URL" > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup specific schema
pg_dump "$DATABASE_URL" --schema=auth > backup_auth_$(date +%Y%m%d).sql

# Restore database
psql "$DATABASE_URL" < backup_20241202_120000.sql

# Restore specific schema
psql "$DATABASE_URL" -f backup_auth_20241202.sql
```

## 🔐 User Management

```bash
# Create test user
psql "$DATABASE_URL" -c "
INSERT INTO auth.users (email, encrypted_password, role, email_verified)
VALUES ('test@example.com', '\$2b\$12\$hashedpassword', 'ROLE_STUDENT', true);
"

# List all users
psql "$DATABASE_URL" -c "SELECT id, email, role, created_at FROM auth.users;"

# Delete user
psql "$DATABASE_URL" -c "DELETE FROM auth.users WHERE email = 'test@example.com';"
```

## 📈 Analytics

```bash
# Student statistics
psql "$DATABASE_URL" -c "
SELECT 
  department,
  COUNT(*) as total_students,
  AVG(cgpi) as avg_cgpi
FROM students.profiles
GROUP BY department
ORDER BY total_students DESC;
"

# Application statistics
psql "$DATABASE_URL" -c "
SELECT 
  status,
  COUNT(*) as count
FROM recruiters.job_applications
GROUP BY status;
"

# Login history
psql "$DATABASE_URL" -c "
SELECT 
  DATE(attempted_at) as date,
  COUNT(*) as total_attempts,
  SUM(CASE WHEN success THEN 1 ELSE 0 END) as successful,
  SUM(CASE WHEN NOT success THEN 1 ELSE 0 END) as failed
FROM auth.login_history
GROUP BY DATE(attempted_at)
ORDER BY date DESC
LIMIT 7;
"
```

## 🔧 Troubleshooting

```bash
# Check database version
psql "$DATABASE_URL" -c "SELECT version();"

# Check active connections
psql "$DATABASE_URL" -c "SELECT count(*) FROM pg_stat_activity;"

# Check for locks
psql "$DATABASE_URL" -c "
SELECT 
  pid,
  usename,
  application_name,
  state,
  query
FROM pg_stat_activity
WHERE state != 'idle';
"

# Kill a connection (if needed)
psql "$DATABASE_URL" -c "SELECT pg_terminate_backend(PID);"
```

## 🧪 Testing

```bash
# Test connection
psql "$DATABASE_URL" -c "SELECT 1;"

# Test schema exists
psql "$DATABASE_URL" -c "
SELECT schema_name 
FROM information_schema.schemata 
WHERE schema_name = 'auth';
"

# Test table exists
psql "$DATABASE_URL" -c "
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'auth' AND table_name = 'users';
"

# Test RLS policies
psql "$DATABASE_URL" -c "
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'auth';
"
```

## 📝 Common Patterns

### Insert Student Profile
```sql
INSERT INTO students.profiles (
  user_id, first_name, last_name, enrollment_number,
  department, degree, year_of_admission, current_semester,
  expected_graduation_year, mobile_number, personal_email,
  address_permanent
) VALUES (
  'user-uuid-here',
  'John', 'Doe', 'EN2024001',
  'CSE', 'B.Tech', 2024, 1,
  2028, '+919876543210', 'john@example.com',
  '123 Main St, City'
);
```

### Create Job Posting
```sql
INSERT INTO recruiters.job_postings (
  org_id, created_by, job_title, description,
  work_location, employment_type, application_deadline
) VALUES (
  'org-uuid-here',
  'poc-uuid-here',
  'Software Engineer',
  'Job description here',
  'Bangalore', 'Full-Time',
  '2024-12-31'
);
```

### Submit Application
```sql
INSERT INTO recruiters.job_applications (
  student_id, job_posting_id, resume_id, status
) VALUES (
  'student-uuid-here',
  'job-uuid-here',
  'resume-uuid-here',
  'SUBMITTED'
);
```

## 🎯 Performance Tips

1. **Use Indexes**: All foreign keys and frequently queried columns are indexed
2. **Connection Pooling**: Always use the pooler endpoint for applications
3. **Batch Operations**: Use transactions for multiple related operations
4. **Limit Results**: Always use LIMIT for large result sets
5. **Vacuum Regularly**: Run VACUUM ANALYZE periodically

## 🔗 Useful Links

- [NeonDB Console](https://console.neon.tech/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Prisma Documentation](https://www.prisma.io/docs/)

---

**Last Updated**: December 2024
