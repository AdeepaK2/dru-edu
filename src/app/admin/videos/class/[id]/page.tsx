'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ClassFirestoreService } from '@/apiservices/classFirestoreService';
import { VideoFirestoreService } from '@/apiservices/videoFirestoreService';
import { ClassDocument } from '@/models/classSchema';
import { VideoDocument } from '@/models/videoSchema';
import VideoCard from '@/components/videos/VideoCard';
import VideoUploadModal from '@/components/modals/VideoUploadModal';
import Link from 'next/link';
import { Upload, ArrowLeft, Search, Video } from 'lucide-react';

export default function ClassVideos() {
  const [loading, setLoading] = useState(true);
  const [classData, setClassData] = useState<ClassDocument | null>(null);
  const [videos, setVideos] = useState<VideoDocument[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const params = useParams();
  const router = useRouter();
  const classId = params.id as string;
  
  // Mock current user ID for development (replace with real auth)
  const currentUserId = 'admin1';

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch class data
        const fetchedClass = await ClassFirestoreService.getClassById(classId);
        if (!fetchedClass) {
          console.error('Class not found');
          router.push('/admin/videos');
          return;
        }
        
        setClassData(fetchedClass);
          // Fetch videos for this class
        console.log('Fetching videos for class:', classId);
        const classVideos = await VideoFirestoreService.getVideosByClass(classId);
        console.log('Found videos for class:', classVideos.length, classVideos);
        setVideos(classVideos);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (classId) {
      fetchData();
    }
  }, [classId, router]);
  
  // Handle video upload completion
  const handleUploadComplete = async (videoId: string) => {
    try {
      // Fetch the class videos again to update the list
      const classVideos = await VideoFirestoreService.getVideosByClass(classId);
      setVideos(classVideos);
    } catch (error) {
      console.error('Error refreshing videos after upload:', error);
    }
  };
  
  // Filter videos based on search term
  const filteredVideos = videos.filter(video => 
    searchTerm === '' || 
    video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    video.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    video.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6">
        <div className="mb-4">
          <Link 
            href="/admin/videos" 
            className="flex items-center text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mb-4"
          >            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Classes
          </Link>
          
          {classData && (
            <>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {classData.name} Videos
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {classData.subject} | {classData.year} | Center {classData.centerId}
              </p>
            </>
          )}
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1 max-w-lg">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out sm:text-sm"
              placeholder="Search videos by title or tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="mt-4 md:mt-0">
            <button 
              onClick={() => setShowUploadModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              <span className="flex items-center">                <Upload className="h-4 w-4 mr-1" />
                Upload New Video
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-500 dark:text-gray-400">Loading videos...</p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredVideos.length === 0 && (
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-12">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <Video className="h-16 w-16 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {searchTerm ? 'No videos match your search' : 'No videos for this class yet'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {searchTerm 
                ? 'Try using different keywords or clear your search' 
                : 'Get started by uploading your first video for this class'}
            </p>
            {!searchTerm && (                <button 
                  onClick={() => setShowUploadModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                >
                  <span className="flex items-center">
                    <Upload className="h-4 w-4 mr-1" />
                    Upload Your First Video
                  </span>
                </button>
            )}
          </div>
        </div>
      )}
        {/* Videos Grid */}
      {!loading && filteredVideos.length > 0 && (
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">            {filteredVideos.map(video => (
              <VideoCard
                key={video.id}
                id={video.id}
                title={video.title}
                thumbnailUrl={video.thumbnailUrl || '/placeholder-thumbnail.jpg'}
                subject={classData?.subject || 'No Subject'}
                duration={video.duration}
                views={video.views}
                timestamp={video.createdAt.toDate().toLocaleDateString()}
                price={video.price}
              />
            ))}
          </div>
        </div>
      )}      {/* Video Upload Modal */}
      <VideoUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUploadComplete={handleUploadComplete}
        userId={currentUserId}
        preSelectedClassId={classId}
      />
    </div>
  );
}
