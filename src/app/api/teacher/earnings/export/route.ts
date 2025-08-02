import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/utils/auth-middleware';
import firebaseAdmin from '@/utils/firebase-server';

/**
 * Teacher Earnings Export API
 * GET /api/teacher/earnings/export?teacherId=xxx - Export teacher earnings as CSV
 */

async function teacherEarningsExportHandler(request: AuthenticatedRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacherId');

    if (!teacherId) {
      return NextResponse.json(
        { error: 'Teacher ID is required' },
        { status: 400 }
      );
    }

    // Verify the requesting user is the teacher or an admin
    if (request.user.role !== 'admin' && request.user.uid !== teacherId) {
      return NextResponse.json(
        { error: 'Unauthorized to export this teacher\'s earnings' },
        { status: 403 }
      );
    }

    console.log('📊 Exporting earnings for teacher:', teacherId);

    // Get all video purchases for this teacher's videos
    const purchasesSnapshot = await firebaseAdmin.db
      .collection('videoPurchases')
      .where('teacherId', '==', teacherId)
      .orderBy('purchaseDate', 'desc')
      .get();

    // Prepare CSV data
    const csvHeaders = [
      'Sale Date',
      'Video Title',
      'Video ID',
      'Student Name', 
      'Student Email',
      'Sale Amount (AUD)',
      'Teacher Earning (AUD)',
      'Platform Fee (AUD)',
      'Payment Status',
      'Transaction ID'
    ];

    const csvRows = [csvHeaders.join(',')];

    for (const doc of purchasesSnapshot.docs) {
      const purchase = doc.data();
      
      // Calculate earnings
      const saleAmount = purchase.videoPrice || 0;
      const teacherEarning = saleAmount * 0.8; // 80% to teacher
      const platformFee = saleAmount * 0.2; // 20% platform fee
      
      const purchaseDate = purchase.purchaseDate?.toDate() || new Date(purchase.purchaseDate);
      
      const row = [
        purchaseDate.toLocaleDateString('en-AU'),
        `"${(purchase.videoTitle || 'Unknown Video').replace(/"/g, '""')}"`,
        purchase.videoId || '',
        `"${(purchase.studentName || 'Unknown Student').replace(/"/g, '""')}"`,
        purchase.studentEmail || '',
        saleAmount.toFixed(2),
        teacherEarning.toFixed(2),
        platformFee.toFixed(2),
        purchase.paymentStatus || 'pending',
        purchase.transactionId || purchase.paymentIntentId || ''
      ];
      
      csvRows.push(row.join(','));
    }

    const csvContent = csvRows.join('\n');

    console.log('✅ Teacher earnings CSV generated:', {
      teacherId,
      recordCount: csvRows.length - 1
    });

    return NextResponse.json({
      csv: csvContent,
      recordCount: csvRows.length - 1
    });

  } catch (error: any) {
    console.error('❌ Error exporting teacher earnings:', error);
    return NextResponse.json(
      { error: 'Failed to export earnings data', details: error.message },
      { status: 500 }
    );
  }
}

// GET - Export teacher earnings as CSV
export const GET = withAuth(teacherEarningsExportHandler, ['teacher', 'admin']);
