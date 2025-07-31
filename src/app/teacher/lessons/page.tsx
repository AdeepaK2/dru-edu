'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  BookOpen, 
  GraduationCap,
  AlertCircle,
  Settings
} from 'lucide-react';
import { SubjectFirestoreService } from '@/apiservices/subjectFirestoreService';
import { useTeacherAuth } from '@/hooks/useTeacherAuth';
import TeacherLayout from '@/components/teacher/TeacherLayout';
import { Button, Input, useToast } from '@/components/ui';
import LessonManagementModal from '@/components/modals/LessonManagementModal';

interface SubjectCard {
  id: string;
  name: string;
  description?: string;
  grade?: string;
  isActive: boolean;
}

export default function TeacherLessons() {
  const router = useRouter();
  const { teacher } = useTeacherAuth();
  const { showToast } = useToast();

  // State management
  const [subjects, setSubjects] = useState<SubjectCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters and search
  const [searchTerm, setSearchTerm] = useState('');

  // Lesson management modal state
  const [lessonModalOpen, setLessonModalOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<SubjectCard | null>(null);

  // Load subjects for teacher
  useEffect(() => {
    const loadSubjects = async () => {
      console.log('🔍 Loading subjects for teacher:', {
        teacher: teacher ? {
          id: teacher.id,
          name: teacher.name,
          subjects: teacher.subjects
        } : null
      });
      
      if (!teacher) {
        console.log('❌ No teacher found, skipping subject load');
        return;
      }
      
      if (!teacher.subjects || teacher.subjects.length === 0) {
        console.log('❌ Teacher has no subjects assigned:', teacher.subjects);
        setSubjects([]);
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        console.log('📚 Fetching all subjects from Firestore...');
        // Get all subjects and filter for teacher's subjects
        const allSubjects = await SubjectFirestoreService.getAllSubjects();
        console.log('📋 All subjects from Firestore:', allSubjects.length);
        console.log('📋 All subjects detailed:', allSubjects.map(s => ({
          id: s.id,
          name: s.name,
          subjectId: s.subjectId,
          grade: s.grade,
          combined: `${s.name}-Grade ${s.grade}`
        })));
        console.log('🎯 Teacher assigned subjects:', teacher.subjects);
        console.log('🎯 Teacher subjects type:', typeof teacher.subjects, Array.isArray(teacher.subjects));
        
        const teacherSubjects = allSubjects
          .filter(subject => {
            // Try multiple matching strategies
            const matchByName = teacher.subjects?.includes(subject.name);
            const matchBySubjectId = teacher.subjects?.includes(subject.subjectId);
            const matchByFirestoreId = teacher.subjects?.includes(subject.id);
            
            // Try combined name-grade format
            const combinedNameGrade = `${subject.name}-Grade ${subject.grade}`;
            const matchByCombined = teacher.subjects?.includes(combinedNameGrade);
            
            // Try partial matching (if teacher subject contains the subject name)
            const matchByPartialName = teacher.subjects?.some(teacherSubj => 
              teacherSubj.toLowerCase().includes(subject.name.toLowerCase()) ||
              subject.name.toLowerCase().includes(teacherSubj.toLowerCase())
            );
            
            const isMatch = matchByName || matchBySubjectId || matchByFirestoreId || matchByCombined || matchByPartialName;
            
            console.log(`🔍 Checking subject:`, {
              name: subject.name,
              subjectId: subject.subjectId,
              firestoreId: subject.id,
              grade: subject.grade,
              combinedNameGrade,
              teacherSubjects: teacher.subjects,
              matchByName,
              matchBySubjectId,
              matchByFirestoreId,
              matchByCombined,
              matchByPartialName,
              finalResult: isMatch ? 'MATCH ✅' : 'NO MATCH ❌'
            });
            return isMatch;
          })
          .map(subject => ({
            id: subject.id,
            name: subject.name,
            description: subject.description,
            grade: subject.grade,
            isActive: subject.isActive
          }));
        
        console.log('✅ Filtered teacher subjects:', teacherSubjects.length, teacherSubjects.map(s => s.name));
        setSubjects(teacherSubjects);
      } catch (err: any) {
        console.error("❌ Error loading subjects:", err);
        setError(err.message || 'Failed to load subjects');
      } finally {
        setLoading(false);
      }
    };
    
    loadSubjects();
  }, [teacher]);

  // Filter subjects based on search
  const filteredSubjects = subjects.filter(subject =>
    subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (subject.description && subject.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Handle manage lessons click
  const handleManageLessons = (subject: SubjectCard) => {
    setSelectedSubject(subject);
    setLessonModalOpen(true);
  };

  if (loading) {
    return (
      <TeacherLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-16 h-16 border-t-4 border-blue-600 border-solid rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-300 font-medium">Loading subjects...</p>
          </div>
        </div>
      </TeacherLayout>
    );
  }

  return (
    <TeacherLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Lesson Management
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Manage lessons for your subjects
              </p>
            </div>
            <div className="flex items-center bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-lg">
              <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
              <span className="text-blue-600 dark:text-blue-400 font-medium">
                {subjects.length} Subject{subjects.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error</h3>
                <p className="mt-1 text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search subjects..."
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Subjects Grid */}
        {filteredSubjects.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No subjects found</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {searchTerm ? 'Try adjusting your search criteria' : 'No subjects assigned to you'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSubjects.map((subject) => (
              <div key={subject.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {subject.name}
                    </h3>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      subject.isActive 
                        ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300'
                        : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300'
                    }`}>
                      {subject.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  {subject.grade && (
                    <div className="flex items-center space-x-2 mb-3">
                      <span className="bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 text-xs font-medium px-2.5 py-0.5 rounded-full">
                        <GraduationCap className="w-3 h-3 inline mr-1" />
                        {subject.grade}
                      </span>
                    </div>
                  )}
                  
                  {subject.description && (
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3">
                      {subject.description}
                    </p>
                  )}
                  
                  <div className="mt-4">
                    <Button
                      onClick={() => handleManageLessons(subject)}
                      className="w-full flex items-center justify-center space-x-2"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Manage Lessons</span>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Lesson Management Modal */}
        {lessonModalOpen && selectedSubject && (
          <LessonManagementModal
            isOpen={lessonModalOpen}
            onClose={() => {
              setLessonModalOpen(false);
              setSelectedSubject(null);
            }}
            subjectId={selectedSubject.id}
            subjectName={selectedSubject.name}
          />
        )}
      </div>
    </TeacherLayout>
  );
}
