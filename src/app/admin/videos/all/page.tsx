'use client';

import React, { useState, useEffect } from 'react';
import { VideoFirestoreService } from '@/apiservices/videoFirestoreService';
import { VideoDocument } from '@/models/videoSchema';
import { ClassFirestoreService } from '@/apiservices/classFirestoreService';
import { ClassDocument } from '@/models/classSchema';
import VideoCard from '@/components/videos/VideoCard';
import VideoUploadModal from '@/components/modals/VideoUploadModal';
import AssignToClassModal from '@/components/modals/AssignToClassModal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Link from 'next/link';
import { Upload, ArrowLeft, Search, Grid, List, Video } from 'lucide-react';

export default function AllVideos() {
  const [loading, setLoading] = useState(true);
  const [videos, setVideos] = useState<VideoDocument[]>([]);  const [classes, setClasses] = useState<Record<string, ClassDocument>>({});
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<VideoDocument | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Mock current user ID for development (replace with real auth)
  const currentUserId = 'admin1';

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch all videos
        const allVideos = await VideoFirestoreService.getAllVideos();
        setVideos(allVideos);
        
        // Fetch all classes to map class IDs to names
        const allClasses = await ClassFirestoreService.getAllClasses();
        const classMap: Record<string, ClassDocument> = {};
          for (const cls of allClasses) {
          classMap[cls.id] = cls;
        }
        
        setClasses(classMap);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
    // Handle video upload completion
  const handleUploadComplete = async (videoId: string) => {
    try {
      // Refresh the videos list to include the new one
      const allVideos = await VideoFirestoreService.getAllVideos();
      setVideos(allVideos);
    } catch (error) {
      console.error('Error refreshing videos after upload:', error);
    }
  };
  // Handle video deletion
  const handleDeleteVideo = async (videoId: string) => {
    setVideoToDelete(videoId);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteVideo = async () => {
    if (!videoToDelete) return;

    try {
      setDeleteLoading(true);
      await VideoFirestoreService.deleteVideo(videoToDelete);
      
      // Refresh the videos list after deletion
      const allVideos = await VideoFirestoreService.getAllVideos();
      setVideos(allVideos);
      
      // Close the confirmation dialog
      setShowDeleteConfirm(false);
      setVideoToDelete(null);
    } catch (error) {
      console.error('Error deleting video:', error);
      alert('Failed to delete video. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Handle assign to class
  const handleAssignToClass = (videoId: string) => {
    const video = videos.find(v => v.id === videoId);
    if (video) {
      setSelectedVideo(video);
      setShowAssignModal(true);
    }
  };

  // Handle assign modal completion
  const handleAssignComplete = async () => {
    try {
      // Refresh the videos list after assignment
      const allVideos = await VideoFirestoreService.getAllVideos();
      setVideos(allVideos);
    } catch (error) {
      console.error('Error refreshing data after assignment:', error);
    }
  };
    // Get class subject for a video (uses the first assigned class)
  const getVideoSubject = (video: VideoDocument): string => {
    if (!video.assignedClassIds || video.assignedClassIds.length === 0) {
      return 'No Subject';
    }
    
    const firstClass = classes[video.assignedClassIds[0]];
    return firstClass?.subject || 'Unknown Subject';
  };

  // Get class year for a video (uses the first assigned class)
  const getVideoYear = (video: VideoDocument): string => {
    if (!video.assignedClassIds || video.assignedClassIds.length === 0) {
      return '';
    }
    
    const firstClass = classes[video.assignedClassIds[0]];
    return firstClass?.year || '';
  };

  // Filter videos based on search term and filters
  const filteredVideos = videos.filter(video => {
    const videoSubject = getVideoSubject(video);
    const videoYear = getVideoYear(video);
    
    const matchesSearch = searchTerm === '' || 
      video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      video.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      video.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
    const matchesSubject = subjectFilter === '' || videoSubject === subjectFilter;
    const matchesYear = yearFilter === '' || videoYear === yearFilter;
    
    return matchesSearch && matchesSubject && matchesYear;
  });
  
  // Get class names for a video
  const getClassNames = (video: VideoDocument): string => {
    if (!video.assignedClassIds || video.assignedClassIds.length === 0) {
      return 'No Classes';
    }
    
    return video.assignedClassIds
      .map(id => classes[id]?.name || 'Unknown Class')
      .join(', ');
  };

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
          
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            All Videos
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage all your educational videos in one place
          </p>
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out sm:text-sm"
              placeholder="Search videos by title, description, or tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="flex space-x-2">
              <select 
                className="border border-gray-300 rounded-md p-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
              >
                <option value="">All Subjects</option>
                <option value="Mathematics">Mathematics</option>
                <option value="Physics">Physics</option>
                <option value="Biology">Biology</option>
                <option value="Chemistry">Chemistry</option>
                <option value="Computer Science">Computer Science</option>
              </select>
              <select 
                className="border border-gray-300 rounded-md p-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
              >
                <option value="">All Grades</option>
                <option value="10th">10th Grade</option>
                <option value="11th">11th Grade</option>
                <option value="12th">12th Grade</option>
              </select>
            </div>
            
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-md">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-700 dark:text-gray-300'} rounded-l-md`}
                title="Grid View"
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-700 dark:text-gray-300'} rounded-r-md`}
                title="List View"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
            
            <button 
              onClick={() => setShowUploadModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors whitespace-nowrap"
            >
              <span className="flex items-center">                <Upload className="h-4 w-4 mr-1" />
                Upload Video
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
              {videos.length > 0 ? 'No videos match your filters' : 'No videos uploaded yet'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {videos.length > 0 
                ? 'Try adjusting your search or filters' 
                : 'Get started by uploading your first educational video'}
            </p>
            {videos.length === 0 && (              <button 
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
      
      {/* Videos Grid View */}
      {!loading && filteredVideos.length > 0 && viewMode === 'grid' && (
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6">          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">            {filteredVideos.map(video => (
              <VideoCard
                key={video.id}
                id={video.id}
                title={video.title}
                thumbnailUrl={video.thumbnailUrl || '/placeholder-thumbnail.jpg'}
                subject={getVideoSubject(video)}
                duration={video.duration}
                views={video.views}
                timestamp={video.createdAt.toDate().toLocaleDateString()}
                price={video.price}
                showActions={true}
                onDelete={handleDeleteVideo}
                onAssignToClass={handleAssignToClass}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Videos List View */}
      {!loading && filteredVideos.length > 0 && viewMode === 'list' && (
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Video
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Subject
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Price
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Classes
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Views
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Uploaded
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredVideos.map(video => (
                  <tr key={video.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-12 w-20 flex-shrink-0 mr-4">
                          <img 
                            src={video.thumbnailUrl || '/placeholder-thumbnail.jpg'} 
                            alt={video.title}
                            className="h-full w-full object-cover rounded"
                          />
                        </div>
                        <div>
                          <Link href={`/admin/videos/${video.id}`} className="font-medium text-blue-600 dark:text-blue-400 hover:underline">
                            {video.title}
                          </Link>
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                            {video.description}
                          </p>
                        </div>
                      </div>
                    </td>                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {getVideoSubject(video)}
                      {getVideoYear(video) && <span className="ml-2 text-gray-500 dark:text-gray-400">({getVideoYear(video)})</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {video.price === undefined || video.price === 0 ? (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-400">
                          FREE
                        </span>
                      ) : (
                        <span className="font-medium">
                          ${video.price.toFixed(2)}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {getClassNames(video)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {video.views}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {video.createdAt.toDate().toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${video.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-400' : 
                          video.status === 'processing' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800/20 dark:text-yellow-400' :
                          'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                        {video.status === 'active' ? 'Active' : 
                          video.status === 'processing' ? 'Processing' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}      {/* Video Upload Modal */}
      <VideoUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUploadComplete={handleUploadComplete}
        userId={currentUserId}
      />      {/* Assign to Class Modal */}
      <AssignToClassModal
        isOpen={showAssignModal}
        onClose={() => {
          setShowAssignModal(false);
          setSelectedVideo(null);
        }}
        video={selectedVideo}
        onAssignComplete={handleAssignComplete}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setVideoToDelete(null);
        }}
        onConfirm={confirmDeleteVideo}
        title="Delete Video"
        description="Are you sure you want to delete this video? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={deleteLoading}
      />
    </div>
  );
}
