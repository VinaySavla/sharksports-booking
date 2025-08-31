import { query } from '@/lib/db';
import { withAuth } from '@/lib/auth';

async function handleGET(request) {
  try {
    const url = new URL(request.url);
    const venueId = url.searchParams.get('venueId');
    const status = url.searchParams.get('status');
    const date = url.searchParams.get('date');
    const userRole = request.user.role;
    const userId = request.user.id;

    let whereConditions = [];
    let queryParams = [];

    // Base query
    let baseQuery = `
      SELECT 
        b.*,
        v.name as venue_name,
        v.location as venue_location,
        u.name as vendor_name
      FROM bookings b
      JOIN venues v ON b.venue_id = v.id
      LEFT JOIN users u ON v.vendor_id = u.id
    `;

    // Role-based filtering
    if (userRole === 'vendor') {
      whereConditions.push('v.vendor_id = ?');
      queryParams.push(userId);
    }

    // Additional filters
    if (venueId) {
      whereConditions.push('b.venue_id = ?');
      queryParams.push(venueId);
    }

    if (status) {
      whereConditions.push('b.booking_status = ?');
      queryParams.push(status);
    }

    if (date) {
      whereConditions.push('b.booking_date = ?');
      queryParams.push(date);
    }

    // Build final query
    if (whereConditions.length > 0) {
      baseQuery += ' WHERE ' + whereConditions.join(' AND ');
    }

    baseQuery += ' ORDER BY b.booking_date DESC, b.start_time DESC';

    const bookings = await query(baseQuery, queryParams);

    return Response.json({ success: true, bookings });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return Response.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
}

async function handlePOST(request) {
  try {
    const {
      venueId,
      customerName,
      customerEmail,
      customerPhone,
      bookingDate,
      startTime,
      endTime,
      totalAmount,
      notes
    } = await request.json();

    if (!venueId || !customerName || !customerEmail || !bookingDate || !startTime || !endTime || !totalAmount) {
      return Response.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if venue exists and user has permission
    const userRole = request.user.role;
    const userId = request.user.id;

    let venueQuery = 'SELECT id, name FROM venues WHERE id = ?';
    let venueParams = [venueId];

    if (userRole === 'vendor') {
      venueQuery += ' AND vendor_id = ?';
      venueParams.push(userId);
    }

    const venues = await query(venueQuery, venueParams);

    if (venues.length === 0) {
      return Response.json(
        { error: 'Venue not found or access denied' },
        { status: 404 }
      );
    }

    // Check for conflicting bookings at the same location and time
    const conflictingBookings = await query(`
      SELECT b.id FROM bookings b
      JOIN venues v ON b.venue_id = v.id
      WHERE v.location = (SELECT location FROM venues WHERE id = ?)
        AND b.booking_date = ? 
        AND b.booking_status != 'cancelled'
        AND (
          (b.start_time <= ? AND b.end_time > ?) OR
          (b.start_time < ? AND b.end_time >= ?) OR
          (b.start_time >= ? AND b.end_time <= ?)
        )
    `, [venueId, bookingDate, startTime, startTime, endTime, endTime, startTime, endTime]);

    if (conflictingBookings.length > 0) {
      return Response.json(
        { error: 'Time slot is already booked at this location' },
        { status: 409 }
      );
    }

    // Create booking
    const result = await query(
      'INSERT INTO bookings (venue_id, customer_name, customer_email, customer_phone, booking_date, start_time, end_time, total_amount, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [venueId, customerName, customerEmail, customerPhone, bookingDate, startTime, endTime, totalAmount, notes]
    );

    // Log activity
    await query(
      'INSERT INTO activity_logs (user_id, action, description, entity_type, entity_id) VALUES (?, ?, ?, ?, ?)',
      [userId, 'CREATE_BOOKING', `Created booking for ${customerName} at ${venues[0].name}`, 'booking', result.insertId]
    );

    // Create notification for booking creation
    await query(
      'INSERT INTO notifications (user_id, title, message, type, entity_type, entity_id) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, 'New Booking Created', `Booking created for ${customerName} at ${venues[0].name} on ${bookingDate}`, 'success', 'booking', result.insertId]
    );

    return Response.json({
      success: true,
      message: 'Booking created successfully',
      bookingId: result.insertId
    });

  } catch (error) {
    console.error('Error creating booking:', error);
    return Response.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handleGET, ['admin', 'vendor']);
export const POST = withAuth(handlePOST, ['admin', 'vendor']);
