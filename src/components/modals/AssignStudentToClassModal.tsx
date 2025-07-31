'use client';

import React, { useState, useEffect } from 'react';
import { UserPlus, X, Check, Loader2, BookOpen, Users } from 'lucide-react';
import { Button, Modal, Select } from '@/components/ui';
import { StudentDocument } from '@/models/studentSchema';
import { ClassDocument } from '@/models/classSchema';
import { 
  createStudentEnrollment, 
  getEnrollmentsByStudent, 
  deleteStudentEnrollment 
} from '@/services/studentEnrollmentService';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { firestore } from '@/utils/firebase-client';

interface AssignStudentToClassModalProps {
  student: StudentDocument;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export default function AssignStudentToClassModal({
  student,
  isOpen,
  onClose,
  onSuccess,
  onError,
}: AssignStudentToClassModalProps) {
  const [classes, setClasses] = useState<ClassDocument[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingEnrollments, setLoadingEnrollments] = useState(true);

  // Load classes and enrollments when modal opens
  useEffect(() => {
    if (!isOpen || !student) return;

    // Load available classes
    const classesQuery = query(
      collection(firestore, 'classes'),
      orderBy('name', 'asc')
    );

    const unsubscribeClasses = onSnapshot(classesQuery, (snapshot) => {
      const classesData: ClassDocument[] = [];
      snapshot.forEach((doc) => {
        classesData.push({
          id: doc.id,
          ...doc.data(),
        } as ClassDocument);
      });
      setClasses(classesData);
      setLoadingClasses(false);
    });

    // Load student's current enrollments
    const loadEnrollments = async () => {
      try {
        const studentEnrollments = await getEnrollmentsByStudent(student.id);
        setEnrollments(studentEnrollments);
      } catch (error) {
        console.error('Error loading enrollments:', error);
      } finally {
        setLoadingEnrollments(false);
      }
    };

    loadEnrollments();

    return () => {
      unsubscribeClasses();
    };
  }, [isOpen, student]);

  // Get available classes (not already enrolled)
  const availableClasses = classes.filter(cls => 
    !enrollments.some(enrollment => enrollment.classId === cls.id && enrollment.status === 'Active')
  );

  const handleAssign = async () => {
    if (!selectedClassId) return;

    setLoading(true);
    
    try {
      const selectedClass = classes.find(cls => cls.id === selectedClassId);
      if (!selectedClass) {
        throw new Error('Selected class not found');
      }

      await createStudentEnrollment({
        studentId: student.id,
        classId: selectedClass.id,
        studentName: student.name,
        studentEmail: student.email,
        className: selectedClass.name,
        subject: selectedClass.subject,
        enrolledAt: new Date(),
        status: 'Active',
        attendance: 0,
      });

      // Refresh enrollments to show the new assignment
      const updatedEnrollments = await getEnrollmentsByStudent(student.id);
      setEnrollments(updatedEnrollments);

      onSuccess(`${student.name} has been successfully assigned to ${selectedClass.name}`);
      setSelectedClassId('');
      // Don't close modal immediately so user can see the result
    } catch (error) {
      console.error('Error assigning student to class:', error);
      onError(error instanceof Error ? error.message : 'Failed to assign student to class');
    } finally {
      setLoading(false);
    }
  };

  const handleUnenroll = async (enrollmentId: string, className: string) => {
    try {
      await deleteStudentEnrollment(enrollmentId);
      onSuccess(`${student.name} has been removed from ${className}`);
      
      // Refresh enrollments
      const updatedEnrollments = await getEnrollmentsByStudent(student.id);
      setEnrollments(updatedEnrollments);
    } catch (error) {
      console.error('Error removing student from class:', error);
      onError(error instanceof Error ? error.message : 'Failed to remove student from class');
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Manage Class Assignments">
      <div className="p-6 space-y-8">
        {/* Student Info */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{student.name}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">{student.email}</p>
            </div>
          </div>
        </div>

        {/* Current Enrollments */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Current Enrollments</h4>
          
          {loadingEnrollments ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : enrollments.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-gray-500 dark:text-gray-400">No current enrollments</p>
            </div>
          ) : (
            <div className="space-y-3">
              {enrollments.map((enrollment) => (
                <div
                  key={enrollment.id}
                  className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm"
                >
                  <div className="flex items-center space-x-4">
                    <BookOpen className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {enrollment.className}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Subject: {enrollment.subject} • Status: {enrollment.status}
                        {enrollment.grade !== undefined && (
                          <> • Grade: {enrollment.grade}%</>
                        )}
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleUnenroll(enrollment.id, enrollment.className)}
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Assign to New Class */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Assign to New Class</h4>
          
          {loadingClasses ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : availableClasses.length === 0 ? (
            <div className="text-center py-8">
              <UserPlus className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-gray-500 dark:text-gray-400">
                No available classes (student is enrolled in all classes)
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full border rounded-lg px-4 py-3 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select a class to assign</option>
                {availableClasses.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} - {cls.subject}
                  </option>
                ))}
              </select>
              
              {selectedClassId && (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center space-x-2">
                    <Check className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">
                      Selected: {classes.find(c => c.id === selectedClassId)?.name} 
                      ({classes.find(c => c.id === selectedClassId)?.subject})
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-4 px-6 py-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-600">
        <Button
          onClick={onClose}
          variant="outline"
          disabled={loading}
          className="px-6 py-2"
        >
          Cancel
        </Button>
        <Button
          onClick={handleAssign}
          disabled={loading || !selectedClassId}
          className="bg-blue-600 hover:bg-blue-700 px-6 py-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Assigning...
            </>
          ) : (
            <>
              <UserPlus className="w-4 h-4 mr-2" />
              Assign to Class
            </>
          )}
        </Button>
      </div>
    </Modal>
  );
}
