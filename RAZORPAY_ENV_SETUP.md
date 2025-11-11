# Razorpay Environment Variables Setup Guide

This document provides a complete guide to setting up Razorpay environment variables for the A.M. Comfort Inn booking system (both frontend and backend).

## 📋 Table of Contents

1. [Overview](#overview)
2. [Required Environment Variables](#required-environment-variables)
3. [Frontend Setup (.env.local)](#frontend-setup-envlocal)
4. [Backend Setup (.env)](#backend-setup-env)
5. [Razorpay Credentials](#razorpay-credentials)
6. [Testing vs Production](#testing-vs-production)
7. [Troubleshooting](#troubleshooting)

---

## Overview

Razorpay is the payment gateway integrated into this application. You'll need:
- **Razorpay Account** (Test or Production)
- **API Keys** from Razorpay Dashboard
- **Webhook Secret** (optional, for webhook handling)
- **Environment Configuration Files**

---

## Required Environment Variables

### Frontend Requirements
| Variable | Type | Location | Status | Purpose |
|----------|------|----------|--------|---------|
| `VITE_RAZORPAY_KEY_ID` | String | `.env.local` | **Required** | Razorpay public key for in-app checkout |
| `VITE_API_BASE_URL` | String | `.env.local` | Optional | Backend API base URL (defaults to `http://localhost:7700/api`) |

### Backend Requirements
| Variable | Type | Location | Status | Purpose |
|----------|------|----------|--------|---------|
| `RAZORPAY_KEY_ID` | String | `.env` | **Required** | Razorpay API Key ID (from Razorpay Dashboard) |
| `RAZORPAY_KEY_SECRET` | String | `.env` | **Required** | Razorpay API Secret Key (from Razorpay Dashboard) |
| `RAZORPAY_WEBHOOK_SECRET` | String | `.env` | Optional | Webhook signing secret (for webhook verification) |
| `FRONTEND_URL` | String | `.env` | Optional | Frontend URL (defaults to `http://localhost:5173`) |
| `BACKEND_URL` | String | `.env` | Optional | Backend URL (defaults to `http://localhost:7700`) |
| `DATABASE_URL` | String | `.env` | **Required** | PostgreSQL connection string |
| `JWT_SECRET_KEY` | String | `.env` | **Required** | JWT secret for authentication |
| `NODE_ENV` | String | `.env` | Optional | Environment mode: `development`, `production`, `test` |

---

## Frontend Setup (.env.local)

Create a `.env.local` file in the `A.M.Comfort-Inn/` directory:

```env
# Razorpay Configuration
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx

# Backend API Configuration (optional)
VITE_API_BASE_URL=http://localhost:7700/api
```

### Frontend .env.local Example (Development)

```env
# Razorpay Test Mode Keys
VITE_RAZORPAY_KEY_ID=rzp_test_abc123def456

# Backend API
VITE_API_BASE_URL=http://localhost:7700/api
```

### Frontend .env.local Example (Production)

```env
# Razorpay Production Keys
VITE_RAZORPAY_KEY_ID=rzp_live_abc123def456

# Production Backend API
VITE_API_BASE_URL=https://api.amcomfortinn.com/api
```

---

## Backend Setup (.env)

Create a `.env` file in the `A.MServer/` directory:

### Backend .env Example (Development)

```env
# Razorpay Configuration
RAZORPAY_KEY_ID=rzp_test_abc123def456
RAZORPAY_KEY_SECRET=test_secret_xyz789

# Optional: Webhook Secret (if using webhooks)
RAZORPAY_WEBHOOK_SECRET=whsec_test_abc123

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/comfort_inn_db

# JWT Authentication
JWT_SECRET_KEY=your_jwt_secret_key_here

# Frontend & Backend URLs
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:7700

# Email Configuration (for notifications)
MAIL_USER=your-email@gmail.com
MAIL_PASS=your-app-password

# Environment
NODE_ENV=development
```

### Backend .env Example (Production)

```env
# Razorpay Configuration
RAZORPAY_KEY_ID=rzp_live_abc123def456
RAZORPAY_KEY_SECRET=live_secret_xyz789

# Webhook Secret
RAZORPAY_WEBHOOK_SECRET=whsec_live_abc123

# Database
DATABASE_URL=postgresql://user:secure-password@prod-db.example.com:5432/comfort_inn_prod

# JWT Authentication
JWT_SECRET_KEY=your-secure-jwt-secret-key-here

# Frontend & Backend URLs
FRONTEND_URL=https://amcomfortinn.com
BACKEND_URL=https://api.amcomfortinn.com

# Email Configuration
MAIL_USER=noreply@amcomfortinn.com
MAIL_PASS=secure-app-password

# Environment
NODE_ENV=production
```

---

## Razorpay Credentials

### How to Get Your Razorpay Keys

#### Step 1: Create a Razorpay Account
1. Go to [Razorpay Sign Up](https://razorpay.com/signup)
2. Create an account with your email and phone number
3. Complete KYC verification (required for production)

#### Step 2: Access API Keys
1. Log in to [Razorpay Dashboard](https://dashboard.razorpay.com)
2. Navigate to **Settings** → **API Keys**
3. You'll see two sections:
   - **Test Keys** (for development/testing)
   - **Live Keys** (for production - requires KYC verification)

#### Step 3: Copy Your Keys
```
Test Mode:
- Key ID:     rzp_test_xxxxxxxxxxxx
- Key Secret: test_xxxxxxxxxxxx

Live Mode (Production):
- Key ID:     rzp_live_xxxxxxxxxxxx
- Key Secret: live_xxxxxxxxxxxx
```

#### Step 4: Copy Webhook Secret (Optional)
1. In Dashboard, go to **Settings** → **Webhooks**
2. Create a webhook for payment events:
   - **Webhook URL**: `https://yourdomain.com/api/payment/webhook` (use your actual backend URL)
   - **Events**: Select `payment.authorized`, `payment.completed`
3. Copy the **Signing Secret**

---

## Testing vs Production

### Development/Testing Mode

**Use Test Keys** from Razorpay:
- Key ID starts with `rzp_test_`
- Key Secret starts with `test_`

**Test Credit Card Numbers** for payments:
| Card Type | Number | CVV | Expiry |
|-----------|--------|-----|--------|
| Visa | 4111 1111 1111 1111 | 123 | 12/25 |
| Mastercard | 5555 5555 5555 4444 | 456 | 12/25 |
| International | 4411 1111 1111 1111 | 123 | 12/25 |

**OTP** (for test mode): `123456` (any 6 digits)

### Production Mode

**Use Live Keys** from Razorpay:
- Key ID starts with `rzp_live_`
- Key Secret starts with `live_`

**Requirements**:
1. Complete KYC verification with Razorpay
2. Ensure HTTPS is enabled on your website
3. Set correct webhook URLs
4. Test thoroughly before going live

---

## Environment Variable Usage in Code

### Frontend (React/Vite)

**File**: `src/config/api.config.js`

```javascript
const configs = {
  development: {
    API_URL: 'http://localhost:7700/api',
    RAZORPAY_KEY_ID: import.meta.env.VITE_RAZORPAY_KEY_ID,
  },
  production: {
    API_URL: import.meta.env.VITE_API_BASE_URL || 'https://api.amcomfortinn.com/api',
    RAZORPAY_KEY_ID: import.meta.env.VITE_RAZORPAY_KEY_ID,
  },
};
```

**File**: `src/pages/Booking/PaymentStatus.jsx`

```javascript
import Razorpay from 'razorpay-checkout';

const razorpayKeyId = import.meta.env.VITE_RAZORPAY_KEY_ID;

const options = {
  key: razorpayKeyId,
  amount: bookingData.totalAmount * 100, // Convert to paise
  currency: 'INR',
  // ... other options
};
```

### Backend (Node.js/TypeScript)

**File**: `src/modules/payment/razorpay.service.ts`

```typescript
import Razorpay from 'razorpay';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!
});
```

**File**: `src/modules/booking/booking.service.ts`

```typescript
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:7700';
```

---

## Troubleshooting

### Issue: "VITE_RAZORPAY_KEY_ID is undefined"

**Cause**: Frontend environment variable not set

**Solution**:
1. Create `.env.local` in `A.M.Comfort-Inn/` directory
2. Add `VITE_RAZORPAY_KEY_ID=rzp_test_xxxxx`
3. Restart the dev server: `npm run dev`

### Issue: "RAZORPAY_KEY_ID is undefined" (Backend)

**Cause**: Backend environment variable not set

**Solution**:
1. Create `.env` in `A.MServer/` directory
2. Add `RAZORPAY_KEY_ID=rzp_test_xxxxx`
3. Restart the backend: `npm run dev`

### Issue: "Failed to create Razorpay order"

**Causes**:
- Incorrect API keys
- Keys don't match (test vs live mismatch)
- Backend can't reach Razorpay API

**Solution**:
1. Verify keys are correct in both `.env` files
2. Check that test keys have `rzp_test_` prefix
3. Ensure backend has internet connectivity
4. Check backend logs for detailed error

### Issue: "Payment verification failed"

**Cause**: Signature mismatch or incorrect key secret

**Solution**:
1. Verify `RAZORPAY_KEY_SECRET` is correct
2. Check that signature verification logic is using correct key
3. Ensure test/live keys match across payment flow

### Issue: "Webhook signature verification failed"

**Cause**: Webhook secret not configured or mismatch

**Solution**:
1. In Razorpay Dashboard, copy the Webhook Signing Secret
2. Add to `.env`: `RAZORPAY_WEBHOOK_SECRET=whsec_xxxxx`
3. Ensure webhook URL in Razorpay matches your backend URL

### Issue: "Test keys work but production keys fail"

**Common Causes**:
- KYC verification not completed
- Live keys not enabled
- HTTPS not configured on production domain

**Solution**:
1. Complete KYC verification in Razorpay Dashboard
2. Enable live keys in settings
3. Ensure production domain has valid HTTPS certificate
4. Test with live keys in sandbox mode first if available

---

## Checklist for Deployment

- [ ] Frontend `.env.local` created with `VITE_RAZORPAY_KEY_ID`
- [ ] Backend `.env` created with `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`
- [ ] `FRONTEND_URL` and `BACKEND_URL` set correctly
- [ ] Database connection working (`DATABASE_URL`)
- [ ] JWT secret configured (`JWT_SECRET_KEY`)
- [ ] Email configuration set (if notifications enabled)
- [ ] Test payment flow with test credentials
- [ ] Webhook URL configured in Razorpay Dashboard (if using webhooks)
- [ ] HTTPS enabled on production domain
- [ ] All dependencies installed (`npm install`)
- [ ] Database migrations run (`npm run migrate`)
- [ ] Both frontend and backend servers started successfully

---

## Security Best Practices

1. **Never commit `.env` files** to version control
2. **Use `.env.example`** to document required variables without secrets
3. **Rotate API keys** periodically
4. **Use different keys** for test and production
5. **Keep secrets in secure vaults** for production (use AWS Secrets Manager, HashiCorp Vault, etc.)
6. **Verify webhooks** are signed correctly to prevent tampering
7. **Monitor payment logs** for suspicious activity
8. **Use HTTPS** for all payment-related endpoints

---

## Additional Resources

- [Razorpay Official Documentation](https://razorpay.com/docs/)
- [Razorpay API Reference](https://razorpay.com/docs/api/)
- [Razorpay Test Credentials](https://razorpay.com/docs/payments/getting-started/test-mode/)
- [Razorpay Webhooks](https://razorpay.com/docs/webhooks/)

---

**Last Updated**: January 2025  
**Version**: 1.0  
**Status**: Complete ✅
