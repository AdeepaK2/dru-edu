'use client';

import { useState, useEffect } from 'react';
import { Modal, Button } from '@/components/ui';
import { QuestionBank } from '@/models/questionBankSchema';

interface QuestionBankModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<QuestionBank, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  title: string;
  submitButtonText?: string;
  loading?: boolean;
  initialData?: Partial<QuestionBank>;
}

export default function QuestionBankModal({
  isOpen,
  onClose,
  onSubmit,
  title,
  submitButtonText = 'Save Question Bank',
  loading = false,
  initialData
}: QuestionBankModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    subjectId: '',
    subjectName: '',
    grade: '',
    questionIds: [] as string[],
    totalQuestions: 0,
    mcqCount: 0,
    essayCount: 0
  });

  // Reset form when modal opens/closes or initialData changes
  useEffect(() => {
    if (isOpen && initialData) {
      setFormData({
        name: initialData.name || '',
        description: initialData.description || '',
        subjectId: initialData.subjectId || '',
        subjectName: initialData.subjectName || '',
        grade: initialData.grade || '',
        questionIds: initialData.questionIds || [],
        totalQuestions: initialData.totalQuestions || 0,
        mcqCount: initialData.mcqCount || 0,
        essayCount: initialData.essayCount || 0
      });
    } else if (isOpen) {
      // Reset form for new question bank
      setFormData({
        name: '',
        description: '',
        subjectId: '',
        subjectName: '',
        grade: '',
        questionIds: [],
        totalQuestions: 0,
        mcqCount: 0,
        essayCount: 0
      });
    }
  }, [isOpen, initialData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Question Bank Name*
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter a name for this question bank"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Describe this question bank"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject ID*
              </label>
              <input
                type="text"
                name="subjectId"
                value={formData.subjectId}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., math-g6"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject Name*
              </label>
              <input
                type="text"
                name="subjectName"
                value={formData.subjectName}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Mathematics"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Grade
            </label>
            <input
              type="text"
              name="grade"
              value={formData.grade}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Grade 6"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={loading}
          >
            {submitButtonText}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
