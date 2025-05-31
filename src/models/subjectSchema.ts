import { z } from 'zod';
import { Timestamp } from 'firebase/firestore';

// Subject schema for validation
export const subjectSchema = z.object({
  name: z.string().min(2, 'Subject name must be at least 2 characters'),
  grade: z.string().min(1, 'Grade is required'),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

// Subject update schema (all fields optional)
export const subjectUpdateSchema = subjectSchema.partial().extend({
  id: z.string().optional(), // For Firestore document ID
});

// Type for subject data
export type SubjectData = z.infer<typeof subjectSchema>;
export type SubjectUpdateData = z.infer<typeof subjectUpdateSchema>;

// Subject document in Firestore
export interface SubjectDocument extends SubjectData {
  id: string; // Firestore document ID (auto-generated)
  subjectId: string; // Auto-generated unique subject ID (e.g., "SUB-2025-001")
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy?: string; // Admin ID who created the subject
  lastModifiedBy?: string; // Admin ID who last modified the subject
}

// Frontend display interface
export interface SubjectDisplayData {
  id: string;
  subjectId: string;
  name: string;
  grade: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Helper function to convert SubjectDocument to SubjectDisplayData
export function subjectDocumentToDisplay(
  doc: SubjectDocument
): SubjectDisplayData {
  return {
    id: doc.id,
    subjectId: doc.subjectId,
    name: doc.name,
    grade: doc.grade,
    description: doc.description || '',
    isActive: doc.isActive !== false, // Default to true if undefined
    createdAt: doc.createdAt.toDate().toISOString(),
    updatedAt: doc.updatedAt.toDate().toISOString(),
  };
}

// Helper function to convert form data to SubjectData
export function formDataToSubject(formData: any): SubjectData {
  return {
    name: formData.name,
    grade: formData.grade,
    description: formData.description || undefined,
    isActive: formData.isActive !== false, // Default to true if undefined
  };
}
