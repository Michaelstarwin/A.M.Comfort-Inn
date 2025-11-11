# Razorpay Environment Variables - Quick Reference

## Frontend (.env.local in A.M.Comfort-Inn/)

```env
# REQUIRED: Razorpay Public API Key (starts with rzp_test_ or rzp_live_)
VITE_RAZORPAY_KEY_ID=rzp_test_abc123def456

# OPTIONAL: Backend API Base URL
VITE_API_BASE_URL=http://localhost:7700/api
```

## Backend (.env in A.MServer/)

```env
# REQUIRED: Razorpay Keys
RAZORPAY_KEY_ID=rzp_test_abc123def456
RAZORPAY_KEY_SECRET=test_secret_xyz789

# OPTIONAL: Webhook Secret
RAZORPAY_WEBHOOK_SECRET=whsec_test_abc123

# OPTIONAL: URLs (defaults provided)
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:7700

# OTHER REQUIRED VARIABLES
DATABASE_URL=postgresql://user:password@localhost:5432/db_name
JWT_SECRET_KEY=your_jwt_secret_here
NODE_ENV=development
```

## Where to Get These Values

### 1. VITE_RAZORPAY_KEY_ID & RAZORPAY_KEY_ID
- Go to [Razorpay Dashboard](https://dashboard.razorpay.com)
- Settings → API Keys
- Copy the **Key ID** (test or live)

### 2. RAZORPAY_KEY_SECRET
- Same location as above
- Copy the **Key Secret**

### 3. RAZORPAY_WEBHOOK_SECRET (Optional)
- Razorpay Dashboard → Settings → Webhooks
- Create webhook with URL: `https://yourdomain/api/payment/webhook`
- Copy the **Signing Secret**

## ✅ Minimum Setup for Development

```env
# Frontend: .env.local
VITE_RAZORPAY_KEY_ID=rzp_test_abc123def456

# Backend: .env
RAZORPAY_KEY_ID=rzp_test_abc123def456
RAZORPAY_KEY_SECRET=test_secret_xyz789
DATABASE_URL=postgresql://localhost/comfort_inn_db
JWT_SECRET_KEY=dev_secret_key
```

## Test Credentials

**Test Card**: 4111 1111 1111 1111  
**CVV**: 123  
**Expiry**: 12/25  
**OTP**: 123456 (any 6 digits)

## ⚠️ Important Notes

- **Never hardcode** secrets in your code
- **Never commit** `.env` files to Git
- **Test keys** start with `rzp_test_`
- **Live keys** start with `rzp_live_`
- Both frontend and backend must use **matching key types** (both test or both live)
- Frontend gets `VITE_` prefix (Vite framework convention)
- Backend gets regular `process.env.` access

## Files That Use These Variables

| Variable | Used In |
|----------|---------|
| `VITE_RAZORPAY_KEY_ID` | `src/pages/Booking/PaymentStatus.jsx` |
| `RAZORPAY_KEY_ID` | `src/modules/payment/razorpay.service.ts` |
| `RAZORPAY_KEY_SECRET` | `src/modules/payment/razorpay.service.ts` |
| `RAZORPAY_WEBHOOK_SECRET` | `src/modules/payment/razorpay.service.ts` |
| `DATABASE_URL` | `src/shared/lib/db.ts` |
| `JWT_SECRET_KEY` | `src/shared/lib/utils/jwt.ts` |

## Verification

After setting up `.env` files, verify with:

```bash
# Frontend (should not show undefined)
grep "VITE_RAZORPAY_KEY_ID" A.M.Comfort-Inn/.env.local

# Backend (should not show undefined)
grep "RAZORPAY_KEY_ID" A.MServer/.env
```

---

**Status**: Ready for Development ✅  
**Last Updated**: January 2025
