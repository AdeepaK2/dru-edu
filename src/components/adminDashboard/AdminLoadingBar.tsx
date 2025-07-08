'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { NavigationLoader } from '@/utils/performance';

const AdminLoadingBar: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const loader = NavigationLoader.getInstance();
    let progressInterval: NodeJS.Timeout | null = null;

    const unsubscribe = loader.subscribe((isLoading) => {
      setLoading(isLoading);
      if (isLoading) {
        setProgress(20);
        // Simulate progress
        progressInterval = setInterval(() => {
          setProgress(prev => {
            if (prev >= 90) {
              return 90; // Stay at 90% until navigation completes
            }
            return prev + Math.random() * 15 + 5; // More consistent progress
          });
        }, 150);
      } else {
        if (progressInterval) {
          clearInterval(progressInterval);
          progressInterval = null;
        }
        setProgress(100);
        setTimeout(() => {
          setProgress(0);
        }, 300);
      }
    });

    return () => {
      unsubscribe();
      if (progressInterval) {
        clearInterval(progressInterval);
      }
    };
  }, []);

  if (!loading && progress === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <div 
        className="h-1 bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-200 ease-out"
        style={{ 
          width: `${progress}%`,
          opacity: loading ? 1 : 0
        }}
      />
    </div>
  );
};

export default AdminLoadingBar;
