# ✅ Active Tab Count Fix - COMPLETE!

## 🎯 Problem

The "Active" tab in TPO Admin Jobs shows count 0, even though there are active jobs.

---

## 🔍 Root Cause

The frontend was calling `/api/internal/admin/jobs/pending` which only returns jobs with status `PENDING_APPROVAL`.

**The issue:**
```javascript
// Frontend was fetching only pending jobs
fetch('http://localhost:5000/api/internal/admin/jobs/pending')

// Then trying to count active jobs from pending jobs array
active: data.data.filter(j => j.status === 'ACTIVE').length
// Result: 0 (because pending jobs array has no active jobs!)
```

---

## ✅ Solution

Created a new endpoint `/api/internal/admin/jobs/all` that returns ALL jobs (pending, active, rejected).

### **Backend Changes:**

**New Endpoint:**
```typescript
GET /api/internal/admin/jobs/all

Returns:
- All job postings (not deleted)
- Includes: PENDING_APPROVAL, ACTIVE, REJECTED
- Ordered by created_at (newest first)
```

**Code:**
```typescript
router.get('/all', authenticate, authorize('ROLE_TPO_ADMIN'), async (req, res) => {
  const jobPostings = await prisma.jobPosting.findMany({
    where: {
      deleted_at: null,  // Not deleted
    },
    include: {
      organization: { ... },
      poc: { ... },
    },
    orderBy: {
      created_at: 'desc',
    },
  });
  
  res.json({
    success: true,
    data: jobPostings,  // All jobs!
  });
});
```

### **Frontend Changes:**

**Updated fetch URL:**
```javascript
// Before:
fetch('http://localhost:5000/api/internal/admin/jobs/pending')

// After:
fetch('http://localhost:5000/api/internal/admin/jobs/all')
```

**Stats calculation (unchanged):**
```javascript
const stats = {
  total: data.data.length,
  pending: data.data.filter(j => j.status === 'PENDING_APPROVAL').length,
  active: data.data.filter(j => j.status === 'ACTIVE').length,
  rejected: data.data.filter(j => j.status === 'REJECTED').length,
};
```

Now it counts correctly because the array contains all jobs!

---

## 📊 Before vs After

### **Before:**
```
API: /jobs/pending
Returns: [
  { id: 1, status: 'PENDING_APPROVAL' },
  { id: 2, status: 'PENDING_APPROVAL' }
]

Stats:
- Total: 2
- Pending: 2
- Active: 0  ← Wrong! (no active jobs in pending array)
- Rejected: 0
```

### **After:**
```
API: /jobs/all
Returns: [
  { id: 1, status: 'PENDING_APPROVAL' },
  { id: 2, status: 'PENDING_APPROVAL' },
  { id: 3, status: 'ACTIVE' },
  { id: 4, status: 'ACTIVE' },
  { id: 5, status: 'REJECTED' }
]

Stats:
- Total: 5
- Pending: 2
- Active: 2  ← Correct!
- Rejected: 1
```

---

## 🧪 Testing

### **1. Restart Backend:**
```bash
cd backend
npm run dev
```

### **2. Refresh Frontend:**
```
Hard refresh: Ctrl + Shift + R
```

### **3. Check Jobs Tab:**
```
1. Login as TPO Admin
2. Go to Jobs tab
3. Check stats cards:
   - Total: Should show all jobs
   - Pending: Should show pending count
   - Active: Should show active count ✅
   - Rejected: Should show rejected count
```

### **4. Check Console:**
```
Frontend console:
Fetching all job postings...
Received 5 job postings
Calculated stats: { total: 5, pending: 2, active: 2, rejected: 1 }
```

### **5. Test Filters:**
```
Click "Active" tab → Should show 2 active jobs
Click "Pending" tab → Should show 2 pending jobs
Click "Rejected" tab → Should show 1 rejected job
Click "All" tab → Should show all 5 jobs
```

---

## 📝 Files Modified

**Backend:**
1. ✅ `backend/src/routes/tpo-admin-jobs.routes.ts`
   - Added new endpoint: `GET /api/internal/admin/jobs/all`
   - Returns all jobs (not just pending)

**Frontend:**
2. ✅ `frontend/src/components/dashboard/JobPostingsTab.jsx`
   - Changed fetch URL from `/pending` to `/all`
   - Stats now calculated from all jobs

---

## 🔌 API Endpoints

### **New Endpoint:**
```
GET /api/internal/admin/jobs/all
Auth: Bearer token (ROLE_TPO_ADMIN)

Response:
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "job_title": "Software Engineer",
      "status": "ACTIVE",
      "organization": { ... },
      "poc": { ... },
      ...
    },
    ...
  ]
}
```

### **Existing Endpoints (still work):**
```
GET /api/internal/admin/jobs/pending
- Returns only PENDING_APPROVAL jobs

GET /api/internal/admin/jobs/:id
- Returns specific job details

GET /api/internal/admin/jobs/:id/preview-eligibility
- Preview eligible students

PUT /api/internal/admin/jobs/:id/approve
- Approve job

PUT /api/internal/admin/jobs/:id/reject
- Reject job
```

---

## ✅ Verification

### **Check Stats Cards:**
```
Total: X (all jobs)
Pending: Y (pending jobs)
Active: Z (active jobs) ← Should be > 0 now!
Rejected: W (rejected jobs)
```

### **Check Database:**
```sql
SELECT 
  status,
  COUNT(*) as count
FROM recruiters.job_postings
WHERE deleted_at IS NULL
GROUP BY status;
```

**Should match frontend stats!**

---

## 🎯 Summary

**Problem:**
- Active tab showed count 0
- Frontend was only fetching pending jobs

**Solution:**
- Created `/api/internal/admin/jobs/all` endpoint
- Returns all jobs (pending, active, rejected)
- Frontend now fetches all jobs
- Stats calculated correctly

**Result:**
- ✅ Total count shows all jobs
- ✅ Pending count shows pending jobs
- ✅ Active count shows active jobs
- ✅ Rejected count shows rejected jobs
- ✅ Filters work correctly

**The active tab count now shows correctly!** 🎉
