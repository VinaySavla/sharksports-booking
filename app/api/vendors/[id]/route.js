import { query } from '@/lib/db';
import { withAuth, hashPassword } from '@/lib/auth';

async function handleGET(request, context) {
  try {
    const { params } = context || {};
    const { id } = await params || {};
    
    if (!id) {
      return Response.json({ error: 'Vendor ID is required' }, { status: 400 });
    }
    
    const vendors = await query(
      'SELECT id, name, email, phone, status, created_at FROM users WHERE id = ? AND role = "vendor"',
      [id]
    );

    if (vendors.length === 0) {
      return Response.json(
        { error: 'Vendor not found' },
        { status: 404 }
      );
    }

    return Response.json({ success: true, vendor: vendors[0] });
  } catch (error) {
    console.error('Error fetching vendor:', error);
    return Response.json(
      { error: 'Failed to fetch vendor' },
      { status: 500 }
    );
  }
}

async function handlePUT(request, context) {
  try {
    const { params } = context || {};
    const { id } = await params || {};
    
    if (!id) {
      return Response.json({ error: 'Vendor ID is required' }, { status: 400 });
    }
    const { name, email, phone, status, password } = await request.json();

    // Check if vendor exists
    const vendors = await query(
      'SELECT id FROM users WHERE id = ? AND role = "vendor"',
      [id]
    );

    if (vendors.length === 0) {
      return Response.json(
        { error: 'Vendor not found' },
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
    if (email) {
      updateFields.push('email = ?');
      updateValues.push(email);
    }
    if (phone) {
      updateFields.push('phone = ?');
      updateValues.push(phone);
    }
    if (status) {
      updateFields.push('status = ?');
      updateValues.push(status);
    }
    if (password) {
      const hashedPassword = await hashPassword(password);
      updateFields.push('password = ?');
      updateValues.push(hashedPassword);
    }

    updateValues.push(id);

    if (updateFields.length > 0) {
      await query(
        `UPDATE users SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        updateValues
      );

      // Log activity
      await query(
        'INSERT INTO activity_logs (user_id, action, description, entity_type, entity_id) VALUES (?, ?, ?, ?, ?)',
        [request.user.id, 'UPDATE_VENDOR', `Updated vendor: ${name || id}`, 'vendor', id]
      );
    }

    return Response.json({
      success: true,
      message: 'Vendor updated successfully'
    });

  } catch (error) {
    console.error('Error updating vendor:', error);
    return Response.json(
      { error: 'Failed to update vendor' },
      { status: 500 }
    );
  }
}

async function handleDELETE(request, context) {
  try {
    const { params } = context || {};
    const { id } = await params || {};
    
    if (!id) {
      return Response.json({ error: 'Vendor ID is required' }, { status: 400 });
    }

    // Check if vendor exists
    const vendors = await query(
      'SELECT name FROM users WHERE id = ? AND role = "vendor"',
      [id]
    );

    if (vendors.length === 0) {
      return Response.json(
        { error: 'Vendor not found' },
        { status: 404 }
      );
    }

    // Delete vendor (this will also cascade delete venues due to foreign key)
    await query('DELETE FROM users WHERE id = ? AND role = "vendor"', [id]);

    // Log activity
    await query(
      'INSERT INTO activity_logs (user_id, action, description, entity_type, entity_id) VALUES (?, ?, ?, ?, ?)',
      [request.user.id, 'DELETE_VENDOR', `Deleted vendor: ${vendors[0].name}`, 'vendor', id]
    );

    return Response.json({
      success: true,
      message: 'Vendor deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting vendor:', error);
    return Response.json(
      { error: 'Failed to delete vendor' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handleGET, ['admin']);
export const PUT = withAuth(handlePUT, ['admin']);
export const DELETE = withAuth(handleDELETE, ['admin']);
