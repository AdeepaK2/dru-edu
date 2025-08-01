import { z } from 'zod';
import { Timestamp } from 'firebase/firestore';

// Video purchase schema for validation
export const videoPurchaseSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  studentName: z.string().min(1, 'Student name is required'),
  videoId: z.string().min(1, 'Video ID is required'),
  videoTitle: z.string().min(1, 'Video title is required'),
  teacherId: z.string().min(1, 'Teacher ID is required'),
  teacherName: z.string().min(1, 'Teacher name is required'),
  subjectId: z.string().min(1, 'Subject ID is required'),
  subjectName: z.string().min(1, 'Subject name is required'),
  amount: z.number().min(0, 'Amount must be positive'),
  currency: z.string().default('USD'),
  paymentStatus: z.enum(['pending', 'completed', 'failed', 'refunded']),
  paymentMethod: z.enum(['stripe', 'paypal', 'credit_card', 'bank_transfer']),
  transactionId: z.string().optional(), // Reference to transaction document
  stripePaymentIntentId: z.string().optional(), // Stripe payment intent ID
  purchaseType: z.enum(['individual', 'bundle']).default('individual'),
  accessExpiryDate: z.union([z.date(), z.instanceof(Timestamp)]).optional(), // For time-limited access
  downloadAllowed: z.boolean().default(false),
  metadata: z.object({
    videoDuration: z.number().optional(),
    videoDescription: z.string().optional(),
    originalPrice: z.number().optional(), // In case of discounts
    discountApplied: z.number().optional(),
    promoCode: z.string().optional(),
    // Teacher payout tracking fields
    teacherEarning: z.number().optional(), // Amount that goes to teacher (e.g., 80%)
    platformFee: z.number().optional(), // Platform fee (e.g., 20%)
    payoutStatus: z.enum(['pending', 'paid', 'held']).optional(), // Track payout status
    payoutDate: z.union([z.date(), z.instanceof(Timestamp)]).optional(), // When payout was made
    payoutReference: z.string().optional(), // Reference for payout transaction
  }).optional(),
});

// Video purchase update schema (all fields optional except required ones for updates)
export const videoPurchaseUpdateSchema = videoPurchaseSchema.partial();

// Type for video purchase data
export type VideoPurchaseData = z.infer<typeof videoPurchaseSchema>;
export type VideoPurchaseUpdateData = z.infer<typeof videoPurchaseUpdateSchema>;

// Video purchase document in Firestore
export interface VideoPurchaseDocument extends Omit<VideoPurchaseData, 'accessExpiryDate'> {
  id: string; // Firestore document ID
  purchaseId: string; // Custom purchase ID (e.g., "VPU-2025-001")
  createdAt: Timestamp;
  updatedAt: Timestamp;
  purchasedAt?: Timestamp; // When purchase was completed
  accessedAt?: Timestamp; // Last time video was accessed
  accessExpiryDate?: Timestamp; // For time-limited access (stored as Timestamp in Firestore)
  viewCount: number; // How many times video was viewed by this student
  lastViewedAt?: Timestamp; // Last view timestamp
}

// Frontend display interface
export interface VideoPurchaseDisplayData {
  id: string;
  purchaseId: string;
  videoId: string;
  videoTitle: string;
  teacherName: string;
  subjectName: string;
  amount: number;
  currency: string;
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  purchaseDate: string;
  accessExpiryDate?: string;
  downloadAllowed: boolean;
  viewCount: number;
  lastViewedAt?: string;
  canAccess: boolean; // Computed field based on payment status and expiry
}

// Helper function to convert VideoPurchaseDocument to VideoPurchaseDisplayData
export function videoPurchaseDocumentToDisplay(
  doc: VideoPurchaseDocument
): VideoPurchaseDisplayData {
  const now = new Date();
  let canAccess = doc.paymentStatus === 'completed';
  
  // Check if access has expired
  if (canAccess && doc.accessExpiryDate) {
    canAccess = doc.accessExpiryDate.toDate() > now;
  }
  
  return {
    id: doc.id,
    purchaseId: doc.purchaseId,
    videoId: doc.videoId,
    videoTitle: doc.videoTitle,
    teacherName: doc.teacherName,
    subjectName: doc.subjectName,
    amount: doc.amount,
    currency: doc.currency,
    paymentStatus: doc.paymentStatus,
    purchaseDate: doc.createdAt.toDate().toLocaleDateString(),
    accessExpiryDate: doc.accessExpiryDate?.toDate().toLocaleDateString(),
    downloadAllowed: doc.downloadAllowed,
    viewCount: doc.viewCount,
    lastViewedAt: doc.lastViewedAt?.toDate().toLocaleString(),
    canAccess
  };
}

// Helper function to check if student has purchased a video
export function hasValidAccess(purchase: VideoPurchaseDocument): boolean {
  if (purchase.paymentStatus !== 'completed') {
    return false;
  }
  
  if (purchase.accessExpiryDate) {
    return purchase.accessExpiryDate.toDate() > new Date();
  }
  
  return true;
}
