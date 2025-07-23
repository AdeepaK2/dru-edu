import { useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, User } from 'firebase/auth';
import { auth } from '@/utils/firebase-client';
import { StudentDocument } from '@/models/studentSchema';

interface AuthState {
  user: User | null;
  student: StudentDocument | null;
  loading: boolean;
  error: string | null;
}

export const useStudentAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    student: null,
    loading: true,
    error: null,
  });

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        setAuthState(prev => ({ ...prev, loading: true, error: null }));

        if (user) {
          // Get ID token and verify student status
          const idToken = await user.getIdToken();
          
          // Call our auth API to verify student status and get data
          const response = await fetch('/api/student/auth', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ idToken }),
          });

          if (response.ok) {
            const data = await response.json();
            setAuthState({
              user,
              student: data.student,
              loading: false,
              error: null,
            });
            
            // Store token in localStorage for API calls
            localStorage.setItem('authToken', idToken);
          } else {
            // User exists but not a valid student
            await signOut(auth);
            setAuthState({
              user: null,
              student: null,
              loading: false,
              error: 'Invalid student account',
            });
          }
        } else {
          // No user logged in
          setAuthState({
            user: null,
            student: null,
            loading: false,
            error: null,
          });
        }
      } catch (error) {
        console.error('Auth state change error:', error);
        setAuthState({
          user: null,
          student: null,
          loading: false,
          error: 'Authentication error occurred',
        });
      }
    });

    return () => unsubscribe();
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));

      // Use Firebase Auth directly for authentication
      await signInWithEmailAndPassword(auth, email, password);
      
      // Auth state will be updated by the onAuthStateChanged listener
      // which will verify the student status
      return { success: true, message: 'Login successful' };
      
    } catch (error: any) {
      let errorMessage = 'Login failed';
      
      // Handle specific Firebase Auth errors
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        errorMessage = 'Invalid email or password';
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = 'Account has been disabled';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setAuthState(prev => ({ ...prev, loading: false, error: errorMessage }));
      return { success: false, error: errorMessage };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await signOut(auth);
      // Auth state will be cleared by the onAuthStateChanged listener
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Check if user is authenticated student
  const isAuthenticated = !!authState.user && !!authState.student;

  return {
    ...authState,
    isAuthenticated,
    login,
    logout,
  };
};
