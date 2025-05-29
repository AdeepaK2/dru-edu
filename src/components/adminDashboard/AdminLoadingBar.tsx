'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { NavigationLoader } from '@/utils/performance';

const AdminLoadingBar: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const loader = NavigationLoader.getInstance();
    const unsubscribe = loader.subscribe((isLoading) => {
      setLoading(isLoading);
      if (isLoading) {
        setProgress(20);
        // Simulate progress
        const interval = setInterval(() => {
          setProgress(prev => {
            if (prev >= 90) {
              clearInterval(interval);
              return 90;
            }
            return prev + Math.random() * 30;
          });
        }, 200);
        
        return () => clearInterval(interval);
      } else {
        setProgress(100);
        setTimeout(() => setProgress(0), 200);
      }
    });

    return unsubscribe;
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
