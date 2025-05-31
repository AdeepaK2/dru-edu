'use client';

import React, { useState, useEffect } from 'react';
import { Modal, Button, Input } from '../ui';
import { SubjectData, SubjectDisplayData } from '@/models/subjectSchema';

interface SubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (subjectData: SubjectData) => Promise<void>;
  title: string;
  submitButtonText?: string;
  loading?: boolean;
  initialData?: SubjectDisplayData;
}

export default function SubjectModal({
  isOpen,
  onClose,
  onSubmit,
  title,
  submitButtonText = 'Save Subject',
  loading = false,
  initialData,
}: SubjectModalProps) {
  const [formData, setFormData] = useState<SubjectData>({
    name: '',
    grade: '',
    description: '',
    isActive: true
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form data when modal opens or initialData changes
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          name: initialData.name,
          grade: initialData.grade,
          description: initialData.description,
          isActive: initialData.isActive
        });
      } else {
        // Reset form for new entries
        setFormData({
          name: '',
          grade: '',
          description: '',
          isActive: true
        });
      }
      setErrors({});
    }
  }, [isOpen, initialData]);

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    // Clear the error for this field when the user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Validate form data before submission
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name || formData.name.length < 2) {
      newErrors.name = 'Subject name must be at least 2 characters';
    }
    
    if (!formData.grade) {
      newErrors.grade = 'Grade is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Error submitting subject:', error);
      // You could handle the error here, e.g., display a message
    }
  };
  // Grade options
  const gradeOptions = [
    { value: '', label: 'Select Grade' },
    { value: 'Grade 6', label: 'Grade 6' },
    { value: 'Grade 7', label: 'Grade 7' },
    { value: 'Grade 8', label: 'Grade 8' },
    { value: 'Grade 9', label: 'Grade 9' },
    { value: 'Grade 10', label: 'Grade 10' },
    { value: 'Grade 11', label: 'Grade 11' },
    { value: 'Grade 12', label: 'Grade 12' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Subject Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Subject Name
          </label>
          <Input
            id="name"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g., Mathematics, Physics"
            error={errors.name}
            required
          />
        </div>
        
        {/* Grade */}
        <div>
          <label htmlFor="grade" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Grade
          </label>
          <select
            id="grade"
            name="grade"
            value={formData.grade}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 
              ${errors.grade ? 'border-red-300 focus:border-red-300 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600'}
              dark:bg-gray-700 dark:text-white`}
            required
          >
            {gradeOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          {errors.grade && <p className="mt-1 text-sm text-red-600">{errors.grade}</p>}
        </div>
        
        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Description (Optional)
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            value={formData.description || ''}
            onChange={handleChange}
            placeholder="Enter a brief description of the subject"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
        
        {/* Active Status */}
        <div className="flex items-center">
          <input
            id="isActive"
            name="isActive"
            type="checkbox"
            checked={formData.isActive}
            onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
            Active subject
          </label>
        </div>
        
        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          
          <Button
            type="submit"
            isLoading={loading}
          >
            {submitButtonText}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
