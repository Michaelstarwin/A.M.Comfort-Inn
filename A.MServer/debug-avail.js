const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function inspectAvailability() {
    try {
        console.log('--- Room Inventory ---');
        const inventory = await prisma.roomInventory.findMany();
        console.log(JSON.stringify(inventory, null, 2));

        console.log('\n--- Active Bookings (Future & Recent) ---');
        const now = new Date();
        // Check bookings that might be blocking "now" or near future
        const bookings = await prisma.booking.findMany({
            where: {
                checkOutDate: { gt: now }, // Still active
                OR: [
                    { paymentStatus: 'Success' },
                    { paymentStatus: 'Pending', createdAt: { gt: new Date(Date.now() - 20 * 60 * 1000) } }
                ]
            },
            select: {
                bookingId: true,
                roomType: true,
                roomCount: true,
                checkInDate: true,
                checkOutDate: true,
                paymentStatus: true,
                createdAt: true
            }
        });
        console.log(JSON.stringify(bookings, null, 2));

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

inspectAvailability();
