const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkOrder() {
    try {
        console.log('\n🔍 Checking for Order ID: order_RkGPc0S1IDErZr\n');

        const booking = await prisma.booking.findFirst({
            where: { paymentOrderId: 'order_RkGPc0S1IDErZr' },
            include: { roomInventory: true }
        });

        if (!booking) {
            console.log('❌ BOOKING NOT FOUND\n');
            console.log('This order does not exist in the database.\n');
            console.log('Let me show you recent orders instead...\n');

            // Show recent bookings
            const recentBookings = await prisma.booking.findMany({
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

            console.log('=== Recent 10 Bookings ===\n');
            recentBookings.forEach((b, index) => {
                console.log(`${index + 1}. Order ID: ${b.paymentOrderId || 'N/A'}`);
                console.log(`   Status: ${b.paymentStatus}`);
                console.log(`   Amount: ₹${b.totalAmount}`);
                console.log(`   Guest: ${b.guestInfo?.fullName || 'N/A'}`);
                console.log(`   Created: ${new Date(b.createdAt).toLocaleString()}`);
                console.log('');
            });

            await prisma.$disconnect();
            return;
        }

        console.log('✅ BOOKING FOUND!\n');
        console.log('====================');
        console.log('Booking ID:', booking.bookingId);
        console.log('Payment Order ID:', booking.paymentOrderId);
        console.log('Payment ID:', booking.paymentId || 'N/A');
        console.log('Payment Status:', booking.paymentStatus);
        console.log('Room Type:', booking.roomType);
        console.log('Room Name:', booking.roomInventory?.roomType || 'N/A');
        console.log('Total Amount: ₹', booking.totalAmount);
        console.log('Guest Name:', booking.guestInfo?.fullName || 'N/A');
        console.log('Guest Email:', booking.guestInfo?.email || 'N/A');
        console.log('Check-in:', new Date(booking.checkInDate).toLocaleDateString());
        console.log('Check-out:', new Date(booking.checkOutDate).toLocaleDateString());
        console.log('Created At:', new Date(booking.createdAt).toLocaleString());
        console.log('====================\n');

        await prisma.$disconnect();
    } catch (error) {
        console.error('Error:', error.message);
        await prisma.$disconnect();
        process.exit(1);
    }
}

checkOrder();
