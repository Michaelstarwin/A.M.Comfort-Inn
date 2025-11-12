"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateRoomSchema = exports.createRoomSchema = exports.createOrderSchema = exports.preBookSchema = exports.availabilityStatusSchema = exports.checkAvailabilitySchema = void 0;
const zod_1 = require("zod");
// A regular expression to validate time in HH:MM:SS format.
const timeRegex = /^(?:2[0-3]|[01]?[0-9]):[0-5][0-9]:[0-5][0-9]$/;
// Schema for the 'check-availability' endpoint.
exports.checkAvailabilitySchema = zod_1.z.object({
    body: zod_1.z.object({
        checkInDate: zod_1.z.string().date("Invalid check-in date format. Use YYYY-MM-DD."),
        checkInTime: zod_1.z.string().regex(timeRegex, "Invalid check-in time format. Use HH:MM:SS."),
        checkOutDate: zod_1.z.string().date("Invalid check-out date format. Use YYYY-MM-DD."),
        checkOutTime: zod_1.z.string().regex(timeRegex, "Invalid check-out time format. Use HH:MM:SS."),
        roomType: zod_1.z.string().min(1, "Room type is required."),
        roomCount: zod_1.z.number().int().positive("Room count must be a positive integer."),
    }).refine(data => `${data.checkInDate}T${data.checkInTime}` < `${data.checkOutDate}T${data.checkOutTime}`, {
        // This custom validation ensures the check-out time is after the check-in time.
        message: "Check-out date and time must be after check-in date and time.",
        path: ["checkOutDate"], // Associates the error with the checkOutDate field.
    })
});
exports.availabilityStatusSchema = zod_1.z.object({
    query: zod_1.z.object({
        checkInDate: zod_1.z.string().date("Invalid check-in date format. Use YYYY-MM-DD."),
        checkOutDate: zod_1.z.string().date("Invalid check-out date format. Use YYYY-MM-DD."),
        checkInTime: zod_1.z.string().regex(timeRegex, "Invalid check-in time format. Use HH:MM:SS.").optional(),
        checkOutTime: zod_1.z.string().regex(timeRegex, "Invalid check-out time format. Use HH:MM:SS.").optional(),
    }).refine(data => `${data.checkInDate}T${data.checkInTime ?? '12:00:00'}` < `${data.checkOutDate}T${data.checkOutTime ?? '11:00:00'}`, {
        message: "Check-out date and time must be after check-in date and time.",
        path: ["checkOutDate"],
    }),
});
// Schema for the 'pre-book' endpoint.
exports.preBookSchema = zod_1.z.object({
    // UPDATE: Changed .extend() to .safeExtend() to handle the refinement in the base schema.
    body: exports.checkAvailabilitySchema.shape.body.safeExtend({
        guestInfo: zod_1.z.object({
            fullName: zod_1.z.string().min(2, "Full name is required."),
            email: zod_1.z.string().email("Invalid email address."),
            phone: zod_1.z.string().min(10, "A valid phone number is required."),
            country: zod_1.z.string().min(2, "Country is required."),
        }),
        userId: zod_1.z.string().cuid("Invalid user ID format.").optional(),
    })
});
// Schema for creating a payment order.
exports.createOrderSchema = zod_1.z.object({
    body: zod_1.z.object({
        bookingId: zod_1.z.string().cuid("A valid booking ID is required."),
    }),
});
// Schema for an admin creating a new room type.
exports.createRoomSchema = zod_1.z.object({
    body: zod_1.z.object({
        roomType: zod_1.z.string().min(3, "Room type must be at least 3 characters long."),
        totalRooms: zod_1.z.number().int().positive("Total rooms must be a positive number."),
        currentRate: zod_1.z.number().positive("Current rate must be a positive number."),
    }),
});
// Schema for an admin updating an existing room type.
exports.updateRoomSchema = zod_1.z.object({
    body: zod_1.z.object({
        roomType: zod_1.z.string().min(3, "Room type must be at least 3 characters long.").optional(),
        totalRooms: zod_1.z.number().int().positive("Total rooms must be a positive number.").optional(),
        currentRate: zod_1.z.number().positive("Current rate must be a positive number.").optional(),
        status: zod_1.z.enum(['Active', 'Inactive']).optional(),
    }),
});
//# sourceMappingURL=booking.validation.js.map