// Manual test script to create teacher access data
// This helps test the system without needing complex Firestore indexes

import { teacherAccessBankService } from '@/apiservices/teacherAccessBankService';
import { questionBankService } from '@/apiservices/questionBankFirestoreService';

// Sample test data - replace with your actual IDs
const testData = {
  // Replace these with actual teacher IDs from your system
  teachers: [
    {
      id: 'sample_teacher_1',
      name: 'John Smith',
      email: 'john.smith@example.com'
    },
    {
      id: 'sample_teacher_2', 
      name: 'Jane Doe',
      email: 'jane.doe@example.com'
    }
  ],
  
  // Replace these with actual question bank and subject IDs
  questionBanks: [
    {
      id: 'sample_qbank_1',
      name: 'Math Grade 10 - Algebra',
      subjectId: 'math_10',
      subjectName: 'Mathematics'
    },
    {
      id: 'sample_qbank_2',
      name: 'English Grade 10 - Literature', 
      subjectId: 'english_10',
      subjectName: 'English'
    }
  ]
};

// Function to create test access data
export async function createTestAccessData() {
  console.log('🔍 Creating test teacher access data...');
  
  try {
    let successCount = 0;
    let errorCount = 0;
    
    // Grant access for each teacher to each question bank
    for (const teacher of testData.teachers) {
      for (const qbank of testData.questionBanks) {
        try {
          await teacherAccessBankService.grantAccess(
            teacher.id,
            teacher.name,
            teacher.email,
            qbank.id,
            qbank.name,
            qbank.subjectId,
            qbank.subjectName,
            'read',
            'test_admin',
            'Test Administrator',
            undefined,
            'Test data creation'
          );
          
          console.log(`✅ Created access: ${teacher.name} -> ${qbank.name}`);
          successCount++;
        } catch (error) {
          console.warn(`❌ Failed to create access: ${teacher.name} -> ${qbank.name}:`, error);
          errorCount++;
        }
      }
    }
    
    console.log(`✅ Test data creation completed: ${successCount} success, ${errorCount} errors`);
    return { successCount, errorCount };
    
  } catch (error) {
    console.error('❌ Error creating test data:', error);
    throw error;
  }
}

// Function to verify access works
export async function verifyTeacherAccess(teacherId: string) {
  try {
    console.log(`🔍 Verifying access for teacher: ${teacherId}`);
    
    const accessBanks = await teacherAccessBankService.getAccessibleQuestionBanks(teacherId);
    
    console.log(`✅ Teacher ${teacherId} has access to ${accessBanks.length} question banks:`);
    accessBanks.forEach((access, index) => {
      console.log(`  ${index + 1}. ${access.questionBankName} (${access.subjectName}) - ${access.accessType} access`);
    });
    
    return accessBanks;
    
  } catch (error) {
    console.error('❌ Error verifying access:', error);
    throw error;
  }
}

// Function to cleanup test data
export async function cleanupTestData() {
  console.log('🔍 Cleaning up test data...');
  
  try {
    let cleanupCount = 0;
    
    for (const teacher of testData.teachers) {
      for (const qbank of testData.questionBanks) {
        try {
          await teacherAccessBankService.revokeAccess(teacher.id, qbank.id);
          console.log(`✅ Cleaned up: ${teacher.name} -> ${qbank.name}`);
          cleanupCount++;
        } catch (error) {
          console.warn(`❌ Failed to cleanup: ${teacher.name} -> ${qbank.name}:`, error);
        }
      }
    }
    
    console.log(`✅ Cleanup completed: ${cleanupCount} records processed`);
    return cleanupCount;
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  }
}

// Usage instructions:
/*
To test the system:

1. Update the testData object above with real teacher and question bank IDs
2. In your browser console or admin panel, run:
   - createTestAccessData() to create test access records
   - verifyTeacherAccess('your_teacher_id') to check if it works
   - cleanupTestData() to remove test data when done

Example:
import { createTestAccessData, verifyTeacherAccess } from '@/utils/test-access-data';
await createTestAccessData();
await verifyTeacherAccess('sample_teacher_1');
*/
