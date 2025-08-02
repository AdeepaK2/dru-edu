import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  writeBatch,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { firestore } from '@/utils/firebase-client';
import { 
  AdminMeetingLink, 
  MeetingLinkAssignment, 
  MeetingLinkPoolConfig,
  MeetingLinkAnalytics,
  adminMeetingLinkSchema,
  meetingLinkAssignmentSchema,
  meetingLinkPoolConfigSchema,
  meetingLinkAnalyticsSchema,
  createMeetingLinkId,
  createAssignmentId
} from '../models/adminMeetingSchema';

// Collections
const MEETING_LINKS_COLLECTION = 'meetingLinks';
const MEETING_ASSIGNMENTS_COLLECTION = 'meetingAssignments';
const MEETING_POOL_CONFIG_COLLECTION = 'meetingPoolConfig';
const MEETING_ANALYTICS_COLLECTION = 'meetingAnalytics';

// Admin Meeting Link Service
export class AdminMeetingLinkService {
  // Create a new meeting link
  static async createMeetingLink(linkData: Omit<AdminMeetingLink, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const id = createMeetingLinkId();
      const meetingLink: AdminMeetingLink = {
        ...linkData,
        id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Validate data
      const validatedData = adminMeetingLinkSchema.parse(meetingLink);
      
      // Convert dates to Firestore timestamps
      const firestoreData = {
        ...validatedData,
        createdAt: Timestamp.fromDate(validatedData.createdAt),
        updatedAt: Timestamp.fromDate(validatedData.updatedAt),
      };

      await addDoc(collection(firestore, MEETING_LINKS_COLLECTION), firestoreData);
      return id;
    } catch (error) {
      console.error('Error creating meeting link:', error);
      throw new Error('Failed to create meeting link');
    }
  }

  // Get all meeting links
  static async getAllMeetingLinks(): Promise<AdminMeetingLink[]> {
    try {
      const q = query(
        collection(firestore, MEETING_LINKS_COLLECTION),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as AdminMeetingLink;
      });
    } catch (error) {
      console.error('Error fetching meeting links:', error);
      throw new Error('Failed to fetch meeting links');
    }
  }

  // Get active meeting links only
  static async getActiveMeetingLinks(): Promise<AdminMeetingLink[]> {
    try {
      // Use simple query to avoid index requirements
      const q = query(
        collection(firestore, MEETING_LINKS_COLLECTION),
        where('isActive', '==', true)
      );
      
      const querySnapshot = await getDocs(q);
      let links = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as AdminMeetingLink;
      });

      // Sort by usage count in JavaScript to avoid index requirements
      links.sort((a, b) => (a.usageCount || 0) - (b.usageCount || 0));

      return links;
    } catch (error) {
      console.error('Error fetching active meeting links:', error);
      throw new Error('Failed to fetch active meeting links');
    }
  }

  // Get meeting link by ID
  static async getMeetingLinkById(id: string): Promise<AdminMeetingLink | null> {
    try {
      const q = query(
        collection(firestore, MEETING_LINKS_COLLECTION),
        where('id', '==', id)
      );
      
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) return null;

      const doc = querySnapshot.docs[0];
      const data = doc.data();
      
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as AdminMeetingLink;
    } catch (error) {
      console.error('Error fetching meeting link:', error);
      throw new Error('Failed to fetch meeting link');
    }
  }

  // Update meeting link
  static async updateMeetingLink(id: string, updates: Partial<AdminMeetingLink>): Promise<void> {
    try {
      const q = query(
        collection(firestore, MEETING_LINKS_COLLECTION),
        where('id', '==', id)
      );
      
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        throw new Error('Meeting link not found');
      }

      const docRef = querySnapshot.docs[0].ref;
      const updateData = {
        ...updates,
        updatedAt: Timestamp.fromDate(new Date()),
      };

      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error('Error updating meeting link:', error);
      throw new Error('Failed to update meeting link');
    }
  }

  // Delete meeting link
  static async deleteMeetingLink(id: string): Promise<void> {
    try {
      const q = query(
        collection(firestore, MEETING_LINKS_COLLECTION),
        where('id', '==', id)
      );
      
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        throw new Error('Meeting link not found');
      }

      await deleteDoc(querySnapshot.docs[0].ref);
    } catch (error) {
      console.error('Error deleting meeting link:', error);
      throw new Error('Failed to delete meeting link');
    }
  }

  // Increment usage count
  static async incrementUsage(id: string): Promise<void> {
    try {
      const q = query(
        collection(firestore, MEETING_LINKS_COLLECTION),
        where('id', '==', id)
      );
      
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        throw new Error('Meeting link not found');
      }

      const doc = querySnapshot.docs[0];
      const currentUsage = doc.data().usageCount || 0;
      
      await updateDoc(doc.ref, {
        usageCount: currentUsage + 1,
        updatedAt: Timestamp.fromDate(new Date()),
      });
    } catch (error) {
      console.error('Error incrementing usage:', error);
      throw new Error('Failed to increment usage');
    }
  }

  // Toggle active status
  static async toggleActiveStatus(id: string): Promise<void> {
    try {
      const q = query(
        collection(firestore, MEETING_LINKS_COLLECTION),
        where('id', '==', id)
      );
      
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        throw new Error('Meeting link not found');
      }

      const doc = querySnapshot.docs[0];
      const currentStatus = doc.data().isActive;
      
      await updateDoc(doc.ref, {
        isActive: !currentStatus,
        updatedAt: Timestamp.fromDate(new Date()),
      });
    } catch (error) {
      console.error('Error toggling active status:', error);
      throw new Error('Failed to toggle active status');
    }
  }

  // Real-time listener for meeting links
  static subscribeToMeetingLinks(callback: (links: AdminMeetingLink[]) => void): Unsubscribe {
    const q = query(
      collection(firestore, MEETING_LINKS_COLLECTION),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (querySnapshot) => {
      const links = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as AdminMeetingLink;
      });
      callback(links);
    });
  }
}

// Meeting Link Assignment Service
export class MeetingLinkAssignmentService {
  // Create assignment
  static async createAssignment(
    linkId: string, 
    teacherId: string, 
    studentId: string, 
    bookingId: string,
    scheduledStart: Date,
    scheduledEnd: Date
  ): Promise<string> {
    try {
      const id = createAssignmentId();
      const assignment: MeetingLinkAssignment = {
        id,
        linkId,
        teacherId,
        studentId,
        bookingId,
        assignedAt: new Date(),
        scheduledStart,
        scheduledEnd,
        status: 'assigned',
      };

      const validatedData = meetingLinkAssignmentSchema.parse(assignment);
      
      const firestoreData = {
        ...validatedData,
        assignedAt: Timestamp.fromDate(validatedData.assignedAt),
        scheduledStart: Timestamp.fromDate(validatedData.scheduledStart),
        scheduledEnd: Timestamp.fromDate(validatedData.scheduledEnd),
        actualStartTime: validatedData.actualStartTime ? Timestamp.fromDate(validatedData.actualStartTime) : null,
        actualEndTime: validatedData.actualEndTime ? Timestamp.fromDate(validatedData.actualEndTime) : null,
      };

      await addDoc(collection(firestore, MEETING_ASSIGNMENTS_COLLECTION), firestoreData);
      
      // Increment usage count for the link
      await AdminMeetingLinkService.incrementUsage(linkId);
      
      return id;
    } catch (error) {
      console.error('Error creating assignment:', error);
      throw new Error('Failed to create assignment');
    }
  }

  // Get assignments for a meeting link
  static async getAssignmentsForLink(linkId: string): Promise<MeetingLinkAssignment[]> {
    try {
      // Use simple query to avoid index requirements
      const q = query(
        collection(firestore, MEETING_ASSIGNMENTS_COLLECTION),
        where('linkId', '==', linkId)
      );
      
      const querySnapshot = await getDocs(q);
      let assignments = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          assignedAt: data.assignedAt?.toDate() || new Date(),
          scheduledStart: data.scheduledStart?.toDate() || new Date(),
          scheduledEnd: data.scheduledEnd?.toDate() || new Date(),
          actualStartTime: data.actualStartTime?.toDate(),
          actualEndTime: data.actualEndTime?.toDate(),
        } as MeetingLinkAssignment;
      });

      // Sort by scheduledStart in JavaScript to avoid index requirements
      assignments.sort((a, b) => b.scheduledStart.getTime() - a.scheduledStart.getTime());

      return assignments;
    } catch (error) {
      console.error('Error fetching assignments:', error);
      throw new Error('Failed to fetch assignments');
    }
  }

  // Update assignment status
  static async updateAssignmentStatus(id: string, status: MeetingLinkAssignment['status']): Promise<void> {
    try {
      const q = query(
        collection(firestore, MEETING_ASSIGNMENTS_COLLECTION),
        where('id', '==', id)
      );
      
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        throw new Error('Assignment not found');
      }

      await updateDoc(querySnapshot.docs[0].ref, {
        status,
        updatedAt: Timestamp.fromDate(new Date()),
      });
    } catch (error) {
      console.error('Error updating assignment status:', error);
      throw new Error('Failed to update assignment status');
    }
  }

  // Get optimal meeting link for assignment (least used active link)
  static async getOptimalMeetingLink(): Promise<AdminMeetingLink | null> {
    try {
      const activeLinks = await AdminMeetingLinkService.getActiveMeetingLinks();
      
      if (activeLinks.length === 0) {
        return null;
      }

      // Return the link with least usage
      return activeLinks.reduce((prev, current) => 
        prev.usageCount < current.usageCount ? prev : current
      );
    } catch (error) {
      console.error('Error getting optimal meeting link:', error);
      throw new Error('Failed to get optimal meeting link');
    }
  }
}

// Meeting Link Pool Configuration Service
export class MeetingLinkPoolConfigService {
  // Get or create default configuration
  static async getConfiguration(): Promise<MeetingLinkPoolConfig> {
    try {
      const q = query(collection(firestore, MEETING_POOL_CONFIG_COLLECTION), limit(1));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const data = querySnapshot.docs[0].data();
        return {
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as MeetingLinkPoolConfig;
      }

      // Create default configuration
      const defaultConfig: MeetingLinkPoolConfig = {
        id: 'default',
        assignmentStrategy: 'least-used',
        enableAutoAssignment: true,
        maxConcurrentMeetingsPerLink: 1,
        bufferTimeMinutes: 5,
        enableLinkRotation: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const firestoreData = {
        ...defaultConfig,
        createdAt: Timestamp.fromDate(defaultConfig.createdAt),
        updatedAt: Timestamp.fromDate(defaultConfig.updatedAt),
      };

      await addDoc(collection(firestore, MEETING_POOL_CONFIG_COLLECTION), firestoreData);
      return defaultConfig;
    } catch (error) {
      console.error('Error getting configuration:', error);
      throw new Error('Failed to get configuration');
    }
  }

  // Update configuration
  static async updateConfiguration(updates: Partial<MeetingLinkPoolConfig>): Promise<void> {
    try {
      const q = query(collection(firestore, MEETING_POOL_CONFIG_COLLECTION), limit(1));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        // Create new configuration if none exists
        await this.getConfiguration();
        return this.updateConfiguration(updates);
      }

      const docRef = querySnapshot.docs[0].ref;
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.fromDate(new Date()),
      });
    } catch (error) {
      console.error('Error updating configuration:', error);
      throw new Error('Failed to update configuration');
    }
  }
}
