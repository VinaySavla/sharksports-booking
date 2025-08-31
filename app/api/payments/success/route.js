import { query } from '@/lib/db';
import { handlePaymentCallback } from '@/lib/payu';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const callbackData = Object.fromEntries(formData.entries());

    // Process PayU callback
    const result = await handlePaymentCallback(callbackData);

    if (result.success) {
      // Update booking payment status
      await query(
        'UPDATE bookings SET payment_status = ? WHERE id = ?',
        [result.status === 'success' ? 'paid' : 'failed', result.bookingId]
      );

      // Log activity
      await query(
        'INSERT INTO activity_logs (action, description, entity_type, entity_id) VALUES (?, ?, ?, ?)',
        [
          'PAYMENT_SUCCESS',
          `Payment successful for booking #${result.bookingId} - ₹${result.amount}`,
          'payment',
          result.bookingId
        ]
      );

      // Redirect to success page
      return Response.redirect(`${request.url.split('/api')[0]}/payment/success?booking=${result.bookingId}&amount=${result.amount}`);
    } else {
      // Log failed payment
      await query(
        'INSERT INTO activity_logs (action, description, entity_type, entity_id) VALUES (?, ?, ?, ?)',
        [
          'PAYMENT_FAILED',
          `Payment failed for booking #${result.bookingId || 'unknown'}`,
          'payment',
          result.bookingId
        ]
      );

      // Redirect to failure page
      return Response.redirect(`${request.url.split('/api')[0]}/payment/failure?error=${encodeURIComponent(result.error)}`);
    }

  } catch (error) {
    console.error('Payment callback error:', error);
    return Response.redirect(`${request.url.split('/api')[0]}/payment/failure?error=callback_processing_failed`);
  }
}
