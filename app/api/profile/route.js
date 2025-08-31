import { query } from '@/lib/db';
import { withAuth, hashPassword, comparePassword } from '@/lib/auth';

async function handleGET(request) {
  try {
    const userId = request.user.id;

    const users = await query(
      'SELECT id, name, email, phone, role, created_at FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return Response.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return Response.json({ success: true, user: users[0] });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return Response.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

async function handlePUT(request) {
  try {
    const userId = request.user.id;
    const { name, email, phone, currentPassword, newPassword } = await request.json();

    // If changing password, verify current password
    if (newPassword) {
      if (!currentPassword) {
        return Response.json(
          { error: 'Current password is required to set new password' },
          { status: 400 }
        );
      }

      const users = await query(
        'SELECT password FROM users WHERE id = ?',
        [userId]
      );

      if (users.length === 0) {
        return Response.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      const isCurrentPasswordValid = await comparePassword(currentPassword, users[0].password);
      if (!isCurrentPasswordValid) {
        return Response.json(
          { error: 'Current password is incorrect' },
          { status: 400 }
        );
      }
    }

    // Build update query
    let updateFields = [];
    let updateValues = [];

    if (name) {
      updateFields.push('name = ?');
      updateValues.push(name);
    }
    if (email) {
      // Check if email is already taken by another user
      const existingUsers = await query(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [email, userId]
      );

      if (existingUsers.length > 0) {
        return Response.json(
          { error: 'Email is already taken' },
          { status: 409 }
        );
      }

      updateFields.push('email = ?');
      updateValues.push(email);
    }
    if (phone !== undefined) {
      updateFields.push('phone = ?');
      updateValues.push(phone);
    }
    if (newPassword) {
      const hashedPassword = await hashPassword(newPassword);
      updateFields.push('password = ?');
      updateValues.push(hashedPassword);
    }

    updateValues.push(userId);

    if (updateFields.length > 0) {
      await query(
        `UPDATE users SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        updateValues
      );

      // Log activity
      await query(
        'INSERT INTO activity_logs (user_id, action, description, entity_type, entity_id) VALUES (?, ?, ?, ?, ?)',
        [userId, 'UPDATE_PROFILE', 'Updated profile information', 'user', userId]
      );
    }

    // Return updated user data
    const updatedUsers = await query(
      'SELECT id, name, email, phone, role, created_at FROM users WHERE id = ?',
      [userId]
    );

    return Response.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUsers[0]
    });

  } catch (error) {
    console.error('Error updating profile:', error);
    return Response.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handleGET, ['admin', 'vendor']);
export const PUT = withAuth(handlePUT, ['admin', 'vendor']);
