'use client';

import React, { useState, useEffect } from 'react';
import { ClassDocument } from '@/models/classSchema';
import { VideoDocument } from '@/models/videoSchema';
import { ClassFirestoreService } from '@/apiservices/classFirestoreService';
import { VideoFirestoreService } from '@/apiservices/videoFirestoreService';
import Modal from '@/components/ui/Modal';
import { Users, BookOpen } from 'lucide-react';

interface AssignToClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  video: VideoDocument | null;
  onAssignComplete: () => void;
}

export default function AssignToClassModal({
  isOpen,
  onClose,
  video,
  onAssignComplete
}: AssignToClassModalProps) {
  const [classes, setClasses] = useState<ClassDocument[]>([]);
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isOpen && video) {
      fetchClasses();
      setSelectedClassIds(video.assignedClassIds || []);
    }
  }, [isOpen, video]);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const allClasses = await ClassFirestoreService.getAllClasses();
      setClasses(allClasses);
    } catch (error) {
      console.error('Error fetching classes:', error);
      setError('Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  const handleClassToggle = (classId: string) => {
    setSelectedClassIds(prev => 
      prev.includes(classId) 
        ? prev.filter(id => id !== classId)
        : [...prev, classId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!video) return;

    try {
      setSubmitting(true);
      setError('');
      
      await VideoFirestoreService.assignToClasses(video.id, selectedClassIds);
      onAssignComplete();
      onClose();
    } catch (error) {
      console.error('Error assigning video to classes:', error);
      setError('Failed to assign video to classes');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedClassIds([]);
    setError('');
    onClose();
  };

  if (!video) return null;
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose} 
      title="Assign Video to Classes"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="p-6">
        {/* Video Info */}
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-start space-x-4">
            <img
              src={video.thumbnailUrl || '/placeholder-thumbnail.jpg'}
              alt={video.title}
              className="w-20 h-12 object-cover rounded"
            />
            <div className="flex-1">
              <h3 className="font-medium text-gray-900 dark:text-white">
                {video.title}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Select the classes where this video should be available
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Classes List */}
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <p className="text-gray-500 dark:text-gray-400 mt-2">Loading classes...</p>
            </div>
          ) : classes.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">No classes available</p>
            </div>
          ) : (
            classes.map(cls => (
              <div
                key={cls.id}
                className="flex items-center p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <input
                  type="checkbox"
                  id={`class-${cls.id}`}
                  checked={selectedClassIds.includes(cls.id)}
                  onChange={() => handleClassToggle(cls.id)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor={`class-${cls.id}`}
                  className="ml-3 flex-1 cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {cls.name}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {cls.subject} • {cls.year}
                      </p>
                    </div>                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <Users className="h-4 w-4 mr-1" />
                      {cls.enrolledStudents || 0}
                    </div>
                  </div>
                </label>
              </div>
            ))
          )}
        </div>

        {/* Selected Count */}
        {selectedClassIds.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              {selectedClassIds.length} class{selectedClassIds.length !== 1 ? 'es' : ''} selected
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Assigning...' : 'Assign to Classes'}
          </button>        </div>
      </form>
    </Modal>
  );
}
