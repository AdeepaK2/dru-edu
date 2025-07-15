import { NextRequest, NextResponse } from 'next/server';
import { TestService } from '@/apiservices/testService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const classIds = searchParams.get('classIds')?.split(',') || [];
    
    if (!studentId) {
      return NextResponse.json(
        { error: 'Student ID is required' },
        { status: 400 }
      );
    }

    const tests = await TestService.getStudentTests(studentId, classIds);
    
    return NextResponse.json({ tests });
  } catch (error) {
    console.error('Error fetching student tests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tests' },
      { status: 500 }
    );
  }
}
