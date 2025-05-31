'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { QuestionBank, Question } from '@/models/questionBankSchema';
import { Button } from '@/components/ui';
import QuestionForm from '@/components/questions/QuestionForm';

// Mock timestamp for Firebase Timestamp
const mockTimestamp = {
  seconds: Math.floor(Date.now() / 1000),
  nanoseconds: 0,
  toDate: () => new Date()
};

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
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load question bank and existing questions
  useEffect(() => {
    setLoading(true);
    setError(null);
    
    // Simulate API delay
    const timer = setTimeout(() => {
      try {
        // In a real app, fetch from Firestore
        // const bank = await questionBankService.getQuestionBank(bankId);
        // if (!bank) throw new Error('Question bank not found');
        
        // Mock bank data
        const mockBank: QuestionBank = {
          id: bankId,
          name: 'Algebra Basics',
          description: 'Fundamental concepts of algebra for 6th grade',
          subjectId: 'math-g6',
          subjectName: 'Mathematics',
          grade: 'Grade 6',
          questionIds: ['q1', 'q2', 'q3'],
          totalQuestions: 3,
          mcqCount: 2,
          essayCount: 1,
          createdAt: mockTimestamp as any,
          updatedAt: mockTimestamp as any
        };
        
        // Mock existing questions not in this bank
        const mockQuestions: Question[] = [
          {
            id: 'q4',
            title: 'Solving Multi-Step Equations',
            content: 'Solve for x: 3(x + 2) = 18',
            imageUrl: '',
            type: 'mcq',
            topic: 'Algebra',
            subtopic: 'Linear Equations',
            difficultyLevel: 'hard',
            points: 15,
            options: [
              { id: '1', text: 'x = 4', isCorrect: true },
              { id: '2', text: 'x = 5', isCorrect: false },
              { id: '3', text: 'x = 6', isCorrect: false },
              { id: '4', text: 'x = 3', isCorrect: false }
            ],
            correctAnswer: 'A',
            explanation: 'First, distribute the 3: 3x + 6 = 18. Then subtract 6 from both sides: 3x = 12. Finally, divide by 3: x = 4.',
            createdAt: mockTimestamp as any,
            updatedAt: mockTimestamp as any
          },
          {
            id: 'q5',
            title: 'Algebraic Expressions',
            content: 'Which of the following is equivalent to 3(2x + 4)?',
            imageUrl: '',
            type: 'mcq',
            topic: 'Algebra',
            subtopic: 'Expressions',
            difficultyLevel: 'medium',
            points: 10,
            options: [
              { id: '1', text: '6x + 12', isCorrect: true },
              { id: '2', text: '5x + 4', isCorrect: false },
              { id: '3', text: '6x + 4', isCorrect: false },
              { id: '4', text: '3x + 12', isCorrect: false }
            ],
            correctAnswer: 'A',
            explanation: 'To distribute the 3, multiply it by each term inside the parentheses: 3(2x + 4) = 3*2x + 3*4 = 6x + 12.',
            createdAt: mockTimestamp as any,
            updatedAt: mockTimestamp as any
          },
          {
            id: 'q6',
            title: 'Writing About the Importance of Algebra',
            content: 'Write an essay discussing why algebra is important in everyday life and provide at least three real-world examples.',
            imageUrl: '',
            type: 'essay',
            topic: 'Algebra',
            subtopic: 'Applications',
            difficultyLevel: 'medium',
            points: 25,
            suggestedAnswerContent: 'A good essay would discuss how algebra helps with budgeting, taxes, analyzing data, understanding growth and decay rates, etc. Examples might include calculating interest on loans, determining the best cell phone plan, or figuring out how long a project will take.',
            wordLimit: 600,
            minWordCount: 300,
            createdAt: mockTimestamp as any,
            updatedAt: mockTimestamp as any
          }
        ];
        
        setQuestionBank(mockBank);
        setExistingQuestions(mockQuestions);
        setLoading(false);
      } catch (err: any) {
        console.error("Error loading data:", err);
        setError(`Error: ${err.message || 'Failed to load data'}`);
        setLoading(false);
      }
    }, 800);
    
    return () => clearTimeout(timer);
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
      // In a real app, submit to API
      // const newQuestionId = await questionService.createQuestion(questionData);
      // await questionBankService.addQuestionsToBank(bankId, [newQuestionId]);
      
      // Mock success
      setSuccessMessage('Question created and added to the bank successfully!');
      setTimeout(() => {
        setSuccessMessage(null);
        // Optionally redirect back to bank details
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
      // In a real app, submit to API
      // await questionBankService.addQuestionsToBank(bankId, selectedQuestionIds);
      
      // Mock success
      setSuccessMessage(`Added ${selectedQuestionIds.length} questions to the bank successfully!`);
      setTimeout(() => {
        setSuccessMessage(null);
        // Optionally redirect back to bank details
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
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center mb-2">
            <Link href={`/admin/question-banks/${bankId}`} className="text-blue-600 hover:text-blue-800 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
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
            
            <div className="p-6">
              <QuestionForm
                questionType={questionType}
                onSubmit={handleCreateQuestion}
                subjectId={questionBank.subjectId}
                subjectName={questionBank.subjectName}
                loading={submitting}
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
                                Word count: {question.minWordCount}-{question.wordLimit}
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
