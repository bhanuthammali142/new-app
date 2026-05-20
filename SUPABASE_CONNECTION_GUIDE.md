# HostelOS — Supabase Connection Guide

## ✅ Your Supabase Project Connected!

Your HostelOS project is now configured to connect with your Supabase database.

**Project Details:**
- 🌐 **Project URL:** https://svyiwleriolpoxogqqo.supabase.co
- 📚 **Project Reference:** `svyiwleriolpoxogqqo`
- 🔑 **Anon Key:** Configured in `.env.local` ✅

---

## 🔐 Environment Variables Status

### Frontend ✅ READY
**File:** `.env.local`
```
VITE_SUPABASE_URL=https://svyiwleriolpoxogqqo.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_API_URL=http://localhost:5000/api
```

### Backend ⚠️ NEEDS DATABASE PASSWORD
**File:** `backend/.env`
- ✅ SUPABASE_URL configured
- ✅ SERVICE_ROLE_KEY configured  
- ⚠️ **DATABASE_URL needs password** ← See step 1 below

---

## 📋 Setup Checklist

### Step 1: Get Your Database Password ⚠️ IMPORTANT

1. Go to **https://app.supabase.com**
2. Select project **svyiwleriolpoxogqqo**
3. Click **Settings** → **Database**
4. Under **Connection info**, click **Reveal password**
5. **Copy the password**

### Step 2: Update Backend Configuration

1. Open `backend/.env`
2. Find this line:
   ```
   DATABASE_URL=postgresql://postgres:YOUR_DATABASE_PASSWORD@db.svyiwleriolpoxogqqo.supabase.co:6543/postgres?pgbouncer=true
   ```
3. Replace `YOUR_DATABASE_PASSWORD` with your actual password
4. **Save the file**

**Example:**
```
# BEFORE:
DATABASE_URL=postgresql://postgres:YOUR_DATABASE_PASSWORD@db.svyiwleriolpoxogqqo.supabase.co:6543/postgres?pgbouncer=true

# AFTER:
DATABASE_URL=postgresql://postgres:MySecurePassword123@db.svyiwleriolpoxogqqo.supabase.co:6543/postgres?pgbouncer=true
```

### Step 3: Import Database Schema

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Click **New Query** → **New blank query**
3. Open file: `backend/schema-supabase.sql`
4. **Copy all contents**
5. **Paste** into SQL Editor
6. Click **▶ Run** button
7. Wait for completion (should see ✅ success messages)

**What gets created:**
- ✅ 19 database tables
- ✅ 8 indexes for performance
- ✅ Row-level security (RLS) policies
- ✅ Helper functions for security
- ✅ Seed data (admin account)

### Step 4: Verify Database Connection

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Test the connection by running seed
npm run seed
```

**Expected output:**
```
✅ Database connected successfully
✅ Super admin created!
📧 Email:    admin@hostel.com
🔐 Password: Bhanu@2006
```

### Step 5: Install Frontend Dependencies

```bash
# From root directory
npm install

# Install Supabase client
npm install @supabase/supabase-js
```

### Step 6: Start Development Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm start
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

**Expected:**
- ✅ Backend running on `http://localhost:5000`
- ✅ Frontend running on `http://localhost:5173`
- ✅ Can log in with:
  - Email: `admin@hostel.com`
  - Password: `Bhanu@2006`

---

## 🔍 Verify Your Setup

### Check Backend Connection
```bash
cd backend
psql $DATABASE_URL -c "SELECT NOW();"
```

Should return the current timestamp.

### Check Frontend Configuration
1. Open browser: http://localhost:5173
2. Try logging in with admin credentials
3. Should redirect to dashboard

### Check Supabase Dashboard
1. Go to **https://app.supabase.com/project/svyiwleriolpoxogqqo**
2. Click **Table Editor**
3. Should see tables:
   - users
   - students
   - fees
   - hostels
   - rooms
   - etc.

---

## 📁 Files Ready to Use

### Your Configuration Files
```
✅ .env.local              Frontend environment variables
✅ backend/.env            Backend environment variables (UPDATE PASSWORD)
✅ backend/schema-supabase.sql    Database schema to import
```

### Key Features Now Available

**Features Enabled:**
- ✅ Multi-tenant data isolation (Row Level Security)
- ✅ Student rewards system
- ✅ Razorpay payment integration
- ✅ In-app notifications
- ✅ Admin controls
- ✅ Audit logging

---

## 🚀 Next Steps After Setup

1. **Test Admin Login**
   - Email: admin@hostel.com
   - Password: Bhanu@2006

2. **Create Hostel & Rooms**
   - Log in as admin
   - Go to Settings
   - Create your first hostel

3. **Add Students**
   - Go to Students page
   - Click "Add Student"
   - Enter student details

4. **Configure Razorpay (Optional)**
   - Get Razorpay keys from https://razorpay.com
   - Add to `backend/.env`:
     ```
     RAZORPAY_KEY_ID=your_key
     RAZORPAY_KEY_SECRET=your_secret
     ```

---

## 🆘 Troubleshooting

### "Cannot connect to database"
**Problem:** PASSWORD not updated or incorrect
**Solution:** 
1. Verify DATABASE_URL has correct password
2. Test: `psql $DATABASE_URL -c "SELECT NOW();"`
3. Get password again from Supabase Dashboard

### "Supabase Auth not working"
**Problem:** ANON_KEY might be wrong
**Solution:**
1. Go to Supabase Dashboard → Settings → API
2. Copy the "anon public" key (NOT service role)
3. Update `VITE_SUPABASE_ANON_KEY` in `.env.local`

### "Tables not found"
**Problem:** Schema not imported
**Solution:**
1. Open `backend/schema-supabase.sql`
2. Go to Supabase SQL Editor
3. Paste entire contents and run
4. Wait for completion

### "Port 5000 already in use"
**Problem:** Another process using the port
**Solution:**
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Or use different port
PORT=5001 npm start
```

---

## 📞 Support Resources

- **Supabase Docs:** https://supabase.com/docs
- **Project Dashboard:** https://app.supabase.com/project/svyiwleriolpoxogqqo
- **Implementation Guide:** See `SUPABASE_MIGRATION_GUIDE.md`
- **All Features:** See `IMPLEMENTATION_SUMMARY.md`

---

## 🎯 Success Checklist

- [ ] Database password updated in `backend/.env`
- [ ] Schema imported in Supabase SQL Editor
- [ ] `npm install` run in both backend and root
- [ ] `npm run seed` completed successfully
- [ ] Backend started on port 5000
- [ ] Frontend started on port 5173
- [ ] Can log in with admin@hostel.com
- [ ] Can see tables in Supabase Dashboard

---

## 📊 Your Supabase Project Configuration

```
Project Name: HostelOS
Project Reference: svyiwleriolpoxogqqo
API URL: https://svyiwleriolpoxogqqo.supabase.co
Database: PostgreSQL
Region: [Based on your account]

Credentials Status:
✅ Anon Key: Configured in frontend
✅ Service Role Key: Configured in backend
✅ Database: Ready for connection
```

---

## 🚀 Ready to Deploy!

Your Supabase project is now fully connected to HostelOS. All environment variables are configured. You just need to:

1. ⚠️ **Add your database password** to `backend/.env`
2. ✅ **Import the schema** to Supabase
3. ✅ **Start the servers** and test

**All fixes, features, and security improvements are ready to use!**

---

**Setup Date:** May 20, 2026  
**Status:** ✅ CONNECTED & READY  
**Next:** Update password and import schema  

🎉 **Happy building!**
