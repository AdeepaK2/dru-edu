import { NextRequest, NextResponse } from 'next/server';
import { firebaseAdmin } from '@/utils/firebase-server';
import { StudentFirestoreService } from '@/apiservices/studentFirestoreService';
import { TeacherFirestoreService } from '@/apiservices/teacherFirestoreService';

export interface AuthenticatedUser {
  uid: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  profileId?: string;
  profile?: any;
}

export interface AuthenticatedRequest extends NextRequest {
  user: AuthenticatedUser;
}

/**
 * Middleware to authenticate and authorize API requests
 */
export async function authenticateRequest(
  request: NextRequest,
  requiredRoles?: ('student' | 'teacher' | 'admin')[]
): Promise<{ user: AuthenticatedUser | null; error: NextResponse | null }> {
  try {
    // Extract Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        user: null,
        error: NextResponse.json(
          { error: 'Missing or invalid authorization header' },
          { status: 401 }
        )
      };
    }

    // Extract and verify the token
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    let decodedToken;
    try {
      decodedToken = await firebaseAdmin.authentication.verifyToken(token);
    } catch (error) {
      console.error('Token verification failed:', error);
      return {
        user: null,
        error: NextResponse.json(
          { error: 'Invalid or expired token' },
          { status: 401 }
        )
      };
    }

    // Get user role from custom claims or determine from profile
    let userRole: 'student' | 'teacher' | 'admin' = 'student';
    let profileId: string | undefined;
    let profile: any;

    // Check custom claims first
    if (decodedToken.role) {
      userRole = decodedToken.role;
      profileId = decodedToken.profileId;
      console.log('🎫 Using custom claims:', { role: userRole, profileId });
      
      // If profileId is missing from custom claims, try to look it up
      if (!profileId) {
        console.log('🔧 ProfileId missing from custom claims, looking up profile...');
        try {
          if (userRole === 'student') {
            console.log(`🔍 Looking up student profile for UID: ${decodedToken.uid}`);
            const studentDoc = await firebaseAdmin.firestore.getDoc('students', decodedToken.uid);
            console.log(`👤 Student document lookup result:`, studentDoc ? 'Found' : 'Not found');
            
            if (studentDoc) {
              profileId = decodedToken.uid;
              profile = { id: decodedToken.uid, ...studentDoc };
              console.log(`✅ Student profile found:`, { profileId, name: studentDoc.name || 'Unknown' });
            }
          } else if (userRole === 'teacher') {
            console.log(`🔍 Looking up teacher profile for UID: ${decodedToken.uid}`);
            const teacherDoc = await firebaseAdmin.firestore.getDoc('teachers', decodedToken.uid);
            console.log(`👨‍🏫 Teacher document lookup result:`, teacherDoc ? 'Found' : 'Not found');
            
            if (teacherDoc) {
              profileId = decodedToken.uid;
              profile = { id: decodedToken.uid, ...teacherDoc };
              console.log(`✅ Teacher profile found:`, { profileId, name: teacherDoc.name || 'Unknown' });
            }
          }
        } catch (error) {
          console.error('❌ Error looking up profile:', error);
        }
      }
    } else {
      // Fallback: check if user exists in student or teacher collections
      // Students and teachers are stored with their UID as the document ID
      try {
        console.log(`🔍 Looking up profile for UID: ${decodedToken.uid}`);
        
        // Try to get student document by UID (document ID)
        const studentDoc = await firebaseAdmin.firestore.getDoc('students', decodedToken.uid);
        console.log(`👤 Student document lookup result:`, studentDoc ? 'Found' : 'Not found');
        
        if (studentDoc) {
          userRole = 'student';
          profileId = decodedToken.uid; // Use UID as profileId since it's the document ID
          profile = { id: decodedToken.uid, ...studentDoc };
          console.log(`✅ Student profile found:`, { profileId, name: studentDoc.name || 'Unknown' });
        } else {
          // Try to get teacher document by UID (document ID)
          console.log(`👨‍🏫 Checking teacher collection for UID: ${decodedToken.uid}`);
          const teacherDoc = await firebaseAdmin.firestore.getDoc('teachers', decodedToken.uid);
          console.log(`👨‍🏫 Teacher document lookup result:`, teacherDoc ? 'Found' : 'Not found');
          
          if (teacherDoc) {
            userRole = 'teacher';
            profileId = decodedToken.uid; // Use UID as profileId since it's the document ID
            profile = { id: decodedToken.uid, ...teacherDoc };
            console.log(`✅ Teacher profile found:`, { profileId, name: teacherDoc.name || 'Unknown' });
          } else {
            console.log(`❌ No profile found for UID: ${decodedToken.uid} in either students or teachers collections`);
            
            // Let's try querying by email as a fallback
            console.log(`🔄 Fallback: Querying students by email: ${decodedToken.email}`);
            try {
              const studentsQuery = await firebaseAdmin.db
                .collection('students')
                .where('email', '==', decodedToken.email!)
                .limit(1)
                .get();
              
              if (!studentsQuery.empty) {
                const studentDocByEmail = studentsQuery.docs[0];
                userRole = 'student';
                profileId = studentDocByEmail.id;
                profile = { id: studentDocByEmail.id, ...studentDocByEmail.data() };
                console.log(`✅ Student found by email:`, { profileId, name: profile.name || 'Unknown' });
              } else {
                console.log(`❌ No student found by email either: ${decodedToken.email}`);
              }
            } catch (emailQueryError) {
              console.error('❌ Error querying by email:', emailQueryError);
            }
          }
        }
      } catch (error) {
        console.error('❌ Error fetching user profile:', error);
      }
    }

    // Check role authorization if required
    if (requiredRoles && !requiredRoles.includes(userRole)) {
      return {
        user: null,
        error: NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        )
      };
    }

    const authenticatedUser: AuthenticatedUser = {
      uid: decodedToken.uid,
      email: decodedToken.email!,
      role: userRole,
      profileId,
      profile
    };

    return { user: authenticatedUser, error: null };

  } catch (error) {
    console.error('Authentication middleware error:', error);
    return {
      user: null,
      error: NextResponse.json(
        { error: 'Authentication failed' },
        { status: 500 }
      )
    };
  }
}

/**
 * Decorator for authenticated route handlers
 */
export function withAuth(
  handler: (request: AuthenticatedRequest) => Promise<NextResponse>,
  requiredRoles?: ('student' | 'teacher' | 'admin')[]
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const { user, error } = await authenticateRequest(request, requiredRoles);
    
    if (error) {
      return error;
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Attach user to request
    (request as AuthenticatedRequest).user = user;
    
    return handler(request as AuthenticatedRequest);
  };
}

/**
 * Validate request body against schema
 */
export function validateRequestBody<T>(
  body: any,
  requiredFields: (keyof T)[]
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!body || typeof body !== 'object') {
    return { isValid: false, errors: ['Request body is required'] };
  }

  for (const field of requiredFields) {
    if (!(field in body) || body[field] === undefined || body[field] === null) {
      errors.push(`Field '${String(field)}' is required`);
    }
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Rate limiting helper (basic implementation)
 */
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();

export function checkRateLimit(
  identifier: string,
  maxRequests: number = 10,
  windowMs: number = 60000 // 1 minute
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record || now - record.lastReset > windowMs) {
    rateLimitMap.set(identifier, { count: 1, lastReset: now });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  record.count++;
  return { allowed: true, remaining: maxRequests - record.count };
}
