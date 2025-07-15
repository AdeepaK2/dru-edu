'use client';

import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Calendar, 
  Users, 
  BookOpen, 
  Settings, 
  Plus,
  Minus,
  Save,
  Eye,
  AlertTriangle
} from 'lucide-react';
import { useTeacherAuth } from '@/hooks/useTeacherAuth';
import { TestService } from '@/apiservices/testService';
import { 
  Test, 
  LiveTest, 
  FlexibleTest, 
  TestConfig, 
  QuestionBankSelection,
  TestQuestion 
} from '@/models/testSchema';
import { Timestamp } from 'firebase/firestore';

interface CreateTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTestCreated: (test: Test) => void;
  subjectId: string;
  subjectName: string;
  availableClasses: Array<{ id: string; name: string; }>;
  questionBanks: Array<{ id: string; name: string; totalQuestions: number; }>;
}

export default function CreateTestModal({
  isOpen,
  onClose,
  onTestCreated,
  subjectId,
  subjectName,
  availableClasses,
  questionBanks
}: CreateTestModalProps) {
  const { teacher } = useTeacherAuth();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  
  // Basic test info
  const [testType, setTestType] = useState<'live' | 'flexible'>('live');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  
  // Live test specific
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [duration, setDuration] = useState(60);
  const [bufferTime, setBufferTime] = useState(5);
  
  // Flexible test specific
  const [availableFrom, setAvailableFrom] = useState('');
  const [availableFromTime, setAvailableFromTime] = useState('');
  const [availableTo, setAvailableTo] = useState('');
  const [availableToTime, setAvailableToTime] = useState('');
  const [flexDuration, setFlexDuration] = useState(30);
  
  // Test configuration
  const [config, setConfig] = useState<TestConfig>({
    questionSelectionMethod: 'auto',
    totalQuestions: 20,
    shuffleQuestions: true,
    showQuestionsOneByOne: false,
    allowReviewBeforeSubmit: true,
    passingScore: 70,
    showResultsImmediately: true,
    difficultyBalance: {
      easy: 30,
      medium: 50,
      hard: 20
    }
  });
  
  // Question selection
  const [questionBankSelections, setQuestionBankSelections] = useState<QuestionBankSelection[]>([]);
  const [manualQuestions, setManualQuestions] = useState<TestQuestion[]>([]);
  
  // Validation
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setCurrentStep(1);
    setTestType('live');
    setTitle('');
    setDescription('');
    setInstructions('');
    setSelectedClasses([]);
    setScheduledDate('');
    setScheduledTime('');
    setDuration(60);
    setBufferTime(5);
    setAvailableFrom('');
    setAvailableFromTime('');
    setAvailableTo('');
    setAvailableToTime('');
    setFlexDuration(30);
    setConfig({
      questionSelectionMethod: 'auto',
      totalQuestions: 20,
      shuffleQuestions: true,
      showQuestionsOneByOne: false,
      allowReviewBeforeSubmit: true,
      passingScore: 70,
      showResultsImmediately: true,
      difficultyBalance: {
        easy: 30,
        medium: 50,
        hard: 20
      }
    });
    setQuestionBankSelections([]);
    setManualQuestions([]);
    setErrors({});
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!title.trim()) newErrors.title = 'Test title is required';
      if (selectedClasses.length === 0) newErrors.classes = 'Select at least one class';
      
      if (testType === 'live') {
        if (!scheduledDate) newErrors.scheduledDate = 'Scheduled date is required';
        if (!scheduledTime) newErrors.scheduledTime = 'Scheduled time is required';
        if (duration < 5) newErrors.duration = 'Duration must be at least 5 minutes';
      } else {
        if (!availableFrom) newErrors.availableFrom = 'Available from date is required';
        if (!availableFromTime) newErrors.availableFromTime = 'Available from time is required';
        if (!availableTo) newErrors.availableTo = 'Available to date is required';
        if (!availableToTime) newErrors.availableToTime = 'Available to time is required';
        if (flexDuration < 5) newErrors.flexDuration = 'Duration must be at least 5 minutes';
      }
    }

    if (step === 2) {
      if (config.totalQuestions < 1) newErrors.totalQuestions = 'Must have at least 1 question';
      if (config.difficultyBalance) {
        const total = config.difficultyBalance.easy + config.difficultyBalance.medium + config.difficultyBalance.hard;
        if (total !== 100) newErrors.difficultyBalance = 'Difficulty percentages must total 100%';
      }
    }

    if (step === 3) {
      if (config.questionSelectionMethod === 'auto' || config.questionSelectionMethod === 'mixed') {
        if (questionBankSelections.length === 0) {
          newErrors.questionBanks = 'Select at least one question bank';
        }
        const totalSelected = questionBankSelections.reduce((sum, sel) => sum + sel.questionCount, 0);
        if (totalSelected < config.totalQuestions) {
          newErrors.questionCount = 'Not enough questions selected from banks';
        }
      }
      
      if (config.questionSelectionMethod === 'manual') {
        if (manualQuestions.length !== config.totalQuestions) {
          newErrors.manualQuestions = `Must select exactly ${config.totalQuestions} questions`;
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const addQuestionBankSelection = () => {
    if (questionBanks.length > 0) {
      setQuestionBankSelections(prev => [...prev, {
        bankId: questionBanks[0].id,
        bankName: questionBanks[0].name,
        questionCount: 5,
        difficultyDistribution: config.difficultyBalance ? {
          easy: Math.ceil(5 * config.difficultyBalance.easy / 100),
          medium: Math.ceil(5 * config.difficultyBalance.medium / 100),
          hard: Math.ceil(5 * config.difficultyBalance.hard / 100)
        } : undefined
      }]);
    }
  };

  const removeQuestionBankSelection = (index: number) => {
    setQuestionBankSelections(prev => prev.filter((_, i) => i !== index));
  };

  const updateQuestionBankSelection = (index: number, updates: Partial<QuestionBankSelection>) => {
    setQuestionBankSelections(prev => prev.map((sel, i) => 
      i === index ? { ...sel, ...updates } : sel
    ));
  };

  const createTest = async () => {
    if (!validateStep(currentStep) || !teacher) return;

    setLoading(true);
    try {
      let questions: TestQuestion[] = [];

      // Handle question selection
      if (config.questionSelectionMethod === 'auto') {
        questions = await TestService.autoSelectQuestions(questionBankSelections, config);
      } else if (config.questionSelectionMethod === 'manual') {
        questions = manualQuestions;
      } else {
        // Mixed - combine manual and auto
        const autoQuestions = await TestService.autoSelectQuestions(questionBankSelections, {
          ...config,
          totalQuestions: config.totalQuestions - manualQuestions.length
        });
        questions = [...manualQuestions, ...autoQuestions];
      }

      const totalMarks = questions.reduce((sum, q) => sum + q.points, 0);

      const baseTestData = {
        title: title.trim(),
        description: description.trim(),
        instructions: instructions.trim(),
        teacherId: teacher.id,
        teacherName: teacher.name,
        subjectId,
        subjectName,
        classIds: selectedClasses,
        classNames: availableClasses
          .filter(c => selectedClasses.includes(c.id))
          .map(c => c.name),
        config,
        questions,
        totalMarks,
        status: 'scheduled' as const
      };

      let testData: Omit<Test, 'id' | 'createdAt' | 'updatedAt'>;

      if (testType === 'live') {
        const scheduledStartTime = Timestamp.fromDate(
          new Date(`${scheduledDate}T${scheduledTime}`)
        );
        const studentJoinTime = Timestamp.fromDate(
          new Date(scheduledStartTime.toDate().getTime() - 5 * 60 * 1000)
        );
        const actualEndTime = Timestamp.fromDate(
          new Date(scheduledStartTime.toDate().getTime() + (duration + bufferTime) * 60 * 1000)
        );

        testData = {
          ...baseTestData,
          type: 'live',
          scheduledStartTime,
          duration,
          bufferTime,
          studentJoinTime,
          actualEndTime,
          isLive: false,
          studentsOnline: 0,
          studentsCompleted: 0
        } as Omit<LiveTest, 'id' | 'createdAt' | 'updatedAt'>;
      } else {
        testData = {
          ...baseTestData,
          type: 'flexible',
          availableFrom: Timestamp.fromDate(
            new Date(`${availableFrom}T${availableFromTime}`)
          ),
          availableTo: Timestamp.fromDate(
            new Date(`${availableTo}T${availableToTime}`)
          ),
          duration: flexDuration,
          attemptsAllowed: 1
        } as Omit<FlexibleTest, 'id' | 'createdAt' | 'updatedAt'>;
      }

      const testId = await TestService.createTest(testData);
      const createdTest = await TestService.getTest(testId);
      
      if (createdTest) {
        onTestCreated(createdTest);
        onClose();
      }
    } catch (error) {
      console.error('Error creating test:', error);
      setErrors({ submit: 'Failed to create test. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Create New Test
          </h2>
          <div className="flex mt-4 space-x-4">
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className={`flex items-center space-x-2 ${
                  currentStep >= step
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-400'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    currentStep >= step
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-300 text-gray-600'
                  }`}
                >
                  {step}
                </div>
                <span className="text-sm font-medium">
                  {step === 1 && 'Basic Info'}
                  {step === 2 && 'Configuration'}
                  {step === 3 && 'Questions'}
                  {step === 4 && 'Review'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6">
          {currentStep === 1 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Basic Test Information
              </h3>

              {/* Test Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Test Type
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setTestType('live')}
                    className={`p-4 border rounded-lg text-left ${
                      testType === 'live'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Calendar className="h-5 w-5 text-blue-600" />
                      <div>
                        <div className="font-medium">Live/Scheduled Test</div>
                        <div className="text-sm text-gray-500">
                          All students take test simultaneously
                        </div>
                      </div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTestType('flexible')}
                    className={`p-4 border rounded-lg text-left ${
                      testType === 'flexible'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Clock className="h-5 w-5 text-green-600" />
                      <div>
                        <div className="font-medium">Flexible Duration</div>
                        <div className="text-sm text-gray-500">
                          Students can start within a period
                        </div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Basic Info */}
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Test Title *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Enter test title"
                  />
                  {errors.title && (
                    <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Enter test description"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Instructions for Students
                  </label>
                  <textarea
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Enter instructions for students"
                  />
                </div>
              </div>

              {/* Class Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Classes *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {availableClasses.map((cls) => (
                    <label
                      key={cls.id}
                      className="flex items-center space-x-3 p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <input
                        type="checkbox"
                        checked={selectedClasses.includes(cls.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedClasses(prev => [...prev, cls.id]);
                          } else {
                            setSelectedClasses(prev => prev.filter(id => id !== cls.id));
                          }
                        }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <Users className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-900 dark:text-white">
                        {cls.name}
                      </span>
                    </label>
                  ))}
                </div>
                {errors.classes && (
                  <p className="mt-1 text-sm text-red-600">{errors.classes}</p>
                )}
              </div>

              {/* Timing Configuration */}
              {testType === 'live' ? (
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Scheduled Date *
                    </label>
                    <input
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                    {errors.scheduledDate && (
                      <p className="mt-1 text-sm text-red-600">{errors.scheduledDate}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Scheduled Time *
                    </label>
                    <input
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                    {errors.scheduledTime && (
                      <p className="mt-1 text-sm text-red-600">{errors.scheduledTime}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Duration (minutes) *
                    </label>
                    <input
                      type="number"
                      value={duration}
                      onChange={(e) => setDuration(Number(e.target.value))}
                      min="5"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                    {errors.duration && (
                      <p className="mt-1 text-sm text-red-600">{errors.duration}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Buffer Time (minutes)
                    </label>
                    <input
                      type="number"
                      value={bufferTime}
                      onChange={(e) => setBufferTime(Number(e.target.value))}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Additional time after test ends for submission
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Available From Date *
                    </label>
                    <input
                      type="date"
                      value={availableFrom}
                      onChange={(e) => setAvailableFrom(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                    {errors.availableFrom && (
                      <p className="mt-1 text-sm text-red-600">{errors.availableFrom}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Available From Time *
                    </label>
                    <input
                      type="time"
                      value={availableFromTime}
                      onChange={(e) => setAvailableFromTime(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                    {errors.availableFromTime && (
                      <p className="mt-1 text-sm text-red-600">{errors.availableFromTime}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Available To Date *
                    </label>
                    <input
                      type="date"
                      value={availableTo}
                      onChange={(e) => setAvailableTo(e.target.value)}
                      min={availableFrom || new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                    {errors.availableTo && (
                      <p className="mt-1 text-sm text-red-600">{errors.availableTo}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Available To Time *
                    </label>
                    <input
                      type="time"
                      value={availableToTime}
                      onChange={(e) => setAvailableToTime(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                    {errors.availableToTime && (
                      <p className="mt-1 text-sm text-red-600">{errors.availableToTime}</p>
                    )}
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Test Duration (minutes) *
                    </label>
                    <input
                      type="number"
                      value={flexDuration}
                      onChange={(e) => setFlexDuration(Number(e.target.value))}
                      min="5"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Time given to complete the test once started
                    </p>
                    {errors.flexDuration && (
                      <p className="mt-1 text-sm text-red-600">{errors.flexDuration}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Test Configuration
              </h3>

              {/* Question Selection Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Question Selection Method
                </label>
                <div className="space-y-3">
                  <label className="flex items-center space-x-3">
                    <input
                      type="radio"
                      name="questionMethod"
                      value="auto"
                      checked={config.questionSelectionMethod === 'auto'}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        questionSelectionMethod: e.target.value as any
                      }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <div className="font-medium">Auto Select from Question Banks</div>
                      <div className="text-sm text-gray-500">
                        System randomly selects questions based on your criteria
                      </div>
                    </div>
                  </label>
                  <label className="flex items-center space-x-3">
                    <input
                      type="radio"
                      name="questionMethod"
                      value="manual"
                      checked={config.questionSelectionMethod === 'manual'}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        questionSelectionMethod: e.target.value as any
                      }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <div className="font-medium">Manually Select Questions</div>
                      <div className="text-sm text-gray-500">
                        Choose specific questions from question banks
                      </div>
                    </div>
                  </label>
                  <label className="flex items-center space-x-3">
                    <input
                      type="radio"
                      name="questionMethod"
                      value="mixed"
                      checked={config.questionSelectionMethod === 'mixed'}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        questionSelectionMethod: e.target.value as any
                      }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <div className="font-medium">Mixed Selection</div>
                      <div className="text-sm text-gray-500">
                        Combine manually selected and auto-selected questions
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Number of Questions */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Total Questions *
                  </label>
                  <input
                    type="number"
                    value={config.totalQuestions}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      totalQuestions: Number(e.target.value)
                    }))}
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                  {errors.totalQuestions && (
                    <p className="mt-1 text-sm text-red-600">{errors.totalQuestions}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Passing Score (%)
                  </label>
                  <input
                    type="number"
                    value={config.passingScore || ''}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      passingScore: e.target.value ? Number(e.target.value) : undefined
                    }))}
                    min="0"
                    max="100"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Optional"
                  />
                </div>
              </div>

              {/* Difficulty Balance */}
              {(config.questionSelectionMethod === 'auto' || config.questionSelectionMethod === 'mixed') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Difficulty Balance (%)
                  </label>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Easy</label>
                      <input
                        type="number"
                        value={config.difficultyBalance?.easy || 0}
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          difficultyBalance: {
                            ...prev.difficultyBalance!,
                            easy: Number(e.target.value)
                          }
                        }))}
                        min="0"
                        max="100"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Medium</label>
                      <input
                        type="number"
                        value={config.difficultyBalance?.medium || 0}
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          difficultyBalance: {
                            ...prev.difficultyBalance!,
                            medium: Number(e.target.value)
                          }
                        }))}
                        min="0"
                        max="100"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Hard</label>
                      <input
                        type="number"
                        value={config.difficultyBalance?.hard || 0}
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          difficultyBalance: {
                            ...prev.difficultyBalance!,
                            hard: Number(e.target.value)
                          }
                        }))}
                        min="0"
                        max="100"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>
                  {errors.difficultyBalance && (
                    <p className="mt-1 text-sm text-red-600">{errors.difficultyBalance}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Total must equal 100%. Current total: {
                      (config.difficultyBalance?.easy || 0) +
                      (config.difficultyBalance?.medium || 0) +
                      (config.difficultyBalance?.hard || 0)
                    }%
                  </p>
                </div>
              )}

              {/* Test Options */}
              <div className="space-y-4">
                <h4 className="text-md font-medium text-gray-900 dark:text-white">Test Options</h4>
                
                <div className="space-y-3">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={config.shuffleQuestions}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        shuffleQuestions: e.target.checked
                      }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div>
                      <div className="font-medium">Shuffle Questions</div>
                      <div className="text-sm text-gray-500">
                        Questions appear in random order for each student
                      </div>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={config.allowReviewBeforeSubmit}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        allowReviewBeforeSubmit: e.target.checked
                      }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div>
                      <div className="font-medium">Allow Review Before Submit</div>
                      <div className="text-sm text-gray-500">
                        Students can review answers before final submission
                      </div>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={config.showResultsImmediately}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        showResultsImmediately: e.target.checked
                      }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div>
                      <div className="font-medium">Show Results Immediately</div>
                      <div className="text-sm text-gray-500">
                        Students see MCQ results right after submission
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Question Selection
              </h3>

              {(config.questionSelectionMethod === 'auto' || config.questionSelectionMethod === 'mixed') && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-md font-medium text-gray-900 dark:text-white">
                      Question Banks
                    </h4>
                    <button
                      type="button"
                      onClick={addQuestionBankSelection}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Bank
                    </button>
                  </div>

                  <div className="space-y-4">
                    {questionBankSelections.map((selection, index) => (
                      <div key={index} className="border border-gray-300 dark:border-gray-600 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="font-medium text-gray-900 dark:text-white">
                            Question Bank {index + 1}
                          </h5>
                          <button
                            type="button"
                            onClick={() => removeQuestionBankSelection(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Question Bank
                            </label>
                            <select
                              value={selection.bankId}
                              onChange={(e) => {
                                const selectedBank = questionBanks.find(b => b.id === e.target.value);
                                updateQuestionBankSelection(index, {
                                  bankId: e.target.value,
                                  bankName: selectedBank?.name || ''
                                });
                              }}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                            >
                              {questionBanks.map((bank) => (
                                <option key={bank.id} value={bank.id}>
                                  {bank.name} ({bank.totalQuestions} questions)
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Number of Questions
                            </label>
                            <input
                              type="number"
                              value={selection.questionCount}
                              onChange={(e) => updateQuestionBankSelection(index, {
                                questionCount: Number(e.target.value)
                              })}
                              min="1"
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {errors.questionBanks && (
                    <p className="mt-1 text-sm text-red-600">{errors.questionBanks}</p>
                  )}
                  {errors.questionCount && (
                    <p className="mt-1 text-sm text-red-600">{errors.questionCount}</p>
                  )}

                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <h5 className="font-medium text-blue-900 dark:text-blue-100">
                          Question Selection Summary
                        </h5>
                        <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                          Total questions to select: {questionBankSelections.reduce((sum, sel) => sum + sel.questionCount, 0)} / {config.totalQuestions}
                        </p>
                        {questionBankSelections.reduce((sum, sel) => sum + sel.questionCount, 0) !== config.totalQuestions && (
                          <p className="text-sm text-orange-600 dark:text-orange-400 mt-1">
                            Warning: Selected questions don't match total required questions
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {config.questionSelectionMethod === 'manual' && (
                <div className="text-center py-8">
                  <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Manual Question Selection
                  </h4>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    Manual question selection interface will be implemented in the next step
                  </p>
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    For now, please use Auto or Mixed selection method
                  </p>
                </div>
              )}
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Review & Create Test
              </h3>

              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Test Details</h4>
                  <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                    <p><strong>Title:</strong> {title}</p>
                    <p><strong>Type:</strong> {testType === 'live' ? 'Live/Scheduled Test' : 'Flexible Duration Test'}</p>
                    <p><strong>Subject:</strong> {subjectName}</p>
                    <p><strong>Classes:</strong> {availableClasses.filter(c => selectedClasses.includes(c.id)).map(c => c.name).join(', ')}</p>
                    {description && <p><strong>Description:</strong> {description}</p>}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Timing</h4>
                  <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                    {testType === 'live' ? (
                      <>
                        <p><strong>Scheduled:</strong> {scheduledDate} at {scheduledTime}</p>
                        <p><strong>Duration:</strong> {duration} minutes</p>
                        <p><strong>Buffer Time:</strong> {bufferTime} minutes</p>
                        <p><strong>Students can join:</strong> 5 minutes before start time</p>
                      </>
                    ) : (
                      <>
                        <p><strong>Available From:</strong> {availableFrom} at {availableFromTime}</p>
                        <p><strong>Available To:</strong> {availableTo} at {availableToTime}</p>
                        <p><strong>Test Duration:</strong> {flexDuration} minutes</p>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Questions</h4>
                  <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                    <p><strong>Total Questions:</strong> {config.totalQuestions}</p>
                    <p><strong>Selection Method:</strong> {config.questionSelectionMethod}</p>
                    <p><strong>Shuffle Questions:</strong> {config.shuffleQuestions ? 'Yes' : 'No'}</p>
                    <p><strong>Allow Review:</strong> {config.allowReviewBeforeSubmit ? 'Yes' : 'No'}</p>
                    {config.passingScore && <p><strong>Passing Score:</strong> {config.passingScore}%</p>}
                  </div>
                </div>

                {questionBankSelections.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Question Banks</h4>
                    <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                      {questionBankSelections.map((selection, index) => (
                        <p key={index}>
                          <strong>{selection.bankName}:</strong> {selection.questionCount} questions
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {errors.submit && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.submit}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-between">
          <div>
            {currentStep > 1 && (
              <button
                type="button"
                onClick={prevStep}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Previous
              </button>
            )}
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={nextStep}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                onClick={createTest}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Create Test
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
