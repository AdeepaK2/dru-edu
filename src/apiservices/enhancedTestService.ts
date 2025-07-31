// Enhanced Test Service with automatic numbering
// Integrates test numbering service with test creation

import { firestore } from '@/utils/firebase-client';
import { collection, addDoc, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { Test, BaseTest } from '@/models/testSchema';
import { SimplifiedTest, BaseSimplifiedTest } from '@/models/simplifiedTestSchema';
import { TestNumberingService } from './testNumberingService';

export class EnhancedTestService {
  
  /**
   * Create a new test with automatic numbering
   */
  static async createTestWithNumbering(
    testData: Omit<BaseTest, 'id' | 'testNumber' | 'displayNumber' | 'numberAssignmentId' | 'createdAt' | 'updatedAt'>,
    useSimplifiedSchema: boolean = false
  ): Promise<{
    testId: string;
    testNumber: number;
    displayNumber: string;
    success: boolean;
  }> {
    try {
      console.log('🎯 Creating test with automatic numbering...');
      
      // Get test number assignment for the first class
      const primaryClassId = testData.classIds[0];
      const primaryClassName = testData.classNames[0];
      
      const numberingResult = await TestNumberingService.getNextTestNumber(
        primaryClassId,
        primaryClassName,
        testData.subjectId,
        testData.subjectName,
        testData.teacherId,
        testData.teacherName
      );
      
      console.log('📋 Test number assigned:', numberingResult);
      
      // Prepare test data with numbering
      const completeTestData = {
        ...testData,
        testNumber: numberingResult.testNumber,
        displayNumber: numberingResult.displayNumber,
        numberAssignmentId: numberingResult.assignmentId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };
      
      // Create the test document
      const testCollection = useSimplifiedSchema ? 'simplified_tests' : 'tests';
      const testRef = await addDoc(collection(firestore, testCollection), completeTestData);
      
      console.log('📄 Test document created:', testRef.id);
      
      // Complete the number assignment
      await TestNumberingService.completeTestNumberAssignment(
        numberingResult.assignmentId,
        testRef.id,
        testData.title
      );
      
      console.log('✅ Test created successfully with numbering');
      
      return {
        testId: testRef.id,
        testNumber: numberingResult.testNumber,
        displayNumber: numberingResult.displayNumber,
        success: true
      };
      
    } catch (error) {
      console.error('❌ Error creating test with numbering:', error);
      throw error;
    }
  }
  
  /**
   * Create a simplified test with automatic numbering
   */
  static async createSimplifiedTestWithNumbering(
    testData: Omit<BaseSimplifiedTest, 'id' | 'testNumber' | 'displayNumber' | 'numberAssignmentId' | 'createdAt' | 'updatedAt'>
  ): Promise<{
    testId: string;
    testNumber: number;
    displayNumber: string;
    success: boolean;
  }> {
    return this.createTestWithNumbering(testData as any, true);
  }
  
  /**
   * Update test title and sync with numbering system
   */
  static async updateTestTitle(
    testId: string,
    newTitle: string,
    useSimplifiedSchema: boolean = false
  ): Promise<void> {
    try {
      console.log('📝 Updating test title:', { testId, newTitle });
      
      // Update test document
      const testCollection = useSimplifiedSchema ? 'simplified_tests' : 'tests';
      const testRef = doc(firestore, testCollection, testId);
      
      await updateDoc(testRef, {
        title: newTitle,
        updatedAt: Timestamp.now()
      });
      
      // Update numbering assignment
      const numberingInfo = await TestNumberingService.getTestNumberInfo(testId);
      if (numberingInfo) {
        await TestNumberingService.completeTestNumberAssignment(
          numberingInfo.id,
          testId,
          newTitle
        );
      }
      
      console.log('✅ Test title updated successfully');
      
    } catch (error) {
      console.error('❌ Error updating test title:', error);
      throw error;
    }
  }
  
  /**
   * Get test with numbering information
   */
  static async getTestWithNumbering(
    testId: string,
    useSimplifiedSchema: boolean = false
  ): Promise<(Test | SimplifiedTest) & { numberingInfo?: any } | null> {
    try {
      const { doc, getDoc } = await import('firebase/firestore');
      
      const testCollection = useSimplifiedSchema ? 'simplified_tests' : 'tests';
      const testRef = doc(firestore, testCollection, testId);
      const testDoc = await getDoc(testRef);
      
      if (!testDoc.exists()) {
        return null;
      }
      
      const testData = { id: testDoc.id, ...testDoc.data() } as Test | SimplifiedTest;
      
      // Get additional numbering information
      const numberingInfo = await TestNumberingService.getTestNumberInfo(testId);
      
      return {
        ...testData,
        numberingInfo
      };
      
    } catch (error) {
      console.error('❌ Error getting test with numbering:', error);
      return null;
    }
  }
  
  /**
   * Get all tests for a class with numbering
   */
  static async getClassTestsWithNumbering(
    classId: string,
    useSimplifiedSchema: boolean = false
  ): Promise<Array<(Test | SimplifiedTest) & { numberingInfo?: any }>> {
    try {
      const { collection, query, where, orderBy, getDocs } = await import('firebase/firestore');
      
      const testCollection = useSimplifiedSchema ? 'simplified_tests' : 'tests';
      const testsQuery = query(
        collection(firestore, testCollection),
        where('classIds', 'array-contains', classId),
        orderBy('testNumber', 'asc')
      );
      
      const snapshot = await getDocs(testsQuery);
      const tests = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as Test | SimplifiedTest));
      
      // Get numbering information for all tests
      const testsWithNumbering = await Promise.all(
        tests.map(async (test) => {
          const numberingInfo = await TestNumberingService.getTestNumberInfo(test.id);
          return {
            ...test,
            numberingInfo
          };
        })
      );
      
      return testsWithNumbering;
      
    } catch (error) {
      console.error('❌ Error getting class tests with numbering:', error);
      return [];
    }
  }
  
  /**
   * Generate next test title with automatic numbering
   */
  static async generateTestTitleWithNumber(
    baseTitle: string,
    classId: string,
    className: string,
    subjectId?: string,
    subjectName?: string
  ): Promise<{
    suggestedTitle: string;
    nextNumber: number;
    displayNumber: string;
  }> {
    try {
      // Get current counter status (without incrementing)
      const counter = await TestNumberingService.getCounterStatus(classId, subjectId);
      const nextNumber = counter?.currentTestNumber || 1;
      
      // Generate display number
      const displayNumber = subjectName 
        ? `${subjectName} Test #${nextNumber}`
        : `Test #${nextNumber}`;
      
      // Suggest full title
      const suggestedTitle = baseTitle.includes('#') 
        ? baseTitle 
        : `${baseTitle} - ${displayNumber}`;
      
      return {
        suggestedTitle,
        nextNumber,
        displayNumber
      };
      
    } catch (error) {
      console.error('❌ Error generating test title with number:', error);
      return {
        suggestedTitle: baseTitle,
        nextNumber: 1,
        displayNumber: 'Test #1'
      };
    }
  }
  
  /**
   * Duplicate test with new numbering
   */
  static async duplicateTestWithNewNumber(
    originalTestId: string,
    newTitle?: string,
    useSimplifiedSchema: boolean = false
  ): Promise<{
    testId: string;
    testNumber: number;
    displayNumber: string;
    success: boolean;
  }> {
    try {
      console.log('📋 Duplicating test with new numbering:', originalTestId);
      
      // Get original test
      const originalTest = await this.getTestWithNumbering(originalTestId, useSimplifiedSchema);
      if (!originalTest) {
        throw new Error('Original test not found');
      }
      
      // Prepare new test data (remove ID and numbering fields)
      const { id, testNumber, displayNumber, numberAssignmentId, numberingInfo, createdAt, updatedAt, ...testDataToCopy } = originalTest;
      
      // Use new title or generate one
      const finalTitle = newTitle || `${testDataToCopy.title} (Copy)`;
      
      // Create new test with numbering
      return await this.createTestWithNumbering(
        {
          ...testDataToCopy,
          title: finalTitle
        } as any,
        useSimplifiedSchema
      );
      
    } catch (error) {
      console.error('❌ Error duplicating test with new number:', error);
      throw error;
    }
  }
}
