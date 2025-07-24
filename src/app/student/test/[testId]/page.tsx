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

        // Get attempt information
        const { AttemptManagementService } = await import('@/apiservices/attemptManagementService');
        const attemptData = await AttemptManagementService.getAttemptSummary(testId, student.id);
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
      
      // Import services
      const { AttemptManagementService } = await import('@/apiservices/attemptManagementService');
      
      // Check if student can create new attempt
      if (!attemptInfo.canCreateNewAttempt) {
        alert('Cannot start test - attempt limit reached or test not available');
        setStartingTest(false);
        return;
      }
      
      // Get student's enrollment to find their class ID
      const { getEnrollmentsByStudent } = await import('@/services/studentEnrollmentService');
      const enrollments = await getEnrollmentsByStudent(student.id);
      
      // Find the class ID for this test
      const relevantEnrollment = enrollments.find(enrollment => 
        test?.classIds.includes(enrollment.classId)
      );
      
      const classId = relevantEnrollment?.classId || enrollments[0]?.classId || 'unknown';
      
      // Create a new attempt
      const attemptId = await AttemptManagementService.createAttempt(
        testId,
        student.id,
        student.name,
        classId
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
    }
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
                <p className="mt-1 text-gray-900 dark:text-white">{test.subjectName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Teacher</p>
                <p className="mt-1 text-gray-900 dark:text-white">{test.teacherName}</p>
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
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Attempts Used</p>
                        <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                          {attemptInfo.totalAttempts}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</p>
                        <p className={`mt-1 text-sm font-medium ${
                          attemptInfo.canCreateNewAttempt 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {attemptInfo.canCreateNewAttempt ? 'Can attempt' : 'Cannot attempt'}
                        </p>
                      </div>
                    </div>
                    
                    {attemptInfo.totalAttempts > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          You have completed {attemptInfo.totalAttempts} attempt{attemptInfo.totalAttempts !== 1 ? 's' : ''} for this test.
                          {attemptInfo.canCreateNewAttempt ? (
                            ` You can attempt ${attemptInfo.attemptsAllowed - attemptInfo.totalAttempts} more time${attemptInfo.attemptsAllowed - attemptInfo.totalAttempts !== 1 ? 's' : ''}.`
                          ) : (
                            ' You have used all available attempts.'
                          )}
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
                  disabled={!canStart || !attemptInfo?.canCreateNewAttempt || startingTest}
                >
                  {startingTest ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Starting...
                    </>
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
