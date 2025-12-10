import nodemailer from 'nodemailer';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'booking.amcinn@gmail.com';

export async function sendBookingConfirmationEmail(to: string, bookingDetails: any) {
  console.log(`[Email Service] Attempting to send confirmation email to USER: ${to} for booking: ${bookingDetails.bookingId}`);

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  const { bookingId, checkInDate, checkInTime, checkOutDate, checkOutTime, roomType, roomCount, totalAmount, guestInfo } = bookingDetails;

  try {
    const info = await transporter.sendMail({
      from: `"A.M. Comfort Inn" <${process.env.MAIL_USER}>`,
      to,
      subject: `✅ Booking Confirmed - ${bookingId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <h2 style="color: #2563eb; text-align: center;">Thank you for your booking!</h2>
          <p>Dear <strong>${guestInfo.fullName}</strong>,</p>
          <p>Your booking has been successfully confirmed. We are excited to host you!</p>
          
          <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1e293b; margin-top: 0;">Booking Details</h3>
            <ul style="list-style: none; padding: 0;">
              <li style="padding: 5px 0;"><strong>Booking ID:</strong> ${bookingId}</li>
              <li style="padding: 5px 0;"><strong>Check-in:</strong> ${checkInDate} at ${checkInTime}</li>
              <li style="padding: 5px 0;"><strong>Check-out:</strong> ${checkOutDate} at ${checkOutTime}</li>
              <li style="padding: 5px 0;"><strong>Room Type:</strong> ${roomType}</li>
              <li style="padding: 5px 0;"><strong>Number of Rooms:</strong> ${roomCount}</li>
              <li style="padding: 5px 0; font-size: 1.1em; color: #16a34a;"><strong>Total Amount Paid:</strong> ₹${totalAmount}</li>
            </ul>
          </div>

          <p>If you have any questions, please feel free to reply to this email.</p>
          <p>Best regards,<br><strong>A.M. Comfort Inn Team</strong></p>
        </div>
      `,
    });
    console.log(`[Email Service] ✅ User confirmation email sent successfully. MessageId: ${info.messageId}`);
  } catch (error) {
    console.error('[Email Service] Failed to send user confirmation email:', error);
    // Don't throw here to prevent crashing the payment flow, just log it
  }
}

export async function sendAdminNotificationEmail(bookingDetails: any) {
  console.log(`[Email Service] Attempting to send admin notification for booking: ${bookingDetails.bookingId}`);

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  const { bookingId, referenceNumber, checkInDate, checkInTime, checkOutDate, checkOutTime, roomType, roomCount, totalAmount, guestInfo } = bookingDetails;

  try {
    const info = await transporter.sendMail({
      from: `"A.M. Comfort Inn" <${process.env.MAIL_USER}>`,
      to: ADMIN_EMAIL,
      subject: `🔔 New Booking Confirmed - ${bookingId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #3b82f6; border-left: 5px solid #3b82f6; border-radius: 10px;">
          <h2 style="color: #1e40af; margin-top: 0;">New Booking Received</h2>
          <p>A new booking has been successfully confirmed in the system.</p>
          
          <div style="background-color: #dbeafe; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1e3a8a; margin-top: 0;">Guest Information</h3>
            <ul style="list-style: none; padding: 0;">
              <li style="padding: 5px 0;"><strong>Name:</strong> ${guestInfo.fullName}</li>
              <li style="padding: 5px 0;"><strong>Email:</strong> ${guestInfo.email}</li>
              <li style="padding: 5px 0;"><strong>Phone:</strong> ${guestInfo.phone}</li>
              <li style="padding: 5px 0;"><strong>Country:</strong> ${guestInfo.country}</li>
            </ul>
          </div>

          <div style="background-color: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #15803d; margin-top: 0;">Booking Details</h3>
            <ul style="list-style: none; padding: 0;">
              <li style="padding: 5px 0;"><strong>Booking ID:</strong> ${bookingId}</li>
              <li style="padding: 5px 0;"><strong>Reference Number:</strong> ${referenceNumber}</li>
              <li style="padding: 5px 0;"><strong>Check-in:</strong> ${checkInDate} at ${checkInTime}</li>
              <li style="padding: 5px 0;"><strong>Check-out:</strong> ${checkOutDate} at ${checkOutTime}</li>
              <li style="padding: 5px 0;"><strong>Room Type:</strong> ${roomType}</li>
              <li style="padding: 5px 0;"><strong>Number of Rooms:</strong> ${roomCount}</li>
              <li style="padding: 5px 0; font-size: 1.1em; color: #16a34a;"><strong>Total Amount Paid:</strong> ₹${totalAmount}</li>
            </ul>
          </div>

          <p style="color: #666; font-size: 0.9em;">This is an automated notification. Please do not reply to this email.</p>
        </div>
      `,
    });
    console.log(`[Email Service] ✅ Admin notification email sent successfully. MessageId: ${info.messageId}`);
  } catch (error) {
    console.error('[Email Service] Failed to send admin notification email:', error);
    // Don't throw here to prevent crashing the payment flow, just log it
  }
}
