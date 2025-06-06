'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { VideoFirestoreService } from '@/apiservices/videoFirestoreService';
import { ClassFirestoreService } from '@/apiservices/classFirestoreService';
import { VideoDocument, formatDuration } from '@/models/videoSchema';
import { ClassDocument } from '@/models/classSchema';
import Link from 'next/link';
import { 
  ArrowLeft, Edit, Trash2, X, Clock, Eye, School, GraduationCap, 
  Tag, Video, CheckCircle, AlertTriangle, Globe, Lock, Link as LinkIcon
} from 'lucide-react';

export default function VideoDetail() {
  const [loading, setLoading] = useState(true);
  const [video, setVideo] = useState<VideoDocument | null>(null);
  const [classes, setClasses] = useState<Record<string, ClassDocument>>({});
  const [allClasses, setAllClasses] = useState<ClassDocument[]>([]);
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private' | 'unlisted'>('private');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  const params = useParams();
  const router = useRouter();
  const videoId = params.id as string;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch video data
        const videoData = await VideoFirestoreService.getVideoById(videoId);
        if (!videoData) {
          console.error('Video not found');
          router.push('/admin/videos');
          return;
        }
        
        setVideo(videoData);
        setTitle(videoData.title);
        setDescription(videoData.description);
        setVisibility(videoData.visibility);
        setSelectedClassIds(videoData.assignedClassIds || []);
        
        // Fetch all classes
        const fetchedClasses = await ClassFirestoreService.getAllClasses();
        setAllClasses(fetchedClasses);
          // Create a map of class IDs to class data
        const classMap: Record<string, ClassDocument> = {};
        for (const cls of fetchedClasses) {
          classMap[cls.id] = cls;
        }
        setClasses(classMap);
        
        // Increment view count
        await VideoFirestoreService.incrementViewCount(videoId);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (videoId) {
      fetchData();
    }
  }, [videoId, router]);
  
  // Toggle class selection
  const toggleClassSelection = (classId: string) => {
    setSelectedClassIds(prev => 
      prev.includes(classId)
        ? prev.filter(id => id !== classId)
        : [...prev, classId]
    );
  };
  
  // Save changes
  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      
      if (!title) {
        setError('Title is required');
        setSaving(false);
        return;
      }
      
      // Update video data
      await VideoFirestoreService.updateVideo(videoId, {
        title,
        description,
        visibility,
      });
      
      // Assign to classes
      await VideoFirestoreService.assignToClasses(videoId, selectedClassIds);
      
      // Refresh video data
      const updatedVideo = await VideoFirestoreService.getVideoById(videoId);
      if (updatedVideo) {
        setVideo(updatedVideo);
      }
      
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving changes:', error);
      setError(`Failed to save changes: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };
  
  // Delete video
  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this video? This action cannot be undone.')) {
      try {
        setSaving(true);
        await VideoFirestoreService.deleteVideo(videoId);
        router.push('/admin/videos');
      } catch (error) {
        console.error('Error deleting video:', error);
        setError(`Failed to delete video: ${error instanceof Error ? error.message : 'Unknown error'}`);
        setSaving(false);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Loading State */}
      {loading && (
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-500 dark:text-gray-400">Loading video...</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 text-red-700 dark:text-red-400 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline">{error}</span>
          <button 
            className="absolute top-0 bottom-0 right-0 px-4 py-3" 
            onClick={() => setError('')}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Video Content */}
      {!loading && video && (
        <>
          {/* Header */}
          <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6">
            <Link 
              href="/admin/videos/all" 
              className="flex items-center text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mb-4"
            >            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Videos
            </Link>
            
            <div className="flex flex-col md:flex-row md:items-start md:justify-between">
              <div className="flex-1">
                {isEditing ? (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>
                ) : (
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{video.title}</h1>
                )}
                
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-4">
                  <div className="flex items-center mr-4">                    <Clock className="h-4 w-4 mr-1" />
                    <span>Added {video.createdAt.toDate().toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center mr-4">                    <Eye className="h-4 w-4 mr-1" />
                    <span>{video.views} views</span>
                  </div>
                  <div>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full 
                      ${video.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-400' : 
                        video.status === 'processing' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800/20 dark:text-yellow-400' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                      {video.status === 'active' ? 'Active' : 
                        video.status === 'processing' ? 'Processing' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-2 mt-4 md:mt-0">
                {isEditing ? (
                  <>
                    <button
                      onClick={() => setIsEditing(false)}
                      disabled={saving}
                      className="px-3 py-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-3 py-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                    >
                      <span className="flex items-center">                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </span>
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={saving}
                      className="px-3 py-1 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-400 rounded-md hover:bg-red-50 dark:hover:bg-red-900/30 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                    >
                      <span className="flex items-center">                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
          
          {/* Video Player and Details */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Video Player */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden">
                <div className="aspect-video w-full">
                  <video 
                    src={video.videoUrl}
                    poster={video.thumbnailUrl}
                    controls
                    className="w-full h-full object-contain bg-black"
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
                
                {/* Video Information */}
                <div className="p-6">
                  {isEditing ? (
                    <>
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Description
                        </label>
                        <textarea
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          rows={4}
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                        />
                      </div>
                      
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Visibility
                        </label>
                        <select
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          value={visibility}
                          onChange={(e) => setVisibility(e.target.value as 'public' | 'private' | 'unlisted')}
                        >
                          <option value="private">Private (Only visible to assigned classes)</option>
                          <option value="unlisted">Unlisted (Accessible via link only)</option>
                          <option value="public">Public (Visible to all students)</option>
                        </select>
                      </div>
                    </>
                  ) : (
                    <>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Description</h3>
                      <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line mb-6">
                        {video.description}
                      </p>
                        <div className="flex flex-wrap gap-2 mb-6">
                        <div className="flex items-center px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-800/30 text-blue-800 dark:text-blue-300 text-sm">                          <School className="h-4 w-4 mr-1" />
                          <span>{video.subjectName || 'Unknown Subject'}</span>
                        </div>                        
                        {video.duration && (
                          <div className="flex items-center px-3 py-1 rounded-full bg-green-100 dark:bg-green-800/30 text-green-800 dark:text-green-300 text-sm">                          <Clock className="h-4 w-4 mr-1" />
                          <span>{formatDuration(video.duration)}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 text-sm">                          {video.visibility === 'public' ? (
                            <Globe className="h-4 w-4 mr-1" />
                          ) : video.visibility === 'unlisted' ? (
                            <LinkIcon className="h-4 w-4 mr-1" />
                          ) : (
                            <Lock className="h-4 w-4 mr-1" />
                          )}
                          <span>
                            {video.visibility === 'public' ? 'Public' : 
                             video.visibility === 'unlisted' ? 'Unlisted' : 'Private'}
                          </span>
                        </div>
                      </div>
                      
                      {video.tags && video.tags.length > 0 && (
                        <>
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Tags</h3>
                          <div className="flex flex-wrap gap-2 mb-6">
                            {video.tags.map(tag => (
                              <span key={tag} className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
            
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  {isEditing ? 'Assign to Classes' : 'Assigned Classes'}
                </h3>
                
                {isEditing ? (
                  <div className="max-h-96 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-md">
                    {allClasses.length > 0 ? (
                      <ul className="divide-y divide-gray-200 dark:divide-gray-700">                        {allClasses.map(cls => (
                          <li key={cls.id}>
                            <label className="flex items-center px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer">
                              <input
                                type="checkbox"
                                className="mr-3 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                checked={selectedClassIds.includes(cls.id)}
                                onChange={() => toggleClassSelection(cls.id)}
                              />
                              <div>
                                <div className="font-medium text-gray-900 dark:text-white">
                                  {cls.name}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {cls.subject} | {cls.year} | Center {cls.centerId}
                                </div>
                              </div>
                            </label>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="px-4 py-3 text-gray-500 dark:text-gray-400">No classes available</p>
                    )}
                  </div>
                ) : (
                  <>
                    {video.assignedClassIds && video.assignedClassIds.length > 0 ? (
                      <ul className="divide-y divide-gray-200 dark:divide-gray-700 border border-gray-200 dark:border-gray-700 rounded-md">
                        {video.assignedClassIds.map(classId => {
                          const cls = classes[classId];
                          return (
                            <li key={classId} className="px-4 py-3">
                              <Link href={`/admin/videos/class/${classId}`} className="hover:underline">
                                <div className="font-medium text-blue-600 dark:text-blue-400">
                                  {cls?.name || 'Unknown Class'}
                                </div>
                                {cls && (
                                  <div className="text-sm text-gray-500 dark:text-gray-400">
                                    {cls.subject} | {cls.year} | Center {cls.centerId}
                                  </div>
                                )}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <div className="text-center p-4 border border-gray-200 dark:border-gray-700 rounded-md">                        <div className="flex justify-center mb-2">
                          <School className="h-10 w-10 text-gray-400" />
                        </div>
                        <p className="text-gray-500 dark:text-gray-400">
                          This video is not assigned to any classes
                        </p>
                        <button
                          onClick={() => setIsEditing(true)}
                          className="mt-3 px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                          Assign to Classes
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
