// Simplified Result Service - Computes results by comparing with original questions
// This eliminates the need for complex data conversion and ensures accuracy

import { firestore } from '@/utils/firebase-client';
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { Question, MCQQuestion, EssayQuestion } from '@/models/questionBankSchema';
import { SimplifiedSubmission, SimplifiedAnswer, ComputedMCQResult, ComputedEssayResult } from '@/models/simplifiedTestSchema';
import { StudentSubmission, MCQResult, EssayResult, FinalAnswer } from '@/models/studentSubmissionSchema';

export class SimplifiedResultService {
  
  /**
   * Compute test results by fetching original questions and comparing with student answers
   */
  static async computeTestResults(
    submission: SimplifiedSubmission,
    questionIds: string[]
  ): Promise<{
    mcqResults: MCQResult[];
    essayResults: EssayResult[];
    finalAnswers: FinalAnswer[];
    autoGradedScore: number;
    manualGradingPending: boolean;
  }> {
    try {
      console.log('🔍 Computing results for submission:', submission.id);
      console.log('📋 Question IDs:', questionIds);
      
      // Fetch all original questions from question bank
      const questions = await this.fetchQuestions(questionIds);
      console.log('📚 Fetched questions:', questions.length);
      
      // Create maps for easy lookup
      const questionMap = new Map<string, Question>();
      questions.forEach(q => questionMap.set(q.id, q));
      
      const answerMap = new Map<string, SimplifiedAnswer>();
      submission.answers.forEach(a => answerMap.set(a.questionId, a));
      
      const mcqResults: MCQResult[] = [];
      const essayResults: EssayResult[] = [];
      const finalAnswers: FinalAnswer[] = [];
      let autoGradedScore = 0;
      let manualGradingPending = false;
      
      // Process each question
      for (const questionId of questionIds) {
        const question = questionMap.get(questionId);
        const answer = answerMap.get(questionId);
        
        if (!question) {
          console.warn(`⚠️ Question not found: ${questionId}`);
          continue;
        }
        
        console.log(`🔍 Processing question ${questionId}:`, {
          type: question.type,
          hasAnswer: !!answer,
          answerContent: answer?.selectedOption !== undefined ? `Option ${answer.selectedOption}` : answer?.textContent?.substring(0, 50)
        });
        
        if (question.type === 'mcq') {
          const mcqResult = await this.processMCQResult(question as MCQQuestion, answer);
          mcqResults.push(mcqResult);
          autoGradedScore += mcqResult.marksAwarded;
          
          // Create final answer for MCQ
          const finalAnswer: FinalAnswer = {
            questionId,
            questionType: 'mcq',
            questionText: question.title,
            questionMarks: question.points,
            selectedOption: answer?.selectedOption,
            selectedOptionText: answer?.selectedOption !== undefined 
              ? (question as MCQQuestion).options[answer.selectedOption]?.text 
              : undefined,
            timeSpent: answer?.timeSpent || 0,
            changeCount: answer?.changeCount || 0,
            wasReviewed: answer?.wasReviewed || false,
            isCorrect: mcqResult.isCorrect,
            marksAwarded: mcqResult.marksAwarded
          };
          finalAnswers.push(finalAnswer);
          
        } else if (question.type === 'essay') {
          const essayResult = await this.processEssayResult(question as EssayQuestion, answer);
          essayResults.push(essayResult);
          manualGradingPending = true;
          
          // Create final answer for Essay
          const finalAnswer: FinalAnswer = {
            questionId,
            questionType: 'essay',
            questionText: question.title,
            questionMarks: question.points,
            textContent: answer?.textContent,
            timeSpent: answer?.timeSpent || 0,
            changeCount: answer?.changeCount || 0,
            wasReviewed: answer?.wasReviewed || false,
            marksAwarded: essayResult.marksAwarded
          };
          finalAnswers.push(finalAnswer);
        }
      }
      
      console.log('✅ Results computed:', {
        mcqCount: mcqResults.length,
        essayCount: essayResults.length,
        autoGradedScore,
        manualGradingPending
      });
      
      return {
        mcqResults,
        essayResults,
        finalAnswers,
        autoGradedScore,
        manualGradingPending
      };
      
    } catch (error) {
      console.error('❌ Error computing test results:', error);
      throw error;
    }
  }
  
  /**
   * Process MCQ result by comparing with original question
   */
  private static async processMCQResult(
    question: MCQQuestion,
    answer?: SimplifiedAnswer
  ): Promise<MCQResult> {
    
    // Helper function to get option display text
    const getOptionText = (option: any, index: number): string => {
      if (option.text && option.text.trim()) {
        return option.text;
      }
      return String.fromCharCode(65 + index); // A, B, C, D
    };
    
    // Find correct option index - prefer using correctAnswer field if available
    let correctOptionIndex = -1;
    
    if (question.correctAnswer) {
      // Convert letter (A, B, C, D) to index (0, 1, 2, 3)
      const correctLetter = question.correctAnswer.toUpperCase();
      correctOptionIndex = correctLetter.charCodeAt(0) - 65; // A=0, B=1, C=2, D=3
      
      // Validate the index is within bounds
      if (correctOptionIndex < 0 || correctOptionIndex >= question.options.length) {
        console.warn(`⚠️ Invalid correctAnswer '${question.correctAnswer}' for question ${question.id}, falling back to isCorrect`);
        correctOptionIndex = question.options.findIndex(opt => opt.isCorrect);
      }
    } else {
      // Fallback to using isCorrect property on options
      correctOptionIndex = question.options.findIndex(opt => opt.isCorrect);
    }
    
    if (correctOptionIndex === -1) {
      console.warn(`⚠️ No correct option found for MCQ question: ${question.id}`);
    }
    
    const selectedOption = answer?.selectedOption ?? -1;
    const isCorrect = selectedOption === correctOptionIndex && selectedOption !== -1;
    const marksAwarded = isCorrect ? question.points : 0;
    
    console.log(`📊 MCQ Result for ${question.id}:`, {
      selectedOption,
      correctOptionIndex,
      correctAnswer: question.correctAnswer,
      isCorrect,
      marksAwarded,
      maxMarks: question.points
    });
    
    return {
      questionId: question.id,
      questionText: question.title,
      selectedOption: selectedOption >= 0 ? selectedOption : 0,
      selectedOptionText: selectedOption >= 0 && selectedOption < question.options.length 
        ? getOptionText(question.options[selectedOption], selectedOption)
        : 'No answer selected',
      correctOption: correctOptionIndex >= 0 ? correctOptionIndex : 0,
      correctOptionText: correctOptionIndex >= 0 
        ? getOptionText(question.options[correctOptionIndex], correctOptionIndex)
        : 'No correct option defined',
      isCorrect,
      marksAwarded,
      maxMarks: question.points,
      explanation: question.explanation,
      difficultyLevel: question.difficultyLevel,
      topic: question.topic
    };
  }
  
  /**
   * Process Essay result (manual grading required)
   */
  private static async processEssayResult(
    question: EssayQuestion,
    answer?: SimplifiedAnswer
  ): Promise<EssayResult> {
    
    const studentAnswer = answer?.textContent || '';
    const wordCount = studentAnswer.split(/\s+/).filter(word => word.length > 0).length;
    
    console.log(`📝 Essay Result for ${question.id}:`, {
      hasAnswer: !!studentAnswer,
      wordCount,
      maxMarks: question.points
    });
    
    return {
      questionId: question.id,
      questionText: question.title,
      studentAnswer,
      wordCount,
      maxMarks: question.points,
      // Manual grading fields will be filled later by teacher
      marksAwarded: undefined,
      feedback: undefined,
      gradedBy: undefined,
      gradedAt: undefined
    };
  }
  
  /**
   * Fetch questions from question bank
   */
  private static async fetchQuestions(questionIds: string[]): Promise<Question[]> {
    try {
      const questions: Question[] = [];
      
      // Fetch questions in batches (Firestore has a limit of 10 for 'in' queries)
      const batchSize = 10;
      for (let i = 0; i < questionIds.length; i += batchSize) {
        const batch = questionIds.slice(i, i + batchSize);
        
        // Query questions collection
        const questionsQuery = query(
          collection(firestore, 'questions'),
          where('__name__', 'in', batch)
        );
        
        const snapshot = await getDocs(questionsQuery);
        snapshot.forEach(doc => {
          questions.push({ id: doc.id, ...doc.data() } as Question);
        });
      }
      
      // Sort questions in the order they were requested
      const sortedQuestions = questionIds
        .map(id => questions.find(q => q.id === id))
        .filter(q => q !== undefined) as Question[];
      
      return sortedQuestions;
      
    } catch (error) {
      console.error('❌ Error fetching questions:', error);
      throw error;
    }
  }
  
  /**
   * Convert simplified submission to legacy format for backward compatibility
   */
  static async convertToLegacySubmission(
    simplifiedSubmission: SimplifiedSubmission,
    questionIds: string[]
  ): Promise<StudentSubmission> {
    
    const results = await this.computeTestResults(simplifiedSubmission, questionIds);
    
    return {
      id: simplifiedSubmission.id,
      testId: simplifiedSubmission.testId,
      testTitle: simplifiedSubmission.testTitle,
      testType: simplifiedSubmission.testType,
      studentId: simplifiedSubmission.studentId,
      studentName: simplifiedSubmission.studentName,
      studentEmail: simplifiedSubmission.studentEmail,
      classId: simplifiedSubmission.classId,
      className: simplifiedSubmission.className,
      attemptNumber: simplifiedSubmission.attemptNumber,
      status: simplifiedSubmission.status,
      startTime: simplifiedSubmission.startTime,
      endTime: simplifiedSubmission.endTime,
      submittedAt: simplifiedSubmission.submittedAt,
      totalTimeSpent: simplifiedSubmission.totalTimeSpent,
      timePerQuestion: {}, // Could be computed if needed
      finalAnswers: results.finalAnswers,
      questionsAttempted: simplifiedSubmission.questionsAttempted,
      questionsSkipped: simplifiedSubmission.questionsSkipped,
      questionsReviewed: simplifiedSubmission.questionsReviewed,
      totalChanges: simplifiedSubmission.totalChanges,
      autoGradedScore: results.autoGradedScore,
      manualGradingPending: results.manualGradingPending,
      totalScore: simplifiedSubmission.totalScore,
      maxScore: simplifiedSubmission.maxScore,
      percentage: simplifiedSubmission.percentage,
      passStatus: simplifiedSubmission.passStatus,
      mcqResults: results.mcqResults,
      essayResults: results.essayResults,
      teacherReview: simplifiedSubmission.teacherReview,
      integrityReport: simplifiedSubmission.integrityReport,
      createdAt: simplifiedSubmission.createdAt,
      updatedAt: simplifiedSubmission.updatedAt
    };
  }
}
