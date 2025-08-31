import { query } from '@/lib/db';
import { withAuth } from '@/lib/auth';

async function handleGET(request) {
  // Only admins can access payment configuration
  if (request.user.role !== 'admin') {
    return Response.json(
      { success: false, error: 'Access denied' },
      { status: 403 }
    );
  }

  try {
    // Get current PayU configuration from database
    const config = await query(
      'SELECT * FROM payment_config WHERE provider = "payu" LIMIT 1'
    );

    return Response.json({ 
      success: true, 
      config: config[0] || null 
    });
  } catch (error) {
    console.error('Error fetching payment config:', error);
    return Response.json(
      { success: false, error: 'Failed to fetch payment configuration' },
      { status: 500 }
    );
  }
}

async function handlePUT(request) {
  // Only admins can update payment configuration
  if (request.user.role !== 'admin') {
    return Response.json(
      { success: false, error: 'Access denied' },
      { status: 403 }
    );
  }

  try {
    const { merchantKey, merchantSalt, environment } = await request.json();

    // Create payment_config table if it doesn't exist
    await query(`
      CREATE TABLE IF NOT EXISTS payment_config (
        id INT AUTO_INCREMENT PRIMARY KEY,
        provider VARCHAR(50) NOT NULL,
        merchant_key VARCHAR(255),
        merchant_salt VARCHAR(255),
        environment ENUM('test', 'production') NOT NULL DEFAULT 'test',
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_provider (provider)
      )
    `);

    // Check if config already exists
    const existingConfig = await query(
      'SELECT id FROM payment_config WHERE provider = "payu"'
    );

    if (existingConfig.length > 0) {
      // Update existing config
      await query(
        'UPDATE payment_config SET merchant_key = ?, merchant_salt = ?, environment = ?, updated_at = CURRENT_TIMESTAMP WHERE provider = "payu"',
        [merchantKey, merchantSalt, environment]
      );
    } else {
      // Insert new config
      await query(
        'INSERT INTO payment_config (provider, merchant_key, merchant_salt, environment) VALUES (?, ?, ?, ?)',
        ['payu', merchantKey, merchantSalt, environment]
      );
    }

    // Log activity
    await query(
      'INSERT INTO activity_logs (user_id, action, description) VALUES (?, ?, ?)',
      [request.user.id, 'UPDATE_PAYMENT_CONFIG', `Updated PayU payment configuration (${environment} mode)`]
    );

    return Response.json({
      success: true,
      message: 'Payment configuration updated successfully'
    });

  } catch (error) {
    console.error('Error updating payment config:', error);
    return Response.json(
      { success: false, error: 'Failed to update payment configuration' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handleGET, ['admin']);
export const PUT = withAuth(handlePUT, ['admin']);
