import { NextRequest, NextResponse } from 'next/server';
import { TestService } from '@/apiservices/testService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacherId');
    
    if (!teacherId) {
      return NextResponse.json(
        { error: 'Teacher ID is required' },
        { status: 400 }
      );
    }

    const tests = await TestService.getTeacherTests(teacherId);
    
    return NextResponse.json({ tests });
  } catch (error) {
    console.error('Error fetching teacher tests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tests' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const testData = await request.json();
    
    // Validate required fields
    if (!testData.title || !testData.teacherId || !testData.subjectId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const testId = await TestService.createTest(testData);
    const createdTest = await TestService.getTest(testId);
    
    return NextResponse.json({ 
      message: 'Test created successfully',
      test: createdTest
    });
  } catch (error) {
    console.error('Error creating test:', error);
    return NextResponse.json(
      { error: 'Failed to create test' },
      { status: 500 }
    );
  }
}
