"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../shared/lib/db");
async function seedRoomInventory() {
    try {
        console.log('🌱 Seeding room inventory...');
        const rooms = [
            {
                roomId: 'DELUXE',
                roomType: 'Deluxe Room',
                totalRooms: 10,
                currentRate: 2500.00,
                status: 'Active'
            },
            {
                roomId: 'STANDARD',
                roomType: 'Standard Room',
                totalRooms: 15,
                currentRate: 1800.00,
                status: 'Active'
            },
            {
                roomId: 'SUITE',
                roomType: 'Executive Suite',
                totalRooms: 5,
                currentRate: 4500.00,
                status: 'Active'
            }
        ];
        for (const room of rooms) {
            await db_1.db.roomInventory.upsert({
                where: { roomId: room.roomId },
                update: room,
                create: room
            });
        }
        console.log('✅ Room inventory seeded successfully!');
    }
    catch (error) {
        console.error('❌ Error seeding room inventory:', error);
    }
    finally {
        await db_1.db.$disconnect();
    }
}
// Run the seed function
seedRoomInventory();
//# sourceMappingURL=seedRoomInventory.js.map