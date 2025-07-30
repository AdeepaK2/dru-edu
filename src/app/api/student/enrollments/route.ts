import { NextRequest, NextResponse } from 'next/server';
import { getEnrollmentsByStudent } from '@/services/studentEnrollmentService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json(
        { error: 'Student ID is required' },
        { status: 400 }
      );
    }

    const enrollments = await getEnrollmentsByStudent(studentId);
    
    return NextResponse.json({
      success: true,
      data: enrollments
    });
  } catch (error) {
    console.error('Error fetching student enrollments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch enrollments' },
      { status: 500 }
    );
  }
}
