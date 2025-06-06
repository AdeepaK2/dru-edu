'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Edit2, Trash2, BookOpen, Clock, Target, Package, CheckCircle, GripVertical } from 'lucide-react';
import { Button, ConfirmDialog } from '@/components/ui';
import { 
  LessonDisplayData, 
  LessonData,
  lessonDocumentToDisplay
} from '@/models/lessonSchema';
import { LessonFirestoreService } from '@/apiservices/lessonFirestoreService';
import LessonModal from './LessonModal';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Sortable Lesson Item Component
interface SortableLessonProps {
  lesson: LessonDisplayData;
  onEdit: (lesson: LessonDisplayData) => void;
  onDelete: (lesson: LessonDisplayData) => void;
  actionLoading: string | null;
}

function SortableLesson({ lesson, onEdit, onDelete, actionLoading }: SortableLessonProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lesson.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-gray-50 dark:bg-gray-700 rounded-lg p-4 ${
        isDragging ? 'z-50 shadow-lg' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          {/* Drag Handle */}
          <div
            {...attributes}
            {...listeners}
            className="mt-1 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <GripVertical className="w-5 h-5" />
          </div>
          
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
                  onClick={() => onEdit(lesson)}
                  disabled={actionLoading === 'update-lesson'}
                  className="text-blue-600 hover:text-blue-800 disabled:opacity-50"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDelete(lesson)}
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
    </div>
  );
}

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
  const [lessons, setLessons] = useState<LessonDisplayData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Modal states
  const [lessonModalOpen, setLessonModalOpen] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<LessonDisplayData | null>(null);
  const [editMode, setEditMode] = useState(false);

  // Delete confirmation states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<LessonDisplayData | null>(null);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Load data when modal opens
  useEffect(() => {
    if (isOpen && subjectId) {
      loadData();
    }
  }, [isOpen, subjectId]);  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const lessonsData = await LessonFirestoreService.getLessonsBySubject(subjectId);
      setLessons(lessonsData.map(lessonDocumentToDisplay));
    } catch (err) {
      console.error('Error loading lesson data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load lesson data');
    } finally {
      setLoading(false);
    }
  };

  // Handle drag end for reordering lessons
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = lessons.findIndex((lesson) => lesson.id === active.id);
      const newIndex = lessons.findIndex((lesson) => lesson.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newLessons = arrayMove(lessons, oldIndex, newIndex);
        
        // Update the order property for each lesson based on new position
        const updatedLessons = newLessons.map((lesson, index) => ({
          ...lesson,
          order: index + 1,
        }));

        // Optimistically update the UI
        setLessons(updatedLessons);

        // Update the order in the database
        try {
          setActionLoading('reordering');
          
          // Update all lessons with their new order
          const updatePromises = updatedLessons.map(lesson =>
            LessonFirestoreService.updateLesson(lesson.id, { order: lesson.order })
          );
          
          await Promise.all(updatePromises);
        } catch (error) {
          console.error('Error updating lesson order:', error);
          setError('Failed to update lesson order. Please try again.');
          // Revert to original order on error
          await loadData();
        } finally {
          setActionLoading(null);
        }
      }
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
    if (!itemToDelete) return;
    
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

  const confirmDelete = (item: LessonDisplayData) => {
    setItemToDelete(item);
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
            ) : (              <div className="space-y-8">
                {/* Lessons Section */}
                <div>                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                        <BookOpen className="w-5 h-5 mr-2" />
                        Lessons ({lessons.length})
                      </h3>
                      {lessons.length > 1 && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center">
                          <GripVertical className="w-3 h-3 mr-1" />
                          Drag and drop to reorder lessons
                        </p>
                      )}
                    </div>
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
                  </div>{lessons.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No lessons</h3>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Create your first lesson to get started
                      </p>
                    </div>
                  ) : (
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext
                        items={lessons.map(lesson => lesson.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="space-y-4">
                          {actionLoading === 'reordering' && (
                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-3">
                              <p className="text-blue-800 dark:text-blue-200 text-sm">
                                Updating lesson order...
                              </p>
                            </div>
                          )}
                          {lessons.map((lesson) => (
                            <SortableLesson
                              key={lesson.id}
                              lesson={lesson}
                              onEdit={handleEditLesson}
                              onDelete={confirmDelete}
                              actionLoading={actionLoading}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>      {/* Lesson Modal */}
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
          onConfirm={handleDeleteLesson}
          isLoading={actionLoading === 'delete'}
          title="Delete Lesson"
          description={`Are you sure you want to delete "${itemToDelete.name}"? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          variant="danger"
        />
      )}
    </>
  );
}
