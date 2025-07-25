import { useState, useEffect, useCallback, useMemo } from 'react';
import { User } from 'firebase/auth';
import { auth, firestore } from '@/utils/firebase-client';
import { doc, getDoc } from 'firebase/firestore';
import { TeacherNavigationCache } from '@/utils/teacher-performance';

export interface TeacherProfile {
  id: string;
  name: string;
  email: string;
  subjects: string[];
  classesAssigned: number;
  studentsCount: number;
  avatar: string;
  status: string;
  qualifications?: string;
  bio?: string;
  phone?: string;
  countryCode?: string;
  address?: string;
  profileImageUrl?: string;
  hireDate?: string;
}

export function useTeacherAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [teacher, setTeacher] = useState<TeacherProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Memoize cache instance
  const cache = useMemo(() => TeacherNavigationCache.getInstance(), []);

  // Memoized teacher data fetch
  const fetchTeacherData = useCallback(async (user: User) => {
    try {
      // Check cache first
      const cachedTeacher = cache.getTeacherData(`teacher_${user.uid}`);
      if (cachedTeacher) {
        setTeacher(cachedTeacher);
        return cachedTeacher;
      }

      // Fetch from Firestore
      const teacherDocRef = doc(firestore, 'teachers', user.uid);
      const teacherSnapshot = await getDoc(teacherDocRef);

      if (!teacherSnapshot.exists()) {
        throw new Error('Teacher profile not found');
      }

      const teacherData = {
        id: teacherSnapshot.id,
        ...teacherSnapshot.data()
      } as TeacherProfile;

      // Cache the result
      cache.setTeacherData(`teacher_${user.uid}`, teacherData);
      setTeacher(teacherData);
      return teacherData;
    } catch (err) {
      console.error('Error fetching teacher data:', err);
      throw err;
    }
  }, [cache]);

  useEffect(() => {
    let isMounted = true;

    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!isMounted) return;

      try {
        setLoading(true);
        setError(null);

        if (!user) {
          setUser(null);
          setTeacher(null);
          return;
        }

        // Check if user has teacher role with optimized token check
        const tokenResult = await user.getIdTokenResult(false); // Don't force refresh for better performance
        if (!tokenResult.claims.teacher && tokenResult.claims.role !== 'teacher') {
          setError('Access denied. User is not authorized as a teacher.');
          setUser(null);
          setTeacher(null);
          return;
        }

        setUser(user);
        await fetchTeacherData(user);
      } catch (err) {
        if (isMounted) {
          console.error('Auth error:', err);
          setError(err instanceof Error ? err.message : 'Authentication failed');
          setUser(null);
          setTeacher(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [fetchTeacherData]);

  // Memoized return value to prevent unnecessary re-renders
  return useMemo(() => ({
    user,
    teacher,
    loading,
    error,
    isAuthenticated: !!user && !!teacher && !error,
    refetchTeacher: user ? () => fetchTeacherData(user) : null
  }), [user, teacher, loading, error, fetchTeacherData]);
}
