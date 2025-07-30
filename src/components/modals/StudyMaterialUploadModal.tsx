'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Upload, 
  FileText, 
  PlayCircle, 
  ExternalLink, 
  FileIcon, 
  Image as ImageIcon,
  AlertCircle, 
  Loader2,
  Plus,
  Tag
} from 'lucide-react';
import { Button } from '@/components/ui';
import { createStudyMaterial } from '@/apiservices/studyMaterialFirestoreService';
import { StudyMaterialStorageService } from '@/apiservices/studyMaterialStorageService';
import { StudyMaterialData } from '@/models/studyMaterialSchema';
import { ClassDocument } from '@/models/classSchema';
import { LessonDocument } from '@/models/lessonSchema';
import { LessonFirestoreService } from '@/apiservices/lessonFirestoreService';
import { useTeacherAuth } from '@/hooks/useOptimizedTeacherAuth';

interface StudyMaterialUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  classData?: ClassDocument;
  preSelectedLessonId?: string;
}

interface FormData {
  title: string;
  description: string;
  fileType: 'pdf' | 'video' | 'image' | 'link' | 'other';
  externalUrl: string;
  lessonId: string;
  year: number;
  isRequired: boolean;
  isVisible: boolean;
  order: number;
  tags: string[];
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  dueDate: string;
  duration?: number;
}

export default function StudyMaterialUploadModal({
  isOpen,
  onClose,
  onSuccess,
  classData,
  preSelectedLessonId
}: StudyMaterialUploadModalProps) {
  const { teacher } = useTeacherAuth();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState('');
  const [lessons, setLessons] = useState<LessonDocument[]>([]);
  const [loadingLessons, setLoadingLessons] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    fileType: 'pdf',
    externalUrl: '',
    lessonId: preSelectedLessonId || '',
    year: new Date().getFullYear(),
    isRequired: false,
    isVisible: true,
    order: 1,
    tags: [],
    difficulty: 'Beginner',
    dueDate: '',
    duration: undefined
  });

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: '',
        description: '',
        fileType: 'pdf',
        externalUrl: '',
        lessonId: preSelectedLessonId || '',
        year: new Date().getFullYear(),
        isRequired: false,
        isVisible: true,
        order: 1,
        tags: [],
        difficulty: 'Beginner',
        dueDate: '',
        duration: undefined
      });
      setFile(null);
      setError(null);
      setUploadProgress(0);
      setTagInput('');
    }
  }, [isOpen, preSelectedLessonId]);

  // Load lessons when modal opens and class data is available
  useEffect(() => {
    const loadLessons = async () => {
      if (!isOpen || !classData?.subjectId) return;
      
      try {
        setLoadingLessons(true);
        const lessonsData = await LessonFirestoreService.getLessonsBySubject(classData.subjectId);
        setLessons(lessonsData);
      } catch (err) {
        console.error('Error loading lessons:', err);
        setError('Failed to load lessons');
      } finally {
        setLoadingLessons(false);
      }
    };

    loadLessons();
  }, [isOpen, classData?.subjectId]);

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Auto-detect file type
    let fileType: FormData['fileType'] = 'other';
    if (selectedFile.type.includes('pdf')) {
      fileType = 'pdf';
    } else if (selectedFile.type.startsWith('video/')) {
      fileType = 'video';
    } else if (selectedFile.type.startsWith('image/')) {
      fileType = 'image';
    }

    // Validate file type
    const allowedTypes = StudyMaterialStorageService.getAllowedFileTypes(fileType);
    if (allowedTypes.length > 0 && !StudyMaterialStorageService.validateFileType(selectedFile, allowedTypes)) {
      setError(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`);
      return;
    }

    // Validate file size
    const maxSize = StudyMaterialStorageService.getMaxFileSize(fileType);
    if (!StudyMaterialStorageService.validateFileSize(selectedFile, maxSize)) {
      setError(`File size too large. Maximum size: ${StudyMaterialStorageService.formatFileSize(maxSize)}`);
      return;
    }

    setFile(selectedFile);
    setFormData(prev => ({
      ...prev,
      fileType,
      title: prev.title || selectedFile.name.split('.')[0]
    }));
    setError(null);
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

  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      setError('Material title is required');
      return false;
    }
    if (!formData.description.trim()) {
      setError('Material description is required');
      return false;
    }
    // Lesson selection is now optional - materials can be unassigned
    if (formData.fileType === 'link' && !formData.externalUrl.trim()) {
      setError('External URL is required for link materials');
      return false;
    }
    if (formData.fileType !== 'link' && !file) {
      setError('Please select a file to upload');
      return false;
    }
    if (!classData) {
      setError('Class information is missing');
      return false;
    }
    if (!teacher) {
      setError('Teacher authentication required');
      return false;
    }
    return true;
  };

  const uploadFileToStorage = async (file: File): Promise<string> => {
    if (!classData) {
      throw new Error('Class data is required for file upload');
    }

    try {
      // Upload to Firebase Storage with progress tracking
      const downloadUrl = await StudyMaterialStorageService.uploadStudyMaterial(
        file,
        classData.id,
        formData.fileType,
        (progress) => {
          setUploadProgress(progress);
        }
      );

      return downloadUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to upload file');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      let fileUrl = '';
      let fileName = '';
      let fileSize = 0;
      let mimeType = '';

      if (formData.fileType === 'link') {
        // For external links
        fileUrl = formData.externalUrl;
        fileName = formData.title;
        fileSize = 0;
        mimeType = 'text/html';
      } else if (file) {
        // Upload file to storage
        fileUrl = await uploadFileToStorage(file);
        fileName = file.name;
        fileSize = file.size;
        mimeType = file.type;
      }

      // Find the selected lesson name
      const selectedLesson = lessons.find(lesson => lesson.id === formData.lessonId);
      const lessonName = selectedLesson ? selectedLesson.name : (formData.lessonId ? 'Unknown Lesson' : '');

      console.log('🔍 Upload Debug:', {
        lessonId: formData.lessonId,
        selectedLesson,
        lessonName,
        allLessons: lessons.map(l => ({ id: l.id, name: l.name }))
      });

      // Create study material data
      const materialData: StudyMaterialData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        classId: classData!.id,
        subjectId: classData!.subjectId,
        teacherId: teacher!.id,
        week: 1, // Default week - this field will be deprecated in favor of lessonId
        weekTitle: 'By Lesson', // Default title since we're organizing by lessons now
        year: formData.year,
        fileUrl,
        fileName,
        fileSize,
        fileType: formData.fileType,
        mimeType,
        uploadedAt: new Date(),
        dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
        isRequired: formData.isRequired,
        isVisible: formData.isVisible,
        order: formData.order,
        tags: formData.tags,
        difficulty: formData.difficulty,
        viewCount: 0,
        ...(formData.fileType === 'link' && { externalUrl: formData.externalUrl }),
        ...(formData.duration && { duration: formData.duration }),
        ...(formData.lessonId && formData.lessonId.trim() && { lessonId: formData.lessonId.trim() })
      };

      // Save to Firestore
      await createStudyMaterial(materialData);

      // Success
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error uploading material:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload material');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'pdf': return <FileText className="w-8 h-8 text-red-500" />;
      case 'video': return <PlayCircle className="w-8 h-8 text-purple-500" />;
      case 'link': return <ExternalLink className="w-8 h-8 text-blue-500" />;
      case 'image': return <ImageIcon className="w-8 h-8 text-green-500" />;
      default: return <FileIcon className="w-8 h-8 text-gray-500" />;
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
                Upload Study Material
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Add materials for {classData?.name || 'your class'}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
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
                    Uploading material... {uploadProgress}%
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Basic Information</h3>
                
                {/* Title */}
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Material Title *
                  </label>
                  <input
                    id="title"
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Enter material title"
                    disabled={uploading}
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description *
                  </label>
                  <textarea
                    id="description"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Describe the material content and purpose"
                    disabled={uploading}
                    required
                  />
                </div>

                {/* File Type */}
                <div>
                  <label htmlFor="fileType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Material Type *
                  </label>
                  <select
                    id="fileType"
                    value={formData.fileType}
                    onChange={(e) => handleInputChange('fileType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    disabled={uploading}
                  >
                    <option value="pdf">PDF Document</option>
                    <option value="video">Video</option>
                    <option value="image">Image</option>
                    <option value="link">External Link</option>
                    <option value="other">Other File</option>
                  </select>
                </div>
              </div>

              {/* File Upload or External URL */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  {formData.fileType === 'link' ? 'External Link' : 'File Upload'}
                </h3>
                
                {formData.fileType === 'link' ? (
                  <div>
                    <label htmlFor="externalUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      URL *
                    </label>
                    <input
                      id="externalUrl"
                      type="url"
                      value={formData.externalUrl}
                      onChange={(e) => handleInputChange('externalUrl', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="https://example.com/resource"
                      disabled={uploading}
                      required
                    />
                  </div>
                ) : (
                  <div 
                    className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileSelect}
                      className="hidden"
                      disabled={uploading}
                      accept={
                        formData.fileType === 'pdf' ? '.pdf' :
                        formData.fileType === 'video' ? 'video/*' :
                        formData.fileType === 'image' ? 'image/*' : '*'
                      }
                    />
                    
                    {file ? (
                      <div className="flex items-center justify-center space-x-3">
                        {getFileIcon(formData.fileType)}
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{file.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {StudyMaterialStorageService.formatFileSize(file.size)}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div>
                        {getFileIcon(formData.fileType)}
                        <p className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                          Click to upload {formData.fileType.toUpperCase()} file
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formData.fileType === 'pdf' && 'PDF documents up to 25MB'}
                          {formData.fileType === 'video' && 'Video files up to 500MB'}
                          {formData.fileType === 'image' && 'Images up to 10MB'}
                          {formData.fileType === 'other' && 'Files up to 25MB'}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Organization */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Organization</h3>
                
                {/* Lesson Selection */}
                <div>
                  <label htmlFor="lessonId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Lesson (Optional)
                  </label>
                  {loadingLessons ? (
                    <div className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Loading lessons...</span>
                    </div>
                  ) : (
                    <select
                      id="lessonId"
                      value={formData.lessonId}
                      onChange={(e) => handleInputChange('lessonId', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      disabled={uploading}
                    >
                      <option value="">📋 General Materials (No specific lesson)</option>
                      {lessons.length > 0 && lessons.map((lesson) => (
                        <option key={lesson.id} value={lesson.id}>
                          📚 {lesson.order}. {lesson.name}
                        </option>
                      ))}
                      {lessons.length === 0 && (
                        <option value="" disabled>No lessons available</option>
                      )}
                    </select>
                  )}
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Leave unselected for general materials that don't belong to a specific lesson
                  </p>
                </div>

                {/* Order */}
                <div>
                  <label htmlFor="order" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Order within Lesson
                  </label>
                  <input
                    id="order"
                    type="number"
                    min="1"
                    value={formData.order}
                    onChange={(e) => handleInputChange('order', parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    disabled={uploading}
                  />
                </div>

                {/* Difficulty */}
                <div>
                  <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Difficulty Level
                  </label>
                  <select
                    id="difficulty"
                    value={formData.difficulty}
                    onChange={(e) => handleInputChange('difficulty', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    disabled={uploading}
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
              </div>

              {/* Options */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Options</h3>
                
                {/* Due Date */}
                <div>
                  <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Due Date (Optional)
                  </label>
                  <input
                    id="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => handleInputChange('dueDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    disabled={uploading}
                  />
                </div>

                {/* Duration (for videos) */}
                {formData.fileType === 'video' && (
                  <div>
                    <label htmlFor="duration" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Duration (minutes)
                    </label>
                    <input
                      id="duration"
                      type="number"
                      min="1"
                      value={formData.duration || ''}
                      onChange={(e) => handleInputChange('duration', parseInt(e.target.value) || undefined)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="Enter video duration"
                      disabled={uploading}
                    />
                  </div>
                )}

                {/* Checkboxes */}
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isRequired}
                      onChange={(e) => handleInputChange('isRequired', e.target.checked)}
                      className="mr-3 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      disabled={uploading}
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Required material (students must complete)
                    </span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isVisible}
                      onChange={(e) => handleInputChange('isVisible', e.target.checked)}
                      className="mr-3 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      disabled={uploading}
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Visible to students
                    </span>
                  </label>
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tags
                </label>
                <div className="space-y-2">
                  <div className="flex">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={handleTagKeyPress}
                      placeholder="Add a tag"
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-l-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      disabled={uploading}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAddTag}
                      disabled={uploading}
                      className="rounded-l-none"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map(tag => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300 rounded-full"
                        >
                          <Tag className="w-3 h-3 mr-1" />
                          {tag}
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            disabled={uploading}
                            className="ml-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
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
              <span>{uploading ? 'Uploading...' : 'Upload Material'}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
