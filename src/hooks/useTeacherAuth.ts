import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { auth, firestore } from '@/utils/firebase-client';
import { doc, getDoc } from 'firebase/firestore';

export interface TeacherProfile {
  id: string;
  name: string;
  email: string;
  subjects: string[];
  classesAssigned?: number; // Made optional - deprecated in favor of dynamic queries
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
          console.log('🔒 No authenticated user found');
          setUser(null);
          setTeacher(null);
          setLoading(false);
          return;
        }

        console.log('👤 User authenticated:', user.email);
        setUser(user);

        // Check if user has teacher role
        try {
          const tokenResult = await user.getIdTokenResult();
          console.log('🔑 User claims:', tokenResult.claims);
          
          if (!tokenResult.claims.teacher && tokenResult.claims.role !== 'teacher') {
            console.warn('❌ User does not have teacher role claims');
            setError('Access denied. This account is not authorized as a teacher. Please contact your administrator.');
            setUser(null);
            setTeacher(null);
            setLoading(false);
            return;
          }
        } catch (claimsError) {
          console.error('❌ Error checking user claims:', claimsError);
          setError('Unable to verify teacher permissions. Please try logging in again.');
          setUser(null);
          setTeacher(null);
          setLoading(false);
          return;
        }

        console.log('✅ Teacher role verified, fetching profile...');

        // Fetch teacher profile from Firestore
        try {
          const teacherDoc = await getDoc(doc(firestore, 'teachers', user.uid));
          
          if (teacherDoc.exists()) {
            const teacherData = teacherDoc.data();
            console.log('📋 Teacher profile found:', teacherData.name);
            
            setTeacher({
              id: teacherDoc.id,
              name: teacherData.name || 'Unknown Teacher',
              email: teacherData.email || user.email,
              subjects: teacherData.subjects || [],
              classesAssigned: teacherData.classesAssigned, // Keep if present, undefined if not
              studentsCount: teacherData.studentsCount || 0,
              avatar: teacherData.avatar || (teacherData.name ? teacherData.name.charAt(0).toUpperCase() : 'T'),
              status: teacherData.status || 'active',
              qualifications: teacherData.qualifications,
              bio: teacherData.bio,
              phone: teacherData.phone,
              countryCode: teacherData.countryCode,
              address: teacherData.address,
              profileImageUrl: teacherData.profileImageUrl,
              hireDate: teacherData.hireDate,
            });
          } else {
            console.warn('❌ Teacher profile not found in Firestore for UID:', user.uid);
            setError('Teacher profile not found. Please contact your administrator to set up your account.');
          }
        } catch (firestoreError) {
          console.error('❌ Error fetching teacher profile:', firestoreError);
          setError('Unable to load teacher profile. Please check your connection and try again.');
        }
      } catch (err) {
        console.error('❌ General error in teacher auth:', err);
        setError('Authentication failed. Please try logging in again.');
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
          classesAssigned: teacherData.classesAssigned, // Keep if present, undefined if not
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
