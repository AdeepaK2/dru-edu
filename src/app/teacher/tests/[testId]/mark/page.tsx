'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Download, 
  Eye, 
  FileText, 
  Clock, 
  User, 
  CheckCircle,
  AlertCircle,
  GraduationCap,
  Save,
  Star,
  MessageSquare,
  Calendar,
  BookOpen,
  Users
} from 'lucide-react';
import { Button, Input, TextArea } from '@/components/ui';
import { useTeacherAuth } from '@/hooks/useTeacherAuth';
import TeacherLayout from '@/components/teacher/TeacherLayout';
import Link from 'next/link';

// Import services and types
import { TestService } from '@/apiservices/testService';
import { SubmissionService } from '@/apiservices/submissionService';
import { Test } from '@/models/testSchema';
import { StudentSubmission } from '@/models/studentSubmissionSchema';
import { PdfAttachment } from '@/models/studentSubmissionSchema';

interface SubmissionWithStudent {
  id: string;
  testId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  submittedAt: string; // Formatted date string
  status: string;
  totalScore?: number;
  maxScore?: number;
  essayAnswers: Array<{
    questionId: string;
    questionText: string;
    textContent: string;
    pdfFiles: PdfAttachment[];
    points: number;
    maxPoints: number;
  }>;
  finalAnswers?: any[];
  answers?: any;
}

interface EssayGrade {
  questionId: string;
  score: number;
  maxScore: number;
  feedback: string;
}

export default function MarkSubmissions() {
  const params = useParams();
  const router = useRouter();
  const { teacher } = useTeacherAuth();
  const testId = params.testId as string;
  
  const [test, setTest] = useState<Test | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionWithStudent[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionWithStudent | null>(null);
  const [grades, setGrades] = useState<Record<string, EssayGrade[]>>({});
  const [loading, setLoading] = useState(true);
  const [savingGrades, setSavingGrades] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load test and submissions
  useEffect(() => {
    const loadData = async () => {
      if (!testId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Load test details
        const testData = await TestService.getTestById(testId);
        setTest(testData);
        
        // Load submissions for this test
        const submissionData = await SubmissionService.getSubmissionsByTest(testId);
        
        // Filter and format submissions with essay questions
        const essayQuestions = testData.questions.filter(q => q.type === 'essay' || q.questionType === 'essay');
        
        const processedSubmissions: SubmissionWithStudent[] = submissionData.map((submission: any) => {
          // Handle submission date properly
          let submissionDate = 'Unknown date';
          if (submission.submittedAt) {
            try {
              if (typeof submission.submittedAt.toDate === 'function') {
                submissionDate = submission.submittedAt.toDate().toLocaleDateString();
              } else if (submission.submittedAt.seconds) {
                submissionDate = new Date(submission.submittedAt.seconds * 1000).toLocaleDateString();
              } else if (submission.submittedAt instanceof Date) {
                submissionDate = submission.submittedAt.toLocaleDateString();
              }
            } catch (error) {
              console.warn('Error formatting submission date:', error);
            }
          }
          
          return {
            ...submission,
            studentName: submission.studentName || 'Unknown Student',
            studentEmail: submission.studentEmail || 'unknown@email.com',
            submittedAt: submissionDate,
            essayAnswers: essayQuestions.map(question => {
              // Try to get answer from finalAnswers first, then from answers
              let answer = submission.finalAnswers?.find((a: any) => a.questionId === question.id);
              if (!answer) {
                answer = submission.answers?.[question.id];
              }
              
              console.log('📝 Processing essay answer for question:', question.id, {
                answer,
                answerPdfFiles: answer?.pdfFiles,
                submissionFinalAnswers: submission.finalAnswers,
                submissionAnswers: submission.answers
              });
              
              return {
                questionId: question.id,
                questionText: question.questionText,
                textContent: answer?.textContent || '',
                pdfFiles: answer?.pdfFiles || [],
                points: answer?.score || 0,
                maxPoints: question.points || question.marks || 0
              };
            })
          };
        });
        
        setSubmissions(processedSubmissions);
        
        // Initialize grades state
        const initialGrades: Record<string, EssayGrade[]> = {};
        processedSubmissions.forEach(submission => {
          initialGrades[submission.id] = submission.essayAnswers.map(answer => ({
            questionId: answer.questionId,
            score: answer.points,
            maxScore: answer.maxPoints,
            feedback: ''
          }));
        });
        setGrades(initialGrades);
        
      } catch (err: any) {
        console.error('Error loading marking data:', err);
        setError(err.message || 'Failed to load test submissions');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [testId]);

  // Update grade for a specific question
  const updateGrade = (submissionId: string, questionId: string, score: number, feedback: string) => {
    setGrades(prev => ({
      ...prev,
      [submissionId]: prev[submissionId]?.map(grade => 
        grade.questionId === questionId 
          ? { ...grade, score, feedback }
          : grade
      ) || []
    }));
  };

  // Save grades for a submission
  const saveGrades = async (submissionId: string) => {
    setSavingGrades(true);
    try {
      const submissionGrades = grades[submissionId] || [];
      await SubmissionService.updateEssayGrades(submissionId, submissionGrades);
      
      // Update local submission data
      setSubmissions(prev => prev.map(sub => 
        sub.id === submissionId 
          ? {
              ...sub,
              essayAnswers: sub.essayAnswers.map(answer => {
                const grade = submissionGrades.find(g => g.questionId === answer.questionId);
                return grade ? { ...answer, points: grade.score } : answer;
              })
            }
          : sub
      ));
      
      alert('Grades saved successfully!');
    } catch (error) {
      console.error('Error saving grades:', error);
      alert('Failed to save grades. Please try again.');
    } finally {
      setSavingGrades(false);
    }
  };

  // Download PDF file
  const downloadPdf = (fileUrl: string, fileName: string) => {
    window.open(fileUrl, '_blank');
  };

  // Get total score for a submission
  const getTotalScore = (submissionId: string) => {
    const submissionGrades = grades[submissionId] || [];
    return submissionGrades.reduce((total, grade) => total + grade.score, 0);
  };

  // Get max possible score
  const getMaxScore = (submissionId: string) => {
    const submissionGrades = grades[submissionId] || [];
    return submissionGrades.reduce((total, grade) => total + grade.maxScore, 0);
  };

  if (loading) {
    return (
      <TeacherLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-16 h-16 border-t-4 border-blue-600 border-solid rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-300 font-medium">Loading submissions...</p>
          </div>
        </div>
      </TeacherLayout>
    );
  }

  if (error) {
    return (
      <TeacherLayout>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-6">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error</h3>
              <p className="mt-1 text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          </div>
        </div>
      </TeacherLayout>
    );
  }

  return (
    <TeacherLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.back()}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Tests</span>
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Mark Essay Submissions
                </h1>
                <p className="text-gray-600 dark:text-gray-300">
                  {test?.title} - Review and grade student essay answers
                </p>
              </div>
            </div>
            <div className="flex items-center bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-lg">
              <GraduationCap className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
              <span className="text-blue-600 dark:text-blue-400 font-medium">
                {submissions.length} Submissions
              </span>
            </div>
          </div>
        </div>

        {/* Test Info */}
        {test && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {test.questions.filter(q => q.type === 'essay' || q.questionType === 'essay').length}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Essay Questions</p>
              </div>
              
              <div className="text-center">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Users className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {submissions.length}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Submissions</p>
              </div>
              
              <div className="text-center">
                <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Clock className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                </div>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {submissions.filter(sub => getTotalScore(sub.id) === 0).length}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Pending</p>
              </div>
              
              <div className="text-center">
                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <CheckCircle className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {submissions.filter(sub => getTotalScore(sub.id) > 0).length}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Graded</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Submissions List */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                Student Submissions
              </h2>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {submissions.map((submission) => {
                const totalScore = getTotalScore(submission.id);
                const maxScore = getMaxScore(submission.id);
                const isGraded = totalScore > 0;
                
                return (
                  <div
                    key={submission.id}
                    onClick={() => setSelectedSubmission(submission)}
                    className={`p-4 border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                      selectedSubmission?.id === submission.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {submission.studentName}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {submission.studentEmail}
                        </p>
                        <div className="mt-1 flex items-center text-xs text-gray-500 dark:text-gray-400">
                          <Calendar className="w-3 h-3 mr-1" />
                          Submitted: {submission.submittedAt || 'Unknown date'}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        {isGraded ? (
                          <div className="flex items-center text-green-600 dark:text-green-400">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            <span className="text-sm font-medium">
                              {totalScore}/{maxScore}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center text-yellow-600 dark:text-yellow-400">
                            <Clock className="w-4 h-4 mr-1" />
                            <span className="text-sm">Pending</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Grading Panel */}
          <div className="lg:col-span-2">
            {selectedSubmission ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                        Grading: {selectedSubmission.studentName}
                      </h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Total Score: {getTotalScore(selectedSubmission.id)}/{getMaxScore(selectedSubmission.id)}
                      </p>
                    </div>
                    <Button
                      onClick={() => saveGrades(selectedSubmission.id)}
                      disabled={savingGrades}
                      className="flex items-center space-x-2"
                    >
                      <Save className="w-4 h-4" />
                      <span>{savingGrades ? 'Saving...' : 'Save Grades'}</span>
                    </Button>
                  </div>
                </div>
                
                <div className="p-6 space-y-6">
                  {selectedSubmission.essayAnswers.map((answer, index) => {
                    const currentGrade = grades[selectedSubmission.id]?.find(g => g.questionId === answer.questionId);
                    
                    return (
                      <div key={answer.questionId} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                        <div className="mb-4">
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                            Question {index + 1}
                          </h3>
                          <p className="text-gray-700 dark:text-gray-300">
                            {answer.questionText}
                          </p>
                        </div>
                        
                        {/* Student's Text Answer */}
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                            Student's Answer:
                          </h4>
                          <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-4">
                            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                              {answer.textContent || 'No text answer provided'}
                            </p>
                          </div>
                        </div>
                        
                        {/* PDF Attachments */}
                        {answer.pdfFiles.length > 0 && (
                          <div className="mb-4">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                              PDF Attachments:
                            </h4>
                            <div className="space-y-2">
                              {answer.pdfFiles.map((pdf, pdfIndex) => (
                                <div
                                  key={`${pdf.fileUrl}-${pdfIndex}`}
                                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-md"
                                >
                                  <div className="flex items-center space-x-3">
                                    <FileText className="h-5 w-5 text-red-600" />
                                    <div>
                                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                                        {pdf.fileName}
                                      </p>
                                      <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {(pdf.fileSize / (1024 * 1024)).toFixed(2)} MB
                                      </p>
                                    </div>
                                  </div>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => downloadPdf(pdf.fileUrl, pdf.fileName)}
                                    className="flex items-center space-x-1"
                                  >
                                    <Download className="w-3 h-3" />
                                    <span>View</span>
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Grading Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Score (out of {answer.maxPoints})
                            </label>
                            <Input
                              type="number"
                              min="0"
                              max={answer.maxPoints}
                              value={currentGrade?.score || 0}
                              onChange={(e) => updateGrade(
                                selectedSubmission.id,
                                answer.questionId,
                                parseInt(e.target.value) || 0,
                                currentGrade?.feedback || ''
                              )}
                              className="w-full"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Feedback
                            </label>
                            <TextArea
                              value={currentGrade?.feedback || ''}
                              onChange={(e) => updateGrade(
                                selectedSubmission.id,
                                answer.questionId,
                                currentGrade?.score || 0,
                                e.target.value
                              )}
                              placeholder="Provide feedback for the student..."
                              rows={3}
                              className="w-full"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
                <GraduationCap className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Select a Submission
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Choose a student submission from the list to start grading
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </TeacherLayout>
  );
}
