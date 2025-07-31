import { createContext, useContext, useCallback } from 'react';
import { StudentDocument } from '@/models/studentSchema';
import { User } from 'firebase/auth';

interface StudentContextType {
  user: User | null;
  student: StudentDocument | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  refreshStudent: () => Promise<void>;
}

// Create context for student data caching
export const StudentAuthContext = createContext<StudentContextType | null>(null);

export const useStudentAuthContext = () => {
  const context = useContext(StudentAuthContext);
  if (!context) {
    throw new Error('useStudentAuthContext must be used within StudentAuthProvider');
  }
  return context;
};

// Cache for student data to avoid repeated fetches
const STUDENT_CACHE_KEY = 'student_data_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const getStudentFromCache = (): StudentDocument | null => {
  try {
    const cached = localStorage.getItem(STUDENT_CACHE_KEY);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_DURATION) {
        return data;
      }
    }
  } catch (error) {
    console.warn('Error reading student cache:', error);
  }
  return null;
};

export const setStudentCache = (student: StudentDocument) => {
  try {
    localStorage.setItem(STUDENT_CACHE_KEY, JSON.stringify({
      data: student,
      timestamp: Date.now()
    }));
  } catch (error) {
    console.warn('Error setting student cache:', error);
  }
};

export const clearStudentCache = () => {
  try {
    localStorage.removeItem(STUDENT_CACHE_KEY);
  } catch (error) {
    console.warn('Error clearing student cache:', error);
  }
};
