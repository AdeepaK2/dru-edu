import * as admin from 'firebase-admin';
import { getApps, cert } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getStorage, Storage } from 'firebase-admin/storage';
import { getDatabase, Database } from 'firebase-admin/database';
import { setDefaultTimezone, MELBOURNE_TIMEZONE } from './timezone';

// Set default timezone to Melbourne
setDefaultTimezone();

// Initialize Firebase Admin if not already initialized
function initializeFirebaseAdmin() {
  if (getApps().length === 0) {
    try {
      // Use environment variables instead of importing service account JSON
      const serviceAccount = {
        type: 'service_account',
        project_id: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_ADMIN_PRIVATE_KEY_ID,
        private_key: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_ADMIN_CLIENT_ID,
        auth_uri: 'https://accounts.google.com/o/oauth2/auth',
        token_uri: 'https://oauth2.googleapis.com/token',
        auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
        client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(
          process.env.FIREBASE_ADMIN_CLIENT_EMAIL || ''
        )}`
      };

      admin.initializeApp({
        credential: cert(serviceAccount as admin.ServiceAccount),
        databaseURL: 'https://dru-edu-default-rtdb.asia-southeast1.firebasedatabase.app',
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });
      console.log('Firebase Admin initialized successfully');
    } catch (error) {
      console.error('Firebase Admin initialization error:', error);
      throw error;
    }
  }
  return admin;
}

// Initialize services
const adminInstance = initializeFirebaseAdmin();
const db: Firestore = getFirestore();
const auth: Auth = getAuth();
const storage: Storage = getStorage();
const rtdb: Database = getDatabase();

// Firestore helpers
const firestore = {
  // Collection references
  collections: {
    users: db.collection('users'),
    courses: db.collection('courses'),
    lessons: db.collection('lessons'),
    // Add more collections as needed
  },
  
  // CRUD operations
  async getDoc<T extends Record<string, any>>(collection: string, id: string): Promise<T | null> {
    const doc = await db.collection(collection).doc(id).get();
    return doc.exists ? (doc.data() as T) : null;
  },
  
  async addDoc<T extends Record<string, any>>(collection: string, data: T): Promise<string> {
    const docRef = await db.collection(collection).add(data);
    return docRef.id;
  },
  
  async setDoc<T extends Record<string, any>>(collection: string, id: string, data: T): Promise<void> {
    await db.collection(collection).doc(id).set(data);
  },
  
  async updateDoc<T extends Record<string, any>>(collection: string, id: string, data: Partial<T>): Promise<void> {
    await db.collection(collection).doc(id).update(data);
  },
  
  async deleteDoc(collection: string, id: string): Promise<void> {
    await db.collection(collection).doc(id).delete();
  },
  
  async query<T extends Record<string, any>>(collection: string, fieldPath: string, operator: admin.firestore.WhereFilterOp, value: any): Promise<T[]> {
    const snapshot = await db.collection(collection).where(fieldPath, operator, value).get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as T));
  }
};

// Authentication helpers
const authentication = {
  async createUser(email: string, password: string, displayName?: string): Promise<admin.auth.UserRecord> {
    return await auth.createUser({
      email,
      password,
      displayName
    });
  },
  
  async getUser(uid: string): Promise<admin.auth.UserRecord> {
    return await auth.getUser(uid);
  },
  
  async getUserByEmail(email: string): Promise<admin.auth.UserRecord> {
    return await auth.getUserByEmail(email);
  },
  
  async updateUser(uid: string, properties: admin.auth.UpdateRequest): Promise<admin.auth.UserRecord> {
    return await auth.updateUser(uid, properties);
  },
  
  async deleteUser(uid: string): Promise<void> {
    return await auth.deleteUser(uid);
  },
  
  async verifyToken(token: string): Promise<admin.auth.DecodedIdToken> {
    return await auth.verifyIdToken(token);
  },
  
  async setCustomClaims(uid: string, claims: object): Promise<void> {
    return await auth.setCustomUserClaims(uid, claims);
  }
};

// Storage helpers
const fileStorage = {
  bucket: storage.bucket(),
  
  getFileUrl(filePath: string): string {
    return `https://storage.googleapis.com/${process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET}/${filePath}`;
  },
  
  async uploadFile(filePath: string, content: Buffer, metadata?: any): Promise<void> {
    const file = storage.bucket().file(filePath);
    await file.save(content, { metadata });
  },
  
  async getFile(filePath: string): Promise<Buffer> {
    const [content] = await storage.bucket().file(filePath).download();
    return content;
  },
  
  async deleteFile(filePath: string): Promise<void> {
    await storage.bucket().file(filePath).delete();
  },
  
  async getDownloadUrl(filePath: string): Promise<string> {
    const [url] = await storage.bucket().file(filePath).getSignedUrl({
      action: 'read',
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
    });
    return url;
  }
};

// Realtime Database helpers
const realtimeDb = {
  ref: (path: string) => rtdb.ref(path),
  
  async getData(path: string): Promise<any> {
    const snapshot = await rtdb.ref(path).once('value');
    return snapshot.val();
  },
  
  async setData(path: string, data: any): Promise<void> {
    await rtdb.ref(path).set(data);
  },
  
  async updateData(path: string, data: any): Promise<void> {
    await rtdb.ref(path).update(data);
  },
  
  async pushData(path: string, data: any): Promise<string> {
    const ref = await rtdb.ref(path).push(data);
    return ref.key as string;
  },
  
  async removeData(path: string): Promise<void> {
    await rtdb.ref(path).remove();
  }
};

// Export the Firebase server instance
export const firebaseAdmin = {
  admin: adminInstance,
  db,
  auth,
  storage,
  rtdb,
  firestore,
  authentication,
  fileStorage,
  realtimeDb
};

export default firebaseAdmin;