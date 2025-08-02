import { z } from 'zod';
import { Timestamp } from 'firebase/firestore';

// Mail document validation schema
export const mailDocumentSchema = z.object({
  to: z.string().email('Invalid email address'),
  subject: z.string().min(1, 'Subject is required'),
  html: z.string().min(1, 'HTML content is required'),
  createdAt: z.instanceof(Timestamp).optional(),
  processed: z.boolean().optional().default(false),
  processedAt: z.instanceof(Timestamp).optional(),
  error: z.string().optional(),
});

// Mail document interface
export interface MailDocument {
  to: string;
  subject: string;
  html: string;
  createdAt?: Timestamp;
  processed?: boolean;
  processedAt?: Timestamp;
  error?: string;
}

// Mail document in Firestore
export interface MailDocumentFirestore extends MailDocument {
  id: string;
  createdAt: Timestamp;
  processed: boolean;
}

// Type inference from schema
export type MailDocumentData = z.infer<typeof mailDocumentSchema>;

// Mail status enum
export enum MailStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SENT = 'sent',
  FAILED = 'failed'
}

// Meeting email types
export interface MeetingEmailData {
  teacherName: string;
  teacherEmail: string;
  studentName: string;
  parentName: string;
  parentEmail: string;
  date: string;
  startTime: string;
  endTime: string;
  meetingLink: string;
  subject?: string;
}

// Email template types
export enum EmailTemplateType {
  TEACHER_WELCOME = 'teacher_welcome',
  STUDENT_WELCOME = 'student_welcome',
  MEETING_CONFIRMATION_TEACHER = 'meeting_confirmation_teacher',
  MEETING_CONFIRMATION_PARENT = 'meeting_confirmation_parent',
  MEETING_REMINDER = 'meeting_reminder',
  MEETING_CANCELLED = 'meeting_cancelled'
}
