// booking.validation.ts
import { z } from 'zod';

// Validate time in HH:MM:SS
const timeRegex = /^(?:2[0-3]|[01]?[0-9]):[0-5][0-9]:[0-5][0-9]$/;

// Simple ISO date string (YYYY-MM-DD)
const isoDateString = z.string().refine((s) => /^\d{4}-\d{2}-\d{2}$/.test(s), {
  message: 'Invalid date format. Use YYYY-MM-DD.',
});

const timeString = z.string().regex(timeRegex, 'Invalid time format. Use HH:MM:SS.');

// helpers
const toDate = (dateStr: string, timeStr: string) => new Date(`${dateStr}T${timeStr}`);

export const checkAvailabilitySchema = z.object({
  body: z
    .object({
      checkInDate: isoDateString,
      checkInTime: timeString,
      checkOutDate: isoDateString,
      checkOutTime: timeString,
      roomType: z.string().min(1, 'Room type is required.'),
      roomCount: z.number().int().positive('Room count must be a positive integer.'),
      adultCount: z.number().int().min(1, 'At least 1 adult is required.'),
      childCount: z.number().int().min(0).default(0),
    })
    .superRefine((data, ctx) => {
      const start = toDate(data.checkInDate, data.checkInTime);
      const end = toDate(data.checkOutDate, data.checkOutTime);
      if (!(start < end)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['checkOutDate'],
          message: 'Check-out date and time must be after check-in date and time.',
        });
      }
    }),
});

export type CheckAvailabilityRequest = z.infer<typeof checkAvailabilitySchema.shape.body>;

export const availabilityStatusSchema = z.object({
  query: z
    .object({
      checkInDate: isoDateString,
      checkOutDate: isoDateString,
      checkInTime: timeString.optional(),
      checkOutTime: timeString.optional(),
    })
    .superRefine((data, ctx) => {
      const inTime = data.checkInTime ?? '12:00:00';
      const outTime = data.checkOutTime ?? '11:00:00';
      const start = toDate(data.checkInDate, inTime);
      const end = toDate(data.checkOutDate, outTime);
      if (!(start < end)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['checkOutDate'],
          message: 'Check-out date and time must be after check-in date and time.',
        });
      }
    }),
});

export type AvailabilityStatusRequest = z.infer<typeof availabilityStatusSchema.shape.query>;

// Pre-book: extend the validated body with guest and optional userId
export const preBookSchema = z.object({
  body: checkAvailabilitySchema.shape.body.extend({
    guestInfo: z.object({
      fullName: z.string().min(2, 'Full name is required.'),
      email: z.string().email('Invalid email address.'),
      phone: z.string().min(10, 'A valid phone number is required.'),
      country: z.string().min(2, 'Country is required.'),
    }),
    userId: z.string().cuid().optional(),
  }),
});

export type PreBookRequest = z.infer<typeof preBookSchema.shape.body>;

export const createOrderSchema = z.object({
  body: z.object({
    bookingId: z.string().cuid('A valid booking ID is required.'),
  }),
});

export type CreateOrderRequest = z.infer<typeof createOrderSchema.shape.body>;

export const createRoomSchema = z.object({
  body: z.object({
    roomType: z.string().min(3, 'Room type must be at least 3 characters long.'),
    totalRooms: z.number().int().positive('Total rooms must be a positive number.'),
    currentRate: z.number().positive('Current rate must be a positive number.'),
  }),
});

export type CreateRoomRequest = z.infer<typeof createRoomSchema.shape.body>;

export const updateRoomSchema = z.object({
  body: z.object({
    roomType: z.string().min(3).optional(),
    totalRooms: z.number().int().positive().optional(),
    currentRate: z.number().positive().optional(),
    status: z.enum(['Active', 'Inactive']).optional(),
  }),
});

export type UpdateRoomRequest = z.infer<typeof updateRoomSchema.shape.body>;
