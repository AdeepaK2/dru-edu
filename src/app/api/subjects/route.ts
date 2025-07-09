import { NextRequest, NextResponse } from 'next/server';
import { subjectSchema, subjectUpdateSchema, SubjectDocument } from '@/models/subjectSchema';
import firebaseAdmin from '@/utils/firebase-server';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { cacheUtils } from '@/utils/cache';

// Generate auto-incrementing subject ID (SUB-YYYY-XXX format)
async function generateSubjectId(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const yearPrefix = `SUB-${currentYear}-`;
  
  // Get all subjects with the current year prefix
  const snapshot = await firebaseAdmin.db
    .collection('subjects')
    .where('subjectId', '>=', yearPrefix)
    .where('subjectId', '<', `SUB-${currentYear + 1}-`)
    .orderBy('subjectId', 'desc')
    .limit(1)
    .get();

  let nextNumber = 1;
  if (!snapshot.empty) {
    const lastSubject = snapshot.docs[0].data();
    const lastId = lastSubject.subjectId as string;
    const lastNumber = parseInt(lastId.split('-')[2]);
    nextNumber = lastNumber + 1;
  }

  return `${yearPrefix}${nextNumber.toString().padStart(3, '0')}`;
}

// POST - Create a new subject
export async function POST(req: NextRequest) {
  try {
    // Parse and validate the request body
    const body = await req.json();
    console.log('Received subject data:', body);
    
    // Preprocess data to handle empty strings for optional fields
    const processedBody = {
      ...body,
      description: body.description?.trim() || '',
    };

    // Validate the data
    const validationResult = subjectSchema.safeParse(processedBody);
    if (!validationResult.success) {
      console.error('Validation failed:', validationResult.error);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Validation failed',
          details: validationResult.error.flatten()
        }, 
        { status: 400 }
      );
    }

    const subjectData = validationResult.data;
    
    // Generate auto-incrementing subject ID
    const subjectId = await generateSubjectId();
    
    // Prepare the document to be saved
    const now = Timestamp.now();
    const subjectDocument = {
      name: subjectData.name,
      grade: subjectData.grade,
      description: subjectData.description || '',
      isActive: subjectData.isActive,
      subjectId,
      createdAt: now,
      updatedAt: now,
    };
    
    console.log('Creating subject document:', subjectDocument);
    
    // Save to Firestore
    const docRef = await firebaseAdmin.db.collection('subjects').add(subjectDocument);
    console.log('Subject created successfully with ID:', docRef.id);

    // Clear cache to ensure fresh data
    cacheUtils.invalidate('subjects');

    return NextResponse.json({
      success: true,
      id: docRef.id,
      subjectId: subjectId,
      message: 'Subject created successfully'
    });

  } catch (error) {
    console.error('Error creating subject:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      }, 
      { status: 500 }
    );
  }
}

// GET - Retrieve all subjects
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const grade = searchParams.get('grade');
    const isActive = searchParams.get('isActive');

    console.log('Fetching subjects with filters:', { grade, isActive });

    let query = firebaseAdmin.db.collection('subjects').orderBy('createdAt', 'desc');

    // Apply filters
    if (grade) {
      query = query.where('grade', '==', grade);
    }
    
    if (isActive !== null) {
      query = query.where('isActive', '==', isActive === 'true');
    }
    
    const snapshot = await query.get();
    const subjects: SubjectDocument[] = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    } as SubjectDocument));

    console.log(`Retrieved ${subjects.length} subjects`);

    return NextResponse.json({
      success: true,
      data: subjects
    });

  } catch (error) {
    console.error('Error fetching subjects:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      }, 
      { status: 500 }
    );
  }
}

// PUT - Update a subject
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Subject ID is required' },
        { status: 400 }
      );
    }

    console.log('Updating subject:', id, updateData);

    // Preprocess data to handle empty strings for optional fields
    const processedUpdateData = {
      ...updateData,
      description: updateData.description?.trim() || '',
    };

    // Validate the update data
    const validationResult = subjectUpdateSchema.safeParse(processedUpdateData);
    if (!validationResult.success) {
      console.error('Validation failed:', validationResult.error);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Validation failed',
          details: validationResult.error.flatten()
        }, 
        { status: 400 }
      );
    }
    
    const validatedData = validationResult.data;

    // Check if subject exists
    const subjectRef = firebaseAdmin.db.collection('subjects').doc(id);
    const subjectDoc = await subjectRef.get();

    if (!subjectDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'Subject not found' },
        { status: 404 }
      );
    }
    
    // Update the document
    const now = Timestamp.now();
    await subjectRef.update({
      ...validatedData,
      updatedAt: now,
    });
    
    console.log('Subject updated successfully:', id);

    // Clear cache to ensure fresh data
    cacheUtils.invalidate('subjects');

    return NextResponse.json({
      success: true,
      message: 'Subject updated successfully'
    });

  } catch (error) {
    console.error('Error updating subject:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      }, 
      { status: 500 }
    );
  }
}

// DELETE - Delete a subject
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Subject ID is required' },
        { status: 400 }
      );
    }
    
    console.log('Deleting subject:', id);

    // Check if subject exists
    const subjectRef = firebaseAdmin.db.collection('subjects').doc(id);
    const subjectDoc = await subjectRef.get();

    if (!subjectDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'Subject not found' },
        { status: 404 }
      );
    }

    // TODO: Check if subject is referenced by classes, videos, or questions
    // For now, we'll allow deletion but in the future we should add these checks:
    // - Check classes collection for references
    // - Check videos collection for references
    // - Check questions collection for references

    // Delete the document
    await subjectRef.delete();
    
    console.log('Subject deleted successfully:', id);

    // Clear cache to ensure fresh data
    cacheUtils.invalidate('subjects');

    return NextResponse.json({
      success: true,
      message: 'Subject deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting subject:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      }, 
      { status: 500 }
    );
  }
}