// Test service for managing tests and attempts

import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  writeBatch,
  onSnapshot,
  Timestamp,
  increment
} from 'firebase/firestore';
import { firestore } from '@/utils/firebase-client';
import { 
  Test, 
  LiveTest, 
  FlexibleTest, 
  TestAttempt, 
  TestAnalytics,
  TestQuestion,
  StudentAnswer,
  MCQAnswer,
  EssayAnswer,
  QuestionBankSelection,
  TestConfig,
  AttemptStatus
} from '@/models/testSchema';
import { Question, MCQQuestion, EssayQuestion } from '@/models/questionBankSchema';

export class TestService {
  private static readonly COLLECTIONS = {
    TESTS: 'tests',
    ATTEMPTS: 'test_attempts',
    ANALYTICS: 'test_analytics',
    NOTIFICATIONS: 'test_notifications'
  };

  // Create a new test
  static async createTest(testData: Omit<Test, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(firestore, this.COLLECTIONS.TESTS), {
        ...testData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating test:', error);
      throw new Error('Failed to create test');
    }
  }

  // Update test
  static async updateTest(testId: string, updates: Partial<Test>): Promise<void> {
    try {
      const testRef = doc(firestore, this.COLLECTIONS.TESTS, testId);
      await updateDoc(testRef, {
        ...updates,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating test:', error);
      throw new Error('Failed to update test');
    }
  }

  // Get test by ID
  static async getTest(testId: string): Promise<Test | null> {
    try {
      const testDoc = await getDoc(doc(firestore, this.COLLECTIONS.TESTS, testId));
      if (!testDoc.exists()) return null;
      
      return {
        id: testDoc.id,
        ...testDoc.data()
      } as Test;
    } catch (error) {
      console.error('Error fetching test:', error);
      throw new Error('Failed to fetch test');
    }
  }

  // Get test by ID
  static async getTestById(testId: string): Promise<Test> {
    try {
      const testRef = doc(firestore, 'tests', testId);
      const testDoc = await getDoc(testRef);
      
      if (!testDoc.exists()) {
        throw new Error('Test not found');
      }
      
      return {
        id: testDoc.id,
        ...testDoc.data()
      } as Test;
    } catch (error) {
      console.error('Error getting test by ID:', error);
      throw error;
    }
  }

  // Get tests for teacher
  static async getTeacherTests(teacherId: string): Promise<Test[]> {
    try {
      console.log('🔍 Fetching tests for teacher ID:', teacherId);
      
      const testsQuery = query(
        collection(firestore, this.COLLECTIONS.TESTS),
        where('teacherId', '==', teacherId),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(testsQuery);
      const tests = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Test[];
      
      console.log('✅ Found', tests.length, 'tests for teacher');
      return tests;
    } catch (error) {
      console.error('Error fetching teacher tests:', error);
      // Return empty array instead of throwing error if it's just a "no results" case
      if (error instanceof Error && error.message.includes('index')) {
        console.warn('Index might not exist yet, returning empty tests array');
        return [];
      }
      throw new Error('Failed to fetch teacher tests');
    }
  }

  // Auto-select questions from lessons
  static async autoSelectQuestions(
    selections: QuestionBankSelection[],
    config: TestConfig
  ): Promise<TestQuestion[]> {
    try {
      const selectedQuestions: TestQuestion[] = [];
      let currentOrder = 1;

      for (const selection of selections) {
        // Get questions from the specified bank and lessons
        let questionsQuery = query(
          collection(firestore, 'questions'),
          where('bankId', '==', selection.bankId)
        );

        if (selection.lessonIds && selection.lessonIds.length > 0) {
          questionsQuery = query(
            questionsQuery,
            where('lessonId', 'in', selection.lessonIds)
          );
        }

        const snapshot = await getDocs(questionsQuery);
        const questions = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Question[];

        // Group by difficulty if balance is specified
        if (config.difficultyBalance && selection.difficultyDistribution) {
          const { easy, medium, hard } = selection.difficultyDistribution;
          const easyQs = questions.filter(q => q.difficultyLevel === 'easy');
          const mediumQs = questions.filter(q => q.difficultyLevel === 'medium');
          const hardQs = questions.filter(q => q.difficultyLevel === 'hard');

          // Select required number from each difficulty
          const selectedEasy = this.shuffleArray(easyQs).slice(0, easy);
          const selectedMedium = this.shuffleArray(mediumQs).slice(0, medium);
          const selectedHard = this.shuffleArray(hardQs).slice(0, hard);

          const allSelected = [...selectedEasy, ...selectedMedium, ...selectedHard];
          
          // Convert to TestQuestion format
          for (const question of allSelected) {
            selectedQuestions.push(this.convertToTestQuestion(question, currentOrder++));
          }
        } else {
          // Random selection without difficulty balance
          const shuffled = this.shuffleArray(questions);
          const selected = shuffled.slice(0, selection.questionCount);
          
          for (const question of selected) {
            selectedQuestions.push(this.convertToTestQuestion(question, currentOrder++));
          }
        }
      }

      // Shuffle final questions if required
      if (config.shuffleQuestions) {
        return this.shuffleArray(selectedQuestions).map((q, index) => ({
          ...q,
          order: index + 1
        }));
      }

      return selectedQuestions;
    } catch (error) {
      console.error('Error auto-selecting questions:', error);
      throw new Error('Failed to auto-select questions');
    }
  }

  // Convert Question to TestQuestion
  private static convertToTestQuestion(question: Question, order: number): TestQuestion {
    const testQuestion: TestQuestion = {
      questionId: question.id,
      questionType: question.type,
      points: question.points,
      order,
      questionData: {
        title: question.title,
        content: question.content,
        imageUrl: question.imageUrl
      }
    };

    if (question.type === 'mcq') {
      const mcq = question as MCQQuestion;
      if (testQuestion.questionData) {
        testQuestion.questionData.options = mcq.options.map(opt => ({
          id: opt.id,
          text: opt.text,
          imageUrl: opt.imageUrl
        }));
        testQuestion.questionData.explanation = mcq.explanation;
        testQuestion.questionData.explanationImageUrl = mcq.explanationImageUrl;
      }
    }

    return testQuestion;
  }

  // Utility function to shuffle array
  private static shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // Start test attempt
  static async startTestAttempt(testId: string, studentId: string, studentName: string, classId: string): Promise<string> {
    try {
      // Check if student already has an attempt
      const existingAttemptQuery = query(
        collection(firestore, this.COLLECTIONS.ATTEMPTS),
        where('testId', '==', testId),
        where('studentId', '==', studentId)
      );
      
      const existingSnapshot = await getDocs(existingAttemptQuery);
      if (!existingSnapshot.empty) {
        const existingAttempt = existingSnapshot.docs[0].data() as TestAttempt;
        if (existingAttempt.status === 'in_progress') {
          return existingSnapshot.docs[0].id;
        }
        if (existingAttempt.status === 'submitted' || existingAttempt.status === 'auto_submitted') {
          throw new Error('Test already completed');
        }
      }

      // Get test details
      const test = await this.getTest(testId);
      if (!test) throw new Error('Test not found');

      // Create new attempt
      const attemptData: Omit<TestAttempt, 'id'> = {
        testId,
        testTitle: test.title,
        studentId,
        studentName,
        classId,
        attemptNumber: 1,
        status: 'in_progress',
        startTime: Timestamp.now(),
        timeSpent: 0,
        remainingTime: test.type === 'live' 
          ? (test as LiveTest).duration * 60 
          : (test as FlexibleTest).duration * 60,
        answers: [],
        autoSubmitted: false
      };

      const docRef = await addDoc(collection(firestore, this.COLLECTIONS.ATTEMPTS), attemptData);
      
      // Update test statistics for live tests
      if (test.type === 'live') {
        await updateDoc(doc(firestore, this.COLLECTIONS.TESTS, testId), {
          studentsOnline: increment(1)
        });
      }

      return docRef.id;
    } catch (error) {
      console.error('Error starting test attempt:', error);
      throw new Error('Failed to start test attempt');
    }
  }

  // Save answer
  static async saveAnswer(attemptId: string, answer: StudentAnswer): Promise<void> {
    try {
      const attemptRef = doc(firestore, this.COLLECTIONS.ATTEMPTS, attemptId);
      const attemptDoc = await getDoc(attemptRef);
      
      if (!attemptDoc.exists()) {
        throw new Error('Test attempt not found');
      }

      const attempt = attemptDoc.data() as TestAttempt;
      const updatedAnswers = [...attempt.answers];
      
      // Find existing answer for this question and update, or add new
      const existingIndex = updatedAnswers.findIndex(a => a.questionId === answer.questionId);
      if (existingIndex >= 0) {
        updatedAnswers[existingIndex] = answer;
      } else {
        updatedAnswers.push(answer);
      }

      await updateDoc(attemptRef, {
        answers: updatedAnswers,
        timeSpent: attempt.timeSpent + answer.timeSpent
      });
    } catch (error) {
      console.error('Error saving answer:', error);
      throw new Error('Failed to save answer');
    }
  }

  // Submit test
  static async submitTest(attemptId: string, autoSubmitted: boolean = false): Promise<void> {
    try {
      const attemptRef = doc(firestore, this.COLLECTIONS.ATTEMPTS, attemptId);
      const attemptDoc = await getDoc(attemptRef);
      
      if (!attemptDoc.exists()) {
        throw new Error('Test attempt not found');
      }

      const attempt = attemptDoc.data() as TestAttempt;
      const test = await this.getTest(attempt.testId);
      if (!test) throw new Error('Test not found');

      // Calculate results
      const results = await this.calculateResults(attempt, test);

      await updateDoc(attemptRef, {
        status: autoSubmitted ? 'auto_submitted' : 'submitted',
        endTime: Timestamp.now(),
        submittedAt: Timestamp.now(),
        autoSubmitted,
        ...results
      });

      // Update test statistics
      if (test.type === 'live') {
        const liveTest = test as LiveTest;
        await updateDoc(doc(firestore, this.COLLECTIONS.TESTS, test.id), {
          studentsCompleted: increment(1),
          studentsOnline: increment(-1)
        });
      }

      // Update analytics
      await this.updateTestAnalytics(test.id);
    } catch (error) {
      console.error('Error submitting test:', error);
      throw new Error('Failed to submit test');
    }
  }

  // Calculate test results
  private static async calculateResults(attempt: TestAttempt, test: Test): Promise<Partial<TestAttempt>> {
    try {
      let mcqCorrect = 0;
      let mcqWrong = 0;
      let totalMcqMarks = 0;
      let essayMarks = 0; // Will be updated later by teacher review

      // Get question details for marking
      const questionIds = test.questions.map(q => q.questionId);
      const questionsQuery = query(
        collection(firestore, 'questions'),
        where('id', 'in', questionIds)
      );
      const questionsSnapshot = await getDocs(questionsQuery);
      const questionsMap = new Map<string, Question>();
      
      questionsSnapshot.docs.forEach(doc => {
        questionsMap.set(doc.id, { id: doc.id, ...doc.data() } as Question);
      });

      // Calculate MCQ scores
      for (const answer of attempt.answers) {
        const question = questionsMap.get(answer.questionId);
        if (!question) continue;

        if (question.type === 'mcq') {
          const mcqQuestion = question as MCQQuestion;
          const mcqAnswer = answer as MCQAnswer;
          const correctOption = mcqQuestion.options.find(opt => opt.isCorrect);
          
          if (correctOption && mcqAnswer.selectedOption === correctOption.id) {
            mcqCorrect++;
            totalMcqMarks += question.points;
          } else {
            mcqWrong++;
          }
        }
      }

      const totalMarks = totalMcqMarks + essayMarks;
      const percentage = test.totalMarks > 0 ? (totalMarks / test.totalMarks) * 100 : 0;
      
      let passStatus: 'passed' | 'failed' | 'pending' = 'pending';
      if (test.config.passingScore) {
        // If there are essay questions, mark as pending until teacher reviews
        const hasEssayQuestions = test.questions.some(q => q.questionType === 'essay');
        if (!hasEssayQuestions) {
          passStatus = percentage >= test.config.passingScore ? 'passed' : 'failed';
        }
      }

      return {
        score: totalMarks,
        totalMarks: test.totalMarks,
        percentage,
        mcqCorrect,
        mcqWrong,
        essayMarks,
        passStatus
      };
    } catch (error) {
      console.error('Error calculating results:', error);
      throw new Error('Failed to calculate results');
    }
  }

  // Update test analytics
  private static async updateTestAnalytics(testId: string): Promise<void> {
    try {
      // Implementation for updating analytics
      // This would calculate various statistics and update the analytics document
      console.log('Updating analytics for test:', testId);
      // TODO: Implement detailed analytics calculation
    } catch (error) {
      console.error('Error updating analytics:', error);
    }
  }

  // Get test attempt by ID
  static async getTestAttempt(attemptId: string): Promise<TestAttempt> {
    try {
      const attemptRef = doc(firestore, 'testAttempts', attemptId);
      const attemptDoc = await getDoc(attemptRef);
      
      if (!attemptDoc.exists()) {
        throw new Error('Test attempt not found');
      }
      
      const data = attemptDoc.data();
      return {
        id: attemptDoc.id,
        ...data,
        startTime: data.startTime,
        endTime: data.endTime,
        submittedAt: data.submittedAt
      } as TestAttempt;
    } catch (error) {
      console.error('Error getting test attempt:', error);
      throw error;
    }
  }

  // Save individual answer during test
  static async saveTestAnswer(attemptId: string, questionId: string, answer: any): Promise<void> {
    try {
      const attemptRef = doc(firestore, 'testAttempts', attemptId);
      
      await updateDoc(attemptRef, {
        [`answers.${questionId}`]: answer,
        lastSaved: Timestamp.now()
      });
    } catch (error) {
      console.error('Error saving answer:', error);
      throw error;
    }
  }

  // Get student's attempt for a test
  static async getStudentTestAttempt(testId: string, studentId: string): Promise<TestAttempt | null> {
    try {
      const attemptQuery = query(
        collection(firestore, this.COLLECTIONS.ATTEMPTS),
        where('testId', '==', testId),
        where('studentId', '==', studentId),
        limit(1)
      );
      
      const snapshot = await getDocs(attemptQuery);
      if (snapshot.empty) return null;
      
      return {
        id: snapshot.docs[0].id,
        ...snapshot.docs[0].data()
      } as TestAttempt;
    } catch (error) {
      console.error('Error fetching student test attempt:', error);
      throw new Error('Failed to fetch student test attempt');
    }
  }

  // Real-time listener for test attempts (for teacher monitoring)
  static listenToTestAttempts(testId: string, callback: (attempts: TestAttempt[]) => void) {
    const attemptsQuery = query(
      collection(firestore, this.COLLECTIONS.ATTEMPTS),
      where('testId', '==', testId),
      orderBy('startTime', 'desc')
    );

    return onSnapshot(attemptsQuery, (snapshot) => {
      const attempts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as TestAttempt[];
      
      callback(attempts);
    });
  }

  // Delete test
  static async deleteTest(testId: string): Promise<void> {
    try {
      const batch = writeBatch(firestore);
      
      // Delete test
      batch.delete(doc(firestore, this.COLLECTIONS.TESTS, testId));
      
      // Delete all attempts for this test
      const attemptsQuery = query(
        collection(firestore, this.COLLECTIONS.ATTEMPTS),
        where('testId', '==', testId)
      );
      const attemptsSnapshot = await getDocs(attemptsQuery);
      attemptsSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      // Delete analytics
      batch.delete(doc(firestore, this.COLLECTIONS.ANALYTICS, testId));
      
      await batch.commit();
    } catch (error) {
      console.error('Error deleting test:', error);
      throw new Error('Failed to delete test');
    }
  }

  // Get available tests for a student
  static async getStudentTests(studentId: string, classIds: string[]): Promise<Test[]> {
    try {
      const now = Timestamp.now();
      const testsRef = collection(firestore, 'tests');
      
      // Query for tests assigned to student's classes and currently available
      const q = query(
        testsRef,
        where('classIds', 'array-contains-any', classIds),
        where('isActive', '==', true)
      );
      
      const snapshot = await getDocs(q);
      const tests: Test[] = [];
      
      snapshot.forEach((doc) => {
        const testData = { id: doc.id, ...doc.data() } as Test;
        
        // Check if test is currently available based on type
        let isAvailable = false;
        
        if (testData.type === 'live') {
          const liveTest = testData as LiveTest;
          // Live test is available during the test window
          isAvailable = now.seconds >= liveTest.studentJoinTime.seconds && 
                       now.seconds <= liveTest.actualEndTime.seconds;
        } else {
          const flexTest = testData as FlexibleTest;
          // Flexible test is available during the entire period
          isAvailable = now.seconds >= flexTest.availableFrom.seconds && 
                       now.seconds <= flexTest.availableTo.seconds;
        }
        
        // Include test if it's available or starting soon (for live tests)
        if (isAvailable || testData.type === 'live') {
          tests.push(testData);
        } else if (testData.type === 'flexible') {
          const flexTest = testData as FlexibleTest;
          // Include flexible tests that are coming up within 24 hours
          const timeDiff = flexTest.availableFrom.seconds - now.seconds;
          if (timeDiff > 0 && timeDiff <= 86400) { // 24 hours
            tests.push(testData);
          }
        }
      });
      
      // Sort by availability and start time
      tests.sort((a, b) => {
        const aTime = a.type === 'live' 
          ? (a as LiveTest).scheduledStartTime.seconds 
          : (a as FlexibleTest).availableFrom.seconds;
        const bTime = b.type === 'live' 
          ? (b as LiveTest).scheduledStartTime.seconds 
          : (b as FlexibleTest).availableFrom.seconds;
        
        return aTime - bTime;
      });
      
      return tests;
    } catch (error) {
      console.error('Error getting student tests:', error);
      throw error;
    }
  }

  // Real-time test monitoring for teachers
  static subscribeToTestUpdates(testId: string, callback: (test: Test | null) => void): () => void {
    const testRef = doc(firestore, 'tests', testId);
    
    return onSnapshot(testRef, (doc) => {
      if (doc.exists()) {
        const test = { id: doc.id, ...doc.data() } as Test;
        callback(test);
      } else {
        callback(null);
      }
    });
  }
}
