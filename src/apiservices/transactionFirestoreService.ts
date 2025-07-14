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
import { 
  TransactionData, 
  TransactionDocument, 
  TransactionUpdateData, 
  transactionSchema 
} from '@/models/transactionSchema';

const COLLECTION_NAME = 'transactions';

export class TransactionFirestoreService {
  private static collectionRef = collection(firestore, COLLECTION_NAME);

  /**
   * Generate a unique transaction ID
   */
  private static async generateTransactionId(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `TRX-${year}-`;
    
    // Query existing transactions to find the highest number for this year
    const q = query(
      this.collectionRef,
      where('transactionId', '>=', prefix),
      where('transactionId', '<', `TRX-${year + 1}-`),
      orderBy('transactionId', 'desc')
    );
    
    const snapshot = await getDocs(q);
    
    let nextNumber = 1;
    if (!snapshot.empty) {
      const lastTransactionId = snapshot.docs[0].data().transactionId;
      const lastNumber = parseInt(lastTransactionId.split('-')[2]);
      nextNumber = lastNumber + 1;
    }
    
    return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
  }

  /**
   * Create a new transaction
   */
  static async createTransaction(transactionData: TransactionData): Promise<string> {
    try {
      // Validate the data
      const validatedData = transactionSchema.parse(transactionData);
      
      // Generate auto transaction ID
      const transactionId = await this.generateTransactionId();
      
      // Prepare the document data, filtering out undefined values
      const documentData: any = {
        studentId: validatedData.studentId,
        studentName: validatedData.studentName,
        type: validatedData.type,
        itemId: validatedData.itemId,
        itemName: validatedData.itemName,
        amount: validatedData.amount,
        currency: validatedData.currency,
        paymentMethod: validatedData.paymentMethod,
        status: validatedData.status,
        transactionId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      // Only add optional fields if they have values
      if (validatedData.description && validatedData.description.trim()) {
        documentData.description = validatedData.description;
      }
      
      if (validatedData.metadata) {
        documentData.metadata = validatedData.metadata;
      }

      const docRef = await addDoc(this.collectionRef, documentData);
      console.log('Transaction created with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw new Error(`Failed to create transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all transactions
   */
  static async getAllTransactions(): Promise<TransactionDocument[]> {
    try {
      const q = query(this.collectionRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as TransactionDocument));
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw new Error(`Failed to fetch transactions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get a specific transaction by ID
   */
  static async getTransactionById(transactionId: string): Promise<TransactionDocument | null> {
    try {
      const docRef = doc(firestore, COLLECTION_NAME, transactionId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        } as TransactionDocument;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching transaction:', error);
      throw new Error(`Failed to fetch transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update a transaction
   */
  static async updateTransaction(transactionId: string, updateData: Partial<TransactionData>): Promise<void> {
    try {
      const docRef = doc(firestore, COLLECTION_NAME, transactionId);
      
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

      // Add special timestamps based on status changes
      if (updateData.status === 'completed' && !cleanUpdateData.processedAt) {
        cleanUpdateData.processedAt = Timestamp.now();
      }
      
      if (updateData.status === 'refunded' && !cleanUpdateData.refundedAt) {
        cleanUpdateData.refundedAt = Timestamp.now();
      }

      await updateDoc(docRef, cleanUpdateData);
      console.log('Transaction updated successfully');
    } catch (error) {
      console.error('Error updating transaction:', error);
      throw new Error(`Failed to update transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete a transaction
   */
  static async deleteTransaction(transactionId: string): Promise<void> {
    try {
      const docRef = doc(firestore, COLLECTION_NAME, transactionId);
      await deleteDoc(docRef);
      console.log('Transaction deleted successfully');
    } catch (error) {
      console.error('Error deleting transaction:', error);
      throw new Error(`Failed to delete transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Subscribe to real-time updates for all transactions
   */
  static subscribeToTransactions(
    onSuccess: (transactions: TransactionDocument[]) => void,
    onError: (error: Error) => void
  ): () => void {
    try {
      const q = query(this.collectionRef, orderBy('createdAt', 'desc'));
      
      const unsubscribe = onSnapshot(q, 
        (querySnapshot: QuerySnapshot<DocumentData>) => {
          const transactions = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as TransactionDocument));
          onSuccess(transactions);
        },
        (error) => {
          console.error('Error in transactions subscription:', error);
          onError(error);
        }
      );

      return unsubscribe;
    } catch (error) {
      console.error('Error setting up transactions subscription:', error);
      onError(error as Error);
      return () => {};
    }
  }

  /**
   * Get transactions by student ID
   */
  static async getTransactionsByStudent(studentId: string): Promise<TransactionDocument[]> {
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
      } as TransactionDocument));
    } catch (error) {
      console.error('Error fetching student transactions:', error);
      throw new Error(`Failed to fetch student transactions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get transactions by type
   */
  static async getTransactionsByType(type: 'video_purchase' | 'class_enrollment' | 'refund'): Promise<TransactionDocument[]> {
    try {
      const q = query(
        this.collectionRef, 
        where('type', '==', type),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as TransactionDocument));
    } catch (error) {
      console.error('Error fetching transactions by type:', error);
      throw new Error(`Failed to fetch transactions by type: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get transactions by status
   */
  static async getTransactionsByStatus(status: 'pending' | 'completed' | 'failed' | 'refunded'): Promise<TransactionDocument[]> {
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
      } as TransactionDocument));
    } catch (error) {
      console.error('Error fetching transactions by status:', error);
      throw new Error(`Failed to fetch transactions by status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get transactions within date range
   */
  static async getTransactionsByDateRange(startDate: Date, endDate: Date): Promise<TransactionDocument[]> {
    try {
      const q = query(
        this.collectionRef,
        where('createdAt', '>=', Timestamp.fromDate(startDate)),
        where('createdAt', '<=', Timestamp.fromDate(endDate)),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as TransactionDocument));
    } catch (error) {
      console.error('Error fetching transactions by date range:', error);
      throw new Error(`Failed to fetch transactions by date range: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get revenue statistics
   */
  static async getRevenueStats(): Promise<{
    totalRevenue: number;
    totalRefunds: number;
    netRevenue: number;
    videoSales: number;
    classSales: number;
    pendingAmount: number;
  }> {
    try {
      const transactions = await this.getAllTransactions();
      
      let totalRevenue = 0;
      let totalRefunds = 0;
      let videoSales = 0;
      let classSales = 0;
      let pendingAmount = 0;

      transactions.forEach(transaction => {
        if (transaction.status === 'completed') {
          if (transaction.type === 'refund') {
            totalRefunds += transaction.amount;
          } else {
            totalRevenue += transaction.amount;
            
            if (transaction.type === 'video_purchase') {
              videoSales += transaction.amount;
            } else if (transaction.type === 'class_enrollment') {
              classSales += transaction.amount;
            }
          }
        } else if (transaction.status === 'pending') {
          pendingAmount += transaction.amount;
        }
      });

      return {
        totalRevenue,
        totalRefunds,
        netRevenue: totalRevenue - totalRefunds,
        videoSales,
        classSales,
        pendingAmount
      };
    } catch (error) {
      console.error('Error calculating revenue stats:', error);
      throw new Error(`Failed to calculate revenue stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
