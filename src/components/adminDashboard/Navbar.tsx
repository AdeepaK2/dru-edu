'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu } from 'lucide-react';

interface NavbarProps {
  adminName: string;
  currentTime: Date;
  toggleSidebar: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ adminName, currentTime, toggleSidebar }) => {
  const router = useRouter();

  // Format time with hours, minutes, and seconds
  const formattedTime = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(currentTime);

  // Format date
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(currentTime);

  return (
    <header className="fixed top-0 left-0 right-0 bg-white dark:bg-gray-900 shadow-md z-20">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center">          <button 
            onClick={toggleSidebar}
            className="mr-3 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full p-2"
            aria-label="Toggle Sidebar"
          >
            <Menu size={20} />
          </button>
          
          <Link href="/admin" className="flex items-center">
            <span className="text-xl font-bold text-blue-600">Dr.U Education</span>
            <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-md">Admin</span>
          </Link>
        </div>

        <div className="flex items-center space-x-6">
          {/* System Clock */}
          <div className="hidden md:flex flex-col items-end">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{formattedTime}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">{formattedDate}</span>
          </div>

          {/* Admin Profile */}
          <div className="flex items-center">
            <div className="mr-3 text-right hidden sm:block">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-200">Welcome,</div>
              <div className="text-xs font-bold text-blue-600">{adminName || 'Administrator'}</div>
            </div>
            <div className="h-9 w-9 rounded-full bg-blue-600 flex items-center justify-center text-white">
              {adminName ? adminName.charAt(0).toUpperCase() : 'A'}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;