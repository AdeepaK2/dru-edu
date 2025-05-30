import React from 'react';
import { formatDuration } from '@/models/videoSchema';
import Link from 'next/link';

interface VideoCardProps {
  id: string;
  title: string;
  thumbnailUrl: string;
  subject: string;
  duration?: number;
  views: number;
  timestamp: string;
  price?: number; // Price in dollars
  className?: string;
}

export default function VideoCard({
  id,
  title,
  thumbnailUrl,
  subject,
  duration,
  views,
  timestamp,
  price,
  className = '',
}: VideoCardProps) {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow ${className}`}>
      <Link href={`/admin/videos/${id}`} className="block">        <div className="relative aspect-video">
          <img
            src={thumbnailUrl || '/placeholder-thumbnail.jpg'}
            alt={title}
            className="w-full h-full object-cover"
          />
          {/* Price badge */}
          {price !== undefined && (
            <div className="absolute top-2 left-2 bg-green-600 text-white text-xs px-2 py-1 rounded-full font-medium">
              {price === 0 ? 'FREE' : `$${price.toFixed(2)}`}
            </div>
          )}
          {duration && (
            <div className="absolute bottom-2 right-2 bg-black bg-opacity-80 text-white text-xs px-1.5 py-0.5 rounded">
              {formatDuration(duration)}
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-medium text-gray-900 dark:text-white line-clamp-2">{title}</h3>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-sm text-blue-600 dark:text-blue-400">{subject}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">{views} views</span>
          </div>
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            {timestamp}
          </div>
        </div>
      </Link>
    </div>
  );
}
