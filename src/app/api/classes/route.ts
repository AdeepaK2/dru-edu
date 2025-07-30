import { NextRequest, NextResponse } from 'next/server';
import { ClassDocument } from '@/models/classSchema';
import firebaseAdmin from '@/utils/firebase-server';
import { cacheUtils } from '@/utils/cache';

// GET - Retrieve all classes
export async function GET(request: NextRequest) {
  try {
    const cacheKey = 'classes:all';
    const cachedData = cacheUtils.get(cacheKey);

    if (cachedData) {
      return NextResponse.json(cachedData);
    }

    // Get all classes from Firestore
    const snapshot = await firebaseAdmin.db.collection('classes').orderBy('createdAt', 'desc').get();
    const classes: ClassDocument[] = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      classes.push({
        id: doc.id,
        ...data,
      } as ClassDocument);
    });

    // Cache the result for 5 minutes
    cacheUtils.set(cacheKey, classes, 300);
    
    return NextResponse.json(classes);
  } catch (error: any) {
    console.error('Error fetching classes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch classes', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Create a new class
export async function POST(request: NextRequest) {
  return NextResponse.json({ message: 'Class creation not implemented yet' }, { status: 501 });
}