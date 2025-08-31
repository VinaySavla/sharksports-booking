import { query } from '@/lib/db';
import { withAuth } from '@/lib/auth';

async function handleGET(request, context) {
  try {
    const { params } = context || {};
    const { id } = await params || {};
    
    if (!id) {
      return Response.json({ error: 'Venue ID is required' }, { status: 400 });
    }
    const userRole = request.user.role;
    const userId = request.user.id;

    let whereClause = 'WHERE v.id = ?';
    let queryParams = [id];

    if (userRole === 'vendor') {
      whereClause += ' AND v.vendor_id = ?';
      queryParams.push(userId);
    }

    const venues = await query(`
      SELECT 
        v.*,
        u.name as vendor_name,
        u.email as vendor_email
      FROM venues v
      LEFT JOIN users u ON v.vendor_id = u.id
      ${whereClause}
    `, queryParams);

    if (venues.length === 0) {
      return Response.json(
        { error: 'Venue not found' },
        { status: 404 }
      );
    }

    const venue = venues[0];
    
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

    return Response.json({ success: true, venue });
  } catch (error) {
    console.error('Error fetching venue:', error);
    return Response.json(
      { error: 'Failed to fetch venue' },
      { status: 500 }
    );
  }
}

async function handlePUT(request, context) {
  try {
    const { params } = context || {};
    const { id } = await params || {};
    
    if (!id) {
      return Response.json({ error: 'Venue ID is required' }, { status: 400 });
    }
    
    const { name, location, description, sports, basePrice, peakPrice, capacity, facilities, status } = await request.json();
    const userRole = request.user.role;
    const userId = request.user.id;

    // Check if venue exists and user has permission
    let whereClause = 'WHERE id = ?';
    let queryParams = [id];

    if (userRole === 'vendor') {
      whereClause += ' AND vendor_id = ?';
      queryParams.push(userId);
    }

    const venues = await query(`SELECT id, name FROM venues ${whereClause}`, queryParams);

    if (venues.length === 0) {
      return Response.json(
        { error: 'Venue not found or access denied' },
        { status: 404 }
      );
    }

    // Build update query
    let updateFields = [];
    let updateValues = [];

    if (name) {
      updateFields.push('name = ?');
      updateValues.push(name);
    }
    if (location) {
      updateFields.push('location = ?');
      updateValues.push(location);
    }
    if (description !== undefined) {
      updateFields.push('description = ?');
      updateValues.push(description);
    }
    if (sports) {
      updateFields.push('sports = ?');
      updateValues.push(JSON.stringify(Array.isArray(sports) ? sports : [sports]));
    }
    if (basePrice) {
      updateFields.push('base_price = ?');
      updateValues.push(basePrice);
    }
    if (peakPrice) {
      updateFields.push('peak_price = ?');
      updateValues.push(peakPrice);
    }
    if (capacity) {
      updateFields.push('capacity = ?');
      updateValues.push(capacity);
    }
    if (facilities) {
      updateFields.push('facilities = ?');
      updateValues.push(JSON.stringify(facilities));
    }
    if (status && userRole === 'admin') {
      updateFields.push('status = ?');
      updateValues.push(status);
    }

    updateValues.push(id);

    if (updateFields.length > 0) {
      await query(
        `UPDATE venues SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        updateValues
      );

      // Log activity
      await query(
        'INSERT INTO activity_logs (user_id, action, description, entity_type, entity_id) VALUES (?, ?, ?, ?, ?)',
        [userId, 'UPDATE_VENUE', `Updated venue: ${name || venues[0].name}`, 'venue', id]
      );
    }

    return Response.json({
      success: true,
      message: 'Venue updated successfully'
    });

  } catch (error) {
    console.error('Error updating venue:', error);
    return Response.json(
      { error: 'Failed to update venue' },
      { status: 500 }
    );
  }
}

async function handleDELETE(request, context) {
  try {
    const { params } = context || {};
    const { id } = await params || {};
    
    if (!id) {
      return Response.json({ error: 'Venue ID is required' }, { status: 400 });
    }
    const userRole = request.user.role;
    const userId = request.user.id;

    // Check if venue exists and user has permission
    let whereClause = 'WHERE id = ?';
    let queryParams = [id];

    if (userRole === 'vendor') {
      whereClause += ' AND vendor_id = ?';
      queryParams.push(userId);
    }

    const venues = await query(`SELECT id, name FROM venues ${whereClause}`, queryParams);

    if (venues.length === 0) {
      return Response.json(
        { error: 'Venue not found or access denied' },
        { status: 404 }
      );
    }

    // Delete venue
    await query('DELETE FROM venues WHERE id = ?', [id]);

    // Log activity
    await query(
      'INSERT INTO activity_logs (user_id, action, description, entity_type, entity_id) VALUES (?, ?, ?, ?, ?)',
      [userId, 'DELETE_VENUE', `Deleted venue: ${venues[0].name}`, 'venue', id]
    );

    return Response.json({
      success: true,
      message: 'Venue deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting venue:', error);
    return Response.json(
      { error: 'Failed to delete venue' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handleGET, ['admin', 'vendor']);
export const PUT = withAuth(handlePUT, ['admin', 'vendor']);
export const DELETE = withAuth(handleDELETE, ['admin', 'vendor']);
