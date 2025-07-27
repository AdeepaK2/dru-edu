'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { 
  Users, 
  BookOpen, 
  Calendar, 
  FileText,
  Video,
  TrendingUp,
  Clock,
  Award,
  ChevronRight,
  BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui';
import { useTeacherAuth } from '@/hooks/useTeacherAuth';
import TeacherLayout from '@/components/teacher/TeacherLayout';
import Link from 'next/link';
import { useTeacherNavigation } from '@/hooks/useTeacherNavigation';
import { ClassFirestoreService } from '@/apiservices/classFirestoreService';
import { getTeacherClassCount } from '@/utils/teacher-class-utils';

export default function TeacherDashboard() {
  const { teacher, loading, error, isAuthenticated, isTeacher, user } = useTeacherAuth();
  const { preloadRoute } = useTeacherNavigation();

  // State for dynamic data
  const [actualClassesCount, setActualClassesCount] = useState<number>(0);
  const [loadingStats, setLoadingStats] = useState(false);

  // Load actual classes count when teacher is available
  useEffect(() => {
    const loadActualStats = async () => {
      if (!teacher?.id) return;
      
      try {
        setLoadingStats(true);
        console.log('🔍 Loading actual classes for teacher:', teacher.id);
        
        // Use utility function for consistency
        const classCount = await getTeacherClassCount(teacher.id);
        console.log('📊 Found classes:', classCount);
        setActualClassesCount(classCount);
      } catch (error) {
        console.error('❌ Error loading teacher classes:', error);
        // Fallback to deprecated field if available, otherwise 0
        setActualClassesCount(teacher.classesAssigned || 0);
      } finally {
        setLoadingStats(false);
      }
    };

    loadActualStats();
  }, [teacher?.id, teacher?.classesAssigned]);

  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  // Get current date and time in Melbourne timezone - memoized for performance
  const melbourneDateTime = useMemo(() => {
    return new Intl.DateTimeFormat('en-AU', {
      timeZone: 'Australia/Melbourne',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date());
  }, []);

  // Memoized dashboard stats to prevent unnecessary recalculations
  const dashboardStats = useMemo(() => ({
    totalClasses: actualClassesCount, // Use actual count instead of profile field
    totalStudents: teacher?.studentsCount || 45,
    pendingTests: 2,
    videosUploaded: 12,
    avgGrade: 85.4
  }), [actualClassesCount, teacher]);

  // Memoized activities data
  const recentActivities = useMemo(() => [
    { id: 1, type: 'test', description: 'New test results available for Grade 10 Math', time: '2 hours ago' },
    { id: 2, type: 'video', description: 'Uploaded new lesson video: Algebra Basics', time: '1 day ago' },
    { id: 3, type: 'grade', description: 'Graded 15 assignments for Grade 9 Math', time: '2 days ago' },
    { id: 4, type: 'class', description: 'Upcoming class: Grade 10 Advanced Math', time: 'Tomorrow 9:00 AM' }
  ], []);

  // Memoized quick actions with preloading
  const quickActions = useMemo(() => [
    { 
      id: 'classes', 
      title: 'View My Classes', 
      description: 'See all assigned classes and students',
      icon: Users,
      href: '/teacher/classes',
      color: 'bg-blue-500'
    },
    { 
      id: 'videos', 
      title: 'Upload Video', 
      description: 'Add new lesson videos for students',
      icon: Video,
      href: '/teacher/videos',
      color: 'bg-purple-500'
    },
    { 
      id: 'tests', 
      title: 'Create Test', 
      description: 'Design new tests and quizzes',
      icon: FileText,
      href: '/teacher/tests',
      color: 'bg-green-500'
    },
    { 
      id: 'questions', 
      title: 'Question Bank', 
      description: 'Manage subject questions',
      icon: BookOpen,
      href: '/teacher/questions',
      color: 'bg-orange-500'
    }
  ], []);

  // Debug logging
  React.useEffect(() => {
    console.log('🔍 Teacher Dashboard Debug:', {
      loading,
      error,
      isAuthenticated,
      isTeacher,
      teacher: teacher ? { 
        id: teacher.id, 
        name: teacher.name, 
        email: teacher.email,
        subjects: teacher.subjects,
        deprecatedClassesAssigned: teacher.classesAssigned, // This field is deprecated
        actualClassesCount,
        studentsCount: teacher.studentsCount
      } : null,
      user: user ? { uid: user.uid, email: user.email } : null,
      loadingStats
    });
  }, [loading, error, isAuthenticated, isTeacher, teacher, user, actualClassesCount, loadingStats]);

  // NOW WE CAN SAFELY USE CONDITIONAL RETURNS
  // Show loading state
  if (loading) {
    return (
      <TeacherLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading teacher dashboard...</p>
          </div>
        </div>
      </TeacherLayout>
    );
  }

  // Show error state
  if (error || !isAuthenticated || !isTeacher) {
    return (
      <TeacherLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Authentication Required
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {error || 'Please log in with a valid teacher account to access the dashboard.'}
            </p>
            <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-md mb-4 text-left text-sm">
              <strong>Debug Info:</strong>
              <div>Loading: {loading ? 'Yes' : 'No'}</div>
              <div>Authenticated: {isAuthenticated ? 'Yes' : 'No'}</div>
              <div>Is Teacher: {isTeacher ? 'Yes' : 'No'}</div>
              <div>Error: {error || 'None'}</div>
              <div>User Email: {user?.email || 'None'}</div>
            </div>
            <Button onClick={() => window.location.href = '/auth/teacher/login'}>
              Go to Teacher Login
            </Button>
          </div>
        </div>
      </TeacherLayout>
    );
  }

  // If no teacher data but authenticated, show fallback
  if (!teacher) {
    return (
      <TeacherLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Profile Setup Required
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Your teacher profile needs to be completed. Please contact the administrator.
            </p>
          </div>
        </div>
      </TeacherLayout>
    );
  }

  return (
    <TeacherLayout>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl text-white p-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Welcome back, {teacher?.name}!
              </h1>
              <p className="text-blue-100 mb-4">
                Ready to inspire and educate your students today?
              </p>
              <div className="flex items-center space-x-2 text-blue-100">
                <Clock className="w-4 h-4" />
                <span className="text-sm">{melbourneDateTime}</span>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="w-24 h-24 bg-blue-400/30 rounded-full flex items-center justify-center">
                <Award className="w-12 h-12 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">Classes</p>
                <div className="flex items-center">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {loadingStats ? (
                      <span className="inline-block w-8 h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></span>
                    ) : (
                      dashboardStats.totalClasses
                    )}
                  </p>
                  {loadingStats && (
                    <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">Loading...</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">Students</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {dashboardStats.totalStudents}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">Pending Tests</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {dashboardStats.pendingTests}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                <Video className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">Videos</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {dashboardStats.videosUploaded}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">Avg Grade</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {dashboardStats.avgGrade}%
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.id}
                    href={action.href}
                    className="group p-4 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 transition-all duration-200 hover:shadow-md"
                    onMouseEnter={() => preloadRoute(action.href)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`w-10 h-10 ${action.color} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {action.title}
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {action.description}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Recent Activity
              </h3>
              <Button variant="outline" size="sm">
                View All
              </Button>
            </div>
            
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    activity.type === 'test' ? 'bg-green-500' :
                    activity.type === 'video' ? 'bg-purple-500' :
                    activity.type === 'grade' ? 'bg-blue-500' :
                    'bg-orange-500'
                  }`}></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900 dark:text-white">
                      {activity.description}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Subject Performance Overview */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            {teacher?.subjects && teacher.subjects.length > 0 
              ? teacher.subjects.length === 1 
                ? `${teacher.subjects[0]} Performance Overview`
                : 'Subjects Performance Overview'
              : 'Subject Performance Overview'
            }
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-1">Class Average</h4>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">85.4%</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">+2.3% from last month</p>
            </div>
            
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-1">Active Students</h4>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">42/45</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">93% attendance rate</p>
            </div>
            
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-1">This Week</h4>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">8</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Classes scheduled</p>
            </div>
          </div>
        </div>
      </div>
    </TeacherLayout>
  );
}
