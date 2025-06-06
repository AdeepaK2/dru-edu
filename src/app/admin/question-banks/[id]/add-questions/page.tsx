'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Check } from 'lucide-react';
import { QuestionBank, Question } from '@/models/questionBankSchema';
import { questionBankService, questionService } from '@/apiservices/questionBankFirestoreService';
import { Button } from '@/components/ui';
import QuestionForm from '@/components/questions/QuestionForm';

interface AddQuestionsPageProps {
  params: {
    id: string;
  };
}

export default function AddQuestionsPage({ params }: AddQuestionsPageProps) {
  const router = useRouter();
  const bankId = params.id;
  
  const [questionBank, setQuestionBank] = useState<QuestionBank | null>(null);
  const [selectedTab, setSelectedTab] = useState<'new' | 'existing'>('new');
  const [questionType, setQuestionType] = useState<'mcq' | 'essay'>('mcq');
  const [existingQuestions, setExistingQuestions] = useState<Question[]>([]);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);  // Load question bank and existing questions
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch question bank
        const bank = await questionBankService.getQuestionBank(bankId);
        if (!bank) {
          throw new Error('Question bank not found');
        }
        
        setQuestionBank(bank);
        
        // Fetch existing questions not in this bank
        // Get all questions and filter out those already in this bank
        const allQuestions = await questionService.listQuestions();
        const questionsNotInBank = allQuestions.filter((q: Question) => !bank.questionIds.includes(q.id));
        
        setExistingQuestions(questionsNotInBank);
        setLoading(false);
      } catch (err: any) {
        console.error("Error loading data:", err);
        setError(`Error: ${err.message || 'Failed to load data'}`);
        setLoading(false);
      }
    };
    
    loadData();
  }, [bankId]);

  // Handle tab change
  const handleTabChange = (tab: 'new' | 'existing') => {
    setSelectedTab(tab);
    setError(null);
    setSuccessMessage(null);
  };

  // Handle question type change
  const handleQuestionTypeChange = (type: 'mcq' | 'essay') => {
    setQuestionType(type);
  };

  // Handle checkbox change for selecting existing questions
  const handleQuestionSelect = (questionId: string, checked: boolean) => {
    if (checked) {
      setSelectedQuestionIds(prev => [...prev, questionId]);
    } else {
      setSelectedQuestionIds(prev => prev.filter(id => id !== questionId));
    }
  };
  // Handle creation of a new question
  const handleCreateQuestion = async (questionData: Omit<Question, 'id' | 'createdAt' | 'updatedAt'>) => {
    setSubmitting(true);
    setError(null);
    
    try {
      // Create the question in Firebase
      const newQuestionId = await questionService.createQuestion(questionData);
      
      // Add the question to the question bank
      await questionBankService.addQuestionsToBank(bankId, [newQuestionId]);
      
      setSuccessMessage('Question created and added to the bank successfully!');
      setTimeout(() => {
        setSuccessMessage(null);
        // Redirect back to bank details
        router.push(`/admin/question-banks/${bankId}`);
      }, 2000);
    } catch (err: any) {
      console.error("Error creating question:", err);
      setError(`Error: ${err.message || 'Failed to create question'}`);
    } finally {
      setSubmitting(false);
    }
  };
  // Handle adding existing questions to the bank
  const handleAddExistingQuestions = async () => {
    if (selectedQuestionIds.length === 0) {
      setError('Please select at least one question.');
      return;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      // Add questions to the bank in Firebase
      await questionBankService.addQuestionsToBank(bankId, selectedQuestionIds);
      
      setSuccessMessage(`Added ${selectedQuestionIds.length} questions to the bank successfully!`);
      setTimeout(() => {
        setSuccessMessage(null);
        // Redirect back to bank details
        router.push(`/admin/question-banks/${bankId}`);
      }, 2000);
    } catch (err: any) {
      console.error("Error adding questions:", err);
      setError(`Error: ${err.message || 'Failed to add questions'}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="px-6 py-8 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!questionBank) {
    return (
      <div className="px-6 py-8 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md">
            <p>Question bank not found</p>
          </div>
          <div className="mt-6">
            <Link href="/admin/question-banks" className="text-blue-600 hover:text-blue-800 font-medium">
              &larr; Back to Question Banks
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">        <div className="mb-8">
          <div className="flex items-center mb-2">
            <Link href={`/admin/question-banks/${bankId}`} className="text-blue-600 hover:text-blue-800 flex items-center">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Question Bank
            </Link>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900">Add Questions</h1>
          <div className="mt-2">
            <h2 className="text-xl font-semibold text-gray-800">{questionBank.name}</h2>
            <div className="flex items-center mt-1">
              <span className="text-gray-600 mr-2">{questionBank.subjectName}</span>
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {questionBank.grade}
              </span>
              <span className="ml-3 text-gray-500">
                Current: {questionBank.totalQuestions} Questions ({questionBank.mcqCount} MCQ, {questionBank.essayCount} Essay)
              </span>
            </div>
          </div>
        </div>
        
        {/* Error/Success Messages */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md mb-6">
            <p>{error}</p>
          </div>
        )}
        
        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-md mb-6">
            <p>{successMessage}</p>
          </div>
        )}
        
        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => handleTabChange('new')}
                className={`${
                  selectedTab === 'new'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Create New Question
              </button>
              <button
                onClick={() => handleTabChange('existing')}
                className={`${
                  selectedTab === 'existing'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Add Existing Questions
              </button>
            </nav>
          </div>
        </div>
        
        {/* Create New Question Tab */}
        {selectedTab === 'new' && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Create New Question</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleQuestionTypeChange('mcq')}
                    className={`px-4 py-2 text-sm font-medium rounded-md ${
                      questionType === 'mcq'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    Multiple Choice
                  </button>
                  <button
                    onClick={() => handleQuestionTypeChange('essay')}
                    className={`px-4 py-2 text-sm font-medium rounded-md ${
                      questionType === 'essay'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    Essay
                  </button>
                </div>
              </div>
            </div>
            
            <div className="p-6">              <QuestionForm
                questionType={questionType}
                onSubmit={handleCreateQuestion}
                subjectId={questionBank.subjectId}
                subjectName={questionBank.subjectName}
                loading={submitting}
                currentQuestionCounts={{
                  mcqCount: questionBank.mcqCount || 0,
                  essayCount: questionBank.essayCount || 0
                }}
              />
            </div>
          </div>
        )}
        
        {/* Add Existing Questions Tab */}
        {selectedTab === 'existing' && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Add Existing Questions</h3>
                <Button
                  variant="primary"
                  onClick={handleAddExistingQuestions}
                  disabled={selectedQuestionIds.length === 0 || submitting}
                  isLoading={submitting}
                >
                  Add Selected Questions ({selectedQuestionIds.length})
                </Button>
              </div>
            </div>
            
            {existingQuestions.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No additional questions available to add.
              </div>
            ) : (
              <div className="p-4">
                <div className="space-y-4">
                  {existingQuestions.map((question) => (
                    <div key={question.id} className="border border-gray-200 rounded-md p-4">
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <input
                            type="checkbox"
                            id={`question-${question.id}`}
                            checked={selectedQuestionIds.includes(question.id)}
                            onChange={(e) => handleQuestionSelect(question.id, e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </div>
                        
                        <div className="ml-3 flex-grow">
                          <div className="flex justify-between items-start">
                            <label htmlFor={`question-${question.id}`} className="text-lg font-medium text-gray-900 cursor-pointer">
                              {question.title}
                            </label>
                            
                            <div className="flex items-center space-x-2">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                question.type === 'mcq' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-purple-100 text-purple-800'
                              }`}>
                                {question.type === 'mcq' ? 'Multiple Choice' : 'Essay'}
                              </span>
                              
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                question.difficultyLevel === 'easy' ? 'bg-green-100 text-green-800' :
                                question.difficultyLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {question.difficultyLevel.charAt(0).toUpperCase() + question.difficultyLevel.slice(1)}
                              </span>
                              
                              {question.topic && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  {question.topic}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <p className="text-gray-700 mt-1">{question.content}</p>
                          
                          {question.type === 'mcq' && (
                            <div className="mt-2 pl-4 border-l-2 border-gray-200">
                              <p className="text-sm text-gray-600">
                                Options: {question.options.length} | 
                                Correct: {
                                  question.options.findIndex(opt => opt.isCorrect) >= 0 ? 
                                    String.fromCharCode(65 + question.options.findIndex(opt => opt.isCorrect)) :
                                    'None set'
                                }
                              </p>
                            </div>
                          )}
                            {question.type === 'essay' && (
                            <div className="mt-2 pl-4 border-l-2 border-gray-200">
                              <p className="text-sm text-gray-600">
                                Essay Question
                              </p>
                            </div>
                          )}
                          
                          <div className="mt-2 text-sm text-gray-500">
                            Points: {question.points}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
