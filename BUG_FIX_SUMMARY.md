# HostelOS Bug Fix Summary

## Files to Replace in Your Project

Copy each file from this output to the corresponding path in your project:

| Output File | Replace In Project |
|---|---|
| `src/lib/AuthContext.tsx` | `src/lib/AuthContext.tsx` |
| `src/lib/api-client.ts` | `src/lib/api-client.ts` |
| `src/components/AddStudentModal.tsx` | `src/components/AddStudentModal.tsx` |
| `src/components/EdgeFunctionStatus.tsx` | `src/components/EdgeFunctionStatus.tsx` |
| `src/pages/Fees.tsx` | `src/pages/Fees.tsx` |
| `src/pages/student/StudentDashboard.tsx` | `src/pages/student/StudentDashboard.tsx` |
| `src/pages/student/StudentFees.tsx` | `src/pages/student/StudentFees.tsx` |
| `src/pages/student/StudentComplaints.tsx` | `src/pages/student/StudentComplaints.tsx` |
| `src/pages/student/StudentFoodMenu.tsx` | `src/pages/student/StudentFoodMenu.tsx` |
| `src/super-admin/pages/SuperAdminDashboard.tsx` | `src/super-admin/pages/SuperAdminDashboard.tsx` |
| `src/super-admin/pages/SuperAdminHostels.tsx` | `src/super-admin/pages/SuperAdminHostels.tsx` |
| `src/super-admin/pages/SuperAdminSubscriptions.tsx` | `src/super-admin/pages/SuperAdminSubscriptions.tsx` |
| `src/super-admin/pages/SuperAdminTickets.tsx` | `src/super-admin/pages/SuperAdminTickets.tsx` |

---

## Bugs Fixed

### 🔴 Critical: Undefined `supabase` references
These files called `supabase.from(...)` but Supabase was completely removed from the project:
- `StudentDashboard.tsx` — all data fetching via supabase
- `StudentFees.tsx` — fee query via supabase  
- `StudentComplaints.tsx` — complaints + realtime subscription via supabase
- `StudentFoodMenu.tsx` — food_menus query via supabase
- `SuperAdminHostels.tsx` — hostel list via supabase
- `SuperAdminSubscriptions.tsx` — hostel list via supabase
- `SuperAdminTickets.tsx` — platform_tickets via supabase
- **Fix:** All replaced with REST API calls (`api-client.ts` functions)

### 🔴 Critical: `fees` undefined in Fees.tsx
`Fees.tsx` declared `feesData` from React Query but then referenced `fees` (old state variable) in the tab count badge, causing a runtime crash.
- **Fix:** Changed all `fees.filter(...)` references to `feesData.filter(...)`

### 🔴 Critical: `sendPhoneOTP` / `verifyPhoneOTP` called but never defined
`AddStudentModal.tsx` called `sendPhoneOTP('phone')` and `verifyPhoneOTP('phone')` in the OTP step but these functions didn't exist anywhere.
- **Fix:** Simplified Step 2 to show an informational "verification bypassed" notice

### 🔴 Critical: `AuthContext.studentData` always `null`
Student pages like `StudentProfile`, `StudentFoodMenu`, `StudentDashboard` all depend on `useAuth().studentData` being populated, but it was hardcoded to `null`.
- **Fix:** `AuthContext` now fetches the student record from the REST API when `role === 'student'` and maps room/bed nested data

### 🟡 Important: `apiStudents.getAll('')` in SuperAdminDashboard
Called with empty string hostelId, causing a broken API request.
- **Fix:** Guard added in `api-client.ts` to return `[]` if hostelId is empty; SuperAdminDashboard now derives student count from the hostel list's `student_count` field

### 🟡 Important: `EdgeFunctionStatus` checked Supabase edge function URL
Still pointed to `VITE_SUPABASE_URL/functions/v1/admin-operations` which doesn't exist.
- **Fix:** Now checks `VITE_API_URL/health` (Express backend health endpoint)

### 🟡 Important: `SuperAdminTickets` used `platform_tickets` supabase table
Table doesn't exist in the MySQL schema.
- **Fix:** Shows a helpful placeholder with the SQL to add the table

### 🟡 Minor: Food menu key mismatch
`FoodMenuEditor` saves with capitalized keys (`Breakfast`, `Lunch`) but `StudentFoodMenu` looked for lowercase. 
- **Fix:** `StudentFoodMenu` now tries both capitalized and lowercase keys

---

## Backend: Verify These Endpoints Exist

The fixes assume your Express backend has these routes (all in `schema.sql`/controllers):

```
GET  /api/health                          ← health check
GET  /api/fees/student/:studentId         ← student fee history  
GET  /api/complaints?hostel_id=X          ← complaints list
POST /api/complaints                      ← submit complaint
GET  /api/announcements?hostel_id=X       ← announcements
GET  /api/food-menu?hostel_id=X           ← food menu
GET  /api/attendance?hostel_id=X&date=Y   ← attendance
```

All of these are already in `backend/routes/miscRoutes.js` ✅
