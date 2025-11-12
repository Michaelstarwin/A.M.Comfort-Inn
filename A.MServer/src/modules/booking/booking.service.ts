import { PrismaClient, BookingPaymentStatus } from '@prisma/client';
import crypto from 'crypto';
import { CheckAvailabilityRequest, PreBookRequest, CreateOrderRequest, CreateRoomRequest, UpdateRoomRequest } from './booking.validation';
import { db } from '../../shared/lib/db';
import { sendBookingConfirmationEmail } from '../../shared/lib/utils/sendEmail';

// --- Razorpay Configuration ---
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:7700';

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
    return { isAvailable: false, totalAmount: 0, ratePerNight: 0, message: 'This room type is currently not available.' };
  }

  const pendingBookingExpiryTime = new Date(Date.now() - 15 * 60 * 1000);

  const overlappingBookings = await db.booking.findMany({
    where: {
      roomType: request.roomType,
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
  });

  const bookedRoomsCount = overlappingBookings.reduce((sum, booking) => sum + booking.roomCount, 0);
  const availableRooms = roomInventory.totalRooms - bookedRoomsCount;
  const isAvailable = availableRooms >= request.roomCount;

  const durationMillis = checkOutDateTime.getTime() - checkInDateTime.getTime();
  const nights = Math.max(1, Math.ceil(durationMillis / (1000 * 60 * 60 * 24)));
  const totalAmount = isAvailable ? roomInventory.currentRate * request.roomCount * nights : 0;

  return {
    isAvailable,
    totalAmount,
    ratePerNight: roomInventory.currentRate,
    message: isAvailable ? `Success: ${availableRooms} room(s) available.` : `Conflict: Only ${availableRooms} room(s) available.`,
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
