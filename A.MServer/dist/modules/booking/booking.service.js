"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllBookings = getAllBookings;
exports.checkAvailability = checkAvailability;
exports.linkOrderToBooking = linkOrderToBooking;
exports.getAvailabilityStatus = getAvailabilityStatus;
exports.preBook = preBook;
exports.createOrder = createOrder;
exports.getBookingByReference = getBookingByReference;
exports.getBookingByOrderId = getBookingByOrderId;
exports.getRoomInventory = getRoomInventory;
exports.createRoomType = createRoomType;
exports.updateRoomType = updateRoomType;
exports.deleteRoomType = deleteRoomType;
exports.getBookingDetailsAdmin = getBookingDetailsAdmin;
exports.updateBookingStatus = updateBookingStatus;
exports.getAdminBookings = getAdminBookings;
exports.getAnalytics = getAnalytics;
exports.getRevenueAnalytics = getRevenueAnalytics;
exports.getOccupancyStats = getOccupancyStats;
exports.getTopRoomTypes = getTopRoomTypes;
const client_1 = require("@prisma/client");
const db_1 = require("../../shared/lib/db");
// --- Razorpay Configuration ---
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:7700';
async function computeHouseAvailability(checkInDateTime, checkOutDateTime) {
    // get all active room inventories (no longer filtering by 'standard'|'deluxe' — trust DB)
    const activeInventories = await db_1.db.roomInventory.findMany({
        where: { status: 'Active' },
        select: { roomType: true, totalRooms: true }
    });
    // total capacity = sum of totalRooms across inventories (fallback to 2)
    const totalRooms = activeInventories.reduce((sum, inv) => sum + (inv.totalRooms ?? 0), 0) || 2;
    const pendingBookingExpiryTime = new Date(Date.now() - 15 * 60 * 1000);
    const overlappingBookings = await db_1.db.booking.findMany({
        where: {
            checkInDate: { lt: checkOutDateTime },
            checkOutDate: { gt: checkInDateTime },
            OR: [
                { paymentStatus: client_1.BookingPaymentStatus.Success },
                {
                    paymentStatus: client_1.BookingPaymentStatus.Pending,
                    createdAt: { gt: pendingBookingExpiryTime },
                },
            ],
        },
        select: { roomType: true, roomCount: true },
    });
    let occupiedRooms = 0;
    let deluxeOccupied = false;
    for (const b of overlappingBookings) {
        const rt = (b.roomType || '').toLowerCase();
        if (rt === 'deluxe') {
            deluxeOccupied = true;
            occupiedRooms = totalRooms; // deluxe = exclusive booking
            break;
        }
        occupiedRooms += (b.roomCount ?? 0);
    }
    const standardRoomsAvailable = Math.max(totalRooms - occupiedRooms, 0);
    const deluxeAvailable = !deluxeOccupied && occupiedRooms === 0; // deluxe only available if nothing else occupies
    return { totalRooms, occupiedRooms, standardRoomsAvailable, deluxeAvailable };
}
// ✅ Added this function (for GET /api/bookings)
async function getAllBookings() {
    try {
        const bookings = await db_1.db.booking.findMany({
            orderBy: { createdAt: 'desc' },
            select: {
                bookingId: true,
                referenceNumber: true,
                roomType: true,
                roomCount: true,
                totalAmount: true,
                paymentStatus: true,
                checkInDate: true,
                checkOutDate: true,
                guestInfo: true,
            },
        });
        return bookings;
    }
    catch (error) {
        console.error('Error fetching all bookings:', error);
        throw new Error('Failed to fetch bookings');
    }
}
// --- Availability Check ---
async function checkAvailability(request) {
    const checkInDateTime = new Date(`${request.checkInDate}T${request.checkInTime}`);
    const checkOutDateTime = new Date(`${request.checkOutDate}T${request.checkOutTime}`);
    // case-insensitive lookup for roomType to avoid mismatch
    const roomInventory = await db_1.db.roomInventory.findFirst({
        where: { roomType: { equals: request.roomType, mode: 'insensitive' } },
    });
    if (!roomInventory || roomInventory.status !== 'Active') {
        return { isAvailable: false, totalAmount: 0, ratePerNight: 0, availableRooms: 0, message: 'This stay option is currently not available.' };
    }
    const durationMillis = checkOutDateTime.getTime() - checkInDateTime.getTime();
    const nights = Math.max(1, Math.ceil(durationMillis / (1000 * 60 * 60 * 24)));
    const houseState = await computeHouseAvailability(checkInDateTime, checkOutDateTime);
    const reqRoomType = request.roomType.trim().toLowerCase();
    const totalPax = request.adultCount + request.childCount;
    // --- DELUXE ROOM LOGIC ---
    if (reqRoomType === 'deluxe') {
        if (!houseState.deluxeAvailable) {
            return { isAvailable: false, totalAmount: 0, ratePerNight: 0, availableRooms: 0, nights, pricingMode: 'package', message: 'Conflict: The home is already booked for the selected dates.' };
        }
        // Deluxe Constraints
        // Max Guests: 10
        // Max Adults: 6
        if (totalPax > 10) {
            return { isAvailable: false, totalAmount: 0, ratePerNight: 0, availableRooms: 0, message: 'Max occupancy for Deluxe Room is 10 guests.' };
        }
        if (request.adultCount > 6) {
            return { isAvailable: false, totalAmount: 0, ratePerNight: 0, availableRooms: 0, message: 'Max adults allowed in Deluxe Room is 6.' };
        }
        // Pricing Rules
        // <= 8 guests: 4500
        // 9 guests: 5000
        // 10 guests: 5500
        let nightlyRate = 4500;
        if (totalPax === 9)
            nightlyRate = 5000;
        if (totalPax === 10)
            nightlyRate = 5500;
        const totalAmount = nightlyRate * nights;
        return {
            isAvailable: true,
            totalAmount,
            ratePerNight: nightlyRate,
            surchargePerNight: 0,
            availableRooms: houseState.totalRooms,
            nights,
            pricingMode: 'package',
            message: 'Success: The entire home is available for the selected dates.'
        };
    }
    // --- STANDARD ROOM LOGIC ---
    // Standard rooms are booked individually. 
    // However, the user's notes imply a "per room" logic or a "total" logic?
    // "If Adult 4, Max child 6" -> This implies 2 rooms (Total 10 capacity).
    // Let's assume the pricing rules apply PER ROOM.
    if (!houseState.deluxeAvailable && houseState.standardRoomsAvailable === 0) {
        return { isAvailable: false, totalAmount: 0, ratePerNight: 0, availableRooms: 0, nights, pricingMode: 'nightly', message: 'Conflict: The home is already booked for the selected dates.' };
    }
    const allowedStandardRooms = Math.min(houseState.standardRoomsAvailable, roomInventory.totalRooms ?? houseState.standardRoomsAvailable);
    if (allowedStandardRooms < request.roomCount) {
        return { isAvailable: false, totalAmount: 0, ratePerNight: 0, availableRooms: allowedStandardRooms, nights, pricingMode: 'nightly', message: allowedStandardRooms > 0 ? `Conflict: Only ${allowedStandardRooms} room(s) left for the selected dates.` : 'Conflict: The home is already booked for the selected dates.' };
    }
    // Validate Capacity Per Room
    // Max Guests per room: 5
    // Max Adults per room: 3
    const avgGuestsPerRoom = Math.ceil(totalPax / request.roomCount);
    const avgAdultsPerRoom = Math.ceil(request.adultCount / request.roomCount);
    if (avgGuestsPerRoom > 5) {
        return { isAvailable: false, totalAmount: 0, ratePerNight: 0, availableRooms: 0, message: 'Max occupancy is 5 guests per Standard Room.' };
    }
    if (avgAdultsPerRoom > 3) {
        return { isAvailable: false, totalAmount: 0, ratePerNight: 0, availableRooms: 0, message: 'Max adults allowed is 3 per Standard Room.' };
    }
    // Pricing Rules Per Room
    // <= 4 guests: 3000
    // 5 guests: 3500
    let totalNightlyRate = 0;
    // Distribute guests across rooms (simple distribution)
    let remainingPax = totalPax;
    for (let i = 0; i < request.roomCount; i++) {
        const guestsInThisRoom = Math.min(remainingPax, 5); // Fill up to 5
        // Actually, we should distribute evenly or assume worst case? 
        // Let's use the user's rule: "Total <= 8 => 4500" (for 2 rooms?)
        // Wait, the user notes for Standard Room say:
        // "Total <= 5"
        // "If <= 4 => 3000"
        // "If > 4 => 3500"
        // This seems to be PER ROOM.
        // However, if they book 2 rooms, the total capacity is 10.
        // The user notes for "Total <= 10" (2 rooms?)
        // "If <= 8 => 4500" (Wait, 3000+3000 = 6000? No, 4500 is cheaper?)
        // Ah, the notes say: "Total should be <= 10. If <= 8 => Rs 4500. If 9 => 5000. If 10 => 5500."
        // This matches the Deluxe pricing!
        // Did the user mean that booking 2 Standard Rooms = Deluxe Room pricing?
        // "Deluxe Room" description says "Entire home with two bedrooms".
        // So 2 Standard Rooms IS the Deluxe Room effectively?
        // Let's stick to the Per Room logic for 1 Standard Room, and the Deluxe logic for 2 Standard Rooms (if they select Deluxe).
        // If they select "Standard Room" x 2, should we apply the Deluxe pricing?
        // The user notes show "Standard Room" separate page.
        // "Default - 2 Adult 2 Child Rs 3000"
        // "Max Adult 3, Max Child 3"
        // "If Adult 3, Child Max 2"
        // "If Child 3, Adult Max 2"
        // "Total <= 5"
        // "If <= 4 => 3000"
        // "If > 4 => 3500"
        // So for Standard Room (1 Room):
        // <= 4: 3000
        // 5: 3500
        let roomPrice = 3000;
        if (guestsInThisRoom > 4)
            roomPrice = 3500; // This logic is tricky if we don't know exact distribution.
        // Let's assume:
        // If totalPax / roomCount > 4, then apply surcharge.
        // Or better: Calculate total base price and add surcharge for extra guests.
        // Actually, let's simplify:
        // Base price per room = 3000.
        // Capacity covered = 4 per room.
        // Extra guest charge = 500.
        // Total capacity covered by base price = 4 * roomCount.
        // Extra guests = Math.max(0, totalPax - (4 * roomCount));
        // Total Price = (3000 * roomCount) + (500 * Extra guests)
        // Let's verify with "5 guests":
        // 1 Room: 3000 + 500*1 = 3500. Correct.
        // What if 2 Rooms, 9 guests?
        // Base: 3000*2 = 6000.
        // Covered: 8.
        // Extra: 1.
        // Total: 6500.
        // BUT Deluxe price for 9 guests is 5000.
        // So booking 2 Standard Rooms is MORE EXPENSIVE than Deluxe. This makes sense.
        // Deluxe is a "package" deal.
        // So, for Standard Room selection, we use the Standard Room rules strictly.
        totalNightlyRate = (3000 * request.roomCount) + (Math.max(0, totalPax - (4 * request.roomCount)) * 500);
        remainingPax -= guestsInThisRoom; // Not really used in this simplified formula
        break; // We calculated total directly
    }
    const totalAmount = totalNightlyRate * nights;
    return {
        isAvailable: true,
        totalAmount,
        ratePerNight: totalNightlyRate,
        surchargePerNight: 0,
        availableRooms: allowedStandardRooms,
        nights,
        pricingMode: 'nightly',
        message: `Success: ${allowedStandardRooms} room(s) are currently available.`
    };
}
async function linkOrderToBooking(bookingId, orderId) {
    try {
        return await db_1.db.booking.update({
            where: { bookingId },
            data: { paymentOrderId: orderId, paymentStatus: client_1.BookingPaymentStatus.Pending, updatedAt: new Date() }
        });
    }
    catch (e) {
        if (e?.code === 'P2002') {
            // unique constraint on paymentOrderId — handle gracefully
            console.warn('OrderId already linked to another booking', orderId);
            throw new Error('Order already linked');
        }
        throw e;
    }
}
async function getAvailabilityStatus(request) {
    const checkInTime = request.checkInTime ?? '12:00:00';
    const checkOutTime = request.checkOutTime ?? '11:00:00';
    const checkInDateTime = new Date(`${request.checkInDate}T${checkInTime}`);
    const checkOutDateTime = new Date(`${request.checkOutDate}T${checkOutTime}`);
    const state = await computeHouseAvailability(checkInDateTime, checkOutDateTime);
    return {
        totalRooms: state.totalRooms,
        occupiedRooms: state.occupiedRooms,
        standardRoomsAvailable: state.standardRoomsAvailable,
        deluxeAvailable: state.deluxeAvailable,
    };
}
// --- PreBook ---
async function preBook(request) {
    const availability = await checkAvailability(request);
    if (!availability.isAvailable) {
        return { success: false, code: 'NO_AVAILABILITY', message: availability.message, details: availability };
    }
    const roomInventory = await db_1.db.roomInventory.findFirstOrThrow({
        where: { roomType: { equals: request.roomType, mode: 'insensitive' } }
    });
    const { guestInfo, userId, adultCount, childCount } = request;
    // Build explicit payload for Prisma create to avoid passing unexpected fields
    const bookingPayload = {
        guestInfo: { ...(guestInfo || {}), adultCount, childCount },
        userId: userId || undefined,
        checkInDate: new Date(`${request.checkInDate}T${request.checkInTime}`),
        checkInTime: request.checkInTime,
        checkOutDate: new Date(`${request.checkOutDate}T${request.checkOutTime}`),
        checkOutTime: request.checkOutTime,
        roomCount: request.roomCount,
        roomType: request.roomType,
        totalAmount: availability.totalAmount,
        roomInventoryId: roomInventory.roomId,
        paymentStatus: client_1.BookingPaymentStatus.Pending,
    };
    // Consider wrapping the create in a transaction if you later will immediately create payment order
    const booking = await db_1.db.booking.create({ data: bookingPayload });
    return { success: true, bookingId: booking.bookingId, totalAmount: booking.totalAmount };
}
// --- Create Order (Razorpay Integration) ---
async function createOrder(request) {
    const booking = await db_1.db.booking.findUniqueOrThrow({ where: { bookingId: request.bookingId } });
    if (booking.paymentStatus !== client_1.BookingPaymentStatus.Pending) {
        return { success: false, message: 'This booking is not pending and cannot create a payment order.' };
    }
    const guestInfo = booking.guestInfo;
    if (!guestInfo?.email || !guestInfo?.phone || !guestInfo?.fullName) {
        return { success: false, message: 'Booking is missing required guest details (email, phone, name).' };
    }
    // Return booking metadata for the payment route to create Razorpay order
    return { success: true, bookingId: booking.bookingId, amount: booking.totalAmount, currency: 'INR', guestName: guestInfo.fullName, guestEmail: guestInfo.email };
}
// --- Get Booking by Reference ---
async function getBookingByReference(referenceNumber) {
    const booking = await db_1.db.booking.findUnique({
        where: { referenceNumber },
        select: {
            bookingId: true,
            referenceNumber: true,
            checkInDate: true,
            checkOutDate: true,
            roomType: true,
            roomCount: true,
            totalAmount: true,
            paymentStatus: true,
            guestInfo: true,
        },
    });
    if (!booking) {
        return null;
    }
    // Format the booking data to include time strings
    return {
        ...booking,
        checkInTime: formatTimeFromDate(booking.checkInDate),
        checkOutTime: formatTimeFromDate(booking.checkOutDate),
    };
}
// Helper function to format time from DateTime
function formatTimeFromDate(date) {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');
    return `${displayHours}:${displayMinutes} ${ampm}`;
}
async function getBookingByOrderId(orderId) {
    const booking = await db_1.db.booking.findFirst({
        where: { paymentOrderId: orderId },
        include: { roomInventory: true, user: true },
    });
    if (!booking) {
        return null;
    }
    // Format the booking data to include time strings
    return {
        ...booking,
        checkInTime: formatTimeFromDate(booking.checkInDate),
        checkOutTime: formatTimeFromDate(booking.checkOutDate),
    };
}
// --- Admin Room Inventory ---
async function getRoomInventory() {
    try {
        return await db_1.db.roomInventory.findMany({ orderBy: { roomType: 'asc' } });
    }
    catch (err) {
        if (err?.code === 'P2022') {
            return db_1.db.roomInventory.findMany({
                select: { roomId: true, roomType: true, totalRooms: true, currentRate: true, status: true, createdAt: true, updatedAt: true },
                orderBy: { roomType: 'asc' },
            });
        }
        throw err;
    }
}
async function createRoomType(data) {
    if (!data || typeof data.roomType !== 'string' || data.roomType.trim() === '') {
        throw new Error('roomType is required and must be a non-empty string.');
    }
    if (typeof data.totalRooms !== 'number' || Number.isNaN(data.totalRooms)) {
        throw new Error('totalRooms is required and must be a valid integer.');
    }
    if (typeof data.currentRate !== 'number' || Number.isNaN(data.currentRate)) {
        throw new Error('currentRate is required and must be a valid number.');
    }
    const payload = {
        roomType: data.roomType.trim(),
        totalRooms: data.totalRooms,
        currentRate: data.currentRate,
        status: data.status || 'Active',
    };
    if (data.description !== undefined)
        payload.description = data.description;
    if (data.imageUrl !== undefined)
        payload.imageUrl = data.imageUrl;
    return db_1.db.roomInventory.create({ data: payload });
}
async function updateRoomType(roomId, data) {
    const updatePayload = {};
    if (data.roomType !== undefined)
        updatePayload.roomType = data.roomType;
    if (data.totalRooms !== undefined)
        updatePayload.totalRooms = data.totalRooms;
    if (data.currentRate !== undefined)
        updatePayload.currentRate = data.currentRate;
    if (data.status !== undefined)
        updatePayload.status = data.status;
    if (data.description !== undefined)
        updatePayload.description = data.description;
    if (data.imageUrl !== undefined)
        updatePayload.imageUrl = data.imageUrl;
    if (Object.keys(updatePayload).length === 0) {
        throw new Error('No valid fields provided to update.');
    }
    return db_1.db.roomInventory.update({
        where: { roomId },
        data: updatePayload,
    });
}
async function deleteRoomType(roomId) {
    return db_1.db.roomInventory.update({
        where: { roomId },
        data: { status: 'Inactive' },
    });
}
// --- Admin Bookings ---
async function getBookingDetailsAdmin(bookingId) {
    return db_1.db.booking.findUniqueOrThrow({
        where: { bookingId },
        include: {
            roomInventory: true,
            user: true,
        },
    });
}
async function updateBookingStatus(bookingId, status) {
    const paymentStatus = status;
    if (!Object.values(client_1.BookingPaymentStatus).includes(paymentStatus)) {
        throw new Error('Invalid booking status supplied.');
    }
    return db_1.db.booking.update({
        where: { bookingId },
        data: { paymentStatus, updatedAt: new Date() },
    });
}
async function getAdminBookings(filters) {
    const { status, search, page, limit } = filters;
    const skip = (page - 1) * limit;
    const where = {};
    if (status && status !== 'All')
        where.paymentStatus = status;
    if (search) {
        where.OR = [
            { guestInfo: { path: ['fullName'], string_contains: search } },
            { guestInfo: { path: ['email'], string_contains: search } },
        ];
    }
    const [bookings, total] = await Promise.all([
        db_1.db.booking.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: { roomInventory: true, user: true },
        }),
        db_1.db.booking.count({ where }),
    ]);
    return { data: bookings, total, page, limit, pages: Math.ceil(total / limit) };
}
// --- Analytics ---
async function getAnalytics(period = 'month') {
    const dateRange = getDateRangeForPeriod(period);
    const bookings = await db_1.db.booking.findMany({
        where: { createdAt: { gte: dateRange.startDate, lte: dateRange.endDate } },
    });
    const successfulBookings = bookings.filter(b => b.paymentStatus === client_1.BookingPaymentStatus.Success).length;
    const failedBookings = bookings.filter(b => b.paymentStatus === client_1.BookingPaymentStatus.Failed).length;
    const pendingBookings = bookings.filter(b => b.paymentStatus === client_1.BookingPaymentStatus.Pending).length;
    const refundedBookings = bookings.filter(b => b.paymentStatus === client_1.BookingPaymentStatus.Refunded).length;
    const totalRevenue = bookings
        .filter(b => b.paymentStatus === client_1.BookingPaymentStatus.Success)
        .reduce((sum, b) => sum + b.totalAmount, 0);
    return {
        totalBookings: bookings.length,
        successfulBookings,
        failedBookings,
        pendingBookings,
        refundedBookings,
        totalRevenue,
    };
}
async function getRevenueAnalytics(period = 'month') {
    const dateRange = getDateRangeForPeriod(period);
    const bookings = await db_1.db.booking.findMany({
        where: {
            paymentStatus: client_1.BookingPaymentStatus.Success,
            createdAt: { gte: dateRange.startDate, lte: dateRange.endDate },
        },
        orderBy: { createdAt: 'asc' },
    });
    const revenueByDate = {};
    bookings.forEach(b => {
        const date = b.createdAt.toISOString().split('T')[0];
        revenueByDate[date] = (revenueByDate[date] || 0) + b.totalAmount;
    });
    const chartData = Object.entries(revenueByDate).map(([date, revenue]) => ({ date, revenue: Math.round(revenue) }));
    const totalRevenue = bookings.reduce((sum, b) => sum + b.totalAmount, 0);
    return { totalRevenue, chartData, bookingCount: bookings.length };
}
async function getOccupancyStats() {
    const rooms = await db_1.db.roomInventory.findMany();
    const bookings = await db_1.db.booking.findMany({ where: { paymentStatus: client_1.BookingPaymentStatus.Success } });
    const totalRoomCapacity = rooms.reduce((sum, r) => sum + r.totalRooms, 0);
    const bookedRooms = bookings.reduce((sum, b) => sum + b.roomCount, 0);
    const occupancyRate = totalRoomCapacity > 0 ? (bookedRooms / totalRoomCapacity) * 100 : 0;
    return {
        occupancyRate,
        totalCapacity: totalRoomCapacity,
        occupiedRooms: bookedRooms,
        availableRooms: totalRoomCapacity - bookedRooms,
    };
}
async function getTopRoomTypes() {
    const bookings = await db_1.db.booking.findMany({ where: { paymentStatus: client_1.BookingPaymentStatus.Success } });
    const roomStats = {};
    bookings.forEach(b => {
        if (!roomStats[b.roomType])
            roomStats[b.roomType] = { bookings: 0, revenue: 0 };
        roomStats[b.roomType].bookings += 1;
        roomStats[b.roomType].revenue += b.totalAmount;
    });
    return Object.entries(roomStats)
        .map(([roomType, stats]) => ({ roomType, ...stats }))
        .sort((a, b) => b.bookings - a.bookings)
        .slice(0, 5);
}
function getDateRangeForPeriod(period) {
    const endDate = new Date();
    const startDate = new Date();
    switch (period) {
        case 'week':
            startDate.setDate(endDate.getDate() - 7);
            break;
        case 'month':
            startDate.setMonth(endDate.getMonth() - 1);
            break;
        case 'quarter':
            startDate.setMonth(endDate.getMonth() - 3);
            break;
        case 'year':
            startDate.setFullYear(endDate.getFullYear() - 1);
            break;
        default:
            startDate.setMonth(endDate.getMonth() - 1);
    }
    return { startDate, endDate };
}
//# sourceMappingURL=booking.service.js.map