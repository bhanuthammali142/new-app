# HostelOS Environment Variables Configuration

## Backend (.env)

```env
# ============================================
# DATABASE CONFIGURATION
# ============================================

# PostgreSQL/Supabase connection string
# For Supabase: Use "Connection Pooler" URL ending in :6543
# Format: postgresql://user:password@host:port/database?pgbouncer=true
DATABASE_URL=postgresql://postgres:[password]@db.[ref].supabase.co:6543/postgres?pgbouncer=true

# Supabase API (optional, for future admin operations)
SUPABASE_URL=https://[ref].supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# ============================================
# AUTHENTICATION
# ============================================

# JWT Secret for token signing (generate with: openssl rand -base64 32)
JWT_SECRET=your-32-character-random-secret-here

# ============================================
# PAYMENT GATEWAY (Razorpay)
# ============================================

# Get these from https://dashboard.razorpay.com/app/keys
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxx

# ============================================
# SERVER CONFIGURATION
# ============================================

# Server port
PORT=5000

# Environment (development, production, staging)
NODE_ENV=production

# Frontend URL for CORS and redirects
FRONTEND_URL=https://your-app.vercel.app

# ============================================
# OPTIONAL: NOTIFICATION INTEGRATIONS
# ============================================

# MSG91 API (for SMS notifications)
MSG91_AUTH_KEY=

# Interakt API (for WhatsApp notifications)
INTERAKT_API_KEY=

# Redis (for queues - optional if using AWS SQS instead)
REDIS_URL=redis://localhost:6379

# ============================================
# OPTIONAL: AWS S3 (for file uploads)
# ============================================

AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=ap-south-1
AWS_S3_BUCKET=hostelos-uploads
```

## Frontend (.env.local)

```env
# ============================================
# SUPABASE CONFIGURATION
# ============================================

# From Supabase Project Settings → API
# This is the public/anon key (safe to expose in frontend)
VITE_SUPABASE_URL=https://[your-ref].supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...

# ============================================
# BACKEND API
# ============================================

# Backend API URL (for axios/fetch calls)
VITE_API_URL=https://your-backend.onrender.com/api

# For local development:
# VITE_API_URL=http://localhost:5000/api

# ============================================
# PAYMENT GATEWAY (Razorpay)
# ============================================

# Get from https://dashboard.razorpay.com/app/keys (public key)
VITE_RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxx

# ============================================
# DEVELOPMENT
# ============================================

# Debug mode (true/false)
VITE_DEBUG=false
```

---

## 🔑 How to Get Each Variable

### DATABASE_URL (Supabase)

1. Go to https://app.supabase.com
2. Select your project
3. Click "Settings" → "Database"
4. Find "Connection Pooler" section
5. Copy the connection string under "Connection string"
6. Format: `postgresql://postgres:[password]@db.[ref].supabase.co:6543/postgres?pgbouncer=true`

**Note**: Use the "Connection Pooler" (`:6543`), NOT the direct connection (`:5432`)

### SUPABASE_URL & SUPABASE_SERVICE_ROLE_KEY

1. Go to Supabase Project Settings → API
2. Find "Project URL" → Copy this for `SUPABASE_URL`
3. Find "Service role secret" under "Keys" → Copy for `SUPABASE_SERVICE_ROLE_KEY`

### VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY

1. Same as above for URL
2. Use "anon public" key instead of "service role secret" for frontend

### JWT_SECRET

Generate a secure random 32-character string:

```bash
# On macOS/Linux:
openssl rand -base64 32

# On Windows (PowerShell):
[Convert]::ToBase64String((1..32 | ForEach-Object {[byte](Get-Random -Maximum 256)}))
```

### RAZORPAY_KEY_ID & RAZORPAY_KEY_SECRET

1. Go to https://dashboard.razorpay.com/app/keys
2. Under "API Keys", find your test/live key ID
3. Key Secret is shown below
4. For development, use test keys (keys starting with `rzp_test_`)
5. For production, use live keys (keys starting with `rzp_live_`)

**Note**: Never commit these to git. Use environment variables only.

### VITE_RAZORPAY_KEY_ID

Use only the public KEY_ID from Razorpay dashboard (safe for frontend).

---

## 📋 Environment Variable Checklist

### Required for Minimum Setup

- [x] `DATABASE_URL` - PostgreSQL/Supabase connection
- [x] `JWT_SECRET` - For authentication tokens
- [x] `VITE_SUPABASE_URL` - Frontend Supabase URL
- [x] `VITE_SUPABASE_ANON_KEY` - Frontend Supabase key
- [x] `VITE_API_URL` - Frontend API endpoint

### Required for Full Functionality

- [x] All above
- [x] `RAZORPAY_KEY_ID` - Payment processing
- [x] `RAZORPAY_KEY_SECRET` - Payment verification
- [x] `VITE_RAZORPAY_KEY_ID` - Frontend Razorpay key

### Optional but Recommended

- [x] `SUPABASE_SERVICE_ROLE_KEY` - For admin operations
- [x] `MSG91_AUTH_KEY` - For SMS notifications
- [x] `INTERAKT_API_KEY` - For WhatsApp notifications
- [x] `REDIS_URL` - For job queues
- [x] `AWS_*` - For file uploads to S3

---

## 🚀 Local Development Setup

### 1. Create backend/.env

```bash
cd backend
cat > .env << 'EOF'
DATABASE_URL=postgresql://postgres:password@localhost:5432/hostelos_dev
JWT_SECRET=$(openssl rand -base64 32)
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:5173
EOF
```

### 2. Create frontend/.env.local

```bash
cat > .env.local << 'EOF'
VITE_SUPABASE_URL=https://your-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_URL=http://localhost:5000/api
VITE_DEBUG=true
EOF
```

### 3. Start Development Servers

```bash
# Terminal 1: Backend
cd backend
npm start

# Terminal 2: Frontend
cd ..
npm run dev
```

---

## 🔒 Production Checklist

- [ ] All required variables are set
- [ ] Secrets are NOT in .env file (use hosting provider's secrets management)
- [ ] `NODE_ENV=production`
- [ ] Use live Razorpay keys (not test keys)
- [ ] Database backups are configured
- [ ] Supabase backup is enabled
- [ ] SSL/TLS certificates are valid
- [ ] CORS origins are restrictive
- [ ] JWT_SECRET is strong and unique
- [ ] All notification APIs are configured
- [ ] Logging is configured for monitoring

---

## 🆘 Troubleshooting

### "Cannot connect to database"

1. Check `DATABASE_URL` is correct
2. Make sure you're using the "Connection Pooler" URL (`:6543`)
3. Test connection: `psql $DATABASE_URL`
4. Verify database is running (for local dev)

### "Supabase Auth not working"

1. Check `VITE_SUPABASE_URL` is correct
2. Check `VITE_SUPABASE_ANON_KEY` is correct (not service role key)
3. Clear browser cache and local storage
4. Check Supabase Auth is enabled in dashboard

### "Razorpay payments failing"

1. Check you're using correct mode (test vs live keys)
2. Verify `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` match
3. Test webhook signature: `npm test razorpay`
4. Check Razorpay dashboard for payment logs

### "CORS errors"

1. Check `FRONTEND_URL` matches your domain
2. Verify backend CORS middleware allows your frontend origin
3. Check browser console for specific CORS error

---

## 📞 Support

For specific variable requirements, see:
- `SUPABASE_MIGRATION_GUIDE.md` - Detailed Supabase setup
- `IMPLEMENTATION_SUMMARY.md` - All features and their requirements
- Original `README.md` - Project overview

---

**Last Updated**: May 18, 2026  
**Status**: Ready for production deployment
