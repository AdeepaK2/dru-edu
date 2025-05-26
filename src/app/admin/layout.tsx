'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { auth } from '@/utils/firebase-client';
import { onAuthStateChanged } from 'firebase/auth';
import Navbar from '@/components/adminDashboard/Navbar';
import Sidebar from '@/components/adminDashboard/Sidebar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(true);
  const [adminName, setAdminName] = useState('Admin User');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const router = useRouter();
  const pathname = usePathname();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    // Don't run auth checks on the login page to prevent circular redirects
    if (pathname === '/admin/login') {
      setLoading(false);
      return () => {};
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const idTokenResult = await user.getIdTokenResult();
          
          if (!idTokenResult.claims.admin) {
            await auth.signOut();
            console.log('No admin privileges, redirecting to login');
            window.location.href = '/admin/login';
            return;
          }
          
          setAdminName(user.displayName || user.email || 'Admin');
          setLoading(false);
        } catch (error) {
          console.error("Error verifying admin status:", error);
          window.location.href = '/admin/login';
        }
      } else {
        console.log('No user, redirecting to login');
        window.location.href = '/admin/login';
      }
    });

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

  // Skip layout for login page
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }  // No sidebar items needed here since we're using the Sidebar component
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Top Navbar */}
      <Navbar 
        adminName={adminName} 
        currentTime={currentTime} 
        toggleSidebar={toggleSidebar} 
      />

      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-10 bg-gray-600 bg-opacity-50 lg:hidden" onClick={() => setSidebarOpen(false)}></div>
      )}

      {/* Main content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'} mt-16`}>
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
