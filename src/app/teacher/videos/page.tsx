'use client';

import React, { useState, useEffect } from 'react';
import { 
  Video, 
  Upload, 
  Search, 
  Eye, 
  Edit2, 
  Trash2, 
  Plus,
  AlertCircle,
  Calendar,
  Play,
  Users
} from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { useTeacherAuth } from '@/hooks/useTeacherAuth';
import TeacherLayout from '@/components/teacher/TeacherLayout';
import Link from 'next/link';

// Import services and types
import { VideoFirestoreService } from '@/apiservices/videoFirestoreService';
import { ClassFirestoreService } from '@/apiservices/classFirestoreService';
import { SubjectFirestoreService } from '@/apiservices/subjectFirestoreService';
import { VideoDocument, VideoDisplayData, videoDocumentToDisplay } from '@/models/videoSchema';

// Import modals
import TeacherVideoUploadModal from '@/components/modals/TeacherVideoUploadModal';
import VideoViewModal from '@/components/modals/VideoViewModal';
import VideoEditModal from '@/components/modals/VideoEditModal';
import StudentAssignmentModal from '@/components/modals/StudentAssignmentModal';

interface TeacherVideoData extends VideoDisplayData {
  assignedClassesCount: number;
}

export default function TeacherVideos() {
  const { teacher } = useTeacherAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [videos, setVideos] = useState<TeacherVideoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<TeacherVideoData | null>(null);
  const [teacherClasses, setTeacherClasses] = useState<any[]>([]);
  const [teacherSubjects, setTeacherSubjects] = useState<any[]>([]);

  // Load teacher's data
  useEffect(() => {
    const loadTeacherData = async () => {
      if (!teacher?.id) return;
      
      console.log('🔍 Teacher object in videos page:', teacher);
      console.log('🔍 Teacher ID:', teacher.id);
      console.log('🔍 Teacher subjects:', teacher.subjects);
      
      setLoading(true);
      setError(null);
      
      try {
        // Load teacher's classes and subjects
        const [classes, allSubjects] = await Promise.all([
          ClassFirestoreService.getClassesByTeacher(teacher.id),
          SubjectFirestoreService.getAllSubjects()
        ]);
        
        console.log('🔍 Teacher subject debugging:');
        console.log('🔍 Teacher subjects from auth:', teacher.subjects);
        console.log('🔍 All subjects from database:', allSubjects);
        console.log('🔍 Classes loaded:', classes);
        
        // Filter subjects for teacher - try multiple approaches
        let subjects: any[] = [];
        
        // Approach 1: Use teacher.subjects array (if available)
        if (teacher.subjects && teacher.subjects.length > 0) {
          subjects = allSubjects.filter(subject => 
            teacher.subjects?.includes(subject.name)
          );
          console.log('🔍 Method 1 - Filtered subjects by teacher.subjects:', subjects);
        }
        
        // Approach 2: If no subjects from teacher.subjects, derive from classes
        if (subjects.length === 0 && classes.length > 0) {
          const subjectNamesFromClasses = [...new Set(classes.map(cls => cls.subject))];
          subjects = allSubjects.filter(subject => 
            subjectNamesFromClasses.includes(subject.name)
          );
          console.log('🔍 Method 2 - Filtered subjects from classes:', subjects);
          console.log('🔍 Subject names from classes:', subjectNamesFromClasses);
        }
        
        // Approach 3: If still no subjects, give all subjects (fallback)
        if (subjects.length === 0) {
          console.log('🔍 Method 3 - Using all subjects as fallback');
          subjects = allSubjects;
        }
        
        // Convert subjects to the format expected by the modal (with grade)
        const formattedSubjects = subjects.map(subject => ({
          id: subject.id,
          name: `${subject.name} Grade ${subject.grade}`, // Include grade in display name
          grade: subject.grade // Keep grade separate for reference
        }));
        
        // Convert classes to the format expected by the modal
        const formattedClasses = classes.map(cls => ({
          id: cls.id,
          name: cls.name,
          subjectId: cls.subjectId
        }));
        
        console.log('🔍 Final subjects for teacher:', subjects);
        console.log('🔍 Formatted subjects for modal:', formattedSubjects);
        console.log('🔍 Original classes:', classes);
        console.log('🔍 Formatted classes for modal:', formattedClasses);
        
        setTeacherClasses(formattedClasses); // Use formatted classes
        setTeacherSubjects(formattedSubjects); // Use formatted subjects instead
        
        // Load teacher's videos
        const teacherVideos = await VideoFirestoreService.getVideosByTeacher(teacher.id);
        
        // Convert to display format with additional stats
        const videosWithStats = teacherVideos.map(video => {
          const displayData = videoDocumentToDisplay(video, {}, {}, teacher.name);
          return {
            ...displayData,
            assignedClassesCount: video.assignedClassIds?.length || 0
          } as TeacherVideoData;
        });
        
        setVideos(videosWithStats);
      } catch (err: any) {
        console.error('Error loading teacher data:', err);
        setError(err.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    
    loadTeacherData();
  }, [teacher?.id, teacher?.subjects, teacher?.name]);

  // Filter videos based on search term
  const filteredVideos = videos.filter(video =>
    video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    video.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    video.subjectName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle successful video upload
  const handleVideoUploaded = () => {
    setShowUploadModal(false);
    // Reload videos
    const loadVideos = async () => {
      if (!teacher?.id) return;
      try {
        const teacherVideos = await VideoFirestoreService.getVideosByTeacher(teacher.id);
        const videosWithStats = teacherVideos.map(video => {
          const displayData = videoDocumentToDisplay(video, {}, {}, teacher.name);
          return {
            ...displayData,
            assignedClassesCount: video.assignedClassIds?.length || 0
          } as TeacherVideoData;
        });
        setVideos(videosWithStats);
      } catch (err: any) {
        console.error('Error reloading videos:', err);
      }
    };
    loadVideos();
  };

  // Handle video view
  const handleViewVideo = (video: TeacherVideoData) => {
    setSelectedVideo(video);
    setShowViewModal(true);
  };

  // Handle video edit
  const handleEditVideo = (video: TeacherVideoData) => {
    setSelectedVideo(video);
    setShowEditModal(true);
  };

  // Handle student assignment
  const handleAssignStudents = (video: TeacherVideoData) => {
    setSelectedVideo(video);
    setShowAssignModal(true);
  };

  // Handle successful video update
  const handleVideoUpdated = () => {
    setShowEditModal(false);
    setSelectedVideo(null);
    // Reload videos (same as upload)
    handleVideoUploaded();
  };

  // Handle successful assignment update
  const handleAssignmentUpdated = () => {
    setShowAssignModal(false);
    setSelectedVideo(null);
    // Reload videos (same as upload)
    handleVideoUploaded();
  };

  if (loading) {
    return (
      <TeacherLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-16 h-16 border-t-4 border-blue-600 border-solid rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-300 font-medium">Loading videos...</p>
          </div>
        </div>
      </TeacherLayout>
    );
  }

  return (
    <TeacherLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Video Library
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Manage your lesson videos for your subjects and classes
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-lg">
                <Video className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
                <span className="text-blue-600 dark:text-blue-400 font-medium">
                  {videos.length} Videos
                </span>
              </div>
              <Button
                onClick={() => setShowUploadModal(true)}
                className="flex items-center space-x-2"
              >
                <Upload className="w-4 h-4" />
                <span>Upload Video</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error</h3>
                <p className="mt-1 text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search videos..."
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Videos Grid */}
        {filteredVideos.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
            <Video className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No videos found
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {searchTerm 
                ? 'Try adjusting your search criteria' 
                : 'Get started by uploading your first lesson video'
              }
            </p>
            {!searchTerm && (
              <Button onClick={() => setShowUploadModal(true)} className="flex items-center space-x-2">
                <Upload className="w-4 h-4" />
                <span>Upload Video</span>
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVideos.map((video) => (
              <div
                key={video.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow"
              >
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
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <Play className="w-12 h-12 text-white" />
                  </div>
                  <div className="absolute top-2 right-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      video.status === 'active' 
                        ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300'
                        : video.status === 'processing'
                        ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300'
                        : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300'
                    }`}>
                      {video.status}
                    </span>
                  </div>
                </div>

                {/* Video Info */}
                <div className="p-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                      {video.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                      {video.description}
                    </p>
                  </div>

                  {/* Video Meta */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>Subject: {video.subjectName}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <Users className="w-4 h-4 mr-2" />
                      <span>{video.assignedClassesCount} Classes Assigned</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <Eye className="w-4 h-4 mr-2" />
                      <span>{video.views} Views</span>
                    </div>
                  </div>

                  {/* Visibility Badge */}
                  <div className="mb-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      video.visibility === 'public' 
                        ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300'
                        : video.visibility === 'unlisted'
                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                        : 'bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300'
                    }`}>
                      {video.visibility}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewVideo(video)}
                      className="flex items-center justify-center space-x-1"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditVideo(video)}
                      className="flex items-center justify-center space-x-1"
                    >
                      <Edit2 className="w-4 h-4" />
                      <span>Edit</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAssignStudents(video)}
                      className="col-span-2 flex items-center justify-center space-x-1"
                    >
                      <Users className="w-4 h-4" />
                      <span>Assign Students</span>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Video Upload Modal */}
        {showUploadModal && (
          <TeacherVideoUploadModal
            isOpen={showUploadModal}
            onClose={() => setShowUploadModal(false)}
            onSuccess={handleVideoUploaded}
            teacherId={teacher?.id || ''}
            teacherName={teacher?.name || ''}
            availableSubjects={teacherSubjects}
            availableClasses={teacherClasses}
          />
        )}

        {/* Video View Modal */}
        {showViewModal && (
          <VideoViewModal
            isOpen={showViewModal}
            onClose={() => {
              setShowViewModal(false);
              setSelectedVideo(null);
            }}
            video={selectedVideo}
          />
        )}

        {/* Video Edit Modal */}
        {showEditModal && (
          <VideoEditModal
            isOpen={showEditModal}
            onClose={() => {
              setShowEditModal(false);
              setSelectedVideo(null);
            }}
            onSuccess={handleVideoUpdated}
            video={selectedVideo}
            availableSubjects={teacherSubjects}
            availableClasses={teacherClasses}
          />
        )}

        {/* Student Assignment Modal */}
        {showAssignModal && (
          <StudentAssignmentModal
            isOpen={showAssignModal}
            onClose={() => {
              setShowAssignModal(false);
              setSelectedVideo(null);
            }}
            onSuccess={handleAssignmentUpdated}
            video={selectedVideo}
            availableClasses={teacherClasses}
          />
        )}
      </div>
    </TeacherLayout>
  );
}
