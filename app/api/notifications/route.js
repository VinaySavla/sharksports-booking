import { query } from '@/lib/db';
import { withAuth } from '@/lib/auth';

async function handleGET(request) {
  try {
    const url = new URL(request.url);
    const limit = url.searchParams.get('limit') || '20';
    const unreadOnly = url.searchParams.get('unreadOnly') === 'true';
    const userId = request.user.id;

    let notificationQuery = `
      SELECT 
        id,
        title,
        message,
        type,
        is_read,
        entity_type,
        entity_id,
        created_at
      FROM notifications 
      WHERE user_id = ?
    `;
    let queryParams = [userId];

    if (unreadOnly) {
      notificationQuery += ' AND is_read = FALSE';
    }

    notificationQuery += ' ORDER BY created_at DESC LIMIT ?';
    queryParams.push(parseInt(limit));

    const notifications = await query(notificationQuery, queryParams);

    // Get unread count
    const unreadCountResult = await query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE',
      [userId]
    );
    const unreadCount = unreadCountResult[0].count;

    return Response.json({ 
      success: true, 
      notifications,
      unreadCount
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return Response.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

async function handlePOST(request) {
  try {
    const { userIds, title, message, type = 'info', entityType, entityId } = await request.json();

    if (!userIds || !title || !message) {
      return Response.json(
        { error: 'User IDs, title, and message are required' },
        { status: 400 }
      );
    }

    const promises = userIds.map(userId => 
      query(
        'INSERT INTO notifications (user_id, title, message, type, entity_type, entity_id) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, title, message, type, entityType, entityId]
      )
    );

    await Promise.all(promises);

    return Response.json({
      success: true,
      message: 'Notifications created successfully'
    });
  } catch (error) {
    console.error('Error creating notifications:', error);
    return Response.json(
      { error: 'Failed to create notifications' },
      { status: 500 }
    );
  }
}

async function handlePUT(request) {
  try {
    const { notificationIds, markAsRead = true } = await request.json();
    const userId = request.user.id;

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return Response.json(
        { error: 'Notification IDs array is required' },
        { status: 400 }
      );
    }

    const placeholders = notificationIds.map(() => '?').join(', ');
    const queryParams = [markAsRead, userId, ...notificationIds];

    await query(
      `UPDATE notifications SET is_read = ? WHERE user_id = ? AND id IN (${placeholders})`,
      queryParams
    );

    return Response.json({
      success: true,
      message: 'Notifications updated successfully'
    });
  } catch (error) {
    console.error('Error updating notifications:', error);
    return Response.json(
      { error: 'Failed to update notifications' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handleGET);
export const POST = withAuth(handlePOST, ['admin', 'vendor']);
export const PUT = withAuth(handlePUT);
