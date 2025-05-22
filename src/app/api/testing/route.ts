import { NextRequest, NextResponse } from 'next/server';
import { firebaseAdmin } from '@/utils/firebase-server';

export async function GET(request: NextRequest) {
  try {
    const testResults = {
        timestamp: new Date().toISOString(),
        firestore: { success: false, message: '', data: null as any },
        auth: { success: false, message: '', data: null as any },
        storage: { success: false, message: '', data: null as any },
        realtimeDb: { success: false, message: '', data: null as any },
      };

    // Test Firestore
    try {
      const testId = `test-${Date.now()}`;
      const testData = { name: 'Test Document', timestamp: new Date().toISOString() };
      
      // Create test document
      await firebaseAdmin.firestore.setDoc('_tests', testId, testData);
      
      // Read test document
      const retrievedData = await firebaseAdmin.firestore.getDoc('_tests', testId);
      
      // Update test document
      await firebaseAdmin.firestore.updateDoc('_tests', testId, { updated: true });
      
      // Get updated document
      const updatedData = await firebaseAdmin.firestore.getDoc('_tests', testId);
      
      // Clean up
      await firebaseAdmin.firestore.deleteDoc('_tests', testId);
      
      testResults.firestore = {
        success: true,
        message: 'Firestore CRUD operations successful',
        data: { original: retrievedData, updated: updatedData }
      };
    } catch (error: any) {
      testResults.firestore = {
        success: false,
        message: `Firestore test failed: ${error.message}`,
        data: error
      };
    }

    // Test Authentication
    try {
      const randomEmail = `test-${Date.now()}@example.com`;
      const password = 'Test123!';
      
      // Create test user
      const newUser = await firebaseAdmin.authentication.createUser(
        randomEmail, 
        password,
        'Test User'
      );
      
      // Get user
      const retrievedUser = await firebaseAdmin.authentication.getUser(newUser.uid);
      
      // Clean up
      await firebaseAdmin.authentication.deleteUser(newUser.uid);
      
      testResults.auth = {
        success: true,
        message: 'Authentication operations successful',
        data: { uid: newUser.uid, email: retrievedUser.email }
      };
    } catch (error: any) {
      testResults.auth = {
        success: false,
        message: `Authentication test failed: ${error.message}`,
        data: error
      };
    }

    // Test Storage
    try {
      const testFilePath = `test-files/test-${Date.now()}.txt`;
      const testContent = Buffer.from('Hello Firebase Storage!');
      
      // Upload file
      await firebaseAdmin.fileStorage.uploadFile(testFilePath, testContent);
      
      // Get file URL
      const fileUrl = firebaseAdmin.fileStorage.getFileUrl(testFilePath);
      
      // Download file
      const downloadedContent = await firebaseAdmin.fileStorage.getFile(testFilePath);
      
      // Clean up
      await firebaseAdmin.fileStorage.deleteFile(testFilePath);
      
      testResults.storage = {
        success: true,
        message: 'Storage operations successful',
        data: {
          url: fileUrl,
          content: downloadedContent.toString() === testContent.toString()
        }
      };
    } catch (error: any) {
      testResults.storage = {
        success: false,
        message: `Storage test failed: ${error.message}`,
        data: error
      };
    }

    // Test Realtime Database
    try {
      const testPath = `tests/test-${Date.now()}`;
      const testData = { message: 'Hello Realtime Database!', timestamp: Date.now() };
      
      // Set data
      await firebaseAdmin.realtimeDb.setData(testPath, testData);
      
      // Get data
      const retrievedData = await firebaseAdmin.realtimeDb.getData(testPath);
      
      // Update data
      await firebaseAdmin.realtimeDb.updateData(testPath, { updated: true });
      
      // Get updated data
      const updatedData = await firebaseAdmin.realtimeDb.getData(testPath);
      
      // Clean up
      await firebaseAdmin.realtimeDb.removeData(testPath);
      
      testResults.realtimeDb = {
        success: true,
        message: 'Realtime Database operations successful',
        data: { original: retrievedData, updated: updatedData }
      };
    } catch (error: any) {
      testResults.realtimeDb = {
        success: false,
        message: `Realtime Database test failed: ${error.message}`,
        data: error
      };
    }

    return NextResponse.json(testResults, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Unknown error occurred' }, 
      { status: 500 }
    );
  }
}