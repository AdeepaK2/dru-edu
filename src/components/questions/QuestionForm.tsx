'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui';
import { Question, MCQQuestion, EssayQuestion } from '@/models/questionBankSchema';

interface QuestionFormProps {
  questionType: 'mcq' | 'essay';
  onSubmit: (questionData: Omit<Question, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  initialData?: Partial<MCQQuestion | EssayQuestion>;
  subjectId?: string;
  subjectName?: string;
  loading?: boolean;
  maxOptions?: number;
}

export default function QuestionForm({
  questionType,
  onSubmit,
  initialData,
  subjectId,
  subjectName,
  loading = false,
  maxOptions = 5
}: QuestionFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const answerFileInputRef = useRef<HTMLInputElement>(null);
  
  // Form state
  const [formData, setFormData] = useState<any>({
    title: '',
    content: '',
    imageUrl: '',
    type: questionType,
    subjectId: subjectId || '',
    subjectName: subjectName || '',
    topic: '',
    subtopic: '',
    points: 5,
    difficultyLevel: 'medium',
    // MCQ specific
    options: Array(4).fill(null).map((_, i) => ({
      id: String(i + 1),
      text: '',
      isCorrect: i === 0, // First option is correct by default
      imageUrl: ''
    })),
    correctAnswer: 'A',
    explanation: '',
    explanationImageUrl: '',
    // Essay specific
    suggestedAnswerContent: '',
    suggestedAnswerImageUrl: '',
    wordLimit: 500,
    minWordCount: 100
  });

  // Preview image states
  const [questionImagePreview, setQuestionImagePreview] = useState<string | null>(null);
  const [explanationImagePreview, setExplanationImagePreview] = useState<string | null>(null);
  const [optionImagePreviews, setOptionImagePreviews] = useState<Record<string, string>>({});

  // Initialize form with initial data if provided
  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        ...initialData,
        // Make sure options array is properly initialized for MCQs
        options: questionType === 'mcq' && initialData.options 
          ? initialData.options.map(opt => ({
              id: opt.id,
              text: opt.text,
              isCorrect: opt.isCorrect,
              imageUrl: opt.imageUrl || ''
            }))
          : prev.options,
      }));
      
      // Set image previews from initial data
      if (initialData.imageUrl) {
        setQuestionImagePreview(initialData.imageUrl);
      }
      
      if (questionType === 'mcq' && (initialData as MCQQuestion).explanationImageUrl) {
        setExplanationImagePreview((initialData as MCQQuestion).explanationImageUrl);
      }
      
      if (questionType === 'essay' && (initialData as EssayQuestion).suggestedAnswerImageUrl) {
        setExplanationImagePreview((initialData as EssayQuestion).suggestedAnswerImageUrl);
      }
      
      if (questionType === 'mcq' && (initialData as MCQQuestion).options) {
        const optionPreviews = {};
        (initialData as MCQQuestion).options.forEach(opt => {
          if (opt.imageUrl) {
            optionPreviews[opt.id] = opt.imageUrl;
          }
        });
        setOptionImagePreviews(optionPreviews);
      }
    }
  }, [initialData, questionType]);

  // Handle text input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) : value
    }));
  };

  // Handle MCQ option changes
  const handleOptionChange = (optionId: string, field: 'text' | 'imageUrl', value: string) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.map(opt => 
        opt.id === optionId ? { ...opt, [field]: value } : opt
      )
    }));
  };

  // Handle correct answer selection for MCQ
  const handleCorrectAnswerChange = (optionId: string) => {
    const updatedOptions = formData.options.map(opt => ({
      ...opt,
      isCorrect: opt.id === optionId
    }));
    
    // Convert numeric option ID to letter (1 -> A, 2 -> B, etc.)
    const numericId = parseInt(optionId);
    const letterOption = numericId >= 1 && numericId <= 26 
      ? String.fromCharCode(64 + numericId) // ASCII: A=65, so 1+64=65 (A)
      : optionId;
    
    setFormData(prev => ({
      ...prev,
      options: updatedOptions,
      correctAnswer: letterOption
    }));
  };

  // Add more options for MCQ (up to maxOptions)
  const handleAddOption = () => {
    if (formData.options.length < maxOptions) {
      const newOptionId = String(formData.options.length + 1);
      setFormData(prev => ({
        ...prev,
        options: [
          ...prev.options, 
          { 
            id: newOptionId, 
            text: '', 
            isCorrect: false,
            imageUrl: '' 
          }
        ]
      }));
    }
  };

  // Remove an option for MCQ
  const handleRemoveOption = (optionId: string) => {
    if (formData.options.length <= 2) return; // Maintain at least 2 options
    
    // Check if we're removing the correct option
    const isRemovingCorrect = formData.options.find(opt => opt.id === optionId)?.isCorrect;
    
    const filteredOptions = formData.options.filter(opt => opt.id !== optionId);
    
    // If removed option was correct, set first option as correct
    if (isRemovingCorrect && filteredOptions.length > 0) {
      filteredOptions[0].isCorrect = true;
      
      // Update correctAnswer letter
      setFormData(prev => ({
        ...prev,
        options: filteredOptions,
        correctAnswer: 'A'
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        options: filteredOptions
      }));
    }
    
    // Clean up any preview for this option
    if (optionImagePreviews[optionId]) {
      setOptionImagePreviews(prev => {
        const newPreviews = { ...prev };
        delete newPreviews[optionId];
        return newPreviews;
      });
    }
  };
  // Handle file input changes for question image
  const handleQuestionImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Create a local preview for immediate feedback
    const previewUrl = URL.createObjectURL(file);
    setQuestionImagePreview(previewUrl);
    
    try {
      // Show loading state
      setFormData(prev => ({ ...prev, isUploadingQuestionImage: true }));
      
      // Upload to Firebase Storage
      const formData = new FormData();
      formData.append('file', file);
      
      const token = localStorage.getItem('authToken'); // Implement your auth token retrieval
      const response = await fetch('/api/questions/upload-image?type=question', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }
      
      const { imageUrl } = await response.json();
      
      // Update form with the Firebase Storage URL
      setFormData(prev => ({
        ...prev,
        imageUrl,
        isUploadingQuestionImage: false
      }));
      
    } catch (error) {
      console.error('Error uploading question image:', error);
      // Reset upload state
      setFormData(prev => ({ ...prev, isUploadingQuestionImage: false }));
    }
  };

  // Handle file input changes for explanation image
  const handleExplanationImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Create a local preview for immediate feedback
    const previewUrl = URL.createObjectURL(file);
    setExplanationImagePreview(previewUrl);
    
    try {
      // Show loading state
      setFormData(prev => ({ ...prev, isUploadingExplanationImage: true }));
      
      // Upload to Firebase Storage
      const formData = new FormData();
      formData.append('file', file);
      
      const token = localStorage.getItem('authToken'); // Implement your auth token retrieval
      const response = await fetch('/api/questions/upload-image?type=explanation', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }
      
      const { imageUrl } = await response.json();
      
      // Update the appropriate field based on question type
      if (questionType === 'mcq') {
        setFormData(prev => ({
          ...prev,
          explanationImageUrl: imageUrl,
          isUploadingExplanationImage: false
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          suggestedAnswerImageUrl: imageUrl,
          isUploadingExplanationImage: false
        }));
      }
      
    } catch (error) {
      console.error('Error uploading explanation image:', error);
      // Reset upload state
      setFormData(prev => ({ ...prev, isUploadingExplanationImage: false }));
    }
  };

  // Handle file input changes for option image
  const handleOptionImageChange = async (e: React.ChangeEvent<HTMLInputElement>, optionId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Create a local preview for immediate feedback
    const previewUrl = URL.createObjectURL(file);
    setOptionImagePreviews(prev => ({
      ...prev,
      [optionId]: previewUrl
    }));
    
    try {
      // Show loading state for this option
      setFormData(prev => ({
        ...prev,
        options: prev.options.map(opt => 
          opt.id === optionId 
            ? { ...opt, isUploading: true } 
            : opt
        )
      }));
      
      // Upload to Firebase Storage
      const formData = new FormData();
      formData.append('file', file);
      
      const token = localStorage.getItem('authToken'); // Implement your auth token retrieval
      const response = await fetch(`/api/questions/upload-image?type=option&optionId=${optionId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }
      
      const { imageUrl } = await response.json();
      
      // Update the option with the Firebase Storage URL
      handleOptionChange(optionId, 'imageUrl', imageUrl);
      
      // Reset loading state for this option
      setFormData(prev => ({
        ...prev,
        options: prev.options.map(opt => 
          opt.id === optionId 
            ? { ...opt, isUploading: false } 
            : opt
        )
      }));
      
    } catch (error) {
      console.error(`Error uploading option image for option ${optionId}:`, error);
      // Reset loading state
      setFormData(prev => ({
        ...prev,
        options: prev.options.map(opt => 
          opt.id === optionId 
            ? { ...opt, isUploading: false } 
            : opt
        )
      }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // In a real app, images would be uploaded to storage before creating the question
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting question:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Question Title */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Question Title*
        </label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleInputChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter a title for this question"
          required
        />
      </div>

      {/* Question Content */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Question Content
        </label>
        <textarea
          name="content"
          value={formData.content}
          onChange={handleInputChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter the text content of the question (optional if using image)"
          rows={3}
        />
      </div>

      {/* Question Image Upload */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Question Image
        </label>
        <div className="flex items-center space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
          >
            Upload Image
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleQuestionImageChange}
            accept="image/*"
            className="hidden"
          />
          <span className="text-sm text-gray-500">
            {questionImagePreview ? 'Image selected' : 'No image selected'}
          </span>
        </div>
        {questionImagePreview && (
          <div className="mt-2 relative border border-gray-200 rounded-md overflow-hidden" style={{ maxWidth: '400px', maxHeight: '200px' }}>
            <Image 
              src={questionImagePreview} 
              alt="Question preview" 
              width={400} 
              height={200}
              objectFit="contain"
            />
            <Button
              type="button"
              variant="danger"
              size="sm"
              className="absolute top-2 right-2"
              onClick={() => {
                setQuestionImagePreview(null);
                setFormData(prev => ({ ...prev, imageUrl: '' }));
              }}
            >
              Remove
            </Button>
          </div>
        )}
      </div>

      {/* Topic and Subtopic */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Topic
          </label>
          <input
            type="text"
            name="topic"
            value={formData.topic}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., Algebra"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Subtopic
          </label>
          <input
            type="text"
            name="subtopic"
            value={formData.subtopic}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., Linear Equations"
          />
        </div>
      </div>

      {/* Points and Difficulty */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Points*
          </label>
          <input
            type="number"
            name="points"
            value={formData.points}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            min={1}
            max={100}
            required
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Difficulty Level*
          </label>
          <select
            name="difficultyLevel"
            value={formData.difficultyLevel}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
      </div>

      {/* MCQ-specific fields */}
      {questionType === 'mcq' && (
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="block text-sm font-medium text-gray-700">
                Options*
              </label>
              {formData.options.length < maxOptions && (
                <Button 
                  type="button" 
                  variant="secondary" 
                  size="sm"
                  onClick={handleAddOption}
                >
                  Add Option
                </Button>
              )}
            </div>
            
            <div className="space-y-4">
              {formData.options.map((option, index) => (
                <div key={option.id} className="border border-gray-200 rounded-md p-4 bg-gray-50">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id={`option-${option.id}-correct`}
                        name="correct-option"
                        checked={option.isCorrect}
                        onChange={() => handleCorrectAnswerChange(option.id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor={`option-${option.id}-correct`} className="text-sm font-medium text-gray-700">
                        Option {String.fromCharCode(65 + index)} (Correct)
                      </label>
                    </div>
                    
                    {formData.options.length > 2 && (
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        onClick={() => handleRemoveOption(option.id)}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    {/* Option text */}
                    <input
                      type="text"
                      value={option.text}
                      onChange={(e) => handleOptionChange(option.id, 'text', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder={`Text for option ${String.fromCharCode(65 + index)}`}
                    />
                    
                    {/* Option image upload */}
                    <div className="flex items-center space-x-4 mt-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const fileInput = document.getElementById(`option-${option.id}-image`);
                          fileInput?.click();
                        }}
                      >
                        Upload Image
                      </Button>
                      <input
                        type="file"
                        id={`option-${option.id}-image`}
                        onChange={(e) => handleOptionImageChange(e, option.id)}
                        accept="image/*"
                        className="hidden"
                      />
                      <span className="text-sm text-gray-500">
                        {optionImagePreviews[option.id] ? 'Image selected' : 'No image selected (optional)'}
                      </span>
                    </div>
                    
                    {optionImagePreviews[option.id] && (
                      <div className="mt-2 relative border border-gray-200 rounded-md overflow-hidden" style={{ maxWidth: '200px', maxHeight: '100px' }}>
                        <Image 
                          src={optionImagePreviews[option.id]} 
                          alt={`Option ${String.fromCharCode(65 + index)} preview`} 
                          width={200} 
                          height={100}
                          objectFit="contain"
                        />
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => {
                            setOptionImagePreviews(prev => {
                              const newPreviews = { ...prev };
                              delete newPreviews[option.id];
                              return newPreviews;
                            });
                            handleOptionChange(option.id, 'imageUrl', '');
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Explanation */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Explanation*
            </label>
            <textarea
              name="explanation"
              value={formData.explanation}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Explain why the correct answer is correct"
              rows={3}
              required={questionType === 'mcq'}
            />
          </div>

          {/* Explanation Image */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Explanation Image
            </label>
            <div className="flex items-center space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => answerFileInputRef.current?.click()}
              >
                Upload Image
              </Button>
              <input
                type="file"
                ref={answerFileInputRef}
                onChange={handleExplanationImageChange}
                accept="image/*"
                className="hidden"
              />
              <span className="text-sm text-gray-500">
                {explanationImagePreview ? 'Image selected' : 'No image selected'}
              </span>
            </div>
            {explanationImagePreview && (
              <div className="mt-2 relative border border-gray-200 rounded-md overflow-hidden" style={{ maxWidth: '400px', maxHeight: '200px' }}>
                <Image 
                  src={explanationImagePreview} 
                  alt="Explanation preview" 
                  width={400} 
                  height={200}
                  objectFit="contain"
                />
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => {
                    setExplanationImagePreview(null);
                    setFormData(prev => ({ ...prev, explanationImageUrl: '' }));
                  }}
                >
                  Remove
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Essay-specific fields */}
      {questionType === 'essay' && (
        <div className="space-y-6">
          {/* Word Count Requirements */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Minimum Word Count*
              </label>
              <input
                type="number"
                name="minWordCount"
                value={formData.minWordCount}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min={1}
                required={questionType === 'essay'}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Maximum Word Count*
              </label>
              <input
                type="number"
                name="wordLimit"
                value={formData.wordLimit}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min={formData.minWordCount}
                required={questionType === 'essay'}
              />
            </div>
          </div>

          {/* Suggested Answer */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Suggested Answer*
            </label>
            <textarea
              name="suggestedAnswerContent"
              value={formData.suggestedAnswerContent}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Provide a suggested answer for this essay question"
              rows={4}
              required={questionType === 'essay'}
            />
          </div>

          {/* Suggested Answer Image */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Suggested Answer Image
            </label>
            <div className="flex items-center space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => answerFileInputRef.current?.click()}
              >
                Upload Image
              </Button>
              <input
                type="file"
                ref={answerFileInputRef}
                onChange={handleExplanationImageChange}
                accept="image/*"
                className="hidden"
              />
              <span className="text-sm text-gray-500">
                {explanationImagePreview ? 'Image selected' : 'No image selected'}
              </span>
            </div>
            {explanationImagePreview && (
              <div className="mt-2 relative border border-gray-200 rounded-md overflow-hidden" style={{ maxWidth: '400px', maxHeight: '200px' }}>
                <Image 
                  src={explanationImagePreview} 
                  alt="Suggested answer preview" 
                  width={400} 
                  height={200}
                  objectFit="contain"
                />
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => {
                    setExplanationImagePreview(null);
                    setFormData(prev => ({ ...prev, suggestedAnswerImageUrl: '' }));
                  }}
                >
                  Remove
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex justify-end pt-4">
        <Button
          type="submit"
          variant="primary"
          isLoading={loading}
        >
          Save Question
        </Button>
      </div>
    </form>
  );
}
