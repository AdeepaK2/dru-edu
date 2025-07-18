'use client';

import React, { useState, useMemo } from 'react';
import { UserPlus, Users, Search, Edit2, Trash2, GraduationCap, XCircle } from 'lucide-react';
import { Teacher, TeacherDocument, TeacherData } from '@/models/teacherSchema';
import { firestore } from '@/utils/firebase-client';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { Button, ConfirmDialog, Input } from '@/components/ui';
import TeacherModal from '@/components/modals/TeacherModal';
import { useCachedData } from '@/hooks/useAdminCache';

export default function TeacherManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<TeacherDocument | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [teacherToDelete, setTeacherToDelete] = useState<TeacherDocument | null>(null);

  // Use cached data hook for efficient data management
  const { data: teachers = [], loading, error, refetch } = useCachedData<TeacherDocument[]>(
    'teachers',
    async () => {
      return new Promise<TeacherDocument[]>((resolve, reject) => {
        const teachersQuery = query(
          collection(firestore, 'teachers'),
          orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(
          teachersQuery,
          (snapshot) => {
            const teachersData: TeacherDocument[] = [];
            snapshot.forEach((doc) => {
              const data = doc.data();
              teachersData.push({
                id: doc.id,
                ...data,
              } as TeacherDocument);
            });
            resolve(teachersData);
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
  // Teacher create handler
  const handleTeacherCreate = async (teacherData: TeacherData) => {
    setActionLoading('create');
    
    try {
      const response = await fetch('/api/teacher', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...teacherData,
          avatar: '',
          classesAssigned: 0,
          studentsCount: 0,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create teacher');
      }

      const savedTeacher = await response.json();
      showSuccess('Teacher created successfully!');
      setShowAddModal(false);
      refetch(); // Refresh data
    } catch (error) {
      console.error('Error creating teacher:', error);
      showError(error instanceof Error ? error.message : 'Failed to create teacher');
    } finally {
      setActionLoading(null);
    }
  };

  // Teacher update handler
  const handleTeacherUpdate = async (teacherData: TeacherData) => {
    if (!editingTeacher) return;
    
    setActionLoading('update');
    
    try {
      const response = await fetch('/api/teacher', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingTeacher.id,
          ...teacherData,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update teacher');
      }

      showSuccess('Teacher updated successfully!');
      setShowEditModal(false);
      setEditingTeacher(null);
      refetch(); // Refresh data
    } catch (error) {
      console.error('Error updating teacher:', error);
      showError(error instanceof Error ? error.message : 'Failed to update teacher');
    } finally {
      setActionLoading(null);
    }
  };

  // Teacher delete handler
  const handleTeacherDelete = async () => {
    if (!teacherToDelete) return;
    
    setActionLoading('delete');
    
    try {
      const response = await fetch('/api/teacher', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: teacherToDelete.id }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete teacher');
      }

      showSuccess('Teacher deleted successfully!');
      setShowDeleteConfirm(false);
      setTeacherToDelete(null);
      refetch(); // Refresh data
    } catch (error) {
      console.error('Error deleting teacher:', error);
      showError(error instanceof Error ? error.message : 'Failed to delete teacher');
    } finally {
      setActionLoading(null);
    }
  };

  // Filter teachers based on search term
  const filteredTeachers = useMemo(() => {
    if (!teachers) return [];
    
    return teachers.filter(teacher =>
      teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.phone.includes(searchTerm) ||
      teacher.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [teachers, searchTerm]);

  // Handle edit button click
  const handleEditClick = (teacher: TeacherDocument) => {
    setEditingTeacher(teacher);
    setShowEditModal(true);
  };

  // Handle delete button click
  const handleDeleteClick = (teacher: TeacherDocument) => {
    setTeacherToDelete(teacher);
    setShowDeleteConfirm(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-t-4 border-primary-600 border-solid rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-secondary-600 dark:text-secondary-300 font-medium">Loading teachers...</p>
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
              Teachers Management
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Manage teacher records, assignments, and information
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-lg">
              <GraduationCap className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
              <span className="text-blue-600 dark:text-blue-400 font-medium">
                Total: {teachers?.length || 0}
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
              placeholder="Search teachers..."
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
            <span>Add Teacher</span>
          </Button>
        </div>
      </div>

      {/* Teachers Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Teacher
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Subject/Experience
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Classes
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredTeachers.map((teacher) => (
                <tr key={teacher.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {teacher.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        ID: {teacher.id}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">{teacher.email}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{teacher.phone}</div>
                  </td>                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">{teacher.subject || 'Various'}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{teacher.qualifications || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      teacher.status === 'Active' 
                        ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300'
                        : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300'
                    }`}>
                      {teacher.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {teacher.classesAssigned || 0} classes
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditClick(teacher)}
                        disabled={actionLoading === 'update'}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteClick(teacher)}
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

        {filteredTeachers.length === 0 && (
          <div className="text-center py-12">
            <GraduationCap className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No teachers found</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {searchTerm ? 'Try adjusting your search criteria' : 'Get started by adding a new teacher'}
            </p>
          </div>
        )}
      </div>      {/* Add Teacher Modal */}
      {showAddModal && (
        <TeacherModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSubmit={handleTeacherCreate}
          loading={actionLoading === 'create'}
          title="Add New Teacher"
          submitButtonText="Add Teacher"
        />
      )}

      {/* Edit Teacher Modal */}
      {showEditModal && editingTeacher && (
        <TeacherModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingTeacher(null);
          }}
          onSubmit={handleTeacherUpdate}
          loading={actionLoading === 'update'}
          title="Edit Teacher"
          submitButtonText="Update Teacher"
          initialData={editingTeacher}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && teacherToDelete && (
        <ConfirmDialog
          isOpen={showDeleteConfirm}
          onClose={() => {
            setShowDeleteConfirm(false);
            setTeacherToDelete(null);
          }}
          onConfirm={handleTeacherDelete}
          isLoading={actionLoading === 'delete'}
          title="Delete Teacher"
          description={`Are you sure you want to delete ${teacherToDelete.name}? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          variant="danger"
        />
      )}
    </div>
  );
}
