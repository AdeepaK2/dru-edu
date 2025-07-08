'use client';

import { useState, useEffect } from 'react';
import { X, BookOpen, Edit, Trash2, Plus } from 'lucide-react';
import { QuestionBank, Question } from '@/models/questionBankSchema';
import { questionBankService, questionService } from '@/apiservices/questionBankFirestoreService';
import { Button, ConfirmDialog } from '@/components/ui';

interface QuestionBankDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  questionBank: QuestionBank;
  onQuestionBankUpdate: (updatedBank: QuestionBank) => void;
  onAddQuestions: (questionBank: QuestionBank) => void;
}

export default function QuestionBankDetailModal({
  isOpen,
  onClose,
  questionBank,
  onQuestionBankUpdate,
  onAddQuestions
}: QuestionBankDetailModalProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState({
    type: '',
    difficulty: ''
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<Question | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Load questions when modal opens or question bank changes
  useEffect(() => {
    if (isOpen && questionBank) {
      loadQuestions();
    }
  }, [isOpen, questionBank, filter]);

  const loadQuestions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (questionBank.questionIds && questionBank.questionIds.length > 0) {
        const questionPromises = questionBank.questionIds.map(questionId => 
          questionService.getQuestion(questionId)
        );
        
        const fetchedQuestions = await Promise.all(questionPromises);
        const validQuestions = fetchedQuestions.filter(q => q !== null) as Question[];
        
        // Apply filters
        let filteredQuestions = [...validQuestions];
        
        if (filter.type) {
          filteredQuestions = filteredQuestions.filter(q => q.type === filter.type);
        }
        
        if (filter.difficulty) {
          filteredQuestions = filteredQuestions.filter(q => q.difficultyLevel === filter.difficulty);
        }
        
        setQuestions(filteredQuestions);
      } else {
        setQuestions([]);
      }
    } catch (err: any) {
      console.error("Error loading questions:", err);
      setError(`Error: ${err.message || 'Failed to load questions'}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle filter changes
  const handleFilterChange = (type: keyof typeof filter, value: string) => {
    setFilter(prev => ({
      ...prev,
      [type]: value === prev[type] ? '' : value // Toggle filter off if already active
    }));
  };

  // Handle removing a question from the bank
  const handleRemoveQuestionClick = (question: Question) => {
    setQuestionToDelete(question);
    setShowDeleteConfirm(true);
  };

  const handleRemoveQuestion = async () => {
    if (!questionToDelete) return;
    
    setActionLoading('remove');
    
    try {
      await questionBankService.removeQuestionsFromBank(questionBank.id, [questionToDelete.id]);
      
      // Update local questions list
      setQuestions(prev => prev.filter(q => q.id !== questionToDelete.id));
      
      // Update question bank counts
      const updatedBank = {
        ...questionBank,
        questionIds: questionBank.questionIds?.filter(id => id !== questionToDelete.id) || [],
        totalQuestions: questionBank.totalQuestions - 1,
        mcqCount: questionToDelete.type === 'mcq' ? questionBank.mcqCount - 1 : questionBank.mcqCount,
        essayCount: questionToDelete.type === 'essay' ? questionBank.essayCount - 1 : questionBank.essayCount,
      };
      
      onQuestionBankUpdate(updatedBank);
      
      setShowDeleteConfirm(false);
      setQuestionToDelete(null);
    } catch (err: any) {
      console.error("Error removing question:", err);
      setError(`Error: ${err.message || 'Failed to remove question'}`);
    } finally {
      setActionLoading(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{questionBank.name}</h2>
            <p className="text-sm text-gray-600 mt-1">
              {questionBank.subjectName} • {questionBank.grade || 'No grade assigned'}
            </p>
            {questionBank.description && (
              <p className="text-sm text-gray-500 mt-1">{questionBank.description}</p>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => onAddQuestions(questionBank)}
              className="flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Questions</span>
            </Button>
            
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Question Bank Stats */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex flex-wrap gap-4">
            <div className="bg-blue-100 rounded-md px-3 py-1 text-sm text-blue-800">
              {questionBank.totalQuestions} Total Questions
            </div>
            <div className="bg-green-100 rounded-md px-3 py-1 text-sm text-green-800">
              {questionBank.mcqCount} MCQ
            </div>
            <div className="bg-purple-100 rounded-md px-3 py-1 text-sm text-purple-800">
              {questionBank.essayCount} Essay
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="px-6 py-4 bg-white border-b border-gray-200">
          <div className="flex flex-wrap gap-4">
            <div className="flex space-x-2">
              <button
                onClick={() => handleFilterChange('type', 'mcq')}
                className={`px-3 py-1 rounded-md text-sm ${
                  filter.type === 'mcq'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                MCQ Only
              </button>
              <button
                onClick={() => handleFilterChange('type', 'essay')}
                className={`px-3 py-1 rounded-md text-sm ${
                  filter.type === 'essay'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Essay Only
              </button>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => handleFilterChange('difficulty', 'easy')}
                className={`px-3 py-1 rounded-md text-sm ${
                  filter.difficulty === 'easy'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Easy
              </button>
              <button
                onClick={() => handleFilterChange('difficulty', 'medium')}
                className={`px-3 py-1 rounded-md text-sm ${
                  filter.difficulty === 'medium'
                    ? 'bg-yellow-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Medium
              </button>
              <button
                onClick={() => handleFilterChange('difficulty', 'hard')}
                className={`px-3 py-1 rounded-md text-sm ${
                  filter.difficulty === 'hard'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Hard
              </button>
            </div>
          </div>
          
          {(filter.type || filter.difficulty) && (
            <button
              onClick={() => setFilter({ type: '', difficulty: '' })}
              className="mt-2 text-sm text-blue-600 hover:text-blue-800"
            >
              Clear all filters
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 text-center text-red-600">
              {error}
            </div>
          )}

          {!loading && !error && questions.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No questions found</h3>
              <p className="text-gray-500 mb-4">
                {questionBank.totalQuestions === 0 
                  ? "This question bank doesn't have any questions yet."
                  : "No questions match your current filters."}
              </p>
              <Button
                variant="primary"
                onClick={() => onAddQuestions(questionBank)}
                className="flex items-center space-x-2 mx-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Add Questions</span>
              </Button>
            </div>
          )}

          {!loading && !error && questions.length > 0 && (
            <div className="space-y-6">
              {questions.map((question, index) => (
                <div key={question.id} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-sm font-medium">
                          #{index + 1}
                        </span>
                        <span className={`px-2 py-1 rounded text-sm font-medium ${
                          question.type === 'mcq' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {question.type.toUpperCase()}
                        </span>
                        <span className={`px-2 py-1 rounded text-sm font-medium ${
                          question.difficultyLevel === 'easy' ? 'bg-green-100 text-green-800' :
                          question.difficultyLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {question.difficultyLevel.charAt(0).toUpperCase() + question.difficultyLevel.slice(1)}
                        </span>
                      </div>
                        <h3 className="text-lg font-medium text-gray-800 mb-2">{question.title}</h3>
                      <p className="text-gray-600">{question.content}</p>
                    </div>
                    
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleRemoveQuestionClick(question)}
                      className="flex items-center space-x-1 ml-4"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Remove</span>
                    </Button>
                  </div>
                  
                  {/* MCQ Details */}
                  {question.type === 'mcq' && (
                    <div className="mt-4 space-y-3">
                      <h4 className="text-sm font-medium text-gray-700">Answer Options:</h4>                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {question.options?.map((option, optionIndex) => (
                          <div 
                            key={optionIndex}
                            className={`p-3 rounded-md border ${
                              option.isCorrect 
                                ? 'bg-green-50 border-green-200 text-green-800' 
                                : 'bg-white border-gray-200 text-gray-700'
                            }`}
                          >
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">
                                {String.fromCharCode(65 + optionIndex)}.
                              </span>
                              <span>{option.text}</span>
                              {option.isCorrect && (
                                <span className="text-green-600 text-sm">✓ Correct</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {question.explanation && (
                        <div className="bg-blue-50 p-3 rounded-md">
                          <h4 className="text-sm font-medium text-blue-800">Explanation:</h4>
                          <p className="text-blue-700 mt-1">{question.explanation}</p>
                        </div>
                      )}
                    </div>
                  )}
                    {/* Essay Details */}
                  {question.type === 'essay' && (
                    <div className="mt-4 space-y-4">
                      {/* Display suggested answer if available */}
                      {(question.suggestedAnswerContent || question.suggestedAnswerImageUrl) && (
                        <div className="bg-gray-100 p-4 rounded-md">
                          <h4 className="text-sm font-medium text-gray-700">Suggested Answer:</h4>
                          {question.suggestedAnswerContent && (
                            <p className="text-gray-600 mt-1">{question.suggestedAnswerContent}</p>
                          )}
                          {question.suggestedAnswerImageUrl && (
                            <div className="mt-2">
                              <img
                                src={question.suggestedAnswerImageUrl}
                                alt="Suggested Answer"
                                className="max-w-md max-h-48 object-contain border rounded-lg"
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Delete Confirmation Dialog */}
        {showDeleteConfirm && questionToDelete && (
          <ConfirmDialog
            isOpen={showDeleteConfirm}
            onClose={() => {
              setShowDeleteConfirm(false);
              setQuestionToDelete(null);
            }}
            onConfirm={handleRemoveQuestion}
            isLoading={actionLoading === 'remove'}
            title="Remove Question"
            description={`Are you sure you want to remove "${questionToDelete.title}" from this question bank? The question itself will not be deleted.`}
            confirmText="Remove"
            cancelText="Cancel"
            variant="danger"
          />
        )}
      </div>
    </div>
  );
}
