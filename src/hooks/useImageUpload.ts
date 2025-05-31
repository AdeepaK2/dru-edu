import { useState } from 'react';
import { getAuthToken } from '@/utils/auth-helper';

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
   * Upload an image with progress tracking
   * 
   * @param file File to upload
   * @param options Upload options (type and optionId if needed)
   * @returns Promise with the upload result
   */
  const uploadImage = async (file: File, options: UploadOptions): Promise<UploadResult> => {
    if (!file) {
      return { imageUrl: '', error: 'No file provided' };
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return { imageUrl: '', error: 'File must be an image' };
    }

    setIsUploading(true);
    setProgress(0);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('Authentication token not found');
      }

      let url = `/api/questions/upload-image?type=${options.type}`;
      if (options.type === 'option' && options.optionId) {
        url += `&optionId=${options.optionId}`;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || response.statusText);
      }

      const data = await response.json();
      setIsUploading(false);
      setProgress(100);
      
      return { imageUrl: data.imageUrl, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown upload error';
      setError(errorMessage);
      setIsUploading(false);
      console.error('Image upload error:', err);
      
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
