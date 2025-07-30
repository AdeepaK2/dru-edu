'use client';

import React, { useEffect, useState } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '@/utils/firebase-client';
import { useRouter } from 'next/navigation';
import { LogOut, Loader } from 'lucide-react';

export default function AdminLogout() {
  const [isLoggingOut, setIsLoggingOut] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const handleLogout = async () => {
      try {
        console.log('Starting logout process...');
        
        // Sign out from Firebase Auth
        await signOut(auth);
        console.log('Successfully signed out from Firebase');
        
        // Clear any cached data (optional)
        if (typeof window !== 'undefined') {
          // Clear localStorage if you're storing any user data
          localStorage.removeItem('adminCache');
          localStorage.removeItem('userPreferences');
          // Clear sessionStorage as well
          sessionStorage.clear();
        }
        
        console.log('Logout completed, redirecting to login...');
        
        // Redirect to login page with a small delay for UX
        setTimeout(() => {
          window.location.href = '/admin/login';
        }, 1000);
        
      } catch (error: any) {
        console.error('Logout error:', error);
        setError('Failed to logout. Please try again.');
        setIsLoggingOut(false);
      }
    };

    handleLogout();
  }, [router]);

  const handleRetry = () => {
    setError('');
    setIsLoggingOut(true);
    // Trigger logout again
    window.location.reload();
  };

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-red-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="w-full max-w-md p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
          <div className="flex flex-col items-center mb-6">
            <div className="h-16 w-16 rounded-full bg-gradient-to-b from-red-600 to-red-700 flex items-center justify-center text-white mb-4">
              <LogOut size={32} />
            </div>
            <h2 className="text-center text-2xl font-bold text-gray-800 dark:text-white">Logout Failed</h2>
            <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-300">
              {error}
            </p>
          </div>
          
          <div className="space-y-4">
            <button
              onClick={handleRetry}
              className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-b from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all shadow-md"
            >
              Try Again
            </button>
            
            <button
              onClick={() => window.location.href = '/admin/login'}
              className="w-full flex justify-center py-3 px-4 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="w-full max-w-md p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
        <div className="flex flex-col items-center">
          <div className="h-16 w-16 rounded-full bg-gradient-to-b from-blue-600 to-blue-700 flex items-center justify-center text-white mb-4">
            <LogOut size={32} />
          </div>
          <h2 className="text-center text-2xl font-bold text-gray-800 dark:text-white mb-2">Logging Out</h2>
          <p className="text-center text-sm text-gray-600 dark:text-gray-300 mb-6">
            Please wait while we sign you out safely...
          </p>
          
          <div className="flex items-center justify-center">
            <Loader className="animate-spin h-8 w-8 text-blue-600" />
          </div>
        </div>
      </div>
    </div>
  );
}
