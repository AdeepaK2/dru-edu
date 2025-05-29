'use client';

import { useEffect } from 'react';
import { MELBOURNE_TIMEZONE } from '@/utils/timezone';

export function TimezoneProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Set timezone globally for the browser session
    if (typeof window !== 'undefined') {
      // Store Melbourne timezone preference in localStorage for consistency
      localStorage.setItem('timezone', MELBOURNE_TIMEZONE);
      
      // Override Date.prototype.toString to always show Melbourne time
      const originalToString = Date.prototype.toString;
      Date.prototype.toString = function() {
        return this.toLocaleString('en-AU', { 
          timeZone: MELBOURNE_TIMEZONE,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        });
      };
      
      // Override toLocaleString default to Melbourne timezone
      const originalToLocaleString = Date.prototype.toLocaleString;
      Date.prototype.toLocaleString = function(locales?: string | string[], options?: Intl.DateTimeFormatOptions) {
        const defaultOptions = {
          timeZone: MELBOURNE_TIMEZONE,
          ...options
        };
        return originalToLocaleString.call(this, locales || 'en-AU', defaultOptions);
      };
    }
  }, []);

  return <>{children}</>;
}
