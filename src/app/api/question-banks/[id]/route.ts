import { NextRequest, NextResponse } from 'next/server';
import { questionBankService } from '@/apiservices/questionBankFirestoreService';
import { auth } from '@/utils/firebase-server';

// GET endpoint to retrieve a specific question bank
export async function GET(
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
    
    // Get question bank by ID
    const bank = await questionBankService.getQuestionBank(id);
    
    if (!bank) {
      return NextResponse.json({ error: 'Question bank not found' }, { status: 404 });
    }
    
    return NextResponse.json({ bank });
  } catch (error) {
    console.error('Error handling GET request:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve question bank' }, 
      { status: 500 }
    );
  }
}

// PUT endpoint to update a question bank
export async function PUT(
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
    
    // Parse request body
    const updates = await request.json();
    
    // Update question bank
    await questionBankService.updateQuestionBank(id, updates);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error handling PUT request:', error);
    return NextResponse.json(
      { error: 'Failed to update question bank' }, 
      { status: 500 }
    );
  }
}

// DELETE endpoint to delete a question bank
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
    
    // Delete question bank
    await questionBankService.deleteQuestionBank(id);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error handling DELETE request:', error);
    // Handle specific errors, like if the bank is assigned to classes
    if (error instanceof Error && error.message.includes('assigned to')) {
      return NextResponse.json(
        { error: error.message }, 
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to delete question bank' }, 
      { status: 500 }
    );
  }
}
