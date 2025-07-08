import { z } from 'zod';
import { Timestamp } from 'firebase/firestore';

// Video schema for validation
export const videoSchema = z.object({
  title: z.string().min(2, 'Video title must be at least 2 characters'),
  description: z.string().min(5, 'Description must be at least 5 characters'),
  thumbnailUrl: z.string().url('Invalid thumbnail URL').optional(),
  videoUrl: z.string().url('Invalid video URL'),
  subjectId: z.string().min(1, 'Subject is required'), // Reference to subject document ID
  subjectName: z.string().optional(), // For backward compatibility and display
  assignedClassIds: z.array(z.string()).optional(), // Classes this video is assigned to
  assignedStudentIds: z.array(z.string()).optional(), // Individual students this video is assigned to
  tags: z.array(z.string()).optional(), // Tags for filtering/categorization
  teacherId: z.string().optional(), // Teacher who uploaded the video
  visibility: z.enum(['public', 'private', 'unlisted']).default('private'),
  price: z.number().min(0, 'Price must be 0 or greater').optional(), // Price in dollars (0 for free)
});

// Video update schema (all fields optional except required ones for updates)
export const videoUpdateSchema = videoSchema.partial();

// Type for video data
export type VideoData = z.infer<typeof videoSchema>;
export type VideoUpdateData = z.infer<typeof videoUpdateSchema>;

// Video document in Firestore
export interface VideoDocument extends VideoData {
  id: string; // Firestore document ID
  videoId: string; // Custom video ID (e.g., "VID-2025-001")
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string; // Admin ID or teacher ID who created the video
  views: number; // Number of views
  duration?: number; // Duration in seconds
  status: 'active' | 'inactive' | 'processing';
}

// Frontend display interface
export interface VideoDisplayData {
  id: string;
  videoId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  videoUrl: string;
  subjectId: string;
  subjectName: string;
  assignedClasses: string[];
  assignedClassNames?: string[];
  assignedStudents?: string[];
  assignedStudentNames?: string[];
  tags: string[];
  teacherName?: string;
  visibility: 'public' | 'private' | 'unlisted';
  createdAt: string;
  views: number;
  status: 'active' | 'inactive' | 'processing';
  price?: number; // Price in dollars
}

// Helper function to convert VideoDocument to VideoDisplayData
export function videoDocumentToDisplay(
  doc: VideoDocument, 
  classNames?: Record<string, string>,
  studentNames?: Record<string, string>,
  teacherName?: string
): VideoDisplayData {
  return {
    id: doc.id,
    videoId: doc.videoId,
    title: doc.title,
    description: doc.description,
    thumbnailUrl: doc.thumbnailUrl || '/placeholder-thumbnail.jpg',
    videoUrl: doc.videoUrl,
    subjectId: doc.subjectId,
    subjectName: doc.subjectName || 'Unknown Subject',
    assignedClasses: doc.assignedClassIds || [],
    assignedClassNames: doc.assignedClassIds?.map(id => classNames?.[id] || id) || [],
    assignedStudents: doc.assignedStudentIds || [],
    assignedStudentNames: doc.assignedStudentIds?.map(id => studentNames?.[id] || id) || [],
    tags: doc.tags || [],
    teacherName: teacherName || 'Unknown',
    visibility: doc.visibility,
    createdAt: doc.createdAt.toDate().toLocaleString(),
    views: doc.views,
    status: doc.status,
    price: doc.price
  };
}

// Helper function to format duration in seconds to mm:ss or hh:mm:ss
export function formatDuration(seconds: number): string {
  if (!seconds) return '00:00';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
