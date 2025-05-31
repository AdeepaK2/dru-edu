'use client';

import React, { useState, useEffect } from 'react';
import { ClassFirestoreService } from '@/apiservices/classFirestoreService';
import { VideoFirestoreService } from '@/apiservices/videoFirestoreService';
import { SubjectFirestoreService } from '@/apiservices/subjectFirestoreService';
import { ClassDocument } from '@/models/classSchema';
import { VideoDocument } from '@/models/videoSchema';
import { SubjectDocument } from '@/models/subjectSchema';
import VideoUploadModal from '@/components/modals/VideoUploadModal';
import ClassCard from '@/components/videos/ClassCard';
import VideoCard from '@/components/videos/VideoCard';
import Link from 'next/link';
import { Upload, ListFilter, Search, Grid, List, Plus, BookOpen } from 'lucide-react';

export default function VideoPortalManager() {
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<ClassDocument[]>([]);
  const [subjects, setSubjects] = useState<SubjectDocument[]>([]);
  const [recentVideos, setRecentVideos] = useState<VideoDocument[]>([]);
  const [videosByClass, setVideosByClass] = useState<Record<string, number>>({});
  const [videosBySubject, setVideosBySubject] = useState<Record<string, VideoDocument[]>>({});
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');

  // Mock current user ID for development (replace with real auth)
  const currentUserId = 'admin1';  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch all data
        const [allClasses, allVideos, allSubjects] = await Promise.all([
          ClassFirestoreService.getAllClasses(),
          VideoFirestoreService.getAllVideos(),
          SubjectFirestoreService.getAllSubjects()
        ]);
        
        setClasses(allClasses);
        setSubjects(allSubjects);
        setRecentVideos(allVideos.slice(0, 8)); // Show up to 8 recent videos
        
        // Count videos per class
        const countMap: Record<string, number> = {};
        for (const cls of allClasses) {
          // For each class, count videos assigned to it
          // This could be optimized with a query in a real app
          const classVideos = allVideos.filter(
            video => video.assignedClassIds?.includes(cls.id)
          );
          countMap[cls.id] = classVideos.length;
        }
        setVideosByClass(countMap);
        
        // Group videos by subject
        const groupedVideos: Record<string, VideoDocument[]> = {};
        
        // Initialize with empty arrays for all subjects
        allSubjects.forEach(subject => {
          groupedVideos[subject.id] = [];
        });
        
        // Group videos by their subject
        allVideos.forEach(video => {
          if (video.subjectId && groupedVideos[video.subjectId]) {
            groupedVideos[video.subjectId].push(video);
          } else if (video.assignedClassIds && video.assignedClassIds.length > 0) {
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
    
    fetchData();
  }, []);
  // Helper function to get subject for a video
  const getVideoSubject = (video: VideoDocument): string => {
    if (!video.assignedClassIds || video.assignedClassIds.length === 0) {
      return 'Unassigned';
    }
    
    // Get the subject from the first assigned class
    const firstClassId = video.assignedClassIds[0];
    const assignedClass = classes.find(cls => cls.id === firstClassId);
    return assignedClass?.subject || 'No Subject';
  };
    // Handle video upload completion
  const handleUploadComplete = async (videoId: string) => {
    try {
      // Refresh all data to include the new video
      const [allClasses, allVideos, allSubjects] = await Promise.all([
        ClassFirestoreService.getAllClasses(),
        VideoFirestoreService.getAllVideos(),
        SubjectFirestoreService.getAllSubjects()
      ]);
      
      setClasses(allClasses);
      setSubjects(allSubjects);
      setRecentVideos(allVideos.slice(0, 8));
      
      // Update video counts for classes
      const countMap: Record<string, number> = {};
      for (const cls of allClasses) {
        const classVideos = allVideos.filter(
          video => video.assignedClassIds?.includes(cls.id)
        );
        countMap[cls.id] = classVideos.length;
      }
      setVideosByClass(countMap);
      
      // Update videos by subject
      const groupedVideos: Record<string, VideoDocument[]> = {};
      allSubjects.forEach(subject => {
        groupedVideos[subject.id] = [];
      });
      
      allVideos.forEach(video => {
        if (video.subjectId && groupedVideos[video.subjectId]) {
          groupedVideos[video.subjectId].push(video);
        } else if (video.assignedClassIds && video.assignedClassIds.length > 0) {
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
      console.error('Error refreshing data after upload:', error);
    }
  };
  
  // Filter classes based on search term and filters
  const filteredClasses = classes.filter(cls => {
    const matchesSearch = searchTerm === '' || 
      cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cls.subject.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesSubject = subjectFilter === '' || cls.subject === subjectFilter;
    const matchesYear = yearFilter === '' || cls.year === yearFilter;
    
    return matchesSearch && matchesSubject && matchesYear;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Video Portal Manager</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Upload, manage, and organize educational videos for students
            </p>
          </div>          <div className="mt-4 md:mt-0 flex gap-2">
            <Link 
              href="/admin/videos/subjects" 
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            >
              <span className="flex items-center">
                <BookOpen className="h-4 w-4 mr-1" />
                By Subjects
              </span>
            </Link>
            <Link 
              href="/admin/videos/all" 
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            >
              <span className="flex items-center">
                <List className="h-4 w-4 mr-1" />
                View All Videos
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

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out sm:text-sm"
              placeholder="Search classes by name or subject..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex space-x-2 items-center">
            <div className="flex flex-wrap gap-2">
              <select 
                className="border border-gray-300 rounded-md p-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
              >
                <option value="">Filter by Subject</option>
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
                <option value="">Filter by Grade</option>
                <option value="10th">10th Grade</option>
                <option value="11th">11th Grade</option>
                <option value="12th">12th Grade</option>              </select>
            </div>
          </div>
        </div>
      </div>
      
      {/* Subjects Overview */}
      {!loading && subjects.length > 0 && (
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">Videos by Subject</h2>
            <Link 
              href="/admin/videos/subjects" 
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
            >
              View detailed subject organization
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {subjects.slice(0, 8).map(subject => {
              const subjectVideos = videosBySubject[subject.id] || [];
              return (
                <Link key={subject.id} href="/admin/videos/subjects" className="group">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-lg">
                        <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                          {subject.name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {subject.grade} • {subjectVideos.length} video{subjectVideos.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
          {subjects.length > 8 && (
            <div className="mt-4 text-center">
              <Link 
                href="/admin/videos/subjects" 
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
              >
                View all {subjects.length} subjects →
              </Link>
            </div>
          )}
        </div>
      )}
      
      {/* Loading State */}
      {loading && (
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-500 dark:text-gray-400">Loading classes and videos...</p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredClasses.length === 0 && (
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-12">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <Grid className="h-16 w-16 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No classes found</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {searchTerm || subjectFilter || yearFilter ? 
                'Try adjusting your search or filters to find classes.' : 
                'You need to create classes before you can assign videos to them.'}
            </p>              <Link href="/admin/classes" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors">
                <span className="flex items-center">
                  <Plus className="h-4 w-4 mr-1" />
                  Create Your First Class
                </span>
              </Link>
          </div>
        </div>
      )}
      
      {/* Classes Grid */}
      {!loading && filteredClasses.length > 0 && (
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Classes</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">            {filteredClasses.map(cls => (
              <ClassCard
                key={cls.id}
                id={cls.id}
                name={cls.name}
                subject={cls.subject}
                year={cls.year}
                videoCount={videosByClass[cls.id] || 0}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Recent Videos Section */}
      {!loading && recentVideos.length > 0 && (
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">Recent Videos</h2>
            <Link 
              href="/admin/videos/all" 
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
            >
              View all videos
            </Link>
          </div>          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">            {recentVideos.map(video => (
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
              />
            ))}
          </div>
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
