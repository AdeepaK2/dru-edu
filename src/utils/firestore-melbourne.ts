import { 
  doc, 
  collection, 
  addDoc, 
  updateDoc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  DocumentReference,
  CollectionReference,
  Query,
  Timestamp
} from 'firebase/firestore';
import { firestore } from './firebase-client';

const MELBOURNE_TIMEZONE = 'Australia/Melbourne';

// Helper functions for Melbourne timezone
const createMelbourneFirestoreTimestamp = () => {
  return Timestamp.now();
};

const formatFirestoreTimestamp = (timestamp: any) => {
  if (!timestamp) return null;
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleString('en-AU', {
    timeZone: MELBOURNE_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

// Helper to add Melbourne timezone metadata to documents
const addTimezoneMetadata = (data: any) => {
  const now = createMelbourneFirestoreTimestamp();
  return {
    ...data,
    createdAt: now,
    updatedAt: now,
    timezone: 'Australia/Melbourne'
  };
};

// Helper to update Melbourne timezone metadata
const updateTimezoneMetadata = (data: any) => {
  return {
    ...data,
    updatedAt: createMelbourneFirestoreTimestamp(),
    timezone: 'Australia/Melbourne'
  };
};

// Enhanced Firestore operations with Melbourne timezone
export const firestoreWithTimezone = {
  // Add document with Melbourne timezone
  async addDoc(collectionName: string, data: any) {
    const collectionRef = collection(firestore, collectionName);
    return await addDoc(collectionRef, addTimezoneMetadata(data));
  },

  // Set document with Melbourne timezone
  async setDoc(collectionName: string, docId: string, data: any) {
    const docRef = doc(firestore, collectionName, docId);
    return await setDoc(docRef, addTimezoneMetadata(data));
  },

  // Update document with Melbourne timezone
  async updateDoc(collectionName: string, docId: string, data: any) {
    const docRef = doc(firestore, collectionName, docId);
    return await updateDoc(docRef, updateTimezoneMetadata(data));
  },

  // Get document and format timestamps for Melbourne display
  async getDoc(collectionName: string, docId: string) {
    const docRef = doc(firestore, collectionName, docId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        // Format timestamps for display
        createdAtDisplay: data.createdAt ? formatFirestoreTimestamp(data.createdAt) : null,
        updatedAtDisplay: data.updatedAt ? formatFirestoreTimestamp(data.updatedAt) : null,
      };
    }
    return null;
  },

  // Get multiple documents with formatted timestamps
  async getDocs(collectionName: string, constraints: any[] = []) {
    let q: Query = collection(firestore, collectionName);
    
    // Apply query constraints if provided
    if (constraints.length > 0) {
      q = query(q, ...constraints);
    }
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Format timestamps for display
        createdAtDisplay: data.createdAt ? formatFirestoreTimestamp(data.createdAt) : null,
        updatedAtDisplay: data.updatedAt ? formatFirestoreTimestamp(data.updatedAt) : null,
      };
    });
  },

  // Query helpers with Melbourne timezone ordering
  orderByCreatedAt: () => orderBy('createdAt', 'desc'),
  orderByUpdatedAt: () => orderBy('updatedAt', 'desc'),
  
  // Where clauses for date ranges in Melbourne time
  whereCreatedAfter: (date: Date) => where('createdAt', '>=', date),
  whereCreatedBefore: (date: Date) => where('createdAt', '<=', date),
  whereUpdatedAfter: (date: Date) => where('updatedAt', '>=', date),
  whereUpdatedBefore: (date: Date) => where('updatedAt', '<=', date),
};

// Export commonly used Firestore functions for convenience
export { where, orderBy, limit } from 'firebase/firestore';
