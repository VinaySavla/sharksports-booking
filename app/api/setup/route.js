import { query, initDatabase } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

export async function GET() {
  try {
    // Initialize database and tables
    await initDatabase();

    // Check if admin user exists
    const adminUsers = await query(
      'SELECT id FROM users WHERE role = "admin" LIMIT 1'
    );

    if (adminUsers.length === 0) {
      // Create default admin user
      const adminPassword = await hashPassword(process.env.ADMIN_PASSWORD || 'admin123');
      await query(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        ['Admin User', process.env.ADMIN_EMAIL || 'admin@sharksports.com', adminPassword, 'admin']
      );
    }

    // Check if vendor user exists
    const vendorUsers = await query(
      'SELECT id FROM users WHERE role = "vendor" LIMIT 1'
    );

    if (vendorUsers.length === 0) {
      // Create default vendor user
      const vendorPassword = await hashPassword(process.env.VENDOR_PASSWORD || 'vendor123');
      const vendorResult = await query(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        ['Vendor User', process.env.VENDOR_EMAIL || 'vendor@example.com', vendorPassword, 'vendor']
      );
      
      // Get the vendor ID for creating sample venues
      const vendorId = vendorResult.insertId;
      
      // Add sample venues for the vendor
      const sampleVenues = [
        {
          name: 'Cricket Ground A',
          location: 'Central Sports Complex, Mumbai',
          description: 'Professional cricket ground with floodlights and pavilion',
          sports: 'Cricket',
          base_price: 2500.00,
          peak_price: 3500.00,
          capacity: 50,
          facilities: JSON.stringify(['Floodlights', 'Pavilion', 'Parking', 'Restrooms'])
        },
        {
          name: 'Football Field B',
          location: 'Sports City, Delhi',
          description: 'Full-size football field with artificial turf',
          sports: 'Football',
          base_price: 3000.00,
          peak_price: 4000.00,
          capacity: 40,
          facilities: JSON.stringify(['Artificial Turf', 'Changing Rooms', 'First Aid', 'Parking'])
        },
        {
          name: 'Basketball Court C',
          location: 'Indoor Sports Arena, Bangalore',
          description: 'Indoor basketball court with professional lighting',
          sports: 'Basketball',
          base_price: 1500.00,
          peak_price: 2000.00,
          capacity: 30,
          facilities: JSON.stringify(['Indoor Court', 'Air Conditioning', 'Sound System', 'Lockers'])
        }
      ];

      for (const venue of sampleVenues) {
        const venueResult = await query(
          'INSERT INTO venues (name, location, description, vendor_id, sports, base_price, peak_price, capacity, facilities) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [venue.name, venue.location, venue.description, vendorId, venue.sports, venue.base_price, venue.peak_price, venue.capacity, venue.facilities]
        );

        // Add some sample bookings for each venue
        const venueId = venueResult.insertId;
        const sampleBookings = [
          {
            customer_name: 'John Doe',
            customer_email: 'john@example.com',
            customer_phone: '+91-9876543210',
            booking_date: new Date().toISOString().split('T')[0], // Today
            start_time: '10:00:00',
            end_time: '12:00:00',
            total_amount: venue.base_price,
            payment_status: 'paid',
            booking_status: 'confirmed'
          },
          {
            customer_name: 'Jane Smith',
            customer_email: 'jane@example.com',
            customer_phone: '+91-9876543211',
            booking_date: new Date(Date.now() + 24*60*60*1000).toISOString().split('T')[0], // Tomorrow
            start_time: '14:00:00',
            end_time: '16:00:00',
            total_amount: venue.peak_price,
            payment_status: 'pending',
            booking_status: 'confirmed'
          }
        ];

        for (const booking of sampleBookings) {
          await query(
            'INSERT INTO bookings (venue_id, customer_name, customer_email, customer_phone, booking_date, start_time, end_time, total_amount, payment_status, booking_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [venueId, booking.customer_name, booking.customer_email, booking.customer_phone, booking.booking_date, booking.start_time, booking.end_time, booking.total_amount, booking.payment_status, booking.booking_status]
          );
        }

        // Add activity log for venue creation
        await query(
          'INSERT INTO activity_logs (user_id, action, description, entity_type, entity_id) VALUES (?, ?, ?, ?, ?)',
          [vendorId, 'Venue Created', `Created new venue: ${venue.name}`, 'venue', venueId]
        );
      }

      // Add some general activity logs
      const adminResult = await query('SELECT id FROM users WHERE role = "admin" LIMIT 1');
      const adminId = adminResult[0]?.id;

      if (adminId) {
        await query(
          'INSERT INTO activity_logs (user_id, action, description) VALUES (?, ?, ?)',
          [adminId, 'System Setup', 'Database initialized with sample data']
        );
        
        await query(
          'INSERT INTO activity_logs (user_id, action, description) VALUES (?, ?, ?)',
          [vendorId, 'Account Created', 'Vendor account created and activated']
        );
      }
    }

    return Response.json({
      success: true,
      message: 'Database initialized successfully',
      defaultUsers: {
        admin: { 
          email: process.env.ADMIN_EMAIL || 'admin@sharksports.com', 
          password: process.env.ADMIN_PASSWORD || 'admin123' 
        },
        vendor: { 
          email: process.env.VENDOR_EMAIL || 'vendor@example.com', 
          password: process.env.VENDOR_PASSWORD || 'vendor123' 
        }
      }
    });

  } catch (error) {
    console.error('Database setup error:', error);
    return Response.json(
      { error: 'Failed to initialize database', details: error.message },
      { status: 500 }
    );
  }
}
