import { z } from 'zod';
import { Timestamp } from 'firebase/firestore';

// Transaction schema for validation
export const transactionSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  studentName: z.string().min(1, 'Student name is required'),
  type: z.enum(['video_purchase', 'class_enrollment', 'refund']),
  itemId: z.string().min(1, 'Item ID is required'), // Video ID or Class ID
  itemName: z.string().min(1, 'Item name is required'), // Video title or Class name
  amount: z.number().min(0, 'Amount must be positive'),
  currency: z.string().default('AUD'),
  paymentMethod: z.enum(['credit_card', 'bank_transfer', 'paypal', 'stripe']),
  status: z.enum(['pending', 'completed', 'failed', 'refunded']),
  description: z.string().optional(),
  notes: z.string().optional(),
  metadata: z.object({
    centerId: z.string().optional(), // For class enrollments
    centerName: z.string().optional(),
    subjectId: z.string().optional(),
    subjectName: z.string().optional(),
    teacherId: z.string().optional(),
    teacherName: z.string().optional(),
    videoDuration: z.number().optional(), // For video purchases
    classSchedule: z.string().optional(), // For class enrollments
  }).optional(),
});

// Transaction update schema (all fields optional except required ones for updates)
export const transactionUpdateSchema = transactionSchema.partial();

// Type for transaction data
export type TransactionData = z.infer<typeof transactionSchema>;
export type TransactionUpdateData = z.infer<typeof transactionUpdateSchema>;

// Transaction document in Firestore
export interface TransactionDocument extends TransactionData {
  id: string; // Firestore document ID
  transactionId: string; // Custom transaction ID (e.g., "TRX-2025-001")
  createdAt: Timestamp;
  updatedAt: Timestamp;
  processedAt?: Timestamp; // When payment was processed
  refundedAt?: Timestamp; // When refund was processed
  paymentGatewayId?: string; // ID from payment processor (Stripe, etc.)
  paymentGatewayResponse?: any; // Response from payment gateway
}

// Frontend display interface
export interface TransactionDisplayData {
  id: string;
  transactionId: string;
  studentId: string;
  studentName: string;
  type: 'video_purchase' | 'class_enrollment' | 'refund';
  itemId: string;
  itemName: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  description?: string;
  notes?: string;
  metadata?: {
    centerId?: string;
    centerName?: string;
    subjectId?: string;
    subjectName?: string;
    teacherId?: string;
    teacherName?: string;
    videoDuration?: number;
    classSchedule?: string;
  };
  createdAt: string;
  updatedAt: string;
  processedAt?: string;
  refundedAt?: string;
}

// Helper function to convert TransactionDocument to TransactionDisplayData
export function transactionDocumentToDisplay(
  doc: TransactionDocument
): TransactionDisplayData {
  return {
    id: doc.id,
    transactionId: doc.transactionId,
    studentId: doc.studentId,
    studentName: doc.studentName,
    type: doc.type,
    itemId: doc.itemId,
    itemName: doc.itemName,
    amount: doc.amount,
    currency: doc.currency,
    paymentMethod: doc.paymentMethod,
    status: doc.status,
    description: doc.description,
    notes: doc.notes,
    metadata: doc.metadata,
    createdAt: doc.createdAt.toDate().toISOString(),
    updatedAt: doc.updatedAt.toDate().toISOString(),
    processedAt: doc.processedAt?.toDate().toISOString(),
    refundedAt: doc.refundedAt?.toDate().toISOString(),
  };
}

// Helper function to get transaction type display name
export function getTransactionTypeDisplayName(type: string): string {
  switch (type) {
    case 'video_purchase':
      return 'Video Purchase';
    case 'class_enrollment':
      return 'Class Enrollment';
    case 'refund':
      return 'Refund';
    default:
      return type;
  }
}

// Helper function to get transaction type color
export function getTransactionTypeColor(type: string): string {
  switch (type) {
    case 'video_purchase':
      return 'text-blue-600 dark:text-blue-400';
    case 'class_enrollment':
      return 'text-green-600 dark:text-green-400';
    case 'refund':
      return 'text-red-600 dark:text-red-400';
    default:
      return 'text-gray-600 dark:text-gray-400';
  }
}

// Helper function to calculate revenue (excludes refunds)
export function calculateRevenue(transactions: TransactionDisplayData[]): number {
  return transactions
    .filter(t => t.status === 'completed' && t.type !== 'refund')
    .reduce((sum, t) => sum + t.amount, 0);
}

// Helper function to calculate total refunds
export function calculateRefunds(transactions: TransactionDisplayData[]): number {
  return transactions
    .filter(t => t.status === 'completed' && t.type === 'refund')
    .reduce((sum, t) => sum + t.amount, 0);
}
