import React from 'react';
import Link from 'next/link';
import { School, Video, ArrowRight } from 'lucide-react';

interface ClassCardProps {
  id: string;
  name: string;
  subject: string;
  year: string;
  videoCount: number;
  className?: string;
}

export default function ClassCard({
  id,
  name,
  subject,
  year,
  videoCount,
  className = '',
}: ClassCardProps) {
  // Generate a deterministic color based on the subject
  const getSubjectColor = (subject: string): string => {
    const subjects: Record<string, string> = {
      'Mathematics': 'bg-blue-600',
      'Physics': 'bg-purple-600',
      'Biology': 'bg-green-600',
      'Chemistry': 'bg-pink-600',
      'Computer Science': 'bg-indigo-600',
    };
    
    return subjects[subject] || 'bg-gray-600';
  };
  
  const subjectColor = getSubjectColor(subject);
  
  return (
    <Link href={`/admin/videos/class/${id}`}>
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow ${className}`}>
        <div className={`${subjectColor} h-2`}></div>
        <div className="p-5">
          <h3 className="font-medium text-xl text-gray-900 dark:text-white mb-2">{name}</h3>
          
          <div className="flex items-center text-gray-700 dark:text-gray-300 mb-4">            <School className="h-4 w-4 mr-1" />
            <span>{subject}, {year}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="flex items-center text-gray-600 dark:text-gray-400">              <Video className="h-4 w-4 mr-1" />
              <span className="text-sm">{videoCount} {videoCount === 1 ? 'Video' : 'Videos'}</span>
            </div>
            
            <div className="flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
              <span className="text-sm font-medium">View</span>
              <ArrowRight className="h-4 w-4 ml-1" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
