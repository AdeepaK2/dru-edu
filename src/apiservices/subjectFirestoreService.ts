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
import { SubjectData, SubjectDocument, SubjectUpdateData, subjectSchema } from '@/models/subjectSchema';

const COLLECTION_NAME = 'subjects';

export class SubjectFirestoreService {
  private static collectionRef = collection(firestore, COLLECTION_NAME);

  /**
   * Generate a unique subject ID
   */
  private static async generateSubjectId(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `SUB-${year}-`;
    
    // Query existing subjects to find the highest number for this year
    const q = query(
      this.collectionRef,
      where('subjectId', '>=', prefix),
      where('subjectId', '<', `SUB-${year + 1}-`),
      orderBy('subjectId', 'desc')
    );
    
    const snapshot = await getDocs(q);
    
    let nextNumber = 1;
    if (!snapshot.empty) {
      const lastSubjectId = snapshot.docs[0].data().subjectId;
      const lastNumber = parseInt(lastSubjectId.split('-')[2]);
      nextNumber = lastNumber + 1;
    }
    
    return `${prefix}${nextNumber.toString().padStart(3, '0')}`;
  }

  /**
   * Create a new subject
   */
  static async createSubject(subjectData: SubjectData): Promise<string> {
    try {
      // Validate the data
      const validatedData = subjectSchema.parse(subjectData);
      
      // Generate auto subject ID
      const subjectId = await this.generateSubjectId();
      
      // Prepare the document data
      const documentData = {
        ...validatedData,
        subjectId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        // createdBy: currentUserId, // You can add this when you have auth context
        // lastModifiedBy: currentUserId,
      };

      const docRef = await addDoc(this.collectionRef, documentData);
      console.log('Subject created with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error creating subject:', error);
      throw new Error(`Failed to create subject: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  /**
   * Get all subjects
   */
  static async getAllSubjects(): Promise<SubjectDocument[]> {
    try {
      const q = query(this.collectionRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as SubjectDocument));
    } catch (error) {
      console.error('Error fetching subjects:', error);
      throw new Error(`Failed to fetch subjects: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  /**
   * Get a specific subject by ID
   */
  static async getSubjectById(subjectId: string): Promise<SubjectDocument | null> {
    try {
      const docRef = doc(firestore, COLLECTION_NAME, subjectId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        } as SubjectDocument;
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error fetching subject:', error);
      throw new Error(`Failed to fetch subject: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update a subject
   */
  static async updateSubject(subjectId: string, updateData: Partial<SubjectData>): Promise<void> {
    try {
      const docRef = doc(firestore, COLLECTION_NAME, subjectId);
      
      const updatePayload = {
        ...updateData,
        updatedAt: Timestamp.now(),
        // lastModifiedBy: currentUserId, // You can add this when you have auth context
      };

      await updateDoc(docRef, updatePayload);
      console.log('Subject updated successfully');
    } catch (error) {
      console.error('Error updating subject:', error);
      throw new Error(`Failed to update subject: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete a subject
   */
  static async deleteSubject(subjectId: string): Promise<void> {
    try {
      const docRef = doc(firestore, COLLECTION_NAME, subjectId);
      await deleteDoc(docRef);
      console.log('Subject deleted successfully');
    } catch (error) {
      console.error('Error deleting subject:', error);
      throw new Error(`Failed to delete subject: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Subscribe to real-time updates for all subjects
   */
  static subscribeToSubjects(
    onSuccess: (subjects: SubjectDocument[]) => void,
    onError: (error: Error) => void
  ): () => void {
    try {
      const q = query(this.collectionRef, orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(
        q,
        (snapshot: QuerySnapshot<DocumentData>) => {
          const subjects = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as SubjectDocument));
          
          onSuccess(subjects);
        },
        (error) => {
          console.error('Real-time subscription error:', error);
          onError(new Error(`Real-time subscription failed: ${error.message}`));
        }
      );

      return unsubscribe;
    } catch (error) {
      console.error('Error setting up real-time subscription:', error);
      onError(new Error(`Failed to setup subscription: ${error instanceof Error ? error.message : 'Unknown error'}`));
      return () => {}; // Return empty unsubscribe function
    }
  }
  /**
   * Get subjects by grade
   */
  static async getSubjectsByGrade(grade: string): Promise<SubjectDocument[]> {
    try {
      const q = query(
        this.collectionRef, 
        where('grade', '==', grade),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as SubjectDocument));
    } catch (error) {
      console.error('Error fetching subjects by grade:', error);
      throw new Error(`Failed to fetch subjects by grade: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  /**
   * Get active subjects
   */
  static async getActiveSubjects(): Promise<SubjectDocument[]> {
    try {
      const q = query(
        this.collectionRef, 
        where('isActive', '==', true),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as SubjectDocument));
    } catch (error) {
      console.error('Error fetching active subjects:', error);
      throw new Error(`Failed to fetch active subjects: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
