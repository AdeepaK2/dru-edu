'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { auth } from '@/utils/firebase-client';
import { onAuthStateChanged } from 'firebase/auth';
import Navbar from '@/components/adminDashboard/Navbar';
import Sidebar from '@/components/adminDashboard/Sidebar';
import AdminLoadingBar from '@/components/adminDashboard/AdminLoadingBar';
import { prefetchAdminPages } from '@/utils/performance';
import { MelbourneDate } from '@/utils/melbourne-date';
import { useNavigationLoading } from '@/hooks/useNavigationLoading';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {  
  const [loading, setLoading] = useState(true);
  const [adminName, setAdminName] = useState('Admin User');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentTime, setCurrentTime] = useState(MelbourneDate.now());
  const [authChecked, setAuthChecked] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { setLoading: setNavLoading } = useNavigationLoading();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(MelbourneDate.now());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Prefetch admin pages for faster navigation
  useEffect(() => {
    prefetchAdminPages();
  }, []);
    useEffect(() => {
    // Don't run auth checks on the login and logout pages to prevent circular redirects
    if (pathname === '/admin/login' || pathname === '/admin/logout') {
      setLoading(false);
      return () => {};
    }

    // Skip auth check if already verified and not on login/logout pages
    if (authChecked && pathname !== '/admin/login' && pathname !== '/admin/logout') {
      setLoading(false);
      return () => {};
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Cache admin verification to avoid repeated token checks
          const idTokenResult = await user.getIdTokenResult(false); // Don't force refresh
          
          if (!idTokenResult.claims.admin) {
            await auth.signOut();
            console.log('No admin privileges, redirecting to login');
            window.location.href = '/admin/login';
            return;
          }
            setAdminName(user.displayName || user.email || 'Admin');
          setAuthChecked(true);
          setLoading(false);
          setNavLoading(false); // Complete navigation loading when auth is complete
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
  }, [pathname, authChecked]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="w-16 h-16 border-t-4 border-primary-600 border-solid rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-secondary-600 dark:text-secondary-300 font-medium">Loading...</p>
        </div>
      </div>
    );
  }  // Skip layout for login and logout pages
  if (pathname === '/admin/login' || pathname === '/admin/logout') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">      {/* Loading Bar - Temporarily disabled for better navigation */}
      {/* <AdminLoadingBar /> */}
      
      {/* Top Navbar */}
      <Navbar 
        adminName={adminName} 
        currentTime={currentTime} 
        toggleSidebar={toggleSidebar} 
      />      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-10 bg-gray-600 bg-opacity-50 lg:hidden" onClick={() => setSidebarOpen(false)}></div>
      )}
      
      {/* Main content */}
      <div className={`transition-all duration-200 ${sidebarOpen ? 'ml-64' : 'ml-16'} mt-16`}>
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
