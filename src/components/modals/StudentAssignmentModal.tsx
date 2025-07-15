'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Users, 
  Save, 
  AlertCircle,
  Search,
  User,
  CheckCircle,
  UserCheck
} from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { VideoFirestoreService } from '@/apiservices/videoFirestoreService';
import { StudentFirestoreService, StudentListItem } from '@/apiservices/studentFirestoreService';
import { VideoDisplayData } from '@/models/videoSchema';

interface StudentAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  video: VideoDisplayData | null;
  availableClasses: Array<{ id: string; name: string; subjectId: string; }>;
}

export default function StudentAssignmentModal({
  isOpen,
  onClose,
  onSuccess,
  video,
  availableClasses
}: StudentAssignmentModalProps) {
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [allStudents, setAllStudents] = useState<StudentListItem[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentListItem[]>([]);
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assignmentType, setAssignmentType] = useState<'classes' | 'students'>('classes');

  // Initialize assignments when video changes
  useEffect(() => {
    if (video) {
      setSelectedClassIds(video.assignedClasses || []);
      setSelectedStudentIds(video.assignedStudents || []);
    }
  }, [video]);

  // Load all students
  useEffect(() => {
    const loadStudents = async () => {
      setLoading(true);
      try {
        const students = await StudentFirestoreService.getAllStudents();
        setAllStudents(students);
        setFilteredStudents(students);
      } catch (err: any) {
        console.error('Error loading students:', err);
        setError('Failed to load students');
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      loadStudents();
    }
  }, [isOpen]);

  // Filter students based on search term and selected classes
  useEffect(() => {
    let filtered = allStudents;

    // Filter by search term
    if (studentSearchTerm) {
      const searchLower = studentSearchTerm.toLowerCase();
      filtered = filtered.filter(student => 
        student.name.toLowerCase().includes(searchLower) ||
        student.email.toLowerCase().includes(searchLower) ||
        student.id.toLowerCase().includes(searchLower)
      );
    }

    // Note: Since StudentListItem doesn't have enrolledClasses, 
    // we can't filter by selected classes here. 
    // This would need to be implemented by extending the StudentListItem interface
    // or calling a different service method that returns more complete data.

    setFilteredStudents(filtered);
  }, [allStudents, studentSearchTerm, selectedClassIds]);

  const handleClassSelection = (classId: string) => {
    setSelectedClassIds(prev => 
      prev.includes(classId)
        ? prev.filter(id => id !== classId)
        : [...prev, classId]
    );
  };

  const handleStudentSelection = (studentId: string) => {
    setSelectedStudentIds(prev => 
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSelectAllStudents = () => {
    const allFilteredIds = filteredStudents.map(student => student.id);
    const allSelected = allFilteredIds.every(id => selectedStudentIds.includes(id));
    
    if (allSelected) {
      // Deselect all filtered students
      setSelectedStudentIds(prev => prev.filter(id => !allFilteredIds.includes(id)));
    } else {
      // Select all filtered students
      setSelectedStudentIds(prev => {
        const newIds = [...prev];
        allFilteredIds.forEach(id => {
          if (!newIds.includes(id)) {
            newIds.push(id);
          }
        });
        return newIds;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!video) return;
    
    setSaving(true);
    setError(null);
    
    try {
      // Update video assignments
      await VideoFirestoreService.updateVideo(video.id, {
        assignedClassIds: selectedClassIds,
        assignedStudentIds: selectedStudentIds
      });
      
      onSuccess();
    } catch (err: any) {
      console.error('Error updating video assignments:', err);
      setError(err.message || 'Failed to update assignments');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (!saving) {
      setError(null);
      setStudentSearchTerm('');
      onClose();
    }
  };

  if (!isOpen || !video) return null;

  const getClassNameById = (classId: string) => {
    return availableClasses.find(cls => cls.id === classId)?.name || 'Unknown Class';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Assign Students
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {video.title}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClose}
            disabled={saving}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Display */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Assignment Type Toggle */}
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              type="button"
              onClick={() => setAssignmentType('classes')}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                assignmentType === 'classes'
                  ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Assign by Classes
            </button>
            <button
              type="button"
              onClick={() => setAssignmentType('students')}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                assignmentType === 'students'
                  ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Assign Individual Students
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Class Assignment */}
            <div className={assignmentType === 'classes' ? '' : 'opacity-50'}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Assign to Classes
                </h3>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedClassIds.length} selected
                </span>
              </div>
              <div className="border border-gray-300 dark:border-gray-600 rounded-md p-3 max-h-60 overflow-y-auto">
                {availableClasses.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No classes available
                  </p>
                ) : (
                  <div className="space-y-2">
                    {availableClasses.map(cls => (
                      <label key={cls.id} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedClassIds.includes(cls.id)}
                          onChange={() => handleClassSelection(cls.id)}
                          disabled={saving || assignmentType !== 'classes'}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                          {cls.name}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Individual Student Assignment */}
            <div className={assignmentType === 'students' ? '' : 'opacity-50'}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Individual Students
                </h3>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedStudentIds.length} selected
                </span>
              </div>

              {/* Student Search */}
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search students..."
                  value={studentSearchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStudentSearchTerm(e.target.value)}
                  className="pl-10"
                  disabled={saving || assignmentType !== 'students'}
                />
              </div>

              {/* Select All Button */}
              {filteredStudents.length > 0 && assignmentType === 'students' && (
                <div className="mb-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAllStudents}
                    disabled={saving}
                    className="w-full"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {filteredStudents.every(student => selectedStudentIds.includes(student.id))
                      ? 'Deselect All'
                      : 'Select All'
                    } ({filteredStudents.length})
                  </Button>
                </div>
              )}

              {/* Students List */}
              <div className="border border-gray-300 dark:border-gray-600 rounded-md p-3 max-h-60 overflow-y-auto">
                {loading ? (
                  <div className="text-center py-4">
                    <div className="w-6 h-6 border-t-2 border-blue-600 border-solid rounded-full animate-spin mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading students...</p>
                  </div>
                ) : filteredStudents.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {studentSearchTerm ? 'No students found matching your search' : 'No students available'}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {filteredStudents.map(student => (
                      <label key={student.id} className="flex items-center p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700">
                        <input
                          type="checkbox"
                          checked={selectedStudentIds.includes(student.id)}
                          onChange={() => handleStudentSelection(student.id)}
                          disabled={saving || assignmentType !== 'students'}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <div className="ml-3 flex items-center space-x-3 flex-1">
                          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {student.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {student.id} • {student.email}
                            </p>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
              Assignment Summary
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">Classes assigned:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-white">
                  {selectedClassIds.length}
                </span>
                {selectedClassIds.length > 0 && (
                  <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {selectedClassIds.map(id => getClassNameById(id)).join(', ')}
                  </div>
                )}
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Individual students:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-white">
                  {selectedStudentIds.length}
                </span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="flex items-center space-x-2"
            >
              <UserCheck className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Assignments'}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
