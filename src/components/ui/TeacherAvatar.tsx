import React from 'react';
import { User } from 'lucide-react';

interface TeacherAvatarProps {
  teacher?: {
    name?: string;
    avatar?: string;
    profileImageUrl?: string;
  };
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showFallback?: boolean;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-16 h-16 text-xl',
  xl: 'w-24 h-24 text-2xl'
};

export default function TeacherAvatar({ 
  teacher, 
  size = 'md', 
  className = '',
  showFallback = true
}: TeacherAvatarProps) {
  const sizeClass = sizeClasses[size];
  
  if (!teacher && !showFallback) {
    return null;
  }

  return (
    <div className={`${sizeClass} rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center ${className}`}>
      {teacher?.profileImageUrl ? (
        <img
          src={teacher.profileImageUrl}
          alt={teacher.name || 'Teacher'}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback to initials if image fails to load
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const parent = target.parentElement;
            if (parent) {
              parent.innerHTML = `
                <div class="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                  <span class="text-white font-bold">
                    ${teacher?.avatar || teacher?.name?.charAt(0).toUpperCase() || 'T'}
                  </span>
                </div>
              `;
            }
          }}
        />
      ) : teacher?.avatar || teacher?.name ? (
        <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
          <span className="text-white font-bold">
            {teacher.avatar || teacher.name?.charAt(0).toUpperCase() || 'T'}
          </span>
        </div>
      ) : (
        <div className="w-full h-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
          <User className="w-1/2 h-1/2 text-gray-500 dark:text-gray-400" />
        </div>
      )}
    </div>
  );
}
