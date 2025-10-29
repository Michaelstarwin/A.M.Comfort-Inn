import { PrismaClient } from '@prisma/client'; // Keep this if db isn't globally available, otherwise remove
import crypto from 'crypto';
import { CheckAvailabilityRequest, PreBookRequest, CreateOrderRequest, CreateRoomRequest, UpdateRoomRequest } from './booking.validation';
import { db } from '../../shared/lib/db'; // Use the shared instance
import { sendBookingConfirmationEmail } from '../../shared/lib/utils/sendEmail';

// --- Read ALL credentials from .env ---
// Ensure these variable names EXACTLY match your .env file
const CASHFREE_API_ID = process.env.CASHFREE_API_ID;
const CASHFREE_SECRET_KEY = process.env.CASHFREE_API_SECRET;
const CASHFREE_WEBHOOK_SECRET = process.env.CASHFREE_WEBHOOK_SECRET;
const CASHFREE_API_URL = process.env.CASHFREE_API_URL; // Read the URL from .env
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'; // Use consistent frontend URL
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:7700'; // Define backend URL for webhook

// --- REMOVED: const prisma = new PrismaClient(); ---

// --- Availability Check (Looks OK, uses 'db' now) ---
export async function checkAvailability(request: CheckAvailabilityRequest) {
    const checkInDateTime = new Date(`${request.checkInDate}T${request.checkInTime}`);
    const checkOutDateTime = new Date(`${request.checkOutDate}T${request.checkOutTime}`);

    // Use shared 'db' instance
    const roomInventory = await db.roomInventory.findUnique({
        where: { roomType: request.roomType },
    });

    if (!roomInventory || roomInventory.status !== 'Active') {
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
export async function preBook(request: PreBookRequest) {
    const availability = await checkAvailability(request);
    if (!availability.isAvailable) {
        throw new Error(availability.message || 'Rooms are no longer available for the selected dates.'); // Use message from check
    }

    const roomInventory = await db.roomInventory.findUniqueOrThrow({ where: { roomType: request.roomType } });

    // Extract guestInfo separately to avoid spreading potentially undefined userId
    const { guestInfo, userId, ...restOfRequest } = request;

    const booking = await db.booking.create({
        data: {
            ...restOfRequest, // Spread validated fields like dates, roomCount etc.
            guestInfo: guestInfo, // Assign guestInfo object
            userId: userId, // Assign optional userId
            checkInDate: new Date(`${request.checkInDate}T${request.checkInTime}`),
            checkOutDate: new Date(`${request.checkOutDate}T${request.checkOutTime}`),
            totalAmount: availability.totalAmount, // Already checked for > 0 in availability
            roomInventoryId: roomInventory.roomId,
            paymentStatus: 'Pending',
        },
    });

    return {
        bookingId: booking.bookingId,
        totalAmount: booking.totalAmount,
    };
}

// --- Create Order (CRITICAL FIXES HERE) ---
export async function createOrder(request: CreateOrderRequest) {
    // Check if configuration is loaded
    if (!CASHFREE_API_URL || !CASHFREE_API_ID || !CASHFREE_SECRET_KEY) {
      console.error("Cashfree environment variables (URL, ID, Secret) are not set!");
      throw new Error("Payment gateway configuration error. Please contact support.");
    }

    const booking = await db.booking.findUniqueOrThrow({
        where: { bookingId: request.bookingId },
    });

    if (booking.paymentStatus !== 'Pending') {
        throw new Error('This booking is not pending and cannot create a payment order.');
    }
    
    // Type assertion for guestInfo (consider defining a type/interface)
    const guestInfo = booking.guestInfo as { email: string, phone: string, fullName: string }; 
    if (!guestInfo?.email || !guestInfo?.phone || !guestInfo?.fullName) {
        throw new Error('Booking is missing required guest details (email, phone, name).');
    }

    const internalOrderId = `BOOK_${booking.bookingId.substring(0, 8)}_${Date.now()}`;

    const orderPayload = {
        order_id: internalOrderId,
        order_amount: booking.totalAmount,
        order_currency: "INR",
        customer_details: {
            customer_id: booking.userId || `guest_${booking.bookingId}`,
            customer_email: guestInfo.email,
            customer_phone: guestInfo.phone,
            customer_name: guestInfo.fullName, // Add customer name
        },
        order_meta: {
            return_url: `${FRONTEND_URL}/booking/payment-status?order_id=${internalOrderId}`, // Use internal order ID
        },
         order_notify_url: `${BACKEND_URL}/api/bookings/payment/cashfree-webhook`, // Add webhook URL
    };

    try {
        // --- USE process.env variable for URL ---
        const cashfreeResponse = await fetch(CASHFREE_API_URL, { 
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-version': '2023-08-01', // Use a recent, valid version
                'x-client-id': CASHFREE_API_ID, // Use correct variable from .env
                'x-client-secret': CASHFREE_SECRET_KEY, // Use correct variable from .env
            },
            body: JSON.stringify(orderPayload),
        });

        if (!cashfreeResponse.ok) {
            const errorBody = await cashfreeResponse.text(); // Get error details
            console.error("Cashfree API Error Response:", errorBody);
            // Throw specific error for Unauthorized
            if (cashfreeResponse.status === 401) {
                 throw new Error(`Cashfree API error (${cashfreeResponse.status}): Unauthorized. Check API Keys/Environment.`);
            }
            throw new Error(`Cashfree API error (${cashfreeResponse.status}): ${cashfreeResponse.statusText}`);
        }

        const cashfreeData = await cashfreeResponse.json();

        // Check if essential data is present
        if (!cashfreeData.payment_session_id || !cashfreeData.order_id) {
             console.error("Cashfree response missing payment_session_id or order_id:", cashfreeData);
             throw new Error("Invalid response received from payment gateway.");
        }

        // --- Store the ACTUAL order_id returned by Cashfree for webhook ---
        await db.booking.update({
            where: { bookingId: request.bookingId },
            data: { cashfreeOrderId: cashfreeData.order_id }, 
        });

        // --- Return only the session ID needed by frontend ---
        return {
            payment_session_id: cashfreeData.payment_session_id,
        };

    } catch (error: any) {
        console.error("Error during Cashfree order creation:", error);
        // Rethrow specific known errors or a generic one
        if (error.message.startsWith("Cashfree API error")) {
            throw error; // Rethrow specific Cashfree errors
        }
        throw new Error("Failed to create payment order due to an internal error.");
    }
}


// --- Corrected Webhook Signature Verification ---
// This function matches Cashfree's webhook signature verification
function verifyCashfreeSignature(timestamp: string, rawBody: string, signatureFromHeader: string, secret: string): boolean {
    if (!timestamp || !rawBody || !signatureFromHeader || !secret) {
        console.error("Missing components for webhook signature verification.");
        return false;
    }
    try {
        // Cashfree uses: timestamp + rawBody for signature payload
        const signaturePayload = timestamp + rawBody;
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(signaturePayload)
            .digest('base64');

        console.log("Calculated Signature:", expectedSignature);
        console.log("Received Signature:", signatureFromHeader);

        // Use crypto.timingSafeEqual for security
        return crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signatureFromHeader));
    } catch (error) {
        console.error("Error during webhook signature verification:", error);
        return false;
    }
}


// --- Handle Webhook (CRITICAL FIXES HERE) ---
// Note: This requires RAW body parsing middleware for the webhook route
export async function handleCashfreeWebhook(rawBody: string, headers: any) {
    console.log("Webhook Received Headers:", headers);
    console.log("Webhook Received Raw Body:", rawBody);

    const signature = headers['x-webhook-signature'];
    const timestamp = headers['x-webhook-timestamp'];
    
    if (!CASHFREE_WEBHOOK_SECRET) {
        throw new Error("Webhook secret key is not configured.");
    }

    // --- USE CORRECT VERIFICATION ---
    const isValid = verifyCashfreeSignature(timestamp, rawBody, signature, CASHFREE_WEBHOOK_SECRET);
    
    if (!isValid) {
        console.error("Webhook signature verification failed!");
        throw new Error("Unauthorized: Invalid webhook signature");
    }

    // Now parse the JSON payload *after* verification
    let payload;
    try {
        payload = JSON.parse(rawBody);
    } catch (e) {
        throw new Error("Invalid JSON payload received in webhook.");
    }

    // Check if payload structure is as expected
    if (!payload?.data?.order_id || !payload?.data?.order_status) {
         console.error("Webhook payload missing required data:", payload);
         throw new Error("Webhook payload structure invalid.");
    }

    const { order_id, order_status } = payload.data;
    const paymentDetails = payload.data.payment_details;

    const booking = await db.booking.findUnique({ // Use findUnique, not findUniqueOrThrow, handle null case
         where: { cashfreeOrderId: order_id } 
    });
    
    if (!booking) {
        console.error(`Webhook received for unknown Cashfree Order ID: ${order_id}`);
        return; 
    }
    
    // Avoid processing already completed bookings
    if (booking.paymentStatus === 'Success' || booking.paymentStatus === 'Failed') {
        console.log(`Webhook received for already processed booking ${booking.bookingId} (Status: ${booking.paymentStatus})`);
        return;
    }

    const paymentStatusDb: 'Success' | 'Failed' = (order_status === 'PAID') ? 'Success' : 'Failed';
    // Generate reference number ONLY on success
    const referenceNumber = (paymentStatusDb === 'Success') ? `AMCI-${Date.now()}` : booking.referenceNumber; // Keep existing if failed

    try {
        const [updatedBooking] = await db.$transaction([
            db.booking.update({
                where: { bookingId: booking.bookingId },
                data: { 
                    paymentStatus: paymentStatusDb, 
                    referenceNumber: referenceNumber 
                },
            }),
            db.paymentTransaction.create({
                data: {
                    cashfreeOrderId: order_id,
                    bookingId: booking.bookingId,
                    transactionId: paymentDetails?.payment_id || null,
                    paymentMode: paymentDetails?.payment_method || null,
                    amount: booking.totalAmount, // Use amount from booking record
                    status: (paymentStatusDb === 'Success') ? 'Received' : 'Failed',
                    gatewayResponsePayload: payload, // Store the whole payload
                },
            }),
        ]);

        if (updatedBooking.paymentStatus === 'Success') {
            console.log(`Booking ${updatedBooking.bookingId} confirmed successfully. Sending notifications.`);
            // Send booking confirmation email
            try {
                const guestInfo = updatedBooking.guestInfo as { email: string; fullName: string };
                if (guestInfo?.email) {
                    await sendBookingConfirmationEmail(guestInfo.email, {
                        bookingId: updatedBooking.bookingId,
                        checkInDate: updatedBooking.checkInDate.toISOString().split('T')[0],
                        checkInTime: '12:00:00',
                        checkOutDate: updatedBooking.checkOutDate.toISOString().split('T')[0],
                        checkOutTime: '23:00:00',
                        roomType: updatedBooking.roomType,
                        roomCount: updatedBooking.roomCount,
                        totalAmount: updatedBooking.totalAmount,
                        guestInfo: guestInfo,
                    });
                    console.log(`Confirmation email sent to ${guestInfo.email}`);
                } else {
                    console.error('Guest info or email missing for booking confirmation email');
                }
            } catch (emailError) {
                console.error('Failed to send confirmation email:', emailError);
            }
        } else {
             console.log(`Booking ${updatedBooking.bookingId} marked as Failed.`);
        }
    } catch (transactionError) {
         console.error(`Error processing transaction for webhook order ${order_id}:`, transactionError);
         // Rethrow to signal failure to Cashfree (it will retry)
         throw new Error("Database transaction failed during webhook processing.");
    }
}


// --- Get Booking by Reference (Looks OK, uses 'db') ---
export async function getBookingByReference(referenceNumber: string) {
    return db.booking.findUnique({
        where: { referenceNumber },
        select: { referenceNumber: true, checkInDate: true, checkOutDate: true, roomType: true, roomCount: true, totalAmount: true, paymentStatus: true, guestInfo: true }
    });
}

// --- Admin Services (Looks OK, uses 'db') ---
export async function getRoomInventory() {
    return db.roomInventory.findMany({ orderBy: { roomType: 'asc' } });
}

export async function createRoomType(data: CreateRoomRequest) {
    // Add check to ensure roomType doesn't already exist?
    return db.roomInventory.create({ data });
}

export async function updateRoomType(roomId: string, data: UpdateRoomRequest) {
    return db.roomInventory.update({
        where: { roomId },
        data,
    });
}

export async function deleteRoomType(roomId: string) {
    return db.roomInventory.update({
        where: { roomId },
        data: { status: 'Inactive' },
    });
}