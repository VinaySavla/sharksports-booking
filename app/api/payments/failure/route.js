import { query } from '@/lib/db';
import { handlePaymentCallback } from '@/lib/payu';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const callbackData = Object.fromEntries(formData.entries());

    // Process PayU callback
    const result = await handlePaymentCallback(callbackData);

    // Update booking payment status to failed
    if (result.bookingId) {
      await query(
        'UPDATE bookings SET payment_status = "failed" WHERE id = ?',
        [result.bookingId]
      );

      // Log activity
      await query(
        'INSERT INTO activity_logs (action, description, entity_type, entity_id) VALUES (?, ?, ?, ?)',
        [
          'PAYMENT_FAILED',
          `Payment failed for booking #${result.bookingId}`,
          'payment',
          result.bookingId
        ]
      );
    }

    // Redirect to failure page
    return Response.redirect(`${request.url.split('/api')[0]}/payment/failure?booking=${result.bookingId}&error=${encodeURIComponent(result.error || 'Payment failed')}`);

  } catch (error) {
    console.error('Payment failure callback error:', error);
    return Response.redirect(`${request.url.split('/api')[0]}/payment/failure?error=callback_processing_failed`);
  }
}
