import { NextRequest, NextResponse } from 'next/server';
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  where,
  Timestamp 
} from 'firebase/firestore';
import { firestore } from '@/utils/firebase-client';
import { 
  enrollmentRequestSchema, 
  enrollmentRequestUpdateSchema,
  EnrollmentRequestDocument,
  convertEnrollmentRequestDocument 
} from '@/models/enrollmentRequestSchema';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate the enrollment request data
    const validatedData = enrollmentRequestSchema.parse(body);
    
    // Create enrollment request document
    const enrollmentRequestData = {
      ...validatedData,
      status: 'Pending' as const,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    
    // Add to Firestore
    const docRef = await addDoc(collection(firestore, 'enrollmentRequests'), enrollmentRequestData);
    
    // Return the created enrollment request with ID
    const createdRequest = {
      id: docRef.id,
      ...enrollmentRequestData,
    };
    
    return NextResponse.json(createdRequest, { status: 201 });
  } catch (error: any) {
    console.error('Error creating enrollment request:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create enrollment request' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const studentEmail = searchParams.get('studentEmail');
    
    let enrollmentQuery = query(
      collection(firestore, 'enrollmentRequests'),
      orderBy('createdAt', 'desc')
    );
    
    // Filter by status if provided
    if (status && status !== 'all') {
      enrollmentQuery = query(
        collection(firestore, 'enrollmentRequests'),
        where('status', '==', status),
        orderBy('createdAt', 'desc')
      );
    }
    
    // Filter by student email if provided
    if (studentEmail) {
      enrollmentQuery = query(
        collection(firestore, 'enrollmentRequests'),
        where('student.email', '==', studentEmail),
        orderBy('createdAt', 'desc')
      );
    }
    
    const querySnapshot = await getDocs(enrollmentQuery);
    const enrollmentRequests = querySnapshot.docs.map(doc => {
      const data = doc.data() as Omit<EnrollmentRequestDocument, 'id'>;
      return convertEnrollmentRequestDocument({
        id: doc.id,
        ...data,
      });
    });
    
    return NextResponse.json(enrollmentRequests);
  } catch (error) {
    console.error('Error fetching enrollment requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch enrollment requests' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Enrollment request ID is required' },
        { status: 400 }
      );
    }
    
    // Validate update data
    const validatedUpdateData = enrollmentRequestUpdateSchema.parse(updateData);
    
    // Add timestamp for processing
    const updatePayload: any = {
      ...validatedUpdateData,
      updatedAt: Timestamp.now(),
    };
    
    // If status is being changed to approved/rejected, add processed timestamp
    if (validatedUpdateData.status === 'Approved' || validatedUpdateData.status === 'Rejected') {
      updatePayload.processedAt = Timestamp.now();
    }
    
    // Update in Firestore
    const enrollmentRef = doc(firestore, 'enrollmentRequests', id);
    await updateDoc(enrollmentRef, updatePayload);
    
    return NextResponse.json({ 
      message: 'Enrollment request updated successfully',
      id,
      ...updatePayload
    });
  } catch (error: any) {
    console.error('Error updating enrollment request:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update enrollment request' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Enrollment request ID is required' },
        { status: 400 }
      );
    }
    
    // Delete from Firestore
    await deleteDoc(doc(firestore, 'enrollmentRequests', id));
    
    return NextResponse.json({ 
      message: 'Enrollment request deleted successfully',
      id 
    });
  } catch (error) {
    console.error('Error deleting enrollment request:', error);
    return NextResponse.json(
      { error: 'Failed to delete enrollment request' },
      { status: 500 }
    );
  }
}
