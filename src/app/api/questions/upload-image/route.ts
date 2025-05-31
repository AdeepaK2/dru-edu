import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/utils/firebase-server';
import { QuestionImageService } from '@/apiservices/questionImageService';

// POST endpoint to handle question image uploads
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
    
    // Get the image type and option ID (if applicable) from query params
    const searchParams = request.nextUrl.searchParams;
    const imageType = searchParams.get('type'); // 'question', 'explanation', or 'option'
    const optionId = searchParams.get('optionId'); // Only required for option images
    
    if (!imageType || !['question', 'explanation', 'option'].includes(imageType)) {
      return NextResponse.json(
        { error: 'Invalid image type. Must be "question", "explanation", or "option"' }, 
        { status: 400 }
      );
    }
    
    if (imageType === 'option' && !optionId) {
      return NextResponse.json(
        { error: 'Option ID is required for option images' }, 
        { status: 400 }
      );
    }
    
    // Check if the request is a FormData request with a file
    if (!request.headers.get('content-type')?.includes('multipart/form-data')) {
      return NextResponse.json(
        { error: 'Request must be multipart/form-data' }, 
        { status: 400 }
      );
    }
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' }, 
        { status: 400 }
      );
    }
    
    // Check if it's an image
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' }, 
        { status: 400 }
      );
    }
    
    // Upload the image to the appropriate location based on type
    let downloadURL: string;
    
    if (imageType === 'question') {
      downloadURL = await QuestionImageService.uploadQuestionImage(file);
    } else if (imageType === 'explanation') {
      downloadURL = await QuestionImageService.uploadExplanationImage(file);
    } else { // option
      downloadURL = await QuestionImageService.uploadOptionImage(file, optionId!);
    }
    
    return NextResponse.json({ 
      success: true, 
      imageUrl: downloadURL 
    });
  } catch (error) {
    console.error('Error handling image upload:', error);
    return NextResponse.json(
      { error: 'Failed to upload image' }, 
      { status: 500 }
    );
  }
}
