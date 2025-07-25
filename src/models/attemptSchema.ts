// Test attempt tracking schema
// Separate collection to track individual test attempts

import { Timestamp } from 'firebase/firestore';

// Test attempt status
export type TestAttemptStatus = 
  | 'not_started'     // Attempt created but not started
  | 'in_progress'     // Currently taking the test
  | 'paused'          // Temporarily paused (offline)
  | 'submitted'       // Successfully submitted
  | 'auto_submitted'  // Auto-submitted due to time expiry
  | 'abandoned'       // Left incomplete (timeout)
  | 'terminated';     // Terminated by system/teacher

// Individual test attempt record
export interface TestAttempt {
  id: string; // attempt ID (same as session ID)
  
  // Basic info
  testId: string;
  testTitle: string;
  studentId: string;
  studentName: string;
  classId: string;
  className?: string;
  
  // Attempt tracking
  attemptNumber: number; // 1, 2, 3, etc.
  status: TestAttemptStatus;
  
  // Timing management
  startedAt: Timestamp; // When attempt was first started
  lastActiveAt: Timestamp; // Last activity timestamp
  submittedAt?: Timestamp; // When submitted (if completed)
  
  // Time tracking
  totalTimeAllowed: number; // Total time allowed in seconds
  timeSpent: number; // Actual time spent in seconds
  timeRemaining: number; // Remaining time in seconds
  
  // Session management
  sessionStartTime: number; // Realtime DB timestamp when session started
  lastHeartbeat: number; // Last heartbeat timestamp
  offlineTime: number; // Total time spent offline in seconds
  
  // Progress tracking
  questionsAttempted: number;
  questionsCompleted: number;
  currentQuestionIndex: number;
  
  // Connection tracking
  connectionEvents: ConnectionEvent[];
  suspiciousActivityCount: number;
  
  // Results (populated after submission)
  score?: number;
  maxScore?: number;
  percentage?: number;
  passStatus?: 'passed' | 'failed' | 'pending';
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Connection event tracking
export interface ConnectionEvent {
  timestamp: number; // milliseconds
  type: 'connect' | 'disconnect' | 'heartbeat' | 'page_refresh' | 'tab_switch';
  duration?: number; // for disconnect events
  metadata?: {
    userAgent?: string;
    reason?: string;
    location?: string;
  };
}

// Attempt summary for quick lookups
export interface AttemptSummary {
  testId: string;
  studentId: string;
  totalAttempts: number;
  attemptsAllowed: number;
  canCreateNewAttempt: boolean;
  bestScore?: number;
  lastAttemptStatus?: TestAttemptStatus;
  lastAttemptDate?: Timestamp;
  attempts: {
    attemptNumber: number;
    attemptId: string;
    status: TestAttemptStatus;
    score?: number;
    percentage?: number;
    submittedAt?: Timestamp;
  }[];
}

// Real-time attempt state (stored in Realtime DB)
export interface RealtimeAttemptState {
  attemptId: string;
  testId: string;
  studentId: string;
  
  // Current state
  status: TestAttemptStatus;
  isActive: boolean;
  lastHeartbeat: number;
  
  // Time management
  sessionStartTime: number; // When this session started
  totalTimeSpent: number; // Cumulative time spent
  timeRemaining: number; // Real-time remaining time
  
  // Current position
  currentQuestionIndex: number;
  questionsVisited: string[];
  
  // Connection state
  isOnline: boolean;
  disconnectedAt?: number;
  connectionId: string; // Unique per browser session
  
  // Browser info
  userAgent: string;
  tabId: string;
  windowId: string;
}

// Time calculation utilities
export interface TimeCalculation {
  totalTimeAllowed: number; // seconds
  timeSpent: number; // seconds
  timeRemaining: number; // seconds
  offlineTime: number; // seconds
  isExpired: boolean;
  canContinue: boolean;
  timeUntilExpiry: number; // seconds
}
