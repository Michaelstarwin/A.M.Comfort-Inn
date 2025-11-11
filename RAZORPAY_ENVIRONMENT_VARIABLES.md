# 🔐 Razorpay Environment Variables - Complete Guide

**Date:** November 11, 2025  
**Status:** ✅ Production Ready

---

## 📋 Overview

Razorpay requires different environment variables for your frontend and backend. Here's everything you need.

---

## 🔑 Backend Environment Variables

**File Location:** `A.MServer/.env`

### Required Variables

```env
# ============================================
# RAZORPAY CONFIGURATION (REQUIRED)
# ============================================

# Your Razorpay API Key ID
# Get from: https://dashboard.razorpay.com/app/keys
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx

# Your Razorpay API Key Secret
# Get from: https://dashboard.razorpay.com/app/keys
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxx

# Razorpay Webhook Secret
# Get from: https://dashboard.razorpay.com/app/webhooks
# Only needed if using webhooks
RAZORPAY_WEBHOOK_SECRET=xxxxxxxxxxxxxxxxxxxxx
```

### Optional/Additional Variables

```env
# ============================================
# URL CONFIGURATION
# ============================================

# Frontend URL (for payment redirects)
FRONTEND_URL=http://localhost:5173

# Backend URL (for webhooks)
BACKEND_URL=http://localhost:7700

# ============================================
# DATABASE CONFIGURATION
# ============================================

DATABASE_URL=postgresql://user:password@localhost:5432/amcomfortinn

# ============================================
# EMAIL CONFIGURATION (for booking confirmations)
# ============================================

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@amcomfortinn.com
```

---

## 🔑 Frontend Environment Variables

**File Location:** `A.M.Comfort-Inn/.env` or `.env.local`

### Required Variables

```env
# ============================================
# API CONFIGURATION
# ============================================

# Backend API Base URL
VITE_API_BASE_URL=http://localhost:7700/api

# Razorpay Public Key ID (use the KEY_ID, not SECRET)
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
```

### Optional/Additional Variables

```env
# ============================================
# ENVIRONMENT INDICATOR
# ============================================

# Current environment
VITE_ENVIRONMENT=development

# App name
VITE_APP_NAME=A.M. Comfort Inn

# App version
VITE_APP_VERSION=1.0.0
```

---

## 🔄 Environment-Specific Configurations

### Development Environment

**Backend (.env):**
```env
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxx
RAZORPAY_WEBHOOK_SECRET=xxxxxxxxxxxxxxxxxxxxx
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:7700
DATABASE_URL=postgresql://user:pass@localhost:5432/amcomfortinn_dev
```

**Frontend (.env.local):**
```env
VITE_API_BASE_URL=http://localhost:7700/api
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
```

### Staging Environment

**Backend (.env):**
```env
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxx
RAZORPAY_WEBHOOK_SECRET=xxxxxxxxxxxxxxxxxxxxx
FRONTEND_URL=https://staging.amcomfortinn.com
BACKEND_URL=https://api-staging.amcomfortinn.com
DATABASE_URL=postgresql://user:pass@staging-db:5432/amcomfortinn_staging
```

**Frontend (.env.staging):**
```env
VITE_API_BASE_URL=https://api-staging.amcomfortinn.com/api
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
```

### Production Environment

**Backend (.env):**
```env
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxx
RAZORPAY_WEBHOOK_SECRET=xxxxxxxxxxxxxxxxxxxxx
FRONTEND_URL=https://www.amcomfortinn.com
BACKEND_URL=https://api.amcomfortinn.com
DATABASE_URL=postgresql://user:pass@prod-db:5432/amcomfortinn_prod
```

**Frontend (.env.production):**
```env
VITE_API_BASE_URL=https://api.amcomfortinn.com/api
VITE_RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxx
```

---

## 🎯 How to Get Your Razorpay Keys

### Step 1: Create Razorpay Account
1. Go to https://razorpay.com
2. Click "Sign Up"
3. Complete registration with email and phone
4. Verify your email

### Step 2: Get API Keys
1. Log in to https://dashboard.razorpay.com
2. Navigate to **Settings → API Keys**
3. You'll see:
   - **Key ID** (public) - Use in frontend
   - **Key Secret** (private) - Use in backend only

### Step 3: Generate Webhook Secret
1. Go to **Settings → Webhooks**
2. Click "Create Webhook"
3. Enter your webhook URL: `https://yourdomain.com/api/payment/webhook`
4. Select events:
   - `payment.captured`
   - `payment.failed`
5. Copy the generated secret

### Step 4: Test Mode vs Live Mode
- **Test Mode**: Use `rzp_test_*` keys to test payments
- **Live Mode**: Use `rzp_live_*` keys for real payments
- Toggle between modes in the dashboard

---

## 🔒 Security Best Practices

### DO ✅
```
✅ Keep RAZORPAY_KEY_SECRET in .env (backend only)
✅ Keep RAZORPAY_WEBHOOK_SECRET in .env (backend only)
✅ Use VITE_RAZORPAY_KEY_ID in frontend (public is OK)
✅ Add .env to .gitignore
✅ Use different keys for test and production
✅ Rotate secrets periodically
✅ Use environment-specific secrets
```

### DON'T ❌
```
❌ Commit .env files to git
❌ Share API secrets via chat/email
❌ Use test keys in production
❌ Use live keys in development
❌ Expose secrets in client-side code
❌ Log sensitive information
❌ Share .env file publicly
```

### .gitignore
```gitignore
# Environment files
.env
.env.local
.env.*.local

# Node modules
node_modules/

# Build outputs
dist/
build/

# Logs
*.log
npm-debug.log
```

---

## 📝 Complete .env Template

### Backend Template

**File: `A.MServer/.env`**
```env
# ============================================
# RAZORPAY CONFIGURATION
# ============================================
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxx
RAZORPAY_WEBHOOK_SECRET=xxxxxxxxxxxxxxxxxxxxx

# ============================================
# URLs
# ============================================
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:7700

# ============================================
# DATABASE
# ============================================
DATABASE_URL=postgresql://user:password@localhost:5432/amcomfortinn

# ============================================
# EMAIL (Optional)
# ============================================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@amcomfortinn.com

# ============================================
# JWT (Optional)
# ============================================
JWT_SECRET=your-secret-key-here
JWT_EXPIRY=7d

# ============================================
# NODE ENVIRONMENT
# ============================================
NODE_ENV=development
```

### Frontend Template

**File: `A.M.Comfort-Inn/.env`**
```env
# ============================================
# API CONFIGURATION
# ============================================
VITE_API_BASE_URL=http://localhost:7700/api

# ============================================
# RAZORPAY CONFIGURATION
# ============================================
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx

# ============================================
# APP INFORMATION
# ============================================
VITE_ENVIRONMENT=development
VITE_APP_NAME=A.M. Comfort Inn
VITE_APP_VERSION=1.0.0
```

---

## ✅ Verification Checklist

After setting up environment variables:

### Backend Setup
- [ ] Created `.env` file in `A.MServer/`
- [ ] Added `RAZORPAY_KEY_ID`
- [ ] Added `RAZORPAY_KEY_SECRET`
- [ ] Added `RAZORPAY_WEBHOOK_SECRET`
- [ ] Added `FRONTEND_URL`
- [ ] Added `BACKEND_URL`
- [ ] Added `DATABASE_URL`
- [ ] `.env` is in `.gitignore`
- [ ] Restarted backend server

### Frontend Setup
- [ ] Created `.env` file in `A.M.Comfort-Inn/`
- [ ] Added `VITE_API_BASE_URL`
- [ ] Added `VITE_RAZORPAY_KEY_ID`
- [ ] `.env` is in `.gitignore`
- [ ] Restarted frontend dev server

### Testing
- [ ] Backend can access Razorpay keys: `console.log(process.env.RAZORPAY_KEY_ID)`
- [ ] Frontend can access Razorpay key: `console.log(import.meta.env.VITE_RAZORPAY_KEY_ID)`
- [ ] Payment order creation works
- [ ] Payment verification works
- [ ] No "undefined" errors in console

---

## 🔄 Setting Environment Variables in Different Environments

### Local Development (Your Computer)

```bash
# Backend
cd A.MServer
cat > .env << EOF
RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=xxx
RAZORPAY_WEBHOOK_SECRET=xxx
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:7700
DATABASE_URL=postgresql://...
EOF

# Frontend
cd A.M.Comfort-Inn
cat > .env << EOF
VITE_API_BASE_URL=http://localhost:7700/api
VITE_RAZORPAY_KEY_ID=rzp_test_xxx
EOF
```

### Docker/Container Deployment

```dockerfile
# In Dockerfile or docker-compose.yml
ENV RAZORPAY_KEY_ID=rzp_test_xxx
ENV RAZORPAY_KEY_SECRET=xxx
ENV RAZORPAY_WEBHOOK_SECRET=xxx
ENV FRONTEND_URL=https://yourdomain.com
ENV BACKEND_URL=https://api.yourdomain.com
ENV DATABASE_URL=postgresql://...
```

### GitHub Actions (CI/CD)

```yaml
# .github/workflows/deploy.yml
env:
  RAZORPAY_KEY_ID: ${{ secrets.RAZORPAY_KEY_ID }}
  RAZORPAY_KEY_SECRET: ${{ secrets.RAZORPAY_KEY_SECRET }}
  RAZORPAY_WEBHOOK_SECRET: ${{ secrets.RAZORPAY_WEBHOOK_SECRET }}
```

### AWS/Heroku/Vercel

**AWS Systems Manager:**
```bash
aws ssm put-parameter \
  --name /amcomfortinn/razorpay/key_id \
  --value "rzp_test_xxx" \
  --type "String"
```

**Heroku CLI:**
```bash
heroku config:set RAZORPAY_KEY_ID=rzp_test_xxx
heroku config:set RAZORPAY_KEY_SECRET=xxx
```

**Vercel:**
```bash
vercel env add VITE_RAZORPAY_KEY_ID
vercel env add VITE_API_BASE_URL
```

---

## 🧪 Testing Your Configuration

### Backend Test
```typescript
// Add to your backend startup file
console.log('✓ Razorpay Configuration:');
console.log('  KEY_ID:', process.env.RAZORPAY_KEY_ID ? '✅ Set' : '❌ Missing');
console.log('  KEY_SECRET:', process.env.RAZORPAY_KEY_SECRET ? '✅ Set' : '❌ Missing');
console.log('  WEBHOOK_SECRET:', process.env.RAZORPAY_WEBHOOK_SECRET ? '✅ Set' : '❌ Missing');
```

### Frontend Test
```javascript
// Add to your App.jsx useEffect
useEffect(() => {
  console.log('✓ Frontend Configuration:');
  console.log('  API_BASE_URL:', import.meta.env.VITE_API_BASE_URL);
  console.log('  RAZORPAY_KEY_ID:', import.meta.env.VITE_RAZORPAY_KEY_ID);
}, []);
```

### Payment Test
```bash
curl -X POST http://localhost:7700/api/bookings/payment/create-order \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": "test-booking-123"
  }'
```

---

## 🆘 Troubleshooting

### Issue: "RAZORPAY_KEY_ID is undefined"

**Solution:**
```bash
# Check if .env exists
ls -la A.MServer/.env

# Check if variables are set
cat A.MServer/.env | grep RAZORPAY

# Restart server after adding variables
npm run dev
```

### Issue: "Payment gateway not available"

**Solution:**
```javascript
// Verify keys in browser console
console.log(import.meta.env.VITE_RAZORPAY_KEY_ID);
// Should show: rzp_test_xxxxx (not undefined)
```

### Issue: "Invalid Razorpay credentials"

**Solution:**
1. Verify you're using TEST keys (development)
2. Verify keys match exactly in dashboard
3. Check for extra spaces or line breaks in .env

### Issue: "Webhook signature verification failed"

**Solution:**
1. Ensure `RAZORPAY_WEBHOOK_SECRET` is set in backend
2. Check webhook URL in Razorpay dashboard matches your server
3. Verify webhook is enabled in dashboard settings

---

## 📊 Environment Variables Summary Table

| Variable | Location | Example | Required | Secret |
|----------|----------|---------|----------|--------|
| RAZORPAY_KEY_ID | Backend | rzp_test_xxx | ✅ Yes | ❌ No |
| RAZORPAY_KEY_SECRET | Backend | xxx_secret | ✅ Yes | ✅ Yes |
| RAZORPAY_WEBHOOK_SECRET | Backend | xxx_webhook | ✅ Yes | ✅ Yes |
| VITE_RAZORPAY_KEY_ID | Frontend | rzp_test_xxx | ✅ Yes | ❌ No |
| VITE_API_BASE_URL | Frontend | http://... | ✅ Yes | ❌ No |
| FRONTEND_URL | Backend | http://... | ✅ Yes | ❌ No |
| BACKEND_URL | Backend | http://... | ✅ Yes | ❌ No |
| DATABASE_URL | Backend | postgres://... | ✅ Yes | ✅ Yes |

---

## 🚀 Switching from Test to Live

### Step 1: Get Live Keys
1. Go to https://dashboard.razorpay.com
2. Switch toggle to "Live" (top-left)
3. Copy new keys (rzp_live_*)

### Step 2: Update Backend
```env
# Change from:
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx

# To:
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxx

# And update secret too!
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxx
```

### Step 3: Update Frontend
```env
# Change from:
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx

# To:
VITE_RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxx
```

### Step 4: Restart Servers
```bash
# Backend
npm run dev

# Frontend
npm run dev
```

---

## ✅ Final Checklist

- [ ] All 3 Razorpay variables set in backend
- [ ] Razorpay key set in frontend
- [ ] API URL set in frontend
- [ ] URLs match your deployment environment
- [ ] .env files in .gitignore
- [ ] No hardcoded keys in source code
- [ ] Tested with test keys first
- [ ] Webhook configured (optional but recommended)
- [ ] Database URL configured
- [ ] Email configuration set (optional)

---

## 📞 Support

**If you encounter issues:**

1. Check the `.env` file exists in correct location
2. Verify keys from Razorpay dashboard
3. Check for typos or extra spaces
4. Ensure you're using correct key type (test vs live)
5. Restart your development server
6. Check browser console for errors
7. Check backend logs for errors

**Razorpay Support:** https://razorpay.com/support

---

**Last Updated:** November 11, 2025  
**Status:** ✅ COMPLETE  
**Version:** 1.0

