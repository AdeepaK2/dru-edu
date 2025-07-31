import { StudentSubmission, EssayResult, FinalAnswer } from '@/models/studentSubmissionSchema';

export function debugEssayScoring(submission: StudentSubmission) {
  console.log('=== ESSAY SCORING DEBUG ===');
  console.log('Total Score:', submission.totalScore);
  console.log('Max Score:', submission.maxScore);
  
  console.log('\n--- ESSAY RESULTS ---');
  submission.essayResults?.forEach((essayResult, index) => {
    console.log(`Essay Result ${index + 1}:`, {
      questionId: essayResult.questionId,
      marksAwarded: essayResult.marksAwarded,
      marksAwardedType: typeof essayResult.marksAwarded,
      maxMarks: essayResult.maxMarks,
      maxMarksType: typeof essayResult.maxMarks,
      feedback: essayResult.feedback ? 'Yes' : 'No',
      hasMarks: essayResult.marksAwarded !== undefined && essayResult.marksAwarded !== null,
      isZero: essayResult.marksAwarded === 0,
      isString: typeof essayResult.marksAwarded === 'string'
    });
  });
  
  console.log('\n--- FINAL ANSWERS (Essay Questions) ---');
  submission.finalAnswers.filter(answer => answer.questionType === 'essay').forEach((answer, index) => {
    const matchingEssayResult = submission.essayResults?.find(er => er.questionId === answer.questionId);
    console.log(`Final Answer ${index + 1}:`, {
      questionId: answer.questionId,
      questionType: answer.questionType,
      marksAwarded: answer.marksAwarded,
      marksAwardedType: typeof answer.marksAwarded,
      questionMarks: answer.questionMarks,
      questionMarksType: typeof answer.questionMarks,
      hasMatchingEssayResult: !!matchingEssayResult,
      essayResultMarks: matchingEssayResult?.marksAwarded,
      essayResultMarksType: typeof matchingEssayResult?.marksAwarded,
      pdfFilesCount: answer.pdfFiles?.length || 0,
      hasTextContent: !!(answer.textContent && answer.textContent.trim())
    });
  });
  
  console.log('\n--- MATCHING ANALYSIS ---');
  const essayAnswers = submission.finalAnswers.filter(answer => answer.questionType === 'essay');
  essayAnswers.forEach(answer => {
    const essayResult = submission.essayResults?.find(er => er.questionId === answer.questionId);
    const isGraded = essayResult && (essayResult.marksAwarded !== undefined && essayResult.marksAwarded !== null);
    
    console.log(`Question ${answer.questionId}:`, {
      isGraded,
      displayScore: isGraded ? `${essayResult.marksAwarded}/${essayResult.maxMarks}` : 
                   (answer.marksAwarded !== undefined && answer.marksAwarded !== null) ? 
                   `${answer.marksAwarded}/${answer.questionMarks}` : 'Pending',
      syncIssue: essayResult && essayResult.marksAwarded !== answer.marksAwarded
    });
  });
  
  console.log('=== END DEBUG ===\n');
}

export function checkDataConsistency(submission: StudentSubmission): {
  hasIssues: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  
  // Check if essay results exist but finalAnswers.marksAwarded is not updated
  submission.finalAnswers.filter(answer => answer.questionType === 'essay').forEach(answer => {
    const essayResult = submission.essayResults?.find(er => er.questionId === answer.questionId);
    
    if (essayResult && (essayResult.marksAwarded !== undefined && essayResult.marksAwarded !== null)) {
      if (answer.marksAwarded !== essayResult.marksAwarded) {
        issues.push(`Question ${answer.questionId}: essayResult has ${essayResult.marksAwarded} marks but finalAnswer has ${answer.marksAwarded}`);
      }
    }
  });
  
  return {
    hasIssues: issues.length > 0,
    issues
  };
}
