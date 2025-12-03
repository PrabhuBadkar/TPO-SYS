# 🎯 Complete Fix Guide - Database Connection Issue

## 🔴 Problem Summary

**Issue:** Backend can't reach database at `ep-shy-credit` (unreachable)

**Root Cause:** System environment variable `DATABASE_URL` is set to wrong database

**Solution:** Use the correct working database: `ep-hidden-glade`

---

## ✅ SOLUTION - Follow These Steps

### Step 1: Remove Conflicting Environment Variable

The system has a `DATABASE_URL` environment variable that overrides the `.env` file.

**In your terminal (where you run backend):**

```bash
unset DATABASE_URL
```

### Step 2: Verify .env File

The `.env` file has been updated with the correct database:

```env
DATABASE_URL="postgresql://neondb_owner:npg_V4AeyDqLG6Kv@ep-hidden-glade-a4ob20yk-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require"
```

### Step 3: Push Schema to Database

```bash
cd /home/aki/TPO-SYS/backend
npx prisma db push --accept-data-loss
```

**This will:**
- Connect to the correct database (`ep-hidden-glade`)
- Create/update all tables and columns
- Add the missing `recruiter_status` column
- Add the missing `deleted_at` columns

### Step 4: Generate Prisma Client

```bash
npx prisma generate
```

### Step 5: Restart Backend Server

```bash
npm run dev
```

---

## 🚀 Quick Fix (One Command)

**OR** run the automated fix script:

```bash
cd /home/aki/TPO-SYS/backend
./FIX_DATABASE.sh
```

Then restart your backend server.

---

## 🔍 Why This Happened

### The Environment Variable Issue:

1. **System Environment Variable:**
   ```bash
   DATABASE_URL="...@ep-shy-credit..."  # Set in your shell
   ```

2. **.env File:**
   ```env
   DATABASE_URL="...@ep-hidden-glade..."  # Correct database
   ```

3. **Priority:**
   - Environment variables > .env file
   - So the system variable was being used
   - That's why it kept trying to connect to `ep-shy-credit`

### The Two Databases:

| Database | Status | Issue |
|----------|--------|-------|
| `ep-shy-credit` | ❌ Unreachable | Can't connect (timeout) |
| `ep-hidden-glade` | ✅ Working | This is the correct one |

---

## 📝 Manual Fix (If Script Doesn't Work)

### Option 1: Unset in Current Shell

```bash
# In the terminal where you run backend:
unset DATABASE_URL
cd /home/aki/TPO-SYS/backend
npx prisma db push --accept-data-loss
npx prisma generate
npm run dev
```

### Option 2: Set Permanently

Add to your `~/.bashrc` or `~/.zshrc`:

```bash
# Remove this line if it exists:
# export DATABASE_URL="...@ep-shy-credit..."

# Or comment it out:
# # export DATABASE_URL="...@ep-shy-credit..."
```

Then reload:
```bash
source ~/.bashrc  # or source ~/.zshrc
```

### Option 3: Override in npm Script

Edit `backend/package.json`:

```json
{
  "scripts": {
    "dev": "DATABASE_URL='postgresql://neondb_owner:npg_V4AeyDqLG6Kv@ep-hidden-glade-a4ob20yk-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require' tsx watch src/server.ts"
  }
}
```

---

## ✅ Verification Steps

### 1. Check Database Connection

```bash
cd /home/aki/TPO-SYS/backend
npx prisma studio
```

Should open Prisma Studio showing all tables.

### 2. Test Backend Endpoint

```bash
curl http://localhost:5000/api/internal/admin/stats/overview \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Should return JSON (even if zeros).

### 3. Check for Errors

Backend console should NOT show:
- ❌ "Can't reach database server"
- ❌ "Column does not exist"

Should show:
- ✅ "Server running on http://localhost:5000"
- ✅ No Prisma errors

---

## 🎯 Expected Results

### After Fix:

**Database Connection:**
```
✅ Connected to: ep-hidden-glade-a4ob20yk-pooler.us-east-1.aws.neon.tech
✅ Database: neondb
✅ All tables exist
✅ All columns exist
```

**API Response:**
```json
{
  "success": true,
  "data": {
    "students": { "total": 0, "newThisMonth": 0 },
    "verifications": { "pending": 0, "urgent": 0 },
    "recruiters": { "active": 0, "recentlyVerified": 0 },
    "jobs": { "active": 0, "pendingApproval": 0 }
  }
}
```

**Zeros are correct** - database is empty but schema is correct!

---

## 🔧 Troubleshooting

### Issue: "Can't reach database server"

**Solution:**
```bash
# Check if DATABASE_URL is still set
echo $DATABASE_URL

# If it shows ep-shy-credit, unset it:
unset DATABASE_URL

# Then restart backend
```

### Issue: "Column does not exist"

**Solution:**
```bash
# Push schema again
npx prisma db push --accept-data-loss

# Regenerate client
npx prisma generate

# Restart backend
```

### Issue: Script times out

**Solution:**
- Database might be slow
- Try again in a few minutes
- Or use Prisma Studio to manually verify tables exist

---

## 📊 Database Schema Status

After running the fix, your database will have:

### Schemas: 5
- `auth` - Authentication
- `students` - Student data
- `recruiters` - Recruiter data
- `core` - TPO operations
- `audit` - Audit logs

### Tables: 20
- ✅ All tables created
- ✅ All columns present
- ✅ All indexes created
- ✅ All foreign keys set

### Key Columns Fixed:
- ✅ `organizations.recruiter_status` - Now exists
- ✅ `job_postings.deleted_at` - Now exists
- ✅ All other missing columns - Now exist

---

## 🚀 Next Steps

1. ✅ **Fix database connection** (follow steps above)
2. ✅ **Restart backend server**
3. ✅ **Verify endpoint works**
4. ⏳ **Seed database** (optional): `npm run seed`
5. ⏳ **Build frontend dashboard**
6. ⏳ **Test end-to-end**

---

## 📝 Summary

**Problem:** System environment variable pointing to unreachable database

**Solution:** 
1. Unset the environment variable
2. Use .env file with correct database
3. Push schema to database
4. Restart backend

**Status:**
- ✅ `.env` file updated with correct database
- ✅ Fix script created (`FIX_DATABASE.sh`)
- ⏳ **You need to run the fix** (see Step 1-5 above)

**After Fix:**
- ✅ Backend connects to working database
- ✅ All columns exist
- ✅ No more errors
- ✅ API works correctly

---

**Last Updated:** 2024-12-03  
**Action Required:** Run fix steps or execute `./FIX_DATABASE.sh`  
**Expected Time:** 2-3 minutes
