import { NextRequest, NextResponse } from 'next/server';
import { questionBankService } from '@/apiservices/questionBankFirestoreService';
import { auth } from '@/utils/firebase-server';

// GET endpoint to list question banks with optional filters
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
    const subjectId = searchParams.get('subjectId') || undefined;
    const grade = searchParams.get('grade') || undefined;
    
    // Get question banks with filters
    const banks = await questionBankService.listQuestionBanks({
      subjectId,
      grade
    });
    
    return NextResponse.json({ banks });
  } catch (error) {
    console.error('Error handling GET request:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve question banks' }, 
      { status: 500 }
    );
  }
}

// POST endpoint to create a new question bank
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
    const data = await request.json();
    
    // Create new question bank
    const bankId = await questionBankService.createQuestionBank(data);
    
    return NextResponse.json({ 
      success: true, 
      bankId 
    }, { status: 201 });
  } catch (error) {
    console.error('Error handling POST request:', error);
    return NextResponse.json(
      { error: 'Failed to create question bank' }, 
      { status: 500 }
    );
  }
}
