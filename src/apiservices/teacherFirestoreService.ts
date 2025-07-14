import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc,
  onSnapshot, 
  query, 
  orderBy, 
  where, 
  Timestamp,
  DocumentData,
  QuerySnapshot
} from 'firebase/firestore';
import { firestore } from '@/utils/firebase-client';
import { TeacherData, TeacherDocument, TeacherUpdateData, teacherSchema } from '@/models/teacherSchema';

const COLLECTION_NAME = 'teachers';

export class TeacherFirestoreService {
  private static collectionRef = collection(firestore, COLLECTION_NAME);

  /**
   * Get all teachers
   */
  static async getAllTeachers(): Promise<TeacherDocument[]> {
    try {
      const q = query(this.collectionRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as TeacherDocument));
    } catch (error) {
      console.error('Error fetching teachers:', error);
      throw new Error(`Failed to fetch teachers: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get a specific teacher by ID
   */
  static async getTeacherById(teacherId: string): Promise<TeacherDocument | null> {
    try {
      const docRef = doc(firestore, COLLECTION_NAME, teacherId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        } as TeacherDocument;
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error fetching teacher:', error);
      throw new Error(`Failed to fetch teacher: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get teachers by status
   */
  static async getTeachersByStatus(status: 'Active' | 'On Leave' | 'Inactive'): Promise<TeacherDocument[]> {
    try {
      const q = query(
        this.collectionRef, 
        where('status', '==', status),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as TeacherDocument));
    } catch (error) {
      console.error('Error fetching teachers by status:', error);
      throw new Error(`Failed to fetch teachers by status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get teachers by subject
   */
  static async getTeachersBySubject(subject: string): Promise<TeacherDocument[]> {
    try {
      const q = query(
        this.collectionRef, 
        where('subject', '==', subject),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as TeacherDocument));
    } catch (error) {
      console.error('Error fetching teachers by subject:', error);
      throw new Error(`Failed to fetch teachers by subject: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update a teacher
   */
  static async updateTeacher(teacherId: string, updateData: Partial<TeacherData>): Promise<void> {
    try {
      const docRef = doc(firestore, COLLECTION_NAME, teacherId);
      
      // Filter out undefined values from updateData
      const cleanUpdateData: any = {
        updatedAt: Timestamp.now(),
      };

      // Only add fields that have defined values
      Object.entries(updateData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          // For string fields, also check if they're not empty
          if (typeof value === 'string' && value.trim() === '') {
            return; // Skip empty strings
          }
          cleanUpdateData[key] = value;
        }
      });

      await updateDoc(docRef, cleanUpdateData);
      console.log('Teacher updated successfully');
    } catch (error) {
      console.error('Error updating teacher:', error);
      throw new Error(`Failed to update teacher: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete a teacher
   */
  static async deleteTeacher(teacherId: string): Promise<void> {
    try {
      const docRef = doc(firestore, COLLECTION_NAME, teacherId);
      await deleteDoc(docRef);
      console.log('Teacher deleted successfully');
    } catch (error) {
      console.error('Error deleting teacher:', error);
      throw new Error(`Failed to delete teacher: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Subscribe to real-time updates for all teachers
   */
  static subscribeToTeachers(callback: (teachers: TeacherDocument[]) => void): () => void {
    const q = query(this.collectionRef, orderBy('createdAt', 'desc'));
    
    return onSnapshot(q, (querySnapshot) => {
      const teachers = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as TeacherDocument));
      callback(teachers);
    }, (error) => {
      console.error('Error in teachers subscription:', error);
    });
  }

  /**
   * Subscribe to real-time updates for a specific teacher
   */
  static subscribeToTeacher(teacherId: string, callback: (teacher: TeacherDocument | null) => void): () => void {
    const docRef = doc(firestore, COLLECTION_NAME, teacherId);
    
    return onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const teacher = {
          id: docSnap.id,
          ...docSnap.data()
        } as TeacherDocument;
        callback(teacher);
      } else {
        callback(null);
      }
    }, (error) => {
      console.error('Error in teacher subscription:', error);
    });
  }

  /**
   * Get simplified teacher data for dropdowns/selections
   */
  static async getTeachersForSelection(): Promise<Array<{id: string, name: string, email: string}>> {
    try {
      const teachers = await this.getAllTeachers();
      return teachers.map(teacher => ({
        id: teacher.id,
        name: teacher.name,
        email: teacher.email
      }));
    } catch (error) {
      console.error('Error fetching teachers for selection:', error);
      throw new Error(`Failed to fetch teachers for selection: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
