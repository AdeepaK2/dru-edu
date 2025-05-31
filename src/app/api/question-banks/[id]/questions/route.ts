import { NextRequest, NextResponse } from 'next/server';
import { questionBankService } from '@/apiservices/questionBankFirestoreService';
import { auth } from '@/utils/firebase-server';

// POST endpoint to add questions to a bank
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    
    const { id } = params;
    
    // Parse request body to get question IDs to add
    const { questionIds } = await request.json();
    
    if (!Array.isArray(questionIds) || questionIds.length === 0) {
      return NextResponse.json(
        { error: 'Invalid or empty questionIds array' }, 
        { status: 400 }
      );
    }
    
    // Add questions to bank
    await questionBankService.addQuestionsToBank(id, questionIds);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error handling POST request:', error);
    return NextResponse.json(
      { error: 'Failed to add questions to bank' }, 
      { status: 500 }
    );
  }
}

// DELETE endpoint to remove questions from a bank
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    
    const { id } = params;
    
    // Parse request body to get question IDs to remove
    const { questionIds } = await request.json();
    
    if (!Array.isArray(questionIds) || questionIds.length === 0) {
      return NextResponse.json(
        { error: 'Invalid or empty questionIds array' }, 
        { status: 400 }
      );
    }
    
    // Remove questions from bank
    await questionBankService.removeQuestionsFromBank(id, questionIds);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error handling DELETE request:', error);
    return NextResponse.json(
      { error: 'Failed to remove questions from bank' }, 
      { status: 500 }
    );
  }
}
