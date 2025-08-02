import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  Timestamp,
  writeBatch,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { firestore } from '@/utils/firebase-client';
import {
  TeacherAvailability,
  TimeSlot,
  MeetingBooking,
  MeetingFeedback,
  MeetingSettings,
} from '@/models/meetingSchema';
import { AdminMeetingLink } from '@/models/adminMeetingSchema';
import { 
  AdminMeetingLinkService, 
  MeetingLinkAssignmentService 
} from './adminMeetingLinkService';

// Collection names
const COLLECTIONS = {
  TEACHER_AVAILABILITY: 'teacherAvailability',
  TIME_SLOTS: 'timeSlots',
  MEETING_BOOKINGS: 'meetingBookings',
  MEETING_FEEDBACK: 'meetingFeedback',
  MEETING_SETTINGS: 'meetingSettings',
} as const;

// Utility function to convert Firestore timestamp to Date
const convertTimestamp = (timestamp: any): Date => {
  if (timestamp?.toDate) {
    return timestamp.toDate();
  }
  if (timestamp instanceof Date) {
    return timestamp;
  }
  return new Date(timestamp);
};

// Teacher Availability Services
export class TeacherAvailabilityService {
  // Create new availability slot
  static async createAvailability(availability: Omit<TeacherAvailability, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(firestore, COLLECTIONS.TEACHER_AVAILABILITY), {
        ...availability,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating availability:', error);
      throw error;
    }
  }

  // Get teacher's availability slots
  static async getTeacherAvailability(teacherId: string): Promise<TeacherAvailability[]> {
    try {
      // Use simple query to avoid index requirements
      const q = query(
        collection(firestore, COLLECTIONS.TEACHER_AVAILABILITY),
        where('teacherId', '==', teacherId),
        where('isActive', '==', true)
      );
      
      const querySnapshot = await getDocs(q);
      let availability = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: convertTimestamp(doc.data().createdAt),
        updatedAt: convertTimestamp(doc.data().updatedAt),
      })) as TeacherAvailability[];

      // Sort in JavaScript to avoid index requirements
      availability.sort((a, b) => {
        // First sort by date (ascending)
        if (a.date !== b.date) {
          return a.date.localeCompare(b.date);
        }
        // Then sort by start time (ascending)
        return a.startTime.localeCompare(b.startTime);
      });

      return availability;
    } catch (error) {
      console.error('Error getting teacher availability:', error);
      throw error;
    }
  }

  // Update availability slot
  static async updateAvailability(id: string, updates: Partial<TeacherAvailability>): Promise<void> {
    try {
      const docRef = doc(firestore, COLLECTIONS.TEACHER_AVAILABILITY, id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating availability:', error);
      throw error;
    }
  }

  // Delete availability slot
  static async deleteAvailability(id: string): Promise<void> {
    try {
      await deleteDoc(doc(firestore, COLLECTIONS.TEACHER_AVAILABILITY, id));
    } catch (error) {
      console.error('Error deleting availability:', error);
      throw error;
    }
  }

  // Get availability by date range
  static async getAvailabilityByDateRange(teacherId: string, startDate: string, endDate: string): Promise<TeacherAvailability[]> {
    try {
      // Use simple query to avoid index requirements
      const q = query(
        collection(firestore, COLLECTIONS.TEACHER_AVAILABILITY),
        where('teacherId', '==', teacherId),
        where('isActive', '==', true)
      );
      
      const querySnapshot = await getDocs(q);
      let availability = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: convertTimestamp(doc.data().createdAt),
        updatedAt: convertTimestamp(doc.data().updatedAt),
      })) as TeacherAvailability[];

      // Filter by date range in JavaScript
      availability = availability.filter(slot => 
        slot.date >= startDate && slot.date <= endDate
      );

      // Sort in JavaScript to avoid index requirements
      availability.sort((a, b) => {
        // First sort by date (ascending)
        if (a.date !== b.date) {
          return a.date.localeCompare(b.date);
        }
        // Then sort by start time (ascending)
        return a.startTime.localeCompare(b.startTime);
      });

      return availability;
    } catch (error) {
      console.error('Error getting availability by date range:', error);
      throw error;
    }
  }
}

// Time Slot Services
export class TimeSlotService {
  // Generate time slots from availability
  static generateTimeSlots(availability: TeacherAvailability): Omit<TimeSlot, 'id' | 'createdAt' | 'updatedAt'>[] {
    const slots: Omit<TimeSlot, 'id' | 'createdAt' | 'updatedAt'>[] = [];
    const start = new Date(`${availability.date}T${availability.startTime}`);
    const end = new Date(`${availability.date}T${availability.endTime}`);
    
    while (start < end) {
      const slotEnd = new Date(start.getTime() + availability.slotDuration * 60000);
      if (slotEnd <= end) {
        slots.push({
          availabilityId: availability.id,
          teacherId: availability.teacherId,
          teacherName: availability.teacherName,
          teacherSubjects: availability.teacherSubjects,
          day: availability.day,
          date: availability.date,
          startTime: start.toTimeString().slice(0, 5),
          endTime: slotEnd.toTimeString().slice(0, 5),
          duration: availability.slotDuration,
          isBooked: false,
          meetingLink: availability.meetingLink,
          status: 'available',
        });
      }
      start.setTime(start.getTime() + availability.slotDuration * 60000);
    }
    
    return slots;
  }

  // Create time slots from availability
  static async createTimeSlotsFromAvailability(availability: TeacherAvailability): Promise<string[]> {
    try {
      const slots = this.generateTimeSlots(availability);
      const batch = writeBatch(firestore);
      const slotIds: string[] = [];

      slots.forEach(slot => {
        const docRef = doc(collection(firestore, COLLECTIONS.TIME_SLOTS));
        batch.set(docRef, {
          ...slot,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
        slotIds.push(docRef.id);
      });

      await batch.commit();
      return slotIds;
    } catch (error) {
      console.error('Error creating time slots:', error);
      throw error;
    }
  }

  // Get available time slots
  static async getAvailableSlots(filters?: {
    teacherId?: string;
    subject?: string;
    date?: string;
    dateRange?: { start: string; end: string };
  }): Promise<TimeSlot[]> {
    try {
      // Use a simpler query to avoid index requirements
      let q = query(
        collection(firestore, COLLECTIONS.TIME_SLOTS),
        where('isBooked', '==', false)
      );

      // Add teacher filter if provided
      if (filters?.teacherId) {
        q = query(q, where('teacherId', '==', filters.teacherId));
      }

      // Add date filter if provided (single date)
      if (filters?.date) {
        q = query(q, where('date', '==', filters.date));
      }

      const querySnapshot = await getDocs(q);
      let slots = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: convertTimestamp(doc.data().createdAt),
        updatedAt: convertTimestamp(doc.data().updatedAt),
      })) as TimeSlot[];

      // Filter results in JavaScript to avoid complex index requirements
      slots = slots.filter(slot => {
        // Filter by status
        if (slot.status !== 'available') return false;

        // Filter by date range if provided
        if (filters?.dateRange) {
          const slotDate = slot.date;
          if (slotDate < filters.dateRange.start || slotDate > filters.dateRange.end) {
            return false;
          }
        }

        // Filter by subject if provided
        if (filters?.subject && !slot.teacherSubjects.includes(filters.subject)) {
          return false;
        }

        return true;
      });

      // Sort results in JavaScript
      slots.sort((a, b) => {
        // First sort by date
        if (a.date !== b.date) {
          return a.date.localeCompare(b.date);
        }
        // Then sort by start time
        return a.startTime.localeCompare(b.startTime);
      });

      return slots;
    } catch (error) {
      console.error('Error getting available slots:', error);
      throw error;
    }
  }

  // Simple method to get all available slots without complex filtering
  static async getAllAvailableSlots(): Promise<TimeSlot[]> {
    try {
      const q = query(
        collection(firestore, COLLECTIONS.TIME_SLOTS),
        where('isBooked', '==', false)
      );

      const querySnapshot = await getDocs(q);
      let slots = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: convertTimestamp(doc.data().createdAt),
        updatedAt: convertTimestamp(doc.data().updatedAt),
      })) as TimeSlot[];

      // Filter by status and sort in JavaScript
      slots = slots
        .filter(slot => slot.status === 'available')
        .sort((a, b) => {
          if (a.date !== b.date) {
            return a.date.localeCompare(b.date);
          }
          return a.startTime.localeCompare(b.startTime);
        });

      return slots;
    } catch (error) {
      console.error('Error getting all available slots:', error);
      throw error;
    }
  }

  // Book a time slot
  static async bookTimeSlot(slotId: string, studentId: string, studentName: string): Promise<void> {
    try {
      const docRef = doc(firestore, COLLECTIONS.TIME_SLOTS, slotId);
      await updateDoc(docRef, {
        isBooked: true,
        studentId,
        studentName,
        status: 'booked',
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error booking time slot:', error);
      throw error;
    }
  }

  // Cancel booking
  static async cancelBooking(slotId: string): Promise<void> {
    try {
      const docRef = doc(firestore, COLLECTIONS.TIME_SLOTS, slotId);
      await updateDoc(docRef, {
        isBooked: false,
        studentId: null,
        studentName: null,
        status: 'available',
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error canceling booking:', error);
      throw error;
    }
  }
}

// Meeting Booking Services
export class MeetingBookingService {
  // Create a new meeting booking via API route (handles email sending on server-side)
  static async createBooking(booking: Omit<MeetingBooking, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const response = await fetch('/api/meeting/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(booking),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create booking');
      }

      const result = await response.json();
      console.log('Meeting booking created successfully:', result);
      return result.bookingId;
    } catch (error) {
      console.error('Error creating booking:', error);
      throw error;
    }
  }

  // Get student's bookings
  static async getStudentBookings(studentId: string): Promise<MeetingBooking[]> {
    try {
      // Use simple query to avoid index requirements
      const q = query(
        collection(firestore, COLLECTIONS.MEETING_BOOKINGS),
        where('studentId', '==', studentId)
      );
      
      const querySnapshot = await getDocs(q);
      let bookings = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: convertTimestamp(doc.data().createdAt),
        updatedAt: convertTimestamp(doc.data().updatedAt),
        completedAt: doc.data().completedAt ? convertTimestamp(doc.data().completedAt) : undefined,
      })) as MeetingBooking[];

      // Sort in JavaScript to avoid index requirements
      bookings.sort((a, b) => {
        // First sort by date (descending - most recent first)
        if (a.date !== b.date) {
          return b.date.localeCompare(a.date);
        }
        // Then sort by start time (descending)
        return b.startTime.localeCompare(a.startTime);
      });

      return bookings;
    } catch (error) {
      console.error('Error getting student bookings:', error);
      throw error;
    }
  }

  // Get teacher's bookings
  static async getTeacherBookings(teacherId: string): Promise<MeetingBooking[]> {
    try {
      // Use simple query to avoid index requirements
      const q = query(
        collection(firestore, COLLECTIONS.MEETING_BOOKINGS),
        where('teacherId', '==', teacherId)
      );
      
      const querySnapshot = await getDocs(q);
      let bookings = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: convertTimestamp(doc.data().createdAt),
        updatedAt: convertTimestamp(doc.data().updatedAt),
        completedAt: doc.data().completedAt ? convertTimestamp(doc.data().completedAt) : undefined,
      })) as MeetingBooking[];

      // Sort in JavaScript to avoid index requirements
      bookings.sort((a, b) => {
        // First sort by date (descending - most recent first)
        if (a.date !== b.date) {
          return b.date.localeCompare(a.date);
        }
        // Then sort by start time (descending)
        return b.startTime.localeCompare(a.startTime);
      });

      return bookings;
    } catch (error) {
      console.error('Error getting teacher bookings:', error);
      throw error;
    }
  }

  // Update booking status
  static async updateBookingStatus(bookingId: string, status: MeetingBooking['status']): Promise<void> {
    try {
      const updates: any = {
        status,
        updatedAt: Timestamp.now(),
      };

      if (status === 'completed') {
        updates.completedAt = Timestamp.now();
      }

      const docRef = doc(firestore, COLLECTIONS.MEETING_BOOKINGS, bookingId);
      await updateDoc(docRef, updates);
    } catch (error) {
      console.error('Error updating booking status:', error);
      throw error;
    }
  }

  // Cancel booking
  static async cancelBooking(bookingId: string): Promise<void> {
    try {
      const bookingDoc = await getDoc(doc(firestore, COLLECTIONS.MEETING_BOOKINGS, bookingId));
      if (!bookingDoc.exists()) {
        throw new Error('Booking not found');
      }

      const booking = bookingDoc.data() as MeetingBooking;

      // Cancel the time slot booking
      await TimeSlotService.cancelBooking(booking.slotId);

      // Update booking status
      await this.updateBookingStatus(bookingId, 'cancelled');
    } catch (error) {
      console.error('Error canceling booking:', error);
      throw error;
    }
  }

  // Get booking with admin meeting link details
  static async getBookingWithMeetingLink(bookingId: string): Promise<MeetingBooking & { adminMeetingLink?: AdminMeetingLink }> {
    try {
      const bookingDoc = await getDoc(doc(firestore, COLLECTIONS.MEETING_BOOKINGS, bookingId));
      if (!bookingDoc.exists()) {
        throw new Error('Booking not found');
      }

      const bookingData = bookingDoc.data() as MeetingBooking;
      const booking = {
        ...bookingData,
        id: bookingDoc.id,
        createdAt: convertTimestamp(bookingData.createdAt),
        updatedAt: convertTimestamp(bookingData.updatedAt),
        completedAt: bookingData.completedAt ? convertTimestamp(bookingData.completedAt) : undefined,
      };

      // If booking has an assigned link ID, fetch the admin meeting link details
      if ((booking as any).assignedLinkId) {
        try {
          const adminLink = await AdminMeetingLinkService.getMeetingLinkById((booking as any).assignedLinkId);
          return {
            ...booking,
            adminMeetingLink: adminLink || undefined,
          };
        } catch (linkError) {
          console.warn('Could not fetch admin meeting link:', linkError);
        }
      }

      return booking;
    } catch (error) {
      console.error('Error getting booking with meeting link:', error);
      throw error;
    }
  }

  // Get all bookings for admin with meeting link usage
  static async getAllBookingsWithLinks(): Promise<Array<MeetingBooking & { adminMeetingLink?: AdminMeetingLink }>> {
    try {
      // Use simple query to avoid index requirements
      const q = query(collection(firestore, COLLECTIONS.MEETING_BOOKINGS));
      
      const querySnapshot = await getDocs(q);
      let bookings = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: convertTimestamp(doc.data().createdAt),
        updatedAt: convertTimestamp(doc.data().updatedAt),
        completedAt: doc.data().completedAt ? convertTimestamp(doc.data().completedAt) : undefined,
      })) as MeetingBooking[];

      // Sort in JavaScript to avoid index requirements
      bookings.sort((a, b) => {
        // First sort by date (descending - most recent first)
        if (a.date !== b.date) {
          return b.date.localeCompare(a.date);
        }
        // Then sort by start time (descending)
        return b.startTime.localeCompare(a.startTime);
      });

      // Fetch admin link details for bookings that have assigned links
      const bookingsWithLinks = await Promise.all(
        bookings.map(async (booking) => {
          if ((booking as any).assignedLinkId) {
            try {
              const adminLink = await AdminMeetingLinkService.getMeetingLinkById((booking as any).assignedLinkId);
              return {
                ...booking,
                adminMeetingLink: adminLink || undefined,
              };
            } catch (linkError) {
              console.warn('Could not fetch admin meeting link for booking:', booking.id, linkError);
            }
          }
          return booking;
        })
      );

      return bookingsWithLinks;
    } catch (error) {
      console.error('Error getting all bookings with links:', error);
      throw error;
    }
  }
}

// Meeting Settings Services
export class MeetingSettingsService {
  // Create or update meeting settings for a teacher
  static async upsertSettings(teacherId: string, settings: Omit<MeetingSettings, 'id' | 'teacherId' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      // Check if settings already exist
      const q = query(
        collection(firestore, COLLECTIONS.MEETING_SETTINGS),
        where('teacherId', '==', teacherId)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        // Create new settings
        const docRef = await addDoc(collection(firestore, COLLECTIONS.MEETING_SETTINGS), {
          ...settings,
          teacherId,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
        return docRef.id;
      } else {
        // Update existing settings
        const docRef = querySnapshot.docs[0].ref;
        await updateDoc(docRef, {
          ...settings,
          updatedAt: Timestamp.now(),
        });
        return docRef.id;
      }
    } catch (error) {
      console.error('Error upserting meeting settings:', error);
      throw error;
    }
  }

  // Get teacher's meeting settings
  static async getSettings(teacherId: string): Promise<MeetingSettings | null> {
    try {
      const q = query(
        collection(firestore, COLLECTIONS.MEETING_SETTINGS),
        where('teacherId', '==', teacherId)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }

      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data(),
        createdAt: convertTimestamp(doc.data().createdAt),
        updatedAt: convertTimestamp(doc.data().updatedAt),
      } as MeetingSettings;
    } catch (error) {
      console.error('Error getting meeting settings:', error);
      throw error;
    }
  }
}
