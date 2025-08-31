import { query } from '@/lib/db';
import { withAuth } from '@/lib/auth';

async function handleGET(request, context) {
  try {
    const { params } = context || {};
    const { id } = await params || {};
    
    if (!id) {
      return Response.json({ error: 'Booking ID is required' }, { status: 400 });
    }
    const userRole = request.user.role;
    const userId = request.user.id;

    let bookingQuery = `
      SELECT 
        b.*,
        v.name as venue_name,
        v.location as venue_location,
        u.name as vendor_name
      FROM bookings b
      JOIN venues v ON b.venue_id = v.id
      LEFT JOIN users u ON v.vendor_id = u.id
      WHERE b.id = ?
    `;
    let queryParams = [id];

    if (userRole === 'vendor') {
      bookingQuery += ' AND v.vendor_id = ?';
      queryParams.push(userId);
    }

    const bookings = await query(bookingQuery, queryParams);

    if (bookings.length === 0) {
      return Response.json(
        { error: 'Booking not found or access denied' },
        { status: 404 }
      );
    }

    return Response.json({ success: true, booking: bookings[0] });
  } catch (error) {
    console.error('Error fetching booking:', error);
    return Response.json(
      { error: 'Failed to fetch booking' },
      { status: 500 }
    );
  }
}

async function handlePUT(request, context) {
  try {
    const { params } = context || {};
    const { id } = await params || {};
    
    if (!id) {
      return Response.json({ error: 'Booking ID is required' }, { status: 400 });
    }
    const { bookingStatus, paymentStatus, notes } = await request.json();
    const userRole = request.user.role;
    const userId = request.user.id;

    // Check if booking exists and user has permission
    let bookingQuery = `
      SELECT b.*, v.name as venue_name
      FROM bookings b
      JOIN venues v ON b.venue_id = v.id
      WHERE b.id = ?
    `;
    let bookingParams = [id];

    if (userRole === 'vendor') {
      bookingQuery += ' AND v.vendor_id = ?';
      bookingParams.push(userId);
    }

    const bookings = await query(bookingQuery, bookingParams);

    if (bookings.length === 0) {
      return Response.json(
        { error: 'Booking not found or access denied' },
        { status: 404 }
      );
    }

    // Build update query
    let updateFields = [];
    let updateValues = [];

    if (bookingStatus) {
      updateFields.push('booking_status = ?');
      updateValues.push(bookingStatus);
    }
    if (paymentStatus) {
      updateFields.push('payment_status = ?');
      updateValues.push(paymentStatus);
    }
    if (notes !== undefined) {
      updateFields.push('notes = ?');
      updateValues.push(notes);
    }

    updateValues.push(id);

    if (updateFields.length > 0) {
      await query(
        `UPDATE bookings SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        updateValues
      );

      // Log activity
      await query(
        'INSERT INTO activity_logs (user_id, action, description, entity_type, entity_id) VALUES (?, ?, ?, ?, ?)',
        [userId, 'UPDATE_BOOKING', `Updated booking #${id} at ${bookings[0].venue_name}`, 'booking', id]
      );

      // Create notifications based on update type
      let notificationTitle = '';
      let notificationMessage = '';
      let notificationType = 'info';

      if (bookingStatus) {
        switch (bookingStatus) {
          case 'completed':
            notificationTitle = 'Booking Completed';
            notificationMessage = `Your booking for ${bookings[0].venue_name} has been completed.`;
            notificationType = 'success';
            break;
          case 'cancelled':
            notificationTitle = 'Booking Cancelled';
            notificationMessage = `Your booking for ${bookings[0].venue_name} has been cancelled.`;
            notificationType = 'warning';
            break;
        }
      }

      if (paymentStatus === 'paid') {
        notificationTitle = 'Payment Confirmed';
        notificationMessage = `Payment for your booking at ${bookings[0].venue_name} has been confirmed.`;
        notificationType = 'success';
      }

      // Create notification for customer (we'll need to extend this for customer notifications)
      if (notificationTitle) {
        // For now, notify the vendor/admin who made the change
        await query(
          'INSERT INTO notifications (user_id, title, message, type, entity_type, entity_id) VALUES (?, ?, ?, ?, ?, ?)',
          [userId, notificationTitle, notificationMessage, notificationType, 'booking', id]
        );
      }
    }

    return Response.json({
      success: true,
      message: 'Booking updated successfully'
    });

  } catch (error) {
    console.error('Error updating booking:', error);
    return Response.json(
      { error: 'Failed to update booking' },
      { status: 500 }
    );
  }
}

async function handleDELETE(request, { params }) {
  try {
    const { id } = params;
    const userRole = request.user.role;
    const userId = request.user.id;

    // Check if booking exists and user has permission
    let bookingQuery = `
      SELECT b.*, v.name as venue_name
      FROM bookings b
      JOIN venues v ON b.venue_id = v.id
      WHERE b.id = ?
    `;
    let bookingParams = [id];

    if (userRole === 'vendor') {
      bookingQuery += ' AND v.vendor_id = ?';
      bookingParams.push(userId);
    }

    const bookings = await query(bookingQuery, bookingParams);

    if (bookings.length === 0) {
      return Response.json(
        { error: 'Booking not found or access denied' },
        { status: 404 }
      );
    }

    // Delete booking
    await query('DELETE FROM bookings WHERE id = ?', [id]);

    // Log activity
    await query(
      'INSERT INTO activity_logs (user_id, action, description, entity_type, entity_id) VALUES (?, ?, ?, ?, ?)',
      [userId, 'DELETE_BOOKING', `Deleted booking #${id} at ${bookings[0].venue_name}`, 'booking', id]
    );

    return Response.json({
      success: true,
      message: 'Booking deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting booking:', error);
    return Response.json(
      { error: 'Failed to delete booking' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handleGET, ['admin', 'vendor']);
export const PUT = withAuth(handlePUT, ['admin', 'vendor']); 
export const DELETE = withAuth(handleDELETE, ['admin', 'vendor']);
