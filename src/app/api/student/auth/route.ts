import { NextRequest, NextResponse } from 'next/server';
import firebaseAdmin from '@/utils/firebase-server';
import { StudentDocument } from '@/models/studentSchema';

export async function POST(req: NextRequest) {
  try {
    const { idToken } = await req.json();

    if (!idToken) {
      return NextResponse.json(
        { error: 'ID token is required' },
        { status: 400 }
      );
    }

    // Verify the ID token
    const decodedToken = await firebaseAdmin.authentication.verifyToken(idToken);
    
    // Check if user has student role/claims
    if (!decodedToken.student && decodedToken.role !== 'student') {
      return NextResponse.json(
        { error: 'Access denied. User is not a student.' },
        { status: 403 }
      );
    }

    // Get student data from Firestore using the query helper
    const students = await firebaseAdmin.firestore.query<StudentDocument>(
      'students',
      'uid',
      '==',
      decodedToken.uid
    );

    if (students.length === 0) {
      return NextResponse.json(
        { error: 'Student record not found' },
        { status: 404 }
      );
    }

    const studentData = students[0];

    // Return student data
    return NextResponse.json({
      success: true,
      student: {
        ...studentData,
        uid: decodedToken.uid
      }
    });

  } catch (error: any) {
    console.error('Student auth error:', error);

    if (error.code === 'auth/id-token-expired') {
      return NextResponse.json(
        { error: 'Token expired. Please log in again.' },
        { status: 401 }
      );
    }

    if (error.code === 'auth/argument-error') {
      return NextResponse.json(
        { error: 'Invalid token format' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}
