"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateRoomSchema = exports.createRoomSchema = exports.createOrderWithBookingDataSchema = exports.createOrderSchema = exports.preBookSchema = exports.availabilityStatusSchema = exports.checkAvailabilitySchema = void 0;
// booking.validation.ts
const zod_1 = require("zod");
// Validate time in HH:MM:SS
const timeRegex = /^(?:2[0-3]|[01]?[0-9]):[0-5][0-9]:[0-5][0-9]$/;
// Simple ISO date string (YYYY-MM-DD)
const isoDateString = zod_1.z.string().refine((s) => /^\d{4}-\d{2}-\d{2}$/.test(s), {
    message: 'Invalid date format. Use YYYY-MM-DD.',
});
const timeString = zod_1.z.string().regex(timeRegex, 'Invalid time format. Use HH:MM:SS.');
// helpers
const toDate = (dateStr, timeStr) => new Date(`${dateStr}T${timeStr}`);
// Base schema object (without refinements) allows extension
const baseBookingFields = zod_1.z.object({
    checkInDate: isoDateString,
    checkInTime: timeString,
    checkOutDate: isoDateString,
    checkOutTime: timeString,
    roomType: zod_1.z.string().min(1, 'Room type is required.'),
    roomCount: zod_1.z.number().int().positive('Room count must be a positive integer.'),
    adultCount: zod_1.z.number().int().min(1, 'At least 1 adult is required.'),
    childCount: zod_1.z.number().int().min(0).default(0),
});
// Refinement logic
const dateValidation = (data, ctx) => {
    const start = toDate(data.checkInDate, data.checkInTime);
    const end = toDate(data.checkOutDate, data.checkOutTime);
    if (!(start < end)) {
        ctx.addIssue({
            code: zod_1.z.ZodIssueCode.custom,
            path: ['checkOutDate'],
            message: 'Check-out date and time must be after check-in date and time.',
        });
    }
};
exports.checkAvailabilitySchema = zod_1.z.object({
    body: baseBookingFields.superRefine(dateValidation),
});
exports.availabilityStatusSchema = zod_1.z.object({
    query: zod_1.z
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
                code: zod_1.z.ZodIssueCode.custom,
                path: ['checkOutDate'],
                message: 'Check-out date and time must be after check-in date and time.',
            });
        }
    }),
});
// Pre-book: extend the BASE object, then apply refinement
exports.preBookSchema = zod_1.z.object({
    body: baseBookingFields
        .extend({
        guestInfo: zod_1.z.object({
            fullName: zod_1.z.string().min(2, 'Full name is required.'),
            email: zod_1.z.string().email('Invalid email address.'),
            phone: zod_1.z.string().min(10, 'A valid phone number is required.'),
            country: zod_1.z.string().min(2, 'Country is required.'),
        }),
        userId: zod_1.z.string().cuid().optional(),
    })
        .superRefine(dateValidation),
});
exports.createOrderSchema = zod_1.z.object({
    body: zod_1.z.object({
        bookingId: zod_1.z.string().cuid('A valid booking ID is required.'),
    }),
});
// New schema for creating order with full booking data (no pre-booking required)
exports.createOrderWithBookingDataSchema = zod_1.z.object({
    body: baseBookingFields
        .extend({
        guestInfo: zod_1.z.object({
            fullName: zod_1.z.string().min(2, 'Full name is required.'),
            email: zod_1.z.string().email('Invalid email address.'),
            phone: zod_1.z.string().min(10, 'A valid phone number is required.'),
            country: zod_1.z.string().min(2, 'Country is required.'),
        }),
        userId: zod_1.z.string().cuid().optional(),
    })
        .superRefine(dateValidation),
});
exports.createRoomSchema = zod_1.z.object({
    body: zod_1.z.object({
        roomType: zod_1.z.string().min(3, 'Room type must be at least 3 characters long.'),
        totalRooms: zod_1.z.number().int().positive('Total rooms must be a positive number.'),
        currentRate: zod_1.z.number().positive('Current rate must be a positive number.'),
    }),
});
exports.updateRoomSchema = zod_1.z.object({
    body: zod_1.z.object({
        roomType: zod_1.z.string().min(3).optional(),
        totalRooms: zod_1.z.number().int().positive().optional(),
        currentRate: zod_1.z.number().positive().optional(),
        status: zod_1.z.enum(['Active', 'Inactive']).optional(),
    }),
});
//# sourceMappingURL=booking.validation.js.map