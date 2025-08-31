// PayU Integration utilities with database configuration
import { query } from './db';

const PAYU_BASE_URL = process.env.PAYU_BASE_URL || 'https://test.payu.in';

// Get PayU configuration from database (admin settings)
async function getPayUConfig() {
  try {
    const config = await query(
      'SELECT * FROM payment_config WHERE provider = "payu" AND is_active = true LIMIT 1'
    );
    
    if (config.length > 0) {
      return {
        key: config[0].merchant_key || process.env.PAYU_KEY || 'your-payu-key',
        salt: config[0].merchant_salt || process.env.PAYU_SALT || 'your-payu-salt',
        environment: config[0].environment || 'test'
      };
    }
  } catch (error) {
    console.error('Error fetching PayU config:', error);
  }
  
  // Fallback to environment variables
  return {
    key: process.env.PAYU_KEY || 'your-payu-key',
    salt: process.env.PAYU_SALT || 'your-payu-salt',
    environment: 'test'
  };
}

export async function generatePayUHash(data) {
  const config = await getPayUConfig();
  const crypto = require('crypto');
  return crypto.createHash('sha512').update(data + config.salt).digest('hex');
}

export async function createPaymentRequest(bookingData) {
  const config = await getPayUConfig();
  const { bookingId, amount, customerEmail, customerName, customerPhone, venueName } = bookingData;
  
  const paymentData = {
    key: config.key,
    txnid: `TXN_${bookingId}_${Date.now()}`,
    amount: amount.toString(),
    productinfo: `Venue Booking - ${venueName || bookingId}`,
    firstname: customerName,
    email: customerEmail,
    phone: customerPhone,
    surl: `${process.env.NEXTAUTH_URL}/api/payments/success`,
    furl: `${process.env.NEXTAUTH_URL}/api/payments/failure`,
    udf1: bookingId.toString(),
    udf2: '',
    udf3: '',
    udf4: '',
    udf5: ''
  };

  // Generate hash
  const hashString = `${config.key}|${paymentData.txnid}|${paymentData.amount}|${paymentData.productinfo}|${paymentData.firstname}|${paymentData.email}|||||||||||${config.salt}`;
  paymentData.hash = await generatePayUHash(hashString.replace(config.salt, ''));

  return {
    url: PAYU_BASE_URL + (config.environment === 'live' ? '/_payment' : '/test/_payment'),
    data: paymentData
  };
}

export function verifyPaymentResponse(responseData) {
  // In production, verify the hash from PayU response
  // For now, return dummy verification
  return {
    isValid: true,
    status: responseData.status || 'success',
    transactionId: responseData.txnid,
    amount: responseData.amount,
    bookingId: responseData.udf1
  };
}

export async function initiatePayment(bookingData) {
  try {
    // Dummy API call to PayU
    // In production, make actual HTTP request to PayU
    const paymentRequest = createPaymentRequest(bookingData);
    
    return {
      success: true,
      paymentUrl: `${PAYU_BASE_URL}/_payment`,
      paymentData: paymentRequest,
      transactionId: paymentRequest.txnid
    };
  } catch (error) {
    console.error('Payment initiation error:', error);
    return {
      success: false,
      error: 'Failed to initiate payment'
    };
  }
}

export async function handlePaymentCallback(callbackData) {
  try {
    const verification = verifyPaymentResponse(callbackData);
    
    if (verification.isValid) {
      return {
        success: true,
        status: verification.status,
        transactionId: verification.transactionId,
        bookingId: verification.bookingId,
        amount: verification.amount
      };
    } else {
      return {
        success: false,
        error: 'Invalid payment response'
      };
    }
  } catch (error) {
    console.error('Payment callback error:', error);
    return {
      success: false,
      error: 'Failed to process payment callback'
    };
  }
}
