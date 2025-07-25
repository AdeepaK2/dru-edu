'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { NavigationLoader } from '@/utils/performance';

/**
 * Enhanced navigation loading hook for teacher dashboard
 * Provides smooth transitions and loading states
 */
export const useTeacherNavigation = () => {
  const [isNavigating, setIsNavigating] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const loader = NavigationLoader.getInstance();
    
    // Complete loading when pathname changes
    const timer = setTimeout(() => {
      loader.setLoading(false);
      setIsNavigating(false);
    }, 150); // Slight delay for smooth transition
    
    return () => clearTimeout(timer);
  }, [pathname]);

  const navigateWithLoading = (href: string) => {
    setIsNavigating(true);
    const loader = NavigationLoader.getInstance();
    loader.setLoading(true);
    
    // Use requestAnimationFrame for smooth transition
    requestAnimationFrame(() => {
      router.push(href);
    });
  };

  const preloadRoute = (href: string) => {
    if (typeof window !== 'undefined') {
      router.prefetch(href);
    }
  };

  return {
    isNavigating,
    navigateWithLoading,
    preloadRoute,
    setLoading: (loading: boolean) => {
      const loader = NavigationLoader.getInstance();
      loader.setLoading(loading);
      setIsNavigating(loading);
    }
  };
};
