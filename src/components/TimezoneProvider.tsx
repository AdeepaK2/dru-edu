'use client';

import { useEffect } from 'react';

const MELBOURNE_TIMEZONE = 'Australia/Melbourne';

export function TimezoneProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Only run on client side - avoid SSR issues
    if (typeof window === 'undefined') return;
    
    try {
      // Store Melbourne timezone preference in localStorage for consistency
      localStorage.setItem('timezone', MELBOURNE_TIMEZONE);
      
      // Only modify prototypes if they haven't been modified yet
      if (!(window as any).__datePrototypeModified) {
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
        
        // Mark as modified to prevent double modification
        (window as any).__datePrototypeModified = true;
      }
    } catch (error) {
      console.warn('Failed to set up timezone provider:', error);
    }
  }, []);

  return <>{children}</>;
}
