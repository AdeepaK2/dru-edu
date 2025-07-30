import { 
  ref, 
  uploadBytesResumable, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { storage } from '@/utils/firebase-client';

// Constants for storage paths
const QUESTION_IMAGES_PATH = 'questions/images';
const EXPLANATION_IMAGES_PATH = 'questions/explanations';
const OPTION_IMAGES_PATH = 'questions/options';

export class QuestionImageService {
  /**
   * Upload a question image to Firebase Storage
   * @param file The image file to upload
   * @param onProgress Optional callback for upload progress
   * @returns Promise resolving to the download URL
   */
  static async uploadQuestionImage(file: File, onProgress?: (progress: number) => void): Promise<string> {
    return this.uploadImage(file, QUESTION_IMAGES_PATH, onProgress);
  }

  /**
   * Upload an explanation image to Firebase Storage
   * @param file The image file to upload
   * @param onProgress Optional callback for upload progress
   * @returns Promise resolving to the download URL
   */
  static async uploadExplanationImage(file: File, onProgress?: (progress: number) => void): Promise<string> {
    return this.uploadImage(file, EXPLANATION_IMAGES_PATH, onProgress);
  }

  /**
   * Upload an option image to Firebase Storage
   * @param file The image file to upload
   * @param optionId The ID of the option this image belongs to
   * @param onProgress Optional callback for upload progress
   * @returns Promise resolving to the download URL
   */
  static async uploadOptionImage(file: File, optionId: string, onProgress?: (progress: number) => void): Promise<string> {
    return this.uploadImage(file, `${OPTION_IMAGES_PATH}/${optionId}`, onProgress);
  }

  /**
   * Delete an image from Firebase Storage
   * @param imageUrl The URL of the image to delete
   * @returns Promise that resolves when deletion is complete
   */
  static async deleteImage(imageUrl: string): Promise<void> {
    try {
      // Extract the path from the URL
      if (!imageUrl || !imageUrl.includes('firebase')) {
        console.warn('Not a Firebase Storage URL, skipping delete:', imageUrl);
        return;
      }

      // Create a reference from the URL
      const imageRef = ref(storage, imageUrl);
      await deleteObject(imageRef);
    } catch (error) {
      console.error('Error deleting image:', error);
      throw new Error(`Failed to delete image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Private helper method to upload any image to Firebase Storage
   * @param file The image file to upload
   * @param path The storage path for the image
   * @param onProgress Optional callback for upload progress
   * @returns Promise resolving to the download URL
   */
  private static async uploadImage(file: File, path: string, onProgress?: (progress: number) => void): Promise<string> {
    try {
      console.log('🔍 QuestionImageService: Starting upload to path:', path);
      console.log('🔍 File details:', { name: file.name, size: file.size, type: file.type });
      
      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      const fullPath = `${path}/${fileName}`;
      const storageRef = ref(storage, fullPath);
      
      console.log('🔍 Storage reference created:', fullPath);
      
      const uploadTask = uploadBytesResumable(storageRef, file);
      
      return new Promise<string>((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log('📈 Upload progress:', Math.round(progress) + '%');
            if (onProgress) onProgress(progress);
          },
          (error) => {
            console.error('❌ Upload error in state_changed:', error);
            console.error('Error code:', error.code);
            console.error('Error message:', error.message);
            
            // Provide more specific error messages
            let errorMessage = error.message;
            if (error.code === 'storage/unauthorized') {
              errorMessage = 'Upload failed: You do not have permission to upload images. Please check your authentication.';
            } else if (error.code === 'storage/canceled') {
              errorMessage = 'Upload was canceled.';
            } else if (error.code === 'storage/quota-exceeded') {
              errorMessage = 'Upload failed: Storage quota exceeded.';
            }
            
            reject(new Error(errorMessage));
          },
          async () => {
            try {
              console.log('✅ Upload completed, getting download URL...');
              // Upload completed successfully, get download URL
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              console.log('✅ Download URL obtained:', downloadURL);
              resolve(downloadURL);
            } catch (error) {
              console.error('❌ Failed to get download URL:', error);
              reject(new Error(`Failed to get download URL: ${error instanceof Error ? error.message : 'Unknown error'}`));
            }
          }
        );
      });
    } catch (error) {
      console.error('❌ Error in uploadImage method:', error);
      throw new Error(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
