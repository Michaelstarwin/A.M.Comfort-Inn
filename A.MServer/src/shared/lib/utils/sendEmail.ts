import nodemailer from 'nodemailer';

export async function sendBookingConfirmationEmail(to: string, bookingDetails: any) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  const { bookingId, checkInDate, checkInTime, checkOutDate, checkOutTime, roomType, roomCount, totalAmount, guestInfo } = bookingDetails;

  await transporter.sendMail({
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
}
