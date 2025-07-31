// Debug utility for checking submission data integrity
// Use this to troubleshoot essay grading issues

import { StudentSubmission, FinalAnswer, EssayResult } from '@/models/studentSubmissionSchema';

export interface SubmissionDebugInfo {
  submissionId: string;
  totalScore: number;
  maxScore: number;
  percentage: number;
  essayQuestions: {
    questionId: string;
    questionText: string;
    marksFromFinalAnswers: number | undefined;
    marksFromEssayResults: number | undefined;
    maxMarks: number;
    isConsistent: boolean;
  }[];
  overallConsistent: boolean;
  issues: string[];
}

/**
 * Debug submission to check if essay grades are properly synced
 * between finalAnswers and essayResults arrays
 */
export function debugSubmission(submission: StudentSubmission): SubmissionDebugInfo {
  const issues: string[] = [];
  const essayQuestions: SubmissionDebugInfo['essayQuestions'] = [];
  
  // Get all essay questions from finalAnswers
  const essayFinalAnswers = submission.finalAnswers.filter(fa => fa.questionType === 'essay');
  
  essayFinalAnswers.forEach(finalAnswer => {
    const essayResult = submission.essayResults?.find(er => er.questionId === finalAnswer.questionId);
    
    const questionInfo = {
      questionId: finalAnswer.questionId,
      questionText: finalAnswer.questionText,
      marksFromFinalAnswers: finalAnswer.marksAwarded,
      marksFromEssayResults: essayResult?.marksAwarded,
      maxMarks: finalAnswer.questionMarks,
      isConsistent: false
    };
    
    // Check if marks are consistent
    if (finalAnswer.marksAwarded === essayResult?.marksAwarded) {
      questionInfo.isConsistent = true;
    } else {
      questionInfo.isConsistent = false;
      issues.push(
        `Question ${finalAnswer.questionId}: FinalAnswer marks (${finalAnswer.marksAwarded}) ` +
        `don't match EssayResult marks (${essayResult?.marksAwarded})`
      );
    }
    
    essayQuestions.push(questionInfo);
  });
  
  // Check for essay results without corresponding final answers
  submission.essayResults?.forEach(essayResult => {
    const hasFinalAnswer = essayFinalAnswers.some(fa => fa.questionId === essayResult.questionId);
    if (!hasFinalAnswer) {
      issues.push(`Essay result for question ${essayResult.questionId} has no corresponding final answer`);
    }
  });
  
  // Calculate expected total score
  const mcqScore = submission.autoGradedScore || 0;
  const essayScoreFromFinalAnswers = essayQuestions.reduce((sum, q) => sum + (q.marksFromFinalAnswers || 0), 0);
  const essayScoreFromEssayResults = essayQuestions.reduce((sum, q) => sum + (q.marksFromEssayResults || 0), 0);
  const expectedTotalScore = mcqScore + essayScoreFromEssayResults;
  
  if (submission.totalScore !== expectedTotalScore) {
    issues.push(
      `Total score mismatch: Stored (${submission.totalScore}) vs Expected (${expectedTotalScore})`
    );
  }
  
  return {
    submissionId: submission.id,
    totalScore: submission.totalScore || 0,
    maxScore: submission.maxScore,
    percentage: submission.percentage || 0,
    essayQuestions,
    overallConsistent: issues.length === 0,
    issues
  };
}

/**
 * Format debug info for console logging
 */
export function logSubmissionDebug(submission: StudentSubmission): void {
  const debugInfo = debugSubmission(submission);
  
  console.log('📊 SUBMISSION DEBUG REPORT');
  console.log('==========================');
  console.log(`Submission ID: ${debugInfo.submissionId}`);
  console.log(`Total Score: ${debugInfo.totalScore}/${debugInfo.maxScore} (${debugInfo.percentage}%)`);
  console.log(`Overall Consistent: ${debugInfo.overallConsistent ? '✅' : '❌'}`);
  console.log('');
  
  if (debugInfo.essayQuestions.length > 0) {
    console.log('📝 Essay Questions:');
    debugInfo.essayQuestions.forEach((q, index) => {
      console.log(`  ${index + 1}. Question ${q.questionId.slice(-6)}:`);
      console.log(`     Final Answer Marks: ${q.marksFromFinalAnswers ?? 'undefined'}`);
      console.log(`     Essay Result Marks: ${q.marksFromEssayResults ?? 'undefined'}`);
      console.log(`     Max Marks: ${q.maxMarks}`);
      console.log(`     Consistent: ${q.isConsistent ? '✅' : '❌'}`);
    });
    console.log('');
  }
  
  if (debugInfo.issues.length > 0) {
    console.log('⚠️ Issues Found:');
    debugInfo.issues.forEach((issue, index) => {
      console.log(`  ${index + 1}. ${issue}`);
    });
  } else {
    console.log('✅ No issues found - all data is consistent!');
  }
  
  console.log('==========================');
}

/**
 * Helper to check if student can see individual question scores
 */
export function canStudentSeeQuestionScores(submission: StudentSubmission): {
  canSee: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];
  
  // Check if manual grading is complete
  if (submission.manualGradingPending) {
    reasons.push('Manual grading is still pending');
  }
  
  // Check if essay questions have marks in finalAnswers
  const essayFinalAnswers = submission.finalAnswers.filter(fa => fa.questionType === 'essay');
  const essayQuestionsWithoutMarks = essayFinalAnswers.filter(fa => fa.marksAwarded === undefined);
  
  if (essayQuestionsWithoutMarks.length > 0) {
    reasons.push(`${essayQuestionsWithoutMarks.length} essay questions don't have marks in finalAnswers`);
  }
  
  return {
    canSee: reasons.length === 0,
    reasons
  };
}
