'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react';

export default function PaymentFailurePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [bookingId, setBookingId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setBookingId(searchParams.get('booking') || '');
    setError(searchParams.get('error') || 'Payment processing failed');
  }, [searchParams]);

  const handleRetryPayment = () => {
    // In a real implementation, this would redirect to payment gateway again
    alert('Retry payment functionality will be implemented with actual PayU integration');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-8 h-8 text-red-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h1>
        <p className="text-gray-600 mb-6">
          We were unable to process your payment. Please try again or contact support.
        </p>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="space-y-2">
            {bookingId && (
              <p className="text-sm">
                <span className="font-medium text-red-800">Booking ID:</span>
                <span className="text-red-700"> #{bookingId}</span>
              </p>
            )}
            <p className="text-sm text-red-700">
              <span className="font-medium">Error:</span> {error}
            </p>
            <p className="text-sm text-red-700">
              Your booking is still reserved. You can try making the payment again.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleRetryPayment}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
          >
            <RefreshCw size={16} className="mr-2" />
            Retry Payment
          </button>
          <button
            onClick={() => router.push('/bookings')}
            className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
          >
            View My Bookings
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full flex items-center justify-center text-gray-600 hover:text-gray-800 py-2 px-4 transition-colors"
          >
            <ArrowLeft size={16} className="mr-2" />
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
