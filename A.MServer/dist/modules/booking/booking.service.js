"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkAvailability = checkAvailability;
exports.preBook = preBook;
exports.createOrder = createOrder;
exports.handleCashfreeWebhook = handleCashfreeWebhook;
exports.getBookingByReference = getBookingByReference;
exports.getRoomInventory = getRoomInventory;
exports.createRoomType = createRoomType;
exports.updateRoomType = updateRoomType;
exports.deleteRoomType = deleteRoomType;
exports.getAdminBookings = getAdminBookings;
exports.getBookingDetailsAdmin = getBookingDetailsAdmin;
exports.updateBookingStatus = updateBookingStatus;
exports.getAnalytics = getAnalytics;
exports.getRevenueAnalytics = getRevenueAnalytics;
exports.getOccupancyStats = getOccupancyStats;
exports.getTopRoomTypes = getTopRoomTypes;
const client_1 = require("@prisma/client"); // Keep this if db isn't globally available, otherwise remove
const db_1 = require("../../shared/lib/db"); // Use the shared instance
// --- Razorpay Configuration ---
// Using Razorpay for payment processing
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:7700';
// --- Availability Check (Looks OK, uses 'db' now) ---
async function checkAvailability(request) {
    const checkInDateTime = new Date(`${request.checkInDate}T${request.checkInTime}`);
    const checkOutDateTime = new Date(`${request.checkOutDate}T${request.checkOutTime}`);
    // Use shared 'db' instance
    const roomInventory = await db_1.db.roomInventory.findUnique({
        where: { roomType: request.roomType },
    });
    if (!roomInventory || roomInventory.status !== 'Active') {
        return { isAvailable: false, totalAmount: 0, ratePerNight: 0, message: 'This room type is currently not available.' };
    }
    const pendingBookingExpiryTime = new Date(Date.now() - 15 * 60 * 1000); // 15 minutes ago
    const overlappingBookings = await db_1.db.booking.findMany({
        where: {
            roomType: request.roomType,
            checkInDate: { lt: checkOutDateTime },
            checkOutDate: { gt: checkInDateTime },
            OR: [
                {
                    paymentStatus: client_1.BookingPaymentStatus.Success,
                },
                {
                    paymentStatus: client_1.BookingPaymentStatus.Pending,
                    createdAt: {
                        gt: pendingBookingExpiryTime,
                    },
                },
            ],
        },
    });
    const bookedRoomsCount = overlappingBookings.reduce((sum, booking) => sum + booking.roomCount, 0);
    const availableRooms = roomInventory.totalRooms - bookedRoomsCount;
    const isAvailable = availableRooms >= request.roomCount;
    // Ensure nights calculation handles edge cases (e.g., same day checkout) correctly
    const durationMillis = checkOutDateTime.getTime() - checkInDateTime.getTime();
    const nights = Math.max(1, Math.ceil(durationMillis / (1000 * 60 * 60 * 24))); // Ensure at least 1 night
    const totalAmount = isAvailable ? roomInventory.currentRate * request.roomCount * nights : 0;
    return {
        isAvailable,
        totalAmount,
        ratePerNight: roomInventory.currentRate,
        message: isAvailable ? `Success: ${availableRooms} room(s) available.` : `Conflict: Only ${availableRooms} room(s) available.`,
    };
}
// --- PreBook (Looks OK, uses 'db') ---
async function preBook(request) {
    const availability = await checkAvailability(request);
    if (!availability.isAvailable) {
        throw new Error(availability.message || 'Rooms are no longer available for the selected dates.'); // Use message from check
    }
    const roomInventory = await db_1.db.roomInventory.findUniqueOrThrow({ where: { roomType: request.roomType } });
    // Extract guestInfo separately to avoid spreading potentially undefined userId
    const { guestInfo, userId, ...restOfRequest } = request;
    const booking = await db_1.db.booking.create({
        data: {
            ...restOfRequest, // Spread validated fields like dates, roomCount etc.
            guestInfo: guestInfo, // Assign guestInfo object
            userId: userId, // Assign optional userId
            checkInDate: new Date(`${request.checkInDate}T${request.checkInTime}`),
            checkOutDate: new Date(`${request.checkOutDate}T${request.checkOutTime}`),
            totalAmount: availability.totalAmount, // Already checked for > 0 in availability
            roomInventoryId: roomInventory.roomId,
            paymentStatus: client_1.BookingPaymentStatus.Pending,
        },
    });
    return {
        bookingId: booking.bookingId,
        totalAmount: booking.totalAmount,
    };
}
// --- Create Order (Razorpay Integration) ---
async function createOrder(request) {
    const booking = await db_1.db.booking.findUniqueOrThrow({
        where: { bookingId: request.bookingId },
    });
    if (booking.paymentStatus !== client_1.BookingPaymentStatus.Pending) {
        throw new Error('This booking is not pending and cannot create a payment order.');
    }
    // Type assertion for guestInfo
    const guestInfo = booking.guestInfo;
    if (!guestInfo?.email || !guestInfo?.phone || !guestInfo?.fullName) {
        throw new Error('Booking is missing required guest details (email, phone, name).');
    }
    // NOTE: Razorpay order creation is now handled in the payment.route.ts
    // This function validates the booking state before initiating payment
    return {
        bookingId: request.bookingId,
        amount: booking.totalAmount,
        currency: 'INR',
        guestName: guestInfo.fullName,
        guestEmail: guestInfo.email,
    };
}
// --- Webhook Handler Placeholder ---
// NOTE: Razorpay webhook handling is now done in razorpay.service.ts
// This placeholder is kept for API route compatibility
async function handleCashfreeWebhook(rawBody, headers) {
    console.log("Webhook received. Processing by Razorpay service...");
    // Razorpay webhooks are handled in payment.route.ts with RazorpayService
    return { success: true };
}
// --- Get Booking by Reference (Looks OK, uses 'db') ---
async function getBookingByReference(referenceNumber) {
    return db_1.db.booking.findUnique({
        where: { referenceNumber },
        select: { referenceNumber: true, checkInDate: true, checkOutDate: true, roomType: true, roomCount: true, totalAmount: true, paymentStatus: true, guestInfo: true }
    });
}
// --- Admin Services (Looks OK, uses 'db') ---
async function getRoomInventory() {
    try {
        return await db_1.db.roomInventory.findMany({ orderBy: { roomType: 'asc' } });
    }
    catch (err) {
        // If DB doesn't have description column (P2022), fallback to selecting known columns only
        if (err?.code === 'P2022') {
            return db_1.db.roomInventory.findMany({
                // Select only columns that are guaranteed to exist on older schemas
                select: { roomId: true, roomType: true, totalRooms: true, currentRate: true, status: true, createdAt: true, updatedAt: true },
                orderBy: { roomType: 'asc' },
            });
        }
        throw err;
    }
}
async function createRoomType(data) {
    // Validate required fields server-side to provide clearer errors when client submits malformed data
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
    // Add check to ensure roomType doesn't already exist?
    return db_1.db.roomInventory.create({ data: payload });
}
async function updateRoomType(roomId, data) {
    // Prevent accidental updates with empty payloads or invalid values
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
// --- Admin Booking Management ---
async function getAdminBookings(filters) {
    const { status, search, page, limit } = filters;
    const skip = (page - 1) * limit;
    const where = {};
    if (status && status !== 'All') {
        where.paymentStatus = status;
    }
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
    return {
        data: bookings,
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
    };
}
async function getBookingDetailsAdmin(bookingId) {
    const booking = await db_1.db.booking.findUnique({
        where: { bookingId },
        include: { roomInventory: true, user: true },
    });
    if (!booking) {
        throw new Error('Booking not found');
    }
    return booking;
}
async function updateBookingStatus(bookingId, status) {
    // Validate status
    const validStatuses = ['Pending', 'Success', 'Failed', 'Refunded'];
    if (!validStatuses.includes(status)) {
        throw new Error(`Invalid status: ${status}`);
    }
    const booking = await db_1.db.booking.update({
        where: { bookingId },
        data: { paymentStatus: status, updatedAt: new Date() },
    });
    return booking;
}
// --- Analytics Services ---
async function getAnalytics(period = 'month') {
    const dateRange = getDateRangeForPeriod(period);
    const bookings = await db_1.db.booking.findMany({
        where: {
            createdAt: {
                gte: dateRange.startDate,
                lte: dateRange.endDate,
            },
        },
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
        averageRating: 4.5, // Placeholder if ratings implemented
        bookingsByStatus: {
            success: successfulBookings,
            failed: failedBookings,
            pending: pendingBookings,
            refunded: refundedBookings,
        },
    };
}
async function getRevenueAnalytics(period = 'month') {
    const dateRange = getDateRangeForPeriod(period);
    const bookings = await db_1.db.booking.findMany({
        where: {
            paymentStatus: client_1.BookingPaymentStatus.Success,
            createdAt: {
                gte: dateRange.startDate,
                lte: dateRange.endDate,
            },
        },
        orderBy: { createdAt: 'asc' },
    });
    // Create daily revenue chart data
    const revenueByDate = {};
    bookings.forEach(booking => {
        const date = booking.createdAt.toISOString().split('T')[0];
        revenueByDate[date] = (revenueByDate[date] || 0) + booking.totalAmount;
    });
    const chartData = Object.entries(revenueByDate).map(([date, revenue]) => ({
        date,
        revenue: Math.round(revenue),
    }));
    const totalRevenue = bookings.reduce((sum, b) => sum + b.totalAmount, 0);
    return {
        totalRevenue,
        chartData,
        bookingCount: bookings.length,
    };
}
async function getOccupancyStats() {
    const rooms = await db_1.db.roomInventory.findMany();
    const bookings = await db_1.db.booking.findMany({
        where: {
            paymentStatus: client_1.BookingPaymentStatus.Success,
        },
    });
    const totalRoomCapacity = rooms.reduce((sum, r) => sum + r.totalRooms, 0);
    const bookedRooms = bookings.reduce((sum, b) => sum + b.roomCount, 0);
    const occupancyRate = totalRoomCapacity > 0 ? (bookedRooms / totalRoomCapacity) * 100 : 0;
    return {
        occupancyRate: occupancyRate, // ← Return as NUMBER, not string
        totalCapacity: totalRoomCapacity,
        occupiedRooms: bookedRooms,
        availableRooms: totalRoomCapacity - bookedRooms,
        data: [
            { name: 'Occupied', value: Math.round(occupancyRate) },
            { name: 'Available', value: Math.round(100 - occupancyRate) },
        ],
    };
}
async function getTopRoomTypes() {
    const bookings = await db_1.db.booking.findMany({
        where: { paymentStatus: client_1.BookingPaymentStatus.Success },
    });
    const roomStats = {};
    bookings.forEach(booking => {
        if (!roomStats[booking.roomType]) {
            roomStats[booking.roomType] = { bookings: 0, revenue: 0 };
        }
        roomStats[booking.roomType].bookings += 1;
        roomStats[booking.roomType].revenue += booking.totalAmount;
    });
    const topRooms = Object.entries(roomStats)
        .map(([roomType, stats]) => ({
        roomType,
        ...stats,
    }))
        .sort((a, b) => b.bookings - a.bookings)
        .slice(0, 5);
    return topRooms;
}
// Helper function for date ranges
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
