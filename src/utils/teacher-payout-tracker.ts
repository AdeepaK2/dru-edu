// Teacher Payout Tracking Utilities
// This helps track teacher earnings and generate payout reports

import { firebaseAdmin } from './firebase-server';

export interface TeacherEarnings {
  teacherId: string;
  teacherName: string;
  totalSales: number;
  totalEarnings: number;
  platformFees: number;
  completedSales: number;
  pendingSales: number;
  lastSaleDate?: Date;
  salesDetails: Array<{
    purchaseId: string;
    videoTitle: string;
    studentName: string;
    amount: number;
    teacherEarning: number;
    platformFee: number;
    purchaseDate: Date;
    payoutStatus: 'pending' | 'paid' | 'held';
  }>;
}

export interface PayoutSummary {
  totalTeachers: number;
  totalEarningsPending: number;
  totalPlatformFees: number;
  teacherEarnings: TeacherEarnings[];
  generatedAt: Date;
}

/**
 * Get earnings summary for a specific teacher
 */
export async function getTeacherEarnings(
  teacherId: string,
  startDate?: Date,
  endDate?: Date
): Promise<TeacherEarnings> {
  try {
    // Get all purchases for the teacher first
    const allPurchases = await firebaseAdmin.firestore.query(
      'videoPurchases',
      'teacherId',
      '==',
      teacherId
    );
    
    // Filter by date range if provided
    let purchases = allPurchases;
    if (startDate && endDate) {
      purchases = allPurchases.filter((purchase: any) => {
        const createdAt = purchase.createdAt?.toDate ? purchase.createdAt.toDate() : new Date(purchase.createdAt);
        return createdAt >= startDate && createdAt <= endDate;
      });
    }

    // Filter only completed purchases for earnings calculation
    const completedPurchases = purchases.filter(
      (purchase: any) => purchase.paymentStatus === 'completed'
    );

    const pendingPurchases = purchases.filter(
      (purchase: any) => purchase.paymentStatus === 'pending'
    );

    // Calculate totals
    const totalSales = completedPurchases.reduce(
      (sum: number, purchase: any) => sum + (purchase.amount || 0), 
      0
    );

    const totalEarnings = completedPurchases.reduce(
      (sum: number, purchase: any) => sum + (purchase.metadata?.teacherEarning || purchase.amount * 0.8), 
      0
    );

    const platformFees = completedPurchases.reduce(
      (sum: number, purchase: any) => sum + (purchase.metadata?.platformFee || purchase.amount * 0.2), 
      0
    );

    // Get teacher name (from first purchase or lookup)
    const teacherName = completedPurchases.length > 0 
      ? completedPurchases[0].teacherName 
      : 'Unknown Teacher';

    // Find last sale date
    const lastSaleDate = completedPurchases.length > 0
      ? new Date(Math.max(...completedPurchases.map((p: any) => new Date(p.createdAt).getTime())))
      : undefined;

    // Prepare sales details
    const salesDetails = completedPurchases.map((purchase: any) => ({
      purchaseId: purchase.id,
      videoTitle: purchase.videoTitle || 'Unknown Video',
      studentName: purchase.studentName || 'Unknown Student',
      amount: purchase.amount || 0,
      teacherEarning: purchase.metadata?.teacherEarning || purchase.amount * 0.8,
      platformFee: purchase.metadata?.platformFee || purchase.amount * 0.2,
      purchaseDate: new Date(purchase.createdAt),
      payoutStatus: purchase.metadata?.payoutStatus || 'pending'
    }));

    return {
      teacherId,
      teacherName,
      totalSales,
      totalEarnings,
      platformFees,
      completedSales: completedPurchases.length,
      pendingSales: pendingPurchases.length,
      lastSaleDate,
      salesDetails
    };

  } catch (error) {
    console.error('Error calculating teacher earnings:', error);
    throw new Error(`Failed to calculate earnings for teacher ${teacherId}`);
  }
}

/**
 * Get earnings summary for all teachers
 */
export async function getAllTeacherEarnings(
  startDate?: Date,
  endDate?: Date
): Promise<PayoutSummary> {
  try {
    // Get all completed purchases first
    const allPurchases = await firebaseAdmin.firestore.query(
      'videoPurchases',
      'paymentStatus',
      '==',
      'completed'
    );
    
    // Filter by date range if provided
    let purchases = allPurchases;
    if (startDate && endDate) {
      purchases = allPurchases.filter((purchase: any) => {
        const createdAt = purchase.createdAt?.toDate ? purchase.createdAt.toDate() : new Date(purchase.createdAt);
        return createdAt >= startDate && createdAt <= endDate;
      });
    }

    // Group by teacher
    const teacherGroups: Record<string, any[]> = {};
    purchases.forEach((purchase: any) => {
      const teacherId = purchase.teacherId;
      if (teacherId) {
        if (!teacherGroups[teacherId]) {
          teacherGroups[teacherId] = [];
        }
        teacherGroups[teacherId].push(purchase);
      }
    });

    // Calculate earnings for each teacher
    const teacherEarningsPromises = Object.keys(teacherGroups).map(
      teacherId => getTeacherEarnings(teacherId, startDate, endDate)
    );

    const teacherEarnings = await Promise.all(teacherEarningsPromises);

    // Calculate totals
    const totalEarningsPending = teacherEarnings.reduce(
      (sum, teacher) => sum + teacher.totalEarnings, 0
    );

    const totalPlatformFees = teacherEarnings.reduce(
      (sum, teacher) => sum + teacher.platformFees, 0
    );

    return {
      totalTeachers: teacherEarnings.length,
      totalEarningsPending,
      totalPlatformFees,
      teacherEarnings: teacherEarnings.sort((a, b) => b.totalEarnings - a.totalEarnings),
      generatedAt: new Date()
    };

  } catch (error) {
    console.error('Error generating payout summary:', error);
    throw new Error('Failed to generate payout summary');
  }
}

/**
 * Mark teacher earnings as paid (update payout status)
 */
export async function markTeacherEarningsPaid(
  teacherId: string,
  purchaseIds: string[],
  payoutReference?: string
): Promise<void> {
  try {
    // Update all specified purchases to mark as paid
    const updatePromises = purchaseIds.map(purchaseId =>
      firebaseAdmin.firestore.updateDoc('videoPurchases', purchaseId, {
        'metadata.payoutStatus': 'paid',
        'metadata.payoutDate': new Date(),
        'metadata.payoutReference': payoutReference || `PAYOUT-${Date.now()}`,
        updatedAt: new Date()
      })
    );

    await Promise.all(updatePromises);
    console.log(`✅ Marked ${purchaseIds.length} purchases as paid for teacher ${teacherId}`);

  } catch (error) {
    console.error('Error marking earnings as paid:', error);
    throw new Error('Failed to update payout status');
  }
}

/**
 * Generate a CSV export of teacher earnings for accounting
 */
export function generatePayoutCSV(payoutSummary: PayoutSummary): string {
  const headers = [
    'Teacher ID',
    'Teacher Name', 
    'Total Sales Count',
    'Total Sales Amount',
    'Teacher Earnings',
    'Platform Fees',
    'Pending Sales',
    'Last Sale Date',
    'Payout Status'
  ];

  const rows = payoutSummary.teacherEarnings.map(teacher => [
    teacher.teacherId,
    teacher.teacherName,
    teacher.completedSales.toString(),
    teacher.totalSales.toFixed(2),
    teacher.totalEarnings.toFixed(2),
    teacher.platformFees.toFixed(2),
    teacher.pendingSales.toString(),
    teacher.lastSaleDate?.toISOString().split('T')[0] || 'No sales',
    'Pending' // You can update this based on actual payout status
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  return csvContent;
}

/**
 * Simple function to check if teacher has pending earnings
 */
export async function hasTeacherPendingEarnings(teacherId: string): Promise<boolean> {
  try {
    const earnings = await getTeacherEarnings(teacherId);
    return earnings.totalEarnings > 0;
  } catch (error) {
    console.error('Error checking pending earnings:', error);
    return false;
  }
}
