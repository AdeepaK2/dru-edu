// Teacher data model with subject and class information
import { z } from 'zod';
import { Timestamp } from 'firebase/firestore';

// Subject-grade association for teachers
export const subjectGradeSchema = z.object({
  subjectId: z.string(),
  subjectName: z.string(),
  grade: z.string(),
});

// Teacher validation schema for creation (simplified)
export const teacherSchema = z.object({
  name: z.string().min(1, 'Teacher name is required'),
  email: z.string().email('Invalid email format'),
  phone: z.string().optional(),
  countryCode: z.string().default('+61'), // Default to Australia
  subjects: z.array(z.string()).min(1, 'At least one subject is required'),
  subjectGrades: z.array(subjectGradeSchema).optional().default([]), // New field for subject-grade associations
  qualifications: z.string().optional(),
  bio: z.string().optional(),
  status: z.enum(['Active', 'On Leave', 'Inactive']).default('Active'),
  hireDate: z.string().optional(),
  address: z.string().optional(),
  profileImageUrl: z.string().optional(),
});

// Teacher update schema (all fields optional except id)
export const teacherUpdateSchema = teacherSchema.partial();

// Subject-grade association interface
export interface SubjectGrade {
  subjectId: string;
  subjectName: string;
  grade: string;
}

// Teacher model
export interface Teacher {
  id: string;
  name: string;
  email: string;
  phone: string;
  countryCode: string;
  subjects: string[];
  subjectGrades?: SubjectGrade[]; // New field for subject-grade associations
  qualifications: string;
  bio?: string;
  status: 'Active' | 'On Leave' | 'Inactive';
  hireDate: string;
  address?: string;
  avatar: string;
  profileImageUrl?: string;
  /**
   * @deprecated Use dynamic queries with ClassFirestoreService.getClassesByTeacher() instead
   * This field is no longer maintained and may be inaccurate
   */
  classesAssigned?: number;
  studentsCount: number;
}

// Teacher document in Firestore
export interface TeacherDocument {
  id: string;
  name: string;
  email: string;
  phone: string;
  countryCode: string;
  subjects: string[];
  subjectGrades?: SubjectGrade[]; // New field for subject-grade associations
  qualifications: string;
  bio?: string;
  status: 'Active' | 'On Leave' | 'Inactive';
  hireDate: string;
  address?: string;
  avatar: string;
  profileImageUrl?: string;
  /**
   * @deprecated Use dynamic queries with ClassFirestoreService.getClassesByTeacher() instead
   * This field is no longer maintained and may be inaccurate
   */
  classesAssigned?: number;
  studentsCount: number;
  uid: string; // Firebase Auth UID
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Type inference from schemas
export type TeacherData = z.infer<typeof teacherSchema>;
export type TeacherUpdateData = z.infer<typeof teacherUpdateSchema>;
export type SubjectGradeData = z.infer<typeof subjectGradeSchema>;

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
      classesAssigned: teacher.classesAssigned, // Keep existing value if present, undefined if not
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
