import { PrismaClient, BookingPaymentStatus } from '@prisma/client';
import crypto from 'crypto';
import { CheckAvailabilityRequest, AvailabilityStatusRequest, PreBookRequest, CreateOrderRequest, CreateRoomRequest, UpdateRoomRequest } from './booking.validation';
import { db } from '../../shared/lib/db';
import { sendBookingConfirmationEmail } from '../../shared/lib/utils/sendEmail';

// --- Razorpay Configuration ---
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:7700';

type HouseAvailabilityState = {
  totalRooms: number;
  occupiedRooms: number;
  standardRoomsAvailable: number;
  deluxeAvailable: boolean;
};

async function computeHouseAvailability(checkInDateTime: Date, checkOutDateTime: Date): Promise<HouseAvailabilityState> {
  // get all active room inventories (no longer filtering by 'standard'|'deluxe' — trust DB)
  const activeInventories = await db.roomInventory.findMany({
    where: { status: 'Active' },
    select: { roomType: true, totalRooms: true }
  });

  // total capacity = sum of totalRooms across inventories (fallback to 2)
  const totalRooms = activeInventories.reduce((sum, inv) => sum + (inv.totalRooms ?? 0), 0) || 2;

  const pendingBookingExpiryTime = new Date(Date.now() - 15 * 60 * 1000);

  const overlappingBookings = await db.booking.findMany({
    where: {
      checkInDate: { lt: checkOutDateTime },
      checkOutDate: { gt: checkInDateTime },
      OR: [
        { paymentStatus: BookingPaymentStatus.Success },
        {
          paymentStatus: BookingPaymentStatus.Pending,
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
export async function getAllBookings() {
  try {
    const bookings = await db.booking.findMany({
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
  } catch (error: any) {
    console.error('Error fetching all bookings:', error);
    throw new Error('Failed to fetch bookings');
  }
}

// --- Availability Check ---
export async function checkAvailability(request: CheckAvailabilityRequest) {
  const checkInDateTime = new Date(`${request.checkInDate}T${request.checkInTime}`);
  const checkOutDateTime = new Date(`${request.checkOutDate}T${request.checkOutTime}`);

  // case-insensitive lookup for roomType to avoid mismatch
  const roomInventory = await db.roomInventory.findFirst({
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
      return { isAvailable: false, totalAmount: 0, ratePerNight: 0, availableRooms: 0, nights, pricingMode: 'package' as const, message: 'Conflict: The home is already booked for the selected dates.' };
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

    // Pricing Rules - Dynamic based on DB Rate
    // If DB Rate is for example 4500:
    // <= 8 guests: Base Rate (4500)
    // 9 guests: Base Rate + Surcharge (e.g. 500)
    // 10 guests: Base Rate + 2*Surcharge (e.g. 1000)

    // We assume the DB rate IS the "base package rate" (e.g. 4500 in original code)
    const basePackageRate = roomInventory.currentRate;
    const surchargePerGuest = 500;

    let nightlyRate = basePackageRate;

    // Apply logic: For 9th and 10th guest, add surcharge
    if (totalPax === 9) nightlyRate = basePackageRate + surchargePerGuest;
    if (totalPax === 10) nightlyRate = basePackageRate + (2 * surchargePerGuest);

    const totalAmount = nightlyRate * nights;

    return {
      isAvailable: true,
      totalAmount,
      ratePerNight: nightlyRate,
      surchargePerNight: 0,
      availableRooms: houseState.totalRooms,
      nights,
      pricingMode: 'package' as const,
      message: 'Success: The entire home is available for the selected dates.'
    };
  }

  // --- STANDARD ROOM LOGIC ---
  const baseRate = roomInventory.currentRate;

  if (!houseState.deluxeAvailable && houseState.standardRoomsAvailable === 0) {
    return { isAvailable: false, totalAmount: 0, ratePerNight: 0, availableRooms: 0, nights, pricingMode: 'nightly' as const, message: 'Conflict: The home is already booked for the selected dates.' };
  }

  const allowedStandardRooms = Math.min(houseState.standardRoomsAvailable, roomInventory.totalRooms ?? houseState.standardRoomsAvailable);
  if (allowedStandardRooms < request.roomCount) {
    return { isAvailable: false, totalAmount: 0, ratePerNight: 0, availableRooms: allowedStandardRooms, nights, pricingMode: 'nightly' as const, message: allowedStandardRooms > 0 ? `Conflict: Only ${allowedStandardRooms} room(s) left for the selected dates.` : 'Conflict: The home is already booked for the selected dates.' };
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

  // Pricing Rules
  // Base rate from DB. Surcharge logic for extra guests if needed.
  const surchargePerGuest = 500;
  const baseCapacityPerRoom = 4;

  const totalBaseCapacity = baseCapacityPerRoom * request.roomCount;
  const extraGuests = Math.max(0, totalPax - totalBaseCapacity);

  // Dynamic Pricing Formula
  const totalNightlyRate = (baseRate * request.roomCount) + (extraGuests * surchargePerGuest);

  const totalAmount = totalNightlyRate * nights;

  return {
    isAvailable: true,
    totalAmount,
    ratePerNight: totalNightlyRate,
    surchargePerNight: 0,
    availableRooms: allowedStandardRooms,
    nights,
    pricingMode: 'nightly' as const,
    message: `Success: ${allowedStandardRooms} room(s) are currently available.`
  };
}
export async function linkOrderToBooking(bookingId: string, orderId: string) {
  try {
    return await db.booking.update({
      where: { bookingId },
      data: { paymentOrderId: orderId, paymentStatus: BookingPaymentStatus.Pending, updatedAt: new Date() }
    });
  } catch (e: any) {
    if (e?.code === 'P2002') {
      // unique constraint on paymentOrderId — handle gracefully
      console.warn('OrderId already linked to another booking', orderId);
      throw new Error('Order already linked');
    }
    throw e;
  }
}

export async function getAvailabilityStatus(request: AvailabilityStatusRequest) {
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
export async function preBook(request: PreBookRequest) {
  const availability = await checkAvailability(request);
  if (!availability.isAvailable) {
    return { success: false, code: 'NO_AVAILABILITY', message: availability.message, details: availability };
  }

  const roomInventory = await db.roomInventory.findFirstOrThrow({
    where: { roomType: { equals: request.roomType, mode: 'insensitive' } }
  });

  const { guestInfo, userId, adultCount, childCount } = request;

  // Build explicit payload for Prisma create to avoid passing unexpected fields
  const bookingPayload: any = {
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
    paymentStatus: BookingPaymentStatus.Pending,
  };

  // Consider wrapping the create in a transaction if you later will immediately create payment order
  const booking = await db.booking.create({ data: bookingPayload });

  return { success: true, bookingId: booking.bookingId, totalAmount: booking.totalAmount };
}


// --- Create Order (Razorpay Integration) ---
export async function createOrder(request: CreateOrderRequest) {
  const booking = await db.booking.findUniqueOrThrow({ where: { bookingId: request.bookingId } });

  if (booking.paymentStatus !== BookingPaymentStatus.Pending) {
    return { success: false, message: 'This booking is not pending and cannot create a payment order.' };
  }

  const guestInfo = booking.guestInfo as { email?: string; phone?: string; fullName?: string } | null;
  if (!guestInfo?.email || !guestInfo?.phone || !guestInfo?.fullName) {
    return { success: false, message: 'Booking is missing required guest details (email, phone, name).' };
  }

  // Return booking metadata for the payment route to create Razorpay order
  return { success: true, bookingId: booking.bookingId, amount: booking.totalAmount, currency: 'INR', guestName: guestInfo.fullName, guestEmail: guestInfo.email };
}


// --- Get Booking by Reference ---
export async function getBookingByReference(referenceNumber: string) {
  const booking = await db.booking.findUnique({
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
function formatTimeFromDate(date: Date): string {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const displayMinutes = minutes.toString().padStart(2, '0');
  return `${displayHours}:${displayMinutes} ${ampm}`;
}

export async function getBookingByOrderId(orderId: string) {
  console.log(`[Service] Searching for booking with paymentOrderId: ${orderId}`);

  const booking = await db.booking.findFirst({
    where: { paymentOrderId: orderId },
    include: { roomInventory: true, user: true },
  });

  if (!booking) {
    // ✅ Add detailed logging
    console.error(`[Service] ❌ No booking found for orderId: ${orderId}`);

    // Debug: Check if order exists in any booking
    const allBookings = await db.booking.findMany({
      select: { bookingId: true, paymentOrderId: true, paymentStatus: true },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    console.log('[Service] Recent bookings:', JSON.stringify(allBookings, null, 2));
    return null;
  }

  console.log(`[Service] ✅ Found booking: ${booking.bookingId} with status: ${booking.paymentStatus}`);

  return {
    ...booking,
    checkInTime: formatTimeFromDate(booking.checkInDate),
    checkOutTime: formatTimeFromDate(booking.checkOutDate),
  };
}

// --- Admin Room Inventory ---
export async function getRoomInventory() {
  try {
    return await db.roomInventory.findMany({ orderBy: { roomType: 'asc' } });
  } catch (err: any) {
    if (err?.code === 'P2022') {
      return db.roomInventory.findMany({
        select: { roomId: true, roomType: true, totalRooms: true, currentRate: true, status: true, createdAt: true, updatedAt: true },
        orderBy: { roomType: 'asc' },
      });
    }
    throw err;
  }
}

export async function createRoomType(data: CreateRoomRequest) {
  if (!data || typeof (data as any).roomType !== 'string' || (data as any).roomType.trim() === '') {
    throw new Error('roomType is required and must be a non-empty string.');
  }

  if (typeof (data as any).totalRooms !== 'number' || Number.isNaN((data as any).totalRooms)) {
    throw new Error('totalRooms is required and must be a valid integer.');
  }

  if (typeof (data as any).currentRate !== 'number' || Number.isNaN((data as any).currentRate)) {
    throw new Error('currentRate is required and must be a valid number.');
  }

  const payload: any = {
    roomType: (data as any).roomType.trim(),
    totalRooms: (data as any).totalRooms,
    currentRate: (data as any).currentRate,
    status: (data as any).status || 'Active',
  };

  if ((data as any).description !== undefined) payload.description = (data as any).description;
  if ((data as any).imageUrl !== undefined) payload.imageUrl = (data as any).imageUrl;

  return db.roomInventory.create({ data: payload });
}

export async function updateRoomType(roomId: string, data: UpdateRoomRequest) {
  const updatePayload: any = {};
  if (data.roomType !== undefined) updatePayload.roomType = data.roomType;
  if (data.totalRooms !== undefined) updatePayload.totalRooms = data.totalRooms as any;
  if (data.currentRate !== undefined) updatePayload.currentRate = data.currentRate as any;
  if (data.status !== undefined) updatePayload.status = data.status as any;
  if ((data as any).description !== undefined) updatePayload.description = (data as any).description;
  if ((data as any).imageUrl !== undefined) updatePayload.imageUrl = (data as any).imageUrl;

  if (Object.keys(updatePayload).length === 0) {
    throw new Error('No valid fields provided to update.');
  }

  return db.roomInventory.update({
    where: { roomId },
    data: updatePayload,
  });
}

export async function deleteRoomType(roomId: string) {
  return db.roomInventory.delete({
    where: { roomId },
  });
}

// --- Admin Bookings ---
export async function getBookingDetailsAdmin(bookingId: string) {
  return db.booking.findUniqueOrThrow({
    where: { bookingId },
    include: {
      roomInventory: true,
      user: true,
    },
  });
}

export async function updateBookingStatus(bookingId: string, status: string) {
  const paymentStatus = status as BookingPaymentStatus;

  if (!Object.values(BookingPaymentStatus).includes(paymentStatus)) {
    throw new Error('Invalid booking status supplied.');
  }

  return db.booking.update({
    where: { bookingId },
    data: { paymentStatus, updatedAt: new Date() },
  });
}

export async function getAdminBookings(filters: { status?: string; search?: string; page: number; limit: number }) {
  const { status, search, page, limit } = filters;
  const skip = (page - 1) * limit;

  const where: any = {};

  if (status && status !== 'All') where.paymentStatus = status;

  if (search) {
    where.OR = [
      { guestInfo: { path: ['fullName'], string_contains: search } },
      { guestInfo: { path: ['email'], string_contains: search } },
    ];
  }

  const [bookings, total] = await Promise.all([
    db.booking.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { roomInventory: true, user: true },
    }),
    db.booking.count({ where }),
  ]);

  return { data: bookings, total, page, limit, pages: Math.ceil(total / limit) };
}

// --- Analytics ---
export async function getAnalytics(period: string = 'month') {
  const dateRange = getDateRangeForPeriod(period);
  const bookings = await db.booking.findMany({
    where: { createdAt: { gte: dateRange.startDate, lte: dateRange.endDate } },
  });

  const successfulBookings = bookings.filter(b => b.paymentStatus === BookingPaymentStatus.Success).length;
  const failedBookings = bookings.filter(b => b.paymentStatus === BookingPaymentStatus.Failed).length;
  const pendingBookings = bookings.filter(b => b.paymentStatus === BookingPaymentStatus.Pending).length;
  const refundedBookings = bookings.filter(b => b.paymentStatus === BookingPaymentStatus.Refunded).length;
  const totalRevenue = bookings
    .filter(b => b.paymentStatus === BookingPaymentStatus.Success)
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

export async function getRevenueAnalytics(period: string = 'month') {
  const dateRange = getDateRangeForPeriod(period);
  const bookings = await db.booking.findMany({
    where: {
      paymentStatus: BookingPaymentStatus.Success,
      createdAt: { gte: dateRange.startDate, lte: dateRange.endDate },
    },
    orderBy: { createdAt: 'asc' },
  });

  const revenueByDate: Record<string, number> = {};
  bookings.forEach(b => {
    const date = b.createdAt.toISOString().split('T')[0];
    revenueByDate[date] = (revenueByDate[date] || 0) + b.totalAmount;
  });

  const chartData = Object.entries(revenueByDate).map(([date, revenue]) => ({ date, revenue: Math.round(revenue) }));
  const totalRevenue = bookings.reduce((sum, b) => sum + b.totalAmount, 0);

  return { totalRevenue, chartData, bookingCount: bookings.length };
}

export async function getOccupancyStats() {
  const rooms = await db.roomInventory.findMany();
  const bookings = await db.booking.findMany({ where: { paymentStatus: BookingPaymentStatus.Success } });

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

export async function getTopRoomTypes() {
  const bookings = await db.booking.findMany({ where: { paymentStatus: BookingPaymentStatus.Success } });

  const roomStats: Record<string, { bookings: number; revenue: number }> = {};
  bookings.forEach(b => {
    if (!roomStats[b.roomType]) roomStats[b.roomType] = { bookings: 0, revenue: 0 };
    roomStats[b.roomType].bookings += 1;
    roomStats[b.roomType].revenue += b.totalAmount;
  });

  return Object.entries(roomStats)
    .map(([roomType, stats]) => ({ roomType, ...stats }))
    .sort((a, b) => b.bookings - a.bookings)
    .slice(0, 5);
}

function getDateRangeForPeriod(period: string) {
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
