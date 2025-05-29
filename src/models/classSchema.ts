import { z } from 'zod';
import { Timestamp } from 'firebase/firestore';

// Schedule time slot schema
export const timeSlotSchema = z.object({
  day: z.string().min(1, 'Day is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
});

// Class schema for validation
export const classSchema = z.object({
  name: z.string().min(2, 'Class name must be at least 2 characters'),
  centerId: z.enum(['1', '2'], { required_error: 'Please select a center' }),
  year: z.string().min(1, 'Year is required'),
  subject: z.string().min(1, 'Subject is required'),
  schedule: z.array(timeSlotSchema).min(1, 'At least one time slot is required'),
  monthlyFee: z.number().min(0, 'Monthly fee must be positive'),
  teacherId: z.string().optional(), // Will be assigned later
  description: z.string().optional(),
});

// Class update schema (all fields optional except required ones for updates)
export const classUpdateSchema = classSchema.partial().extend({
  _id: z.string().optional(), // For Firestore document ID
});

// Type for class data
export type ClassData = z.infer<typeof classSchema>;
export type ClassUpdateData = z.infer<typeof classUpdateSchema>;

// Class document in Firestore
export interface ClassDocument extends ClassData {
  _id: string; // Firestore document ID (auto-generated)
  classId: string; // Auto-generated unique class ID (e.g., "CLS-2025-001")
  status: 'Active' | 'Inactive' | 'Suspended';
  enrolledStudents: number;
  waitingList: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy?: string; // Admin ID who created the class
  lastModifiedBy?: string; // Admin ID who last modified the class
}

// Frontend display interface (for backward compatibility with existing UI)
export interface ClassDisplayData {
  id: string;
  classId: string;
  name: string;
  subject: string;
  year: string;
  teacher: string;
  schedule: string;
  students: number;
  status: string;
  description: string;
  centerId: string;
  centerName: string;
  monthlyFee: number;
  waitingList?: number;
}

// Helper function to convert ClassDocument to ClassDisplayData
export function classDocumentToDisplay(doc: ClassDocument, centerName?: string): ClassDisplayData {
  const scheduleText = doc.schedule.map(slot => 
    `${slot.day}: ${slot.startTime} - ${slot.endTime}`
  ).join(', ');

  return {
    id: doc._id,
    classId: doc.classId,
    name: doc.name,
    subject: doc.subject,
    year: doc.year,
    teacher: doc.teacherId ? 'Assigned' : 'Not Assigned',
    schedule: scheduleText,
    students: doc.enrolledStudents,
    status: doc.status,
    description: doc.description || '',
    centerId: doc.centerId,
    centerName: centerName || `Center ${doc.centerId}`,
    monthlyFee: doc.monthlyFee,
    waitingList: doc.waitingList,
  };
}

// Helper function to convert form data to ClassData
export function formDataToClass(formData: any): ClassData {
  return {
    name: formData.name,
    centerId: formData.centerId as '1' | '2',
    year: formData.year,
    subject: formData.subject,
    schedule: formData.schedule || [],
    monthlyFee: parseFloat(formData.monthlyFee),
    description: formData.description || undefined,
  };
}
