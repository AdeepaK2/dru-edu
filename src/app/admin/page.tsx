'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/utils/firebase-client';
import { onAuthStateChanged } from 'firebase/auth';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [adminName, setAdminName] = useState('');
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // User is signed in
        try {
          // Check if user has admin claim
          const idTokenResult = await user.getIdTokenResult();
          
          if (!idTokenResult.claims.admin) {
            // Not an admin, redirect to login
            await auth.signOut();
            router.push('/admin/login');
            return;
          }
          
          // User is an admin
          setAdminName(user.displayName || user.email || 'Admin');
          setLoading(false);
        } catch (error) {
          console.error("Error verifying admin status:", error);
          router.push('/admin/login');
        }
      } else {
        // No user is signed in, redirect to login
        router.push('/admin/login');
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [router]);
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="w-16 h-16 border-t-4 border-primary-600 border-solid rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-secondary-600 dark:text-secondary-300 font-medium">Loading...</p>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-medium p-8 mb-8">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center">
            <div className="mb-4 md:mb-0">
              <h1 className="text-3xl font-heading font-bold text-secondary-800 dark:text-white mb-2">
                Welcome, {adminName}!
              </h1>
              <p className="text-secondary-600 dark:text-secondary-300">
                Manage your educational content, users, and site settings from here.
              </p>
            </div>
            
            <button 
              onClick={() => auth.signOut().then(() => router.push('/admin/login'))}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all flex items-center justify-center shadow-soft"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V7.414a1 1 0 00-.293-.707L11.414 3.293A1 1 0 0010.707 3H3zm8.293 1.293L13 5.586V11h-2v2h2v2H7v-2h2v-2H7V3h4.293z" clipRule="evenodd" />
              </svg>
              Sign Out
            </button>
          </div>
        </div>
          {/* Dashboard Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Stats Card */}
          <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-xl shadow-soft hover:shadow-medium transition-all">
            <div className="flex items-center mb-6">
              <div className="p-3 bg-primary-100 dark:bg-primary-900 rounded-lg mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h2 className="font-heading text-xl font-semibold text-secondary-800 dark:text-white">Statistics</h2>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                <span className="text-secondary-600 dark:text-secondary-300">Total Students</span>
                <span className="text-xl font-medium text-secondary-800 dark:text-white">0</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                <span className="text-secondary-600 dark:text-secondary-300">Total Courses</span>
                <span className="text-xl font-medium text-secondary-800 dark:text-white">0</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-secondary-600 dark:text-secondary-300">Total Lessons</span>
                <span className="text-xl font-medium text-secondary-800 dark:text-white">0</span>
              </div>
            </div>
          </div>
          
          {/* Quick Actions Card */}
          <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-xl shadow-soft hover:shadow-medium transition-all">
            <div className="flex items-center mb-6">
              <div className="p-3 bg-accent-100 dark:bg-accent-900 rounded-lg mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-accent-600 dark:text-accent-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h2 className="font-heading text-xl font-semibold text-secondary-800 dark:text-white">Quick Actions</h2>
            </div>
            <div className="space-y-3">
              <button className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-all shadow-soft flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                Create New Course
              </button>
              <button className="w-full py-3 bg-accent-600 hover:bg-accent-700 text-white rounded-lg transition-all shadow-soft flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                Add New Lesson
              </button>
              <button className="w-full py-3 bg-secondary-600 hover:bg-secondary-700 text-white rounded-lg transition-all shadow-soft flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                Manage Users
              </button>
            </div>
          </div>
          
          {/* Recent Activity Card */}
          <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-xl shadow-soft hover:shadow-medium transition-all">
            <div className="flex items-center mb-6">
              <div className="p-3 bg-secondary-100 dark:bg-secondary-700 rounded-lg mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-secondary-600 dark:text-secondary-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="font-heading text-xl font-semibold text-secondary-800 dark:text-white">Recent Activity</h2>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-secondary-600 dark:text-secondary-300">No recent activity yet</p>
                <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-2">Your recent actions will appear here</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}