'use client';

import React, { useState, useMemo } from 'react';
import { UserPlus, Users, Search, Edit2, Trash2, XCircle, UserCheck } from 'lucide-react';
import { Student, StudentDocument } from '@/models/studentSchema';
import { firestore } from '@/utils/firebase-client';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { Button, ConfirmDialog, Modal, Input, Select } from '@/components/ui';
import StudentModal from '@/components/modals/StudentModal';
import AssignStudentToClassModal from '@/components/modals/AssignStudentToClassModal';
import { useCachedData } from '@/hooks/useAdminCache';

export default function StudentsManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentDocument | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<StudentDocument | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigningStudent, setAssigningStudent] = useState<StudentDocument | null>(null);
  
  // Use cached data hook for efficient data management
  const { data: students = [], loading, error, refetch } = useCachedData<StudentDocument[]>(
    'students',
    async () => {
      return new Promise<StudentDocument[]>((resolve, reject) => {
        const studentsQuery = query(
          collection(firestore, 'students'),
          orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(
          studentsQuery,
          (snapshot) => {
            const studentsData: StudentDocument[] = [];
            snapshot.forEach((doc) => {
              const data = doc.data();
              studentsData.push({
                id: doc.id,
                ...data,
              } as StudentDocument);
            });
            resolve(studentsData);
            unsubscribe(); // Unsubscribe after first load for caching
          },
          (error) => {
            reject(error);
            unsubscribe();
          }
        );
      });
    },
    { ttl: 120 } // Cache for 2 minutes
  );
  
  // Use simple console logging for now
  const showSuccess = (message: string) => console.log('Success:', message);
  const showError = (message: string) => console.error('Error:', message);

  // Student create handler
  const handleStudentCreate = async (studentData: Omit<Student, 'id'>) => {
    setActionLoading('create');
    
    try {
      const response = await fetch('/api/student', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...studentData,
          status: 'Active',
          coursesEnrolled: 0,
          payment: {
            status: 'Pending',
            method: '',
            lastPayment: 'N/A'
          }
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create student');
      }

      const savedStudent = await response.json();
      showSuccess('Student created successfully!');
      setShowAddModal(false);
      refetch(); // Refresh data
    } catch (error) {
      console.error('Error creating student:', error);
      showError(error instanceof Error ? error.message : 'Failed to create student');
    } finally {
      setActionLoading(null);
    }
  };

  // Student update handler
  const handleStudentUpdate = async (studentData: Omit<Student, 'id'>) => {
    if (!editingStudent) return;
    
    setActionLoading('update');
    
    try {
      const response = await fetch('/api/student', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingStudent.id,
          ...studentData,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update student');
      }

      showSuccess('Student updated successfully!');
      setShowEditModal(false);
      setEditingStudent(null);
      refetch(); // Refresh data
    } catch (error) {
      console.error('Error updating student:', error);
      showError(error instanceof Error ? error.message : 'Failed to update student');
    } finally {
      setActionLoading(null);
    }
  };

  // Student delete handler
  const handleStudentDelete = async () => {
    if (!studentToDelete) return;
    
    setActionLoading('delete');
    
    try {
      const response = await fetch(`/api/student?id=${studentToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete student');
      }

      showSuccess('Student deleted successfully!');
      setShowDeleteConfirm(false);
      setStudentToDelete(null);
      refetch(); // Refresh data
    } catch (error) {
      console.error('Error deleting student:', error);
      showError(error instanceof Error ? error.message : 'Failed to delete student');
    } finally {
      setActionLoading(null);
    }
  };
  // Filter students based on search term
  const filteredStudents = useMemo(() => {
    if (!students) return [];
    
    return students.filter(student =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.phone.includes(searchTerm) ||
      student.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [students, searchTerm]);

  // Handle edit button click
  const handleEditClick = (student: StudentDocument) => {
    setEditingStudent(student);
    setShowEditModal(true);
  };

  // Handle delete button click
  const handleDeleteClick = (student: StudentDocument) => {
    setStudentToDelete(student);
    setShowDeleteConfirm(true);
  };

  const handleAssignClick = (student: StudentDocument) => {
    setAssigningStudent(student);
    setShowAssignModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-t-4 border-primary-600 border-solid rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-secondary-600 dark:text-secondary-300 font-medium">Loading students...</p>
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
              Students Management
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Manage student records, enrollments, and information
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-lg">
              <Users className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
              <span className="text-blue-600 dark:text-blue-400 font-medium">
                Total: {students?.length || 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
          <div className="flex">
            <XCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error</h3>
              <p className="mt-1 text-sm text-red-700 dark:text-red-300">{error.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Student</span>
          </Button>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Year/Subject
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Payment
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {student.name}
                      </div>                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        ID: {student.id}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">{student.email}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{student.phone}</div>
                  </td>                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">Enrolled: {student.coursesEnrolled} courses</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Since: {student.enrollmentDate}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      student.status === 'Active' 
                        ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300'
                        : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300'
                    }`}>
                      {student.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      student.payment?.status === 'Paid' 
                        ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300'
                        : student.payment?.status === 'Pending'
                        ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300'
                        : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300'
                    }`}>
                      {student.payment?.status || 'Unknown'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAssignClick(student)}
                        disabled={actionLoading === 'assign'}
                        className="text-blue-600 hover:text-blue-700"
                        title="Assign to Class"
                      >
                        <UserCheck className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditClick(student)}
                        disabled={actionLoading === 'update'}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteClick(student)}
                        disabled={actionLoading === 'delete'}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredStudents.length === 0 && (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No students found</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {searchTerm ? 'Try adjusting your search criteria' : 'Get started by adding a new student'}
            </p>
          </div>
        )}
      </div>

      {/* Add Student Modal */}
      {showAddModal && (
        <StudentModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSubmit={handleStudentCreate}
          loading={actionLoading === 'create'}
          title="Add New Student"
        />
      )}

      {/* Edit Student Modal */}
      {showEditModal && editingStudent && (
        <StudentModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingStudent(null);
          }}
          onSubmit={handleStudentUpdate}
          loading={actionLoading === 'update'}
          title="Edit Student"
          initialData={editingStudent}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && studentToDelete && (
        <ConfirmDialog
          isOpen={showDeleteConfirm}
          onClose={() => {
            setShowDeleteConfirm(false);
            setStudentToDelete(null);
          }}
          onConfirm={handleStudentDelete}
          isLoading={actionLoading === 'delete'}
          title="Delete Student"
          description={`Are you sure you want to delete ${studentToDelete.name}? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          variant="danger"
        />
      )}

      {/* Assign Student to Class Modal */}
      {showAssignModal && assigningStudent && (
        <AssignStudentToClassModal
          isOpen={showAssignModal}
          onClose={() => {
            setShowAssignModal(false);
            setAssigningStudent(null);
          }}
          student={assigningStudent}
          onSuccess={showSuccess}
          onError={showError}
        />
      )}
    </div>
  );
}
