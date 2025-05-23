import { NextRequest, NextResponse } from 'next/server';
import { adminSchema, adminUpdateSchema, AdminDocument } from '@/models/adminSchema';
import firebaseAdmin from '@/utils/firebase-server';
import { Timestamp } from 'firebase-admin/firestore';
import * as admin from 'firebase-admin';
import { cacheUtils } from '@/utils/cache';  // Fix: Import from correct file with named export

// POST - Create a new admin
export async function POST(req: NextRequest) {
  try {
    // Parse and validate the request body
    const body = await req.json();
    const validatedData = adminSchema.safeParse(body);
    
    if (!validatedData.success) {
      return NextResponse.json(
        { error: "Invalid input data", details: validatedData.error.issues },
        { status: 400 }
      );
    }
    
    const { name, email, password } = validatedData.data;
    
    // Check if an admin with this email already exists
    try {
      await firebaseAdmin.authentication.getUserByEmail(email);
      return NextResponse.json(
        { error: "Admin with this email already exists" },
        { status: 409 }
      );
    } catch (error: any) {
      // If the error is not about user not found, rethrow
      if (error.code !== 'auth/user-not-found') {
        throw error;
      }
    }
    
    // Create the user in Firebase Auth
    const userRecord = await firebaseAdmin.authentication.createUser(email, password, name);
    
    // Perform these operations in parallel
    await Promise.all([
      // Set custom claims
      firebaseAdmin.authentication.setCustomClaims(userRecord.uid, { admin: true }),
      
      // Store admin data in Firestore
      firebaseAdmin.firestore.setDoc('admins', userRecord.uid, {
        name,
        email,
        role: 'admin' as const,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      })
    ]);
    
    return NextResponse.json(
      { 
        message: "Admin created successfully", 
        id: userRecord.uid,
        name, 
        email 
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating admin:", error);
    return NextResponse.json(
      { error: "Failed to create admin", details: error.message },
      { status: 500 }
    );
  }
}

// GET - Retrieve admin(s)
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    
    const cacheKey = id ? `admin:${id}` : 'admins:all';
    const cachedData = cacheUtils.get(cacheKey);

    if (cachedData) {
      return NextResponse.json(cachedData);
    }
    
    // If ID is provided, get a specific admin
    if (id) {
      // Get from auth
      const userRecord = await firebaseAdmin.authentication.getUser(id);
      
      // Get from Firestore
      const adminDoc = await firebaseAdmin.firestore.getDoc<AdminDocument>('admins', id);
      
      if (!adminDoc) {
        return NextResponse.json(
          { error: "Admin not found in database" },
          { status: 404 }
        );
      }
      
      const result = {
        id,
        name: adminDoc.name,
        email: userRecord.email,
        role: adminDoc.role,
        createdAt: adminDoc.createdAt,
        updatedAt: adminDoc.updatedAt
      };

      // Cache the result
      cacheUtils.set(cacheKey, result, 300); // Cache for 5 minutes

      return NextResponse.json(result);
    }
    
    // Optimize fetching multiple admins
    const snapshot = await firebaseAdmin.db.collection('admins').get();
    const adminDocs = snapshot.docs;
    
    // Get all UIDs for batch fetching
    const adminIds = adminDocs.map(doc => doc.id);
    
    // Use batched operation if available (up to 100 users)
    let authUsers: Record<string, admin.auth.UserRecord> = {};
    
    if (adminIds.length > 0) {
      try {
        // Firebase Auth has getUsers() for batch operations
        const result = await firebaseAdmin.auth.getUsers(adminIds.map(id => ({ uid: id })));
        result.users.forEach(user => {
          authUsers[user.uid] = user;
        });
      } catch (error) {
        console.warn("Error fetching users in batch:", error);
        // Fall back to individual fetching
      }
    }
    
    const admins = adminDocs.map(doc => {
      const data = doc.data() as Omit<AdminDocument, 'id'>;
      const id = doc.id;
      
      // Use cached auth user info when available
      const email = authUsers[id]?.email || data.email;
      
      return {
        id,
        name: data.name,
        email,
        role: data.role,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt
      };
    });

    // Cache the result
    cacheUtils.set(cacheKey, admins, 300); // Cache for 5 minutes
    
    return NextResponse.json(admins);
  } catch (error: any) {
    console.error("Error fetching admin(s):", error);
    return NextResponse.json(
      { error: "Failed to fetch admin(s)", details: error.message },
      { status: 500 }
    );
  }
}

// PATCH - Update an admin
export async function PATCH(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: "Admin ID is required" },
        { status: 400 }
      );
    }
    
    // Parse and validate the request body
    const body = await req.json();
    const validatedData = adminUpdateSchema.safeParse(body);
    
    if (!validatedData.success) {
      return NextResponse.json(
        { error: "Invalid input data", details: validatedData.error.issues },
        { status: 400 }
      );
    }
    
    const { name, email, password } = validatedData.data;
    
    // Check if the admin exists
    let adminDoc: AdminDocument | null = null;
    try {
      // Check in Auth
      await firebaseAdmin.authentication.getUser(id);
      
      // Check in Firestore
      adminDoc = await firebaseAdmin.firestore.getDoc<AdminDocument>('admins', id);
      
      if (!adminDoc) {
        return NextResponse.json(
          { error: "Admin not found in database" },
          { status: 404 }
        );
      }
    } catch (error: any) {
      return NextResponse.json(
        { error: "Admin not found", details: error.message },
        { status: 404 }
      );
    }
    
    // Parallelize Auth and Firestore updates
    const updatePromises: Promise<any>[] = [];
    
    // Update in Auth if needed
    const authUpdateData: admin.auth.UpdateRequest = {};
    if (email) authUpdateData.email = email;
    if (password) authUpdateData.password = password;
    if (name) authUpdateData.displayName = name;
    
    if (Object.keys(authUpdateData).length > 0) {
      updatePromises.push(firebaseAdmin.authentication.updateUser(id, authUpdateData));
    }
    
    // Update in Firestore
    const firestoreUpdateData: Partial<Omit<AdminDocument, 'id'>> = {
      updatedAt: Timestamp.now()
    };
    
    if (name) firestoreUpdateData.name = name;
    if (email) firestoreUpdateData.email = email;
    
    updatePromises.push(firebaseAdmin.firestore.updateDoc('admins', id, firestoreUpdateData));
    
    // Run both updates in parallel
    await Promise.all(updatePromises);
    
    return NextResponse.json({
      message: "Admin updated successfully",
      id
    });
  } catch (error: any) {
    console.error("Error updating admin:", error);
    return NextResponse.json(
      { error: "Failed to update admin", details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete an admin
export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: "Admin ID is required" },
        { status: 400 }
      );
    }
    
    // Check if the admin exists
    try {
      await firebaseAdmin.authentication.getUser(id);
      
      const adminDoc = await firebaseAdmin.firestore.getDoc<AdminDocument>('admins', id);
      if (!adminDoc) {
        return NextResponse.json(
          { error: "Admin not found in database" },
          { status: 404 }
        );
      }
    } catch (error: any) {
      return NextResponse.json(
        { error: "Admin not found", details: error.message },
        { status: 404 }
      );
    }
    
    // Delete the admin from Auth
    await firebaseAdmin.authentication.deleteUser(id);
    
    // Delete the admin from Firestore
    await firebaseAdmin.firestore.deleteDoc('admins', id);
    
    return NextResponse.json({
      message: "Admin deleted successfully",
      id
    });
  } catch (error: any) {
    console.error("Error deleting admin:", error);
    return NextResponse.json(
      { error: "Failed to delete admin", details: error.message },
      { status: 500 }
    );
  }
}