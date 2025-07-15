import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { auth, firestore } from '@/utils/firebase-client';
import { doc, getDoc } from 'firebase/firestore';

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

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      try {
        setLoading(true);
        setError(null);

        if (!user) {
          setUser(null);
          setTeacher(null);
          return;
        }

        // Check if user has teacher role
        const tokenResult = await user.getIdTokenResult();
        if (!tokenResult.claims.teacher && tokenResult.claims.role !== 'teacher') {
          setError('Access denied. User is not authorized as a teacher.');
          setUser(null);
          setTeacher(null);
          return;
        }

        setUser(user);

        // Fetch teacher profile from Firestore
        const teacherDoc = await getDoc(doc(firestore, 'teachers', user.uid));
        if (teacherDoc.exists()) {
          const teacherData = teacherDoc.data();
          setTeacher({
            id: teacherDoc.id,
            name: teacherData.name,
            email: teacherData.email,
            subjects: teacherData.subjects || [],
            classesAssigned: teacherData.classesAssigned || 0,
            studentsCount: teacherData.studentsCount || 0,
            avatar: teacherData.avatar || teacherData.name.charAt(0).toUpperCase(),
            status: teacherData.status,
            qualifications: teacherData.qualifications,
            bio: teacherData.bio,
            phone: teacherData.phone,
            countryCode: teacherData.countryCode,
            address: teacherData.address,
            profileImageUrl: teacherData.profileImageUrl,
            hireDate: teacherData.hireDate,
          });
        } else {
          setError('Teacher profile not found');
        }
      } catch (err) {
        console.error('Error in teacher auth:', err);
        setError('Failed to load teacher information');
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const refreshProfile = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const teacherDoc = await getDoc(doc(firestore, 'teachers', user.uid));
      if (teacherDoc.exists()) {
        const teacherData = teacherDoc.data();
        setTeacher({
          id: teacherDoc.id,
          name: teacherData.name,
          email: teacherData.email,
          subjects: teacherData.subjects || [],
          classesAssigned: teacherData.classesAssigned || 0,
          studentsCount: teacherData.studentsCount || 0,
          avatar: teacherData.avatar || teacherData.name.charAt(0).toUpperCase(),
          status: teacherData.status,
          qualifications: teacherData.qualifications,
          bio: teacherData.bio,
          phone: teacherData.phone,
          countryCode: teacherData.countryCode,
          address: teacherData.address,
          profileImageUrl: teacherData.profileImageUrl,
          hireDate: teacherData.hireDate,
        });
      }
    } catch (err) {
      console.error('Error refreshing profile:', err);
      setError('Failed to refresh teacher information');
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    teacher,
    loading,
    error,
    refreshProfile,
    isAuthenticated: !!user,
    isTeacher: !!teacher,
  };
}
