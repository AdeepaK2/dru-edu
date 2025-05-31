import { firestore } from '@/utils/firebase-client';
import { collection, doc, getDocs, getDoc, onSnapshot, query, orderBy } from 'firebase/firestore';

export interface CenterDocument {
  id: string;
  center: number;
  location: string;
  // Add other center fields as needed
}

export class CenterFirestoreService {
  private static readonly COLLECTION_NAME = 'center';

  /**
   * Get all centers
   */
  static async getAllCenters(): Promise<CenterDocument[]> {
    try {
      const centersRef = collection(firestore, this.COLLECTION_NAME);
      const q = query(centersRef, orderBy('center', 'asc'));
      const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as CenterDocument));
    } catch (error) {
      console.error('Error fetching centers:', error);
      throw new Error('Failed to fetch centers');
    }
  }

  /**
   * Get a specific center by ID
   */
  static async getCenterById(centerId: string): Promise<CenterDocument | null> {
    try {
      const centerRef = doc(firestore, this.COLLECTION_NAME, centerId);
      const centerSnap = await getDoc(centerRef);
      
      if (centerSnap.exists()) {        return {
          id: centerSnap.id,
          ...centerSnap.data()
        } as CenterDocument;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching center:', error);
      throw new Error('Failed to fetch center');
    }
  }

  /**
   * Subscribe to real-time center updates
   */
  static subscribeToCenters(
    onUpdate: (centers: CenterDocument[]) => void,
    onError: (error: Error) => void
  ): () => void {
    const centersRef = collection(firestore, this.COLLECTION_NAME);
    const q = query(centersRef, orderBy('center', 'asc'));
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {        const centers = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as CenterDocument));
        onUpdate(centers);
      },
      (error) => {
        console.error('Error in centers subscription:', error);
        onError(error);
      }
    );

    return unsubscribe;
  }

  /**
   * Get center name by center number
   */
  static async getCenterNameByNumber(centerNumber: string): Promise<string> {
    try {
      const centers = await this.getAllCenters();
      const center = centers.find(c => c.center.toString() === centerNumber);
      return center?.location || `Center ${centerNumber}`;
    } catch (error) {
      console.error('Error getting center name:', error);
      return `Center ${centerNumber}`;
    }
  }
}
