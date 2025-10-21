import { z } from 'zod';

// A regular expression to validate time in HH:MM:SS format.
const timeRegex = /^(?:2[0-3]|[01]?[0-9]):[0-5][0-9]:[0-5][0-9]$/;

// Schema for the 'check-availability' endpoint.
export const checkAvailabilitySchema = z.object({
  body: z.object({
    checkInDate: z.string().date("Invalid check-in date format. Use YYYY-MM-DD."),
    checkInTime: z.string().regex(timeRegex, "Invalid check-in time format. Use HH:MM:SS."),
    checkOutDate: z.string().date("Invalid check-out date format. Use YYYY-MM-DD."),
    checkOutTime: z.string().regex(timeRegex, "Invalid check-out time format. Use HH:MM:SS."),
    roomType: z.string().min(1, "Room type is required."),
    roomCount: z.number().int().positive("Room count must be a positive integer."),
  }).refine(data => `${data.checkInDate}T${data.checkInTime}` < `${data.checkOutDate}T${data.checkOutTime}`, {
    // This custom validation ensures the check-out time is after the check-in time.
    message: "Check-out date and time must be after check-in date and time.",
    path: ["checkOutDate"], // Associates the error with the checkOutDate field.
  })
});

// We infer the TypeScript type from the schema's body for use in our service layer.
export type CheckAvailabilityRequest = z.infer<typeof checkAvailabilitySchema.shape.body>;


// Schema for the 'pre-book' endpoint.
export const preBookSchema = z.object({
    // UPDATE: Changed .extend() to .safeExtend() to handle the refinement in the base schema.
    body: checkAvailabilitySchema.shape.body.safeExtend({
        guestInfo: z.object({
            fullName: z.string().min(2, "Full name is required."),
            email: z.string().email("Invalid email address."),
            phone: z.string().min(10, "A valid phone number is required."),
            country: z.string().min(2, "Country is required."),
        }),
        userId: z.string().cuid("Invalid user ID format.").optional(),
    })
});

// Infer the TypeScript type for the pre-book request.
export type PreBookRequest = z.infer<typeof preBookSchema.shape.body>;


// Schema for creating a payment order.
export const createOrderSchema = z.object({
  body: z.object({
    bookingId: z.string().cuid("A valid booking ID is required."),
  }),
});

export type CreateOrderRequest = z.infer<typeof createOrderSchema.shape.body>;


// Schema for an admin creating a new room type.
export const createRoomSchema = z.object({
  body: z.object({
    roomType: z.string().min(3, "Room type must be at least 3 characters long."),
    totalRooms: z.number().int().positive("Total rooms must be a positive number."),
    currentRate: z.number().positive("Current rate must be a positive number."),
  }),
});

export type CreateRoomRequest = z.infer<typeof createRoomSchema.shape.body>;


// Schema for an admin updating an existing room type.
export const updateRoomSchema = z.object({
  body: z.object({
    roomType: z.string().min(3, "Room type must be at least 3 characters long.").optional(),
    totalRooms: z.number().int().positive("Total rooms must be a positive number.").optional(),
    currentRate: z.number().positive("Current rate must be a positive number.").optional(),
    status: z.enum(['Active', 'Inactive']).optional(),
  }),
});

export type UpdateRoomRequest = z.infer<typeof updateRoomSchema.shape.body>;

