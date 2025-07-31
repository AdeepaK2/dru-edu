'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  BookOpen, 
  Clock, 
  Users, 
  Calendar, 
  TrendingUp, 
  CheckCircle, 
  AlertCircle,
  PlayCircle,
  FileText,
  ExternalLink,
  ArrowRight,
  GraduationCap,
  Target,
  Award
} from 'lucide-react';
import { Button } from '@/components/ui';
import { useStudentAuth } from '@/hooks/useStudentAuth';
import { getEnrollmentsByStudent } from '@/services/studentEnrollmentService';
import { getStudyMaterialsByClassGroupedByWeek } from '@/apiservices/studyMaterialFirestoreService';
import { StudentEnrollment } from '@/models/studentEnrollmentSchema';

interface ClassProgress {
  classId: string;
  className: string;
  subject: string;
  totalMaterials: number;
  completedMaterials: number;
  requiredMaterials: number;
  completedRequiredMaterials: number;
  recentMaterials: number; // Materials uploaded in last 7 days
  progressPercentage: number;
  requiredProgressPercentage: number;
}

export default function StudentDashboard() {
  const router = useRouter();
  const { student, loading: authLoading } = useStudentAuth();
  const [enrollments, setEnrollments] = useState<StudentEnrollment[]>([]);
  const [classProgress, setClassProgress] = useState<ClassProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load student enrollments and calculate progress
  useEffect(() => {
    const loadStudentData = async () => {
      if (!student?.id) return;

      try {
        setLoading(true);
        setError(null);

        // Get student's enrollments
        const studentEnrollments = await getEnrollmentsByStudent(student.id);
        const activeEnrollments = studentEnrollments.filter(e => e.status === 'Active');
        setEnrollments(activeEnrollments);

        // Calculate progress for each class
        const currentYear = new Date().getFullYear();
        const progressData: ClassProgress[] = [];
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        for (const enrollment of activeEnrollments) {
          try {
            const weeklyMaterials = await getStudyMaterialsByClassGroupedByWeek(
              enrollment.classId, 
              currentYear
            );

            let totalMaterials = 0;
            let completedMaterials = 0;
            let requiredMaterials = 0;
            let completedRequiredMaterials = 0;
            let recentMaterials = 0;

            weeklyMaterials.forEach(week => {
              week.materials.forEach(material => {
                totalMaterials++;
                if (material.isRequired) requiredMaterials++;
                if (material.completedBy?.includes(student.id)) {
                  completedMaterials++;
                  if (material.isRequired) completedRequiredMaterials++;
                }
                
                // Check if material was uploaded in the last 7 days
                const uploadDate = material.uploadedAt instanceof Date 
                  ? material.uploadedAt 
                  : material.uploadedAt.toDate();
                if (uploadDate >= oneWeekAgo) {
                  recentMaterials++;
                }
              });
            });

            const progressPercentage = totalMaterials > 0 
              ? Math.round((completedMaterials / totalMaterials) * 100) 
              : 0;

            const requiredProgressPercentage = requiredMaterials > 0 
              ? Math.round((completedRequiredMaterials / requiredMaterials) * 100) 
              : 100;

            progressData.push({
              classId: enrollment.classId,
              className: enrollment.className,
              subject: enrollment.subject,
              totalMaterials,
              completedMaterials,
              requiredMaterials,
              completedRequiredMaterials,
              recentMaterials,
              progressPercentage,
              requiredProgressPercentage
            });
          } catch (classError) {
            console.error(`Error loading materials for class ${enrollment.className}:`, classError);
          }
        }

        setClassProgress(progressData);
      } catch (err) {
        console.error('Error loading student dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    if (student?.id) {
      loadStudentData();
    }
  }, [student?.id]);

  const navigateToClass = (classId: string) => {
    router.push(`/student/classes/${classId}`);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400';
    if (percentage >= 60) return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400';
    if (percentage >= 40) return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400';
    return 'text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400';
  };

  const getRequiredProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 70) return 'text-blue-600';
    if (percentage >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-t-2 border-blue-600 border-solid rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Please log in to view your dashboard.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Error Loading Dashboard</h3>
          <p className="text-gray-500 dark:text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  const totalMaterials = classProgress.reduce((sum, c) => sum + c.totalMaterials, 0);
  const totalCompleted = classProgress.reduce((sum, c) => sum + c.completedMaterials, 0);
  const totalRequired = classProgress.reduce((sum, c) => sum + c.requiredMaterials, 0);
  const totalRequiredCompleted = classProgress.reduce((sum, c) => sum + c.completedRequiredMaterials, 0);
  const totalRecent = classProgress.reduce((sum, c) => sum + c.recentMaterials, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg shadow text-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Welcome back, {student.name}!</h1>
            <p className="text-blue-100">
              Continue your learning journey and track your progress
            </p>
          </div>
          <div className="hidden md:block">
            <div className="w-16 h-16 bg-blue-400/30 rounded-full flex items-center justify-center">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Overall Progress Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center">
            <BookOpen className="w-8 h-8 text-blue-500 mr-3" />
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{enrollments.length}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Enrolled Classes</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center">
            <CheckCircle className="w-8 h-8 text-green-500 mr-3" />
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {totalCompleted}/{totalMaterials}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Materials Completed</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Target className="w-8 h-8 text-orange-500 mr-3" />
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {totalRequiredCompleted}/{totalRequired}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Required Completed</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center">
            <TrendingUp className="w-8 h-8 text-purple-500 mr-3" />
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {totalMaterials > 0 ? Math.round((totalCompleted / totalMaterials) * 100) : 0}%
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Overall Progress</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      {totalRecent > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">Last 7 days</span>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-center">
              <Clock className="w-5 h-5 text-blue-500 mr-3" />
              <p className="text-blue-800 dark:text-blue-200">
                <span className="font-semibold">{totalRecent} new materials</span> have been uploaded to your classes
              </p>
            </div>
          </div>
        </div>
      )}

      {/* My Classes */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="border-b border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">My Classes</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Click on any class to access study materials and track your progress
          </p>
        </div>

        {enrollments.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Classes Enrolled</h3>
            <p className="text-gray-500 dark:text-gray-400">
              Contact your teacher or admin to get enrolled in classes.
            </p>
          </div>
        ) : (
          <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {classProgress.map((classData) => (
              <div 
                key={classData.classId} 
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-lg transition-all duration-200 cursor-pointer hover:border-blue-300 dark:hover:border-blue-600"
                onClick={() => navigateToClass(classData.classId)}
              >
                {/* Class Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                      {classData.className}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {classData.subject}
                    </p>
                    
                    {/* Recent Activity Badge */}
                    {classData.recentMaterials > 0 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300 mb-3">
                        <Clock className="w-3 h-3 mr-1" />
                        {classData.recentMaterials} new materials
                      </span>
                    )}
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                </div>

                {/* Progress Section */}
                <div className="space-y-3">
                  {/* Overall Progress */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600 dark:text-gray-400">Overall Progress</span>
                      <span className={`font-medium ${getProgressColor(classData.progressPercentage).split(' ')[0]}`}>
                        {classData.progressPercentage}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          classData.progressPercentage >= 80 ? 'bg-green-500' :
                          classData.progressPercentage >= 60 ? 'bg-blue-500' :
                          classData.progressPercentage >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${classData.progressPercentage}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Required Materials Progress */}
                  {classData.requiredMaterials > 0 && (
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600 dark:text-gray-400">Required Materials</span>
                        <span className={`font-medium ${getRequiredProgressColor(classData.requiredProgressPercentage)}`}>
                          {classData.completedRequiredMaterials}/{classData.requiredMaterials}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${
                            classData.requiredProgressPercentage >= 90 ? 'bg-green-500' :
                            classData.requiredProgressPercentage >= 70 ? 'bg-blue-500' :
                            classData.requiredProgressPercentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${classData.requiredProgressPercentage}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Stats Row */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <BookOpen className="w-4 h-4 mr-1" />
                    {classData.totalMaterials} materials
                  </div>
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    {classData.completedMaterials} completed
                  </div>
                </div>

                {/* Action Button */}
                <Button 
                  className="w-full mt-4"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateToClass(classData.classId);
                  }}
                >
                  <PlayCircle className="w-4 h-4 mr-2" />
                  Continue Learning
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button 
            variant="outline" 
            className="flex items-center justify-center p-4 h-auto"
            onClick={() => router.push('/student/study')}
          >
            <BookOpen className="w-5 h-5 mr-2" />
            <div className="text-left">
              <p className="font-medium">Study Materials</p>
              <p className="text-xs text-gray-500">Browse all materials</p>
            </div>
          </Button>
          
          <Button 
            variant="outline" 
            className="flex items-center justify-center p-4 h-auto"
            onClick={() => router.push('/student/progress')}
          >
            <TrendingUp className="w-5 h-5 mr-2" />
            <div className="text-left">
              <p className="font-medium">Progress Report</p>
              <p className="text-xs text-gray-500">View detailed progress</p>
            </div>
          </Button>
          
          <Button 
            variant="outline" 
            className="flex items-center justify-center p-4 h-auto"
            onClick={() => router.push('/student/schedule')}
          >
            <Calendar className="w-5 h-5 mr-2" />
            <div className="text-left">
              <p className="font-medium">Class Schedule</p>
              <p className="text-xs text-gray-500">View upcoming classes</p>
            </div>
          </Button>
        </div>
      </div>
    </div>
  );
}
