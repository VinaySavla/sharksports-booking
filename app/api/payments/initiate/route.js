import { query } from '@/lib/db';
import { initiatePayment } from '@/lib/payu';

export async function POST(request) {
  try {
    const { bookingId } = await request.json();

    if (!bookingId) {
      return Response.json(
        { error: 'Booking ID is required' },
        { status: 400 }
      );
    }

    // Get booking details
    const bookings = await query(`
      SELECT 
        b.*,
        v.name as venue_name
      FROM bookings b
      JOIN venues v ON b.venue_id = v.id
      WHERE b.id = ? AND b.payment_status = 'pending'
    `, [bookingId]);

    if (bookings.length === 0) {
      return Response.json(
        { error: 'Booking not found or already paid' },
        { status: 404 }
      );
    }

    const booking = bookings[0];

    // Prepare payment data
    const paymentData = {
      bookingId: booking.id,
      amount: booking.total_amount,
      customerEmail: booking.customer_email,
      customerName: booking.customer_name,
      customerPhone: booking.customer_phone
    };

    // Initiate payment with PayU
    const paymentResult = await initiatePayment(paymentData);

    if (paymentResult.success) {
      // Update booking with payment transaction ID
      await query(
        'UPDATE bookings SET payment_id = ? WHERE id = ?',
        [paymentResult.transactionId, bookingId]
      );

      return Response.json({
        success: true,
        paymentUrl: paymentResult.paymentUrl,
        paymentData: paymentResult.paymentData,
        transactionId: paymentResult.transactionId
      });
    } else {
      return Response.json(
        { error: paymentResult.error },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Payment initiation error:', error);
    return Response.json(
      { error: 'Failed to initiate payment' },
      { status: 500 }
    );
  }
}
