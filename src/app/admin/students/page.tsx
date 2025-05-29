'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { UserPlus, Users, Search, Edit2, Trash2, XCircle } from 'lucide-react';
import { Student, StudentDocument } from '@/models/studentSchema';
import { firestore } from '@/utils/firebase-client';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { Button, ConfirmDialog, Modal, Input, Select } from '@/components/ui';
import StudentModal from '@/components/modals/StudentModal';
import { DataCache, NavigationLoader } from '@/utils/performance';

export default function StudentsManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentDocument | null>(null);
  const [students, setStudents] = useState<StudentDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<StudentDocument | null>(null);
  const loader = NavigationLoader.getInstance();
  
  // Use simple console logging for now
  const showSuccess = (message: string) => console.log('Success:', message);
  const showError = (message: string) => console.error('Error:', message);
  // Fetch students from Firestore with optimized real-time updates
  useEffect(() => {
    // Set loading indicator
    loader.setLoading(true);
    
    // Check cache first
    const cachedStudents = DataCache.get('students');
    if (cachedStudents) {
      setStudents(cachedStudents);
      setLoading(false);
      loader.setLoading(false);
    }
    
    let retryCount = 0;
    const maxRetries = 3;
    
    const fetchStudents = () => {
      try {
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
            setStudents(studentsData);
            DataCache.set('students', studentsData, 120); // Cache for 2 minutes
            setLoading(false);
            loader.setLoading(false);
            setError(null);
            retryCount = 0; // Reset retry count on success
          },
          (error) => {
            console.error('Error fetching students:', error);
            setLoading(false);
            
            if (retryCount < maxRetries) {
              retryCount++;
              setTimeout(() => {
                console.log(`Retrying to fetch students... Attempt ${retryCount}`);
                fetchStudents();
              }, 2000 * retryCount); // Exponential backoff
            } else {
              setError('Failed to fetch students. Please refresh the page.');
            }
          }
        );

        return unsubscribe;
      } catch (error) {
        console.error('Error setting up students listener:', error);
        setError('Failed to initialize student data connection.');
        setLoading(false);
        return () => {};
      }
    };

    const unsubscribe = fetchStudents();
    return () => unsubscribe();
  }, []);

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
          status: 'Active', // Default to Active
          coursesEnrolled: 0, // Default to 0
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
      console.log('Student created successfully:', savedStudent);
      
      setShowAddModal(false);
      showSuccess(`Student "${savedStudent.name}" has been created successfully! A welcome email with login credentials has been sent to ${savedStudent.email}.`);
      
    } catch (error: any) {
      console.error('Error saving student data:', error);
      showError(`Error: ${error.message || 'An unexpected error occurred'}`);
    } finally {
      setActionLoading(null);
    }
  };

  // Edit student handler
  const handleEdit = (student: StudentDocument) => {
    setEditingStudent(student);
    setShowEditModal(true);
  };

  // Student update handler
  const handleStudentUpdate = async (studentData: Omit<Student, 'id'>) => {
    if (!editingStudent) return;
    
    setActionLoading(`edit-${editingStudent.id}`);
    
    try {
      const response = await fetch(`/api/student?id=${editingStudent.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: studentData.name,
          email: studentData.email,
          phone: studentData.phone,
          enrollmentDate: studentData.enrollmentDate,
          parent: studentData.parent
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update student');
      }
      
      setShowEditModal(false);
      setEditingStudent(null);
      showSuccess('Student updated successfully!');
      
    } catch (error: any) {
      console.error('Error updating student:', error);
      showError(`Error: ${error.message || 'An unexpected error occurred'}`);
    } finally {
      setActionLoading(null);
    }
  };

  // Delete student handler
  const handleDeleteClick = (student: StudentDocument) => {
    setStudentToDelete(student);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!studentToDelete) return;
    
    setActionLoading(`delete-${studentToDelete.id}`);
    setShowDeleteConfirm(false);
    
    try {
      const response = await fetch(`/api/student?id=${studentToDelete.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete student');
      }
      
      showSuccess(`Student "${studentToDelete.name}" has been deleted successfully.`);
      
    } catch (error: any) {
      console.error('Error deleting student:', error);
      showError(`Error: ${error.message || 'An unexpected error occurred'}`);
    } finally {
      setActionLoading(null);
      setStudentToDelete(null);
    }
  };

  // Optimized filtering with memoization for better performance
  const filteredStudents = useMemo(() => {
    if (!searchTerm.trim()) return students;
    
    const lowerSearchTerm = searchTerm.toLowerCase();
    return students.filter(student =>
      student.name.toLowerCase().includes(lowerSearchTerm) ||
      student.email.toLowerCase().includes(lowerSearchTerm) ||
      student.parent.name.toLowerCase().includes(lowerSearchTerm) ||
      student.phone.includes(searchTerm)
    );
  }, [students, searchTerm]);

  // Memoized statistics for better performance
  const studentStats = useMemo(() => ({
    total: students.length
  }), [students]);

  return (
    <div className="space-y-6">
      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <span className="ml-2 text-gray-600 dark:text-gray-400">Loading students...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-4">
          <div className="flex">
            <XCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error</h3>
              <p className="mt-1 text-sm text-red-700 dark:text-red-300">{error}</p>
              <Button 
                onClick={() => window.location.reload()}
                variant="outline"
                size="sm"
                className="mt-2"
              >
                Retry
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      {!loading && !error && (
        <>
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Student Management</h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Manage your students, their enrollments, and account status
              </p>
            </div>            <Button
              onClick={() => setShowAddModal(true)}
              leftIcon={<UserPlus className="w-4 h-4" />}
              className="mt-4 sm:mt-0"
            >
              Add Student
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Students</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{studentStats.total}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
              <div className="flex-1">                <Input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  leftIcon={<Search className="w-4 h-4" />}
                />
              </div>              <div className="flex space-x-2">
                <Select 
                  defaultValue="all"
                  options={[
                    { value: "all", label: "All Status" },
                    { value: "active", label: "Active" },
                    { value: "suspended", label: "Suspended" }
                  ]}
                />
                <Button variant="outline">
                  Export
                </Button>
              </div>
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
                      Parent
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Enrollment Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center">
                          <Users className="w-12 h-12 text-gray-400 mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No students found</h3>
                          <p className="text-gray-500 dark:text-gray-400">
                            {searchTerm ? 'Try adjusting your search criteria.' : 'Get started by adding your first student.'}
                          </p>                          {!searchTerm && (
                            <Button
                              onClick={() => setShowAddModal(true)}
                              leftIcon={<UserPlus className="w-4 h-4" />}
                              className="mt-4"
                            >
                              Add First Student
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((student) => (
                      <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                              <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
                                {student.avatar || student.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {student.name}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                ID: {student.id}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">{student.email}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{student.phone}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">{student.parent.name}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{student.parent.phone}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {student.enrollmentDate ? new Date(student.enrollmentDate).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">                          <div className="flex space-x-3">
                            <Button
                              onClick={() => handleEdit(student)}
                              variant="outline"
                              size="sm"
                              leftIcon={<Edit2 className="w-4 h-4" />}
                              isLoading={actionLoading === `edit-${student.id}`}
                              disabled={!!actionLoading}
                            >
                              Edit
                            </Button>
                            <Button
                              onClick={() => handleDeleteClick(student)}
                              variant="danger"
                              size="sm"
                              leftIcon={<Trash2 className="w-4 h-4" />}
                              isLoading={actionLoading === `delete-${student.id}`}
                              disabled={!!actionLoading}
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Add Student Modal */}
      <StudentModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleStudentCreate}
        title="Add New Student"
        submitButtonText="Add Student"
        loading={actionLoading === 'create'}
      />

      {/* Edit Student Modal */}
      <StudentModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingStudent(null);
        }}
        onSubmit={handleStudentUpdate}
        title={`Edit Student: ${editingStudent?.name || ''}`}
        submitButtonText="Update Student"
        loading={actionLoading === `edit-${editingStudent?.id}`}
        initialData={editingStudent || undefined}
      />

      {/* Delete Confirmation Dialog */}      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setStudentToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Student"
        description={`Are you sure you want to delete student "${studentToDelete?.name}"? This action cannot be undone and will also remove their Firebase authentication account.`}
        confirmText="Delete Student"
        variant="danger"
      />
    </div>
  );
}
