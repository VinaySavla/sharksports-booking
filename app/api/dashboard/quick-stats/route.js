import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { withAuth } from '@/lib/auth';

async function handleGET(request) {
  try {
    const user = request.user; // User is attached by withAuth
    let quickStats = {};

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

    if (user.role === 'admin') {
        // Admin today's stats
        const [todayBookings] = await query(
          'SELECT COUNT(*) as count FROM bookings WHERE DATE(created_at) = ?',
          [today]
        );
        
        const [confirmedBookings] = await query(
          'SELECT COUNT(*) as count FROM bookings WHERE DATE(created_at) = ? AND booking_status = "confirmed"',
          [today]
        );
        
        const [pendingBookings] = await query(
          'SELECT COUNT(*) as count FROM bookings WHERE DATE(created_at) = ? AND payment_status = "pending"',
          [today]
        );
        
        const [cancelledBookings] = await query(
          'SELECT COUNT(*) as count FROM bookings WHERE DATE(created_at) = ? AND booking_status = "cancelled"',
          [today]
        );
        
        const [todayRevenue] = await query(
          'SELECT COALESCE(SUM(total_amount), 0) as total FROM bookings WHERE DATE(created_at) = ? AND payment_status = "paid"',
          [today]
        );

        quickStats = {
          todayBookings: todayBookings.count,
          confirmedBookings: confirmedBookings.count,
          pendingBookings: pendingBookings.count,
          cancelledBookings: cancelledBookings.count,
          todayRevenue: todayRevenue.total
        };

      } else if (user.role === 'vendor') {
        // Vendor today's stats for their venues only
        const [todayBookings] = await query(
          `SELECT COUNT(*) as count FROM bookings b 
           JOIN venues v ON b.venue_id = v.id 
           WHERE v.vendor_id = ? AND DATE(b.created_at) = ?`,
          [user.id, today]
        );
        
        const [confirmedBookings] = await query(
          `SELECT COUNT(*) as count FROM bookings b 
           JOIN venues v ON b.venue_id = v.id 
           WHERE v.vendor_id = ? AND DATE(b.created_at) = ? AND b.booking_status = "confirmed"`,
          [user.id, today]
        );
        
        const [pendingBookings] = await query(
          `SELECT COUNT(*) as count FROM bookings b 
           JOIN venues v ON b.venue_id = v.id 
           WHERE v.vendor_id = ? AND DATE(b.created_at) = ? AND b.payment_status = "pending"`,
          [user.id, today]
        );
        
        const [cancelledBookings] = await query(
          `SELECT COUNT(*) as count FROM bookings b 
           JOIN venues v ON b.venue_id = v.id 
           WHERE v.vendor_id = ? AND DATE(b.created_at) = ? AND b.booking_status = "cancelled"`,
          [user.id, today]
        );
        
        const [todayRevenue] = await query(
          `SELECT COALESCE(SUM(b.total_amount), 0) as total FROM bookings b 
           JOIN venues v ON b.venue_id = v.id 
           WHERE v.vendor_id = ? AND DATE(b.created_at) = ? AND b.payment_status = "paid"`,
          [user.id, today]
        );

        quickStats = {
          todayBookings: todayBookings.count,
          confirmedBookings: confirmedBookings.count,
          pendingBookings: pendingBookings.count,
          cancelledBookings: cancelledBookings.count,
          todayRevenue: todayRevenue.total
        };
      }

      return NextResponse.json({ success: true, quickStats });
    } catch (error) {
      console.error('Error fetching quick stats:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch quick stats' },
        { status: 500 }
      );
    }
}

export const GET = withAuth(handleGET);
