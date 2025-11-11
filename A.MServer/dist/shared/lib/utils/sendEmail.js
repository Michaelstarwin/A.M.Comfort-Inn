"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendBookingConfirmationEmail = sendBookingConfirmationEmail;
const nodemailer_1 = __importDefault(require("nodemailer"));
function sendBookingConfirmationEmail(to, bookingDetails) {
    return __awaiter(this, void 0, void 0, function* () {
        const transporter = nodemailer_1.default.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS,
            },
        });
        const { bookingId, checkInDate, checkInTime, checkOutDate, checkOutTime, roomType, roomCount, totalAmount, guestInfo } = bookingDetails;
        yield transporter.sendMail({
            from: `"A.M. Comfort Inn" <${process.env.MAIL_USER}>`,
            to,
            subject: `✅ Booking Confirmed - ${bookingId}`,
            html: `
      <h2>Thank you for your booking!</h2>
      <p>Dear ${guestInfo.fullName},</p>
      <p>Your booking has been confirmed. Here are the details:</p>
      <ul>
        <li><strong>Booking ID:</strong> ${bookingId}</li>
        <li><strong>Check-in:</strong> ${checkInDate} at ${checkInTime}</li>
        <li><strong>Check-out:</strong> ${checkOutDate} at ${checkOutTime}</li>
        <li><strong>Room Type:</strong> ${roomType}</li>
        <li><strong>Number of Rooms:</strong> ${roomCount}</li>
        <li><strong>Total Amount:</strong> ₹${totalAmount}</li>
      </ul>
      <p>We look forward to welcoming you!</p>
      <p>Best regards,<br>A.M. Comfort Inn Team</p>
    `,
        });
    });
}
//# sourceMappingURL=sendEmail.js.map