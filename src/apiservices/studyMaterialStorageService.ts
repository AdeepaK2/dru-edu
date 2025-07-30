import { 
  ref, 
  uploadBytesResumable, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { storage } from '@/utils/firebase-client';

// Constants for storage paths
const STUDY_MATERIALS_PATH = 'study-materials';

export class StudyMaterialStorageService {
  /**
   * Upload a study material file to Firebase Storage
   * @param file The file to upload
   * @param classId The ID of the class
   * @param materialType The type of material (pdf, video, image, etc.)
   * @param onProgress Optional callback for upload progress
   * @returns Promise resolving to the download URL
   */
  static async uploadStudyMaterial(
    file: File, 
    classId: string, 
    materialType: string,
    onProgress?: (progress: number) => void
  ): Promise<string> {
    // Generate unique file name with timestamp
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}_${sanitizedFileName}`;
    
    // Create storage path: study-materials/{classId}/{materialType}/{fileName}
    const storagePath = `${STUDY_MATERIALS_PATH}/${classId}/${materialType}/${fileName}`;
    
    return this.uploadFile(file, storagePath, onProgress);
  }

  /**
   * Upload any file to Firebase Storage
   * @param file The file to upload
   * @param storagePath The full storage path
   * @param onProgress Optional callback for upload progress
   * @returns Promise resolving to the download URL
   */
  private static async uploadFile(
    file: File, 
    storagePath: string, 
    onProgress?: (progress: number) => void
  ): Promise<string> {
    try {
      // Create storage reference
      const storageRef = ref(storage, storagePath);
      
      // Create upload task
      const uploadTask = uploadBytesResumable(storageRef, file);
      
      // Return promise that resolves with download URL
      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            // Calculate progress percentage
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            
            // Call progress callback if provided
            if (onProgress) {
              onProgress(Math.round(progress));
            }
          },
          (error) => {
            // Handle upload errors
            console.error('Upload error:', error);
            reject(new Error(`Upload failed: ${error.message}`));
          },
          async () => {
            try {
              // Upload completed successfully, get download URL
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              resolve(downloadURL);
            } catch (error) {
              reject(new Error(`Failed to get download URL: ${error}`));
            }
          }
        );
      });
    } catch (error) {
      throw new Error(`Failed to start upload: ${error}`);
    }
  }

  /**
   * Delete a study material file from Firebase Storage
   * @param fileUrl The URL of the file to delete
   * @returns Promise that resolves when deletion is complete
   */
  static async deleteStudyMaterial(fileUrl: string): Promise<void> {
    try {
      // Create reference from URL
      const storageRef = ref(storage, fileUrl);
      
      // Delete the file
      await deleteObject(storageRef);
    } catch (error) {
      console.error('Error deleting file:', error);
      throw new Error(`Failed to delete file: ${error}`);
    }
  }

  /**
   * Get file size in bytes from a File object
   * @param file The file to get size for
   * @returns File size in bytes
   */
  static getFileSize(file: File): number {
    return file.size;
  }

  /**
   * Format file size from bytes to human readable format
   * @param bytes File size in bytes
   * @returns Formatted file size string
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Validate file type against allowed types
   * @param file The file to validate
   * @param allowedTypes Array of allowed MIME types
   * @returns True if file type is allowed
   */
  static validateFileType(file: File, allowedTypes: string[]): boolean {
    return allowedTypes.includes(file.type);
  }

  /**
   * Validate file size against maximum allowed size
   * @param file The file to validate
   * @param maxSizeBytes Maximum allowed size in bytes
   * @returns True if file size is within limit
   */
  static validateFileSize(file: File, maxSizeBytes: number): boolean {
    return file.size <= maxSizeBytes;
  }

  /**
   * Get allowed file types for different material types
   * @param materialType The type of material
   * @returns Array of allowed MIME types
   */
  static getAllowedFileTypes(materialType: string): string[] {
    const allowedTypes: Record<string, string[]> = {
      pdf: ['application/pdf'],
      video: [
        'video/mp4', 
        'video/avi', 
        'video/mov', 
        'video/wmv', 
        'video/webm',
        'video/quicktime'
      ],
      image: [
        'image/jpeg', 
        'image/jpg', 
        'image/png', 
        'image/gif', 
        'image/webp',
        'image/svg+xml'
      ],
      document: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain'
      ]
    };

    return allowedTypes[materialType] || [];
  }

  /**
   * Get maximum file size for different material types
   * @param materialType The type of material
   * @returns Maximum file size in bytes
   */
  static getMaxFileSize(materialType: string): number {
    const maxSizes: Record<string, number> = {
      pdf: 25 * 1024 * 1024,        // 25 MB
      video: 500 * 1024 * 1024,     // 500 MB
      image: 10 * 1024 * 1024,      // 10 MB
      document: 25 * 1024 * 1024,   // 25 MB
      other: 25 * 1024 * 1024       // 25 MB
    };

    return maxSizes[materialType] || maxSizes.other;
  }
}
