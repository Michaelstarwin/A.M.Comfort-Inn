
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const orderId = process.argv[2];

if (!orderId) {
    console.error("Please provide an Order ID as an argument.");
    console.error("Usage: node scripts/manual-approve-booking.js order_12345");
    process.exit(1);
}

async function approveBooking() {
    try {
        const booking = await prisma.booking.findFirst({
            where: { paymentOrderId: orderId }
        });

        if (!booking) {
            console.error(`No booking found with Order ID: ${orderId}`);
            // Try to find by booking ID just in case
            const bookingById = await prisma.booking.findUnique({
                where: { bookingId: orderId } // in case they passed booking ID
            });

            if (bookingById) {
                console.log(`Found booking by Booking ID instead: ${bookingById.bookingId}`);
                await update(bookingById.bookingId);
                return;
            }

            process.exit(1);
        }

        await update(booking.bookingId);

    } catch (error) {
        console.error("Error approving booking:", error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

async function update(bookingId) {
    const updated = await prisma.booking.update({
        where: { bookingId: bookingId },
        data: {
            paymentStatus: 'Success',
            updatedAt: new Date(),
            paymentId: 'manual_debug_' + Date.now()
        }
    });

    console.log(`✅ Booking ${updated.bookingId} marked as SUCCESS.`);
    console.log(`Type: ${updated.roomType}, Count: ${updated.roomCount}, Amount: ${updated.totalAmount}`);
}

approveBooking();
