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
import { 
  VideoPurchaseData, 
  VideoPurchaseDocument, 
  VideoPurchaseUpdateData, 
  videoPurchaseSchema 
} from '@/models/videoPurchaseSchema';

const COLLECTION_NAME = 'videoPurchases';

export class VideoPurchaseService {
  private static collectionRef = collection(firestore, COLLECTION_NAME);

  /**
   * Generate a unique purchase ID
   */
  private static async generatePurchaseId(): Promise<string> {
    try {
      const year = new Date().getFullYear();
      
      // Get the latest purchase ID to determine the next sequence number
      const q = query(
        this.collectionRef, 
        where('purchaseId', '>=', `VPU-${year}`),
        where('purchaseId', '<', `VPU-${year+1}`),
        orderBy('purchaseId', 'desc'),
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        // First purchase of the year
        return `VPU-${year}-001`;
      } else {
        // Extract the sequence number from the last purchase ID
        const lastId = querySnapshot.docs[0].data().purchaseId;
        const matches = lastId.match(/VPU-\d{4}-(\d{3})/);
        
        if (matches && matches[1]) {
          const sequence = parseInt(matches[1], 10) + 1;
          return `VPU-${year}-${sequence.toString().padStart(3, '0')}`;
        } else {
          return `VPU-${year}-001`;
        }
      }
    } catch (error) {
      console.error('Error generating purchase ID:', error);
      const year = new Date().getFullYear();
      // Fallback with timestamp to ensure uniqueness
      const timestamp = Date.now();
      return `VPU-${year}-${timestamp}`;
    }
  }

  /**
   * Create a new video purchase record
   */
  static async createPurchase(purchaseData: VideoPurchaseData): Promise<string> {
    try {
      // Validate the data
      const validatedData = videoPurchaseSchema.parse(purchaseData);
      
      // Generate auto purchase ID
      const purchaseId = await this.generatePurchaseId();
      
      // Prepare the document data
      const documentData: any = {
        ...validatedData,
        purchaseId,
        viewCount: 0,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      // Convert accessExpiryDate to Timestamp if it's a Date
      if (validatedData.accessExpiryDate && validatedData.accessExpiryDate instanceof Date) {
        documentData.accessExpiryDate = Timestamp.fromDate(validatedData.accessExpiryDate);
      }
      
      const docRef = await addDoc(this.collectionRef, documentData);
      return docRef.id;
    } catch (error) {
      console.error('Error creating video purchase:', error);
      throw new Error(`Failed to create video purchase: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get purchase by ID
   */
  static async getPurchaseById(purchaseId: string): Promise<VideoPurchaseDocument | null> {
    try {
      const docRef = doc(firestore, COLLECTION_NAME, purchaseId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        } as VideoPurchaseDocument;
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error fetching video purchase:', error);
      throw new Error(`Failed to fetch video purchase: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all purchases by student
   */
  static async getPurchasesByStudent(studentId: string): Promise<VideoPurchaseDocument[]> {
    try {
      const q = query(
        this.collectionRef,
        where('studentId', '==', studentId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as VideoPurchaseDocument));
    } catch (error) {
      console.error('Error fetching student purchases:', error);
      throw new Error(`Failed to fetch student purchases: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get purchases by video
   */
  static async getPurchasesByVideo(videoId: string): Promise<VideoPurchaseDocument[]> {
    try {
      const q = query(
        this.collectionRef,
        where('videoId', '==', videoId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as VideoPurchaseDocument));
    } catch (error) {
      console.error('Error fetching video purchases:', error);
      throw new Error(`Failed to fetch video purchases: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if student has purchased a video
   */
  static async hasStudentPurchased(studentId: string, videoId: string): Promise<VideoPurchaseDocument | null> {
    try {
      const q = query(
        this.collectionRef,
        where('studentId', '==', studentId),
        where('videoId', '==', videoId),
        where('paymentStatus', '==', 'completed'),
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }
      
      const purchase = {
        id: querySnapshot.docs[0].id,
        ...querySnapshot.docs[0].data()
      } as VideoPurchaseDocument;
      
      // Check if access is still valid (not expired)
      if (purchase.accessExpiryDate && purchase.accessExpiryDate.toDate() <= new Date()) {
        return null; // Access expired
      }
      
      return purchase;
    } catch (error) {
      console.error('Error checking student purchase:', error);
      throw new Error(`Failed to check student purchase: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update purchase status (for payment processing)
   */
  static async updatePurchaseStatus(
    purchaseId: string, 
    status: 'pending' | 'completed' | 'failed' | 'refunded',
    additionalData?: Partial<VideoPurchaseUpdateData>
  ): Promise<void> {
    try {
      const docRef = doc(firestore, COLLECTION_NAME, purchaseId);
      
      const updateData: any = {
        paymentStatus: status,
        updatedAt: Timestamp.now(),
        ...additionalData
      };
      
      if (status === 'completed') {
        updateData.purchasedAt = Timestamp.now();
      }
      
      await updateDoc(docRef, updateData);
      console.log('Purchase status updated successfully');
    } catch (error) {
      console.error('Error updating purchase status:', error);
      throw new Error(`Failed to update purchase status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Record video access (increment view count)
   */
  static async recordVideoAccess(purchaseId: string): Promise<void> {
    try {
      const docRef = doc(firestore, COLLECTION_NAME, purchaseId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const currentViewCount = docSnap.data().viewCount || 0;
        
        await updateDoc(docRef, {
          viewCount: currentViewCount + 1,
          lastViewedAt: Timestamp.now(),
          accessedAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
      }
    } catch (error) {
      console.error('Error recording video access:', error);
      // Don't throw here to prevent breaking the user experience
    }
  }

  /**
   * Get purchase statistics for a teacher
   */
  static async getTeacherPurchaseStats(teacherId: string): Promise<{
    totalRevenue: number;
    totalPurchases: number;
    uniqueStudents: number;
    topVideos: Array<{ videoId: string; videoTitle: string; purchases: number; revenue: number; }>;
  }> {
    try {
      const q = query(
        this.collectionRef,
        where('teacherId', '==', teacherId),
        where('paymentStatus', '==', 'completed')
      );
      
      const querySnapshot = await getDocs(q);
      const purchases = querySnapshot.docs.map(doc => doc.data() as VideoPurchaseDocument);
      
      const totalRevenue = purchases.reduce((sum, purchase) => sum + purchase.amount, 0);
      const totalPurchases = purchases.length;
      const uniqueStudents = new Set(purchases.map(p => p.studentId)).size;
      
      // Group by video for top videos
      const videoStats = purchases.reduce((acc, purchase) => {
        if (!acc[purchase.videoId]) {
          acc[purchase.videoId] = {
            videoId: purchase.videoId,
            videoTitle: purchase.videoTitle,
            purchases: 0,
            revenue: 0
          };
        }
        acc[purchase.videoId].purchases++;
        acc[purchase.videoId].revenue += purchase.amount;
        return acc;
      }, {} as Record<string, any>);
      
      const topVideos = Object.values(videoStats)
        .sort((a: any, b: any) => b.revenue - a.revenue)
        .slice(0, 10);
      
      return {
        totalRevenue,
        totalPurchases,
        uniqueStudents,
        topVideos
      };
    } catch (error) {
      console.error('Error fetching teacher purchase stats:', error);
      throw new Error(`Failed to fetch teacher stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get student's completed purchases with access status
   */
  static async getStudentCompletedPurchases(studentId: string): Promise<VideoPurchaseDocument[]> {
    try {
      // Use a simpler query to avoid composite index requirement
      const q = query(
        this.collectionRef,
        where('studentId', '==', studentId),
        where('paymentStatus', '==', 'completed')
      );
      
      const querySnapshot = await getDocs(q);
      
      // Sort in memory to avoid composite index
      const purchases = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as VideoPurchaseDocument));
      
      // Sort by purchasedAt in descending order (most recent first)
      purchases.sort((a, b) => {
        const dateA = a.purchasedAt || a.createdAt;
        const dateB = b.purchasedAt || b.createdAt;
        return dateB.toMillis() - dateA.toMillis();
      });
      
      return purchases;
    } catch (error) {
      console.error('Error fetching student completed purchases:', error);
      throw new Error(`Failed to fetch completed purchases: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
