import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/utils/auth-middleware';
import firebaseAdmin from '@/utils/firebase-server';

/**
 * Teacher Earnings API
 * GET /api/teacher/earnings?teacherId=xxx - Get teacher earnings and sales data
 */

async function teacherEarningsHandler(request: AuthenticatedRequest): Promise<NextResponse> {
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
        { error: 'Unauthorized to view this teacher\'s earnings' },
        { status: 403 }
      );
    }

    console.log('📊 Fetching earnings for teacher:', teacherId);

    // Get all video purchases for this teacher's videos
    const purchasesSnapshot = await firebaseAdmin.db
      .collection('videoPurchases')
      .where('teacherId', '==', teacherId)
      .orderBy('purchaseDate', 'desc')
      .get();

    const earnings: any[] = [];
    const videoIds = new Set<string>();
    const studentIds = new Set<string>();
    let totalEarnings = 0;
    let currentMonthEarnings = 0;
    
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    for (const doc of purchasesSnapshot.docs) {
      const purchase = doc.data();
      
      // Calculate teacher earning (80% of sale price)
      const saleAmount = purchase.videoPrice || 0;
      const teacherEarning = saleAmount * 0.8; // 80% to teacher
      const platformFee = saleAmount * 0.2; // 20% platform fee
      
      totalEarnings += teacherEarning;
      
      // Check if this purchase is from current month
      const purchaseDate = purchase.purchaseDate?.toDate() || new Date(purchase.purchaseDate);
      if (purchaseDate.getMonth() === currentMonth && purchaseDate.getFullYear() === currentYear) {
        currentMonthEarnings += teacherEarning;
      }
      
      videoIds.add(purchase.videoId);
      studentIds.add(purchase.studentId);

      earnings.push({
        id: doc.id,
        videoId: purchase.videoId,
        videoTitle: purchase.videoTitle || 'Unknown Video',
        studentName: purchase.studentName || 'Unknown Student',
        studentEmail: purchase.studentEmail || '',
        saleAmount: saleAmount,
        teacherEarning: teacherEarning,
        platformFee: platformFee,
        saleDate: purchaseDate.toISOString(),
        paymentStatus: purchase.paymentStatus || 'pending',
        transactionId: purchase.transactionId || purchase.paymentIntentId || '',
      });
    }

    // Calculate summary stats
    const summary = {
      totalEarnings: totalEarnings,
      totalSales: earnings.length,
      totalVideos: videoIds.size,
      totalStudents: studentIds.size,
      pendingEarnings: earnings
        .filter(e => e.paymentStatus === 'pending')
        .reduce((sum, e) => sum + e.teacherEarning, 0),
      paidEarnings: earnings
        .filter(e => e.paymentStatus === 'completed')
        .reduce((sum, e) => sum + e.teacherEarning, 0),
      currentMonthEarnings: currentMonthEarnings,
      lastMonthEarnings: 0, // Could calculate this if needed
    };

    console.log('✅ Teacher earnings calculated:', {
      teacherId,
      totalEarnings: summary.totalEarnings,
      totalSales: summary.totalSales
    });

    return NextResponse.json({
      earnings,
      summary
    });

  } catch (error: any) {
    console.error('❌ Error fetching teacher earnings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch earnings data', details: error.message },
      { status: 500 }
    );
  }
}

// GET - Get teacher earnings and sales data
export const GET = withAuth(teacherEarningsHandler, ['teacher', 'admin']);
