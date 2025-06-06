'use client';

import React, { useState, useEffect } from 'react';
import { Button, Input, TextArea, Select } from '@/components/ui';
import { Plus, Trash2, Upload, X, ImageIcon } from 'lucide-react';
import { Question, MCQQuestion, EssayQuestion, QuestionOption } from '@/models/questionBankSchema';
import { LessonFirestoreService } from '@/apiservices/lessonFirestoreService';
import { LessonDocument } from '@/models/lessonSchema';
import { useImageUpload } from '@/hooks/useImageUpload';

interface QuestionFormProps {
  questionType: 'mcq' | 'essay';
  onSubmit: (questionData: Omit<Question, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  subjectId: string;
  subjectName: string;
  loading: boolean;
  currentQuestionCounts: { mcqCount: number; essayCount: number };
}

// Helper type for form data
type QuestionFormData = {
  qno: string; // Auto-generated question number
  content: string;
  imageUrl?: string;
  lessonId?: string; // Selected lesson or "no-lesson"
  difficultyLevel: 'easy' | 'medium' | 'hard';
  points: number;
  // MCQ specific
  options: QuestionOption[];
  correctAnswer?: string;
  explanation: string;
  explanationImageUrl?: string;
  marks?: number; // Optional marks field
  // Essay specific
  suggestedAnswerContent: string;
  suggestedAnswerImageUrl?: string;
  wordLimit: number;
  minWordCount: number;
};

const initialFormData: QuestionFormData = {
  qno: '', // Will be auto-generated
  content: '',
  imageUrl: '',
  lessonId: 'no-lesson',
  difficultyLevel: 'medium',
  points: 1,
  // MCQ fields
  options: [
    { id: 'a', text: '', isCorrect: false },
    { id: 'b', text: '', isCorrect: false },
    { id: 'c', text: '', isCorrect: false },
    { id: 'd', text: '', isCorrect: false }
  ],
  correctAnswer: '',
  explanation: '',
  explanationImageUrl: '',
  marks: undefined,
  // Essay fields
  suggestedAnswerContent: '',
  suggestedAnswerImageUrl: '',
  wordLimit: 500,
  minWordCount: 50
};

const difficultyOptions = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' }
];

const pointsOptions = [
  { value: '1', label: '1 Point' },
  { value: '2', label: '2 Points' },
  { value: '3', label: '3 Points' },
  { value: '4', label: '4 Points' },
  { value: '5', label: '5 Points' }
];

export default function QuestionForm({
  questionType,
  onSubmit,
  subjectId,
  subjectName,
  loading,
  currentQuestionCounts
}: QuestionFormProps) {
  const [formData, setFormData] = useState<QuestionFormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [lessons, setLessons] = useState<LessonDocument[]>([]);
  const [loadingLessons, setLoadingLessons] = useState(false);
  
  // Image upload hook
  const { uploadImage, isUploading: imageUploading } = useImageUpload();

  // Auto-generate question number on mount
  useEffect(() => {
    const generateQno = () => {
      if (questionType === 'mcq') {
        return `M${currentQuestionCounts.mcqCount + 1}`;
      } else {
        return `E${currentQuestionCounts.essayCount + 1}`;
      }
    };
    
    setFormData(prev => ({
      ...prev,
      qno: generateQno()
    }));
  }, [questionType, currentQuestionCounts]);

  // Load lessons for the subject
  useEffect(() => {
    const loadLessons = async () => {
      setLoadingLessons(true);
      try {
        const lessonsData = await LessonFirestoreService.getLessonsBySubject(subjectId);
        setLessons(lessonsData);
      } catch (error) {
        console.error('Error loading lessons:', error);
      } finally {
        setLoadingLessons(false);
      }
    };

    loadLessons();
  }, [subjectId]);

  const handleInputChange = (field: keyof QuestionFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleOptionChange = (index: number, field: keyof QuestionOption, value: any) => {
    const newOptions = [...formData.options];
    newOptions[index] = { ...newOptions[index], [field]: value };
    
    // If setting this option as correct, uncheck others
    if (field === 'isCorrect' && value === true) {
      newOptions.forEach((option, i) => {
        if (i !== index) {
          option.isCorrect = false;
        }
      });
      
      // Set correct answer letter
      const letters = ['A', 'B', 'C', 'D', 'E'];
      setFormData(prev => ({
        ...prev,
        options: newOptions,
        correctAnswer: letters[index]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        options: newOptions
      }));
    }
  };

  const addOption = () => {
    const letters = ['e', 'f', 'g', 'h', 'i', 'j'];
    const nextLetter = letters[formData.options.length - 4] || `option${formData.options.length + 1}`;
    
    setFormData(prev => ({
      ...prev,
      options: [
        ...prev.options,
        { id: nextLetter, text: '', isCorrect: false }
      ]
    }));
  };

  const removeOption = (index: number) => {
    if (formData.options.length <= 2) return; // Keep at least 2 options
    
    const newOptions = formData.options.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      options: newOptions
    }));
  };
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Basic validation
    if (!formData.content.trim()) {
      newErrors.content = 'Question content is required';
    }

    if (formData.points < 1) {
      newErrors.points = 'Points must be at least 1';
    }

    // MCQ specific validation
    if (questionType === 'mcq') {
      // Check if at least some options have text (allow empty options)
      const hasAnyOptionText = formData.options.some(option => option.text.trim());
      if (!hasAnyOptionText) {
        newErrors.options = 'At least one option must have text';
      }

      // Check if exactly one option is correct
      const correctOptions = formData.options.filter(option => option.isCorrect);
      if (correctOptions.length === 0) {
        newErrors.correctAnswer = 'Please select the correct answer';
      } else if (correctOptions.length > 1) {
        newErrors.correctAnswer = 'Only one option can be correct';
      }

      if (!formData.explanation.trim()) {
        newErrors.explanation = 'Explanation is required for MCQ questions';
      }
    }

    // Essay specific validation
    if (questionType === 'essay') {
      if (!formData.suggestedAnswerContent.trim()) {
        newErrors.suggestedAnswerContent = 'Suggested answer is required for essay questions';
      }

      if (formData.wordLimit < 1) {
        newErrors.wordLimit = 'Word limit must be at least 1';
      }

      if (formData.minWordCount < 1) {
        newErrors.minWordCount = 'Minimum word count must be at least 1';
      }

      if (formData.minWordCount > formData.wordLimit) {
        newErrors.minWordCount = 'Minimum word count cannot exceed word limit';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      // Prepare question data based on type
      const baseQuestionData = {
        title: formData.qno, // Use qno as title
        content: formData.content.trim(),
        imageUrl: formData.imageUrl?.trim() || undefined,
        type: questionType,
        topic: formData.lessonId !== 'no-lesson' ? lessons.find(l => l.id === formData.lessonId)?.name : undefined,
        subtopic: undefined, // Not used in new structure
        difficultyLevel: formData.difficultyLevel,
        points: formData.points
      };

      let questionData: Omit<Question, 'id' | 'createdAt' | 'updatedAt'>;

      if (questionType === 'mcq') {
        questionData = {
          ...baseQuestionData,
          type: 'mcq',
          options: formData.options.filter(option => option.text.trim() || option.isCorrect), // Keep options with text or if they're correct
          correctAnswer: formData.correctAnswer,
          explanation: formData.explanation.trim(),
          explanationImageUrl: formData.explanationImageUrl?.trim() || undefined
        } as Omit<MCQQuestion, 'id' | 'createdAt' | 'updatedAt'>;
        
        // Add marks if specified
        if (formData.marks) {
          (questionData as any).marks = formData.marks;
        }
      } else {
        questionData = {
          ...baseQuestionData,
          type: 'essay',
          suggestedAnswerContent: formData.suggestedAnswerContent.trim(),
          suggestedAnswerImageUrl: formData.suggestedAnswerImageUrl?.trim() || undefined,
          wordLimit: formData.wordLimit,
          minWordCount: formData.minWordCount
        } as Omit<EssayQuestion, 'id' | 'createdAt' | 'updatedAt'>;
      }

      await onSubmit(questionData);
      
      // Reset form after successful submission
      setFormData(initialFormData);
      setErrors({});
    } catch (error) {
      console.error('Error submitting question:', error);
    }
  };  // Image upload handlers
  const handleQuestionImageUpload = async (file: File) => {
    try {
      const result = await uploadImage(file, { type: 'question' });
      if (result.imageUrl) {
        setFormData(prev => ({ ...prev, imageUrl: result.imageUrl }));
      }
      if (result.error) {
        setErrors(prev => ({ ...prev, imageUrl: result.error! }));
      }
    } catch (error) {
      console.error('Error uploading question image:', error);
    }
  };

  const handleExplanationImageUpload = async (file: File) => {
    try {
      const result = await uploadImage(file, { type: 'explanation' });
      if (result.imageUrl) {
        setFormData(prev => ({ ...prev, explanationImageUrl: result.imageUrl }));
      }
      if (result.error) {
        setErrors(prev => ({ ...prev, explanationImageUrl: result.error! }));
      }
    } catch (error) {
      console.error('Error uploading explanation image:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <Input
            label="Question Number"
            value={formData.qno}
            disabled={true}
            className="bg-gray-100 dark:bg-gray-700"
          />
          <p className="text-sm text-gray-500 mt-1">Auto-generated based on question type</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Lesson
          </label>
          <select
            value={formData.lessonId}
            onChange={(e) => handleInputChange('lessonId', e.target.value)}
            disabled={loading || loadingLessons}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="no-lesson">No Lesson</option>
            {lessons.map((lesson) => (
              <option key={lesson.id} value={lesson.id}>
                {lesson.name}
              </option>
            ))}
          </select>
          {loadingLessons && (
            <p className="text-sm text-gray-500 mt-1">Loading lessons...</p>
          )}
        </div>

        <div className="lg:col-span-2">
          <TextArea
            label="Question Content"
            value={formData.content}
            onChange={(e) => handleInputChange('content', e.target.value)}
            placeholder="Enter the full question text"
            rows={4}
            error={errors.content}
            required
            disabled={loading}
          />
        </div>

        <div className="lg:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Question Image (Optional)
          </label>
          <div className="flex flex-col space-y-4">
            <div className="flex items-center space-x-4">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleQuestionImageUpload(file);
                }}
                disabled={loading || imageUploading}
                className="hidden"
                id="question-image-upload"
              />
              <label
                htmlFor="question-image-upload"
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer disabled:bg-gray-400"
              >
                <Upload className="w-4 h-4 mr-2" />
                {imageUploading ? 'Uploading...' : 'Upload Image'}
              </label>
              {formData.imageUrl && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFormData(prev => ({ ...prev, imageUrl: '' }))}
                  disabled={loading}
                  className="text-red-600 hover:text-red-700 border-red-300 hover:border-red-400"
                >
                  <X className="w-4 h-4 mr-2" />
                  Remove
                </Button>
              )}
            </div>
            {formData.imageUrl && (
              <div className="relative">
                <img
                  src={formData.imageUrl}
                  alt="Question"
                  className="max-w-md max-h-48 object-contain border rounded-lg"
                />
              </div>
            )}
            {errors.imageUrl && (
              <p className="text-red-600 text-sm">{errors.imageUrl}</p>
            )}
          </div>
        </div>        <div>
          <Select
            label="Difficulty Level"
            value={formData.difficultyLevel}
            onChange={(e) => handleInputChange('difficultyLevel', e.target.value as 'easy' | 'medium' | 'hard')}
            options={difficultyOptions}
            required
            disabled={loading}
          />
        </div>

        <div>
          <Select
            label="Points"
            value={formData.points.toString()}
            onChange={(e) => handleInputChange('points', parseInt(e.target.value))}
            options={pointsOptions}
            required
            disabled={loading}
          />
        </div>

        {questionType === 'mcq' && (
          <div>
            <Input
              label="Marks (Optional)"
              type="number"
              min="1"
              value={formData.marks || ''}
              onChange={(e) => handleInputChange('marks', e.target.value ? parseInt(e.target.value) : undefined)}
              placeholder="Leave empty for default"
              disabled={loading}
            />
            <p className="text-sm text-gray-500 mt-1">Optional: specify marks for this question</p>
          </div>
        )}
      </div>

      {/* MCQ Specific Fields */}
      {questionType === 'mcq' && (
        <div className="space-y-6">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Answer Options</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addOption}
                disabled={loading || formData.options.length >= 6}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Option
              </Button>
            </div>
            
            {errors.options && (
              <p className="text-red-600 text-sm mb-4">{errors.options}</p>
            )}
            
            {errors.correctAnswer && (
              <p className="text-red-600 text-sm mb-4">{errors.correctAnswer}</p>
            )}

            <div className="space-y-3">
              {formData.options.map((option, index) => (
                <div key={option.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      name="correctAnswer"
                      checked={option.isCorrect}
                      onChange={(e) => handleOptionChange(index, 'isCorrect', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      disabled={loading}
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700">
                      {String.fromCharCode(65 + index)}
                    </span>
                  </div>

                  <div className="flex-1">
                    <Input
                      value={option.text}
                      onChange={(e) => handleOptionChange(index, 'text', e.target.value)}
                      placeholder={`Option ${String.fromCharCode(65 + index)}`}
                      disabled={loading}
                    />
                  </div>

                  {formData.options.length > 2 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeOption(index)}
                      disabled={loading}
                      className="text-red-600 hover:text-red-700 border-red-300 hover:border-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <TextArea
              label="Explanation"
              value={formData.explanation}
              onChange={(e) => handleInputChange('explanation', e.target.value)}
              placeholder="Explain why the correct answer is right and others are wrong"
              rows={3}
              error={errors.explanation}
              required
              disabled={loading}
            />
          </div>          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Explanation Image (Optional)
            </label>
            <div className="flex flex-col space-y-4">
              <div className="flex items-center space-x-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleExplanationImageUpload(file);
                  }}
                  disabled={loading || imageUploading}
                  className="hidden"
                  id="explanation-image-upload"
                />
                <label
                  htmlFor="explanation-image-upload"
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer disabled:bg-gray-400"
                >
                  <ImageIcon className="w-4 h-4 mr-2" />
                  {imageUploading ? 'Uploading...' : 'Upload Explanation Image'}
                </label>
                {formData.explanationImageUrl && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setFormData(prev => ({ ...prev, explanationImageUrl: '' }))}
                    disabled={loading}
                    className="text-red-600 hover:text-red-700 border-red-300 hover:border-red-400"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Remove
                  </Button>
                )}
              </div>
              {formData.explanationImageUrl && (
                <div className="relative">
                  <img
                    src={formData.explanationImageUrl}
                    alt="Explanation"
                    className="max-w-md max-h-48 object-contain border rounded-lg"
                  />
                </div>
              )}
              {errors.explanationImageUrl && (
                <p className="text-red-600 text-sm">{errors.explanationImageUrl}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Essay Specific Fields */}
      {questionType === 'essay' && (
        <div className="space-y-6">
          <div>
            <TextArea
              label="Suggested Answer"
              value={formData.suggestedAnswerContent}
              onChange={(e) => handleInputChange('suggestedAnswerContent', e.target.value)}
              placeholder="Provide a comprehensive suggested answer for grading reference"
              rows={6}
              error={errors.suggestedAnswerContent}
              required
              disabled={loading}
            />
          </div>

          <div>
            <Input
              label="Suggested Answer Image URL (Optional)"
              value={formData.suggestedAnswerImageUrl || ''}
              onChange={(e) => handleInputChange('suggestedAnswerImageUrl', e.target.value)}
              placeholder="https://example.com/suggested-answer-image.jpg"
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Input
                label="Word Limit"
                type="number"
                min="1"
                value={formData.wordLimit}
                onChange={(e) => handleInputChange('wordLimit', parseInt(e.target.value) || 0)}
                placeholder="500"
                error={errors.wordLimit}
                required
                disabled={loading}
              />
            </div>

            <div>
              <Input
                label="Minimum Word Count"
                type="number"
                min="1"
                value={formData.minWordCount}
                onChange={(e) => handleInputChange('minWordCount', parseInt(e.target.value) || 0)}
                placeholder="50"
                error={errors.minWordCount}
                required
                disabled={loading}
              />
            </div>
          </div>
        </div>
      )}

      {/* Subject Info Display */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <p className="text-sm text-gray-600">
          <strong>Subject:</strong> {subjectName}
        </p>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
        <Button
          type="submit"
          variant="primary"
          disabled={loading}
          isLoading={loading}
        >
          Create Question
        </Button>
      </div>
    </form>
  );
}