import { useState } from 'react';
import { QuestionImageService } from '@/apiservices/questionImageService';
import { auth } from '@/utils/firebase-client';

// Types for the image upload hook
interface UploadOptions {
  type: 'question' | 'explanation' | 'option';
  optionId?: string; // Only required for option uploads
}

interface UploadResult {
  imageUrl: string;
  error: string | null;
}

/**
 * Custom hook for handling image uploads for questions
 */
export const useImageUpload = () => {
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  /**
   * Upload an image with progress tracking using Firebase Storage directly
   * 
   * @param file File to upload
   * @param options Upload options (type and optionId if needed)
   * @returns Promise with the upload result
   */
  const uploadImage = async (file: File, options: UploadOptions): Promise<UploadResult> => {
    console.log('🔍 Starting image upload:', { file: file.name, size: file.size, type: options.type });
    
    // Check authentication
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.error('❌ User not authenticated');
      return { imageUrl: '', error: 'User not authenticated. Please log in again.' };
    }
    
    console.log('✅ User authenticated:', currentUser.uid);
    
    if (!file) {
      return { imageUrl: '', error: 'No file provided' };
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return { imageUrl: '', error: 'File must be an image' };
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return { imageUrl: '', error: 'File size must be less than 10MB' };
    }

    setIsUploading(true);
    setProgress(0);
    setError(null);

    try {
      let downloadURL: string;

      console.log('🔍 Uploading to QuestionImageService with options:', options);

      // Use QuestionImageService to upload directly to Firebase Storage
      if (options.type === 'question') {
        downloadURL = await QuestionImageService.uploadQuestionImage(file, setProgress);
      } else if (options.type === 'explanation') {
        downloadURL = await QuestionImageService.uploadExplanationImage(file, setProgress);
      } else if (options.type === 'option' && options.optionId) {
        downloadURL = await QuestionImageService.uploadOptionImage(file, options.optionId, setProgress);
      } else {
        throw new Error('Invalid upload options');
      }

      console.log('✅ Image uploaded successfully:', downloadURL);
      setIsUploading(false);
      setProgress(100);
      
      return { imageUrl: downloadURL, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown upload error';
      console.error('❌ Image upload error:', err);
      console.error('Error details:', { message: errorMessage, error: err });
      
      setError(errorMessage);
      setIsUploading(false);
      
      return { imageUrl: '', error: errorMessage };
    }
  };

  return {
    uploadImage,
    isUploading,
    progress,
    error,
    resetState: () => {
      setIsUploading(false);
      setProgress(0);
      setError(null);
    }
  };
};
