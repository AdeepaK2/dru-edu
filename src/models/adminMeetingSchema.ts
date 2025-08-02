import { z } from 'zod';

// Admin Meeting Link Schema
export const adminMeetingLinkSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name is required'),
  url: z.string().url('Valid URL is required'),
  isActive: z.boolean().default(true),
  usageCount: z.number().min(0).default(0),
  maxConcurrentUsers: z.number().min(1).max(1000).default(100),
  description: z.string().optional(),
  provider: z.enum(['zoom', 'teams', 'meet', 'other']).default('zoom'),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
  createdBy: z.string().optional(), // Admin ID who created this link
});

// Meeting Link Assignment Schema
export const meetingLinkAssignmentSchema = z.object({
  id: z.string(),
  linkId: z.string(),
  teacherId: z.string(),
  studentId: z.string(),
  bookingId: z.string(), // Reference to the meeting booking
  assignedAt: z.date().default(() => new Date()),
  scheduledStart: z.date(),
  scheduledEnd: z.date(),
  status: z.enum(['assigned', 'active', 'completed', 'cancelled']).default('assigned'),
  actualStartTime: z.date().optional(),
  actualEndTime: z.date().optional(),
});

// Meeting Link Pool Configuration Schema
export const meetingLinkPoolConfigSchema = z.object({
  id: z.string(),
  assignmentStrategy: z.enum(['round-robin', 'least-used', 'random', 'preference']).default('least-used'),
  enableAutoAssignment: z.boolean().default(true),
  maxConcurrentMeetingsPerLink: z.number().min(1).default(1),
  bufferTimeMinutes: z.number().min(0).default(5), // Buffer between meetings
  enableLinkRotation: z.boolean().default(true),
  maintenanceSchedule: z.array(z.object({
    linkId: z.string(),
    startTime: z.string(), // HH:MM format
    endTime: z.string(), // HH:MM format
    dayOfWeek: z.number().min(0).max(6), // 0 = Sunday
  })).optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

// Meeting Link Analytics Schema
export const meetingLinkAnalyticsSchema = z.object({
  id: z.string(),
  linkId: z.string(),
  date: z.string(), // YYYY-MM-DD format
  totalMeetings: z.number().min(0).default(0),
  totalDurationMinutes: z.number().min(0).default(0),
  averageMeetingDuration: z.number().min(0).default(0),
  peakUsageHour: z.number().min(0).max(23).optional(),
  uniqueTeachers: z.number().min(0).default(0),
  uniqueStudents: z.number().min(0).default(0),
  successfulMeetings: z.number().min(0).default(0),
  cancelledMeetings: z.number().min(0).default(0),
  noShowMeetings: z.number().min(0).default(0),
  createdAt: z.date().default(() => new Date()),
});

// Type exports
export type AdminMeetingLink = z.infer<typeof adminMeetingLinkSchema>;
export type MeetingLinkAssignment = z.infer<typeof meetingLinkAssignmentSchema>;
export type MeetingLinkPoolConfig = z.infer<typeof meetingLinkPoolConfigSchema>;
export type MeetingLinkAnalytics = z.infer<typeof meetingLinkAnalyticsSchema>;

// Utility types for frontend
export type MeetingLinkForm = Omit<AdminMeetingLink, 'id' | 'usageCount' | 'createdAt' | 'updatedAt' | 'createdBy'>;
export type MeetingLinkUpdate = Partial<Omit<AdminMeetingLink, 'id' | 'createdAt' | 'createdBy'>>;

// Helper functions
export const createMeetingLinkId = (): string => {
  return `ml_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const createAssignmentId = (): string => {
  return `ma_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Meeting link validation helpers
export const validateMeetingUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    const supportedDomains = [
      'zoom.us',
      'teams.microsoft.com',
      'meet.google.com',
      'whereby.com',
      'jitsi.meet'
    ];
    
    return supportedDomains.some(domain => urlObj.hostname.includes(domain));
  } catch {
    return false;
  }
};

export const extractMeetingProvider = (url: string): AdminMeetingLink['provider'] => {
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname.includes('zoom.us')) return 'zoom';
    if (urlObj.hostname.includes('teams.microsoft.com')) return 'teams';
    if (urlObj.hostname.includes('meet.google.com')) return 'meet';
    return 'other';
  } catch {
    return 'other';
  }
};
