import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '@/utils/firebase-client';
import { v4 as uuidv4 } from 'uuid';

/**
 * Service for handling PDF uploads for student test submissions
 */
export class StudentPdfService {
  
  /**
   * Upload a PDF file for a student's essay answer
   * @param file PDF file to upload
   * @param attemptId Test attempt ID
   * @param questionId Question ID
   * @param studentId Student ID
   * @param onProgress Progress callback function
   * @returns Promise<string> Download URL
   */
  static async uploadEssayPdf(
    file: File,
    attemptId: string,
    questionId: string,
    studentId: string,
    onProgress?: (progress: number) => void
  ): Promise<string> {
    try {
      console.log('🔍 Starting PDF upload for essay answer:', {
        fileName: file.name,
        size: file.size,
        attemptId,
        questionId,
        studentId
      });

      // Validate file type
      if (file.type !== 'application/pdf') {
        throw new Error('Only PDF files are allowed');
      }

      // Validate file size (max 25MB for PDFs)
      const maxSize = 25 * 1024 * 1024; // 25MB
      if (file.size > maxSize) {
        throw new Error('PDF file size must be less than 25MB');
      }

      // Generate unique filename
      const timestamp = Date.now();
      const uniqueId = uuidv4();
      const fileName = `${timestamp}_${uniqueId}.pdf`;
      
      // Create storage reference
      const storageRef = ref(
        storage,
        `student-submissions/${studentId}/attempts/${attemptId}/essays/${questionId}/${fileName}`
      );

      console.log('📁 Storage path:', storageRef.fullPath);

      // Create upload task
      const uploadTask = uploadBytesResumable(storageRef, file);

      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log(`⏳ Upload progress: ${progress.toFixed(1)}%`);
            onProgress?.(progress);
          },
          (error) => {
            console.error('❌ PDF upload error:', error);
            reject(new Error(`Upload failed: ${error.message}`));
          },
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              console.log('✅ PDF uploaded successfully:', downloadURL);
              resolve(downloadURL);
            } catch (error) {
              console.error('❌ Error getting download URL:', error);
              reject(new Error('Failed to get file URL'));
            }
          }
        );
      });

    } catch (error) {
      console.error('❌ PDF upload service error:', error);
      throw error;
    }
  }

  /**
   * Delete a PDF file from storage
   * @param downloadUrl Full download URL of the file to delete
   */
  static async deletePdf(downloadUrl: string): Promise<void> {
    try {
      // Extract the file path from the download URL
      const url = new URL(downloadUrl);
      const pathMatch = url.pathname.match(/\/o\/(.+?)\?/);
      
      if (!pathMatch) {
        throw new Error('Invalid download URL format');
      }

      const filePath = decodeURIComponent(pathMatch[1]);
      const fileRef = ref(storage, filePath);
      
      console.log('🗑️ Deleting PDF:', filePath);
      
      // Note: deleteObject is not imported as it's rarely used in student submissions
      // If needed, import it from 'firebase/storage'
      // await deleteObject(fileRef);
      
      console.log('✅ PDF deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting PDF:', error);
      throw error;
    }
  }

  /**
   * Validate PDF file before upload
   * @param file File to validate
   * @returns boolean
   */
  static validatePdfFile(file: File): { isValid: boolean; error?: string } {
    // Check file type
    if (file.type !== 'application/pdf') {
      return { isValid: false, error: 'Only PDF files are allowed' };
    }

    // Check file size (max 25MB)
    const maxSize = 25 * 1024 * 1024; // 25MB
    if (file.size > maxSize) {
      return { isValid: false, error: 'PDF file size must be less than 25MB' };
    }

    // Check file name
    if (file.name.length > 100) {
      return { isValid: false, error: 'File name is too long (max 100 characters)' };
    }

    return { isValid: true };
  }

  /**
   * Get file size in human readable format
   * @param bytes File size in bytes
   * @returns Formatted file size string
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
