const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function inspectAvailability() {
    try {
        const inventory = await prisma.roomInventory.findMany();
        console.log('--- INVENTORY ---');
        console.log(JSON.stringify(inventory, null, 2));

        const bookings = await prisma.booking.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            where: { paymentStatus: { in: ['Success', 'Pending'] } }
        });
        console.log('--- RECENT ACTIVE BOOKINGS ---');
        console.log(JSON.stringify(bookings, null, 2));

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}
inspectAvailability();
