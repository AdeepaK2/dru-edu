// Test Counter Schema - Tracks sequential test numbers for each class
// This ensures each test gets a unique, incrementing number within each class

import { Timestamp } from 'firebase/firestore';

// Test counter for a specific class
export interface ClassTestCounter {
  id: string; // Document ID format: `${classId}_${subjectId}` or just `${classId}`
  classId: string;
  className: string;
  subjectId?: string; // Optional: track by subject within class
  subjectName?: string;
  teacherId: string;
  teacherName: string;
  
  // Counter information
  currentTestNumber: number; // The next test number to assign
  totalTestsCreated: number; // Total tests created for this class/subject
  
  // Last test information
  lastTestId?: string;
  lastTestTitle?: string;
  lastTestCreatedAt?: Timestamp;
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Test number assignment record
export interface TestNumberAssignment {
  id: string;
  testId: string;
  testTitle: string;
  classId: string;
  className: string;
  subjectId?: string;
  subjectName?: string;
  teacherId: string;
  teacherName: string;
  
  // Assigned number
  testNumber: number;
  displayNumber: string; // e.g., "Test #5", "Math Test #12"
  
  // Context
  isGlobalNumber: boolean; // true if numbered across all subjects, false if per-subject
  
  // Metadata
  assignedAt: Timestamp;
}

// Global test counter (optional: for school-wide test numbering)
export interface GlobalTestCounter {
  id: string; // e.g., "global" or school ID
  schoolId?: string;
  
  // Global counter
  currentGlobalTestNumber: number;
  totalTestsCreated: number;
  
  // Statistics
  activeClasses: number;
  activeTeachers: number;
  testsThisMonth: number;
  testsThisYear: number;
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastResetAt?: Timestamp; // For yearly/monthly resets if needed
}

// Test numbering configuration
export interface TestNumberingConfig {
  id: string; // e.g., classId or "global"
  
  // Numbering strategy
  strategy: 'per_class' | 'per_subject' | 'global' | 'custom';
  
  // Format settings
  prefix?: string; // e.g., "Test", "Quiz", "Exam"
  suffix?: string; // e.g., "2024", "Semester 1"
  includeSubject: boolean; // Include subject name in display
  includeDate: boolean; // Include creation date
  
  // Number format
  numberFormat: 'simple' | 'padded' | 'roman'; // e.g., "5", "005", "V"
  paddingLength?: number; // for padded format
  
  // Reset options
  resetPeriod?: 'never' | 'yearly' | 'semester' | 'monthly';
  lastReset?: Timestamp;
  
  // Examples of generated numbers
  exampleFormats: string[]; // e.g., ["Test #5", "Math Test #12", "Quiz 007"]
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
