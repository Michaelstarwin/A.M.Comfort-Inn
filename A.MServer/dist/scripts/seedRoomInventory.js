"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../shared/lib/db");
function seedRoomInventory() {
    return __awaiter(this, void 0, void 0, function* () {
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
                yield db_1.db.roomInventory.upsert({
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
            yield db_1.db.$disconnect();
        }
    });
}
// Run the seed function
seedRoomInventory();
