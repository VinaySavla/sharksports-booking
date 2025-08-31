import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { withAuth } from '@/lib/auth';

async function handleGET(request) {
  try {
    const user = request.user; // User is attached by withAuth
    let stats = {};

    if (user.role === 'admin') {
        // Admin sees all platform stats
        const [vendorCount] = await query(
          'SELECT COUNT(*) as count FROM users WHERE role = "vendor"'
        );
        
        const [venueCount] = await query(
          'SELECT COUNT(*) as count FROM venues WHERE status = "active"'
        );
        
        const [bookingCount] = await query(
          'SELECT COUNT(*) as count FROM bookings'
        );
        
        const [revenueSum] = await query(
          'SELECT COALESCE(SUM(total_amount), 0) as total FROM bookings WHERE payment_status = "paid"'
        );

        // Get monthly booking trends (last 6 months)
        const bookingTrends = await query(`
          SELECT 
            DATE_FORMAT(created_at, '%Y-%m') as month,
            COUNT(*) as bookings,
            SUM(total_amount) as revenue
          FROM bookings 
          WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
          GROUP BY DATE_FORMAT(created_at, '%Y-%m')
          ORDER BY month ASC
        `);

        // Get venue types distribution
        const venueTypes = await query(`
          SELECT 
            CASE 
              WHEN LOWER(name) LIKE '%cricket%' THEN 'Cricket Grounds'
              WHEN LOWER(name) LIKE '%football%' OR LOWER(name) LIKE '%soccer%' THEN 'Football Fields'
              WHEN LOWER(name) LIKE '%basketball%' THEN 'Basketball Courts'
              WHEN LOWER(name) LIKE '%tennis%' THEN 'Tennis Courts'
              WHEN LOWER(name) LIKE '%badminton%' THEN 'Badminton Courts'
              ELSE 'Other Sports'
            END as venue_type,
            COUNT(*) as count
          FROM venues 
          WHERE status = 'active'
          GROUP BY venue_type
          ORDER BY count DESC
        `);

        stats = {
          totalVendors: vendorCount.count,
          totalVenues: venueCount.count,
          totalBookings: bookingCount.count,
          totalRevenue: revenueSum.total,
          bookingTrends,
          venueTypes
        };

      } else if (user.role === 'vendor') {
        // Vendor sees only their venue stats
        const [venueCount] = await query(
          'SELECT COUNT(*) as count FROM venues WHERE vendor_id = ? AND status = "active"',
          [user.id]
        );
        
        const [bookingCount] = await query(
          `SELECT COUNT(*) as count FROM bookings b 
           JOIN venues v ON b.venue_id = v.id 
           WHERE v.vendor_id = ?`,
          [user.id]
        );
        
        const [revenueSum] = await query(
          `SELECT COALESCE(SUM(b.total_amount), 0) as total 
           FROM bookings b 
           JOIN venues v ON b.venue_id = v.id 
           WHERE v.vendor_id = ? AND b.payment_status = "paid"`,
          [user.id]
        );

        // Get vendor's booking trends
        const bookingTrends = await query(`
          SELECT 
            DATE_FORMAT(b.created_at, '%Y-%m') as month,
            COUNT(*) as bookings,
            SUM(b.total_amount) as revenue
          FROM bookings b
          JOIN venues v ON b.venue_id = v.id
          WHERE v.vendor_id = ? AND b.created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
          GROUP BY DATE_FORMAT(b.created_at, '%Y-%m')
          ORDER BY month ASC
        `, [user.id]);

        // Get vendor's venue types
        const venueTypes = await query(`
          SELECT 
            CASE 
              WHEN LOWER(name) LIKE '%cricket%' THEN 'Cricket Grounds'
              WHEN LOWER(name) LIKE '%football%' OR LOWER(name) LIKE '%soccer%' THEN 'Football Fields'
              WHEN LOWER(name) LIKE '%basketball%' THEN 'Basketball Courts'
              WHEN LOWER(name) LIKE '%tennis%' THEN 'Tennis Courts'
              WHEN LOWER(name) LIKE '%badminton%' THEN 'Badminton Courts'
              ELSE 'Other Sports'
            END as venue_type,
            COUNT(*) as count
          FROM venues 
          WHERE vendor_id = ? AND status = 'active'
          GROUP BY venue_type
          ORDER BY count DESC
        `, [user.id]);

        stats = {
          totalVenues: venueCount.count,
          totalBookings: bookingCount.count,
          totalRevenue: revenueSum.total,
          bookingTrends,
          venueTypes
        };
      } else {
        // Default case for unknown roles
        stats = {
          totalVenues: 0,
          totalBookings: 0,
          totalRevenue: 0,
          bookingTrends: [],
          venueTypes: []
        };
      }

      return NextResponse.json({ success: true, stats });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch dashboard stats' },
        { status: 500 }
      );
    }
}

export const GET = withAuth(handleGET);
