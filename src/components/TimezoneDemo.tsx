'use client';

import { useState, useEffect } from 'react';
import { MelbourneDate } from '@/utils/melbourne-date';
import { formatMelbourneDate, getMelbourneOffset } from '@/utils/timezone';

export function TimezoneDemo() {
  const [currentTime, setCurrentTime] = useState<MelbourneDate | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setCurrentTime(MelbourneDate.now());

    // Update time every second
    const interval = setInterval(() => {
      setCurrentTime(MelbourneDate.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!mounted || !currentTime) {
    return <div>Loading timezone information...</div>;
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
      <h3 className="text-lg font-semibold mb-3 text-gray-800">
        Melbourne Timezone Configuration
      </h3>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="font-medium text-gray-600">Current Melbourne Time:</span>
          <span className="text-blue-600 font-mono">{currentTime.toString()}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="font-medium text-gray-600">Short Format:</span>
          <span className="text-green-600 font-mono">{currentTime.toShortString()}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="font-medium text-gray-600">Time Only:</span>
          <span className="text-purple-600 font-mono">{currentTime.toTimeString()}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="font-medium text-gray-600">Day of Week:</span>
          <span className="text-orange-600">{currentTime.getDayOfWeek()}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="font-medium text-gray-600">Month:</span>
          <span className="text-pink-600">{currentTime.getMonthName()}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="font-medium text-gray-600">Timezone Offset:</span>
          <span className="text-red-600 font-mono">{getMelbourneOffset()}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="font-medium text-gray-600">Is Today?:</span>
          <span className={currentTime.isToday() ? "text-green-600" : "text-red-600"}>
            {currentTime.isToday() ? "Yes" : "No"}
          </span>
        </div>
      </div>

      <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
        <p className="text-xs text-blue-800">
          <strong>Configuration Status:</strong> All dates and times in this application 
          are now configured to use Melbourne, Australia timezone (AEST/AEDT). 
          This includes Firestore timestamps, server-side operations, and client-side displays.
        </p>
      </div>
    </div>
  );
}
