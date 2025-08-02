'use client';

import React, { useState, useEffect, use } from 'react';
import { 
  Video, 
  Play, 
  ShoppingCart, 
  Eye, 
  BookOpen,
  Users,
  DollarSign,
  CheckCircle,
  Lock,
  Search,
  Filter,
  Star
} from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { useStudentAuth } from '@/hooks/useStudentAuth';
import Link from 'next/link';

// Import services and types
import { VideoFirestoreService } from '@/apiservices/videoFirestoreService';
import { VideoPurchaseService } from '@/apiservices/videoPurchaseService';
import { ClassFirestoreService } from '@/apiservices/classFirestoreService';
import { TeacherFirestoreService } from '@/apiservices/teacherFirestoreService';
import { VideoDocument, VideoDisplayData, videoDocumentToDisplay } from '@/models/videoSchema';
import { VideoPurchaseDocument } from '@/models/videoPurchaseSchema';

interface ClassVideoProps {
  params: Promise<{
    classId: string;
  }>;
}

interface ClassVideoData extends VideoDisplayData {
  isPaid: boolean;
  isPurchased: boolean;
  canAccess: boolean;
  purchaseInfo?: VideoPurchaseDocument;
}

type TabType = 'class' | 'purchased' | 'study';

interface FilterState {
  searchTerm: string;
  priceFilter: 'all' | 'free' | 'paid';
  sortBy: 'newest' | 'oldest' | 'price_low' | 'price_high' | 'popular';
}

export default function ClassVideos({ params }: ClassVideoProps) {
  // Unwrap params using React.use()
  const { classId } = use(params);
  
  const { student } = useStudentAuth();
  const [classInfo, setClassInfo] = useState<any>(null);
  const [videos, setVideos] = useState<ClassVideoData[]>([]);
  const [studentPurchases, setStudentPurchases] = useState<VideoPurchaseDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('class');
  
  // Filter states
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: '',
    priceFilter: 'all',
    sortBy: 'newest'
  });

  // Load class and video data
  useEffect(() => {
    const loadClassData = async () => {
      if (!student?.id || !classId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Load class information
        const classData = await ClassFirestoreService.getClassById(classId);
        if (!classData) {
          throw new Error('Class not found');
        }
        setClassInfo(classData);
        
        // Load student's purchases
        const purchases = await VideoPurchaseService.getStudentCompletedPurchases(student.id);
        setStudentPurchases(purchases);
        
        // Load videos for this class (assigned to this specific class or public videos of the same subject)
        const [allVideos] = await Promise.all([
          VideoFirestoreService.getVideosBySubject(classData.subjectId)
        ]);
        
        console.log('🔍 Class videos loaded:', allVideos.length);
        
        // Filter videos that are either:
        // 1. Assigned to this specific class
        // 2. Public videos of the same subject
        // 3. Already purchased by student
        const purchasedVideoIds = purchases.map((p: VideoPurchaseDocument) => p.videoId);
        
        const relevantVideos = allVideos.filter(video => {
          // Always show purchased videos
          if (purchasedVideoIds.includes(video.id)) {
            return true;
          }
          
          // Show videos assigned to this class
          if (video.assignedClassIds?.includes(classId)) {
            return true;
          }
          
          // Show public videos of the same subject
          if (video.visibility === 'public' && video.subjectId === classData.subjectId) {
            return true;
          }
          
          return false;
        });
        
        // Convert to class video format with purchase info
        const classVideos: ClassVideoData[] = await Promise.all(
          relevantVideos.map(async (video) => {
            // Get teacher information for this video
            let teacherName = 'Teacher';
            if (video.teacherId) {
              try {
                const teacher = await TeacherFirestoreService.getTeacherById(video.teacherId);
                teacherName = teacher ? teacher.name : 'Teacher';
              } catch (teacherErr) {
                console.error(`Error loading teacher ${video.teacherId}:`, teacherErr);
              }
            }
            
            const displayData = videoDocumentToDisplay(video, {}, {}, teacherName);
            const isPaid = (video.price || 0) > 0;
            const purchaseInfo = purchases.find((p: VideoPurchaseDocument) => p.videoId === video.id);
            const isPurchased = !!purchaseInfo;
            const canAccess = !isPaid || isPurchased;
            
            return {
              ...displayData,
              price: video.price || 0,
              isPaid,
              isPurchased,
              canAccess,
              purchaseInfo
            };
          })
        );
        
        setVideos(classVideos);
        
      } catch (err: any) {
        console.error('Error loading class data:', err);
        setError(err.message || 'Failed to load class data');
      } finally {
        setLoading(false);
      }
    };
    
    loadClassData();
  }, [student?.id, classId]);

  // Get videos for current tab with filters
  const getTabVideos = () => {
    let filteredVideos = videos;
    
    // Filter by tab
    switch (activeTab) {
      case 'class':
        // Show videos accessible to student (free + purchased for this class)
        filteredVideos = filteredVideos.filter(video => video.canAccess);
        break;
      case 'purchased':
        filteredVideos = filteredVideos.filter(video => video.isPurchased);
        break;
      case 'study':
        filteredVideos = filteredVideos.filter(video => video.isPaid && !video.isPurchased);
        break;
    }
    
    // Apply additional filters
    if (filters.searchTerm) {
      filteredVideos = filteredVideos.filter(video =>
        video.title.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        video.description.toLowerCase().includes(filters.searchTerm.toLowerCase())
      );
    }
    
    if (filters.priceFilter === 'free') {
      filteredVideos = filteredVideos.filter(video => !video.isPaid);
    } else if (filters.priceFilter === 'paid') {
      filteredVideos = filteredVideos.filter(video => video.isPaid);
    }
    
    // Sort videos
    filteredVideos.sort((a, b) => {
      switch (filters.sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'price_low':
          return (a.price || 0) - (b.price || 0);
        case 'price_high':
          return (b.price || 0) - (a.price || 0);
        case 'popular':
          return (b.views || 0) - (a.views || 0);
        default:
          return 0;
      }
    });
    
    return filteredVideos;
  };

  // Handle video access
  const handleVideoAccess = (video: ClassVideoData) => {
    if (video.canAccess) {
      // Navigate to video player
      window.location.href = `/student/video/${video.id}/watch`;
    } else {
      // Navigate to purchase page
      window.location.href = `/student/video/${video.id}/purchase`;
    }
  };

  // Get tab counts
  const getTabCounts = () => {
    return {
      class: videos.filter(v => v.canAccess).length,
      purchased: videos.filter(v => v.isPurchased).length,
      study: videos.filter(v => v.isPaid && !v.isPurchased).length
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-t-4 border-blue-600 border-solid rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300 font-medium">Loading class videos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error</h3>
              <p className="mt-1 text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const tabCounts = getTabCounts();
  const tabVideos = getTabVideos();

  return (
    <div className="space-y-6">
      {/* Class Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              {classInfo?.name} - Video Library
            </h1>
            <p className="text-blue-100">
              {classInfo?.subject} • Grade {classInfo?.grade} • {classInfo?.teacherName}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{videos.length}</div>
              <div className="text-sm text-blue-100">Total Videos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{tabCounts.purchased}</div>
              <div className="text-sm text-blue-100">Purchased</div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('class')}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'class'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <BookOpen className="w-4 h-4" />
                <span>Class Videos</span>
                <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 py-0.5 px-2 rounded-full text-xs">
                  {tabCounts.class}
                </span>
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab('purchased')}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'purchased'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4" />
                <span>Purchased Videos</span>
                <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 py-0.5 px-2 rounded-full text-xs">
                  {tabCounts.purchased}
                </span>
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab('study')}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'study'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <ShoppingCart className="w-4 h-4" />
                <span>Study More</span>
                <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 py-0.5 px-2 rounded-full text-xs">
                  {tabCounts.study}
                </span>
              </div>
            </button>
          </nav>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search videos..."
                  value={filters.searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                    setFilters(prev => ({ ...prev, searchTerm: e.target.value }))
                  }
                  className="pl-10"
                />
              </div>
            </div>
            
            {/* Price Filter */}
            {activeTab !== 'purchased' && (
              <div className="lg:w-32">
                <select
                  value={filters.priceFilter}
                  onChange={(e) => setFilters(prev => ({ ...prev, priceFilter: e.target.value as any }))}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="all">All</option>
                  <option value="free">Free</option>
                  <option value="paid">Paid</option>
                </select>
              </div>
            )}
            
            {/* Sort */}
            <div className="lg:w-40">
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as any }))}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
                <option value="popular">Most Popular</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Videos Grid */}
      <div>
        {tabVideos.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
            {activeTab === 'class' && (
              <>
                <Video className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No class videos available
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  No videos are available for this class yet.
                </p>
              </>
            )}
            {activeTab === 'purchased' && (
              <>
                <CheckCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No purchased videos
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  You haven't purchased any videos yet.
                </p>
                <Button onClick={() => setActiveTab('study')}>
                  Explore Study More
                </Button>
              </>
            )}
            {activeTab === 'study' && (
              <>
                <ShoppingCart className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No additional videos available
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  All available study videos have been purchased or there are no additional videos available.
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {tabVideos.map((video) => (
                <ClassVideoCard
                  key={video.id}
                  video={video}
                  onAccess={handleVideoAccess}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Class Video Card Component
interface ClassVideoCardProps {
  video: ClassVideoData;
  onAccess: (video: ClassVideoData) => void;
}

const ClassVideoCard: React.FC<ClassVideoCardProps> = ({ video, onAccess }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow">
      {/* Video Thumbnail */}
      <div className="relative aspect-video bg-gray-100 dark:bg-gray-700">
        {video.thumbnailUrl ? (
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling?.classList.remove('hidden');
            }}
          />
        ) : null}
        <div className={`absolute inset-0 flex items-center justify-center ${video.thumbnailUrl ? 'hidden' : ''}`}>
          <Video className="w-16 h-16 text-gray-400" />
        </div>
        
        {/* Overlay with access indicator */}
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
          {video.canAccess ? (
            <Play className="w-12 h-12 text-white" />
          ) : (
            <Lock className="w-12 h-12 text-white" />
          )}
        </div>
        
        {/* Price badge */}
        {video.isPaid && (
          <div className="absolute top-2 left-2">
            <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300">
              <DollarSign className="w-3 h-3 mr-1" />
              ${video.price}
            </span>
          </div>
        )}
        
        {/* Purchase status */}
        {video.isPurchased && (
          <div className="absolute top-2 right-2">
            <CheckCircle className="w-6 h-6 text-green-500" />
          </div>
        )}
        
        {/* Free badge */}
        {!video.isPaid && (
          <div className="absolute top-2 left-2">
            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300">
              FREE
            </span>
          </div>
        )}
      </div>

      {/* Video Info */}
      <div className="p-4">
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2">
            {video.title}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {video.description}
          </p>
        </div>

        {/* Video Meta */}
        <div className="space-y-1 mb-4">
          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
            <Users className="w-3 h-3 mr-1" />
            <span>{video.teacherName}</span>
          </div>
          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
            <BookOpen className="w-3 h-3 mr-1" />
            <span>{video.lessonName || 'Lesson Content'}</span>
          </div>
        </div>

        {/* Subject Badge */}
        <div className="mb-4">
          <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300">
            {video.subjectName}
          </span>
        </div>

        {/* Action Button */}
        <Button
          onClick={() => onAccess(video)}
          className={`w-full flex items-center justify-center space-x-2 ${
            video.canAccess 
              ? 'bg-blue-600 hover:bg-blue-700' 
              : 'bg-green-600 hover:bg-green-700'
          }`}
          size="sm"
        >
          {video.canAccess ? (
            <>
              <Play className="w-4 h-4" />
              <span>Watch Now</span>
            </>
          ) : (
            <>
              <ShoppingCart className="w-4 h-4" />
              <span>Buy ${video.price}</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
