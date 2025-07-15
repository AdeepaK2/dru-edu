'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Upload, 
  Video, 
  Image, 
  AlertCircle,
  Loader2
} from 'lucide-react';
import { Button, Input, Modal, TextArea } from '@/components/ui';
import { VideoFirestoreService } from '@/apiservices/videoFirestoreService';
import { LessonFirestoreService } from '@/apiservices/lessonFirestoreService';
import { VideoData } from '@/models/videoSchema';
import { LessonDocument } from '@/models/lessonSchema';

interface TeacherVideoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  teacherId: string;
  teacherName: string;
  availableSubjects: Array<{ id: string; name: string; }>;
  availableClasses: Array<{ id: string; name: string; subjectId: string; }>;
}

export default function TeacherVideoUploadModal({
  isOpen,
  onClose,
  onSuccess,
  teacherId,
  teacherName,
  availableSubjects,
  availableClasses
}: TeacherVideoUploadModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subjectId: '',
    lessonId: '',
    assignedClassIds: [] as string[],
    tags: [] as string[],
    visibility: 'private' as 'public' | 'private' | 'unlisted',
    price: 0
  });

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState('');
  const [availableLessons, setAvailableLessons] = useState<LessonDocument[]>([]);
  const [loadingLessons, setLoadingLessons] = useState(false);

  // Get classes for selected subject
  const filteredClasses = availableClasses.filter(cls => 
    formData.subjectId ? cls.subjectId === formData.subjectId : true
  );

  // Load lessons when subject changes
  useEffect(() => {
    const loadLessons = async () => {
      if (!formData.subjectId) {
        setAvailableLessons([]);
        return;
      }

      setLoadingLessons(true);
      try {
        const lessons = await LessonFirestoreService.getLessonsBySubject(formData.subjectId);
        setAvailableLessons(lessons);
      } catch (error) {
        console.error('Error loading lessons:', error);
        setAvailableLessons([]);
      } finally {
        setLoadingLessons(false);
      }
    };

    loadLessons();
  }, [formData.subjectId]);

  // Reset lesson selection when subject changes
  useEffect(() => {
    if (formData.lessonId && !availableLessons.find(lesson => lesson.id === formData.lessonId)) {
      setFormData(prev => ({ ...prev, lessonId: '' }));
    }
  }, [availableLessons, formData.lessonId]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError(null);
  };

  const handleClassSelection = (classId: string) => {
    setFormData(prev => ({
      ...prev,
      assignedClassIds: prev.assignedClassIds.includes(classId)
        ? prev.assignedClassIds.filter(id => id !== classId)
        : [...prev.assignedClassIds, classId]
    }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('video/')) {
        setError('Please select a valid video file');
        return;
      }
      
      // Validate file size (max 500MB)
      if (file.size > 500 * 1024 * 1024) {
        setError('Video file size must be less than 500MB');
        return;
      }
      
      setVideoFile(file);
      setError(null);
    }
  };

  const handleThumbnailFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('Thumbnail file size must be less than 10MB');
        return;
      }
      
      setThumbnailFile(file);
      setError(null);
    }
  };

  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      setError('Video title is required');
      return false;
    }
    if (!formData.description.trim()) {
      setError('Video description is required');
      return false;
    }
    if (formData.description.trim().length < 5) {
      setError('Description must be at least 5 characters long');
      return false;
    }
    if (!formData.subjectId) {
      setError('Please select a subject');
      return false;
    }
    if (!videoFile) {
      setError('Please select a video file to upload');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setUploading(true);
    setUploadProgress(0);
    
    try {
      // Upload video file
      const videoUrl = await VideoFirestoreService.uploadVideo(
        videoFile!,
        (progress) => setUploadProgress(progress)
      );
      
      // Upload thumbnail if provided
      let thumbnailUrl = '';
      if (thumbnailFile) {
        thumbnailUrl = await VideoFirestoreService.uploadThumbnail(thumbnailFile);
      }
      
      // Get subject name
      const selectedSubject = availableSubjects.find(s => s.id === formData.subjectId);
      
      // Get lesson name if lesson is selected
      const selectedLesson = formData.lessonId ? availableLessons.find(l => l.id === formData.lessonId) : null;
      
      // Create video data
      const videoData: VideoData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        videoUrl,
        subjectId: formData.subjectId,
        subjectName: selectedSubject?.name || '',
        lessonId: formData.lessonId || undefined,
        lessonName: selectedLesson?.name || undefined,
        assignedClassIds: formData.assignedClassIds,
        tags: formData.tags,
        teacherId,
        visibility: formData.visibility,
        price: formData.price
      };
      
      // Only add thumbnailUrl if it's not empty
      if (thumbnailUrl && thumbnailUrl.trim()) {
        videoData.thumbnailUrl = thumbnailUrl;
      }
      
      // Create video document with teacher as author
      await VideoFirestoreService.createVideo(videoData, teacherId);
      
      onSuccess();
    } catch (err: any) {
      console.error('Error uploading video:', err);
      setError(err.message || 'Failed to upload video');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleClose = () => {
    if (!uploading) {
      // Reset form data
      setFormData({
        title: '',
        description: '',
        subjectId: '',
        lessonId: '',
        assignedClassIds: [],
        tags: [],
        visibility: 'private',
        price: 0
      });
      setVideoFile(null);
      setThumbnailFile(null);
      setError(null);
      setTagInput('');
      setAvailableLessons([]);
      setUploadProgress(0);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
              <Upload className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Upload Video
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Share your lesson video with your classes
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClose}
            disabled={uploading}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Display */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Upload Progress */}
          {uploading && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4">
              <div className="flex items-center">
                <Loader2 className="h-5 w-5 text-blue-400 animate-spin" />
                <div className="ml-3 flex-1">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Uploading video... {uploadProgress}%
                  </p>
                  <div className="mt-2 bg-blue-200 dark:bg-blue-800 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Basic Info */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Video Title *
                </label>
                <Input
                  type="text"
                  value={formData.title}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('title', e.target.value)}
                  placeholder="Enter video title"
                  disabled={uploading}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description *
                </label>
                <TextArea
                  value={formData.description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('description', e.target.value)}
                  placeholder="Describe your video content (minimum 5 characters)"
                  rows={4}
                  disabled={uploading}
                  required
                />
                <div className="flex justify-between items-center mt-1">
                  <span className={`text-xs ${
                    formData.description.length < 5 
                      ? 'text-red-500 dark:text-red-400' 
                      : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {formData.description.length}/5 characters minimum
                  </span>
                  {formData.description.length < 5 && formData.description.length > 0 && (
                    <span className="text-xs text-red-500 dark:text-red-400">
                      Need {5 - formData.description.length} more characters
                    </span>
                  )}
                </div>
              </div>

              {/* Subject Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Subject *
                </label>
                <select
                  value={formData.subjectId}
                  onChange={(e) => handleInputChange('subjectId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  disabled={uploading}
                  required
                >
                  <option value="">Select a subject</option>
                  {availableSubjects.map(subject => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Lesson Selection (Optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Lesson (Optional)
                </label>
                <select
                  value={formData.lessonId}
                  onChange={(e) => handleInputChange('lessonId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  disabled={uploading || loadingLessons || !formData.subjectId}
                >
                  <option value="">
                    {!formData.subjectId 
                      ? 'Select a subject first' 
                      : loadingLessons 
                        ? 'Loading lessons...' 
                        : availableLessons.length === 0 
                          ? 'No lessons available' 
                          : 'Select a lesson (optional)'
                    }
                  </option>
                  {availableLessons.map(lesson => (
                    <option key={lesson.id} value={lesson.id}>
                      {lesson.name}
                    </option>
                  ))}
                </select>
                {formData.subjectId && availableLessons.length === 0 && !loadingLessons && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    No lessons found for this subject. You can still upload the video without selecting a lesson.
                  </p>
                )}
              </div>

              {/* Video File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Video File *
                </label>
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
                  <div className="text-center">
                    <Video className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="mt-4">
                      <label htmlFor="video-upload" className="cursor-pointer">
                        <span className="mt-2 block text-sm font-medium text-gray-900 dark:text-white">
                          {videoFile ? videoFile.name : 'Click to upload video'}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          MP4, MOV, AVI up to 500MB
                        </span>
                      </label>
                      <input
                        id="video-upload"
                        type="file"
                        accept="video/*"
                        onChange={handleVideoFileChange}
                        disabled={uploading}
                        className="hidden"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Thumbnail Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Thumbnail (Optional)
                </label>
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
                  <div className="text-center">
                    <Image className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="mt-4">
                      <label htmlFor="thumbnail-upload" className="cursor-pointer">
                        <span className="mt-2 block text-sm font-medium text-gray-900 dark:text-white">
                          {thumbnailFile ? thumbnailFile.name : 'Click to upload thumbnail'}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          JPG, PNG up to 10MB
                        </span>
                      </label>
                      <input
                        id="thumbnail-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleThumbnailFileChange}
                        disabled={uploading}
                        className="hidden"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Class Assignment */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Assign to Classes
                </label>
                <div className="border border-gray-300 dark:border-gray-600 rounded-md p-3 max-h-40 overflow-y-auto">
                  {filteredClasses.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {formData.subjectId ? 'No classes found for selected subject' : 'Select a subject first'}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {filteredClasses.map(cls => (
                        <label key={cls.id} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.assignedClassIds.includes(cls.id)}
                            onChange={() => handleClassSelection(cls.id)}
                            disabled={uploading}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                            {cls.name}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tags
                </label>
                <div className="flex space-x-2 mb-2">
                  <Input
                    type="text"
                    value={tagInput}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTagInput(e.target.value)}
                    placeholder="Add a tag"
                    disabled={uploading}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddTag}
                    disabled={uploading}
                  >
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        disabled={uploading}
                        className="ml-1 text-blue-600 hover:text-blue-800"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Visibility */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Visibility
                </label>
                <select
                  value={formData.visibility}
                  onChange={(e) => handleInputChange('visibility', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  disabled={uploading}
                >
                  <option value="private">Private - Only assigned classes</option>
                  <option value="unlisted">Unlisted - Anyone with link</option>
                  <option value="public">Public - Everyone can see</option>
                </select>
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Price (Optional)
                </label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  disabled={uploading}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Leave as 0 for free videos
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={uploading}
              className="flex items-center space-x-2"
            >
              {uploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              <span>{uploading ? 'Uploading...' : 'Upload Video'}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
