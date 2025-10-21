import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { CheckAvailabilityRequest, PreBookRequest, CreateOrderRequest, CreateRoomRequest, UpdateRoomRequest } from './booking.validation';
import { db } from '../../shared/lib/db';

const prisma = new PrismaClient();
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY || 'your-default-secret-key';

// FR 3.1: Availability Check API
export async function checkAvailability(request: CheckAvailabilityRequest) {
    const checkInDateTime = new Date(`${request.checkInDate}T${request.checkInTime}`);
    const checkOutDateTime = new Date(`${request.checkOutDate}T${request.checkOutTime}`);

    const roomInventory = await prisma.roomInventory.findUnique({
        where: { roomType: request.roomType },
    });

    if (!roomInventory || roomInventory.status !== 'Active') {
        // Explicitly return a totalAmount to ensure type consistency
        return { isAvailable: false, totalAmount: 0, ratePerNight: 0, message: 'This room type is currently not available.' };
    }

    const overlappingBookings = await db.booking.findMany({
        where: {
            roomType: request.roomType,
            paymentStatus: { in: ['Success', 'Pending'] },
            checkInDate: { lt: checkOutDateTime },
            checkOutDate: { gt: checkInDateTime },
        },
    });

    const bookedRoomsCount = overlappingBookings.reduce((sum, booking) => sum + booking.roomCount, 0);
    const availableRooms = roomInventory.totalRooms - bookedRoomsCount;
    
    const isAvailable = availableRooms >= request.roomCount;
    const nights = Math.ceil((checkOutDateTime.getTime() - checkInDateTime.getTime()) / (1000 * 60 * 60 * 24));
    const totalAmount = isAvailable ? roomInventory.currentRate * request.roomCount * nights : 0;

    return {
        isAvailable,
        totalAmount,
        ratePerNight: roomInventory.currentRate,
        message: isAvailable ? `Success: ${availableRooms} room(s) available.` : `Conflict: Only ${availableRooms} room(s) available.`,
    };
}

// FR 3.2: Guest Information and Pre-Booking
export async function preBook(request: PreBookRequest) {
    const availability = await checkAvailability(request);
    if (!availability.isAvailable) {
        throw new Error('Rooms are no longer available for the selected dates.');
    }

    const roomInventory = await db.roomInventory.findUniqueOrThrow({ where: { roomType: request.roomType } });

    const booking = await db.booking.create({
        data: {
            ...request,
            checkInDate: new Date(`${request.checkInDate}T${request.checkInTime}`),
            checkOutDate: new Date(`${request.checkOutDate}T${request.checkOutTime}`),
            // FIX: Ensure totalAmount is not undefined. Using a fallback to 0.
            totalAmount: availability.totalAmount ?? 0,
            roomInventoryId: roomInventory.roomId,
            paymentStatus: 'Pending',
        },
    });

    return {
        bookingId: booking.bookingId,
        totalAmount: booking.totalAmount,
    };
}

// FR 3.3: Cashfree Payment Gateway Integration
export async function createOrder(request: CreateOrderRequest) {
    const booking = await db.booking.findUniqueOrThrow({
        where: { bookingId: request.bookingId },
    });

    if (booking.paymentStatus !== 'Pending') {
        throw new Error('This booking is not pending and a payment order cannot be created.');
    }

    const cashfreeOrderId = `BOOK_${booking.bookingId.substring(0, 8)}_${Date.now()}`;
    
    await db.booking.update({
        where: { bookingId: request.bookingId },
        data: { cashfreeOrderId },
    });
    
    const guestInfo = booking.guestInfo as { email: string, phone: string };

    const orderPayload = {
        order_id: cashfreeOrderId,
        order_amount: booking.totalAmount,
        order_currency: "INR",
        customer_details: {
            customer_id: booking.userId || `guest_${booking.bookingId}`,
            customer_email: guestInfo.email,
            customer_phone: guestInfo.phone,
        },
        order_meta: {
            return_url: `${process.env.FRONTEND_URL}/booking/{order_id}/status`,
        }
    };

    const signature = crypto.createHmac('sha256', CASHFREE_SECRET_KEY)
                            .update(JSON.stringify(orderPayload))
                            .digest('hex');

    return { ...orderPayload, signature };
}

// FR 3.4: Payment Confirmation via Webhook
export async function handleCashfreeWebhook(payload: any, signature: string) {
    // CRITICAL: Implement actual signature verification from Cashfree docs
    // const isValid = verifyCashfreeSignature(payload, signature);
    // if (!isValid) throw new Error("Unauthorized: Invalid webhook signature");

    const { order_id, order_status } = payload.data;

    const booking = await db.booking.findUniqueOrThrow({ where: { cashfreeOrderId: order_id } });

    const paymentStatus = (order_status === 'PAID') ? 'Success' : 'Failed';
    const referenceNumber = (order_status === 'PAID') ? `AMCI-${Date.now()}` : null;

    const [updatedBooking] = await db.$transaction([
        db.booking.update({
            where: { bookingId: booking.bookingId },
            data: { paymentStatus, referenceNumber },
        }),
        db.paymentTransaction.create({
            data: {
                cashfreeOrderId: order_id,
                bookingId: booking.bookingId,
                transactionId: payload.data.payment_details.payment_id,
                paymentMode: payload.data.payment_details.payment_method,
                amount: booking.totalAmount,
                status: (order_status === 'PAID') ? 'Received' : 'Failed',
                gatewayResponsePayload: payload,
            },
        }),
    ]);
    
    if(updatedBooking.paymentStatus === 'Success') {
        console.log(`Sending booking confirmation for ${updatedBooking.bookingId}`);
    }
}

// Get Booking by Reference Number
export async function getBookingByReference(referenceNumber: string) {
    return db.booking.findUnique({
        where: { referenceNumber },
        select: { referenceNumber: true, checkInDate: true, checkOutDate: true, roomType: true, roomCount: true, totalAmount: true, paymentStatus: true, guestInfo: true }
    });
}

// --- Admin Services ---

// FR 3.6: Get Room Inventory
export async function getRoomInventory() {
    return db.roomInventory.findMany({ orderBy: { roomType: 'asc' } });
}

// FR 3.6: Create Room Type
export async function createRoomType(data: CreateRoomRequest) {
    return db.roomInventory.create({ data });
}

// FR 3.6: Update Room Type
export async function updateRoomType(roomId: string, data: UpdateRoomRequest) {
    return db.roomInventory.update({
        where: { roomId },
        data,
    });
}

// FR 3.6: Delete Room Type (Logical)
export async function deleteRoomType(roomId: string) {
    return db.roomInventory.update({
        where: { roomId },
        data: { status: 'Inactive' },
    });
}

