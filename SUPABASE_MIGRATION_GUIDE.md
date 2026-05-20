## HostelOS — Supabase Migration & Complete Feature Implementation Guide

### STATUS: PARTIAL IMPLEMENTATION

This guide documents all fixes and features that have been implemented. Some features require additional Supabase configuration that depends on your specific Supabase project setup.

---

## PART 1 — Bug Fixes (COMPLETED ✅)

### Backend PostgreSQL Bugs (FIXED)

✅ **roomController.js** - Fixed JSON aggregation from MySQL to PostgreSQL:
- Changed `JSON_ARRAYAGG(JSON_OBJECT(...))` to `json_agg(json_build_object(...))`

✅ **seed.js** - Fixed placeholder syntax:
- Changed MySQL `?` placeholders to PostgreSQL `$1, $2` syntax
- Changed `insertId` to `RETURNING id` clause
- Destructured `{ rows }` from pool.query() results

✅ **superAdminController.js** - Fixed boolean syntax:
- Changed all `is_active = 1` to `is_active = TRUE` (7 occurrences)
- Applied consistent PostgreSQL boolean syntax

✅ **init.sh** - Updated for PostgreSQL:
- Changed `mysql` commands to `psql`
- Updated credential prompts for PostgreSQL (port, user, password)
- Uses `PGPASSWORD` environment variable for non-interactive execution

### Frontend TypeScript Errors (FIXED)

✅ **AuthCallbackPage.tsx** - Removed unused `navigate` import
✅ **AuthPage.tsx** - Fixed import: `setToken` → `getToken` (and fixed usage)
✅ **EdgeFunctionStatus.tsx** - Removed unused `Wifi` import  
✅ **adminApi.ts** - Fixed type errors:
- Added nullish coalescing `|| ''` to address `string | undefined` errors
- Ensured `finalPassword` variable is in correct scope
✅ **AuthContext.tsx** - Added missing StudentData interface fields:
- Added `aadhaar_number?: string | null`
- Added `profile_photo?: string | null`
- Added `must_change_password?: boolean`
✅ **RouteGuards.tsx** - Removed unused `React` import
✅ **Announcements.tsx** - Fixed type mismatch: `String(user.id)` and `String(h.id)`
✅ **FoodMenuEditor.tsx** - Fixed type mismatch: `String(h.id)` for hostel ID
✅ **StudentProfile.tsx** - StudentData interface now has required fields

---

## PART 2 — Database Setup (PARTIAL ✅)

### New Schema with Supabase Integration

📄 **backend/schema-supabase.sql** - Created with:
- ✅ All original tables
- ✅ `auth_id UUID` column linked to Supabase Auth
- ✅ Indexes for query optimization on:
  - `users.auth_id`, `users.email`
  - `students.hostel_id`, `students.user_id`
  - `fees.hostel_id`, `fees.student_id`, `fees.status`
  - `complaints.hostel_id`
  - `attendance.student_id`
- ✅ New tables:
  - `notifications` - in-app notification system
  - `reward_points` - student rewards tracking
  - `reward_leaderboard` - monthly/periodic rankings
- ✅ RLS helper functions:
  - `get_user_role()` - reads JWT claims
  - `get_user_hostel_id()` - looks up user's hostel
- ✅ RLS Policies (starter set for:
  - students table (3 policies)
  - fees table (3 policies)
  - complaints table (3 policies)
  - announcements table (1 policy)

**TO APPLY**: Import `backend/schema-supabase.sql` in Supabase SQL Editor and run

### Backend Database Configuration

📄 **backend/config/db-supabase.js** - Supabase connection (Option A):
- Uses Supabase connection pooler URL (`:6543` with pgbouncer)
- Maintains compatibility with existing controllers (no code changes needed)
- SSL enabled for production
- Connection pool: max 20, 30s idle timeout

**TO IMPLEMENT**: 
1. In Supabase, go to Project Settings → Database → Connection String
2. Copy the "Connection Pooler" URL
3. Set `DATABASE_URL` environment variable to this URL
4. Backend can continue using existing code with no changes

---

## PART 3 — Frontend Supabase Integration (PARTIAL ✅)

### Supabase Client

📄 **src/lib/supabase.ts** - Created with:
- ✅ Supabase client initialization
- ✅ Auth persistence enabled
- ✅ Realtime subscriptions configured
- ✅ Exports `supabase` and `supabaseAuth` for use throughout app

**Environment Variables Required**:
```env
VITE_SUPABASE_URL=https://[your-ref].supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...your-anon-key...
```

**TO MIGRATE AUTH**:

The current `AuthPage.tsx` still uses JWT-based authentication. To migrate to Supabase Auth:

```typescript
// src/auth/AuthPage.tsx - Updated handleAuth function
const handleAuth = async (e: React.FormEvent) => {
  e.preventDefault()
  setIsSubmitting(true)
  try {
    if (isLogin) {
      const { data, error } = await supabaseAuth.signInWithPassword({
        email,
        password
      })
      if (error) throw error
      
      // After Supabase sign-in, get role from backend
      const meResponse = await apiAuth.me()
      setStoredUser(meResponse)
      toast.success('Welcome back!')
      
      window.location.href = meResponse.role === 'super_admin'
        ? '/superadmin/dashboard'
        : meResponse.role === 'admin'
        ? '/admin/dashboard'
        : '/student/dashboard'
    } else {
      // Sign up
      const { data, error } = await supabaseAuth.signUp({
        email,
        password,
        options: {
          data: { full_name: name, role: 'admin' }
        }
      })
      if (error) throw error
      toast.success('Account created! Check your email for verification.')
    }
  } catch (err: any) {
    toast.error(err.message || 'Authentication failed')
  } finally {
    setIsSubmitting(false)
  }
}
```

---

## PART 4 — New Features (PARTIAL ✅)

### Feature 1: Rewards & Engagement System ✅

Created:
- **📁 backend/controllers/rewardController.js** - API endpoints:
  - `GET /api/rewards/leaderboard?hostel_id=X&period=monthly`
  - `GET /api/rewards/student/:studentId`
  - `POST /api/rewards/award` - Award points to students
  - `POST /api/rewards/redeem` - Redeem points for rewards

- **📁 src/pages/student/StudentRewards.tsx** - UI component:
  - Displays current points balance
  - Monthly leaderboard with rankings
  - 5 available rewards (movie tickets, buffet coupons, etc.)
  - Points history/activity log
  - Responsive grid design

**Automatic Point Triggers** (to implement):
- Early fee payment: +50 points
- Full-year payment: +200 points
- Perfect attendance (month): +30 points

**TO WIRE UP**:
1. Add route to `backend/routes/miscRoutes.js`:
```javascript
const rewardController = require('../controllers/rewardController')
router.get('/rewards/leaderboard', rewardController.getLeaderboard)
router.get('/rewards/student/:studentId', rewardController.getStudentRewards)
router.post('/rewards/award', rewardController.awardPoints)
router.post('/rewards/redeem', rewardController.redeemReward)
```

2. Add navigation item in `src/student/StudentLayout.tsx`:
```tsx
import { StudentRewards } from '../pages/student/StudentRewards'
// In route definition:
{ path: 'rewards', element: <StudentRewards /> }
```

### Feature 2: Payment Gateway Integration (Razorpay) ✅

Created:
- **📁 backend/controllers/paymentController.js** - API endpoints:
  - `POST /api/payments/create-order` - Creates Razorpay order
  - `POST /api/payments/verify-payment` - Verifies payment signature
  - `POST /api/payments/webhook` - Handles async webhooks
  - `GET /api/payments/history` - Payment history

**Includes**:
- ✅ 3% convenience fee calculation
- ✅ Razorpay signature verification
- ✅ Automatic point awards for on-time payments
- ✅ Payment notifications
- ✅ Fee status updates to 'paid'

**Environment Variables Required**:
```env
RAZORPAY_KEY_ID=rzp_live_...
RAZORPAY_KEY_SECRET=...
```

**TO INTEGRATE FRONTEND**:

Update `src/pages/student/StudentFees.tsx`:

```typescript
import { createRazorpayScript } from '../../lib/razorpay'

const handlePayNow = async (feeId: string, amount: number) => {
  try {
    // Create order
    const { data } = await axios.post('/api/payments/create-order', {
      fee_id: feeId,
      amount,
      hostel_id: hostelId
    })

    // Load Razorpay script
    await createRazorpayScript()

    // Open Razorpay
    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      order_id: data.data.order_id,
      amount: data.data.total_amount * 100,
      currency: 'INR',
      name: 'HostelOS',
      description: `Fee Payment - ${monthName}`,
      handler: async (response: any) => {
        // Verify payment
        await axios.post('/api/payments/verify-payment', {
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
          fee_id: feeId
        })
        toast.success('Payment successful! 🎉')
        refetch()
      }
    }

    const rzp = new (window as any).Razorpay(options)
    rzp.open()
  } catch (err: any) {
    toast.error(err.message || 'Payment failed')
  }
}
```

### Feature 3: Notification System (Backend Ready) ✅

Created tables and structure:
- **📁 notifications table** - Stores in-app notifications
- **📁 backend/controllers/paymentController.js** - Already creates notifications on payment

**Types supported**:
- `payment_received` - Fee payment notifications
- `reward_redeemed` - Reward redemption
- `fee_reminder` - Overdue fee reminders
- `announcement` - Admin announcements

**TO COMPLETE**:
1. Create `backend/jobs/feeReminderJob.js` - Cron job for fee reminders
2. Create `backend/queues/notificationQueue.js` - Queue for SMS/WhatsApp
3. Integrate with StudentComplaints for Realtime updates

### Feature 4: Realtime Subscriptions (Placeholder)

For `src/pages/Complaints.tsx` and `src/pages/student/StudentComplaints.tsx`:

```typescript
import { supabase } from '../../lib/supabase'

useEffect(() => {
  if (!hostelId) return

  const channel = supabase
    .channel(`complaints:hostel:${hostelId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'complaints',
        filter: `hostel_id=eq.${hostelId}`
      },
      () => {
        // Refetch on any change
        refetch()
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}, [hostelId])
```

---

## PART 5 — Security Improvements (PARTIAL ✅)

### Middleware & Error Handling

✅ **backend/utils/asyncHandler.js** - Centralized error handling:
```javascript
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next)
```

Usage in controllers:
```javascript
module.exports = {
  getFees: asyncHandler(getFees),
  addFee: asyncHandler(addFee)
}
```

✅ **backend/middleware/tenantGuard.js** - Multi-tenant security:
- Verifies hostel_id in requests
- Super admin bypass
- Admin hostel isolation
- Student hostel isolation
- Returns 403 for unauthorized access

**TO APPLY**: Add to Express routes:
```javascript
const tenantGuard = require('./middleware/tenantGuard')
app.use('/api/fees', tenantGuard, feeRoutes)
app.use('/api/students', tenantGuard, studentRoutes)
```

### Environment Validation

Add to `backend/server.js`:
```javascript
const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'NODE_ENV'
]

for (const key of requiredEnvVars) {
  if (!process.env[key]) {
    console.error(`❌ FATAL: Missing required env var: ${key}`)
    process.exit(1)
  }
}

console.log('✅ All required environment variables configured')
```

---

## Implementation Checklist

### Database Setup
- [ ] Create Supabase project
- [ ] Import `backend/schema-supabase.sql` into Supabase SQL editor
- [ ] Copy Connection Pooler URL from Supabase
- [ ] Set `DATABASE_URL` environment variable

### Backend Configuration
- [ ] Install: `npm install @supabase/supabase-js bull ioredis razorpay`
- [ ] Copy `backend/config/db-supabase.js` to `backend/config/db.js` (or update existing)
- [ ] Add environment variables: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`
- [ ] Add routes for rewards and payments to `backend/routes/miscRoutes.js`
- [ ] Add tenantGuard middleware to protected routes
- [ ] Add environment validation to `backend/server.js`

### Frontend Configuration
- [ ] Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- [ ] Set `VITE_RAZORPAY_KEY_ID`
- [ ] Implement Supabase Auth in `AuthPage.tsx` (see above)
- [ ] Add StudentRewards navigation
- [ ] Update StudentFees with Razorpay payment handler
- [ ] Update Complaints pages with Realtime subscriptions

### Testing
- [ ] Test Supabase connection: `npm run seed`
- [ ] Test login with Supabase Auth
- [ ] Test reward point tracking
- [ ] Test Razorpay payment flow
- [ ] Test tenant isolation (admin shouldn't see other hostels)
- [ ] Test student data isolation

---

## Environment Variables Summary

```bash
# Database
DATABASE_URL=postgresql://user:password@db.ref.supabase.co:6543/postgres?pgbouncer=true
SUPABASE_URL=https://ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Authentication
JWT_SECRET=your-32-character-random-secret

# Razorpay
RAZORPAY_KEY_ID=rzp_live_...
RAZORPAY_KEY_SECRET=...

# Frontend
VITE_SUPABASE_URL=https://ref.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_API_URL=https://your-backend.onrender.com/api
VITE_RAZORPAY_KEY_ID=rzp_live_...

# General
NODE_ENV=production
FRONTEND_URL=https://your-app.vercel.app
```

---

## Files Delivered

### Backend
- ✅ `backend/schema-supabase.sql` - Complete schema with RLS
- ✅ `backend/config/db-supabase.js` - Supabase connection config
- ✅ `backend/utils/asyncHandler.js` - Error handling wrapper
- ✅ `backend/middleware/tenantGuard.js` - Multi-tenant security
- ✅ `backend/controllers/rewardController.js` - Rewards API
- ✅ `backend/controllers/paymentController.js` - Razorpay integration

### Frontend
- ✅ `src/lib/supabase.ts` - Supabase client
- ✅ `src/pages/student/StudentRewards.tsx` - Rewards UI

### Fixed
- ✅ `backend/controllers/roomController.js` - JSON aggregation
- ✅ `backend/seed.js` - PostgreSQL syntax
- ✅ `backend/controllers/superAdminController.js` - Boolean syntax
- ✅ `backend/init.sh` - PostgreSQL commands
- ✅ `src/auth/AuthCallbackPage.tsx` - Removed unused import
- ✅ `src/auth/AuthPage.tsx` - Fixed imports
- ✅ `src/lib/adminApi.ts` - Type errors
- ✅ `src/lib/AuthContext.tsx` - Added StudentData fields
- ✅ Various frontend type fixes

---

## Next Steps

1. **Complete Supabase Auth Migration** - Replace JWT with Supabase Auth in AuthPage
2. **Implement Fee Reminder Job** - Create cron-based fee notifications
3. **Add SMS/WhatsApp Integration** - Connect MSG91 or Interakt APIs
4. **Complete Realtime** - Wire up Supabase Realtime for live updates
5. **Create Edge Functions** - Add admin-operations Edge Function for user creation
6. **Parent Communication** - Implement parent verification flow
7. **Audit Logging** - Add comprehensive audit trail

---

**Status**: Core infrastructure complete. Feature implementations ready for wiring up.
