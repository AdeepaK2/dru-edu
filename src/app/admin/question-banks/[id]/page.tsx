'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { QuestionBank, Question } from '@/models/questionBankSchema';
import { Button } from '@/components/ui';

// Mock timestamp for Firebase Timestamp
const mockTimestamp = {
  seconds: Math.floor(Date.now() / 1000),
  nanoseconds: 0,
  toDate: () => new Date()
};

interface QuestionBankDetailPageProps {
  params: {
    id: string;
  };
}

export default function QuestionBankDetailPage({ params }: QuestionBankDetailPageProps) {
  const router = useRouter();
  const bankId = params.id;
  
  const [questionBank, setQuestionBank] = useState<QuestionBank | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState({
    type: '',
    difficulty: ''
  });

  // Load question bank details
  useEffect(() => {
    setLoading(true);
    setError(null);
    
    // Simulate API delay
    const timer = setTimeout(() => {
      try {
        // In a real app, fetch from Firestore
        // const bank = await questionBankService.getQuestionBank(bankId);
        // if (!bank) throw new Error('Question bank not found');
        
        // Mock bank data for demo
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
        
        // Mock questions data
        const mockQuestions: Question[] = [
          {
            id: 'q1',
            title: 'Properties of Addition',
            content: 'What property of addition is demonstrated by the equation 3 + 5 = 5 + 3?',
            imageUrl: '',
            type: 'mcq',
            topic: 'Algebra',
            subtopic: 'Properties of Operations',
            difficultyLevel: 'easy',
            points: 5,
            options: [
              { id: '1', text: 'Commutative Property', isCorrect: true },
              { id: '2', text: 'Associative Property', isCorrect: false },
              { id: '3', text: 'Distributive Property', isCorrect: false },
              { id: '4', text: 'Identity Property', isCorrect: false }
            ],
            correctAnswer: 'A',
            explanation: 'The commutative property states that changing the order of the addends does not change the sum.',
            createdAt: mockTimestamp as any,
            updatedAt: mockTimestamp as any
          },
          {
            id: 'q2',
            title: 'Solving Equations',
            content: 'Solve for x: 2x + 5 = 15',
            imageUrl: '',
            type: 'mcq',
            topic: 'Algebra',
            subtopic: 'Linear Equations',
            difficultyLevel: 'medium',
            points: 10,
            options: [
              { id: '1', text: 'x = 5', isCorrect: true },
              { id: '2', text: 'x = 7', isCorrect: false },
              { id: '3', text: 'x = 10', isCorrect: false },
              { id: '4', text: 'x = 4', isCorrect: false }
            ],
            correctAnswer: 'A',
            explanation: 'To solve, subtract 5 from both sides: 2x = 10. Then divide both sides by 2: x = 5.',
            createdAt: mockTimestamp as any,
            updatedAt: mockTimestamp as any
          },
          {
            id: 'q3',
            title: 'Essay on Applications of Algebra',
            content: 'Explain three real-world applications of algebra and how algebraic concepts help solve practical problems.',
            imageUrl: '',
            type: 'essay',
            topic: 'Algebra',
            subtopic: 'Real-world Applications',
            difficultyLevel: 'hard',
            points: 20,
            suggestedAnswerContent: 'A comprehensive essay should explain how algebra is used in: 1) Financial planning - calculating interest, investments, etc. 2) Engineering - designing structures, calculating forces. 3) Computer Science - algorithms and coding logic. Each application should demonstrate how equations and variables represent real-world scenarios.',
            wordLimit: 500,
            minWordCount: 200,
            createdAt: mockTimestamp as any,
            updatedAt: mockTimestamp as any
          }
        ];
        
        setQuestionBank(mockBank);
        
        // Apply filters
        let filteredQuestions = [...mockQuestions];
        
        if (filter.type) {
          filteredQuestions = filteredQuestions.filter(q => q.type === filter.type);
        }
        
        if (filter.difficulty) {
          filteredQuestions = filteredQuestions.filter(q => q.difficultyLevel === filter.difficulty);
        }
        
        setQuestions(filteredQuestions);
        setLoading(false);
      } catch (err: any) {
        console.error("Error loading question bank:", err);
        setError(`Error: ${err.message || 'Failed to load question bank'}`);
        setLoading(false);
      }
    }, 800);
    
    return () => clearTimeout(timer);
  }, [bankId, filter]);

  // Handle filter changes
  const handleFilterChange = (type: string, value: string) => {
    setFilter(prev => ({
      ...prev,
      [type]: value === prev[type] ? '' : value // Toggle filter off if already active
    }));
  };

  // Handle removing a question from the bank
  const handleRemoveQuestion = async (questionId: string) => {
    if (!window.confirm('Are you sure you want to remove this question from the bank?')) {
      return;
    }
    
    try {
      // In a real app, call API to remove question
      // await questionBankService.removeQuestionsFromBank(bankId, [questionId]);
      
      // Update state
      setQuestions(prev => prev.filter(q => q.id !== questionId));
      
      if (questionBank) {
        const updatedBank = { ...questionBank };
        updatedBank.questionIds = questionBank.questionIds.filter(id => id !== questionId);
        updatedBank.totalQuestions--;
        
        // Update counts based on question type
        const removedQuestion = questions.find(q => q.id === questionId);
        if (removedQuestion?.type === 'mcq') {
          updatedBank.mcqCount = Math.max(0, updatedBank.mcqCount - 1);
        } else if (removedQuestion?.type === 'essay') {
          updatedBank.essayCount = Math.max(0, updatedBank.essayCount - 1);
        }
        
        setQuestionBank(updatedBank);
      }
    } catch (err: any) {
      console.error("Error removing question:", err);
      setError(`Error: ${err.message || 'Failed to remove question'}`);
    }
  };

  // Function to get letter option (A, B, C) from option index
  const getOptionLetter = (index: number) => {
    return String.fromCharCode(65 + index); // A = 65 in ASCII
  };

  if (loading) {
    return (
      <div className="px-6 py-8 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading question bank...</p>
        </div>
      </div>
    );
  }

  if (error || !questionBank) {
    return (
      <div className="px-6 py-8 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md">
            <p>{error || 'Question bank not found'}</p>
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
            <Link href="/admin/question-banks" className="text-blue-600 hover:text-blue-800 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Question Banks
            </Link>
          </div>
          
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{questionBank.name}</h1>
              <div className="mt-2 flex items-center">
                <span className="text-gray-600 mr-2">{questionBank.subjectName}</span>
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                  {questionBank.grade}
                </span>
              </div>
              {questionBank.description && (
                <p className="text-gray-600 mt-2 max-w-2xl">{questionBank.description}</p>
              )}
            </div>
            <div className="flex space-x-3">
              <Button
                variant="secondary"
                onClick={() => router.push(`/admin/question-banks/${bankId}/add-questions`)}
              >
                Add Questions
              </Button>
              <Button
                variant="primary"
                onClick={() => router.push(`/admin/question-banks/${bankId}/assign`)}
              >
                Assign to Class
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 mt-6 max-w-md">
            <div className="bg-gray-100 p-4 rounded-lg text-center">
              <span className="block text-2xl font-bold text-gray-700">{questionBank.totalQuestions}</span>
              <span className="text-sm text-gray-500">Total Questions</span>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <span className="block text-2xl font-bold text-green-700">{questionBank.mcqCount}</span>
              <span className="text-sm text-green-600">Multiple Choice</span>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg text-center">
              <span className="block text-2xl font-bold text-purple-700">{questionBank.essayCount}</span>
              <span className="text-sm text-purple-600">Essay</span>
            </div>
          </div>
        </div>
        
        {/* Filters */}
        <div className="mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-3">Filters</h2>
          <div className="flex space-x-3">
            <button
              onClick={() => handleFilterChange('type', 'mcq')}
              className={`px-4 py-2 rounded-md text-sm ${
                filter.type === 'mcq' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-white text-gray-700 border border-gray-200'
              }`}
            >
              Multiple Choice
            </button>
            <button
              onClick={() => handleFilterChange('type', 'essay')}
              className={`px-4 py-2 rounded-md text-sm ${
                filter.type === 'essay' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-white text-gray-700 border border-gray-200'
              }`}
            >
              Essay
            </button>
            <button
              onClick={() => handleFilterChange('difficulty', 'easy')}
              className={`px-4 py-2 rounded-md text-sm ${
                filter.difficulty === 'easy' 
                  ? 'bg-green-100 text-green-800 font-medium' 
                  : 'bg-white text-gray-700 border border-gray-200'
              }`}
            >
              Easy
            </button>
            <button
              onClick={() => handleFilterChange('difficulty', 'medium')}
              className={`px-4 py-2 rounded-md text-sm ${
                filter.difficulty === 'medium' 
                  ? 'bg-yellow-100 text-yellow-800 font-medium' 
                  : 'bg-white text-gray-700 border border-gray-200'
              }`}
            >
              Medium
            </button>
            <button
              onClick={() => handleFilterChange('difficulty', 'hard')}
              className={`px-4 py-2 rounded-md text-sm ${
                filter.difficulty === 'hard' 
                  ? 'bg-red-100 text-red-800 font-medium' 
                  : 'bg-white text-gray-700 border border-gray-200'
              }`}
            >
              Hard
            </button>
          </div>
        </div>
        
        {/* Questions List */}
        {questions.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-500">No questions found matching your filters.</p>
            <Button
              variant="primary"
              className="mt-4"
              onClick={() => router.push(`/admin/question-banks/${bankId}/add-questions`)}
            >
              Add Questions
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {questions.map((question) => (
              <div 
                key={question.id} 
                className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200"
              >
                <div className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
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
                      
                      <span className="text-sm text-gray-500">
                        {question.points} points
                      </span>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Link 
                        href={`/admin/question/edit/${question.id}`}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleRemoveQuestion(question.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-medium text-gray-900 mt-3">{question.title}</h3>
                  <p className="text-gray-700 mt-2">{question.content}</p>
                  
                  {question.imageUrl && (
                    <div className="mt-4">
                      <Image 
                        src={question.imageUrl} 
                        alt="Question image"
                        width={400}
                        height={200}
                        className="rounded-md object-contain"
                      />
                    </div>
                  )}
                  
                  {/* MCQ Options */}
                  {question.type === 'mcq' && (
                    <div className="mt-4 space-y-2">
                      <h4 className="text-sm font-medium text-gray-700">Options:</h4>
                      <div className="grid gap-2">
                        {question.options.map((option, index) => (
                          <div 
                            key={option.id}
                            className={`flex items-center p-3 rounded-md ${
                              option.isCorrect 
                                ? 'bg-green-50 border border-green-200' 
                                : 'bg-gray-50 border border-gray-200'
                            }`}
                          >
                            <span className={`flex items-center justify-center h-6 w-6 rounded-full mr-3 text-xs font-medium ${
                              option.isCorrect
                                ? 'bg-green-200 text-green-800'
                                : 'bg-gray-200 text-gray-800'
                            }`}>
                              {getOptionLetter(index)}
                            </span>
                            <span>{option.text}</span>
                            {option.isCorrect && (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-auto text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-4 bg-gray-50 p-4 rounded-md">
                        <h4 className="text-sm font-medium text-gray-700">Explanation:</h4>
                        <p className="text-gray-600 mt-1">{question.explanation}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Essay Details */}
                  {question.type === 'essay' && (
                    <div className="mt-4 space-y-4">
                      <div className="flex justify-between items-center px-4 py-2 bg-gray-50 rounded-md">
                        <div>
                          <span className="text-sm text-gray-500">Word Requirements:</span>
                          <span className="ml-2 font-medium">Min: {question.minWordCount}, Max: {question.wordLimit}</span>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-md">
                        <h4 className="text-sm font-medium text-gray-700">Suggested Answer:</h4>
                        <p className="text-gray-600 mt-1">{question.suggestedAnswerContent}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
