'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { SubjectFirestoreService } from '@/apiservices/subjectFirestoreService';
import { VideoFirestoreService } from '@/apiservices/videoFirestoreService';
import { ClassFirestoreService } from '@/apiservices/classFirestoreService';
import { SubjectDocument } from '@/models/subjectSchema';
import { VideoDocument } from '@/models/videoSchema';
import { ClassDocument } from '@/models/classSchema';
import VideoUploadModal from '@/components/modals/VideoUploadModal';
import VideoCard from '@/components/videos/VideoCard';
import { Button } from '@/components/ui';
import { Upload, Play, Trash2, Plus, BookOpen, Video, ArrowLeft } from 'lucide-react';

export default function SubjectVideosPage() {
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState<SubjectDocument[]>([]);
  const [videos, setVideos] = useState<VideoDocument[]>([]);
  const [classes, setClasses] = useState<ClassDocument[]>([]);
  const [videosBySubject, setVideosBySubject] = useState<Record<string, VideoDocument[]>>({});
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<SubjectDocument | null>(null);
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);

  // Mock current user ID for development (replace with real auth)
  const currentUserId = 'admin1';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data
      const [allSubjects, allVideos, allClasses] = await Promise.all([
        SubjectFirestoreService.getAllSubjects(),
        VideoFirestoreService.getAllVideos(),
        ClassFirestoreService.getAllClasses()
      ]);
      
      setSubjects(allSubjects);
      setVideos(allVideos);
      setClasses(allClasses);
      
      // Group videos by subject
      const groupedVideos: Record<string, VideoDocument[]> = {};
      
      // Initialize with empty arrays for all subjects
      allSubjects.forEach(subject => {
        groupedVideos[subject.id] = [];
      });
      
      // Group videos by their subject
      allVideos.forEach(video => {
        if (video.subjectId && groupedVideos[video.subjectId]) {
          groupedVideos[video.subjectId].push(video);        } else if (video.assignedClassIds && video.assignedClassIds.length > 0) {
          // Fallback: get subject from the first assigned class
          const firstClassId = video.assignedClassIds[0];
          const assignedClass = allClasses.find(cls => cls.id === firstClassId);
          if (assignedClass && assignedClass.subjectId) {
            if (!groupedVideos[assignedClass.subjectId]) {
              groupedVideos[assignedClass.subjectId] = [];
            }
            groupedVideos[assignedClass.subjectId].push(video);
          }
        }
      });
      
      setVideosBySubject(groupedVideos);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadComplete = async (videoId: string) => {
    // Refresh data after upload
    await fetchData();
    setShowUploadModal(false);
  };

  const handleDeleteVideo = async (videoId: string) => {
    if (window.confirm('Are you sure you want to delete this video?')) {
      try {
        await VideoFirestoreService.deleteVideo(videoId);
        await fetchData(); // Refresh data
      } catch (error) {
        console.error('Error deleting video:', error);
        alert('Failed to delete video');
      }
    }
  };

  const handleDeleteSubject = async (subjectId: string) => {
    const subject = subjects.find(s => s.id === subjectId);
    const videoCount = videosBySubject[subjectId]?.length || 0;
    
    if (window.confirm(
      `Are you sure you want to delete "${subject?.name}"? This will also delete ${videoCount} associated video(s). This action cannot be undone.`
    )) {
      try {
        // Delete all videos in this subject
        const videosToDelete = videosBySubject[subjectId] || [];
        await Promise.all(videosToDelete.map(video => VideoFirestoreService.deleteVideo(video.id)));
        
        // Delete the subject
        await SubjectFirestoreService.deleteSubject(subjectId);
        
        await fetchData(); // Refresh data
      } catch (error) {
        console.error('Error deleting subject:', error);
        alert('Failed to delete subject');
      }
    }
  };

  const toggleSubjectExpansion = (subjectId: string) => {
    setExpandedSubject(expandedSubject === subjectId ? null : subjectId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="flex items-center space-x-4">
            <Link 
              href="/admin/videos"
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Videos by Subject</h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Organize and manage videos by academic subjects
              </p>
            </div>
          </div>
          <div className="mt-4 md:mt-0 flex gap-2">
            <Link 
              href="/admin/subjects" 
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            >
              <span className="flex items-center">
                <BookOpen className="h-4 w-4 mr-1" />
                Manage Subjects
              </span>
            </Link>
            <button 
              onClick={() => setShowUploadModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              <span className="flex items-center">
                <Upload className="h-4 w-4 mr-1" />
                Upload Video
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Subjects and Videos */}
      {subjects.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-12">
          <div className="text-center">
            <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No subjects found</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Create subjects first to organize your videos.
            </p>
            <Link 
              href="/admin/subjects" 
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-1" />
              Create Subjects
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {subjects.map(subject => {
            const subjectVideos = videosBySubject[subject.id] || [];
            const isExpanded = expandedSubject === subject.id;
            
            return (
              <div key={subject.id} className="bg-white dark:bg-gray-800 shadow-sm rounded-lg">
                {/* Subject Header */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => toggleSubjectExpansion(subject.id)}
                        className="flex items-center space-x-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded-lg transition-colors"
                      >
                        <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-lg">
                          <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {subject.name}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {subject.grade} • {subjectVideos.length} video{subjectVideos.length !== 1 ? 's' : ''}
                          </p>
                          {subject.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                              {subject.description}
                            </p>
                          )}
                        </div>
                      </button>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full text-sm font-medium">
                        {subjectVideos.length} videos
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteSubject(subject.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Videos Grid (shown when expanded) */}
                {isExpanded && (
                  <div className="p-6">
                    {subjectVideos.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {subjectVideos.map(video => (
                          <div key={video.id} className="relative">
                            <VideoCard
                              id={video.id}
                              title={video.title}
                              thumbnailUrl={video.thumbnailUrl || '/placeholder-thumbnail.jpg'}
                              subject={subject.name}
                              duration={video.duration}
                              views={video.views}
                              timestamp={video.createdAt.toDate().toLocaleDateString()}
                              price={video.price}
                            />
                            <button
                              onClick={() => handleDeleteVideo(video.id)}
                              className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full hover:bg-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Video className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500 dark:text-gray-400">
                          No videos in this subject yet.
                        </p>
                        <button 
                          onClick={() => setShowUploadModal(true)}
                          className="mt-3 text-blue-600 hover:text-blue-700 dark:text-blue-400 text-sm"
                        >
                          Upload the first video
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Video Upload Modal */}
      <VideoUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUploadComplete={handleUploadComplete}
        userId={currentUserId}
      />
    </div>
  );
}
