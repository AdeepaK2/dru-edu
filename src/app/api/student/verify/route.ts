import { NextRequest, NextResponse } from 'next/server';
import firebaseAdmin from '@/utils/firebase-server';

// POST - Verify student token and return student data
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const idToken = authHeader.split('Bearer ')[1];

    // Verify the token
    const decodedToken = await firebaseAdmin.authentication.verifyToken(idToken);
    
    // Check if user has student role
    if (!decodedToken.student && decodedToken.role !== 'student') {
      return NextResponse.json(
        { error: 'Unauthorized: Not a student account' },
        { status: 403 }
      );
    }

    // Get student document from Firestore
    const studentDoc = await firebaseAdmin.firestore.getDoc('students', decodedToken.uid);
    
    if (!studentDoc) {
      return NextResponse.json(
        { error: 'Student record not found' },
        { status: 404 }
      );
    }

    // Check if student is active
    if (studentDoc.status !== 'Active') {
      return NextResponse.json(
        { error: 'Account is not active. Please contact administration.' },
        { status: 403 }
      );
    }

    // Return student data
    return NextResponse.json({
      student: {
        id: decodedToken.uid,
        name: studentDoc.name,
        email: studentDoc.email,
        avatar: studentDoc.avatar,
        status: studentDoc.status,
        coursesEnrolled: studentDoc.coursesEnrolled,
        enrollmentDate: studentDoc.enrollmentDate
      }
    });

  } catch (error: any) {
    console.error('Student verification error:', error);
    
    if (error.code === 'auth/id-token-expired') {
      return NextResponse.json(
        { error: 'Token expired' },
        { status: 401 }
      );
    } else if (error.code === 'auth/id-token-revoked') {
      return NextResponse.json(
        { error: 'Token revoked' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Token verification failed' },
      { status: 401 }
    );
  }
}
