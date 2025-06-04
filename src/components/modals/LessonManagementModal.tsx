'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Edit2, Trash2, BookOpen, Users, Clock, Target, Package, CheckCircle } from 'lucide-react';
import { Button, ConfirmDialog } from '@/components/ui';
import { 
  LessonSetDisplayData, 
  LessonDisplayData, 
  LessonSetData, 
  LessonData,
  lessonSetDocumentToDisplay,
  lessonDocumentToDisplay
} from '@/models/lessonSchema';
import { LessonFirestoreService } from '@/apiservices/lessonFirestoreService';
import LessonSetModal from './LessonSetModal';
import LessonModal from './LessonModal';

interface LessonManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjectId: string;
  subjectName: string;
}

export default function LessonManagementModal({
  isOpen,
  onClose,
  subjectId,
  subjectName,
}: LessonManagementModalProps) {
  const [lessonSets, setLessonSets] = useState<LessonSetDisplayData[]>([]);
  const [lessons, setLessons] = useState<LessonDisplayData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Modal states
  const [lessonSetModalOpen, setLessonSetModalOpen] = useState(false);
  const [lessonModalOpen, setLessonModalOpen] = useState(false);
  const [selectedLessonSet, setSelectedLessonSet] = useState<LessonSetDisplayData | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<LessonDisplayData | null>(null);
  const [editMode, setEditMode] = useState(false);

  // Delete confirmation states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteType, setDeleteType] = useState<'lessonSet' | 'lesson'>('lessonSet');
  const [itemToDelete, setItemToDelete] = useState<LessonSetDisplayData | LessonDisplayData | null>(null);

  // Load data when modal opens
  useEffect(() => {
    if (isOpen && subjectId) {
      loadData();
    }
  }, [isOpen, subjectId]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [lessonSetsData, lessonsData] = await Promise.all([
        LessonFirestoreService.getLessonSetsBySubject(subjectId),
        LessonFirestoreService.getLessonsBySubject(subjectId)
      ]);
      
      setLessonSets(lessonSetsData.map(lessonSetDocumentToDisplay));
      setLessons(lessonsData.map(lessonDocumentToDisplay));
    } catch (err) {
      console.error('Error loading lesson data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load lesson data');
    } finally {
      setLoading(false);
    }
  };

  // Lesson Set handlers
  const handleCreateLessonSet = async (lessonSetData: LessonSetData) => {
    setActionLoading('create-set');
    try {
      await LessonFirestoreService.createLessonSet(lessonSetData);
      setLessonSetModalOpen(false);
      setSelectedLessonSet(null);
      setEditMode(false);
      await loadData();
    } catch (error) {
      console.error('Error creating lesson set:', error);
      throw error;
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateLessonSet = async (lessonSetData: LessonSetData) => {
    if (!selectedLessonSet) return;
    
    setActionLoading('update-set');
    try {
      await LessonFirestoreService.updateLessonSet(selectedLessonSet.id, lessonSetData);
      setLessonSetModalOpen(false);
      setSelectedLessonSet(null);
      setEditMode(false);
      await loadData();
    } catch (error) {
      console.error('Error updating lesson set:', error);
      throw error;
    } finally {
      setActionLoading(null);
    }
  };

  const handleEditLessonSet = (lessonSet: LessonSetDisplayData) => {
    setSelectedLessonSet(lessonSet);
    setEditMode(true);
    setLessonSetModalOpen(true);
  };

  const handleDeleteLessonSet = async () => {
    if (!itemToDelete || deleteType !== 'lessonSet') return;
    
    setActionLoading('delete');
    try {
      await LessonFirestoreService.deleteLessonSet(itemToDelete.id);
      setShowDeleteConfirm(false);
      setItemToDelete(null);
      await loadData();
    } catch (error) {
      console.error('Error deleting lesson set:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete lesson set');
    } finally {
      setActionLoading(null);
    }
  };

  // Lesson handlers
  const handleCreateLesson = async (lessonData: LessonData) => {
    setActionLoading('create-lesson');
    try {
      await LessonFirestoreService.createLesson(lessonData);
      setLessonModalOpen(false);
      setSelectedLesson(null);
      setEditMode(false);
      await loadData();
    } catch (error) {
      console.error('Error creating lesson:', error);
      throw error;
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateLesson = async (lessonData: LessonData) => {
    if (!selectedLesson) return;
    
    setActionLoading('update-lesson');
    try {
      await LessonFirestoreService.updateLesson(selectedLesson.id, lessonData);
      setLessonModalOpen(false);
      setSelectedLesson(null);
      setEditMode(false);
      await loadData();
    } catch (error) {
      console.error('Error updating lesson:', error);
      throw error;
    } finally {
      setActionLoading(null);
    }
  };

  const handleEditLesson = (lesson: LessonDisplayData) => {
    setSelectedLesson(lesson);
    setEditMode(true);
    setLessonModalOpen(true);
  };

  const handleDeleteLesson = async () => {
    if (!itemToDelete || deleteType !== 'lesson') return;
    
    setActionLoading('delete');
    try {
      await LessonFirestoreService.deleteLesson(itemToDelete.id);
      setShowDeleteConfirm(false);
      setItemToDelete(null);
      await loadData();
    } catch (error) {
      console.error('Error deleting lesson:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete lesson');
    } finally {
      setActionLoading(null);
    }
  };

  const confirmDelete = (item: LessonSetDisplayData | LessonDisplayData, type: 'lessonSet' | 'lesson') => {
    setItemToDelete(item);
    setDeleteType(type);
    setShowDeleteConfirm(true);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Lesson Management
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                Subject: {subjectName}
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={loading}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors disabled:opacity-50"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="max-h-[calc(90vh-120px)] overflow-y-auto p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="w-16 h-16 border-t-4 border-primary-600 border-solid rounded-full animate-spin mx-auto"></div>
                  <p className="mt-4 text-secondary-600 dark:text-secondary-300 font-medium">Loading lessons...</p>
                </div>
              </div>
            ) : error ? (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
                <p className="text-red-800 dark:text-red-200">{error}</p>
                <Button 
                  onClick={loadData} 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                >
                  Retry
                </Button>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Lesson Sets Section */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                      <Users className="w-5 h-5 mr-2" />
                      Lesson Sets ({lessonSets.length})
                    </h3>
                    <Button
                      onClick={() => {
                        setSelectedLessonSet(null);
                        setEditMode(false);
                        setLessonSetModalOpen(true);
                      }}
                      size="sm"
                      className="flex items-center space-x-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Lesson Set</span>
                    </Button>
                  </div>

                  {lessonSets.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <Users className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No lesson sets</h3>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Get started by creating your first lesson set
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {lessonSets.map((lessonSet) => (
                        <div key={lessonSet.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900 dark:text-white">
                                {lessonSet.name}
                              </h4>
                              {lessonSet.description && (
                                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                                  {lessonSet.description}
                                </p>
                              )}
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  Order: {lessonSet.order}
                                </span>
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  lessonSet.isActive 
                                    ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300'
                                    : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300'
                                }`}>
                                  {lessonSet.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </div>
                            </div>
                            <div className="flex space-x-1 ml-2">
                              <button
                                onClick={() => handleEditLessonSet(lessonSet)}
                                disabled={actionLoading === 'update-set'}
                                className="text-blue-600 hover:text-blue-800 disabled:opacity-50"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => confirmDelete(lessonSet, 'lessonSet')}
                                disabled={actionLoading === 'delete'}
                                className="text-red-600 hover:text-red-800 disabled:opacity-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Individual Lessons Section */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                      <BookOpen className="w-5 h-5 mr-2" />
                      Individual Lessons ({lessons.length})
                    </h3>
                    <Button
                      onClick={() => {
                        setSelectedLesson(null);
                        setEditMode(false);
                        setLessonModalOpen(true);
                      }}
                      size="sm"
                      className="flex items-center space-x-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Lesson</span>
                    </Button>
                  </div>

                  {lessons.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No lessons</h3>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Create your first lesson to get started
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {lessons.map((lesson) => (
                        <div key={lesson.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h4 className="font-medium text-gray-900 dark:text-white">
                                    {lesson.name}
                                  </h4>
                                  {lesson.description && (
                                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                                      {lesson.description}
                                    </p>
                                  )}
                                </div>
                                <div className="flex space-x-1 ml-4">
                                  <button
                                    onClick={() => handleEditLesson(lesson)}
                                    disabled={actionLoading === 'update-lesson'}
                                    className="text-blue-600 hover:text-blue-800 disabled:opacity-50"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => confirmDelete(lesson, 'lesson')}
                                    disabled={actionLoading === 'delete'}
                                    className="text-red-600 hover:text-red-800 disabled:opacity-50"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-4 mt-3 text-sm text-gray-600 dark:text-gray-300">
                                <span className="flex items-center">
                                  Order: {lesson.order}
                                </span>
                                {lesson.duration && (
                                  <span className="flex items-center">
                                    <Clock className="w-4 h-4 mr-1" />
                                    {lesson.formattedDuration}
                                  </span>
                                )}
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  lesson.isActive 
                                    ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300'
                                    : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300'
                                }`}>
                                  {lesson.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </div>

                              {/* Show additional lesson details */}
                              <div className="mt-3 space-y-2">
                                {lesson.objectives && lesson.objectives.length > 0 && (
                                  <div className="flex items-start text-sm">
                                    <Target className="w-4 h-4 mr-2 mt-0.5 text-blue-500" />
                                    <div>
                                      <span className="font-medium">Objectives:</span>
                                      <ul className="list-disc list-inside ml-2 text-gray-600 dark:text-gray-300">
                                        {lesson.objectives.slice(0, 2).map((objective, index) => (
                                          <li key={index}>{objective}</li>
                                        ))}
                                        {lesson.objectives.length > 2 && (
                                          <li>... and {lesson.objectives.length - 2} more</li>
                                        )}
                                      </ul>
                                    </div>
                                  </div>
                                )}
                                
                                {lesson.materials && lesson.materials.length > 0 && (
                                  <div className="flex items-start text-sm">
                                    <Package className="w-4 h-4 mr-2 mt-0.5 text-green-500" />
                                    <div>
                                      <span className="font-medium">Materials:</span>
                                      <span className="ml-2 text-gray-600 dark:text-gray-300">
                                        {lesson.materials.slice(0, 3).join(', ')}
                                        {lesson.materials.length > 3 && ` and ${lesson.materials.length - 3} more`}
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lesson Set Modal */}
      {lessonSetModalOpen && (
        <LessonSetModal
          isOpen={lessonSetModalOpen}
          onClose={() => {
            setLessonSetModalOpen(false);
            setSelectedLessonSet(null);
            setEditMode(false);
          }}
          onSubmit={editMode ? handleUpdateLessonSet : handleCreateLessonSet}
          loading={actionLoading === 'create-set' || actionLoading === 'update-set'}
          title={editMode ? 'Edit Lesson Set' : 'Add Lesson Set'}
          submitButtonText={editMode ? 'Update Lesson Set' : 'Add Lesson Set'}
          initialData={editMode ? selectedLessonSet || undefined : undefined}
          subjectId={subjectId}
          subjectName={subjectName}
        />
      )}

      {/* Lesson Modal */}
      {lessonModalOpen && (
        <LessonModal
          isOpen={lessonModalOpen}
          onClose={() => {
            setLessonModalOpen(false);
            setSelectedLesson(null);
            setEditMode(false);
          }}
          onSubmit={editMode ? handleUpdateLesson : handleCreateLesson}
          loading={actionLoading === 'create-lesson' || actionLoading === 'update-lesson'}
          title={editMode ? 'Edit Lesson' : 'Add Lesson'}
          submitButtonText={editMode ? 'Update Lesson' : 'Add Lesson'}
          initialData={editMode ? selectedLesson || undefined : undefined}
          subjectId={subjectId}
          subjectName={subjectName}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && itemToDelete && (
        <ConfirmDialog
          isOpen={showDeleteConfirm}
          onClose={() => {
            setShowDeleteConfirm(false);
            setItemToDelete(null);
          }}
          onConfirm={deleteType === 'lessonSet' ? handleDeleteLessonSet : handleDeleteLesson}
          isLoading={actionLoading === 'delete'}
          title={`Delete ${deleteType === 'lessonSet' ? 'Lesson Set' : 'Lesson'}`}
          description={`Are you sure you want to delete "${itemToDelete.name}"? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          variant="danger"
        />
      )}
    </>
  );
}
