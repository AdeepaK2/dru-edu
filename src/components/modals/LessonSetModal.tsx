'use client';

import React, { useState, useEffect } from 'react';
import { X, Save, BookOpen, Users } from 'lucide-react';
import { Button, Input, TextArea } from '@/components/ui';
import { LessonSetData, getDefaultLessonSetData, validateLessonSetData } from '@/models/lessonSchema';
import { LessonSetDisplayData } from '@/models/lessonSchema';

interface LessonSetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: LessonSetData) => Promise<void>;
  loading?: boolean;
  title: string;
  submitButtonText: string;
  initialData?: LessonSetDisplayData;
  subjectId: string;
  subjectName: string;
}

export default function LessonSetModal({
  isOpen,
  onClose,
  onSubmit,
  loading = false,
  title,
  submitButtonText,
  initialData,
  subjectId,
  subjectName,
}: LessonSetModalProps) {
  const [formData, setFormData] = useState<Partial<LessonSetData>>(getDefaultLessonSetData());
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form data
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        description: initialData.description || '',
        subjectId: initialData.subjectId,
        isActive: initialData.isActive,
        order: initialData.order,
      });
    } else {
      setFormData({
        ...getDefaultLessonSetData(),
        subjectId,
      });
    }
    setErrors({});
  }, [initialData, subjectId, isOpen]);

  const handleInputChange = (field: keyof LessonSetData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const validateForm = (): boolean => {
    try {
      validateLessonSetData(formData);
      setErrors({});
      return true;
    } catch (error: any) {
      const newErrors: Record<string, string> = {};
      if (error.errors) {
        error.errors.forEach((err: any) => {
          if (err.path && err.path.length > 0) {
            newErrors[err.path[0]] = err.message;
          }
        });
      }
      setErrors(newErrors);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData as LessonSetData);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {title}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              Subject: {subjectName}
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Lesson Set Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Lesson Set Name <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              value={formData.name || ''}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter lesson set name"
              className={errors.name ? 'border-red-500' : ''}
              disabled={loading}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <TextArea
              value={formData.description || ''}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('description', e.target.value)}
              placeholder="Enter lesson set description (optional)"
              rows={3}
              className={errors.description ? 'border-red-500' : ''}
              disabled={loading}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.description}</p>
            )}
          </div>

          {/* Order */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Order <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              min="1"
              value={formData.order || 1}
              onChange={(e) => handleInputChange('order', parseInt(e.target.value) || 1)}
              placeholder="Enter display order"
              className={errors.order ? 'border-red-500' : ''}
              disabled={loading}
            />
            {errors.order && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.order}</p>
            )}
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Lower numbers appear first
            </p>
          </div>

          {/* Active Status */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive || false}
              onChange={(e) => handleInputChange('isActive', e.target.checked)}
              disabled={loading}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            />
            <label htmlFor="isActive" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Active lesson set
            </label>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{submitButtonText}</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
