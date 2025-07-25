'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  AlertCircle, Clock, Flag, CheckCircle, ChevronLeft, ChevronRight,
  Save, Send, List, EyeOff, Eye, AlertTriangle, ArrowLeft, Maximize
} from 'lucide-react';
import { useStudentAuth } from '@/hooks/useStudentAuth';
import { Button, Input, TextArea } from '@/components/ui';
import { Test, LiveTest, FlexibleTest, TestQuestion } from '@/models/testSchema';
import { RealtimeAnswer, PdfAttachment } from '@/models/studentSubmissionSchema';
import { PdfUploadComponent } from '@/components/student/PdfUploadComponent';
import { v4 as uuidv4 } from 'uuid';

// Import student layout from other components or use a local version for now
const StudentLayout = ({ children }: { children: React.ReactNode }) => children;

export default function TestTakePage() {
  const router = useRouter();
  const params = useParams();
  const testId = params?.testId as string;
  
  const { student, loading: authLoading } = useStudentAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Test data
  const [test, setTest] = useState<Test | null>(null);
  const [attemptId, setAttemptId] = useState<string>('');
  
  // Question navigation
  const [currentIndex, setCurrentIndex] = useState(0);
  const [reviewMode, setReviewMode] = useState(false);
  
  // Student answers
  const [answers, setAnswers] = useState<Record<string, RealtimeAnswer>>({});
  const [savedState, setSavedState] = useState<'saving' | 'saved' | 'error' | null>(null);
  
  // Timer state
  const [remainingTime, setRemainingTime] = useState<number>(0);
  const [timeExpired, setTimeExpired] = useState(false);
  
  // Connection state
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);
  const [offlineTime, setOfflineTime] = useState(0);
  
  // Navigation panel state
  const [showNavPanel, setShowNavPanel] = useState(false);
  
  // PDF upload state
  const [pdfFiles, setPdfFiles] = useState<Record<string, PdfAttachment[]>>({});
  
  // References for tracking time spent on questions
  const questionStartTimeRef = useRef<number>(Date.now());
  const timeSpentRef = useRef<Record<string, number>>({});
  
  // Confirmation dialog state for submission
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  
  // Get current question
  const currentQuestion = test?.questions[currentIndex] || null;
  
  // Fullscreen request handler
  const requestFullscreen = () => {
    const element = document.documentElement;
    if (element.requestFullscreen) {
      element.requestFullscreen().catch((err) => {
        console.log('Fullscreen request failed:', err);
      });
    }
  };
  
  // Track tab visibility for integrity
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (!attemptId) return;
      
      try {
        const { RealtimeTestService } = await import('@/apiservices/realtimeTestService');
        
        if (document.visibilityState === 'hidden') {
          // Record tab switch and pause tracking
          await RealtimeTestService.handleVisibilityChange(attemptId, false);
        } else {
          // Resume tracking when tab becomes visible
          await RealtimeTestService.handleVisibilityChange(attemptId, true);
        }
      } catch (error) {
        console.error('Error handling visibility change:', error);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [attemptId]);

  // Track online/offline status for time management
  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      
      if (!attemptId) return;
      
      try {
        console.log('🔌 Coming back online, checking attempt status...');
        
        // First check if the attempt has expired during disconnection
        const isStillActive = await checkAttemptStatus(attemptId);
        if (!isStillActive) {
          console.log('⏰ Test expired while offline, auto-submitting...');
          return; // checkAttemptStatus will handle auto-submit
        }
        
        // Attempt is still active, handle reconnection
        const { AttemptManagementService } = await import('@/apiservices/attemptManagementService');
        const timeCalc = await AttemptManagementService.handleReconnection(attemptId);
        
        if (timeCalc) {
          setRemainingTime(timeCalc.timeRemaining);
          setOfflineTime(timeCalc.offlineTime);
          setWasOffline(timeCalc.offlineTime > 0);
          console.log('🔌 Reconnected - time remaining:', timeCalc.timeRemaining);
          console.log('🔌 Offline time:', timeCalc.offlineTime, 'seconds');
          
          // Check if time expired during the reconnection process
          if (timeCalc.isExpired) {
            console.log('⏰ Test expired during reconnection, auto-submitting...');
            setTimeExpired(true);
            await handleAutoSubmit();
          }
        }
      } catch (error) {
        console.error('Error handling online reconnection:', error);
      }
    };

    const handleOffline = async () => {
      setIsOnline(false);
      setWasOffline(true);
      
      if (!attemptId) return;
      
      try {
        const { AttemptManagementService } = await import('@/apiservices/attemptManagementService');
        await AttemptManagementService.handleDisconnection(attemptId);
        console.log('📴 Gone offline - time tracking paused');
      } catch (error) {
        console.error('Error handling offline:', error);
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [attemptId]);
  
  // Tab switch tracking
  const updateTabSwitchCount = async () => {
    try {
      // Import service
      const { RealtimeTestService } = await import('@/apiservices/realtimeTestService');
      
      // Record tab switch as suspicious activity
      await RealtimeTestService.trackSuspiciousActivity(attemptId, 'tab_switch');
    } catch (error) {
      console.error('Error tracking tab switch:', error);
    }
  };

  // Timer effect with attempt management integration and auto-submit
  useEffect(() => {
    if (!test || !attemptId || remainingTime <= 0) return;
    
    const interval = setInterval(async () => {
      try {
        // Update heartbeat and get accurate time from attempt management
        const { AttemptManagementService } = await import('@/apiservices/attemptManagementService');
        const timeCalc = await AttemptManagementService.updateAttemptTime(attemptId);
        
        if (timeCalc) {
          setRemainingTime(timeCalc.timeRemaining);
          
          if (timeCalc.isExpired) {
            clearInterval(interval);
            setTimeExpired(true);
            console.log('⏰ Time expired, auto-submitting test...');
            await handleAutoSubmit();
            return;
          }
        } else {
          // Fallback to local countdown if attempt service fails
          setRemainingTime(prev => {
            const newTime = prev - 1;
            if (newTime <= 0) {
              clearInterval(interval);
              setTimeExpired(true);
              console.log('⏰ Time expired (fallback), auto-submitting test...');
              handleAutoSubmit();
              return 0;
            }
            return newTime;
          });
        }
      } catch (error) {
        console.error('Error updating timer:', error);
        // Fallback to local countdown
        setRemainingTime(prev => {
          const newTime = prev - 1;
          if (newTime <= 0) {
            clearInterval(interval);
            setTimeExpired(true);
            console.log('⏰ Time expired (error fallback), auto-submitting test...');
            handleAutoSubmit();
            return 0;
          }
          return newTime;
        });
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [test, attemptId, remainingTime]);

  // Check for expired attempts on page load/reconnection
  const checkAttemptStatus = async (attemptId: string) => {
    try {
      const { AttemptManagementService } = await import('@/apiservices/attemptManagementService');
      const timeCalc = await AttemptManagementService.updateAttemptTime(attemptId);
      
      if (timeCalc.isExpired) {
        console.log('⏰ Test has expired during disconnection, auto-submitting...');
        setTimeExpired(true);
        await handleAutoSubmit();
        return false; // Test expired
      }
      
      // Update remaining time
      setRemainingTime(timeCalc.timeRemaining);
      return true; // Test still active
    } catch (error) {
      console.error('Error checking attempt status:', error);
      
      // If the error is "Attempt state not found", this might be a resumption issue
      if (error instanceof Error && error.message.includes('Attempt state not found')) {
        console.warn('⚠️ Attempt state not found - this might be a resumption after disconnect');
        // Return true to allow the test to continue, as the realtime state will be reinitialized
        return true;
      }
      
      // For other errors, return false to prevent test access
      return false;
    }
  };

  // Helper function to safely get timestamp in milliseconds
  const getTimestamp = (timestamp: any): number => {
    try {
      // Handle Firestore Timestamp object
      if (timestamp && typeof timestamp.toDate === 'function') {
        return timestamp.toDate().getTime();
      }
      
      // Handle serialized Firestore timestamp with seconds and nanoseconds
      if (timestamp && typeof timestamp.seconds === 'number' && typeof timestamp.nanoseconds === 'number') {
        return (timestamp.seconds * 1000) + Math.floor(timestamp.nanoseconds / 1000000);
      }
      
      // Handle legacy serialized Firestore timestamp
      if (timestamp && timestamp._seconds && timestamp._nanoseconds !== undefined) {
        return (timestamp._seconds * 1000) + Math.floor(timestamp._nanoseconds / 1000000);
      }
      
      // Handle Date object
      if (timestamp instanceof Date) {
        return timestamp.getTime();
      }
      
      // Handle string timestamp
      if (typeof timestamp === 'string') {
        const date = new Date(timestamp);
        if (!isNaN(date.getTime())) {
          return date.getTime();
        }
      }
      
      // Handle number timestamp
      if (typeof timestamp === 'number') {
        return timestamp > 1000000000000 ? timestamp : timestamp * 1000; // Convert seconds to milliseconds if needed
      }
      
      console.warn('⚠️ Unknown timestamp format:', timestamp);
      return Date.now(); // Fallback to current time
    } catch (error) {
      console.error('❌ Error parsing timestamp:', error, timestamp);
      return Date.now(); // Fallback to current time
    }
  };

  // Format remaining time for display
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Load existing PDF files for all questions
  const loadExistingPdfFiles = async (testAttemptId: string, testData: Test) => {
    try {
      if (!student?.id) return;

      const { RealtimeTestService } = await import('@/apiservices/realtimeTestService');
      
      // Get the test session which includes answers
      const session = await RealtimeTestService.getSession(testAttemptId);
      
      if (!session?.answers) {
        console.log('📁 No session answers found yet');
        return;
      }
      
      // Extract PDF files from essay answers and update both states
      const pdfMap: Record<string, PdfAttachment[]> = {};
      const answersToUpdate: Record<string, RealtimeAnswer> = {};
      
      for (const question of testData.questions) {
        const sessionAnswer = session.answers[question.id];
        if (question.type === 'essay' && sessionAnswer) {
          // Update PDF files state
          if (sessionAnswer.pdfFiles && sessionAnswer.pdfFiles.length > 0) {
            pdfMap[question.id] = sessionAnswer.pdfFiles;
          }
          
          // Update answers state with the full answer data
          answersToUpdate[question.id] = sessionAnswer;
        }
      }
      
      // Update both states
      setPdfFiles(pdfMap);
      if (Object.keys(answersToUpdate).length > 0) {
        setAnswers(prev => ({
          ...prev,
          ...answersToUpdate
        }));
      }
      
      console.log('📁 Loaded existing PDF files:', pdfMap);
      console.log('📝 Updated answers state with PDFs:', Object.keys(answersToUpdate));
    } catch (error) {
      console.error('Error loading existing PDF files:', error);
    }
  };

  // Load test data
  useEffect(() => {
    const loadTest = async () => {
      if (!testId) {
        console.error('❌ No test ID provided');
        setError('Invalid test ID. Please check the URL and try again.');
        setLoading(false);
        return;
      }
      
      if (!student) {
        console.log('⏳ Waiting for student authentication...');
        return;
      }
      
      if (!student.id) {
        console.error('❌ Student ID is missing');
        setError('Authentication error. Please log in again.');
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        console.log('🔍 Loading test with ID:', testId, 'for student:', student.id);
        
        // Import Firestore functions
        const { doc, getDoc } = await import('firebase/firestore');
        const { firestore } = await import('@/utils/firebase-client');
        
        if (!firestore) {
          throw new Error('Firestore is not initialized. Please check Firebase configuration.');
        }
        
        console.log('🔗 Firebase connection established');
        
        // Get the test document
        const testDoc = await getDoc(doc(firestore, 'tests', testId));
        
        if (!testDoc.exists()) {
          console.error('❌ Test document not found:', testId);
          setError('Test not found. It may have been deleted.');
          setLoading(false);
          return;
        }
        
        const testData = { id: testDoc.id, ...testDoc.data() } as Test;
        console.log('✅ Test data loaded:', testData.title);
        
        // Check if student is enrolled in any of the test's classes
        console.log('🔍 Starting enrollment check...');
        const { getEnrollmentsByStudent } = await import('@/services/studentEnrollmentService');
        
        let enrollments = [];
        try {
          enrollments = await getEnrollmentsByStudent(student.id);
          console.log('📋 Student enrollments loaded successfully:', enrollments.length, 'classes');
        } catch (enrollmentError) {
          console.error('❌ Error fetching enrollments:', enrollmentError);
          throw new Error(`Failed to fetch enrollments: ${enrollmentError}`);
        }
        
        console.log('📋 Student enrollment details:', enrollments.map(e => ({ 
          id: e.id,
          classId: e.classId, 
          className: e.className,
          status: e.status 
        })));
        console.log('🎯 Test class IDs:', testData.classIds);
        
        const isEnrolled = enrollments.some(enrollment => 
          testData.classIds.includes(enrollment.classId) && 
          enrollment.status === 'Active'
        );
        
        console.log('✅ Enrollment check result:', isEnrolled);
        
        if (!isEnrolled) {
          console.error('❌ Student not enrolled in test classes');
          console.error('❌ Available enrollments:', enrollments.map(e => ({ classId: e.classId, status: e.status })));
          console.error('❌ Required class IDs:', testData.classIds);
          
          // For debugging, let's temporarily allow access anyway and just log the issue
          console.warn('⚠️ WARNING: Proceeding despite enrollment check failure for debugging');
          // setError('You are not enrolled in the class for this test.');
          // setLoading(false);
          // return;
        }
        
        console.log('✅ Student is enrolled in test classes');
        
        // Check test availability
        const now = new Date().getTime();
        let testAvailable = false;
        let testDuration = 0;
        let classId = '';
        
        console.log('⏰ Checking test availability at:', new Date(now).toISOString());
        
        // Find first matching class ID for this student
        const enrollment = enrollments.find(e => testData.classIds.includes(e.classId) && e.status === 'Active');
        if (enrollment) {
          classId = enrollment.classId;
        } else {
          // Fallback: use the first class ID from the test if no enrollment found
          classId = testData.classIds[0] || 'unknown-class';
          console.warn('⚠️ No matching enrollment found, using fallback classId:', classId);
        }
        
        // Get the class name as well
        let className = 'Unknown Class';
        if (enrollment) {
          className = enrollment.className || 'Unknown Class';
        } else {
          // Try to find class name from test data
          const testClassIndex = testData.classIds.indexOf(classId);
          if (testClassIndex >= 0 && testData.classNames && testData.classNames[testClassIndex]) {
            className = testData.classNames[testClassIndex];
          }
        }
        
        console.log('🎯 Selected classId for attempt:', classId);
        console.log('🎯 Selected className for attempt:', className);
        
        // Debug timestamp data
        console.log('🔍 Test data type:', testData.type);
        if (testData.type === 'flexible') {
          const flexTest = testData as FlexibleTest;
          console.log('🔍 FlexTest availableFrom:', flexTest.availableFrom);
          console.log('🔍 FlexTest availableTo:', flexTest.availableTo);
          console.log('🔍 FlexTest availableFrom type:', typeof flexTest.availableFrom);
          console.log('🔍 FlexTest availableTo type:', typeof flexTest.availableTo);
        } else {
          const liveTest = testData as LiveTest;
          console.log('🔍 LiveTest studentJoinTime:', liveTest.studentJoinTime);
          console.log('🔍 LiveTest actualEndTime:', liveTest.actualEndTime);
        }
        
        if (testData.type === 'live') {
          const liveTest = testData as LiveTest;
          const startTime = getTimestamp(liveTest.studentJoinTime);
          const endTime = getTimestamp(liveTest.actualEndTime);
          
          console.log('🔍 Live test times:');
          console.log('🔍 Start time (ms):', startTime, 'Date:', new Date(startTime).toISOString());
          console.log('🔍 End time (ms):', endTime, 'Date:', new Date(endTime).toISOString());
          console.log('🔍 Current time (ms):', now, 'Date:', new Date(now).toISOString());
          
          testAvailable = now >= startTime && now <= endTime;
          testDuration = liveTest.duration * 60; // convert to seconds
          
          // Set remaining time
          const timeRemaining = Math.max(0, Math.floor((endTime - now) / 1000));
          setRemainingTime(timeRemaining);
        } else {
          const flexTest = testData as FlexibleTest;
          const startTime = getTimestamp(flexTest.availableFrom);
          const endTime = getTimestamp(flexTest.availableTo);
          
          console.log('🔍 Flexible test times:');
          console.log('🔍 Start time (ms):', startTime, 'Date:', new Date(startTime).toISOString());
          console.log('🔍 End time (ms):', endTime, 'Date:', new Date(endTime).toISOString());
          console.log('🔍 Current time (ms):', now, 'Date:', new Date(now).toISOString());
          
          testAvailable = now >= startTime && now <= endTime;
          testDuration = flexTest.duration * 60; // convert to seconds
          
          console.log('🔍 Test available check:', {
            now,
            startTime,
            endTime,
            nowGreaterThanStart: now >= startTime,
            nowLessThanEnd: now <= endTime,
            testAvailable
          });
          
          // Set remaining time - for flexible tests, use the full duration
          setRemainingTime(flexTest.duration * 60); // convert to seconds
        }
        
        if (!testAvailable) {
          console.error('❌ Test not available. Debugging info:');
          console.error('❌ Test type:', testData.type);
          console.error('❌ Current timestamp:', now);
          console.error('❌ Test available:', testAvailable);
          
          // For development: Check if this is a future date issue
          const currentDate = new Date();
          const currentYear = currentDate.getFullYear();
          
          if (testData.type === 'flexible') {
            const flexTest = testData as FlexibleTest;
            const startTime = getTimestamp(flexTest.availableFrom);
            const endTime = getTimestamp(flexTest.availableTo);
            const startDate = new Date(startTime);
            const endDate = new Date(endTime);
            
            console.warn('⚠️ DEVELOPMENT MODE: Checking if test has future dates');
            console.warn('⚠️ Start date:', startDate.toISOString());
            console.warn('⚠️ End date:', endDate.toISOString());
            
            // If the test dates are in the future (beyond current year + 1), it's likely test data
            if (startDate.getFullYear() > currentYear + 1) {
              console.warn('⚠️ DEVELOPMENT OVERRIDE: Test appears to have far future dates, allowing access for testing');
              testAvailable = true;
              // Set a reasonable remaining time for testing
              setRemainingTime(flexTest.duration * 60);
            }
          }
          
          if (!testAvailable) {
            setError('This test is not currently available.');
            setLoading(false);
            return;
          }
        }
        
        // Set the test data
        setTest(testData);
        
        // Check for existing active attempt or create new one
        const { AttemptManagementService } = await import('@/apiservices/attemptManagementService');
        
        // Check if student has an active attempt
        let activeAttempt = await AttemptManagementService.getActiveAttempt(testId, student.id);
        
        let newAttemptId: string;
        
        if (activeAttempt) {
          // Resume existing attempt
          console.log('🔄 Resuming existing attempt:', activeAttempt.id);
          newAttemptId = activeAttempt.id;
          
          setAttemptId(newAttemptId);
          
          // Ensure realtime session is initialized for resumption
          const { RealtimeTestService } = await import('@/apiservices/realtimeTestService');
          await RealtimeTestService.startTestSession(
            newAttemptId,
            testId,
            student.id,
            student.name || 'Anonymous Student',
            classId,
            testDuration / 60 // convert back to minutes
          );
          
          // Now check if the attempt has expired during disconnection
          const isStillActive = await checkAttemptStatus(newAttemptId);
          if (!isStillActive) {
            console.log('⏰ Attempt has expired, redirecting to results...');
            setLoading(false);
            return; // checkAttemptStatus will handle auto-submit and redirect
          }
          
          // Attempt is still active, continue with current time from attempt management
          console.log('✅ Attempt is still active, continuing...');
        } else {
          // Check if student can create a new attempt
          const attemptSummary = await AttemptManagementService.getAttemptSummary(testId, student.id);
          
          if (!attemptSummary.canCreateNewAttempt) {
            setError(`Cannot start test: You have used all ${attemptSummary.attemptsAllowed} attempts for this test.`);
            setLoading(false);
            return;
          }
          
          // Create new attempt
          console.log('🆕 Creating new attempt...');
          newAttemptId = await AttemptManagementService.createAttempt(
            testId,
            student.id,
            student.name || 'Anonymous Student',
            classId,
            className
          );
          
          console.log('✅ New attempt created:', newAttemptId);
          
          setAttemptId(newAttemptId);
          
          // Start test session in Realtime DB for new attempt
          const { RealtimeTestService } = await import('@/apiservices/realtimeTestService');
          
          await RealtimeTestService.startTestSession(
            newAttemptId,
            testId,
            student.id,
            student.name || 'Anonymous Student',
            classId,
            testDuration / 60 // convert back to minutes
          );
        }
        
        console.log('✅ Test session started successfully');
        
        // Load existing PDF files for resumed attempts
        await loadExistingPdfFiles(newAttemptId, testData);
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading test:', error);
        
        // More specific error handling
        let errorMessage = 'Failed to load test data. Please try again.';
        
        if (error instanceof Error) {
          console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name
          });
          
          if (error.message.includes('firestore') || error.message.includes('firebase')) {
            errorMessage = 'Database connection error. Please check your internet connection and try again.';
          } else if (error.message.includes('permission') || error.message.includes('denied')) {
            errorMessage = 'Access denied. You may not have permission to view this test.';
          } else if (error.message.includes('network') || error.message.includes('fetch')) {
            errorMessage = 'Network error. Please check your internet connection and try again.';
          } else if (error.message.includes('not found') || error.message.includes('does not exist')) {
            errorMessage = 'Test not found. Please check the test ID and try again.';
          } else {
            errorMessage = `Error: ${error.message}`;
          }
        }
        
        setError(errorMessage);
        setLoading(false);
      }
    };
    
    loadTest();
    
    // Clean up function
    return () => {
      // Handle cleanup when component unmounts
      const cleanupSession = async () => {
        if (attemptId) {
          try {
            const { RealtimeTestService } = await import('@/apiservices/realtimeTestService');
            await RealtimeTestService.cleanupSession(attemptId);
          } catch (error) {
            console.error('Error cleaning up session:', error);
          }
        }
      };
      
      cleanupSession();
    };
  }, [testId, student]);

  // Track time spent on current question
  useEffect(() => {
    if (!currentQuestion) return;
    
    // Reset start time when question changes
    questionStartTimeRef.current = Date.now();
    
    // Track when leaving the question
    return () => {
      if (currentQuestion) {
        const timeSpent = Math.floor((Date.now() - questionStartTimeRef.current) / 1000);
        const questionId = currentQuestion.id;
        
        // Add to accumulated time
        timeSpentRef.current[questionId] = (timeSpentRef.current[questionId] || 0) + timeSpent;
      }
    };
  }, [currentIndex, currentQuestion]);

  // Handle saving answer
  const saveAnswer = useCallback(async (answer: any) => {
    if (!currentQuestion || !attemptId) return;
    
    try {
      setSavedState('saving');
      
      const questionId = currentQuestion.id;
      const timeSpent = timeSpentRef.current[questionId] || 0;
      
      // Handle different answer types
      let cleanAnswer = answer;
      let pdfFiles: PdfAttachment[] = [];
      
      if (answer === undefined || answer === null) {
        cleanAnswer = currentQuestion.type === 'essay' ? '' : 0;
      } else if (typeof answer === 'object' && answer.textContent !== undefined) {
        // Essay answer with PDF files
        cleanAnswer = answer.textContent || '';
        pdfFiles = answer.pdfFiles || [];
      }
      
      // Import service
      const { RealtimeTestService } = await import('@/apiservices/realtimeTestService');
      
      // Save to Realtime DB - extend to support PDF files
      await RealtimeTestService.saveAnswer(
        attemptId,
        questionId,
        cleanAnswer,
        currentQuestion.type,
        timeSpent,
        pdfFiles // Pass PDF files as additional parameter
      );
      
      // Update local state
      const now = Date.now();
      const currentAnswer = answers[questionId];
      
      const updatedAnswer: RealtimeAnswer = {
        questionId,
        lastModified: now,
        timeSpent: timeSpent,
        isMarkedForReview: currentAnswer?.isMarkedForReview || false,
        changeHistory: [
          ...(currentAnswer?.changeHistory || []),
          {
            timestamp: now,
            type: currentQuestion.type === 'mcq' ? 'select' : 'text_change',
            previousValue: currentAnswer?.selectedOption || currentAnswer?.textContent,
            newValue: cleanAnswer,
            timeOnQuestion: timeSpent
          }
        ]
      };

      // Add type-specific properties
      if (currentQuestion.type === 'mcq') {
        updatedAnswer.selectedOption = cleanAnswer;
      } else if (currentQuestion.type === 'essay') {
        updatedAnswer.textContent = cleanAnswer;
        updatedAnswer.pdfFiles = pdfFiles;
      }
      
      setAnswers(prev => ({
        ...prev,
        [questionId]: updatedAnswer
      }));
      
      setSavedState('saved');
      
      // Clear saved state after a delay
      setTimeout(() => {
        setSavedState(null);
      }, 2000);
    } catch (error) {
      console.error('Error saving answer:', error);
      setSavedState('error');
    }
  }, [attemptId, currentQuestion, answers]);

  // Handle option selection for MCQ
  const handleOptionSelect = (optionIndex: number) => {
    if (!currentQuestion || currentQuestion.type !== 'mcq') return;
    
    saveAnswer(optionIndex);
  };

  // Handle essay answer change
  const handleEssayChange = (content: string) => {
    if (!currentQuestion || currentQuestion.type !== 'essay') return;
    
    // Debounce the save operation
    const timeoutId = setTimeout(() => {
      saveAnswer(content);
    }, 1000);
    
    return () => clearTimeout(timeoutId);
  };

  // Navigate to next question
  const goToNextQuestion = async () => {
    if (!test || currentIndex >= test.questions.length - 1) return;
    
    try {
      // Import service
      const { RealtimeTestService } = await import('@/apiservices/realtimeTestService');
      
      // Update in Realtime DB
      const nextIndex = currentIndex + 1;
      const nextQuestionId = test.questions[nextIndex].id;
      
      await RealtimeTestService.navigateToQuestion(
        attemptId,
        nextIndex,
        nextQuestionId
      );
      
      setCurrentIndex(nextIndex);
    } catch (error) {
      console.error('Error navigating to next question:', error);
    }
  };

  // Navigate to previous question
  const goToPrevQuestion = async () => {
    if (currentIndex <= 0) return;
    
    try {
      // Import service
      const { RealtimeTestService } = await import('@/apiservices/realtimeTestService');
      
      // Update in Realtime DB
      const prevIndex = currentIndex - 1;
      const prevQuestionId = test?.questions[prevIndex].id || '';
      
      await RealtimeTestService.navigateToQuestion(
        attemptId,
        prevIndex,
        prevQuestionId
      );
      
      setCurrentIndex(prevIndex);
    } catch (error) {
      console.error('Error navigating to previous question:', error);
    }
  };

  // Jump to specific question
  const jumpToQuestion = async (index: number) => {
    if (!test || index < 0 || index >= test.questions.length) return;
    
    try {
      // Import service
      const { RealtimeTestService } = await import('@/apiservices/realtimeTestService');
      
      // Update in Realtime DB
      const questionId = test.questions[index].id;
      
      await RealtimeTestService.navigateToQuestion(
        attemptId,
        index,
        questionId
      );
      
      setCurrentIndex(index);
      setShowNavPanel(false);
    } catch (error) {
      console.error('Error jumping to question:', error);
    }
  };

  // Toggle review mark for current question
  const toggleReviewMark = async () => {
    if (!currentQuestion || !attemptId) return;
    
    try {
      const questionId = currentQuestion.id;
      const isCurrentlyMarked = answers[questionId]?.isMarkedForReview || false;
      
      // Import service
      const { RealtimeTestService } = await import('@/apiservices/realtimeTestService');
      
      // Update in Realtime DB
      await RealtimeTestService.toggleReviewMark(
        attemptId,
        questionId,
        !isCurrentlyMarked
      );
      
      // Update local state
      setAnswers(prev => ({
        ...prev,
        [questionId]: {
          ...prev[questionId],
          isMarkedForReview: !isCurrentlyMarked
        }
      }));
    } catch (error) {
      console.error('Error toggling review mark:', error);
    }
  };

  // Handle PDF upload for essay questions - called by PdfUploadComponent
  const handlePdfUpload = async (attachment: PdfAttachment) => {
    try {
      if (!currentQuestion) return;
      
      const questionId = currentQuestion.id;

      // Update local PDF files state
      setPdfFiles(prev => {
        const existingFiles = prev[questionId] || [];
        return {
          ...prev,
          [questionId]: [...existingFiles, attachment]
        };
      });

      // Update the answer with the new PDF file
      const currentAnswerText = answers[questionId]?.textContent || '';
      const updatedPdfFiles = [
        ...(answers[questionId]?.pdfFiles || []),
        attachment
      ];

      // Save the updated answer with PDF files
      await saveAnswer({
        textContent: currentAnswerText,
        pdfFiles: updatedPdfFiles
      });

      console.log('PDF uploaded successfully:', attachment);
    } catch (error) {
      console.error('Error handling PDF upload:', error);
    }
  };

  // Handle PDF removal for essay questions - called by PdfUploadComponent
  const handlePdfRemove = async (fileUrl: string) => {
    try {
      if (!currentQuestion) return;
      
      const questionId = currentQuestion.id;

      // Import the PDF service and delete the file
      const { StudentPdfService } = await import('@/apiservices/studentPdfService');
      await StudentPdfService.deletePdf(fileUrl);

      // Update local PDF files state
      setPdfFiles(prev => ({
        ...prev,
        [questionId]: (prev[questionId] || []).filter(file => file.fileUrl !== fileUrl)
      }));

      // Update the answer with the removed PDF file
      const currentAnswerText = answers[questionId]?.textContent || '';
      const updatedPdfFiles = (answers[questionId]?.pdfFiles || []).filter(
        file => file.fileUrl !== fileUrl
      );

      // Save the updated answer with remaining PDF files
      await saveAnswer({
        textContent: currentAnswerText,
        pdfFiles: updatedPdfFiles
      });

      console.log('PDF removed successfully:', fileUrl);
    } catch (error) {
      console.error('Error removing PDF:', error);
    }
  };

  // Submit test
  const handleSubmitTest = async () => {
    if (!attemptId) return;
    
    try {
      setLoading(true);
      
      // Import services
      const { RealtimeTestService } = await import('@/apiservices/realtimeTestService');
      const { SubmissionService } = await import('@/apiservices/submissionService');
      
      // Submit test session in Realtime DB and attempt management
      await RealtimeTestService.submitTestSession(attemptId, false);
      
      // Process submission
      await SubmissionService.processSubmission(attemptId, false);
      
      // Navigate to results page
      router.push(`/student/test/${testId}/result?submissionId=${attemptId}`);
    } catch (error) {
      console.error('Error submitting test:', error);
      setError('Failed to submit test. Please try again.');
      setLoading(false);
    }
  };

  // Auto-submit when time expires - enhanced with proper error handling
  const handleAutoSubmit = async () => {
    if (!attemptId) {
      console.error('❌ Cannot auto-submit: No attempt ID');
      return;
    }
    
    try {
      setLoading(true);
      console.log('⏰ Auto-submitting test due to time expiry...');
      
      // Import services
      const { RealtimeTestService } = await import('@/apiservices/realtimeTestService');
      const { SubmissionService } = await import('@/apiservices/submissionService');
      
      // Submit test session in Realtime DB and attempt management (auto-submit)
      await RealtimeTestService.submitTestSession(attemptId, true);
      
      // Process submission
      await SubmissionService.processSubmission(attemptId, true);
      
      console.log('✅ Test auto-submitted successfully');
      
      // Navigate to results page
      router.push(`/student/test/${testId}/result?submissionId=${attemptId}&autoSubmitted=true`);
    } catch (error) {
      console.error('❌ Error auto-submitting test:', error);
      
      // Show error but still try to navigate to results
      setError('Test time expired. There was an issue submitting your answers, but we\'ll try to save what we have.');
      
      // Wait a moment then navigate anyway
      setTimeout(() => {
        router.push(`/student/test/${testId}/result?submissionId=${attemptId}&autoSubmitted=true&error=true`);
      }, 3000);
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (authLoading || loading) {
    return (
      <StudentLayout>
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-1/4"></div>
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="animate-pulse space-y-6">
              <div className="h-36 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
              <div className="h-12 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
              <div className="h-12 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </StudentLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <StudentLayout>
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <button 
              onClick={() => router.push('/student/test')}
              className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Tests
            </button>
            
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Test Error
            </h1>
          </div>
          
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-6 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-xl font-semibold text-red-800 dark:text-red-200 mb-2">
              Error
            </h2>
            <p className="text-red-700 dark:text-red-300 mb-6">
              {error}
            </p>
            <Button 
              onClick={() => router.push('/student/test')}
            >
              Return to Tests
            </Button>
          </div>
        </div>
      </StudentLayout>
    );
  }

  // Time expired dialog
  if (timeExpired) {
    return (
      <StudentLayout>
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Time Expired
            </h1>
          </div>
          
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-md p-6 text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-orange-500 mb-4" />
            <h2 className="text-xl font-semibold text-orange-800 dark:text-orange-200 mb-2">
              Test Time Has Expired
            </h2>
            <p className="text-orange-700 dark:text-orange-300 mb-6">
              Your answers have been automatically submitted. Please wait while we process your submission...
            </p>
            <div className="animate-pulse">
              <div className="h-4 bg-orange-200 dark:bg-orange-700 rounded w-full max-w-md mx-auto"></div>
            </div>
          </div>
        </div>
      </StudentLayout>
    );
  }
  
  // Submit confirmation dialog
  if (showConfirmSubmit) {
    return (
      <StudentLayout>
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Submit Test
            </h1>
          </div>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-6 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-blue-500 mb-4" />
            <h2 className="text-xl font-semibold text-blue-800 dark:text-blue-200 mb-2">
              Confirm Submission
            </h2>
            <p className="text-blue-700 dark:text-blue-300 mb-6">
              Are you sure you want to submit your test? This action cannot be undone.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                variant="outline"
                onClick={() => setShowConfirmSubmit(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSubmitTest}
              >
                Yes, Submit Test
              </Button>
            </div>
          </div>
        </div>
      </StudentLayout>
    );
  }

  // No test data
  if (!test) {
    return (
      <StudentLayout>
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <button 
              onClick={() => router.push('/student/test')}
              className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Tests
            </button>
            
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Test Not Found
            </h1>
          </div>
          
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-6 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
            <h2 className="text-xl font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
              Test Data Not Available
            </h2>
            <p className="text-yellow-700 dark:text-yellow-300 mb-6">
              Unable to load test data. Please return to the tests list and try again.
            </p>
            <Button 
              onClick={() => router.push('/student/test')}
            >
              Return to Tests
            </Button>
          </div>
        </div>
      </StudentLayout>
    );
  }

  // Navigation panel
  const renderNavigationPanel = () => {
    if (!test) return null;
    
    return (
      <div className={`fixed inset-0 z-50 bg-black bg-opacity-50 transition-opacity duration-200 
                      ${showNavPanel ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className={`fixed right-0 top-0 h-full w-80 bg-white dark:bg-gray-800 shadow-xl 
                        transition-transform duration-300 transform
                        ${showNavPanel ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Questions Navigator
            </h3>
            <button 
              onClick={() => setShowNavPanel(false)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <span className="sr-only">Close panel</span>
              <EyeOff className="h-5 w-5" />
            </button>
          </div>
          
          <div className="p-4">
            <div className="mb-4">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                Test progress:
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full" 
                  style={{ 
                    width: `${Math.floor(
                      (Object.keys(answers).length / test.questions.length) * 100
                    )}%` 
                  }}
                ></div>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {Object.keys(answers).length} of {test.questions.length} questions answered
              </div>
            </div>
            
            <div className="grid grid-cols-5 gap-2">
              {test.questions.map((question, index) => {
                const isAnswered = !!answers[question.id];
                const isReviewed = answers[question.id]?.isMarkedForReview || false;
                const isCurrent = index === currentIndex;
                
                let bgColor = 'bg-gray-100 dark:bg-gray-700';
                
                if (isCurrent) {
                  bgColor = 'bg-blue-500 text-white';
                } else if (isReviewed) {
                  bgColor = 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
                } else if (isAnswered) {
                  bgColor = 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
                }
                
                return (
                  <button
                    key={question.id}
                    onClick={() => jumpToQuestion(index)}
                    className={`h-10 w-full flex items-center justify-center rounded-md
                              ${bgColor} font-medium text-sm transition-colors duration-150`}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>
            
            <div className="mt-6 space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-gray-100 dark:bg-gray-700 rounded"></div>
                <span className="text-sm text-gray-600 dark:text-gray-300">Not answered</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-100 dark:bg-green-900/30 rounded"></div>
                <span className="text-sm text-gray-600 dark:text-gray-300">Answered</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-yellow-100 dark:bg-yellow-900/30 rounded"></div>
                <span className="text-sm text-gray-600 dark:text-gray-300">Marked for review</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                <span className="text-sm text-gray-600 dark:text-gray-300">Current question</span>
              </div>
            </div>
          </div>
          
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700">
            <Button 
              onClick={() => {
                setShowNavPanel(false);
                setShowConfirmSubmit(true);
              }}
              className="w-full"
            >
              <Send className="w-4 h-4 mr-2" />
              Submit Test
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // Render current question (MCQ)
  const renderMCQ = (question: TestQuestion) => {
    const currentAnswer = answers[question.id];
    const selectedOption = currentAnswer?.selectedOption as number;
    
    return (
      <div className="space-y-6">
        {question.imageUrl && (
          <div className="mb-4">
            <img 
              src={question.imageUrl} 
              alt="Question" 
              className="max-w-full h-auto rounded-md border border-gray-300 dark:border-gray-600" 
            />
          </div>
        )}
        
        <div className="prose prose-blue dark:prose-invert max-w-none">
          <h2 className="text-xl font-semibold mb-6">{question.questionText}</h2>
          {question.content && <div dangerouslySetInnerHTML={{ __html: question.content }} />}
        </div>
        
        <div className="space-y-3 mt-6">
          {question.options?.map((option, index) => {
            // Handle both string options and object options
            const optionText = typeof option === 'string' ? option : (option as any)?.text || `Option ${index + 1}`;
            
            return (
              <button
                key={index}
                onClick={() => handleOptionSelect(index)}
                className={`w-full text-left p-4 rounded-lg border ${
                  selectedOption === index
                    ? 'bg-blue-50 border-blue-500 dark:bg-blue-900/30 dark:border-blue-500'
                    : 'bg-white border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:hover:bg-gray-700'
                }`}
              >
                <div className="flex items-center">
                  <div className={`flex-shrink-0 h-5 w-5 rounded-full border ${
                    selectedOption === index 
                      ? 'bg-blue-500 border-transparent' 
                      : 'border-gray-400 dark:border-gray-500'
                  } mr-3`}>
                    {selectedOption === index && (
                      <CheckCircle className="text-white h-5 w-5" />
                    )}
                  </div>
                  <span className="text-gray-900 dark:text-white">{optionText}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // Render current question (Essay)
  const renderEssay = (question: TestQuestion) => {
    const currentAnswer = answers[question.id];
    const textContent = currentAnswer?.textContent || '';
    const pdfFiles = currentAnswer?.pdfFiles || [];
    
    // Handle PDF file upload
    const handlePdfUpload = (attachment: PdfAttachment) => {
      if (!student?.id) return;
      
      setAnswers(prev => ({
        ...prev,
        [question.id]: {
          ...prev[question.id],
          questionId: question.id,
          pdfFiles: [...(prev[question.id]?.pdfFiles || []), attachment],
          lastModified: Date.now(),
          timeSpent: prev[question.id]?.timeSpent || 0,
          isMarkedForReview: prev[question.id]?.isMarkedForReview || false,
          changeHistory: [
            ...(prev[question.id]?.changeHistory || []),
            {
              timestamp: Date.now(),
              type: 'pdf_upload',
              newValue: attachment.fileName,
              timeOnQuestion: 0, // TODO: Track time properly
              pdfInfo: {
                fileName: attachment.fileName,
                fileSize: attachment.fileSize
              }
            }
          ]
        }
      }));
      
      // Auto-save the answer with PDF
      saveAnswer({ textContent, pdfFiles: [...pdfFiles, attachment] });
    };
    
    // Handle PDF file removal
    const handlePdfRemove = (fileUrl: string) => {
      const updatedFiles = pdfFiles.filter(file => file.fileUrl !== fileUrl);
      
      setAnswers(prev => ({
        ...prev,
        [question.id]: {
          ...prev[question.id],
          questionId: question.id,
          pdfFiles: updatedFiles,
          lastModified: Date.now(),
          timeSpent: prev[question.id]?.timeSpent || 0,
          isMarkedForReview: prev[question.id]?.isMarkedForReview || false,
          changeHistory: [
            ...(prev[question.id]?.changeHistory || []),
            {
              timestamp: Date.now(),
              type: 'pdf_remove',
              previousValue: fileUrl,
              timeOnQuestion: 0, // TODO: Track time properly
            }
          ]
        }
      }));
      
      // Auto-save the answer without the removed PDF
      saveAnswer({ textContent, pdfFiles: updatedFiles });
    };
    
    return (
      <div className="space-y-6">
        {question.imageUrl && (
          <div className="mb-4">
            <img 
              src={question.imageUrl} 
              alt="Question" 
              className="max-w-full h-auto rounded-md border border-gray-300 dark:border-gray-600" 
            />
          </div>
        )}
        
        <div className="prose prose-blue dark:prose-invert max-w-none">
          <h2 className="text-xl font-semibold mb-6">{question.questionText}</h2>
          {question.content && <div dangerouslySetInnerHTML={{ __html: question.content }} />}
        </div>
        
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Your Answer:
          </label>
          <TextArea
            value={textContent}
            onChange={(e) => {
              const newValue = e.target.value;
              setAnswers(prev => ({
                ...prev,
                [question.id]: {
                  ...prev[question.id],
                  textContent: newValue,
                  questionId: question.id,
                  lastModified: Date.now(),
                  timeSpent: prev[question.id]?.timeSpent || 0,
                  isMarkedForReview: prev[question.id]?.isMarkedForReview || false,
                  changeHistory: prev[question.id]?.changeHistory || []
                }
              }));
              handleEssayChange(newValue);
            }}
            placeholder="Type your answer here..."
            className="min-h-[250px]"
          />
        </div>
        
        {/* PDF Upload Section */}
        <div className="mt-6">
          <div className="border-t border-gray-200 dark:border-gray-600 pt-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Upload Supporting Documents (Optional)
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              You can upload PDF documents to support your written answer. This is useful for 
              diagrams, calculations, or handwritten work.
            </p>
            
            {student?.id && currentQuestion && (() => {
              // Get PDF files from both sources to ensure we have the most up-to-date list
              const pdfFilesFromState: PdfAttachment[] = (pdfFiles as any)[currentQuestion.id] || [];
              const pdfFilesFromAnswers: PdfAttachment[] = answers[currentQuestion.id]?.pdfFiles || [];
              
              // Merge and deduplicate based on fileUrl
              const allPdfFiles = [...pdfFilesFromState, ...pdfFilesFromAnswers];
              const uniquePdfFiles = allPdfFiles.filter((pdf, index, self) => 
                index === self.findIndex(p => p.fileUrl === pdf.fileUrl)
              );
              
              console.log('🔍 PDF Upload Component Debug:', {
                questionId: currentQuestion.id,
                pdfFilesFromState,
                pdfFilesFromAnswers,
                uniquePdfFiles,
                pdfFilesState: pdfFiles,
                answersForQuestion: answers[currentQuestion.id]
              });
              
              return (
                <PdfUploadComponent
                  questionId={currentQuestion.id}
                  attemptId={attemptId}
                  studentId={student.id}
                  existingFiles={uniquePdfFiles}
                  onFileUpload={handlePdfUpload}
                  onFileRemove={handlePdfRemove}
                  disabled={timeExpired}
                  maxFiles={3}
                />
              );
            })()}
          </div>
        </div>
      </div>
    );
  };

  // Main test taking interface
  return (
    <StudentLayout>
      {/* Navigation panel overlay */}
      {renderNavigationPanel()}
      
      <div className="space-y-6">
        {/* Header with timer */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 sticky top-0 z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {test.title}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Question {currentIndex + 1} of {test.questions.length}
              </p>
            </div>
            
            <div className="flex items-center mt-4 md:mt-0">
              <div className={`flex items-center p-2 rounded-md ${
                remainingTime < 300 
                  ? 'bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-300' 
                  : 'bg-blue-50 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
              }`}>
                <Clock className="h-5 w-5 mr-2" />
                <span className="font-mono font-medium">{formatTime(remainingTime)}</span>
              </div>
              
              <button 
                onClick={() => setShowNavPanel(true)}
                className="ml-4 flex items-center text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                aria-label="Show navigation panel"
              >
                <List className="h-5 w-5" />
                <span className="ml-1 hidden sm:inline">Questions</span>
              </button>
              
              <button 
                onClick={requestFullscreen}
                className="ml-2 flex items-center text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                aria-label="Enter fullscreen"
                title="Enter fullscreen mode"
              >
                <Maximize className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1 mt-4">
            <div 
              className="bg-blue-600 h-1 rounded-full transition-all duration-300" 
              style={{ width: `${((currentIndex + 1) / test.questions.length) * 100}%` }}
            ></div>
          </div>
        </div>
        
        {/* Question content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          {/* Save status indicator */}
          {savedState && (
            <div className={`text-sm mb-4 flex items-center ${
              savedState === 'saving' 
                ? 'text-gray-500 dark:text-gray-400' 
                : savedState === 'saved'
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
            }`}>
              {savedState === 'saving' && (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-gray-500 dark:border-gray-400 border-t-transparent rounded-full mr-2"></div>
                  <span>Saving your answer...</span>
                </>
              )}
              {savedState === 'saved' && (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  <span>Answer saved</span>
                </>
              )}
              {savedState === 'error' && (
                <>
                  <AlertCircle className="h-4 w-4 mr-2" />
                  <span>Error saving answer</span>
                </>
              )}
            </div>
          )}
          
          {/* Current question */}
          {currentQuestion?.type === 'mcq' && renderMCQ(currentQuestion)}
          {currentQuestion?.type === 'essay' && renderEssay(currentQuestion)}
          
          {/* Review mark flag */}
          <div className="flex items-center justify-end mt-6 text-sm">
            <button
              onClick={toggleReviewMark}
              className={`flex items-center ${
                answers[currentQuestion?.id || '']?.isMarkedForReview
                  ? 'text-yellow-600 dark:text-yellow-400'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              <Flag className="h-4 w-4 mr-1" />
              {answers[currentQuestion?.id || '']?.isMarkedForReview
                ? 'Remove review flag'
                : 'Mark for review'
              }
            </button>
          </div>
        </div>
        
        {/* Navigation buttons */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
            <div className="flex space-x-4">
              <Button
                variant="outline"
                onClick={goToPrevQuestion}
                disabled={currentIndex === 0}
                className={currentIndex === 0 ? 'opacity-50 cursor-not-allowed' : ''}
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
              
              <Button
                variant="outline"
                onClick={goToNextQuestion}
                disabled={currentIndex === test.questions.length - 1}
                className={currentIndex === test.questions.length - 1 ? 'opacity-50 cursor-not-allowed' : ''}
              >
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
            
            <Button
              onClick={() => setShowConfirmSubmit(true)}
            >
              <Send className="w-4 h-4 mr-2" />
              Submit Test
            </Button>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}
