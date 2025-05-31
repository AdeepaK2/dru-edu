import { NextRequest, NextResponse } from 'next/server';
import { questionService } from '@/apiservices/questionBankFirestoreService';
import { auth } from '@/utils/firebase-server';

// GET endpoint to list questions with optional filters
export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.split('Bearer ')[1];
    
    try {
      await auth.verifyIdToken(token);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    // Extract query parameters
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') as 'mcq' | 'essay' | undefined;
    const subjectId = searchParams.get('subjectId') || undefined;
    const difficulty = searchParams.get('difficulty') as 'easy' | 'medium' | 'hard' | undefined;
    const topic = searchParams.get('topic') || undefined;
    
    // Get questions with filters
    const questions = await questionService.listQuestions({
      type,
      subjectId,
      difficulty,
      topic
    });
    
    return NextResponse.json({ questions });
  } catch (error) {
    console.error('Error handling GET request:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve questions' }, 
      { status: 500 }
    );
  }
}

// POST endpoint to create a new question
export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.split('Bearer ')[1];
    
    try {
      await auth.verifyIdToken(token);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    // Parse request body
    const questionData = await request.json();
    
    // Create new question
    const questionId = await questionService.createQuestion(questionData);
    
    return NextResponse.json({ 
      success: true, 
      questionId 
    }, { status: 201 });
  } catch (error) {
    console.error('Error handling POST request:', error);
    return NextResponse.json(
      { error: 'Failed to create question' }, 
      { status: 500 }
    );
  }
}
