'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  BookOpen,
  Video, 
  CreditCard, 
  FileQuestion, 
  Settings, 
  LogOut 
} from 'lucide-react';

// Define sidebar menu items with Lucide icons
const menuItems = [
  { label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/admin' },
  { label: 'Students', icon: <Users size={20} />, path: '/admin/students' },
  { label: 'Teachers', icon: <GraduationCap size={20} />, path: '/admin/teachers' },
  { label: 'Classes', icon: <BookOpen size={20} />, path: '/admin/classes' },
  { label: 'Video Portal', icon: <Video size={20} />, path: '/admin/videos' },
  { label: 'Transactions', icon: <CreditCard size={20} />, path: '/admin/transactions' },
  { label: 'Question Bank', icon: <FileQuestion size={20} />, path: '/admin/question' },
  { label: 'System Info', icon: <Settings size={20} />, path: '/admin/system' },
];

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar }) => {
  const pathname = usePathname();

  return (
    <div className={`sidebar transition-all duration-200 ${isOpen ? 'w-64' : 'w-16'} fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 shadow-lg z-10 border-r`}>
      
      <nav className="mt-4">
        <ul className="space-y-1 px-2">
          {menuItems.map((item) => (
            <li key={item.path}>
              <Link
                href={item.path}
                prefetch={true}
                className={`w-full flex items-center p-3 rounded-md transition-all duration-150 text-left
                  ${pathname === item.path 
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-500 font-medium' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-blue-600 dark:hover:text-blue-500'}
                `}
              >
                <div className="flex-shrink-0">
                  {item.icon}
                </div>
                {isOpen && (
                  <span className="ml-3 transition-opacity duration-150 whitespace-nowrap">
                    {item.label}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-gray-100 dark:border-gray-800">
        <Link
          href="/admin/logout"
          prefetch={false}
          className="flex items-center p-2.5 rounded-md text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-500 transition-all duration-150"
        >
          <LogOut size={20} />
          {isOpen && <span className="ml-3 font-medium whitespace-nowrap">Logout</span>}
        </Link>
      </div>
    </div>
  );
};

export default Sidebar;