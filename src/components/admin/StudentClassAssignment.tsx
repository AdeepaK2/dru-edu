'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  X, 
  Search, 
  BookOpen, 
  Calendar,
  Trophy,
  AlertCircle,
  Loader2,
  Check
} from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { StudentDocument } from '@/models/studentSchema';
import { ClassDocument } from '@/models/classSchema';
import { StudentEnrollment } from '@/models/studentEnrollmentSchema';
import { 
  createStudentEnrollment,
  getEnrollmentsByStudent,
  removeStudentFromClass,
  getEnrollmentsByClass
} from '@/services/studentEnrollmentService';

interface StudentClassAssignmentProps {
  student: StudentDocument;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export default function StudentClassAssignment({ 
  student, 
  onClose, 
  onSuccess, 
  onError 
}: StudentClassAssignmentProps) {
  const [classes, setClasses] = useState<ClassDocument[]>([]);
  const [enrollments, setEnrollments] = useState<StudentEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch available classes and student's current enrollments
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch classes from API
        const classResponse = await fetch('/api/classes');
        if (!classResponse.ok) {
          throw new Error('Failed to fetch classes');
        }
        const classesData = await classResponse.json();
        setClasses(classesData);

        // Fetch student's current enrollments
        const studentEnrollments = await getEnrollmentsByStudent(student.id);
        setEnrollments(studentEnrollments);

      } catch (error) {
        console.error('Error fetching data:', error);
        onError('Failed to load class data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [student.id, onError]);

  // Filter classes based on search term
  const filteredClasses = classes.filter(cls =>
    cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cls.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Check if student is enrolled in a class
  const isEnrolled = (classId: string) => {
    return enrollments.some(enrollment => 
      enrollment.classId === classId && 
      enrollment.status === 'Active'
    );
  };

  // Handle enrolling student in a class
  const handleEnrollStudent = async (classData: ClassDocument) => {
    try {
      setActionLoading(classData.id);
      
      await createStudentEnrollment({
        studentId: student.id,
        studentName: student.name,
        studentEmail: student.email,
        classId: classData.id,
        className: classData.name,
        subject: classData.subject,
        enrolledAt: new Date(),
        status: 'Active',
        attendance: 0,
      });

      // Refresh enrollments
      const updatedEnrollments = await getEnrollmentsByStudent(student.id);
      setEnrollments(updatedEnrollments);

      onSuccess(`${student.name} enrolled in ${classData.name} successfully`);
    } catch (error: any) {
      console.error('Error enrolling student:', error);
      onError(error.message || 'Failed to enroll student in class');
    } finally {
      setActionLoading(null);
    }
  };

  // Handle removing student from a class
  const handleRemoveStudent = async (classData: ClassDocument) => {
    try {
      setActionLoading(classData.id);
      
      await removeStudentFromClass(student.id, classData.id);

      // Refresh enrollments
      const updatedEnrollments = await getEnrollmentsByStudent(student.id);
      setEnrollments(updatedEnrollments);

      onSuccess(`${student.name} removed from ${classData.name} successfully`);
    } catch (error: any) {
      console.error('Error removing student:', error);
      onError(error.message || 'Failed to remove student from class');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-2xl mx-4">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600 dark:text-gray-300">Loading classes...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Manage Class Assignments
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Student: {student.name}
              </p>
            </div>
          </div>
          <Button
            onClick={onClose}
            variant="outline"
            size="sm"
            className="p-2"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Current Enrollments Summary */}
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-blue-900 dark:text-blue-300">
              Current Enrollments: {enrollments.filter(e => e.status === 'Active').length}
            </span>
          </div>
          {enrollments.filter(e => e.status === 'Active').length > 0 && (
            <div className="text-xs text-blue-700 dark:text-blue-400">
              Enrolled in {enrollments.filter(e => e.status === 'Active').length} active classes
            </div>
          )}
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search classes by name, subject, or teacher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Classes List */}
        <div className="overflow-y-auto max-h-96">
          {filteredClasses.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No classes found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredClasses.map((classData) => {
                const enrolled = isEnrolled(classData.id);
                const isLoading = actionLoading === classData.id;

                return (
                  <div
                    key={classData.id}
                    className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                          <BookOpen className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {classData.name}
                          </h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                            <span>{classData.subject}</span>
                            {classData.teacherId && (
                              <span>Teacher Assigned</span>
                            )}
                            <div className="flex items-center space-x-1">
                              <Users className="w-3 h-3" />
                              <span>{classData.enrolledStudents || 0} students</span>
                            </div>
                          </div>
                          {classData.schedule && classData.schedule.length > 0 && (
                            <div className="flex items-center space-x-1 text-xs text-gray-400 mt-1">
                              <Calendar className="w-3 h-3" />
                              <span>
                                {classData.schedule.map(slot => 
                                  `${slot.day}: ${slot.startTime} - ${slot.endTime}`
                                ).join(', ')}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {enrolled && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                          <Check className="w-3 h-3 mr-1" />
                          Enrolled
                        </span>
                      )}
                      
                      <Button
                        onClick={() => enrolled ? handleRemoveStudent(classData) : handleEnrollStudent(classData)}
                        disabled={isLoading}
                        size="sm"
                        variant={enrolled ? "outline" : "primary"}
                        className={enrolled ? 
                          "text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300" : 
                          "bg-blue-600 hover:bg-blue-700"
                        }
                      >
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : enrolled ? (
                          <>
                            <X className="w-4 h-4 mr-1" />
                            Remove
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4 mr-1" />
                            Enroll
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
          <div className="flex justify-end">
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
