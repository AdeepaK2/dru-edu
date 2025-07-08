// Teacher data model with subject and class information
import { z } from 'zod';
import { Timestamp } from 'firebase/firestore';

// Teacher validation schema for creation (simplified)
export const teacherSchema = z.object({
  name: z.string().min(1, 'Teacher name is required'),
  email: z.string().email('Invalid email format'),
  phone: z.string().optional(),
  countryCode: z.string().default('+61'), // Default to Australia
  subject: z.string().min(1, 'Subject is required'),
  qualifications: z.string().optional(),
  bio: z.string().optional(),
  status: z.enum(['Active', 'On Leave', 'Inactive']).default('Active'),
  hireDate: z.string().optional(),
  address: z.string().optional(),
});

// Teacher update schema (all fields optional except id)
export const teacherUpdateSchema = teacherSchema.partial();

// Teacher model
export interface Teacher {
  id: string;
  name: string;
  email: string;
  phone: string;
  countryCode: string;
  subject: string;
  qualifications: string;
  bio?: string;
  status: 'Active' | 'On Leave' | 'Inactive';
  hireDate: string;
  address?: string;
  avatar: string;
  classesAssigned: number;
  studentsCount: number;
}

// Teacher document in Firestore
export interface TeacherDocument {
  id: string;
  name: string;
  email: string;
  phone: string;
  countryCode: string;
  subject: string;
  qualifications: string;
  bio?: string;
  status: 'Active' | 'On Leave' | 'Inactive';
  hireDate: string;
  address?: string;
  avatar: string;
  classesAssigned: number;
  studentsCount: number;
  uid: string; // Firebase Auth UID
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Type inference from schemas
export type TeacherData = z.infer<typeof teacherSchema>;
export type TeacherUpdateData = z.infer<typeof teacherUpdateSchema>;

// Function to save teacher data (deprecated - use API route instead)
export const saveTeacher = async (teacher: Partial<Teacher>): Promise<Teacher> => {
  try {
    console.warn('saveTeacher function is deprecated. Use /api/teacher endpoint instead.');
    
    // For backward compatibility, return a mock teacher with ID
    return {
      ...teacher,
      id: Math.floor(Math.random() * 1000) + 6 + '', // Convert to string
      hireDate: teacher.hireDate || new Date().toISOString().split('T')[0],
      avatar: teacher.avatar || 'TC',
      status: teacher.status || 'Active',
      classesAssigned: teacher.classesAssigned || 0,
      studentsCount: teacher.studentsCount || 0,
    } as Teacher;
  } catch (error) {
    console.error('Error saving teacher:', error);
    throw error;
  }
};

// Function to fetch all teachers (deprecated - use API route instead)
export const getTeachers = async (): Promise<Teacher[]> => {
  try {
    console.warn('getTeachers function is deprecated. Use /api/teacher endpoint instead.');
    return [];
  } catch (error) {
    console.error('Error fetching teachers:', error);
    return [];
  }
};
