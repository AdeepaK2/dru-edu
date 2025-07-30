// Utility script to set up initial teacher access to question banks
// Run this once to give teachers access to question banks

import { teacherAccessBankService } from '@/apiservices/teacherAccessBankService';
import { questionBankService } from '@/apiservices/questionBankFirestoreService';
import { Timestamp } from 'firebase/firestore';

// This function should be called by an admin to grant access
export async function setupInitialTeacherAccess() {
  try {
    console.log('🔍 Setting up initial teacher access to question banks...');
    
    // Get all question banks
    const allQuestionBanks = await questionBankService.listQuestionBanks();
    console.log('✅ Found question banks:', allQuestionBanks.length);
    
    // Example teacher IDs - replace with actual teacher IDs from your system
    const sampleTeachers = [
      {
        id: 'teacher1_id', // Replace with actual teacher ID
        name: 'John Smith',
        email: 'john.smith@school.com'
      },
      {
        id: 'teacher2_id', // Replace with actual teacher ID  
        name: 'Jane Doe',
        email: 'jane.doe@school.com'
      }
      // Add more teachers as needed
    ];
    
    // Grant read access to all teachers for all question banks
    for (const teacher of sampleTeachers) {
      for (const questionBank of allQuestionBanks) {
        try {
          await teacherAccessBankService.grantAccess(
            teacher.id,
            teacher.name,
            teacher.email,
            questionBank.id,
            questionBank.name,
            questionBank.subjectId,
            questionBank.subjectName,
            'read', // Grant read access by default
            'system_admin', // Granted by system
            'System Administrator',
            undefined, // No expiry
            'Initial setup - granted access to all question banks'
          );
          
          console.log(`✅ Granted access: ${teacher.name} -> ${questionBank.name}`);
        } catch (error) {
          console.warn(`❌ Failed to grant access: ${teacher.name} -> ${questionBank.name}:`, error);
        }
      }
    }
    
    console.log('✅ Initial teacher access setup completed!');
  } catch (error) {
    console.error('❌ Error setting up initial teacher access:', error);
    throw error;
  }
}

// Alternative: Grant access to specific teacher for specific subject
export async function grantTeacherAccessToSubject(
  teacherId: string,
  teacherName: string,
  teacherEmail: string,
  subjectId: string,
  grantedBy: string = 'system_admin',
  grantedByName: string = 'System Administrator'
) {
  try {
    console.log(`🔍 Granting access to ${teacherName} for subject: ${subjectId}`);
    
    // Get all question banks for the subject
    const questionBanks = await questionBankService.listQuestionBanks();
    const subjectBanks = questionBanks.filter(bank => bank.subjectId === subjectId);
    
    console.log(`✅ Found ${subjectBanks.length} question banks for subject: ${subjectId}`);
    
    // Grant access to each question bank
    for (const bank of subjectBanks) {
      await teacherAccessBankService.grantAccess(
        teacherId,
        teacherName,
        teacherEmail,
        bank.id,
        bank.name,
        bank.subjectId,
        bank.subjectName,
        'read',
        grantedBy,
        grantedByName,
        undefined, // No expiry
        `Access granted for subject: ${bank.subjectName}`
      );
      
      console.log(`✅ Granted access: ${teacherName} -> ${bank.name}`);
    }
    
    console.log(`✅ Completed granting access to ${teacherName} for subject: ${subjectId}`);
  } catch (error) {
    console.error('❌ Error granting teacher access to subject:', error);
    throw error;
  }
}

// Function to check current teacher access
export async function checkTeacherAccess(teacherId: string) {
  try {
    console.log(`🔍 Checking access for teacher: ${teacherId}`);
    
    const accessBanks = await teacherAccessBankService.getAccessibleQuestionBanks(teacherId);
    
    console.log(`✅ Teacher has access to ${accessBanks.length} question banks:`);
    
    accessBanks.forEach(access => {
      console.log(`  - ${access.questionBankName} (${access.subjectName}) - ${access.accessType} access`);
    });
    
    // Group by subject
    const bySubject = await teacherAccessBankService.getAccessibleQuestionBanksBySubject(teacherId);
    
    console.log('📚 Access grouped by subject:');
    Object.entries(bySubject).forEach(([subjectId, banks]) => {
      console.log(`  ${subjectId}: ${banks.length} question banks`);
      banks.forEach(bank => {
        console.log(`    - ${bank.questionBankName} (${bank.accessType})`);
      });
    });
    
    return accessBanks;
  } catch (error) {
    console.error('❌ Error checking teacher access:', error);
    throw error;
  }
}
