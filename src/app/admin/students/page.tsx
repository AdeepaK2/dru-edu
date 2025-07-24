'use client';

import React, { useState, useMemo } from 'react';
import { UserPlus, Users, Search, Edit2, Trash2, XCircle, UserCheck, SortAsc } from 'lucide-react';
import { Student, StudentDocument } from '@/models/studentSchema';
import { firestore } from '@/utils/firebase-client';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { Button, ConfirmDialog, Modal, Input, Select } from '@/components/ui';
import StudentModal from '@/components/modals/StudentModal';
import AssignStudentToClassModal from '@/components/modals/AssignStudentToClassModal';
import { useCachedData } from '@/hooks/useAdminCache';

export default function StudentsManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentDocument | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<StudentDocument | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigningStudent, setAssigningStudent] = useState<StudentDocument | null>(null);
  
  // Use real-time data for immediate updates
  const [students, setStudents] = useState<StudentDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Set up real-time listener
  React.useEffect(() => {
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
        setLoading(false);
        setError(null);
      },
      (error) => {
        console.error('Error fetching students:', error);
        setError(error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);
  
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
      // Real-time listener will automatically update the list
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
      // Real-time listener will automatically update the list
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
      // Real-time listener will automatically update the list
    } catch (error) {
      console.error('Error deleting student:', error);
      showError(error instanceof Error ? error.message : 'Failed to delete student');
    } finally {
      setActionLoading(null);
    }
  };
  // Filter and sort students based on search term
  const filteredStudents = useMemo(() => {
    if (!students) return [];
    
    let filtered = students.filter(student => {
      const matchesSearch = 
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.phone.includes(searchTerm) ||
        student.id.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesSearch;
    });

    // Sort students
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'email':
          comparison = a.email.localeCompare(b.email);
          break;
        case 'enrollmentDate':
          comparison = new Date(a.enrollmentDate).getTime() - new Date(b.enrollmentDate).getTime();
          break;
        case 'coursesEnrolled':
          comparison = a.coursesEnrolled - b.coursesEnrolled;
          break;
        default:
          comparison = a.name.localeCompare(b.name);
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [students, searchTerm, sortBy, sortOrder]);

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
                {filteredStudents.length !== students?.length 
                  ? `${filteredStudents.length} of ${students?.length || 0}` 
                  : `Total: ${students?.length || 0}`
                }
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      {students && students.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Students</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{students.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <UserCheck className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Students</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {students.filter(s => s.status === 'Active').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                <XCircle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending Payments</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {students.filter(s => s.payment?.status === 'Pending').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg Courses</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {students.length > 0 ? Math.round(students.reduce((acc, s) => acc + s.coursesEnrolled, 0) / students.length * 10) / 10 : 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

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
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* Sorting */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center space-x-2">
              <SortAsc className="w-4 h-4 text-gray-500" />
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-36"
                options={[
                  { value: 'name', label: 'Name' },
                  { value: 'email', label: 'Email' },
                  { value: 'enrollmentDate', label: 'Enrollment Date' },
                  { value: 'coursesEnrolled', label: 'Courses' }
                ]}
              />
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-2"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </Button>
            </div>
          </div>
          
          {/* Add Button */}
          <Button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 whitespace-nowrap"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Student</span>
          </Button>
        </div>
        
        {/* Search Summary */}
        {searchTerm && (
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300">
              Search: "{searchTerm}"
              <button
                onClick={() => setSearchTerm('')}
                className="ml-1 text-blue-600 hover:text-blue-800"
              >
                <XCircle className="w-3 h-3" />
              </button>
            </span>
          </div>
        )}
      </div>

      {/* Students Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Enrollment
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center">
                    <div className="text-center">
                      <Users className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No students found</h3>
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        {searchTerm ? 'Try adjusting your search criteria' : 'Get started by adding a new student'}
                      </p>
                      {!searchTerm && (
                        <Button
                          onClick={() => setShowAddModal(true)}
                          className="mt-4 flex items-center space-x-2 mx-auto"
                        >
                          <UserPlus className="w-4 h-4" />
                          <span>Add Your First Student</span>
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {student.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            ID: {student.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">{student.email}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{student.phone}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">Courses: {student.coursesEnrolled}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Since: {student.enrollmentDate}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      <div className="flex justify-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAssignClick(student)}
                          disabled={actionLoading !== null}
                          className="text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 disabled:opacity-50"
                          title="Assign to Class"
                        >
                          <UserCheck className="w-4 h-4 mr-1" />
                          Assign
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditClick(student)}
                          disabled={actionLoading !== null}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                        >
                          <Edit2 className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteClick(student)}
                          disabled={actionLoading !== null}
                          className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
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
      </div>      {/* Add Student Modal */}
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
