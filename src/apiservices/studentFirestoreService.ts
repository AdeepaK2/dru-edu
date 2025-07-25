import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc,
  query, 
  orderBy, 
  where, 
  Timestamp,
  limit
} from 'firebase/firestore';
import { firestore } from '@/utils/firebase-client';
import { studentSchema, studentUpdateSchema } from '@/models/studentSchema';

const COLLECTION_NAME = 'students';

export interface StudentListItem {
  id: string;
  name: string;
  email: string;
  status: 'Active' | 'Suspended' | 'Inactive';
}

export class StudentFirestoreService {
  private static collectionRef = collection(firestore, COLLECTION_NAME);

  /**
   * Get all students
   */  static async getAllStudents(): Promise<StudentListItem[]> {
    try {
      const q = query(this.collectionRef, orderBy('name', 'asc'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
        email: doc.data().email,
        status: doc.data().status,
      }));
    } catch (error) {
      console.error('Error fetching students:', error);
      throw new Error(`Failed to fetch students: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get students by class ID using enrollment system
   */
  static async getStudentsByClass(classId: string): Promise<StudentListItem[]> {
    console.log(`🔍 Querying students for class: ${classId}`);
    
    try {
      // Use the enrollment system to get students for the class
      const { getEnrollmentsByClass } = await import('@/services/studentEnrollmentService');
      console.log(`📊 Getting enrollments for class: ${classId}`);
      
      const enrollments = await getEnrollmentsByClass(classId);
      console.log(`✅ Found ${enrollments.length} enrollments`);
      
      // Convert enrollments to student list items
      const students = enrollments
        .filter(enrollment => enrollment.status === 'Active') // Only active enrollments
        .map(enrollment => ({
          id: enrollment.studentId,
          name: enrollment.studentName,
          email: enrollment.studentEmail,
          status: 'Active' as const, // Set status based on enrollment
        }))
        .sort((a, b) => a.name.localeCompare(b.name)); // Sort by name
      
      console.log(`📋 Active students:`, students);
      return students;
    } catch (error) {
      console.error(`❌ Error fetching students for class ${classId}:`, error);
      
      // Fallback: Return empty array instead of throwing
      console.warn(`🔄 Returning empty student list for class ${classId}`);
      return [];
    }
  }

  /**
   * Get students by ID list
   */
  static async getStudentsByIds(studentIds: string[]): Promise<Record<string, string>> {
    if (!studentIds.length) return {};
    
    try {
      const studentNames: Record<string, string> = {};
      
      // Firebase doesn't support 'in' queries with more than 10 items
      // Processing in chunks if needed
      const chunkSize = 10;
      for (let i = 0; i < studentIds.length; i += chunkSize) {
        const chunk = studentIds.slice(i, i + chunkSize);
        
        const q = query(
          this.collectionRef,
          where('__name__', 'in', chunk)
        );
        
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
          studentNames[doc.id] = doc.data().name;
        });
      }
      
      return studentNames;
    } catch (error) {
      console.error('Error fetching student names:', error);
      return {};
    }
  }
}
