import { NextRequest, NextResponse } from 'next/server';
import { questionService } from '@/apiservices/questionBankFirestoreService';
import { auth } from '@/utils/firebase-server';
import { QuestionImageService } from '@/apiservices/questionImageService';

// GET endpoint to retrieve a specific question
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
    
    // Get question by ID
    const question = await questionService.getQuestion(id);
    
    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }
    
    return NextResponse.json({ question });
  } catch (error) {
    console.error('Error handling GET request:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve question' }, 
      { status: 500 }
    );
  }
}

// PUT endpoint to update a question
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
    
    // Update question
    await questionService.updateQuestion(id, updates);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error handling PUT request:', error);
    return NextResponse.json(
      { error: 'Failed to update question' }, 
      { status: 500 }
    );
  }
}

// DELETE endpoint to delete a question
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
    
    // Get the question first to access its image URLs for deletion
    const question = await questionService.getQuestion(id);
    
    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }
    
    // Delete any images associated with the question
    const deleteImagePromises = [];
    
    // Delete main question image if exists
    if (question.imageUrl) {
      deleteImagePromises.push(QuestionImageService.deleteImage(question.imageUrl));
    }
    
    // Handle MCQ-specific images
    if (question.type === 'mcq') {
      // Delete explanation image if exists
      if (question.explanationImageUrl) {
        deleteImagePromises.push(QuestionImageService.deleteImage(question.explanationImageUrl));
      }
      
      // Delete option images if they exist
      question.options.forEach(option => {
        if (option.imageUrl) {
          deleteImagePromises.push(QuestionImageService.deleteImage(option.imageUrl));
        }
      });
    }
    
    // Handle essay-specific images
    if (question.type === 'essay' && question.suggestedAnswerImageUrl) {
      deleteImagePromises.push(QuestionImageService.deleteImage(question.suggestedAnswerImageUrl));
    }
    
    // Wait for all image deletions to complete
    await Promise.all(deleteImagePromises);
    
    // Delete the question
    await questionService.deleteQuestion(id);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error handling DELETE request:', error);
    return NextResponse.json(
      { error: 'Failed to delete question' }, 
      { status: 500 }
    );
  }
}
