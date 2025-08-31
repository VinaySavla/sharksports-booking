'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const token = Cookies.get('token');
    
    if (token) {
      // User is logged in, redirect to dashboard
      router.push('/dashboard');
    } else {
      // User is not logged in, redirect to login
      router.push('/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
          <span className="text-white font-bold text-xl">SS</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{process.env.NEXT_PUBLIC_APP_NAME || 'SharkSports'}</h1>
        <p className="text-gray-600">Loading...</p>
        <div className="mt-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    </div>
  );
}
