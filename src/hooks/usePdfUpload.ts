import { useState } from 'react';
import { StudentPdfService } from '@/apiservices/studentPdfService';
import { auth } from '@/utils/firebase-client';

// Types for the PDF upload hook
interface PdfUploadOptions {
  attemptId: string;
  questionId: string;
  studentId: string;
}

interface PdfUploadResult {
  pdfUrl: string;
  error: string | null;
}

/**
 * Custom hook for handling PDF uploads for student essay answers
 */
export const usePdfUpload = () => {
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  /**
   * Upload a PDF file with progress tracking
   * 
   * @param file PDF file to upload
   * @param options Upload options (attemptId, questionId, studentId)
   * @returns Promise with the upload result
   */
  const uploadPdf = async (file: File, options: PdfUploadOptions): Promise<PdfUploadResult> => {
    console.log('🔍 Starting PDF upload:', { 
      file: file.name, 
      size: StudentPdfService.formatFileSize(file.size),
      options 
    });
    
    // Check authentication
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.error('❌ User not authenticated');
      return { pdfUrl: '', error: 'User not authenticated. Please log in again.' };
    }
    
    console.log('✅ User authenticated:', currentUser.uid);
    
    if (!file) {
      return { pdfUrl: '', error: 'No file provided' };
    }

    // Validate PDF file
    const validation = StudentPdfService.validatePdfFile(file);
    if (!validation.isValid) {
      return { pdfUrl: '', error: validation.error || 'Invalid file' };
    }

    setIsUploading(true);
    setProgress(0);
    setError(null);

    try {
      console.log('🔍 Uploading PDF to StudentPdfService');

      // Upload PDF using the service
      const downloadURL = await StudentPdfService.uploadEssayPdf(
        file,
        options.attemptId,
        options.questionId,
        options.studentId,
        setProgress
      );

      console.log('✅ PDF uploaded successfully:', downloadURL);
      setIsUploading(false);
      setProgress(100);
      
      return { pdfUrl: downloadURL, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown upload error';
      console.error('❌ PDF upload error:', err);
      console.error('Error details:', { message: errorMessage, error: err });
      
      setError(errorMessage);
      setIsUploading(false);
      
      return { pdfUrl: '', error: errorMessage };
    }
  };

  /**
   * Reset the hook state
   */
  const resetState = () => {
    setIsUploading(false);
    setProgress(0);
    setError(null);
  };

  return {
    uploadPdf,
    isUploading,
    progress,
    error,
    resetState
  };
};
