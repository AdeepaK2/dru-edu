'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Search } from 'lucide-react';
import { QuestionBank, Question } from '@/models/questionBankSchema';
import { questionBankService, questionService } from '@/apiservices/questionBankFirestoreService';
import { Button } from '@/components/ui';
import QuestionForm from '@/components/questions/QuestionForm';

interface QuestionManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  questionBank: QuestionBank;
  onQuestionBankUpdate: (updatedBank: QuestionBank) => void;
}

type TabType = 'create' | 'existing';

export default function QuestionManagementModal({
  isOpen,
  onClose,
  questionBank,
  onQuestionBankUpdate
}: QuestionManagementModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('create');
  const [existingQuestions, setExistingQuestions] = useState<Question[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [questionType, setQuestionType] = useState<'mcq' | 'essay'>('mcq');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOptions, setFilterOptions] = useState({
    type: '',
    difficulty: '',
    subject: ''
  });

  // Load existing questions when switching to existing tab
  useEffect(() => {
    if (isOpen && activeTab === 'existing') {
      loadExistingQuestions();
    }
  }, [isOpen, activeTab, filterOptions, searchTerm]);

  const loadExistingQuestions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get all questions
      const allQuestions = await questionService.listQuestions();
      
      // Filter out questions already in this bank
      const availableQuestions = allQuestions.filter(q => 
        !questionBank.questionIds?.includes(q.id)
      );
      
      // Apply filters
      let filteredQuestions = [...availableQuestions];
      
      if (filterOptions.type) {
        filteredQuestions = filteredQuestions.filter(q => q.type === filterOptions.type);
      }
        if (filterOptions.difficulty) {
        filteredQuestions = filteredQuestions.filter(q => q.difficultyLevel === filterOptions.difficulty);
      }
      
      // Note: Questions don't have subject property, so we skip subject filtering
      // if (filterOptions.subject) {
      //   filteredQuestions = filteredQuestions.filter(q => q.subjectName === filterOptions.subject);
      // }
        if (searchTerm) {
        const search = searchTerm.toLowerCase();
        filteredQuestions = filteredQuestions.filter(q => 
          q.title.toLowerCase().includes(search) ||
          q.content?.toLowerCase().includes(search)
        );
      }
      
      setExistingQuestions(filteredQuestions);
    } catch (err: any) {
      console.error("Error loading existing questions:", err);
      setError(`Error: ${err.message || 'Failed to load existing questions'}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle creating a new question
  const handleCreateQuestion = async (questionData: any) => {
    setLoading(true);
    setError(null);
    
    try {
      // Create the question
      const newQuestionId = await questionService.createQuestion({
        ...questionData,
        subjectId: questionBank.subjectId,
        subjectName: questionBank.subjectName,
        createdBy: 'admin', // You might want to get this from auth context
      });
      
      // Add the question to the question bank
      await questionBankService.addQuestionsToBank(questionBank.id, [newQuestionId]);
      
      // Update the question bank state
      const updatedBank = {
        ...questionBank,
        questionIds: [...(questionBank.questionIds || []), newQuestionId],
        totalQuestions: questionBank.totalQuestions + 1,
        mcqCount: questionData.type === 'mcq' ? questionBank.mcqCount + 1 : questionBank.mcqCount,
        essayCount: questionData.type === 'essay' ? questionBank.essayCount + 1 : questionBank.essayCount,
      };
      
      onQuestionBankUpdate(updatedBank);
      
      // Reset form by switching tabs and back
      setActiveTab('existing');
      setTimeout(() => setActiveTab('create'), 100);
      
    } catch (err: any) {
      console.error("Error creating question:", err);
      setError(`Error: ${err.message || 'Failed to create question'}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle adding existing questions
  const handleAddExistingQuestions = async () => {
    if (selectedQuestions.length === 0) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Add selected questions to the question bank
      await questionBankService.addQuestionsToBank(questionBank.id, selectedQuestions);
      
      // Count question types for updating bank stats
      const selectedQuestionDetails = existingQuestions.filter(q => 
        selectedQuestions.includes(q.id)
      );
      
      const mcqCount = selectedQuestionDetails.filter(q => q.type === 'mcq').length;
      const essayCount = selectedQuestionDetails.filter(q => q.type === 'essay').length;
      
      // Update the question bank state
      const updatedBank = {
        ...questionBank,
        questionIds: [...(questionBank.questionIds || []), ...selectedQuestions],
        totalQuestions: questionBank.totalQuestions + selectedQuestions.length,
        mcqCount: questionBank.mcqCount + mcqCount,
        essayCount: questionBank.essayCount + essayCount,
      };
      
      onQuestionBankUpdate(updatedBank);
      
      // Reset selection and reload existing questions
      setSelectedQuestions([]);
      loadExistingQuestions();
      
    } catch (err: any) {
      console.error("Error adding existing questions:", err);
      setError(`Error: ${err.message || 'Failed to add existing questions'}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle question selection
  const handleQuestionSelect = (questionId: string, isSelected: boolean) => {
    setSelectedQuestions(prev => 
      isSelected 
        ? [...prev, questionId]
        : prev.filter(id => id !== questionId)
    );
  };

  // Handle filter changes
  const handleFilterChange = (key: keyof typeof filterOptions, value: string) => {
    setFilterOptions(prev => ({
      ...prev,
      [key]: value === prev[key] ? '' : value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Add Questions</h2>
            <p className="text-sm text-gray-600 mt-1">
              Add questions to "{questionBank.name}"
            </p>
          </div>
          
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('create')}
            className={`px-6 py-3 text-sm font-medium ${
              activeTab === 'create'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Create New Question
          </button>
          <button
            onClick={() => setActiveTab('existing')}
            className={`px-6 py-3 text-sm font-medium ${
              activeTab === 'existing'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Add Existing Questions
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mx-6 mt-4 bg-red-50 border border-red-200 rounded-md p-3 text-red-600 text-sm">
            {error}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'create' && (
            <div className="p-6">
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Question Type
                </label>
                <div className="flex space-x-4">
                  <button
                    onClick={() => setQuestionType('mcq')}
                    className={`px-4 py-2 rounded-md text-sm font-medium ${
                      questionType === 'mcq'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Multiple Choice (MCQ)
                  </button>
                  <button
                    onClick={() => setQuestionType('essay')}
                    className={`px-4 py-2 rounded-md text-sm font-medium ${
                      questionType === 'essay'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Essay Question
                  </button>
                </div>
              </div>              <QuestionForm
                questionType={questionType}
                onSubmit={handleCreateQuestion}
                subjectId={questionBank.subjectId}
                subjectName={questionBank.subjectName}
                loading={loading}
                currentQuestionCounts={{
                  mcqCount: questionBank.mcqCount || 0,
                  essayCount: questionBank.essayCount || 0
                }}
              />
            </div>
          )}

          {activeTab === 'existing' && (
            <div className="p-6">
              {/* Search and Filters */}
              <div className="mb-6 space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search questions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleFilterChange('type', 'mcq')}
                    className={`px-3 py-1 rounded-md text-sm ${
                      filterOptions.type === 'mcq'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    MCQ Only
                  </button>
                  <button
                    onClick={() => handleFilterChange('type', 'essay')}
                    className={`px-3 py-1 rounded-md text-sm ${
                      filterOptions.type === 'essay'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Essay Only
                  </button>
                  <button
                    onClick={() => handleFilterChange('difficulty', 'easy')}
                    className={`px-3 py-1 rounded-md text-sm ${
                      filterOptions.difficulty === 'easy'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Easy
                  </button>
                  <button
                    onClick={() => handleFilterChange('difficulty', 'medium')}
                    className={`px-3 py-1 rounded-md text-sm ${
                      filterOptions.difficulty === 'medium'
                        ? 'bg-yellow-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Medium
                  </button>
                  <button
                    onClick={() => handleFilterChange('difficulty', 'hard')}
                    className={`px-3 py-1 rounded-md text-sm ${
                      filterOptions.difficulty === 'hard'
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Hard
                  </button>
                  
                  {(filterOptions.type || filterOptions.difficulty || searchTerm) && (
                    <button
                      onClick={() => {
                        setFilterOptions({ type: '', difficulty: '', subject: '' });
                        setSearchTerm('');
                      }}
                      className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800"
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              </div>

              {/* Question List */}
              {loading && (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              )}

              {!loading && existingQuestions.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500">No available questions found.</p>
                </div>
              )}

              {!loading && existingQuestions.length > 0 && (
                <>
                  <div className="mb-4 flex justify-between items-center">
                    <p className="text-sm text-gray-600">
                      {existingQuestions.length} questions available
                      {selectedQuestions.length > 0 && (
                        <span className="ml-2 font-medium">
                          ({selectedQuestions.length} selected)
                        </span>
                      )}
                    </p>
                    
                    {selectedQuestions.length > 0 && (
                      <Button
                        variant="primary"
                        onClick={handleAddExistingQuestions}
                        disabled={loading}
                        className="flex items-center space-x-2"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Selected ({selectedQuestions.length})</span>
                      </Button>
                    )}
                  </div>

                  <div className="space-y-4">
                    {existingQuestions.map((question) => (
                      <div
                        key={question.id}
                        className={`border border-gray-200 rounded-lg p-4 cursor-pointer transition-colors ${
                          selectedQuestions.includes(question.id)
                            ? 'border-blue-500 bg-blue-50'
                            : 'hover:border-gray-300'
                        }`}
                        onClick={() => handleQuestionSelect(
                          question.id,
                          !selectedQuestions.includes(question.id)
                        )}
                      >
                        <div className="flex items-start space-x-3">
                          <input
                            type="checkbox"
                            checked={selectedQuestions.includes(question.id)}
                            onChange={(e) => handleQuestionSelect(question.id, e.target.checked)}
                            className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                question.type === 'mcq' 
                                  ? 'bg-blue-100 text-blue-800' 
                                  : 'bg-purple-100 text-purple-800'
                              }`}>
                                {question.type.toUpperCase()}
                              </span>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                question.difficultyLevel === 'easy' ? 'bg-green-100 text-green-800' :
                                question.difficultyLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {question.difficultyLevel.charAt(0).toUpperCase() + question.difficultyLevel.slice(1)}
                              </span>
                            </div>
                              <h3 className="font-medium text-gray-900 mb-1">{question.title}</h3>
                            <p className="text-sm text-gray-600 line-clamp-2">{question.content}</p>
                            
                            {question.type === 'mcq' && question.options && (
                              <p className="text-xs text-gray-500 mt-1">
                                {question.options.length} options
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
