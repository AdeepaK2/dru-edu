'use client';

import React, { useState, useEffect } from 'react';
import { 
  Video, 
  Play, 
  Eye,
  Clock,
  Book,
  Calendar,
  DollarSign,
  CheckCircle,
  Search,
  Filter
} from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { useStudentAuth } from '@/hooks/useStudentAuth';
import Link from 'next/link';

// Import services and types
import { VideoPurchaseService } from '@/apiservices/videoPurchaseService';
import { VideoFirestoreService } from '@/apiservices/videoFirestoreService';
import { 
  VideoPurchaseDocument, 
  VideoPurchaseDisplayData, 
  videoPurchaseDocumentToDisplay 
} from '@/models/videoPurchaseSchema';
import { VideoDocument } from '@/models/videoSchema';

interface PurchasedVideoData extends VideoPurchaseDisplayData {
  video?: VideoDocument;
}

export default function MyPurchasedVideos() {
  const { student } = useStudentAuth();
  const [purchases, setPurchases] = useState<PurchasedVideoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title' | 'subject'>('newest');

  useEffect(() => {
    const loadPurchases = async () => {
      if (!student?.id) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Get student's completed purchases
        const purchaseDocuments = await VideoPurchaseService.getStudentCompletedPurchases(student.id);
        
        // Get video details for each purchase
        const purchasesWithVideos = await Promise.all(
          purchaseDocuments.map(async (purchase) => {
            try {
              const video = await VideoFirestoreService.getVideoById(purchase.videoId);
              const displayData = videoPurchaseDocumentToDisplay(purchase);
              
              return {
                ...displayData,
                video
              } as PurchasedVideoData;
            } catch (err) {
              console.error(`Error loading video ${purchase.videoId}:`, err);
              // Return purchase data without video details if video fetch fails
              return videoPurchaseDocumentToDisplay(purchase) as PurchasedVideoData;
            }
          })
        );
        
        setPurchases(purchasesWithVideos);
      } catch (err: any) {
        console.error('Error loading purchases:', err);
        setError(err.message || 'Failed to load purchased videos');
      } finally {
        setLoading(false);
      }
    };
    
    loadPurchases();
  }, [student?.id]);

  // Filter and sort purchases
  const getFilteredPurchases = () => {
    let filtered = purchases;
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(purchase =>
        purchase.videoTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        purchase.subjectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        purchase.teacherName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Sort purchases
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime();
        case 'oldest':
          return new Date(a.purchaseDate).getTime() - new Date(b.purchaseDate).getTime();
        case 'title':
          return a.videoTitle.localeCompare(b.videoTitle);
        case 'subject':
          return a.subjectName.localeCompare(b.subjectName);
        default:
          return 0;
      }
    });
    
    return filtered;
  };

  const handleWatchVideo = (purchase: PurchasedVideoData) => {
    window.location.href = `/student/video/${purchase.videoId}/watch`;
  };

  const totalSpent = purchases.reduce((sum, purchase) => sum + purchase.amount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-t-4 border-blue-600 border-solid rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300 font-medium">Loading your videos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                My Purchased Videos
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Access all your purchased educational content
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center bg-green-50 dark:bg-green-900/20 px-4 py-2 rounded-lg">
                <Video className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" />
                <span className="text-green-600 dark:text-green-400 font-medium">
                  {purchases.length} Videos Owned
                </span>
              </div>
              
              <div className="flex items-center bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-lg">
                <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
                <span className="text-blue-600 dark:text-blue-400 font-medium">
                  ${totalSpent.toFixed(2)} Total Spent
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error</h3>
                <p className="mt-1 text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search your videos..."
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            {/* Sort */}
            <div className="lg:w-48">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="title">Title A-Z</option>
                <option value="subject">Subject A-Z</option>
              </select>
            </div>
          </div>
        </div>

        {/* Videos Grid */}
        <div>
          {getFilteredPurchases().length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
              <Video className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {purchases.length === 0 ? 'No purchased videos' : 'No videos found'}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                {purchases.length === 0 
                  ? 'Browse the video library to purchase your first video'
                  : 'Try adjusting your search criteria'
                }
              </p>
              {purchases.length === 0 && (
                <Link href="/student/video">
                  <Button className="flex items-center space-x-2">
                    <Video className="w-4 h-4" />
                    <span>Browse Videos</span>
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {getFilteredPurchases().map((purchase) => (
                  <PurchasedVideoCard
                    key={purchase.id}
                    purchase={purchase}
                    onWatch={handleWatchVideo}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
  );
}

// Purchased Video Card Component
interface PurchasedVideoCardProps {
  purchase: PurchasedVideoData;
  onWatch: (purchase: PurchasedVideoData) => void;
}

const PurchasedVideoCard: React.FC<PurchasedVideoCardProps> = ({ purchase, onWatch }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow">
      {/* Video Thumbnail */}
      <div className="relative aspect-video bg-gray-100 dark:bg-gray-700">
        {purchase.video?.thumbnailUrl ? (
          <img
            src={purchase.video.thumbnailUrl}
            alt={purchase.videoTitle}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling?.classList.remove('hidden');
            }}
          />
        ) : null}
        <div className={`absolute inset-0 flex items-center justify-center ${purchase.video?.thumbnailUrl ? 'hidden' : ''}`}>
          <Video className="w-16 h-16 text-gray-400" />
        </div>
        
        {/* Play overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
          <Play className="w-12 h-12 text-white" />
        </div>
        
        {/* Owned badge */}
        <div className="absolute top-2 right-2">
          <CheckCircle className="w-6 h-6 text-green-500" />
        </div>
        
        {/* Price badge */}
        <div className="absolute top-2 left-2">
          <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300">
            <DollarSign className="w-3 h-3 mr-1" />
            {purchase.amount}
          </span>
        </div>
      </div>

      {/* Video Info */}
      <div className="p-4">
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2">
            {purchase.videoTitle}
          </h3>
        </div>

        {/* Video Meta */}
        <div className="space-y-1 mb-4">
          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
            <Book className="w-3 h-3 mr-1" />
            <span>{purchase.subjectName}</span>
          </div>
          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
            <Calendar className="w-3 h-3 mr-1" />
            <span>Purchased {purchase.purchaseDate}</span>
          </div>
          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
            <Eye className="w-3 h-3 mr-1" />
            <span>Watched {purchase.viewCount} times</span>
          </div>
          {purchase.lastViewedAt && (
            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
              <Clock className="w-3 h-3 mr-1" />
              <span>Last watched {purchase.lastViewedAt}</span>
            </div>
          )}
        </div>

        {/* Access Status */}
        <div className={`mb-3 p-2 rounded text-xs ${
          purchase.canAccess 
            ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300'
            : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300'
        }`}>
          {purchase.canAccess ? (
            <span>✓ Full Access Available</span>
          ) : (
            <span>⚠ Access Expired</span>
          )}
        </div>

        {/* Watch Button */}
        <Button
          onClick={() => onWatch(purchase)}
          disabled={!purchase.canAccess}
          className="w-full flex items-center justify-center space-x-2"
          size="sm"
        >
          <Play className="w-4 h-4" />
          <span>Watch Now</span>
        </Button>
      </div>
    </div>
  );
};
