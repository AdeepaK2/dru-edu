// Test attempt tracking service
// Handles multiple attempts, attempt validation, and re-attempt logic

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs,
  query, 
  where, 
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { firestore } from '@/utils/firebase-client';
import { 
  StudentSubmission,
  RealtimeTestSession 
} from '@/models/studentSubmissionSchema';
import { Test, FlexibleTest, LiveTest } from '@/models/testSchema';

export interface AttemptInfo {
  attemptNumber: number;
  attemptsUsed: number;
  attemptsAllowed: number;
  canReAttempt: boolean;
  previousAttempts: StudentSubmission[];
  nextAttemptNumber: number;
  lastAttemptStatus?: string;
  timeUntilNextAttempt?: number; // for live tests with cooldown
}

export class TestAttemptService {
  private static COLLECTIONS = {
    SUBMISSIONS: 'studentSubmissions',
    TESTS: 'tests'
  };

  // Get attempt information for a student and test
  static async getAttemptInfo(testId: string, studentId: string): Promise<AttemptInfo> {
    try {
      console.log('🔍 Getting attempt info for test:', testId, 'student:', studentId);

      // Get test data to check attempt limits
      const test = await this.getTest(testId);
      if (!test) {
        throw new Error('Test not found');
      }

      // Get all previous attempts by this student for this test
      const previousAttempts = await this.getStudentAttempts(testId, studentId);
      
      const attemptsUsed = previousAttempts.length;
      const attemptsAllowed = this.getAttemptsAllowed(test);
      const canReAttempt = this.canStudentReAttempt(test, previousAttempts);
      
      console.log('📊 Attempt info:', {
        attemptsUsed,
        attemptsAllowed,
        canReAttempt,
        previousAttemptsCount: previousAttempts.length
      });

      return {
        attemptNumber: attemptsUsed + 1,
        attemptsUsed,
        attemptsAllowed,
        canReAttempt,
        previousAttempts,
        nextAttemptNumber: attemptsUsed + 1,
        lastAttemptStatus: previousAttempts[0]?.status,
        timeUntilNextAttempt: this.getTimeUntilNextAttempt(test, previousAttempts)
      };
    } catch (error) {
      console.error('Error getting attempt info:', error);
      throw error;
    }
  }

  // Get test data
  private static async getTest(testId: string): Promise<Test | null> {
    try {
      const testDoc = await getDoc(doc(firestore, this.COLLECTIONS.TESTS, testId));
      if (!testDoc.exists()) {
        return null;
      }
      return { id: testDoc.id, ...testDoc.data() } as Test;
    } catch (error) {
      console.error('Error getting test:', error);
      return null;
    }
  }

  // Get all attempts by a student for a specific test
  private static async getStudentAttempts(testId: string, studentId: string): Promise<StudentSubmission[]> {
    try {
      const attemptsQuery = query(
        collection(firestore, this.COLLECTIONS.SUBMISSIONS),
        where('testId', '==', testId),
        where('studentId', '==', studentId),
        orderBy('attemptNumber', 'desc')
      );

      const snapshot = await getDocs(attemptsQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as StudentSubmission[];
    } catch (error) {
      console.error('Error getting student attempts:', error);
      return [];
    }
  }

  // Get attempts allowed for a test
  private static getAttemptsAllowed(test: Test): number {
    if (test.type === 'flexible') {
      return (test as FlexibleTest).attemptsAllowed || 1;
    } else {
      // Live tests typically allow only 1 attempt
      return 1;
    }
  }

  // Check if student can re-attempt the test
  private static canStudentReAttempt(test: Test, previousAttempts: StudentSubmission[]): boolean {
    const attemptsAllowed = this.getAttemptsAllowed(test);
    const attemptsUsed = previousAttempts.length;

    // Check attempt limit
    if (attemptsUsed >= attemptsAllowed) {
      console.log('❌ Cannot re-attempt: Attempt limit reached');
      return false;
    }

    // Check if test is still available
    if (!this.isTestAvailable(test)) {
      console.log('❌ Cannot re-attempt: Test not available');
      return false;
    }

    // Check if last attempt was submitted successfully
    if (previousAttempts.length > 0) {
      const lastAttempt = previousAttempts[0];
      if (lastAttempt.status === 'submitted' || lastAttempt.status === 'auto_submitted') {
        console.log('✅ Can re-attempt: Previous attempt completed');
        return true;
      } else {
        console.log('❌ Cannot re-attempt: Previous attempt not completed');
        return false;
      }
    }

    console.log('✅ Can attempt: No previous attempts');
    return true;
  }

  // Check if test is currently available
  private static isTestAvailable(test: Test): boolean {
    const now = Timestamp.now();

    if (test.type === 'live') {
      const liveTest = test as LiveTest;
      // Live test is available from student join time to actual end time
      return now.seconds >= liveTest.studentJoinTime.seconds && 
             now.seconds <= liveTest.actualEndTime.seconds;
    } else {
      const flexTest = test as FlexibleTest;
      // Flexible test is available between availableFrom and availableTo
      return now.seconds >= flexTest.availableFrom.seconds && 
             now.seconds <= flexTest.availableTo.seconds;
    }
  }

  // Get time until next attempt is allowed (for cooldown periods)
  private static getTimeUntilNextAttempt(test: Test, previousAttempts: StudentSubmission[]): number | undefined {
    // For now, return undefined (no cooldown)
    // Could implement cooldown logic here if needed
    return undefined;
  }

  // Validate if student can start a new attempt
  static async validateAttemptStart(testId: string, studentId: string): Promise<{
    canStart: boolean;
    reason?: string;
    attemptInfo: AttemptInfo;
  }> {
    try {
      const attemptInfo = await this.getAttemptInfo(testId, studentId);
      
      if (!attemptInfo.canReAttempt) {
        let reason = 'Cannot start new attempt';
        
        if (attemptInfo.attemptsUsed >= attemptInfo.attemptsAllowed) {
          reason = `Attempt limit reached (${attemptInfo.attemptsUsed}/${attemptInfo.attemptsAllowed})`;
        } else {
          const test = await this.getTest(testId);
          if (!test || !this.isTestAvailable(test)) {
            reason = 'Test is not currently available';
          }
        }

        return {
          canStart: false,
          reason,
          attemptInfo
        };
      }

      return {
        canStart: true,
        attemptInfo
      };
    } catch (error) {
      console.error('Error validating attempt start:', error);
      throw error;
    }
  }

  // Get best attempt (highest score) for a student
  static async getBestAttempt(testId: string, studentId: string): Promise<StudentSubmission | null> {
    try {
      const attempts = await this.getStudentAttempts(testId, studentId);
      
      if (attempts.length === 0) {
        return null;
      }

      // Sort by percentage (highest first), then by total score
      return attempts.sort((a, b) => {
        const aScore = a.percentage || 0;
        const bScore = b.percentage || 0;
        if (aScore !== bScore) {
          return bScore - aScore;
        }
        return (b.autoGradedScore || 0) - (a.autoGradedScore || 0);
      })[0];
    } catch (error) {
      console.error('Error getting best attempt:', error);
      return null;
    }
  }

  // Get latest attempt for a student
  static async getLatestAttempt(testId: string, studentId: string): Promise<StudentSubmission | null> {
    try {
      const attempts = await this.getStudentAttempts(testId, studentId);
      return attempts.length > 0 ? attempts[0] : null;
    } catch (error) {
      console.error('Error getting latest attempt:', error);
      return null;
    }
  }

  // Check if student has any completed attempts
  static async hasCompletedAttempts(testId: string, studentId: string): Promise<boolean> {
    try {
      const attempts = await this.getStudentAttempts(testId, studentId);
      return attempts.some(attempt => 
        attempt.status === 'submitted' || attempt.status === 'auto_submitted'
      );
    } catch (error) {
      console.error('Error checking completed attempts:', error);
      return false;
    }
  }
}
