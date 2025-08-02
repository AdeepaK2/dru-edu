import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/utils/auth-middleware';
import { 
  getAllTeacherEarnings, 
  getTeacherEarnings, 
  generatePayoutCSV, 
  markTeacherEarningsPaid 
} from '@/utils/teacher-payout-tracker';

/**
 * Teacher Payout Reports API
 * GET /api/admin/teacher-payouts - Get all teacher earnings
 * GET /api/admin/teacher-payouts?teacherId=xxx - Get specific teacher earnings
 * POST /api/admin/teacher-payouts - Mark earnings as paid
 */

async function teacherPayoutHandler(request: AuthenticatedRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacherId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const format = searchParams.get('format'); // 'csv' or 'json'

    // Only admins can access payout reports
    if (request.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    if (request.method === 'GET') {
      // Parse date filters if provided
      const startDateObj = startDate ? new Date(startDate) : undefined;
      const endDateObj = endDate ? new Date(endDate) : undefined;

      if (teacherId) {
        // Get specific teacher earnings
        console.log('📊 Generating earnings report for teacher:', teacherId);
        const earnings = await getTeacherEarnings(teacherId, startDateObj, endDateObj);
        
        return NextResponse.json({
          success: true,
          teacher: earnings,
          dateRange: {
            startDate: startDateObj?.toISOString(),
            endDate: endDateObj?.toISOString()
          }
        });
      } else {
        // Get all teacher earnings
        console.log('📊 Generating comprehensive payout report...');
        const payoutSummary = await getAllTeacherEarnings(startDateObj, endDateObj);
        
        if (format === 'csv') {
          // Return CSV download
          const csvContent = generatePayoutCSV(payoutSummary);
          
          return new NextResponse(csvContent, {
            status: 200,
            headers: {
              'Content-Type': 'text/csv',
              'Content-Disposition': `attachment; filename="teacher-payouts-${new Date().toISOString().split('T')[0]}.csv"`
            }
          });
        } else {
          // Return JSON
          return NextResponse.json({
            success: true,
            summary: payoutSummary,
            dateRange: {
              startDate: startDateObj?.toISOString(),
              endDate: endDateObj?.toISOString()
            }
          });
        }
      }
    } else if (request.method === 'POST') {
      // Mark earnings as paid
      const body = await request.json();
      const { teacherId, purchaseIds, payoutReference } = body;

      if (!teacherId || !purchaseIds || !Array.isArray(purchaseIds)) {
        return NextResponse.json(
          { error: 'teacherId and purchaseIds array are required' },
          { status: 400 }
        );
      }

      console.log('💰 Marking earnings as paid for teacher:', teacherId);
      await markTeacherEarningsPaid(teacherId, purchaseIds, payoutReference);

      return NextResponse.json({
        success: true,
        message: `Marked ${purchaseIds.length} purchases as paid for teacher ${teacherId}`,
        payoutReference
      });
    }

    return NextResponse.json(
      { error: 'Method not allowed' },
      { status: 405 }
    );

  } catch (error) {
    console.error('Teacher payout report error:', error);
    return NextResponse.json(
      { error: 'Failed to generate payout report' },
      { status: 500 }
    );
  }
}

// Export the authenticated handler with admin role restriction
export const GET = withAuth(teacherPayoutHandler, ['admin']);
export const POST = withAuth(teacherPayoutHandler, ['admin']);
