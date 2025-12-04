# 🧪 Job Posting Form - Testing Instructions

## Quick Test Data

To test the job posting form quickly, use these values:

### **Step 1: Job Details**
```
Job Title: Software Engineer
Description: We are looking for talented software engineers
Skills: Python, React, SQL (add these one by one)
Work Location: Bangalore
Employment Type: Full-Time
```

**Skip these (commented out for testing):**
- Responsibilities
- Qualifications

---

### **Step 2: Eligibility**
```
Degrees: ✓ B.Tech, ✓ M.Tech
Branches: ✓ CSE, ✓ IT
Minimum CGPA: 7.0
```

**Skip these (auto-filled):**
- Max Backlogs: 0 (default)
- Graduation Year: 2025 (default)

---

### **Step 3: Compensation**
```
Base Salary: 6.0
Click "Calculate Total CTC" button
Total CTC: 6.0 (auto-filled)
```

**Skip these (commented out for testing):**
- Variable Pay
- Joining Bonus
- Benefits

---

### **Step 4: Selection Process**
```
Rounds: Aptitude Test, Technical Interview (add these one by one)
Interview Mode: ○ Online
Timeline: 2 weeks from application to offer
```

---

### **Step 5: Terms & Deadline**
```
Application Deadline: (select any future date)
```

**Skip these (commented out for testing):**
- Bond Duration
- Bond Amount
- Bond Terms
- Notice Period

---

## Minimal Test Flow

**Total time: ~2 minutes**

1. **Step 1** (30 seconds):
   - Title: "Software Engineer"
   - Description: "Looking for engineers"
   - Add skill: "Python"
   - Location: "Bangalore"
   - Type: "Full-Time"
   - Click Next

2. **Step 2** (20 seconds):
   - Check: B.Tech
   - Check: CSE
   - CGPA: 7.0
   - Click Next

3. **Step 3** (15 seconds):
   - Base: 6.0
   - Click "Calculate Total CTC"
   - Click Next

4. **Step 4** (30 seconds):
   - Add round: "Aptitude Test"
   - Select: Online
   - Timeline: "2 weeks"
   - Click Next

5. **Step 5** (15 seconds):
   - Deadline: (tomorrow's date)
   - Click Submit

---

## Expected Result

```json
{
  "success": true,
  "message": "Job posting submitted for TPO Admin approval",
  "data": {
    "id": "uuid",
    "status": "PENDING_APPROVAL",
    "job_title": "Software Engineer"
  }
}
```

---

## Backend Verification

Check backend console for:
```
Job posting created: <uuid> by <POC name> for <Company name>
```

Check database:
```sql
SELECT id, job_title, status, created_at 
FROM recruiters.job_postings 
ORDER BY created_at DESC 
LIMIT 1;
```

Should show:
- status: 'PENDING_APPROVAL'
- job_title: 'Software Engineer'

---

## Fields Currently Active

**Required Fields (11 total):**
1. Job Title ✓
2. Job Description ✓
3. Required Skills ✓ (at least 1)
4. Work Location ✓
5. Employment Type ✓
6. Eligible Degrees ✓ (at least 1)
7. Allowed Branches ✓ (at least 1)
8. Minimum CGPA ✓
9. Base Salary ✓
10. Selection Rounds ✓ (at least 1)
11. Application Deadline ✓

**Optional Fields (auto-filled):**
- Max Backlogs: 0
- Graduation Year: current year
- Variable Pay: 0
- Joining Bonus: 0
- Benefits: 0
- Bond terms: all 0/empty

**Commented Out (for easier testing):**
- Responsibilities
- Qualifications
- Variable Pay input
- Joining Bonus input
- Benefits input
- Bond Duration input
- Bond Amount input
- Bond Terms input
- Notice Period input

---

## Quick Copy-Paste Values

```
Title: Software Engineer
Description: We are looking for talented software engineers to join our team
Skill: Python
Skill: React
Location: Bangalore
CGPA: 7.0
Base Salary: 6.0
Round: Aptitude Test
Round: Technical Interview
Timeline: 2 weeks from application to offer
```

---

## Troubleshooting

**If validation fails:**
- Make sure at least 1 skill is added
- Make sure at least 1 degree is checked
- Make sure at least 1 branch is checked
- Make sure at least 1 round is added
- Make sure deadline is a future date

**If submit fails:**
- Check browser console for errors
- Check backend console for errors
- Verify you're logged in as recruiter
- Verify organization is VERIFIED

---

## Restore Full Form

To restore all fields, uncomment the sections in:
`./frontend/src/components/recruiter/JobPostingForm.jsx`

Search for: `{/* COMMENTED FOR TESTING */}`

Remove the comment blocks to restore:
- Responsibilities field
- Qualifications field
- Variable Pay, Joining Bonus, Benefits fields
- Max Backlogs, Graduation Year fields
- All Bond terms fields

---

**Happy Testing!** 🚀
