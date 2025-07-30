'use client';

import React, { useState, useMemo } from 'react';
import { BookOpen, Search, Edit2, Trash2, Plus, XCircle, GraduationCap, FileText, Book } from 'lucide-react';
import { SubjectDocument, SubjectDisplayData, subjectDocumentToDisplay } from '@/models/subjectSchema';
import { SubjectFirestoreService } from '@/apiservices/subjectFirestoreService';
import { Button, ConfirmDialog, Input } from '@/components/ui';
import { useCachedData } from '@/hooks/useAdminCache';
import SubjectModal from '@/components/modals/SubjectModal';
import LessonManagementModal from '@/components/modals/LessonManagementModal';
import { SubjectData } from '@/models/subjectSchema';

const GRADE_OPTIONS = [
  'Pre-K', 'Kindergarten', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 
  'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 
  'Grade 11', 'Grade 12'
];

export default function SubjectManager() {
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<SubjectDisplayData | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [subjectToDelete, setSubjectToDelete] = useState<SubjectDisplayData | null>(null);
  
  // Lesson management modal state
  const [lessonModalOpen, setLessonModalOpen] = useState(false);
  const [selectedSubjectForLessons, setSelectedSubjectForLessons] = useState<SubjectDisplayData | null>(null);

  // Cache subjects data
  const { data: subjects = [], loading, error, refetch } = useCachedData<SubjectDisplayData[]>(
    'subjects',
    async () => {
      return new Promise<SubjectDisplayData[]>((resolve, reject) => {
        const unsubscribe = SubjectFirestoreService.subscribeToSubjects(
          (subjectDocuments: SubjectDocument[]) => {
            const displaySubjects = subjectDocuments.map(doc => subjectDocumentToDisplay(doc));
            resolve(displaySubjects);
            unsubscribe();
          },
          (error: Error) => {
            reject(error);
            unsubscribe();
          }
        );
      });
    },
    { 
      ttl: 120 // Cache for 2 minutes
    }
  );

  // Use simple console logging for now
  const showSuccess = (message: string) => console.log('Success:', message);
  const showError = (message: string) => console.error('Error:', message);

  // Handle subject deletion
  const handleDeleteSubject = async () => {
    if (!subjectToDelete) return;
    
    setActionLoading('delete');
    
    try {
      await SubjectFirestoreService.deleteSubject(subjectToDelete.id);
      showSuccess('Subject deleted successfully!');
      setShowDeleteConfirm(false);
      setSubjectToDelete(null);
      refetch(); // Refresh data
    } catch (error) {
      console.error('Error deleting subject:', error);
      showError(error instanceof Error ? error.message : 'Failed to delete subject');
    } finally {
      setActionLoading(null);
    }
  };

  // Filter subjects based on search term and filters
  const filteredSubjects = useMemo(() => {
    if (!subjects) return [];
    
    return subjects.filter(subject => {
      const matchesSearch = (
        subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        subject.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        subject.subjectId.toLowerCase().includes(searchTerm.toLowerCase())
      );

      const matchesGrade = !gradeFilter || subject.grade === gradeFilter;
      const matchesStatus = !statusFilter || 
        (statusFilter === 'active' && subject.isActive) ||
        (statusFilter === 'inactive' && !subject.isActive);

      return matchesSearch && matchesGrade && matchesStatus;
    });
  }, [subjects, searchTerm, gradeFilter, statusFilter]);

  // Get unique grades for filters
  const uniqueGrades = useMemo(() => {
    if (!subjects) return [];
    const grades = new Set(subjects.map(subject => subject.grade));
    return Array.from(grades).sort((a, b) => {
      const aIndex = GRADE_OPTIONS.indexOf(a);
      const bIndex = GRADE_OPTIONS.indexOf(b);
      return aIndex - bIndex;
    });
  }, [subjects]);

  // Handle edit button click
  const handleEditClick = (subject: SubjectDisplayData) => {
    setSelectedSubject(subject);
    setEditMode(true);
    setModalOpen(true);
  };
  // Handle delete button click
  const handleDeleteClick = (subject: SubjectDisplayData) => {
    setSubjectToDelete(subject);
    setShowDeleteConfirm(true);
  };

  // Handle manage lessons button click
  const handleManageLessonsClick = (subject: SubjectDisplayData) => {
    setSelectedSubjectForLessons(subject);
    setLessonModalOpen(true);
  };

  // Handle subject creation
  const handleCreateSubject = async (subjectData: SubjectData) => {
    setActionLoading('create');
    
    try {
      await SubjectFirestoreService.createSubject(subjectData);
      showSuccess('Subject created successfully!');
      setModalOpen(false);
      setSelectedSubject(null);
      setEditMode(false);
      refetch(); // Refresh data
    } catch (error) {
      console.error('Error creating subject:', error);
      showError(error instanceof Error ? error.message : 'Failed to create subject');
    } finally {
      setActionLoading(null);
    }
  };

  // Handle subject update
  const handleUpdateSubject = async (subjectData: SubjectData) => {
    if (!selectedSubject) return;
    
    setActionLoading('update');
    
    try {
      await SubjectFirestoreService.updateSubject(selectedSubject.id, subjectData);
      showSuccess('Subject updated successfully!');
      setModalOpen(false);
      setSelectedSubject(null);
      setEditMode(false);
      refetch(); // Refresh data
    } catch (error) {
      console.error('Error updating subject:', error);
      showError(error instanceof Error ? error.message : 'Failed to update subject');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-t-4 border-primary-600 border-solid rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-secondary-600 dark:text-secondary-300 font-medium">Loading subjects...</p>
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
              Subject Management
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Manage academic subjects and their grade levels
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-lg">
              <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
              <span className="text-blue-600 dark:text-blue-400 font-medium">
                Total: {subjects?.length || 0}
              </span>
            </div>
            <div className="flex items-center bg-green-50 dark:bg-green-900/20 px-4 py-2 rounded-lg">
              <GraduationCap className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" />
              <span className="text-green-600 dark:text-green-400 font-medium">
                Active: {subjects?.filter(s => s.isActive).length || 0}
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
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search subjects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              className="min-w-[150px] px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Grades</option>
              {uniqueGrades.map(grade => (
                <option key={grade} value={grade}>{grade}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="min-w-[120px] px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <Button
            onClick={() => {
              setSelectedSubject(null);
              setEditMode(false);
              setModalOpen(true);
            }}
            className="flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Subject</span>
          </Button>
        </div>
      </div>

      {/* Subjects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSubjects.map((subject) => (
          <div key={subject.id} className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow duration-200">
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {subject.name}
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                      <GraduationCap className="w-4 h-4 mr-2" />
                      <span>{subject.grade}</span>
                    </div>
                    {subject.description && (
                      <div className="flex items-start text-sm text-gray-600 dark:text-gray-300">
                        <FileText className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="line-clamp-3">{subject.description}</span>
                      </div>
                    )}
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      ID: {subject.subjectId}
                    </div>
                  </div>                </div>                <div className="flex flex-col space-y-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleManageLessonsClick(subject)}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <Book className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditClick(subject)}
                    disabled={actionLoading === 'update'}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteClick(subject)}
                    disabled={actionLoading === 'delete'}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">
                    Created: {new Date(subject.createdAt).toLocaleDateString()}
                  </span>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    subject.isActive 
                      ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300'
                      : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300'
                  }`}>
                    {subject.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredSubjects.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
          <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No subjects found</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {searchTerm || gradeFilter || statusFilter ? 'Try adjusting your search criteria' : 'Get started by adding a new subject'}
          </p>
        </div>
      )}

      {/* Add/Edit Subject Modal */}
      {modalOpen && (
        <SubjectModal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setSelectedSubject(null);
            setEditMode(false);
          }}
          onSubmit={editMode ? handleUpdateSubject : handleCreateSubject}
          loading={actionLoading === 'create' || actionLoading === 'update'}
          title={editMode ? 'Edit Subject' : 'Add New Subject'}
          submitButtonText={editMode ? 'Update Subject' : 'Add Subject'}
          initialData={editMode ? selectedSubject || undefined : undefined}
        />
      )}      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && subjectToDelete && (
        <ConfirmDialog
          isOpen={showDeleteConfirm}
          onClose={() => {
            setShowDeleteConfirm(false);
            setSubjectToDelete(null);
          }}
          onConfirm={handleDeleteSubject}
          isLoading={actionLoading === 'delete'}
          title="Delete Subject"
          description={`Are you sure you want to delete "${subjectToDelete.name}"? This action cannot be undone and may affect related classes, videos, and questions.`}
          confirmText="Delete"
          cancelText="Cancel"
          variant="danger"
        />
      )}

      {/* Lesson Management Modal */}
      {lessonModalOpen && selectedSubjectForLessons && (
        <LessonManagementModal
          isOpen={lessonModalOpen}
          onClose={() => {
            setLessonModalOpen(false);
            setSelectedSubjectForLessons(null);
          }}
          subjectId={selectedSubjectForLessons.id}
          subjectName={selectedSubjectForLessons.name}
        />
      )}
    </div>
  );
}