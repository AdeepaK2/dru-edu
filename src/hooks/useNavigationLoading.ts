'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { NavigationLoader } from '@/utils/performance';

/**
 * Custom hook to manage navigation loading state
 * This ensures the loading bar completes when pages finish loading
 */
export const useNavigationLoading = () => {
  const pathname = usePathname();

  useEffect(() => {
    const loader = NavigationLoader.getInstance();
    
    // Complete loading when pathname changes (page loaded)
    if (loader.getLoading()) {
      const timer = setTimeout(() => {
        loader.setLoading(false);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [pathname]);

  return {
    setLoading: (loading: boolean) => {
      const loader = NavigationLoader.getInstance();
      loader.setLoading(loading);
    },
    startLoading: () => {
      const loader = NavigationLoader.getInstance();
      loader.setLoading(true);
      loader.autoComplete(3000); // Auto-complete after 3 seconds as fallback
    }
  };
};
