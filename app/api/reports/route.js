import { query } from '@/lib/db';
import { withAuth } from '@/lib/auth';

async function handleGET(request) {
  try {
    const url = new URL(request.url);
    const reportType = url.searchParams.get('type') || 'bookings';
    const limit = url.searchParams.get('limit') || '50';
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const venueId = url.searchParams.get('venueId');
    const userRole = request.user.role;
    const userId = request.user.id;

    let results = {};

    switch (reportType) {
      case 'bookings':
        results = await getBookingsReport(startDate, endDate, venueId, userRole, userId);
        break;
      case 'revenue':
        results = await getRevenueReport(startDate, endDate, venueId, userRole, userId);
        break;
      case 'venues':
        results = await getVenuesReport(userRole, userId);
        break;
      case 'activities':
        results = await getActivitiesReport(limit, userRole, userId);
        break;
      default:
        return Response.json({ error: 'Invalid report type' }, { status: 400 });
    }

    return Response.json({ success: true, ...results });
  } catch (error) {
    console.error('Error generating report:', error);
    return Response.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}

async function getBookingsReport(startDate, endDate, venueId, userRole, userId) {
  let whereConditions = [];
  let queryParams = [];

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

  if (userRole === 'vendor') {
    whereConditions.push('v.vendor_id = ?');
    queryParams.push(userId);
  }

  if (startDate) {
    whereConditions.push('b.created_at >= ?');
    queryParams.push(startDate);
  }

  if (endDate) {
    whereConditions.push('b.created_at <= ?');
    queryParams.push(endDate + ' 23:59:59');
  }

  if (venueId) {
    whereConditions.push('b.venue_id = ?');
    queryParams.push(venueId);
  }

  if (whereConditions.length > 0) {
    baseQuery += ' WHERE ' + whereConditions.join(' AND ');
  }

  baseQuery += ' ORDER BY b.created_at DESC';

  const bookings = await query(baseQuery, queryParams);

  // Generate summary statistics
  const totalBookings = bookings.length;
  const totalRevenue = bookings.reduce((sum, booking) => {
    return sum + (booking.payment_status === 'paid' ? parseFloat(booking.total_amount) : 0);
  }, 0);

  const statusCounts = bookings.reduce((counts, booking) => {
    counts[booking.booking_status] = (counts[booking.booking_status] || 0) + 1;
    return counts;
  }, {});

  return {
    bookings,
    summary: {
      totalBookings,
      totalRevenue,
      statusCounts
    }
  };
}

async function getRevenueReport(startDate, endDate, venueId, userRole, userId) {
  let whereConditions = ['b.payment_status = "paid"'];
  let queryParams = [];

  let revenueQuery = `
    SELECT 
      DATE(b.created_at) as date,
      v.name as venue_name,
      SUM(b.total_amount) as daily_revenue,
      COUNT(b.id) as bookings_count
    FROM bookings b
    JOIN venues v ON b.venue_id = v.id
  `;

  if (userRole === 'vendor') {
    whereConditions.push('v.vendor_id = ?');
    queryParams.push(userId);
  }

  if (startDate) {
    whereConditions.push('b.created_at >= ?');
    queryParams.push(startDate);
  }

  if (endDate) {
    whereConditions.push('b.created_at <= ?');
    queryParams.push(endDate + ' 23:59:59');
  }

  if (venueId) {
    whereConditions.push('b.venue_id = ?');
    queryParams.push(venueId);
  }

  revenueQuery += ' WHERE ' + whereConditions.join(' AND ');
  revenueQuery += ' GROUP BY DATE(b.created_at), v.id ORDER BY date DESC';

  const revenueData = await query(revenueQuery, queryParams);

  const totalRevenue = revenueData.reduce((sum, day) => sum + parseFloat(day.daily_revenue), 0);

  return {
    revenueData,
    totalRevenue
  };
}

async function getVenuesReport(userRole, userId) {
  let venueQuery = `
    SELECT 
      v.*,
      u.name as vendor_name,
      COUNT(b.id) as total_bookings,
      SUM(CASE WHEN b.payment_status = 'paid' THEN b.total_amount ELSE 0 END) as total_revenue
    FROM venues v
    LEFT JOIN users u ON v.vendor_id = u.id
    LEFT JOIN bookings b ON v.id = b.venue_id
  `;

  let venueParams = [];
  if (userRole === 'vendor') {
    venueQuery += ' WHERE v.vendor_id = ?';
    venueParams.push(userId);
  }

  venueQuery += ' GROUP BY v.id ORDER BY total_revenue DESC';

  const venues = await query(venueQuery, venueParams);

  return { venues };
}

async function getActivitiesReport(limit, userRole, userId) {
  let activityQuery = `
    SELECT 
      al.*,
      u.name as user_name
    FROM activity_logs al
    LEFT JOIN users u ON al.user_id = u.id
  `;

  let activityParams = [];
  
  if (userRole === 'vendor') {
    // Vendor sees only activities related to their venues
    activityQuery += `
      WHERE (al.entity_type = 'venue' AND al.entity_id IN (
        SELECT id FROM venues WHERE vendor_id = ?
      )) OR (al.entity_type = 'booking' AND al.entity_id IN (
        SELECT b.id FROM bookings b 
        JOIN venues v ON b.venue_id = v.id 
        WHERE v.vendor_id = ?
      )) OR al.user_id = ?
    `;
    activityParams = [userId, userId, userId];
  }

  activityQuery += ' ORDER BY al.created_at DESC';
  
  if (limit) {
    activityQuery += ' LIMIT ?';
    activityParams.push(parseInt(limit));
  }

  const activities = await query(activityQuery, activityParams);
  return { data: activities };
}

export const GET = withAuth(handleGET);
