import { z } from 'zod';

// Teacher Availability Schema
export const teacherAvailabilitySchema = z.object({
  id: z.string(),
  teacherId: z.string(),
  teacherName: z.string(),
  teacherSubjects: z.array(z.string()),
  day: z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']),
  date: z.string(), // YYYY-MM-DD format
  startTime: z.string(), // HH:MM format
  endTime: z.string(), // HH:MM format
  slotDuration: z.number().min(15).max(120), // in minutes
  isActive: z.boolean().default(true),
  meetingLink: z.string().url().optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

// Individual Time Slot Schema (generated from availability)
export const timeSlotSchema = z.object({
  id: z.string(),
  availabilityId: z.string(),
  teacherId: z.string(),
  teacherName: z.string(),
  teacherSubjects: z.array(z.string()),
  day: z.string(),
  date: z.string(), // YYYY-MM-DD format
  startTime: z.string(), // HH:MM format
  endTime: z.string(), // HH:MM format
  duration: z.number(), // in minutes
  isBooked: z.boolean().default(false),
  studentId: z.string().optional(),
  studentName: z.string().optional(),
  meetingLink: z.string().url().optional(),
  status: z.enum(['available', 'booked', 'completed', 'cancelled']).default('available'),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

// Meeting Booking Schema
export const meetingBookingSchema = z.object({
  id: z.string(),
  slotId: z.string(),
  availabilityId: z.string(),
  teacherId: z.string(),
  teacherName: z.string(),
  studentId: z.string(),
  studentName: z.string(),
  subject: z.string(),
  date: z.string(), // YYYY-MM-DD format
  startTime: z.string(), // HH:MM format
  endTime: z.string(), // HH:MM format
  duration: z.number(), // in minutes
  meetingLink: z.string().url(),
  status: z.enum(['scheduled', 'in-progress', 'completed', 'cancelled', 'no-show']).default('scheduled'),
  notes: z.string().optional(),
  reminderSent: z.boolean().default(false),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
  completedAt: z.date().optional(),
});

// Meeting Feedback Schema
export const meetingFeedbackSchema = z.object({
  id: z.string(),
  meetingId: z.string(),
  fromUserId: z.string(),
  fromUserType: z.enum(['teacher', 'student']),
  toUserId: z.string(),
  toUserType: z.enum(['teacher', 'student']),
  rating: z.number().min(1).max(5),
  feedback: z.string().optional(),
  isPublic: z.boolean().default(false),
  createdAt: z.date().default(() => new Date()),
});

// Meeting Settings Schema (for teacher preferences)
export const meetingSettingsSchema = z.object({
  id: z.string(),
  teacherId: z.string(),
  defaultSlotDuration: z.number().min(15).max(120).default(30),
  allowInstantBooking: z.boolean().default(true),
  requireApproval: z.boolean().default(false),
  bufferTime: z.number().min(0).max(60).default(0), // minutes between slots
  maxDailyMeetings: z.number().min(1).max(20).default(10),
  autoGenerateLink: z.boolean().default(true),
  customMeetingLinks: z.array(z.string().url()).optional(),
  timezone: z.string().default('UTC'),
  workingDays: z.array(z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'])),
  workingHours: z.object({
    start: z.string(), // HH:MM format
    end: z.string(), // HH:MM format
  }),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

// Type exports
export type TeacherAvailability = z.infer<typeof teacherAvailabilitySchema>;
export type TimeSlot = z.infer<typeof timeSlotSchema>;
export type MeetingBooking = z.infer<typeof meetingBookingSchema>;
export type MeetingFeedback = z.infer<typeof meetingFeedbackSchema>;
export type MeetingSettings = z.infer<typeof meetingSettingsSchema>;

// Utility types for frontend
export type AvailabilityForm = Omit<TeacherAvailability, 'id' | 'teacherId' | 'teacherName' | 'teacherSubjects' | 'createdAt' | 'updatedAt'>;
export type BookingForm = Omit<MeetingBooking, 'id' | 'createdAt' | 'updatedAt' | 'completedAt'>;
export type FeedbackForm = Omit<MeetingFeedback, 'id' | 'createdAt'>;
