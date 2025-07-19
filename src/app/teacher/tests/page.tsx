'use client';

import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Plus, 
  Clock, 
  Users, 
  Calendar,
  BarChart3,
  Settings,
  Play,
  Pause,
  Eye,
  Trash2,
  AlertCircle,
  ArrowLeft,
  BookOpen
} from 'lucide-react';
import TeacherLayout from '@/components/teacher/TeacherLayout';
import CreateTestModal from '@/components/modals/CreateTestModal';
import { useTeacherAuth } from '@/hooks/useTeacherAuth';
import { TestService } from '@/apiservices/testService';
import { ClassFirestoreService } from '@/apiservices/classFirestoreService';
import { questionBankService } from '@/apiservices/questionBankFirestoreService';
import { teacherAccessBankService } from '@/apiservices/teacherAccessBankService';
import { Test, LiveTest, FlexibleTest } from '@/models/testSchema';
import { ClassDocument } from '@/models/classSchema';
import { QuestionBank } from '@/models/questionBankSchema';
import { Timestamp } from 'firebase/firestore';

export default function TeacherTests() {
  const { teacher } = useTeacherAuth();
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [teacherClasses, setTeacherClasses] = useState<ClassDocument[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [questionBanks, setQuestionBanks] = useState<QuestionBank[]>([]);
  const [loadingQuestionBanks, setLoadingQuestionBanks] = useState(true);
  
  // New state for class-based view
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'overview' | 'class-detail'>('overview');

  useEffect(() => {
    if (teacher) {
      loadTeacherData();
    }
  }, [teacher]);

  const loadTeacherData = async () => {
    try {
      setLoading(true);
      setLoadingClasses(true);
      setLoadingQuestionBanks(true);
      
      console.log('🔍 Teacher ID in tests page:', teacher!.id);
      console.log('🔍 Teacher object:', teacher);
      console.log('🔍 Teacher name:', teacher!.name);
      console.log('🔍 Teacher email:', teacher!.email);
      
      // Load teacher's assigned classes first
      const assignedClasses = await ClassFirestoreService.getClassesByTeacher(teacher!.id);
      setTeacherClasses(assignedClasses);
      setLoadingClasses(false);
      
      console.log('✅ Loaded teacher classes in TESTS page:', assignedClasses.length);
      console.log('✅ Actual classes data:', assignedClasses);
      
      // Load question banks that teacher has access to
      console.log('🔍 Loading accessible question banks for teacher:', teacher!.id);
      
      try {
        // DEBUG: Check teacher access records first
        console.log('🔍 DEBUG: Checking teacher access records...');
        
        // Get question banks through teacher access system
        const accessibleBanks = await teacherAccessBankService.getAccessibleQuestionBanks(teacher!.id);
        console.log('✅ Found accessible banks through access system:', accessibleBanks.length);
        console.log('✅ Raw access records:', accessibleBanks.map(a => ({
          bankId: a.questionBankId,
          bankName: a.questionBankName,
          subjectId: a.subjectId,
          subjectName: a.subjectName,
          accessType: a.accessType,
          isActive: a.isActive,
          teacherId: a.teacherId
        })));
        
        if (accessibleBanks.length > 0) {
          // Get the actual question bank details
          const questionBankPromises = accessibleBanks.map(async (access) => {
            try {
              return await questionBankService.getQuestionBank(access.questionBankId);
            } catch (error) {
              console.warn(`Failed to load question bank ${access.questionBankId}:`, error);
              return null;
            }
          });
          
          const questionBankResults = await Promise.all(questionBankPromises);
          const validQuestionBanks = questionBankResults.filter(bank => bank !== null);
          
          setQuestionBanks(validQuestionBanks);
          console.log('✅ Final accessible question banks loaded:', validQuestionBanks.length);
          console.log('✅ Question banks details:', validQuestionBanks.map(b => ({ 
            id: b.id, 
            name: b.name, 
            subject: b.subjectName,
            subjectId: b.subjectId,
            totalQuestions: b.totalQuestions
          })));

          // Debug: Check if any banks match current subjects
          const teacherSubjectIds = Array.from(new Set(assignedClasses.map(cls => cls.subjectId)));
          console.log('🔍 Teacher subject IDs:', teacherSubjectIds);
          const matchingBanks = validQuestionBanks.filter(bank => teacherSubjectIds.includes(bank.subjectId));
          console.log('🔍 Question banks matching teacher subjects:', matchingBanks.length);
        } else {
          console.log('ℹ️ No accessible question banks found for teacher');
          setQuestionBanks([]);
        }
      } catch (bankError) {
        console.warn('Error loading accessible question banks:', bankError);
        setQuestionBanks([]);
      }
      setLoadingQuestionBanks(false);
      
      // Try to load teacher tests, but don't fail if there are none
      try {
        const teacherTests = await TestService.getTeacherTests(teacher!.id);
        setTests(teacherTests);
        console.log('✅ Loaded teacher tests:', teacherTests.length);
      } catch (testError) {
        console.warn('No tests found for teacher (this is normal for new teachers):', testError);
        setTests([]); // Set empty array if no tests
      }
    } catch (error) {
      console.error('Error loading teacher data:', error);
      alert('Failed to load teacher data. Please refresh the page.');
    } finally {
      setLoading(false);
      setLoadingClasses(false);
      setLoadingQuestionBanks(false);
    }
  };

  const handleTestCreated = (newTest: Test) => {
    setTests(prev => [newTest, ...prev]);
    setShowCreateModal(false);
    // If we were creating for a specific class, stay in class detail view
    // Otherwise go back to overview
  };

  // Handle modal close
  const handleModalClose = () => {
    setShowCreateModal(false);
    // Reset selected class if we were in overview mode
    if (viewMode === 'overview') {
      setSelectedClassId(null);
    }
  };

  // Handle class selection
  const handleClassClick = (classId: string) => {
    setSelectedClassId(classId);
    setViewMode('class-detail');
  };

  // Handle back to overview
  const handleBackToOverview = () => {
    setSelectedClassId(null);
    setViewMode('overview');
  };

  // Handle create test for specific class
  const handleCreateTestForClass = (classId: string) => {
    setSelectedClassId(classId);
    setShowCreateModal(true);
  };

  // Get selected class info
  const getSelectedClass = () => {
    return teacherClasses.find(cls => cls.id === selectedClassId);
  };

  // Get tests for selected class
  const getTestsForClass = (classId: string) => {
    return tests.filter(test => test.classIds.includes(classId));
  };

  // Get unique subjects from teacher's classes
  const getTeacherSubjects = () => {
    const uniqueSubjects = Array.from(
      new Set(teacherClasses.map(cls => cls.subjectId))
    );
    
    return uniqueSubjects.map(subjectId => {
      const classWithSubject = teacherClasses.find(cls => cls.subjectId === subjectId);
      return {
        id: subjectId,
        name: classWithSubject?.subject || subjectId
      };
    });
  };

  const formatDateTime = (timestamp: Timestamp) => {
    const date = timestamp.toDate();
    return date.toLocaleString('en-AU', {
      timeZone: 'Australia/Melbourne',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTestStatus = (test: Test) => {
    const now = Timestamp.now();
    
    if (test.type === 'live') {
      const liveTest = test as LiveTest;
      if (now.seconds < liveTest.studentJoinTime.seconds) {
        return { status: 'upcoming', color: 'blue', text: 'Upcoming' };
      } else if (now.seconds >= liveTest.studentJoinTime.seconds && now.seconds <= liveTest.actualEndTime.seconds) {
        return { status: 'live', color: 'green', text: 'Live' };
      } else {
        return { status: 'completed', color: 'gray', text: 'Completed' };
      }
    } else {
      const flexTest = test as FlexibleTest;
      if (now.seconds < flexTest.availableFrom.seconds) {
        return { status: 'upcoming', color: 'blue', text: 'Upcoming' };
      } else if (now.seconds >= flexTest.availableFrom.seconds && now.seconds <= flexTest.availableTo.seconds) {
        return { status: 'active', color: 'green', text: 'Active' };
      } else {
        return { status: 'completed', color: 'gray', text: 'Completed' };
      }
    }
  };

  const deleteTest = async (testId: string) => {
    if (!confirm('Are you sure you want to delete this test? This action cannot be undone.')) {
      return;
    }

    try {
      // Use Firebase client service directly
      await TestService.deleteTest(testId);
      setTests(prev => prev.filter(test => test.id !== testId));
    } catch (error) {
      console.error('Error deleting test:', error);
      alert('Failed to delete test. Please try again.');
    }
  };

  if (loading) {
    return (
      <TeacherLayout>
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-1/4"></div>
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 bg-gray-300 dark:bg-gray-600 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </TeacherLayout>
    );
  }

  return (
    <TeacherLayout>
      <div className="space-y-6">
        {viewMode === 'overview' ? (
          // Overview Mode - Show all classes and general stats
          <>
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Tests & Quizzes
                  </h1>
                  <p className="text-gray-600 dark:text-gray-300">
                    Create and manage tests for your assigned classes
                  </p>
                  {loadingClasses ? (
                    <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                      Loading your classes...
                    </div>
                  ) : (
                    <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      {teacherClasses.length > 0 ? (
                        <>
                          Assigned to {teacherClasses.length} class{teacherClasses.length !== 1 ? 'es' : ''}: {' '}
                          <span className="font-medium text-gray-700 dark:text-gray-300">
                            {teacherClasses.map(cls => `${cls.name} (${cls.subject})`).join(', ')}
                          </span>
                        </>
                      ) : (
                        <span className="text-orange-600 dark:text-orange-400 flex items-center">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          No classes assigned - contact administrator to create tests
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-3">
                  {teacherClasses.length === 0 && !loadingClasses && (
                    <div className="text-sm text-gray-500 dark:text-gray-400 mr-4">
                      Need class assignment
                    </div>
                  )}
                  <button
                    onClick={() => loadTeacherData()}
                    className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    🔄 Debug Reload
                  </button>
                </div>
              </div>
            </div>

            {/* Your Classes */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                  Your Classes
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Click on a class to view and create tests
                </p>
              </div>

              <div className="p-6">
                {loadingClasses ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600 dark:text-gray-300">Loading classes...</p>
                  </div>
                ) : teacherClasses.length === 0 ? (
                  <div className="text-center py-12">
                    <AlertCircle className="mx-auto h-12 w-12 text-orange-500 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      No Classes Assigned
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">
                      You need to be assigned to at least one class before you can create tests. 
                      Please contact your administrator to assign you to classes.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {teacherClasses.map((classItem) => {
                      const classTests = getTestsForClass(classItem.id);
                      const activeTests = classTests.filter(test => {
                        const status = getTestStatus(test);
                        return status.status === 'live' || status.status === 'active';
                      });

                      return (
                        <div
                          key={classItem.id}
                          onClick={() => handleClassClick(classItem.id)}
                          className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-700 dark:to-gray-600 rounded-lg p-6 cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
                        >
                          <div className="flex items-center justify-between mb-4">
                            <div className="bg-white dark:bg-gray-800 rounded-full p-3">
                              <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <span className="text-xs bg-blue-200 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 px-2 py-1 rounded-full">
                              {classItem.year}
                            </span>
                          </div>
                          
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            {classItem.name}
                          </h3>
                          
                          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                            {classItem.subject}
                          </p>
                          
                          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                            <span className="flex items-center">
                              <Users className="h-4 w-4 mr-1" />
                              {classItem.enrolledStudents || 0} students
                            </span>
                            <span className="flex items-center">
                              <FileText className="h-4 w-4 mr-1" />
                              {classTests.length} tests
                            </span>
                          </div>
                          
                          {activeTests.length > 0 && (
                            <div className="mt-3 flex items-center text-xs text-green-600 dark:text-green-400">
                              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                              {activeTests.length} active test{activeTests.length !== 1 ? 's' : ''}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Test Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Assigned Classes
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {loadingClasses ? '-' : teacherClasses.length}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {getTeacherSubjects().length} unique subject{getTeacherSubjects().length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center">
                  <FileText className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Total Tests
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {tests.length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center">
                  <Play className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Active Tests
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {tests.filter(test => {
                        const status = getTestStatus(test);
                        return status.status === 'live' || status.status === 'active';
                      }).length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center">
                  <Calendar className="h-8 w-8 text-orange-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Upcoming
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {tests.filter(test => getTestStatus(test).status === 'upcoming').length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center">
                  <BarChart3 className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Completed
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {tests.filter(test => getTestStatus(test).status === 'completed').length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          // Class Detail Mode - Show tests for selected class
          <>
            {(() => {
              const selectedClass = getSelectedClass();
              const classTests = selectedClassId ? getTestsForClass(selectedClassId) : [];

              return (
                <>
                  {/* Class Detail Header */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <button
                          onClick={handleBackToOverview}
                          className="mr-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <ArrowLeft className="h-5 w-5" />
                        </button>
                        <div>
                          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                            {selectedClass?.name} - Tests
                          </h1>
                          <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                            <span className="flex items-center">
                              <BookOpen className="h-4 w-4 mr-1" />
                              {selectedClass?.subject}
                            </span>
                            <span className="flex items-center">
                              <Users className="h-4 w-4 mr-1" />
                              {selectedClass?.enrolledStudents || 0} students
                            </span>
                            <span className="flex items-center">
                              <FileText className="h-4 w-4 mr-1" />
                              {classTests.length} tests created
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleCreateTestForClass(selectedClassId!)}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create Test
                      </button>
                    </div>
                  </div>

                  {/* Class Tests List */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                      <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                        Tests for {selectedClass?.name}
                      </h2>
                    </div>

                    <div className="p-6">
                      {classTests.length === 0 ? (
                        <div className="text-center py-12">
                          <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                            No tests created yet
                          </h3>
                          <p className="text-gray-500 dark:text-gray-400 mb-6">
                            Create your first test for {selectedClass?.name}
                          </p>
                          <button
                            onClick={() => handleCreateTestForClass(selectedClassId!)}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Create First Test
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {classTests.map((test) => {
                            const status = getTestStatus(test);
                            const isLive = test.type === 'live' ? test as LiveTest : null;

                            return (
                              <div
                                key={test.id}
                                className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow"
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-3 mb-2">
                                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                        {test.title}
                                      </h3>
                                      <span
                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                          status.color === 'green'
                                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                            : status.color === 'blue'
                                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                                            : status.color === 'orange'
                                            ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
                                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                                        }`}
                                      >
                                        {status.text}
                                      </span>
                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400">
                                        {test.type === 'live' ? 'Live Test' : 'Flexible'}
                                      </span>
                                    </div>

                                    {test.description && (
                                      <p className="text-gray-600 dark:text-gray-300 mb-3">
                                        {test.description}
                                      </p>
                                    )}

                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-gray-500 dark:text-gray-400">
                                      <div className="flex items-center space-x-1">
                                        <FileText className="h-4 w-4" />
                                        <span>{test.questions.length} questions</span>
                                      </div>
                                      <div className="flex items-center space-x-1">
                                        <Clock className="h-4 w-4" />
                                        <span>
                                          {test.type === 'live' 
                                            ? `${(test as LiveTest).duration} min`
                                            : `${(test as FlexibleTest).duration} min`
                                          }
                                        </span>
                                      </div>
                                      <div className="flex items-center space-x-1">
                                        <Calendar className="h-4 w-4" />
                                        <span>
                                          {test.type === 'live' 
                                            ? formatDateTime((test as LiveTest).scheduledStartTime)
                                            : `${formatDateTime((test as FlexibleTest).availableFrom)}`
                                          }
                                        </span>
                                      </div>
                                    </div>

                                    {isLive && status.status === 'live' && (
                                      <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                                        <div className="flex items-center space-x-2">
                                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                          <span className="text-sm font-medium text-green-800 dark:text-green-400">
                                            Test is currently live
                                          </span>
                                        </div>
                                        <div className="mt-1 text-xs text-green-600 dark:text-green-400">
                                          Students online: {isLive.studentsOnline} | Completed: {isLive.studentsCompleted}
                                        </div>
                                      </div>
                                    )}

                                    {status.status === 'upcoming' && (
                                      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                                        <div className="flex items-center space-x-2">
                                          <AlertCircle className="h-4 w-4 text-blue-600" />
                                          <span className="text-sm font-medium text-blue-800 dark:text-blue-400">
                                            {test.type === 'live' 
                                              ? `Students can join from ${formatDateTime((test as LiveTest).studentJoinTime)}`
                                              : `Available from ${formatDateTime((test as FlexibleTest).availableFrom)}`
                                            }
                                          </span>
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                  <div className="flex items-center space-x-2 ml-4">
                                    <button
                                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                      title="View Details"
                                    >
                                      <Eye className="h-4 w-4" />
                                    </button>
                                    <button
                                      className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                                      title="View Analytics"
                                    >
                                      <BarChart3 className="h-4 w-4" />
                                    </button>
                                    <button
                                      className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors"
                                      title="Settings"
                                    >
                                      <Settings className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() => deleteTest(test.id)}
                                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                      title="Delete Test"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              );
            })()}
          </>
        )}

        {/* Create Test Modal */}
        {showCreateModal && teacherClasses.length > 0 && (
          <CreateTestModal
            isOpen={showCreateModal}
            onClose={() => handleModalClose()}
            onTestCreated={handleTestCreated}
            subjectId={
              selectedClassId 
                ? getSelectedClass()?.subjectId || getTeacherSubjects()[0]?.id || ''
                : getTeacherSubjects()[0]?.id || ''
            }
            subjectName={
              selectedClassId 
                ? getSelectedClass()?.subject || getTeacherSubjects()[0]?.name || ''
                : getTeacherSubjects()[0]?.name || ''
            }
            selectedClassId={selectedClassId || undefined}
            availableClasses={
              selectedClassId
                ? teacherClasses.filter(cls => cls.id === selectedClassId).map(cls => ({
                    id: cls.id,
                    name: cls.name,
                    subject: cls.subject,
                    year: cls.year
                  }))
                : teacherClasses.map(cls => ({
                    id: cls.id,
                    name: cls.name,
                    subject: cls.subject,
                    year: cls.year
                  }))
            }
            questionBanks={
              // Filter question banks by subject
              questionBanks.filter(bank => {
                const currentSubjectId = selectedClassId 
                  ? getSelectedClass()?.subjectId 
                  : getTeacherSubjects()[0]?.id;
                console.log('🔍 Filtering question banks for subject:', currentSubjectId);
                console.log('🔍 Bank subject:', bank.subjectId, 'Bank name:', bank.name);
                return bank.subjectId === currentSubjectId;
              })
            }
          />
        )}

        {/* No Classes Assigned Modal/Message */}
        {showCreateModal && teacherClasses.length === 0 && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
              <div className="mt-3 text-center">
                <AlertCircle className="mx-auto h-16 w-16 text-orange-500" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mt-4">
                  No Classes Assigned
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 mb-6">
                  You need to be assigned to at least one class before you can create tests. 
                  Please contact your administrator to assign you to classes.
                </p>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Understood
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </TeacherLayout>
  );
}
