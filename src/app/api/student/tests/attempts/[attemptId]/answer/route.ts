import { NextRequest, NextResponse } from 'next/server';
import { TestService } from '@/apiservices/testService';

export async function POST(
  request: NextRequest,
  { params }: { params: { attemptId: string } }
) {
  try {
    const { attemptId } = params;
    const { answer } = await request.json();
    
    if (!answer || !answer.questionId) {
      return NextResponse.json(
        { error: 'Answer data is required' },
        { status: 400 }
      );
    }

    await TestService.saveAnswer(attemptId, answer);
    
    return NextResponse.json({ 
      message: 'Answer saved successfully'
    });
  } catch (error) {
    console.error('Error saving answer:', error);
    return NextResponse.json(
      { error: 'Failed to save answer' },
      { status: 500 }
    );
  }
}
