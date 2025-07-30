'use client';

import React, { useEffect, useState } from 'react';
import { NavigationLoader } from '@/utils/performance';

export default function TeacherLoadingBar() {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const loader = NavigationLoader.getInstance();
    
    const unsubscribe = loader.subscribe((loading) => {
      setIsLoading(loading);
      
      if (loading) {
        setProgress(0);
        // Simulate progress
        const interval = setInterval(() => {
          setProgress(prev => {
            if (prev >= 90) {
              clearInterval(interval);
              return 90;
            }
            return prev + Math.random() * 15;
          });
        }, 100);
        
        return () => clearInterval(interval);
      } else {
        setProgress(100);
        setTimeout(() => setProgress(0), 300);
      }
    });

    return unsubscribe;
  }, []);

  if (!isLoading && progress === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-gray-200 dark:bg-gray-700">
      <div 
        className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-300 ease-out"
        style={{ 
          width: `${progress}%`,
          transition: progress === 100 ? 'width 0.3s ease-out' : 'width 0.1s ease-out'
        }}
      />
    </div>
  );
}
