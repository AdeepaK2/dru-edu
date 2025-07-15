import { NextRequest, NextResponse } from 'next/server';
import { TestService } from '@/apiservices/testService';

export async function POST(
  request: NextRequest,
  { params }: { params: { attemptId: string } }
) {
  try {
    const { attemptId } = params;
    const { autoSubmitted = false } = await request.json();
    
    await TestService.submitTest(attemptId, autoSubmitted);
    
    return NextResponse.json({ 
      message: 'Test submitted successfully'
    });
  } catch (error) {
    console.error('Error submitting test:', error);
    return NextResponse.json(
      { error: 'Failed to submit test' },
      { status: 500 }
    );
  }
}
