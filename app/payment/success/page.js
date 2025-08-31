'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, ArrowLeft } from 'lucide-react';

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [bookingId, setBookingId] = useState('');
  const [amount, setAmount] = useState('');

  useEffect(() => {
    setBookingId(searchParams.get('booking') || '');
    setAmount(searchParams.get('amount') || '');
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
        <p className="text-gray-600 mb-6">
          Your booking has been confirmed and payment has been processed successfully.
        </p>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="space-y-2">
            {bookingId && (
              <p className="text-sm">
                <span className="font-medium text-green-800">Booking ID:</span>
                <span className="text-green-700"> #{bookingId}</span>
              </p>
            )}
            {amount && (
              <p className="text-sm">
                <span className="font-medium text-green-800">Amount Paid:</span>
                <span className="text-green-700"> ₹{amount}</span>
              </p>
            )}
            <p className="text-sm text-green-700">
              A confirmation email has been sent to your registered email address.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => router.push('/bookings')}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
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
