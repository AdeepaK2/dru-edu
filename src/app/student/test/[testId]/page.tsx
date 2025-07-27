'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { AlertCircle, Clock, ArrowLeft, Target, RefreshCw } from 'lucide-react';
import { useStudentAuth } from '@/hooks/useStudentAuth';
import { Button } from '@/components/ui';
import { Test, LiveTest, FlexibleTest } from '@/models/testSchema';
import { Timestamp } from 'firebase/firestore';
import { AttemptSummary } from '@/models/attemptSchema';

// Import student layout from other components or use a local version for now
const StudentLayout = ({ children }: { children: React.ReactNode }) => children;

export default function TestPage() {
  const router = useRouter();
  const params = useParams();
  const testId = params?.testId as string;
  
  const { student, loading: authLoading } = useStudentAuth();
  
  // States
  const [test, setTest] = useState<Test | null>(null);
  const [attemptInfo, setAttemptInfo] = useState<AttemptSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startingTest, setStartingTest] = useState(false);

  // Load test data
  useEffect(() => {
    const loadTestData = async () => {
      if (!testId || !student) {
        return;
      }
      
      try {
        setLoading(true);
        
        // Import Firestore functions
        const { doc, getDoc } = await import('firebase/firestore');
        const { firestore } = await import('@/utils/firebase-client');
        
        // Get the test document
        const testDoc = await getDoc(doc(firestore, 'tests', testId));
        
        if (!testDoc.exists()) {
          setError('Test not found. It may have been deleted.');
          setLoading(false);
          return;
        }
        
        const testData = { id: testDoc.id, ...testDoc.data() } as Test;
        
        // Check if student is enrolled in any of the test's classes
        const { getEnrollmentsByStudent } = await import('@/services/studentEnrollmentService');
        const enrollments = await getEnrollmentsByStudent(student.id);
        
        const isEnrolled = enrollments.some(enrollment => 
          testData.classIds.includes(enrollment.classId)
        );
        
        if (!isEnrolled) {
          setError('You are not enrolled in the class for this test.');
          setLoading(false);
          return;
        }

        // Get attempt information - Use direct query to get all attempts and categorize them properly
        const { collection, query, where, getDocs } = await import('firebase/firestore');
        
        const attemptsQuery = query(
          collection(firestore, 'testAttempts'),
          where('testId', '==', testId),
          where('studentId', '==', student.id)
        );
        
        const attemptsSnapshot = await getDocs(attemptsQuery);
        const allAttempts: any[] = [];
        const completedAttempts: any[] = [];
        const activeAttempts: any[] = [];
        
        const now = new Date();
        
        attemptsSnapshot.forEach((doc) => {
          const attemptData = { id: doc.id, ...doc.data() } as any;
          allAttempts.push(attemptData);
          
          // Check if attempt has expired by comparing current time with endTime
          let isExpired = false;
          if (attemptData.endTime) {
            const endTime = attemptData.endTime.toDate ? attemptData.endTime.toDate() : new Date(attemptData.endTime.seconds * 1000);
            isExpired = now > endTime;
          } else if (attemptData.startedAt && attemptData.totalTimeAllowed) {
            // Fallback: calculate end time from start time + duration
            const startTime = attemptData.startedAt.toDate ? attemptData.startedAt.toDate() : new Date(attemptData.startedAt.seconds * 1000);
            const endTime = new Date(startTime.getTime() + (attemptData.totalTimeAllowed * 1000));
            isExpired = now > endTime;
          }
          
          // Categorize attempts based on status and time validity
          const isCompleted = attemptData.status === 'submitted' || 
                             attemptData.status === 'auto_submitted' || 
                             attemptData.submittedAt ||
                             isExpired; // Expired attempts are considered completed
          
          const isActive = !isCompleted && (
            attemptData.status === 'in_progress' || 
            attemptData.status === 'not_started' || 
            attemptData.status === 'paused' ||
            (!attemptData.submittedAt && !attemptData.status)
          );
          
          if (isCompleted) {
            completedAttempts.push(attemptData);
          } else if (isActive) {
            activeAttempts.push(attemptData);
          }
        });
        
        // Calculate proper attempt summary
        const attemptsAllowed = testData.type === 'flexible' 
          ? (testData as FlexibleTest).attemptsAllowed || 1 
          : 1;
        
        const canCreateNewAttempt = completedAttempts.length < attemptsAllowed || activeAttempts.length > 0;
        
        // Find best score from completed attempts
        let bestScore: number | undefined;
        let lastAttemptStatus: any;
        let lastAttemptDate: any;
        
        if (completedAttempts.length > 0) {
          bestScore = Math.max(...completedAttempts.map((attempt: any) => attempt.score || 0));
          const latestAttempt = completedAttempts.sort((a: any, b: any) => 
            (b.submittedAt?.seconds || 0) - (a.submittedAt?.seconds || 0)
          )[0];
          lastAttemptStatus = latestAttempt.status;
          lastAttemptDate = latestAttempt.submittedAt;
        }
        
        const attemptData: AttemptSummary = {
          testId,
          studentId: student.id,
          totalAttempts: completedAttempts.length, // Only count completed attempts
          attemptsAllowed,
          canCreateNewAttempt,
          bestScore,
          lastAttemptStatus,
          lastAttemptDate,
          attempts: completedAttempts.map((attempt: any, index: number) => ({
            attemptNumber: index + 1,
            attemptId: attempt.id,
            status: attempt.status,
            score: attempt.score,
            percentage: attempt.percentage,
            submittedAt: attempt.submittedAt
          }))
        };
        
        // Store additional data for UI display including remaining time for active attempts
        (attemptData as any).activeAttempts = activeAttempts.length;
        (attemptData as any).hasActiveAttempt = activeAttempts.length > 0;
        
        // Calculate remaining time for active attempt if exists
        if (activeAttempts.length > 0) {
          const activeAttempt = activeAttempts[0];
          const now = new Date();
          let remainingMinutes = 0;
          
          if (activeAttempt.endTime) {
            const endTime = activeAttempt.endTime.toDate ? activeAttempt.endTime.toDate() : new Date(activeAttempt.endTime.seconds * 1000);
            remainingMinutes = Math.max(0, Math.floor((endTime.getTime() - now.getTime()) / (1000 * 60)));
          } else if (activeAttempt.startedAt && activeAttempt.totalTimeAllowed) {
            const startTime = activeAttempt.startedAt.toDate ? activeAttempt.startedAt.toDate() : new Date(activeAttempt.startedAt.seconds * 1000);
            const endTime = new Date(startTime.getTime() + (activeAttempt.totalTimeAllowed * 1000));
            remainingMinutes = Math.max(0, Math.floor((endTime.getTime() - now.getTime()) / (1000 * 60)));
          }
          
          (attemptData as any).activeAttemptRemainingMinutes = remainingMinutes;
          (attemptData as any).activeAttemptId = activeAttempt.id;
        }
        
        console.log('✅ Attempt summary calculated:', {
          totalAttempts: allAttempts.length,
          completedAttempts: completedAttempts.length,
          activeAttempts: activeAttempts.length,
          attemptsAllowed,
          canCreateNewAttempt
        });
        
        setAttemptInfo(attemptData);
        
        // Set the test data
        setTest(testData);
        setLoading(false);
      } catch (error) {
        console.error('Error loading test:', error);
        setError('Failed to load test data. Please try again.');
        setLoading(false);
      }
    };
    
    loadTestData();
  }, [testId, student]);

  // Format date and time - handles both Firestore Timestamp and plain objects
  const formatDateTime = (timestamp: any) => {
    let date: Date;
    
    try {
      // Check if it's a proper Firestore Timestamp with toDate method
      if (timestamp && typeof timestamp.toDate === 'function') {
        date = timestamp.toDate();
      }
      // Check if it's a plain object with seconds property (serialized Timestamp)
      else if (timestamp && typeof timestamp.seconds === 'number') {
        date = new Date(timestamp.seconds * 1000);
      }
      // Check if it's already a Date object
      else if (timestamp instanceof Date) {
        date = timestamp;
      }
      // Check if it's a string that can be parsed
      else if (typeof timestamp === 'string') {
        date = new Date(timestamp);
      }
      // Fallback to current date if timestamp is invalid
      else {
        console.warn('Invalid timestamp format:', timestamp);
        date = new Date();
      }
    } catch (error) {
      console.error('Error formatting timestamp:', error, timestamp);
      date = new Date(); // Fallback to current date
    }
    
    return date.toLocaleString('en-AU', {
      timeZone: 'Australia/Melbourne',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Handle going back
  const handleBack = () => {
    router.push('/student/test');
  };

  // Handle starting the actual test
  const handleStartTest = async () => {
    if (!attemptInfo || startingTest || !student) return;
    
    try {
      setStartingTest(true);
      
      // Check for active attempts first - use the data we already have
      if ((attemptInfo as any).hasActiveAttempt) {
        // Find the active attempt from our already loaded data
        const { collection, query, where, getDocs } = await import('firebase/firestore');
        const { firestore } = await import('@/utils/firebase-client');
        
        const activeAttemptsQuery = query(
          collection(firestore, 'testAttempts'),
          where('testId', '==', testId),
          where('studentId', '==', student.id)
        );
        
        const activeAttemptsSnapshot = await getDocs(activeAttemptsQuery);
        let activeAttemptId: string | null = null;
        let validActiveAttempt = false;
        
        const now = new Date();
        
        activeAttemptsSnapshot.forEach((doc) => {
          const attemptData = doc.data();
          
          // Check if attempt is truly active and within time limits
          const isActiveStatus = attemptData.status === 'in_progress' || 
                                 attemptData.status === 'not_started' || 
                                 attemptData.status === 'paused' ||
                                 (!attemptData.submittedAt && !attemptData.status);
          
          if (isActiveStatus) {
            // Check if still within time limits
            let isWithinTime = true;
            if (attemptData.endTime) {
              const endTime = attemptData.endTime.toDate ? attemptData.endTime.toDate() : new Date(attemptData.endTime.seconds * 1000);
              isWithinTime = now <= endTime;
            } else if (attemptData.startedAt && attemptData.totalTimeAllowed) {
              const startTime = attemptData.startedAt.toDate ? attemptData.startedAt.toDate() : new Date(attemptData.startedAt.seconds * 1000);
              const endTime = new Date(startTime.getTime() + (attemptData.totalTimeAllowed * 1000));
              isWithinTime = now <= endTime;
            }
            
            if (isWithinTime) {
              activeAttemptId = doc.id;
              validActiveAttempt = true;
              console.log('✅ Found valid active attempt to resume:', activeAttemptId);
            } else {
              console.log('⏰ Found expired attempt, will auto-submit:', doc.id);
              // Could auto-submit expired attempt here if needed
            }
          }
        });
        
        // If there's a valid active attempt, resume it
        if (activeAttemptId && validActiveAttempt) {
          console.log('🔄 Resuming existing attempt:', activeAttemptId);
          router.push(`/student/test/${testId}/take?attemptId=${activeAttemptId}`);
          return;
        }
      }
      
      // Only create new attempt if no valid active attempts exist and under limit
      if (!attemptInfo.canCreateNewAttempt) {
        alert('Cannot start test - attempt limit reached or test not available');
        setStartingTest(false);
        return;
      }
      
      console.log('🆕 Creating new attempt...');
      
      // Import services for creating new attempt
      const { AttemptManagementService } = await import('@/apiservices/attemptManagementService');
      
      // Get student's enrollment to find their class ID
      const { getEnrollmentsByStudent } = await import('@/services/studentEnrollmentService');
      const enrollments = await getEnrollmentsByStudent(student.id);
      
      // Find the class ID for this test
      const relevantEnrollment = enrollments.find(enrollment => 
        test?.classIds.includes(enrollment.classId)
      );
      
      const classId = relevantEnrollment?.classId || enrollments[0]?.classId || 'unknown';
      const className = relevantEnrollment?.className || enrollments[0]?.className || 'Unknown Class';
      
      // Create a new attempt
      const attemptId = await AttemptManagementService.createAttempt(
        testId,
        student.id,
        student.name,
        classId,
        className
      );
      
      console.log('✅ New attempt created:', attemptId);
      
      // Navigate to the test taking page with the attempt ID
      router.push(`/student/test/${testId}/take?attemptId=${attemptId}`);
    } catch (error) {
      console.error('Error starting test:', error);
      alert('Failed to start test. Please try again.');
      setStartingTest(false);
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
              onClick={handleBack}
              className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Tests
            </button>
            
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Test Details
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
              onClick={handleBack}
              className="inline-flex items-center"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Return to Tests List
            </Button>
          </div>
        </div>
      </StudentLayout>
    );
  }

  // Not found state
  if (!test) {
    return (
      <StudentLayout>
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <button 
              onClick={handleBack}
              className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Tests
            </button>
            
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Test Not Found
            </h1>
          </div>
          
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-md p-6 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-orange-500 mb-4" />
            <h2 className="text-xl font-semibold text-orange-800 dark:text-orange-200 mb-2">
              Test Not Available
            </h2>
            <p className="text-orange-700 dark:text-orange-300 mb-6">
              The test you're looking for could not be found. It may have been deleted or you don't have access to it.
            </p>
            <Button 
              onClick={handleBack}
              className="inline-flex items-center"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Return to Tests List
            </Button>
          </div>
        </div>
      </StudentLayout>
    );
  }

  // Determine if test is available now
  const now = Date.now() / 1000; // Current time in seconds
  let testStatus = '';
  let canStart = false;

  // Helper function to get seconds from any timestamp format
  const getSeconds = (timestamp: any): number => {
    if (timestamp && typeof timestamp.seconds === 'number') {
      return timestamp.seconds;
    } else if (timestamp && typeof timestamp.toDate === 'function') {
      return timestamp.toDate().getTime() / 1000;
    } else if (timestamp instanceof Date) {
      return timestamp.getTime() / 1000;
    } else if (typeof timestamp === 'string') {
      return new Date(timestamp).getTime() / 1000;
    } else if (typeof timestamp === 'number') {
      return timestamp > 1000000000000 ? timestamp / 1000 : timestamp; // Convert milliseconds to seconds if needed
    }
    console.warn('⚠️ Unknown timestamp format in getSeconds:', timestamp);
    return 0;
  };

  if (test.type === 'live') {
    const liveTest = test as LiveTest;
    const joinTimeSeconds = getSeconds(liveTest.studentJoinTime);
    const endTimeSeconds = getSeconds(liveTest.actualEndTime);
    
    if (now < joinTimeSeconds) {
      testStatus = 'This test has not started yet.';
      canStart = false;
    } else if (now >= joinTimeSeconds && now <= endTimeSeconds) {
      testStatus = 'This test is live now.';
      canStart = true;
    } else {
      testStatus = 'This test has ended.';
      canStart = false;
    }
  } else {
    const flexTest = test as FlexibleTest;
    const fromSeconds = getSeconds(flexTest.availableFrom);
    const toSeconds = getSeconds(flexTest.availableTo);
    
    if (now < fromSeconds) {
      testStatus = 'This test is not available yet.';
      canStart = false;
    } else if (now >= fromSeconds && now <= toSeconds) {
      testStatus = 'This test is available now.';
      canStart = true;
    } else {
      testStatus = 'This test is no longer available.';
      canStart = false;
    }
  }

  return (
    <StudentLayout>
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <button 
            onClick={handleBack}
            className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Tests
          </button>
          
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {test.title}
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            {test.description || 'No description provided.'}
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Test Information
          </h2>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Subject</p>
                <p className="mt-1 text-gray-900 dark:text-white">{test.subjectName || 'Unknown Subject'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Teacher</p>
                <p className="mt-1 text-gray-900 dark:text-white">{test.teacherName || 'Unknown Teacher'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Test Type</p>
                <p className="mt-1 text-gray-900 dark:text-white capitalize">{test.type}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Questions</p>
                <p className="mt-1 text-gray-900 dark:text-white">{test.questions.length}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Marks</p>
                <p className="mt-1 text-gray-900 dark:text-white">{test.totalMarks}</p>
              </div>
              {test.type === 'live' ? (
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Scheduled Time</p>
                  <p className="mt-1 text-gray-900 dark:text-white">
                    {formatDateTime((test as LiveTest).scheduledStartTime)}
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Available Until</p>
                  <p className="mt-1 text-gray-900 dark:text-white">
                    {formatDateTime((test as FlexibleTest).availableTo)}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Duration</p>
                <p className="mt-1 text-gray-900 dark:text-white">
                  {test.type === 'live' 
                    ? `${(test as LiveTest).duration} minutes` 
                    : `${(test as FlexibleTest).duration || 'No time limit'} minutes`}
                </p>
              </div>
            </div>
            
            {test.instructions && (
              <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Instructions</h3>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-4 text-gray-700 dark:text-gray-300">
                  {test.instructions}
                </div>
              </div>
            )}
            
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
              {/* Attempt Information */}
              {attemptInfo && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                    <Target className="h-5 w-5 mr-2" />
                    Attempt Information
                  </h3>
                  
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Attempts Allowed</p>
                        <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                          {attemptInfo.attemptsAllowed}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Completed Attempts</p>
                        <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                          {attemptInfo.totalAttempts}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</p>
                        <p className={`mt-1 text-sm font-medium ${
                          (attemptInfo as any).hasActiveAttempt
                            ? 'text-blue-600 dark:text-blue-400'
                            : attemptInfo.canCreateNewAttempt 
                              ? 'text-green-600 dark:text-green-400' 
                              : 'text-red-600 dark:text-red-400'
                        }`}>
                          {(attemptInfo as any).hasActiveAttempt 
                            ? 'Resume Available' 
                            : attemptInfo.canCreateNewAttempt 
                              ? 'Can attempt' 
                              : 'Cannot attempt'
                          }
                        </p>
                      </div>
                    </div>
                    
                    {/* Active attempts indicator */}
                    {(attemptInfo as any).activeAttempts > 0 && (
                      <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 text-blue-500 mr-2" />
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                              You have an active test in progress. Click "Resume Test" to continue.
                            </p>
                          </div>
                          {(attemptInfo as any).activeAttemptRemainingMinutes !== undefined && (
                            <div className="text-sm font-medium text-blue-700 dark:text-blue-300">
                              {(attemptInfo as any).activeAttemptRemainingMinutes > 0 
                                ? `${(attemptInfo as any).activeAttemptRemainingMinutes} min left`
                                : 'Time expired'
                              }
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {attemptInfo.totalAttempts > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          You have completed {attemptInfo.totalAttempts} attempt{attemptInfo.totalAttempts !== 1 ? 's' : ''} for this test.
                          {attemptInfo.canCreateNewAttempt && !(attemptInfo as any).hasActiveAttempt ? (
                            ` You can attempt ${attemptInfo.attemptsAllowed - attemptInfo.totalAttempts} more time${attemptInfo.attemptsAllowed - attemptInfo.totalAttempts !== 1 ? 's' : ''}.`
                          ) : !attemptInfo.canCreateNewAttempt ? (
                            ' You have used all available attempts.'
                          ) : ''}
                        </p>
                        
                        {attemptInfo.totalAttempts > 0 && (
                          <button
                            onClick={() => router.push(`/student/test/${testId}/result`)}
                            className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                          >
                            View Previous Results →
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md flex items-center mb-6">
                <Clock className="h-5 w-5 text-blue-500 mr-3" />
                <p className="text-blue-700 dark:text-blue-300">
                  {testStatus}
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
                <Button
                  onClick={handleBack}
                  variant="outline"
                >
                  Return to Tests
                </Button>
                
                <Button
                  onClick={handleStartTest}
                  className="inline-flex items-center"
                  disabled={!canStart || (!(attemptInfo as any)?.hasActiveAttempt && !attemptInfo?.canCreateNewAttempt) || startingTest}
                >
                  {startingTest ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {(attemptInfo as any)?.hasActiveAttempt ? 'Resuming...' : 'Starting...'}
                    </>
                  ) : (attemptInfo as any)?.hasActiveAttempt ? (
                    'Resume Test'
                  ) : attemptInfo?.canCreateNewAttempt ? (
                    attemptInfo.totalAttempts > 0 ? 'Start New Attempt' : 'Start Test'
                  ) : attemptInfo ? (
                    'No Attempts Remaining'
                  ) : (
                    'Loading...'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}
