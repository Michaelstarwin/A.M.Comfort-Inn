# Quick Start Commands

## 🚀 One-Time Setup

### Install Dependencies
```bash
# Frontend
cd A.M.Comfort-Inn
npm install recharts @heroicons/react

# Backend
cd ../A.MServer
npm install multer
npm install --save-dev @types/multer
```

### Database Migration
```bash
cd A.MServer
npx prisma generate
npx prisma migrate dev --name add_room_image_description
```

---

## 📌 Development Commands

### Start Frontend
```bash
cd A.M.Comfort-Inn
npm run dev
# Opens at http://localhost:5173
```

### Start Backend
```bash
cd A.MServer
npm run dev
# Runs at http://localhost:7700
```

### Start Both (Terminal 1 & 2)
```bash
# Terminal 1
cd A.M.Comfort-Inn && npm run dev

# Terminal 2
cd A.MServer && npm run dev
```

---

## 🔍 Useful Debugging Commands

### View Database
```bash
cd A.MServer
npx prisma studio
# Opens Prisma Studio at http://localhost:5555
```

### Check TypeScript Errors
```bash
cd A.MServer
npm run build
```

### Generate Prisma Client
```bash
cd A.MServer
npx prisma generate
```

---

## 🧪 API Testing

### Create Room with Image
```bash
curl -X POST http://localhost:7700/api/bookings/admin/inventory/room-types \
  -H "x-user-id: admin123" \
  -F "roomType=Deluxe Suite" \
  -F "totalRooms=5" \
  -F "currentRate=2500" \
  -F "status=Active" \
  -F "description=Luxury room with city view" \
  -F "image=@/path/to/image.jpg"
```

### Get All Bookings
```bash
curl http://localhost:7700/api/bookings/admin/bookings?page=1&limit=10 \
  -H "x-user-id: admin123"
```

### Filter Bookings by Status
```bash
curl "http://localhost:7700/api/bookings/admin/bookings?status=Success&page=1" \
  -H "x-user-id: admin123"
```

### Search Bookings
```bash
curl "http://localhost:7700/api/bookings/admin/bookings?search=john@example.com" \
  -H "x-user-id: admin123"
```

### Get Analytics
```bash
curl "http://localhost:7700/api/bookings/admin/analytics?period=month" \
  -H "x-user-id: admin123"
```

### Get Revenue Analytics
```bash
curl "http://localhost:7700/api/bookings/admin/analytics/revenue?period=month" \
  -H "x-user-id: admin123"
```

### Get Occupancy Stats
```bash
curl "http://localhost:7700/api/bookings/admin/analytics/occupancy" \
  -H "x-user-id: admin123"
```

### Get Top Room Types
```bash
curl "http://localhost:7700/api/bookings/admin/analytics/top-rooms" \
  -H "x-user-id: admin123"
```

### Update Room
```bash
curl -X PUT http://localhost:7700/api/bookings/admin/inventory/room-types/room123 \
  -H "x-user-id: admin123" \
  -H "Content-Type: application/json" \
  -d '{
    "roomType": "Deluxe Suite",
    "totalRooms": 6,
    "currentRate": 2800,
    "status": "Active"
  }'
```

### Update Booking Status
```bash
curl -X PUT http://localhost:7700/api/bookings/admin/bookings/booking123/status \
  -H "x-user-id: admin123" \
  -H "Content-Type: application/json" \
  -d '{"status": "Success"}'
```

---

## 📁 Directory Structure Check

### Frontend
```
A.M.Comfort-Inn/
└── src/
    └── pages/Admin/
        ├── AdminDashboard.jsx          ✅
        ├── RoomInventoryForm.jsx       ✅
        ├── RoomInventoryList.jsx       ✅
        ├── BookingsManagement.jsx      ✅ (New)
        ├── AnalyticsDashboard.jsx      ✅ (New)
        └── AdminFormControl.jsx        ✅
```

### Backend
```
A.MServer/
├── src/
│   ├── modules/booking/
│   │   ├── booking.route.ts        ✅ (Updated)
│   │   └── booking.service.ts      ✅ (Updated)
│   └── shared/lib/utils/
│       └── roomImageUpload.ts      ✅ (New)
├── uploads/rooms/                  ✅ (Create if missing)
└── prisma/
    └── schema.prisma               ✅ (Updated)
```

---

## 🔑 Environment Variables

### Frontend (.env)
```
VITE_API_BASE_URL=http://localhost:7700/api
VITE_RAZORPAY_KEY_ID=your_key_id
```

### Backend (.env)
```
DATABASE_URL=postgresql://user:password@localhost:5432/amcomfortinn
NODE_ENV=development
APP_PORT=7700
APP_HOST=localhost
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

---

## 🧹 Cleanup & Reset

### Clear Node Modules & Reinstall
```bash
# Frontend
cd A.M.Comfort-Inn
rm -rf node_modules package-lock.json
npm install

# Backend
cd A.MServer
rm -rf node_modules package-lock.json
npm install
```

### Reset Database
```bash
cd A.MServer
npx prisma migrate reset
# Warning: This deletes all data
```

### Clear Uploaded Images
```bash
cd A.MServer
rm -rf uploads/rooms/*
```

---

## 📊 Verify Installation

### Check Frontend Build
```bash
cd A.M.Comfort-Inn
npm run build
```

### Check Backend TypeScript
```bash
cd A.MServer
npm run build
```

### Check Database Connection
```bash
cd A.MServer
npx prisma validate
```

---

## 🔄 Common Workflow

### 1. Start Development
```bash
# Terminal 1 - Backend
cd A.MServer
npm run dev

# Terminal 2 - Frontend
cd A.M.Comfort-Inn
npm run dev

# Terminal 3 - Database (optional)
cd A.MServer
npx prisma studio
```

### 2. Make Changes
```
Edit files in src/pages/Admin/ (frontend)
Edit files in src/modules/booking/ (backend)
Changes auto-refresh due to hot reload
```

### 3. Test Changes
```
Open http://localhost:5173/admin
Test functionality in admin dashboard
Check browser console for errors
Check backend terminal for API logs
```

### 4. Build for Production
```bash
# Frontend
cd A.M.Comfort-Inn
npm run build

# Backend
cd A.MServer
npm run build
npm run start
```

---

## 🆘 Quick Fixes

### Images not uploading
```bash
# Create uploads directory
mkdir -p A.MServer/uploads/rooms
chmod 755 A.MServer/uploads/rooms
```

### Database connection error
```bash
# Check environment variables
echo $DATABASE_URL

# Verify database is running
# PostgreSQL should be accessible
```

### TypeScript errors
```bash
# Regenerate Prisma client
cd A.MServer
npx prisma generate

# Rebuild TypeScript
npm run build
```

### Module not found errors
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Clear npm cache
npm cache clean --force
```

---

## 📱 Testing the Admin Dashboard

### Access Points
- **URL:** http://localhost:5173/admin
- **Login:** Use admin ID stored in localStorage
- **Main Tabs:** Room Inventory | Bookings | Analytics

### Test Data Creation
1. Go to Room Inventory
2. Create a test room with image
3. Go to Bookings
4. View existing bookings (if any)
5. Go to Analytics
6. View charts and statistics

---

## 🔗 Useful Links

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:7700/api
- **Prisma Studio:** http://localhost:5555 (after `npx prisma studio`)
- **Database:** postgresql://localhost:5432/amcomfortinn

---

## 📋 Checklist Before Production

- [ ] Database backup created
- [ ] Environment variables configured
- [ ] Frontend build successful
- [ ] Backend build successful
- [ ] All tests passing
- [ ] Images directory permissions set
- [ ] CORS configured correctly
- [ ] Admin authentication enabled
- [ ] Error logging configured
- [ ] Performance optimized

---

**Last Updated:** November 2025
**Version:** 1.0
**Status:** Ready for Use ✅
