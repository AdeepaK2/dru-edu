'use client';

import React, { useState, useEffect } from 'react';
import { 
  Video, 
  Play, 
  Search, 
  BookOpen,
  Users,
  GraduationCap
} from 'lucide-react';
import { useStudentAuth } from '@/hooks/useStudentAuth';
import Link from 'next/link';

// Import services and types
import { ClassFirestoreService } from '@/apiservices/classFirestoreService';
import { TeacherFirestoreService } from '@/apiservices/teacherFirestoreService';
import { getEnrollmentsByStudent } from '@/services/studentEnrollmentService';

export default function StudentVideos() {
  const { student } = useStudentAuth();
  const [studentClasses, setStudentClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Load student's classes
  useEffect(() => {
    const loadStudentClasses = async () => {
      if (!student?.id) return;
      
      console.log('🔍 Student object in videos page:', student);
      
      setLoading(true);
      setError(null);
      
      try {
        // Get student's enrollments first
        const enrollments = await getEnrollmentsByStudent(student.id);
        console.log('🔍 Student enrollments loaded:', enrollments);
        
        // Filter for active enrollments only
        const activeEnrollments = enrollments.filter(enrollment => 
          enrollment.status === 'Active'
        );
        
        // Get class details for each active enrollment
        const classesWithDetails = await Promise.all(
          activeEnrollments.map(async (enrollment) => {
            try {
              const classDetails = await ClassFirestoreService.getClassById(enrollment.classId);
              
              // Get teacher information if teacherId is available
              let teacherName = 'Teacher';
              if (classDetails?.teacherId) {
                try {
                  const teacher = await TeacherFirestoreService.getTeacherById(classDetails.teacherId);
                  teacherName = teacher ? teacher.name : 'Teacher';
                } catch (teacherErr) {
                  console.error(`Error loading teacher ${classDetails.teacherId}:`, teacherErr);
                }
              }
              
              return {
                id: enrollment.classId,
                name: enrollment.className,
                subject: enrollment.subject,
                grade: classDetails?.year || 'N/A',
                teacherName: teacherName,
                description: classDetails?.description || enrollment.className,
                enrollmentId: enrollment.id,
                enrolledAt: enrollment.enrolledAt
              };
            } catch (err) {
              console.error(`Error loading class details for ${enrollment.classId}:`, err);
              // Return basic info from enrollment if class fetch fails
              return {
                id: enrollment.classId,
                name: enrollment.className,
                subject: enrollment.subject,
                grade: 'N/A',
                teacherName: 'Teacher',
                description: enrollment.className,
                enrollmentId: enrollment.id,
                enrolledAt: enrollment.enrolledAt
              };
            }
          })
        );
        
        console.log('🔍 Student classes with details loaded:', classesWithDetails);
        setStudentClasses(classesWithDetails);
        
      } catch (err: any) {
        console.error('Error loading student classes:', err);
        setError(err.message || 'Failed to load classes');
      } finally {
        setLoading(false);
      }
    };
    
    loadStudentClasses();
  }, [student?.id]);

  // Filter classes by search term
  const getFilteredClasses = () => {
    if (!searchTerm) return studentClasses;
    
    return studentClasses.filter(cls =>
      cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cls.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cls.teacherName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-t-4 border-blue-600 border-solid rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300 font-medium">Loading classes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Video Library
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Select a class to browse and watch educational videos
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center bg-green-50 dark:bg-green-900/20 px-4 py-2 rounded-lg">
              <Users className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" />
              <span className="text-green-600 dark:text-green-400 font-medium">
                {studentClasses.length} Classes
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error</h3>
              <p className="mt-1 text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search classes..."
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            className="pl-10 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>

      {/* Classes Grid */}
      <div>
        {getFilteredClasses().length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
            <GraduationCap className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {searchTerm ? 'No classes found' : 'No classes available'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm 
                ? 'Try adjusting your search criteria'
                : 'You are not enrolled in any classes yet'
              }
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {getFilteredClasses().map((classInfo) => (
                <ClassCard
                  key={classInfo.id}
                  classInfo={classInfo}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Class Card Component
interface ClassCardProps {
  classInfo: any;
}

const ClassCard: React.FC<ClassCardProps> = ({ classInfo }) => {
  return (
    <Link href={`/student/classes/${classInfo.id}/videos`}>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow cursor-pointer group">
        {/* Class Header */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold truncate mb-1">
                {classInfo.name}
              </h3>
              <p className="text-green-100 text-sm">
                {classInfo.subject} • Grade {classInfo.grade}
              </p>
            </div>
            <Video className="w-8 h-8 text-white opacity-80 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        {/* Class Info */}
        <div className="p-4">
          <div className="space-y-3">
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <Users className="w-4 h-4 mr-2 flex-shrink-0" />
              <span className="truncate">{classInfo.teacherName}</span>
            </div>
            
            <div className="flex items-start text-sm text-gray-600 dark:text-gray-400">
              <BookOpen className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
              <span className="line-clamp-2 break-words overflow-hidden">
                {classInfo.description && classInfo.description.length > 100 
                  ? `${classInfo.description.substring(0, 100)}...`
                  : classInfo.description || 'Explore video content for this class'
                }
              </span>
            </div>
            
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">
                  Browse Videos
                </span>
                <div className="flex items-center space-x-1 text-green-600 dark:text-green-400 group-hover:text-green-700 dark:group-hover:text-green-300 transition-colors">
                  <Play className="w-4 h-4" />
                  <span className="font-medium">Open</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};
