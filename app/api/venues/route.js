import { query } from '@/lib/db';
import { withAuth } from '@/lib/auth';

async function handleGET(request) {
  try {
    const url = new URL(request.url);
    const vendorId = url.searchParams.get('vendorId');
    const userRole = request.user.role;
    const userId = request.user.id;

    let venues;

    if (userRole === 'admin') {
      // Admin can see all venues
      if (vendorId) {
        venues = await query(`
          SELECT 
            v.*,
            u.name as vendor_name,
            u.email as vendor_email
          FROM venues v
          LEFT JOIN users u ON v.vendor_id = u.id
          WHERE v.vendor_id = ?
          ORDER BY v.created_at DESC
        `, [vendorId]);
      } else {
        venues = await query(`
          SELECT 
            v.*,
            u.name as vendor_name,
            u.email as vendor_email
          FROM venues v
          LEFT JOIN users u ON v.vendor_id = u.id
          ORDER BY v.created_at DESC
        `);
      }
    } else {
      // Vendor can only see their own venues
      venues = await query(`
        SELECT 
          v.*,
          u.name as vendor_name,
          u.email as vendor_email
        FROM venues v
        LEFT JOIN users u ON v.vendor_id = u.id
        WHERE v.vendor_id = ?
        ORDER BY v.created_at DESC
      `, [userId]);
    }

    // Parse JSON fields for all venues
    venues.forEach(venue => {
      // Handle facilities field - could be string or JSON array
      try {
        venue.facilities = JSON.parse(venue.facilities || '[]');
      } catch (e) {
        // If it's not valid JSON, treat as comma-separated string
        venue.facilities = venue.facilities ? venue.facilities.split(',').map(f => f.trim()) : [];
      }
      
      // Handle sports field - could be string or JSON array
      try {
        venue.sports = JSON.parse(venue.sports || '[]');
      } catch (e) {
        // If it's not valid JSON, treat as a single sport string
        venue.sports = venue.sports ? [venue.sports] : [];
      }
    });

    return Response.json({ success: true, venues });
  } catch (error) {
    console.error('Error fetching venues:', error);
    return Response.json(
      { error: 'Failed to fetch venues' },
      { status: 500 }
    );
  }
}

async function handlePOST(request) {
  try {
    const { name, location, description, vendorId, sports, basePrice, peakPrice, capacity, facilities } = await request.json();
    const userRole = request.user.role;
    const userId = request.user.id;

    if (!name || !location || !sports || sports.length === 0 || !basePrice || !capacity) {
      return Response.json(
        { error: 'Name, location, at least one sport, base price, and capacity are required' },
        { status: 400 }
      );
    }

    // Determine vendor ID
    let finalVendorId = vendorId;
    if (userRole === 'vendor') {
      finalVendorId = userId; // Vendors can only create venues for themselves
    }

    // Convert sports array to JSON string for database storage
    const sportsJson = JSON.stringify(Array.isArray(sports) ? sports : [sports]);

    // Insert venue
    const result = await query(
      'INSERT INTO venues (name, location, description, vendor_id, sports, base_price, peak_price, capacity, facilities) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        name, 
        location, 
        description, 
        finalVendorId,
        sportsJson, 
        basePrice, 
        peakPrice || basePrice, 
        capacity, 
        JSON.stringify(facilities || [])
      ]
    );

    // Log activity
    await query(
      'INSERT INTO activity_logs (user_id, action, description, entity_type, entity_id) VALUES (?, ?, ?, ?, ?)',
      [userId, 'CREATE_VENUE', `Created venue: ${name}`, 'venue', result.insertId]
    );

    return Response.json({
      success: true,
      message: 'Venue created successfully',
      venueId: result.insertId
    });

  } catch (error) {
    console.error('Error creating venue:', error);
    return Response.json(
      { error: 'Failed to create venue' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handleGET, ['admin', 'vendor']);
export const POST = withAuth(handlePOST, ['admin', 'vendor']);
