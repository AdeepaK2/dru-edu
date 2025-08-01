/**
 * Server-side Video Purchase Service using Firebase Admin SDK
 * Used for webhook handlers and other server-side operations
 */

import { firebaseAdmin } from '@/utils/firebase-server';
import { Timestamp } from 'firebase-admin/firestore';

const COLLECTION_NAME = 'videoPurchases';

export interface VideoPurchaseUpdateData {
  paymentStatus?: 'pending' | 'completed' | 'failed' | 'refunded';
  purchasedAt?: Timestamp;
  transactionId?: string;
  refundId?: string;
  metadata?: any;
}

export class VideoPurchaseServerService {
  /**
   * Update purchase status (for payment processing) - Server-side version
   */
  static async updatePurchaseStatus(
    purchaseId: string, 
    status: 'pending' | 'completed' | 'failed' | 'refunded',
    additionalData?: Partial<VideoPurchaseUpdateData>
  ): Promise<void> {
    try {
      const updateData: any = {
        paymentStatus: status,
        updatedAt: Timestamp.now(),
        ...additionalData
      };
      
      if (status === 'completed') {
        updateData.purchasedAt = Timestamp.now();
      }
      
      await firebaseAdmin.firestore.updateDoc(COLLECTION_NAME, purchaseId, updateData);
      console.log(`✅ Purchase status updated successfully: ${purchaseId} -> ${status}`);
    } catch (error) {
      console.error('Error updating purchase status:', error);
      throw new Error(`Failed to update purchase status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get purchase by ID - Server-side version
   */
  static async getPurchaseById(purchaseId: string): Promise<any | null> {
    try {
      const purchase = await firebaseAdmin.firestore.getDoc(COLLECTION_NAME, purchaseId);
      return purchase ? { id: purchaseId, ...purchase } : null;
    } catch (error) {
      console.error('Error fetching video purchase:', error);
      throw new Error(`Failed to fetch video purchase: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create a new video purchase record - Server-side version
   */
  static async createPurchase(purchaseData: any): Promise<string> {
    try {
      const documentData = {
        ...purchaseData,
        viewCount: 0,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const docId = await firebaseAdmin.firestore.addDoc(COLLECTION_NAME, documentData);
      console.log(`✅ Purchase created successfully: ${docId}`);
      return docId;
    } catch (error) {
      console.error('Error creating video purchase:', error);
      throw new Error(`Failed to create video purchase: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get purchases by teacher ID for earnings calculation
   */
  static async getPurchasesByTeacher(teacherId: string): Promise<any[]> {
    try {
      const purchases = await firebaseAdmin.firestore.query(COLLECTION_NAME, 'teacherId', '==', teacherId);
      // Filter completed purchases
      return purchases.filter((purchase: any) => purchase.paymentStatus === 'completed');
    } catch (error) {
      console.error('Error fetching teacher purchases:', error);
      throw new Error(`Failed to fetch teacher purchases: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Record video access (increment view count) - Server-side version
   */
  static async recordVideoAccess(purchaseId: string): Promise<void> {
    try {
      const purchase = await firebaseAdmin.firestore.getDoc(COLLECTION_NAME, purchaseId);
      
      if (purchase) {
        const currentViewCount = purchase.viewCount || 0;
        
        await firebaseAdmin.firestore.updateDoc(COLLECTION_NAME, purchaseId, {
          viewCount: currentViewCount + 1,
          lastViewedAt: Timestamp.now(),
          accessedAt: Timestamp.now(),
        });
        
        console.log(`✅ Video access recorded: ${purchaseId}`);
      }
    } catch (error) {
      console.error('Error recording video access:', error);
      throw new Error(`Failed to record video access: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
