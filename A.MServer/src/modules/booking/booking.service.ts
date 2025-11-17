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
  const activeInventories = await db.roomInventory.findMany({
    where: {
      roomType: { in: ['standard', 'deluxe'] },
      status: 'Active',
    },
    select: {
      roomType: true,
      totalRooms: true,
    },
  });

  const configuredTotalRooms = activeInventories.reduce(
    (max, inventory) => Math.max(max, inventory.totalRooms ?? 0),
    0
  );

  const totalRooms = configuredTotalRooms > 0 ? configuredTotalRooms : 2;

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
    select: {
      roomType: true,
      roomCount: true,
    },
  });

  let occupiedRooms = 0;
  let deluxeOccupied = false;

  for (const booking of overlappingBookings) {
    if (booking.roomType === 'deluxe') {
      deluxeOccupied = true;
      occupiedRooms = totalRooms;
      break;
    }

    occupiedRooms += booking.roomCount;
  }

  const standardRoomsAvailable = Math.max(totalRooms - occupiedRooms, 0);
  const deluxeAvailable = !deluxeOccupied && occupiedRooms === 0;

  return {
    totalRooms,
    occupiedRooms,
    standardRoomsAvailable,
    deluxeAvailable,
  };
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

  const roomInventory = await db.roomInventory.findUnique({
    where: { roomType: request.roomType },
  });

  if (!roomInventory || roomInventory.status !== 'Active') {
    return {
      isAvailable: false,
      totalAmount: 0,
      ratePerNight: 0,
      availableRooms: 0,
      message: 'This stay option is currently not available.',
    };
  }

  const durationMillis = checkOutDateTime.getTime() - checkInDateTime.getTime();
  const nights = Math.max(1, Math.ceil(durationMillis / (1000 * 60 * 60 * 24)));
  const houseState = await computeHouseAvailability(checkInDateTime, checkOutDateTime);

  if (request.roomType === 'deluxe') {
    if (!houseState.deluxeAvailable) {
      return {
        isAvailable: false,
        totalAmount: 0,
        ratePerNight: roomInventory.currentRate,
        availableRooms: 0,
        nights,
        pricingMode: 'package' as const,
        message: 'Conflict: The home is already booked for the selected dates.',
      };
    }

    return {
      isAvailable: true,
      totalAmount: roomInventory.currentRate,
      ratePerNight: roomInventory.currentRate,
      availableRooms: houseState.totalRooms,
      nights,
      pricingMode: 'package' as const,
      message: 'Success: The entire home is available for the selected dates.',
    };
  }

  if (!houseState.deluxeAvailable && houseState.standardRoomsAvailable === 0) {
    return {
      isAvailable: false,
      totalAmount: 0,
      ratePerNight: roomInventory.currentRate,
      availableRooms: 0,
      nights,
      pricingMode: 'nightly' as const,
      message: 'Conflict: The home is already booked for the selected dates.',
    };
  }

  const allowedStandardRooms = Math.min(
    houseState.standardRoomsAvailable,
    roomInventory.totalRooms ?? houseState.standardRoomsAvailable
  );

  if (allowedStandardRooms <= 0) {
    return {
      isAvailable: false,
      totalAmount: 0,
      ratePerNight: roomInventory.currentRate,
      availableRooms: 0,
      message: 'Conflict: The home is already booked for the selected dates.',
    };
  }

  if (allowedStandardRooms < request.roomCount) {
    return {
      isAvailable: false,
      totalAmount: 0,
      ratePerNight: roomInventory.currentRate,
      availableRooms: allowedStandardRooms,
      nights,
      pricingMode: 'nightly' as const,
      message:
        allowedStandardRooms > 0
          ? `Conflict: Only ${allowedStandardRooms} room(s) left for the selected dates.`
          : 'Conflict: The home is already booked for the selected dates.',
    };
  }

  return {
    isAvailable: true,
    totalAmount: roomInventory.currentRate * request.roomCount * nights,
    ratePerNight: roomInventory.currentRate,
    availableRooms: allowedStandardRooms,
    nights,
    pricingMode: 'nightly' as const,
    message: `Success: ${allowedStandardRooms} room(s) are currently available.`,
  };
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
    throw new Error(availability.message || 'Rooms are no longer available for the selected dates.');
  }

  const roomInventory = await db.roomInventory.findUniqueOrThrow({ where: { roomType: request.roomType } });
  const { guestInfo, userId, ...restOfRequest } = request;

  const booking = await db.booking.create({
    data: {
      ...restOfRequest,
      guestInfo,
      userId,
      checkInDate: new Date(`${request.checkInDate}T${request.checkInTime}`),
      checkOutDate: new Date(`${request.checkOutDate}T${request.checkOutTime}`),
      totalAmount: availability.totalAmount,
      roomInventoryId: roomInventory.roomId,
      paymentStatus: BookingPaymentStatus.Pending,
    },
  });

  return {
    bookingId: booking.bookingId,
    totalAmount: booking.totalAmount,
  };
}

// --- Create Order (Razorpay Integration) ---
export async function createOrder(request: CreateOrderRequest) {
  const booking = await db.booking.findUniqueOrThrow({
    where: { bookingId: request.bookingId },
  });

  if (booking.paymentStatus !== BookingPaymentStatus.Pending) {
    throw new Error('This booking is not pending and cannot create a payment order.');
  }

  const guestInfo = booking.guestInfo as { email: string; phone: string; fullName: string };
  if (!guestInfo?.email || !guestInfo?.phone || !guestInfo?.fullName) {
    throw new Error('Booking is missing required guest details (email, phone, name).');
  }

  return {
    bookingId: request.bookingId,
    amount: booking.totalAmount,
    currency: 'INR',
    guestName: guestInfo.fullName,
    guestEmail: guestInfo.email,
  };
}

// --- Get Booking by Reference ---
export async function getBookingByReference(referenceNumber: string) {
  return db.booking.findUnique({
    where: { referenceNumber },
    select: {
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
}

export async function getBookingByOrderId(orderId: string) {
  const transaction = await db.transaction.findFirst({
    where: { razorpayOrderId: orderId },
  });

  if (!transaction) {
    return null;
  }

  return db.booking.findUnique({
    where: { bookingId: transaction.bookingId },
    include: {
      guest: true,
      room: true,
      transaction: true,
    },
  });
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
  return db.roomInventory.update({
    where: { roomId },
    data: { status: 'Inactive' },
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
