import { NextRequest, NextResponse } from 'next/server';
import { TestService } from '@/apiservices/testService';

export async function POST(
  request: NextRequest,
  { params }: { params: { testId: string } }
) {
  try {
    const { testId } = params;
    const { studentId, studentName, classId } = await request.json();
    
    if (!studentId || !studentName || !classId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const attemptId = await TestService.startTestAttempt(testId, studentId, studentName, classId);
    const attempt = await TestService.getTestAttempt(attemptId);
    
    return NextResponse.json({ 
      message: 'Test attempt started successfully',
      attempt
    });
  } catch (error) {
    console.error('Error starting test attempt:', error);
    return NextResponse.json(
      { error: 'Failed to start test attempt' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { testId: string } }
) {
  try {
    const { testId } = params;
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    
    if (!studentId) {
      return NextResponse.json(
        { error: 'Student ID is required' },
        { status: 400 }
      );
    }

    const attempt = await TestService.getStudentTestAttempt(testId, studentId);
    
    return NextResponse.json({ attempt });
  } catch (error) {
    console.error('Error fetching test attempt:', error);
    return NextResponse.json(
      { error: 'Failed to fetch test attempt' },
      { status: 500 }
    );
  }
}
