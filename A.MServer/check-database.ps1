# Database Query Script for A.M. Comfort Inn
# This script helps you check bookings in your database

Write-Host "=== A.M. Comfort Inn Database Checker ===" -ForegroundColor Cyan
Write-Host ""

# Check if DATABASE_URL is set
if (-not $env:DATABASE_URL) {
    Write-Host "ERROR: DATABASE_URL environment variable not set!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please set it using one of these methods:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Option 1: Set for this session only:" -ForegroundColor Green
    Write-Host '  $env:DATABASE_URL = "your_database_url_here"' -ForegroundColor White
    Write-Host ""
    Write-Host "Option 2: Create .env file with DATABASE_URL" -ForegroundColor Green
    Write-Host ""
    Write-Host "Get your DATABASE_URL from:" -ForegroundColor Yellow
    Write-Host "  - Render Dashboard > Database > Connection String" -ForegroundColor White
    Write-Host "  - Or your hosting provider's database settings" -ForegroundColor White
    exit 1
}

Write-Host "DATABASE_URL found!" -ForegroundColor Green
Write-Host ""
Write-Host "Choose what you want to check:" -ForegroundColor Cyan
Write-Host "1. Open Prisma Studio (Visual Database Browser)" -ForegroundColor White
Write-Host "2. Query recent bookings" -ForegroundColor White
Write-Host "3. Search for specific order ID" -ForegroundColor White
Write-Host "4. Check database schema" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Enter your choice (1-4)"

switch ($choice) {
    "1" {
        Write-Host "Opening Prisma Studio..." -ForegroundColor Green
        Write-Host "This will open at http://localhost:5555" -ForegroundColor Yellow
        npx prisma studio
    }
    "2" {
        Write-Host "Fetching recent bookings..." -ForegroundColor Green
        node -e "
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();
        
        async function main() {
            const bookings = await prisma.booking.findMany({
                take: 10,
                orderBy: { createdAt: 'desc' },
                select: {
                    bookingId: true,
                    paymentOrderId: true,
                    paymentStatus: true,
                    totalAmount: true,
                    createdAt: true,
                    guestInfo: true
                }
            });
            
            console.log('\n=== Recent 10 Bookings ===\n');
            bookings.forEach((booking, index) => {
                console.log(\`\${index + 1}. Order ID: \${booking.paymentOrderId || 'N/A'}\`);
                console.log(\`   Booking ID: \${booking.bookingId}\`);
                console.log(\`   Status: \${booking.paymentStatus}\`);
                console.log(\`   Amount: ₹\${booking.totalAmount}\`);
                console.log(\`   Guest: \${booking.guestInfo?.fullName || 'N/A'}\`);
                console.log(\`   Created: \${booking.createdAt}\`);
                console.log('');
            });
        }
        
        main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
        "
    }
    "3" {
        $orderId = Read-Host "Enter the Razorpay Order ID (e.g., order_RkGPc0S1IDErZr)"
        Write-Host "Searching for order: $orderId" -ForegroundColor Green
        node -e "
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();
        
        async function main() {
            const booking = await prisma.booking.findFirst({
                where: { paymentOrderId: '$orderId' },
                include: { roomInventory: true, user: true }
            });
            
            if (!booking) {
                console.log('\n❌ Booking NOT FOUND for order ID: $orderId\n');
                console.log('This order does not exist in the database.');
                return;
            }
            
            console.log('\n✅ Booking FOUND!\n');
            console.log('Booking ID:', booking.bookingId);
            console.log('Payment Order ID:', booking.paymentOrderId);
            console.log('Payment ID:', booking.paymentId || 'N/A');
            console.log('Payment Status:', booking.paymentStatus);
            console.log('Room Type:', booking.roomType);
            console.log('Total Amount: ₹', booking.totalAmount);
            console.log('Guest Name:', booking.guestInfo?.fullName || 'N/A');
            console.log('Guest Email:', booking.guestInfo?.email || 'N/A');
            console.log('Check-in:', booking.checkInDate);
            console.log('Check-out:', booking.checkOutDate);
            console.log('Created At:', booking.createdAt);
            console.log('');
        }
        
        main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
        "
    }
    "4" {
        Write-Host "Checking database schema..." -ForegroundColor Green
        npx prisma db pull
        Write-Host ""
        Write-Host "Schema updated! Check prisma/schema.prisma" -ForegroundColor Green
    }
    default {
        Write-Host "Invalid choice!" -ForegroundColor Red
    }
}
