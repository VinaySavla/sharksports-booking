import { query } from '@/lib/db';
import { withAuth, hashPassword } from '@/lib/auth';

async function handleGET(request) {
  try {
    const vendors = await query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.phone,
        u.status,
        u.created_at,
        COUNT(v.id) as venue_count
      FROM users u
      LEFT JOIN venues v ON u.id = v.vendor_id
      WHERE u.role = 'vendor'
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `);

    return Response.json({ success: true, vendors });
  } catch (error) {
    console.error('Error fetching vendors:', error);
    return Response.json(
      { error: 'Failed to fetch vendors' },
      { status: 500 }
    );
  }
}

async function handlePOST(request) {
  try {
    const { name, email, phone, password } = await request.json();

    if (!name || !email || !password) {
      return Response.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUsers = await query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return Response.json(
        { error: 'Email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Insert vendor
    const result = await query(
      'INSERT INTO users (name, email, phone, password, role) VALUES (?, ?, ?, ?, "vendor")',
      [name, email, phone, hashedPassword]
    );

    // Log activity
    await query(
      'INSERT INTO activity_logs (user_id, action, description, entity_type, entity_id) VALUES (?, ?, ?, ?, ?)',
      [request.user.id, 'CREATE_VENDOR', `Created vendor: ${name}`, 'vendor', result.insertId]
    );

    return Response.json({
      success: true,
      message: 'Vendor created successfully',
      vendorId: result.insertId
    });

  } catch (error) {
    console.error('Error creating vendor:', error);
    return Response.json(
      { error: 'Failed to create vendor' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handleGET, ['admin']);
export const POST = withAuth(handlePOST, ['admin']);
