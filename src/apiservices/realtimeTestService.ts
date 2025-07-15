// Real-time test session service using Firebase Realtime Database
// Handles live answer tracking, monitoring, and session management

import { 
  getDatabase, 
  ref, 
  set, 
  update, 
  get, 
  push,
  onValue, 
  off,
  serverTimestamp,
  onDisconnect,
  Database
} from 'firebase/database';
import { 
  RealtimeTestSession, 
  RealtimeAnswer, 
  AnswerChange,
  RealtimeMonitoring,
  TestSessionEvent
} from '@/models/studentSubmissionSchema';

export class RealtimeTestService {
  private static database: Database;
  
  // Initialize Realtime Database
  static init() {
    if (!this.database) {
      this.database = getDatabase();
    }
    return this.database;
  }

  // Start a new test session for a student
  static async startTestSession(
    attemptId: string,
    testId: string,
    studentId: string,
    studentName: string,
    classId: string,
    duration: number // in minutes
  ): Promise<void> {
    try {
      const db = this.init();
      const now = Date.now();
      
      const session: RealtimeTestSession = {
        attemptId,
        testId,
        studentId,
        studentName,
        classId,
        status: 'active',
        currentQuestionIndex: 0,
        isReviewMode: false,
        startTime: now,
        lastActivity: now,
        totalTimeSpent: 0,
        timePerQuestion: {},
        answers: {},
        questionsVisited: [],
        questionsCompleted: [],
        questionsMarkedForReview: [],
        userAgent: navigator.userAgent,
        isFullscreen: document.fullscreenElement !== null,
        tabSwitchCount: 0,
        disconnectionCount: 0,
        suspiciousActivity: {
          tabSwitches: 0,
          copyPasteAttempts: 0,
          rightClickAttempts: 0,
          keyboardShortcuts: []
        }
      };

      // Create session in realtime DB
      await set(ref(db, `testSessions/${attemptId}`), session);
      
      // Set up disconnect handler
      const sessionRef = ref(db, `testSessions/${attemptId}/status`);
      onDisconnect(sessionRef).set('disconnected');
      
      // Update monitoring stats
      await this.updateMonitoringStats(testId);
      
      // Log session start event
      await this.logSessionEvent(attemptId, studentId, 'start', { duration });

      console.log('✅ Test session started in Realtime DB:', attemptId);
    } catch (error) {
      console.error('Error starting test session:', error);
      throw error;
    }
  }

  // Save answer in real-time
  static async saveAnswer(
    attemptId: string,
    questionId: string,
    answer: any,
    questionType: 'mcq' | 'essay',
    timeSpent: number
  ): Promise<void> {
    try {
      const db = this.init();
      const now = Date.now();
      
      // Get current answer to track changes
      const currentAnswerRef = ref(db, `testSessions/${attemptId}/answers/${questionId}`);
      const currentSnapshot = await get(currentAnswerRef);
      const currentAnswer = currentSnapshot.val() as RealtimeAnswer | null;
      
      // Create change record
      const change: AnswerChange = {
        timestamp: now,
        type: questionType === 'mcq' ? 'select' : 'text_change',
        previousValue: currentAnswer?.selectedOption || currentAnswer?.textContent,
        newValue: answer,
        timeOnQuestion: timeSpent
      };

      // Create updated answer
      const updatedAnswer: RealtimeAnswer = {
        questionId,
        selectedOption: questionType === 'mcq' ? answer : undefined,
        textContent: questionType === 'essay' ? answer : undefined,
        lastModified: now,
        timeSpent: timeSpent,
        isMarkedForReview: currentAnswer?.isMarkedForReview || false,
        changeHistory: [...(currentAnswer?.changeHistory || []), change]
      };

      // Update in realtime DB
      const updates: Record<string, any> = {
        [`testSessions/${attemptId}/answers/${questionId}`]: updatedAnswer,
        [`testSessions/${attemptId}/lastActivity`]: now,
        [`testSessions/${attemptId}/timePerQuestion/${questionId}`]: timeSpent
      };

      await update(ref(db), updates);
      
      // Log answer change event
      await this.logSessionEvent(attemptId, '', 'answer_change', { 
        questionId, 
        questionType,
        answerValue: questionType === 'mcq' ? answer : answer?.substring(0, 50) + '...'
      });

      console.log('💾 Answer saved in real-time for question:', questionId);
    } catch (error) {
      console.error('Error saving answer:', error);
      throw error;
    }
  }

  // Navigate to question
  static async navigateToQuestion(
    attemptId: string,
    questionIndex: number,
    questionId: string
  ): Promise<void> {
    try {
      const db = this.init();
      const now = Date.now();
      
      const updates: Record<string, any> = {
        [`testSessions/${attemptId}/currentQuestionIndex`]: questionIndex,
        [`testSessions/${attemptId}/lastActivity`]: now
      };

      // Add to visited questions if not already there
      const visitedRef = ref(db, `testSessions/${attemptId}/questionsVisited`);
      const visitedSnapshot = await get(visitedRef);
      const visited = visitedSnapshot.val() || [];
      
      if (!visited.includes(questionId)) {
        updates[`testSessions/${attemptId}/questionsVisited`] = [...visited, questionId];
      }

      await update(ref(db), updates);
      
      // Log navigation event
      await this.logSessionEvent(attemptId, '', 'question_navigate', { 
        questionIndex, 
        questionId 
      });
    } catch (error) {
      console.error('Error navigating to question:', error);
      throw error;
    }
  }

  // Mark question for review
  static async toggleReviewMark(
    attemptId: string,
    questionId: string,
    isMarked: boolean
  ): Promise<void> {
    try {
      const db = this.init();
      const now = Date.now();
      
      const updates: Record<string, any> = {
        [`testSessions/${attemptId}/answers/${questionId}/isMarkedForReview`]: isMarked,
        [`testSessions/${attemptId}/lastActivity`]: now
      };

      // Update marked questions list
      const markedRef = ref(db, `testSessions/${attemptId}/questionsMarkedForReview`);
      const markedSnapshot = await get(markedRef);
      const marked = markedSnapshot.val() || [];
      
      if (isMarked && !marked.includes(questionId)) {
        updates[`testSessions/${attemptId}/questionsMarkedForReview`] = [...marked, questionId];
      } else if (!isMarked && marked.includes(questionId)) {
        updates[`testSessions/${attemptId}/questionsMarkedForReview`] = marked.filter((id: string) => id !== questionId);
      }

      await update(ref(db), updates);
      
      // Log review toggle event
      await this.logSessionEvent(attemptId, '', 'review_toggle', { 
        questionId, 
        isMarked 
      });
    } catch (error) {
      console.error('Error toggling review mark:', error);
      throw error;
    }
  }

  // Track suspicious activity
  static async trackSuspiciousActivity(
    attemptId: string,
    activityType: 'tab_switch' | 'copy_paste' | 'right_click' | 'keyboard_shortcut',
    details?: any
  ): Promise<void> {
    try {
      const db = this.init();
      const now = Date.now();
      
      const sessionRef = ref(db, `testSessions/${attemptId}`);
      const sessionSnapshot = await get(sessionRef);
      const session = sessionSnapshot.val() as RealtimeTestSession;
      
      if (!session) return;

      const updates: Record<string, any> = {
        [`testSessions/${attemptId}/lastActivity`]: now
      };

      switch (activityType) {
        case 'tab_switch':
          updates[`testSessions/${attemptId}/tabSwitchCount`] = (session.tabSwitchCount || 0) + 1;
          updates[`testSessions/${attemptId}/suspiciousActivity/tabSwitches`] = 
            (session.suspiciousActivity?.tabSwitches || 0) + 1;
          await this.logSessionEvent(attemptId, '', 'tab_switch');
          break;
          
        case 'copy_paste':
          updates[`testSessions/${attemptId}/suspiciousActivity/copyPasteAttempts`] = 
            (session.suspiciousActivity?.copyPasteAttempts || 0) + 1;
          break;
          
        case 'right_click':
          updates[`testSessions/${attemptId}/suspiciousActivity/rightClickAttempts`] = 
            (session.suspiciousActivity?.rightClickAttempts || 0) + 1;
          break;
          
        case 'keyboard_shortcut':
          const shortcuts = session.suspiciousActivity?.keyboardShortcuts || [];
          updates[`testSessions/${attemptId}/suspiciousActivity/keyboardShortcuts`] = 
            [...shortcuts, details?.shortcut || 'unknown'];
          break;
      }

      await update(ref(db), updates);
    } catch (error) {
      console.error('Error tracking suspicious activity:', error);
    }
  }

  // Get real-time session data
  static async getSession(attemptId: string): Promise<RealtimeTestSession | null> {
    try {
      const db = this.init();
      const sessionRef = ref(db, `testSessions/${attemptId}`);
      const snapshot = await get(sessionRef);
      return snapshot.val() as RealtimeTestSession | null;
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  }

  // Listen to session changes (for teacher monitoring)
  static listenToSession(
    attemptId: string, 
    callback: (session: RealtimeTestSession | null) => void
  ): () => void {
    const db = this.init();
    const sessionRef = ref(db, `testSessions/${attemptId}`);
    
    onValue(sessionRef, (snapshot) => {
      const session = snapshot.val() as RealtimeTestSession | null;
      callback(session);
    });

    // Return unsubscribe function
    return () => off(sessionRef);
  }

  // Listen to test monitoring data
  static listenToTestMonitoring(
    testId: string,
    callback: (monitoring: RealtimeMonitoring) => void
  ): () => void {
    const db = this.init();
    const monitoringRef = ref(db, `testMonitoring/${testId}`);
    
    onValue(monitoringRef, (snapshot) => {
      const monitoring = snapshot.val() as RealtimeMonitoring;
      callback(monitoring);
    });

    return () => off(monitoringRef);
  }

  // Submit test (mark as completed)
  static async submitTest(attemptId: string): Promise<RealtimeTestSession | null> {
    try {
      const db = this.init();
      const now = Date.now();
      
      // Get final session data
      const session = await this.getSession(attemptId);
      if (!session) return null;

      // Mark as submitted
      await update(ref(db, `testSessions/${attemptId}`), {
        status: 'submitted',
        lastActivity: now
      });

      // Log submission event
      await this.logSessionEvent(attemptId, session.studentId, 'submit');
      
      // Update monitoring stats
      await this.updateMonitoringStats(session.testId);

      console.log('✅ Test submitted in Realtime DB:', attemptId);
      return session;
    } catch (error) {
      console.error('Error submitting test:', error);
      throw error;
    }
  }

  // Clean up session after processing
  static async cleanupSession(attemptId: string): Promise<void> {
    try {
      const db = this.init();
      
      // Move to archived sessions instead of deleting
      const session = await this.getSession(attemptId);
      if (session) {
        await set(ref(db, `archivedSessions/${attemptId}`), {
          ...session,
          archivedAt: Date.now()
        });
      }
      
      // Remove from active sessions
      await set(ref(db, `testSessions/${attemptId}`), null);
      
      console.log('🗑️ Session cleaned up:', attemptId);
    } catch (error) {
      console.error('Error cleaning up session:', error);
    }
  }

  // Update monitoring statistics
  private static async updateMonitoringStats(testId: string): Promise<void> {
    try {
      const db = this.init();
      const now = Date.now();
      
      // Get all sessions for this test
      const sessionsRef = ref(db, 'testSessions');
      const snapshot = await get(sessionsRef);
      const allSessions = snapshot.val() || {};
      
      // Filter sessions for this test
      const testSessions = Object.values(allSessions).filter(
        (session: any) => session.testId === testId
      ) as RealtimeTestSession[];

      // Calculate stats
      const stats = {
        totalStudents: testSessions.length,
        studentsStarted: testSessions.filter(s => s.status !== 'disconnected').length,
        studentsActive: testSessions.filter(s => s.status === 'active').length,
        studentsCompleted: testSessions.filter(s => s.status === 'submitted').length,
        averageProgress: 0,
        averageTimeSpent: 0
      };

      // Create active students mapping
      const activeStudents: Record<string, any> = {};
      testSessions.forEach(session => {
        activeStudents[session.studentId] = {
          studentId: session.studentId,
          studentName: session.studentName,
          status: session.status,
          currentQuestion: session.currentQuestionIndex,
          progress: (Object.keys(session.answers).length / (session.questionsVisited.length || 1)) * 100,
          timeRemaining: Math.max(0, (session.startTime + 90 * 60 * 1000) - now), // assuming 90 min test
          lastActivity: session.lastActivity,
          suspiciousActivity: (session.suspiciousActivity?.tabSwitches || 0) > 3
        };
      });

      const monitoring: RealtimeMonitoring = {
        testId,
        lastUpdated: now,
        activeStudents,
        stats,
        questionProgress: {} // Would calculate this based on answers
      };

      await set(ref(db, `testMonitoring/${testId}`), monitoring);
    } catch (error) {
      console.error('Error updating monitoring stats:', error);
    }
  }

  // Log session events for analytics
  private static async logSessionEvent(
    attemptId: string,
    studentId: string,
    eventType: string,
    data?: any
  ): Promise<void> {
    try {
      const db = this.init();
      const event: TestSessionEvent = {
        timestamp: Date.now(),
        attemptId,
        studentId,
        eventType: eventType as any,
        data,
        questionId: data?.questionId
      };

      await push(ref(db, `testEvents/${attemptId.substring(0, 8)}`), event);
    } catch (error) {
      console.error('Error logging session event:', error);
    }
  }

  // Heartbeat to keep session alive
  static async updateHeartbeat(attemptId: string): Promise<void> {
    try {
      const db = this.init();
      await update(ref(db, `testSessions/${attemptId}`), {
        lastActivity: Date.now()
      });
    } catch (error) {
      console.error('Error updating heartbeat:', error);
    }
  }
}
