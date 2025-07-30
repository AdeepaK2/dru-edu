// Student enrollment data model
import { z } from 'zod';
import { Timestamp } from 'firebase/firestore';

// Student enrollment validation schema
export const studentEnrollmentSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  classId: z.string().min(1, 'Class ID is required'),
  studentName: z.string().min(1, 'Student name is required'),
  studentEmail: z.string().email('Valid student email is required'),
  className: z.string().min(1, 'Class name is required'),
  subject: z.string().min(1, 'Subject is required'),
  enrolledAt: z.date().default(() => new Date()),
  status: z.enum(['Active', 'Inactive', 'Completed', 'Dropped']).default('Active'),
  grade: z.number().min(0).max(100).optional(),
  attendance: z.number().min(0).max(100).default(0),
  notes: z.string().optional(),
});

// Student enrollment update schema (all fields optional except IDs)
export const studentEnrollmentUpdateSchema = studentEnrollmentSchema.partial().extend({
  studentId: z.string().min(1, 'Student ID is required'),
  classId: z.string().min(1, 'Class ID is required'),
});

// Student enrollment interface
export interface StudentEnrollment {
  id: string;
  studentId: string;
  classId: string;
  studentName: string;
  studentEmail: string;
  className: string;
  subject: string;
  enrolledAt: Date;
  status: 'Active' | 'Inactive' | 'Completed' | 'Dropped';
  grade?: number;
  attendance: number;
  notes?: string;
}

// Student enrollment document in Firestore
export interface StudentEnrollmentDocument {
  id: string;
  studentId: string;
  classId: string;
  studentName: string;
  studentEmail: string;
  className: string;
  subject: string;
  enrolledAt: Timestamp;
  status: 'Active' | 'Inactive' | 'Completed' | 'Dropped';
  grade?: number;
  attendance: number;
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Type inference from schemas
export type StudentEnrollmentData = z.infer<typeof studentEnrollmentSchema>;
export type StudentEnrollmentUpdateData = z.infer<typeof studentEnrollmentUpdateSchema>;

// Helper function to convert Firestore timestamp to Date
export const convertTimestampToDate = (timestamp: Timestamp): Date => {
  return timestamp.toDate();
};

// Helper function to convert Date to Firestore timestamp
export const convertDateToTimestamp = (date: Date): Timestamp => {
  return Timestamp.fromDate(date);
};
