import React, { useState, useRef, useEffect } from 'react';
import { VideoFirestoreService } from '@/apiservices/videoFirestoreService';
import { ClassFirestoreService } from '@/apiservices/classFirestoreService';
import { StudentFirestoreService } from '@/apiservices/studentFirestoreService';
import { ClassDocument } from '@/models/classSchema';
import { X, Upload, ArrowRight, Search, ImagePlus, Plus } from 'lucide-react';

interface VideoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete?: (videoId: string) => void;
  userId: string;
  preSelectedClassId?: string; // Optional pre-selected class ID
}

interface StudentListItem {
  _id: string;
  name: string;
  email: string;
  status: 'Active' | 'Suspended' | 'Inactive';
}

export default function VideoUploadModal({ 
  isOpen, 
  onClose, 
  onUploadComplete,
  userId,
  preSelectedClassId
}: VideoUploadModalProps) {  const [step, setStep] = useState(1);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number>(0); // Price in dollars (0 for free)
  const [visibility, setVisibility] = useState<'public' | 'private' | 'unlisted'>('private');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [thumbnailPreview, setThumbnailPreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [classes, setClasses] = useState<ClassDocument[]>([]);
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [students, setStudents] = useState<StudentListItem[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [showTabContent, setShowTabContent] = useState<'classes' | 'students'>('classes');

  const videoInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  // Fetch all classes and students
  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        try {
          const allClasses = await ClassFirestoreService.getAllClasses();
          setClasses(allClasses);
          
          // Pre-select class if provided
          if (preSelectedClassId && !selectedClassIds.includes(preSelectedClassId)) {
            setSelectedClassIds([preSelectedClassId]);
            console.log('Pre-selected class:', preSelectedClassId);
          }
          
          const allStudents = await StudentFirestoreService.getAllStudents();
          setStudents(allStudents);
        } catch (error) {
          console.error('Error fetching data:', error);
          setError('Failed to load classes and students.');
        }
      };
      
      fetchData();
    }
  }, [isOpen, preSelectedClassId]);

  // Handle click outside to close modal
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  // Handle thumbnail file selection
  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file for the thumbnail.');
        return;
      }
      
      setThumbnailFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setError('');
    }
  };

  // Handle video file selection
  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('video/')) {
        setError('Please upload a valid video file.');
        return;
      }
      
      // Check file size (limit to 500MB)
      if (file.size > 500 * 1024 * 1024) {
        setError('Video file size must be less than 500MB.');
        return;
      }
      
      setVideoFile(file);
      setError('');
      
      // Auto-generate title from filename if empty
      if (!title) {
        const nameWithoutExt = file.name.split('.').slice(0, -1).join('.');
        setTitle(nameWithoutExt.replace(/_/g, ' '));
      }
    }
  };

  // Add tag
  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  // Remove tag
  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  // Handle tag input keydown (add on Enter)
  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  // Toggle class selection
  const toggleClassSelection = (classId: string) => {
    setSelectedClassIds(prev => 
      prev.includes(classId) 
        ? prev.filter(id => id !== classId) 
        : [...prev, classId]
    );
  };

  // Toggle student selection
  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudentIds(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId) 
        : [...prev, studentId]
    );
  };

  // Filter students based on search
  const filteredStudents = studentSearch 
    ? students.filter(student => 
        student.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
        student.email.toLowerCase().includes(studentSearch.toLowerCase())
      )
    : students;
  // Reset form fields
  const resetForm = () => {
    setStep(1);
    setVideoFile(null);
    setThumbnailFile(null);
    setTitle('');
    setDescription('');
    setPrice(0);
    setVisibility('private');
    setTags([]);
    setTagInput('');
    setUploadProgress(0);
    setThumbnailPreview('');
    setSelectedClassIds([]);
    setSelectedStudentIds([]);
    setStudentSearch('');
    setShowTabContent('classes');
    setError('');
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploading) return;
    
    try {
      setUploading(true);
      setError('');
      
      if (!videoFile) {
        setError('Please select a video file.');
        setUploading(false);
        return;
      }
      
      if (!title || !description) {
        setError('Please fill out all required fields.');
        setUploading(false);
        return;
      }
      
      // Upload video file
      const videoUrl = await VideoFirestoreService.uploadVideo(
        videoFile,
        (progress) => {
          setUploadProgress(progress);
        }
      );
        // Upload thumbnail if provided
      let thumbnailUrl = '';
      if (thumbnailFile) {
        thumbnailUrl = await VideoFirestoreService.uploadThumbnail(thumbnailFile);
      }      // Create video document in Firestore - prepare data object without undefined values
      const videoData: any = {
        title,
        description,
        videoUrl,
        tags: tags.length > 0 ? tags : [],
        visibility,
        price: price, // Always include price (0 for free)
      };

      // Only add optional fields if they have values
      if (thumbnailUrl) {
        videoData.thumbnailUrl = thumbnailUrl;
      }

      if (selectedClassIds.length > 0) {
        videoData.assignedClassIds = selectedClassIds;
        console.log('Assigning video to classes:', selectedClassIds);
      }

      if (selectedStudentIds.length > 0) {
        videoData.assignedStudentIds = selectedStudentIds;
        console.log('Assigning video to students:', selectedStudentIds);
      }

      console.log('Creating video with data:', videoData);
      const videoId = await VideoFirestoreService.createVideo(videoData, userId);
      
      // Notify parent component
      if (onUploadComplete) {
        onUploadComplete(videoId);
      }
      
      resetForm();
      onClose();
    } catch (error) {
      console.error('Upload error:', error);
      setError(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div 
        ref={modalRef} 
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
      >
        <div className="border-b border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {step === 1 ? 'Upload Video' : 'Video Details'}
          </h2>          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {/* Progress Steps */}
        <div className="px-6 pt-4">
          <div className="flex items-center justify-center mb-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${
              step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
            }`}>
              1
            </div>
            <div className={`h-1 w-16 ${
              step > 1 ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
            }`}></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ml-2 ${
              step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
            }`}>
              2
            </div>
          </div>
        </div>
        
        {error && (
          <div className="mx-6 mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 text-red-700 dark:text-red-400 rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={step === 1 ? () => setStep(2) : handleSubmit}>
          <div className="p-6 space-y-6">
            {/* Step 1: File Upload */}
            {step === 1 && (
              <div className="space-y-6">
                {/* Video Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Video File <span className="text-red-500">*</span>
                  </label>
                  <div 
                    className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/30"
                    onClick={() => videoInputRef.current?.click()}
                  >
                    <input 
                      type="file" 
                      ref={videoInputRef}
                      className="hidden"
                      accept="video/*"
                      onChange={handleVideoChange}
                    />                    <Upload className="h-12 w-12 text-gray-400 mb-2" />
                    {videoFile ? (
                      <div className="text-center">
                        <p className="font-medium text-gray-900 dark:text-white mb-1">{videoFile.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {(videoFile.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <p className="font-medium text-gray-900 dark:text-white mb-1">Click to select a video</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          MP4, WebM or MOV (max. 500MB)
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Thumbnail Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Thumbnail (Optional)
                  </label>
                  <div className="flex items-start space-x-4">
                    <div 
                      className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/30"
                      onClick={() => thumbnailInputRef.current?.click()}
                      style={{ width: '180px', height: '100px' }}
                    >
                      <input 
                        type="file" 
                        ref={thumbnailInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleThumbnailChange}
                      />
                      {thumbnailPreview ? (
                        <img 
                          src={thumbnailPreview} 
                          alt="Thumbnail preview" 
                          className="w-full h-full object-cover rounded"
                        />
                      ) : (
                        <div className="text-center">                        <ImagePlus className="h-6 w-6 text-gray-400 mb-1" />
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Add Thumbnail
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        Adding a custom thumbnail helps your video stand out. 
                        For best results, use an image with 16:9 aspect ratio.
                      </p>
                      {thumbnailPreview && (
                        <button
                          type="button"
                          className="mt-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm"
                          onClick={() => {
                            setThumbnailFile(null);
                            setThumbnailPreview('');
                          }}
                        >
                          Remove thumbnail
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Step 2: Video Metadata */}
            {step === 2 && (
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="title"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  </div>
                    <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="description"
                      rows={3}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                    ></textarea>
                  </div>
                  
                  <div>
                    <label htmlFor="price" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Price (AUD)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-gray-500 dark:text-gray-400">$</span>
                      <input
                        type="number"
                        id="price"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        className="mt-1 block w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        value={price || ''}
                        onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Set to $0.00 for free videos. Students will need to purchase paid videos to access them.
                    </p>
                  </div>
                  
                  <div>
                    <label htmlFor="visibility" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Visibility
                    </label>
                    <select
                      id="visibility"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      value={visibility}
                      onChange={(e) => setVisibility(e.target.value as 'public' | 'private' | 'unlisted')}
                    >
                      <option value="private">Private (Only visible to assigned classes/students)</option>
                      <option value="unlisted">Unlisted (Accessible via link only)</option>
                      <option value="public">Public (Visible to all students)</option>
                    </select>
                  </div>
                  
                  {/* Tags */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Tags
                    </label>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      {tags.map(tag => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-100 rounded"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="ml-1 text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-100"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex">
                      <input
                        type="text"
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-l-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        placeholder="Add a tag"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={handleTagKeyDown}
                      />
                      <button
                        type="button"
                        className="px-3 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onClick={handleAddTag}
                      >
                        Add
                      </button>
                    </div>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Press Enter to add multiple tags
                    </p>
                  </div>
                  
                  {/* Assignment Tabs */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Assign Video To
                    </label>
                    
                    <div className="border-b border-gray-200 dark:border-gray-700">
                      <div className="flex -mb-px">
                        <button
                          type="button"
                          className={`py-2 px-4 font-medium text-sm ${
                            showTabContent === 'classes' 
                              ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' 
                              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                          }`}
                          onClick={() => setShowTabContent('classes')}
                        >
                          Classes
                        </button>
                        <button
                          type="button"
                          className={`py-2 px-4 font-medium text-sm ${
                            showTabContent === 'students' 
                              ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' 
                              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                          }`}
                          onClick={() => setShowTabContent('students')}
                        >
                          Individual Students
                        </button>
                      </div>
                    </div>
                    
                    {/* Class Assignment */}
                    {showTabContent === 'classes' && (
                      <div className="mt-3">
                        {classes.length > 0 ? (
                          <div className="max-h-60 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-md">
                            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                              {classes.map(cls => (
                                <li key={cls._id}>
                                  <label className="flex items-center px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      className="mr-3 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                      checked={selectedClassIds.includes(cls._id)}
                                      onChange={() => toggleClassSelection(cls._id)}
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
                          </div>
                        ) : (
                          <p className="text-gray-500 dark:text-gray-400">No classes available</p>
                        )}
                      </div>
                    )}
                    
                    {/* Student Assignment */}
                    {showTabContent === 'students' && (
                      <div className="mt-3">
                        <div className="mb-3">
                          <div className="relative">
                            <input
                              type="text"
                              className="block w-full px-3 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                              placeholder="Search students..."
                              value={studentSearch}
                              onChange={(e) => setStudentSearch(e.target.value)}
                            />
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                          </div>
                        </div>
                        
                        {students.length > 0 ? (
                          <div className="max-h-60 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-md">
                            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                              {filteredStudents.map(student => (
                                <li key={student._id}>
                                  <label className="flex items-center px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      className="mr-3 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                      checked={selectedStudentIds.includes(student._id)}
                                      onChange={() => toggleStudentSelection(student._id)}
                                    />
                                    <div>
                                      <div className="font-medium text-gray-900 dark:text-white">
                                        {student.name}
                                      </div>
                                      <div className="text-sm text-gray-500 dark:text-gray-400">
                                        {student.email} | {student.status}
                                      </div>
                                    </div>
                                  </label>
                                </li>
                              ))}
                              {filteredStudents.length === 0 && (
                                <li className="px-4 py-3 text-gray-500 dark:text-gray-400">
                                  No students match your search
                                </li>
                              )}
                            </ul>
                          </div>
                        ) : (
                          <p className="text-gray-500 dark:text-gray-400">No students available</p>
                        )}
                      </div>
                    )}
                    
                    <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      {selectedClassIds.length > 0 && (
                        <p>{selectedClassIds.length} class(es) selected</p>
                      )}
                      {selectedStudentIds.length > 0 && (
                        <p>{selectedStudentIds.length} student(s) selected</p>
                      )}
                      {selectedClassIds.length === 0 && selectedStudentIds.length === 0 && (
                        <p>No classes or students selected</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {uploading && (
            <div className="px-6 pt-0 pb-4">
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 transition-all duration-300 ease-in-out"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-center text-sm mt-2 text-gray-500 dark:text-gray-400">
                Uploading... {uploadProgress.toFixed(0)}%
              </p>
            </div>
          )}
          
          <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex justify-between">
            {step === 1 ? (
              <>
                <button 
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={!videoFile}
                  className={`px-4 py-2 rounded-md ${
                    videoFile 
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Continue
                </button>
              </>
            ) : (
              <>
                <button 
                  type="button"
                  onClick={() => setStep(1)}
                  disabled={uploading}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                >
                  Back
                </button>
                <button 
                  type="submit"
                  disabled={uploading || !title || !description}
                  className={`px-4 py-2 rounded-md ${
                    uploading || !title || !description
                      ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {uploading ? 'Uploading...' : 'Upload Video'}
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
