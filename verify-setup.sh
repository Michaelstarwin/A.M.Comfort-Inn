#!/bin/bash

# Admin Dashboard Implementation Verification Script
# Run this script to verify all components are in place

echo "🔍 Admin Dashboard Implementation Verification"
echo "=============================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

verification_failed=0

# Function to check file exists
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✅${NC} Found: $1"
    else
        echo -e "${RED}❌${NC} Missing: $1"
        verification_failed=1
    fi
}

# Function to check directory exists
check_dir() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✅${NC} Directory: $1"
    else
        echo -e "${RED}❌${NC} Missing directory: $1"
        verification_failed=1
    fi
}

echo "📦 Checking Frontend Files..."
echo "---"
check_file "A.M.Comfort-Inn/src/pages/Admin/AdminDashboard.jsx"
check_file "A.M.Comfort-Inn/src/pages/Admin/RoomInventoryForm.jsx"
check_file "A.M.Comfort-Inn/src/pages/Admin/RoomInventoryList.jsx"
check_file "A.M.Comfort-Inn/src/pages/Admin/BookingsManagement.jsx"
check_file "A.M.Comfort-Inn/src/pages/Admin/AnalyticsDashboard.jsx"
check_file "A.M.Comfort-Inn/src/pages/Admin/AdminFormControl.jsx"
check_file "A.M.Comfort-Inn/src/utils/api.js"
echo ""

echo "📦 Checking Backend Files..."
echo "---"
check_file "A.MServer/src/modules/booking/booking.route.ts"
check_file "A.MServer/src/modules/booking/booking.service.ts"
check_file "A.MServer/src/shared/lib/utils/roomImageUpload.ts"
echo ""

echo "📋 Checking Configuration Files..."
echo "---"
check_file "A.MServer/prisma/schema.prisma"
check_file "A.M.Comfort-Inn/.env"
check_file "A.MServer/.env"
echo ""

echo "📚 Checking Documentation Files..."
echo "---"
check_file "ADMIN_DASHBOARD_SETUP.md"
check_file "ADMIN_IMPLEMENTATION_COMPLETE.md"
check_file "QUICK_START.md"
echo ""

echo "📁 Checking Directories..."
echo "---"
check_dir "A.M.Comfort-Inn/src/pages/Admin"
check_dir "A.MServer/uploads"
check_dir "A.MServer/prisma"
echo ""

echo "🔍 Checking NPM Dependencies..."
echo "---"

# Check Frontend dependencies
echo "Frontend dependencies:"
if grep -q "\"recharts\"" "A.M.Comfort-Inn/package.json"; then
    echo -e "${GREEN}✅${NC} recharts installed"
else
    echo -e "${YELLOW}⚠️${NC} recharts not in package.json (run: npm install recharts)"
    verification_failed=1
fi

if grep -q "\"@heroicons/react\"" "A.M.Comfort-Inn/package.json"; then
    echo -e "${GREEN}✅${NC} @heroicons/react installed"
else
    echo -e "${YELLOW}⚠️${NC} @heroicons/react not in package.json (run: npm install @heroicons/react)"
    verification_failed=1
fi

# Check Backend dependencies
echo ""
echo "Backend dependencies:"
if grep -q "\"multer\"" "A.MServer/package.json"; then
    echo -e "${GREEN}✅${NC} multer installed"
else
    echo -e "${YELLOW}⚠️${NC} multer not in package.json (run: npm install multer)"
    verification_failed=1
fi

if grep -q "\"@types/multer\"" "A.MServer/package.json"; then
    echo -e "${GREEN}✅${NC} @types/multer installed"
else
    echo -e "${YELLOW}⚠️${NC} @types/multer not in devDependencies (run: npm install --save-dev @types/multer)"
    verification_failed=1
fi

echo ""
echo "🔐 Checking Schema Updates..."
echo "---"
if grep -q "imageUrl" "A.MServer/prisma/schema.prisma"; then
    echo -e "${GREEN}✅${NC} imageUrl field added to RoomInventory"
else
    echo -e "${RED}❌${NC} imageUrl field missing from schema"
    verification_failed=1
fi

if grep -q "description" "A.MServer/prisma/schema.prisma"; then
    echo -e "${GREEN}✅${NC} description field added to RoomInventory"
else
    echo -e "${RED}❌${NC} description field missing from schema"
    verification_failed=1
fi

echo ""
echo "📡 Checking API Endpoints..."
echo "---"

if grep -q "getAdminBookings" "A.MServer/src/modules/booking/booking.service.ts"; then
    echo -e "${GREEN}✅${NC} getAdminBookings() implemented"
else
    echo -e "${RED}❌${NC} getAdminBookings() missing"
    verification_failed=1
fi

if grep -q "getAnalytics" "A.MServer/src/modules/booking/booking.service.ts"; then
    echo -e "${GREEN}✅${NC} getAnalytics() implemented"
else
    echo -e "${RED}❌${NC} getAnalytics() missing"
    verification_failed=1
fi

if grep -q "getRevenueAnalytics" "A.MServer/src/modules/booking/booking.service.ts"; then
    echo -e "${GREEN}✅${NC} getRevenueAnalytics() implemented"
else
    echo -e "${RED}❌${NC} getRevenueAnalytics() missing"
    verification_failed=1
fi

if grep -q "getOccupancyStats" "A.MServer/src/modules/booking/booking.service.ts"; then
    echo -e "${GREEN}✅${NC} getOccupancyStats() implemented"
else
    echo -e "${RED}❌${NC} getOccupancyStats() missing"
    verification_failed=1
fi

if grep -q "getTopRoomTypes" "A.MServer/src/modules/booking/booking.service.ts"; then
    echo -e "${GREEN}✅${NC} getTopRoomTypes() implemented"
else
    echo -e "${RED}❌${NC} getTopRoomTypes() missing"
    verification_failed=1
fi

echo ""
echo "🎨 Checking Frontend Components..."
echo "---"

if grep -q "BookingsManagement" "A.M.Comfort-Inn/src/pages/Admin/AdminDashboard.jsx"; then
    echo -e "${GREEN}✅${NC} BookingsManagement imported"
else
    echo -e "${RED}❌${NC} BookingsManagement not imported"
    verification_failed=1
fi

if grep -q "AnalyticsDashboard" "A.M.Comfort-Inn/src/pages/Admin/AdminDashboard.jsx"; then
    echo -e "${GREEN}✅${NC} AnalyticsDashboard imported"
else
    echo -e "${RED}❌${NC} AnalyticsDashboard not imported"
    verification_failed=1
fi

echo ""
echo "=============================================="

if [ $verification_failed -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed! Your admin dashboard is ready.${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Run: npm install (in both directories)"
    echo "2. Run: npx prisma migrate dev (in A.MServer)"
    echo "3. Start frontend: npm run dev (in A.M.Comfort-Inn)"
    echo "4. Start backend: npm run dev (in A.MServer)"
    echo "5. Visit: http://localhost:5173/admin"
    exit 0
else
    echo -e "${RED}❌ Some checks failed. Please fix the issues above.${NC}"
    echo ""
    echo "Troubleshooting:"
    echo "- Check QUICK_START.md for common issues"
    echo "- Verify all files are in correct locations"
    echo "- Run: npm install in both directories"
    echo "- Run: npx prisma generate in A.MServer"
    exit 1
fi
