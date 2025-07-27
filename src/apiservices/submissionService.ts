// Student submission service - handles final submissions to Firestore
// Processes real-time data and creates final submission records with attempt tracking

import { 
  collection, 
  doc, 
  setDoc, 
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  writeBatch,
  Timestamp 
} from 'firebase/firestore';
import { firestore } from '@/utils/firebase-client';
import { 
  StudentSubmission, 
  FinalAnswer, 
  MCQResult, 
  EssayResult,
  RealtimeTestSession 
} from '@/models/studentSubmissionSchema';
import { Test, TestQuestion } from '@/models/testSchema';
import { TestAttempt } from '@/models/attemptSchema';
import { TestService } from './testService';
import { RealtimeTestService } from './realtimeTestService';
import { AttemptManagementService } from './attemptManagementService';

export class SubmissionService {
  private static COLLECTIONS = {
    SUBMISSIONS: 'studentSubmissions',
    TESTS: 'tests',
    MCQ_RESULTS: 'mcqResults',
    ESSAY_RESULTS: 'essayResults'
  };

  // Helper function to remove undefined values recursively
  private static removeUndefinedValues(obj: any): any {
    if (obj === null || obj === undefined) {
      return null;
    }
    
    // Preserve Firestore Timestamp objects
    if (obj && typeof obj.toDate === 'function') {
      return obj;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.removeUndefinedValues(item)).filter(item => item !== undefined);
    }
    
    if (typeof obj === 'object') {
      const cleaned: any = {};
      for (const [key, value] of Object.entries(obj)) {
        if (value !== undefined) {
          cleaned[key] = this.removeUndefinedValues(value);
        }
      }
      return cleaned;
    }
    
    return obj;
  }

  // Process final submission from realtime data
  static async processSubmission(
    attemptId: string,
    isAutoSubmitted: boolean = false
  ): Promise<StudentSubmission> {
    try {
      console.log('🔄 Processing submission for attempt:', attemptId);
      
      // Get realtime session data
      const realtimeSession = await RealtimeTestService.getSession(attemptId);
      if (!realtimeSession) {
        throw new Error('Realtime session not found');
      }

      // Get test data
      const testDoc = await getDoc(doc(firestore, this.COLLECTIONS.TESTS, realtimeSession.testId));
      if (!testDoc.exists()) {
        throw new Error('Test not found');
      }
      const test = { id: testDoc.id, ...testDoc.data() } as Test;

      // Get attempt information to determine correct attempt number and class info
      const attemptInfo = await AttemptManagementService.getAttemptSummary(realtimeSession.testId, realtimeSession.studentId);
      
      // Get the actual attempt to get className
      const { getDoc: getDocFromFirestore, doc: docFromFirestore } = await import('firebase/firestore');
      const attemptDoc = await getDocFromFirestore(docFromFirestore(firestore, 'attempts', attemptId));
      const attemptData = attemptDoc.exists() ? attemptDoc.data() as TestAttempt : null;
      
      console.log('📊 Attempt info for submission:', attemptInfo);
      console.log('📊 Attempt data for submission:', attemptData);

      // Process answers and calculate scores
      const { finalAnswers, mcqResults, autoGradedScore, manualGradingPending } = 
        await this.processAnswers(realtimeSession, test);

      // Create submission object
      const submission: StudentSubmission = {
        id: attemptId,
        
        // Test info
        testId: test.id,
        testTitle: test.title || '',
        testType: test.type || 'mixed',
        
        // Student info
        studentId: realtimeSession.studentId || '',
        studentName: realtimeSession.studentName || '',
        studentEmail: '', // Would get from student profile
        classId: realtimeSession.classId || '',
        className: attemptData?.className || 'Unknown Class',
        
        // Attempt details
        attemptNumber: attemptInfo.totalAttempts + 1,
        status: isAutoSubmitted ? 'auto_submitted' : 'submitted',
        
        // Timing
        startTime: Timestamp.fromMillis(realtimeSession.startTime),
        endTime: Timestamp.fromMillis(realtimeSession.lastActivity),
        submittedAt: Timestamp.now(),
        totalTimeSpent: Math.floor((realtimeSession.lastActivity - realtimeSession.startTime) / 1000),
        timePerQuestion: realtimeSession.timePerQuestion || {},
        
        // Final answers
        finalAnswers,
        
        // Statistics
        questionsAttempted: Object.keys(realtimeSession.answers || {}).length,
        questionsSkipped: (test.questions?.length || 0) - Object.keys(realtimeSession.answers || {}).length,
        questionsReviewed: (realtimeSession.questionsMarkedForReview || []).length,
        totalChanges: this.calculateTotalChanges(realtimeSession),
        
        // Results
        autoGradedScore: autoGradedScore || 0,
        manualGradingPending,
        maxScore: test.totalMarks || 0,
        percentage: autoGradedScore ? Math.round((autoGradedScore / (test.totalMarks || 1)) * 100) : 0,
        passStatus: manualGradingPending ? 'pending_review' : 
                   (autoGradedScore && autoGradedScore >= ((test.totalMarks || 0) * 0.6)) ? 'passed' : 'failed',
        
        // Grading details
        mcqResults,
        essayResults: [], // Will be populated during manual grading
        
        // Integrity monitoring
        integrityReport: {
          tabSwitches: realtimeSession.tabSwitchCount || 0,
          disconnections: realtimeSession.disconnectionCount || 0,
          suspiciousActivities: this.extractSuspiciousActivities(realtimeSession),
          isIntegrityCompromised: this.assessIntegrityCompromise(realtimeSession),
          notes: this.generateIntegrityNotes(realtimeSession)
        },
        
        // Metadata
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      // Save to Firestore
      const cleanSubmission = this.removeUndefinedValues(submission);
      await setDoc(doc(firestore, this.COLLECTIONS.SUBMISSIONS, attemptId), cleanSubmission);
      
      // Clean up realtime session
      await RealtimeTestService.cleanupSession(attemptId);
      
      console.log('✅ Submission processed successfully:', attemptId);
      return submission;
    } catch (error) {
      console.error('Error processing submission:', error);
      throw error;
    }
  }

  // Process answers and calculate scores
  private static async processAnswers(
    session: RealtimeTestSession,
    test: Test
  ): Promise<{
    finalAnswers: FinalAnswer[];
    mcqResults: MCQResult[];
    autoGradedScore: number;
    manualGradingPending: boolean;
  }> {
    const finalAnswers: FinalAnswer[] = [];
    const mcqResults: MCQResult[] = [];
    let autoGradedScore = 0;
    let manualGradingPending = false;

    // Safety check for test questions
    if (!test.questions || !Array.isArray(test.questions)) {
      console.error('Test questions not found or invalid:', test);
      return { finalAnswers, mcqResults, autoGradedScore, manualGradingPending };
    }

    // Safety check for session answers
    if (!session.answers) {
      console.error('Session answers not found:', session);
      return { finalAnswers, mcqResults, autoGradedScore, manualGradingPending };
    }

    for (const question of test.questions) {
      const answer = session.answers[question.id];
      const questionData = question; // Assuming question data is embedded

      if (answer) {
        // Create final answer
        const finalAnswer: FinalAnswer = {
          questionId: question.id || '',
          questionType: question.type || 'mcq',
          questionText: questionData.questionText || '',
          questionMarks: question.marks || 0,
          selectedOption: answer.selectedOption as number,
          selectedOptionText: question.type === 'mcq' && answer.selectedOption !== undefined 
            ? question.options?.[answer.selectedOption as number] || '' : '',
          textContent: answer.textContent || '',
          pdfFiles: answer.pdfFiles || [], // Include PDF files for essay questions
          timeSpent: answer.timeSpent || 0,
          changeCount: answer.changeHistory?.length || 0,
          wasReviewed: answer.isMarkedForReview || false
        };

        // Process MCQ auto-grading
        if (question.type === 'mcq' && answer.selectedOption !== undefined) {
          // Helper function to get option display text
          const getOptionText = (option: any, index: number): string => {
            if (option && option.text && option.text.trim()) {
              return option.text;
            }
            return String.fromCharCode(65 + index); // A, B, C, D
          };
          
          // Find correct option index - use correctOption property
          const correctOptionIndex = question.correctOption || 0;
          
          // Convert selectedOption from ID to index if it's a string
          let selectedOptionIndex: number;
          if (typeof answer.selectedOption === 'string') {
            // Find the index of the selected option by its ID
            selectedOptionIndex = question.questionData?.options?.findIndex(opt => opt.id === answer.selectedOption) ?? -1;
            if (selectedOptionIndex === -1) {
              console.warn(`Selected option ID ${answer.selectedOption} not found in question options`);
              selectedOptionIndex = 0; // Default to first option
            }
          } else {
            // If it's already a number, use it directly
            selectedOptionIndex = answer.selectedOption as number;
          }
          
          const isCorrect = selectedOptionIndex === correctOptionIndex;
          const marksAwarded = isCorrect ? (question.marks || 0) : 0;
          
          finalAnswer.isCorrect = isCorrect;
          finalAnswer.marksAwarded = marksAwarded;
          autoGradedScore += marksAwarded;

          // Create MCQ result with proper option text handling
          const mcqResult: MCQResult = {
            questionId: question.id || '',
            questionText: questionData.questionText || '',
            selectedOption: selectedOptionIndex,
            selectedOptionText: question.questionData?.options?.[selectedOptionIndex] 
              ? getOptionText(question.questionData.options[selectedOptionIndex], selectedOptionIndex)
              : 'No answer selected',
            correctOption: correctOptionIndex,
            correctOptionText: question.questionData?.options?.[correctOptionIndex] 
              ? getOptionText(question.questionData.options[correctOptionIndex], correctOptionIndex)
              : 'No correct option defined',
            isCorrect,
            marksAwarded,
            maxMarks: question.marks || 0,
            explanation: question.explanation || '',
            difficultyLevel: question.difficultyLevel || 'medium',
            topic: question.topic || ''
          };

          mcqResults.push(mcqResult);
        } else if (question.type === 'essay') {
          // Essay questions need manual grading
          manualGradingPending = true;
        }

        finalAnswers.push(finalAnswer);
      } else {
        // Unanswered question
        const finalAnswer: FinalAnswer = {
          questionId: question.id || '',
          questionType: question.type || 'mcq',
          questionText: questionData.questionText || '',
          questionMarks: question.marks || 0,
          timeSpent: 0,
          changeCount: 0,
          wasReviewed: false,
          isCorrect: false,
          marksAwarded: 0,
          selectedOption: 0,
          selectedOptionText: '',
          textContent: ''
        };
        finalAnswers.push(finalAnswer);
      }
    }

    return { finalAnswers, mcqResults, autoGradedScore, manualGradingPending };
  }

  // Calculate total answer changes
  private static calculateTotalChanges(session: RealtimeTestSession): number {
    if (!session.answers) return 0;
    
    return Object.values(session.answers).reduce(
      (total, answer) => total + (answer.changeHistory?.length || 0), 
      0
    );
  }

  // Extract suspicious activities
  private static extractSuspiciousActivities(session: RealtimeTestSession): string[] {
    const activities: string[] = [];
    
    if ((session.tabSwitchCount || 0) > 3) {
      activities.push(`Excessive tab switching: ${session.tabSwitchCount} times`);
    }
    
    if ((session.suspiciousActivity?.copyPasteAttempts || 0) > 0) {
      activities.push(`Copy/paste attempts: ${session.suspiciousActivity.copyPasteAttempts}`);
    }
    
    if ((session.suspiciousActivity?.rightClickAttempts || 0) > 5) {
      activities.push(`Excessive right-clicking: ${session.suspiciousActivity.rightClickAttempts} times`);
    }
    
    if ((session.suspiciousActivity?.keyboardShortcuts || []).length > 0) {
      activities.push(`Keyboard shortcuts used: ${session.suspiciousActivity.keyboardShortcuts.join(', ')}`);
    }
    
    return activities;
  }

  // Assess integrity compromise
  private static assessIntegrityCompromise(session: RealtimeTestSession): boolean {
    const tabSwitches = session.tabSwitchCount || 0;
    const copyPaste = session.suspiciousActivity?.copyPasteAttempts || 0;
    const disconnections = session.disconnectionCount || 0;
    
    // Define thresholds
    return tabSwitches > 5 || copyPaste > 2 || disconnections > 3;
  }

  // Generate integrity notes
  private static generateIntegrityNotes(session: RealtimeTestSession): string {
    const notes: string[] = [];
    
    if ((session.tabSwitchCount || 0) > 3) {
      notes.push('Student frequently switched browser tabs during test');
    }
    
    if ((session.disconnectionCount || 0) > 1) {
      notes.push('Multiple disconnections detected');
    }
    
    if (!session.isFullscreen) {
      notes.push('Test was not taken in fullscreen mode');
    }
    
    return notes.join('. ');
  }

  // Get submission by ID
  static async getSubmission(submissionId: string): Promise<StudentSubmission | null> {
    try {
      const submissionDoc = await getDoc(
        doc(firestore, this.COLLECTIONS.SUBMISSIONS, submissionId)
      );
      
      if (!submissionDoc.exists()) {
        return null;
      }
      
      const data = submissionDoc.data();
      const submission = {
        id: submissionDoc.id,
        ...data
      } as StudentSubmission;
      
      return submission;
    } catch (error) {
      console.error('Error getting submission:', error);
      throw error;
    }
  }

  // Get submissions for a test
  static async getTestSubmissions(testId: string): Promise<StudentSubmission[]> {
    try {
      const submissionsQuery = query(
        collection(firestore, this.COLLECTIONS.SUBMISSIONS),
        where('testId', '==', testId)
      );
      
      const snapshot = await getDocs(submissionsQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as StudentSubmission[];
    } catch (error) {
      console.error('Error getting test submissions:', error);
      throw error;
    }
  }

  // Get student submissions
  static async getStudentSubmissions(studentId: string): Promise<StudentSubmission[]> {
    try {
      const submissionsQuery = query(
        collection(firestore, this.COLLECTIONS.SUBMISSIONS),
        where('studentId', '==', studentId)
      );
      
      const snapshot = await getDocs(submissionsQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as StudentSubmission[];
    } catch (error) {
      console.error('Error getting student submissions:', error);
      throw error;
    }
  }

  // Grade essay question
  static async gradeEssayQuestion(
    submissionId: string,
    questionId: string,
    marksAwarded: number,
    feedback: string,
    teacherId: string
  ): Promise<void> {
    try {
      const batch = writeBatch(firestore);
      
      // Update submission with essay result
      const submissionRef = doc(firestore, this.COLLECTIONS.SUBMISSIONS, submissionId);
      const submission = await this.getSubmission(submissionId);
      
      if (!submission) {
        throw new Error('Submission not found');
      }

      // Create essay result
      const essayResult: EssayResult = {
        questionId,
        questionText: submission.finalAnswers.find(a => a.questionId === questionId)?.questionText || '',
        studentAnswer: submission.finalAnswers.find(a => a.questionId === questionId)?.textContent || '',
        wordCount: submission.finalAnswers.find(a => a.questionId === questionId)?.textContent?.split(' ').length || 0,
        marksAwarded,
        maxMarks: submission.finalAnswers.find(a => a.questionId === questionId)?.questionMarks || 0,
        feedback,
        gradedBy: teacherId,
        gradedAt: Timestamp.now()
      };

      // Update finalAnswers with essay marks
      const updatedFinalAnswers = submission.finalAnswers.map(finalAnswer => {
        if (finalAnswer.questionType === 'essay' && finalAnswer.questionId === questionId) {
          return {
            ...finalAnswer,
            marksAwarded
          };
        }
        return finalAnswer;
      });

      // Update submission
      const updatedEssayResults = [...(submission.essayResults || []), essayResult];
      const totalScore = (submission.autoGradedScore || 0) + 
        updatedEssayResults.reduce((sum, result) => sum + (result.marksAwarded || 0), 0);
      
      batch.update(submissionRef, {
        essayResults: updatedEssayResults,
        finalAnswers: updatedFinalAnswers,
        totalScore,
        percentage: Math.round((totalScore / submission.maxScore) * 100),
        passStatus: totalScore >= (submission.maxScore * 0.6) ? 'passed' : 'failed',
        manualGradingPending: false, // Assuming this was the last essay question
        updatedAt: Timestamp.now()
      });

      await batch.commit();
      console.log('✅ Essay question graded successfully');
    } catch (error) {
      console.error('Error grading essay question:', error);
      throw error;
    }
  }

  // Batch process submissions (for when test ends)
  static async batchProcessSubmissions(testId: string): Promise<void> {
    try {
      console.log('🔄 Batch processing submissions for test:', testId);
      
      // This would be called when a test ends to process all remaining submissions
      // Implementation would get all active sessions for the test and process them
      
      console.log('✅ Batch processing completed for test:', testId);
    } catch (error) {
      console.error('Error batch processing submissions:', error);
      throw error;
    }
  }

  // Get submissions by test ID for marking
  static async getSubmissionsByTest(testId: string): Promise<StudentSubmission[]> {
    try {
      console.log('🔍 Loading submissions for test:', testId);
      
      const submissionsRef = collection(firestore, this.COLLECTIONS.SUBMISSIONS);
      const q = query(submissionsRef, where('testId', '==', testId));
      const snapshot = await getDocs(q);
      
      const submissions: StudentSubmission[] = [];
      
      for (const docSnapshot of snapshot.docs) {
        const data = docSnapshot.data() as StudentSubmission;
        
        // Try to get student details if missing
        let studentName = data.studentName || 'Unknown Student';
        let studentEmail = data.studentEmail || 'unknown@email.com';
        
        // If student info is missing, try to fetch from students collection
        if (!data.studentName || !data.studentEmail || data.studentName === '' || data.studentEmail === '') {
          try {
            const { doc: docRef, getDoc: getDocFirestore } = await import('firebase/firestore');
            const studentDoc = await getDocFirestore(docRef(firestore, 'students', data.studentId));
            
            if (studentDoc.exists()) {
              const studentData = studentDoc.data();
              studentName = studentData.name || studentData.firstName || data.studentName || 'Unknown Student';
              studentEmail = studentData.email || data.studentEmail || 'unknown@email.com';
            }
          } catch (studentError) {
            console.warn('Could not fetch student details for:', data.studentId, studentError);
          }
        }
        
        submissions.push({
          ...data,
          id: docSnapshot.id,
          studentName,
          studentEmail
        });
      }
      
      console.log('✅ Found submissions:', submissions.length);
      return submissions;
    } catch (error) {
      console.error('Error getting submissions by test:', error);
      throw error;
    }
  }

  // Update essay grades for a submission
  static async updateEssayGrades(submissionId: string, grades: Array<{questionId: string, score: number, maxScore: number, feedback: string}>): Promise<void> {
    try {
      const submissionRef = doc(firestore, this.COLLECTIONS.SUBMISSIONS, submissionId);
      const submissionDoc = await getDoc(submissionRef);
      
      if (!submissionDoc.exists()) {
        throw new Error('Submission not found');
      }
      
      const submission = submissionDoc.data() as StudentSubmission;
      
      // Update essay results
      const essayResults: EssayResult[] = grades.map(grade => {
        // Ensure score and maxScore are valid numbers
        const score = typeof grade.score === 'number' ? grade.score : Number(grade.score) || 0;
        const maxScore = typeof grade.maxScore === 'number' ? grade.maxScore : Number(grade.maxScore) || 0;
        
        return {
          questionId: grade.questionId,
          questionText: submission.finalAnswers.find(a => a.questionId === grade.questionId)?.questionText || '',
          studentAnswer: submission.finalAnswers.find(a => a.questionId === grade.questionId)?.textContent || '',
          wordCount: submission.finalAnswers.find(a => a.questionId === grade.questionId)?.textContent?.split(' ').length || 0,
          marksAwarded: score,
          maxMarks: maxScore,
          feedback: grade.feedback,
          gradedBy: 'teacher', // TODO: Get actual teacher ID from context
          gradedAt: Timestamp.now()
        };
      });
      
      // Update finalAnswers with essay marks
      const updatedFinalAnswers = submission.finalAnswers.map(finalAnswer => {
        if (finalAnswer.questionType === 'essay') {
          const grade = grades.find(g => g.questionId === finalAnswer.questionId);
          if (grade) {
            const score = typeof grade.score === 'number' ? grade.score : Number(grade.score) || 0;
            return {
              ...finalAnswer,
              marksAwarded: score
            };
          }
        }
        return finalAnswer;
      });
      
      // Calculate total score
      const essayScore = grades.reduce((sum, grade) => {
        const score = typeof grade.score === 'number' ? grade.score : Number(grade.score) || 0;
        return sum + score;
      }, 0);
      const totalScore = (submission.autoGradedScore || 0) + essayScore;
      const percentage = Math.round((totalScore / submission.maxScore) * 100);
      
      // Check if all essay questions have been graded
      const allEssayQuestions = submission.finalAnswers.filter(fa => fa.questionType === 'essay');
      const gradedEssayQuestions = essayResults.filter(er => er.marksAwarded !== undefined && er.marksAwarded !== null);
      const allEssayQuestionsGraded = allEssayQuestions.length === gradedEssayQuestions.length && allEssayQuestions.length > 0;
      
      // Update submission
      const updateData = {
        essayResults,
        finalAnswers: updatedFinalAnswers,
        totalScore,
        percentage,
        passStatus: percentage >= 60 ? 'passed' : 'failed',
        manualGradingPending: !allEssayQuestionsGraded,
        updatedAt: Timestamp.now()
      };
      
      await updateDoc(submissionRef, updateData);
      
      console.log('✅ Essay grades updated successfully');
    } catch (error) {
      console.error('Error updating essay grades:', error);
      throw error;
    }
  }
}
