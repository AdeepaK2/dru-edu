import { MELBOURNE_TIMEZONE, formatMelbourneDate } from './timezone';

/**
 * MelbourneDate utility class that ensures all date operations
 * are performed in Melbourne timezone context
 */
export class MelbourneDate {
  private date: Date;

  constructor(date?: Date | string | number) {
    if (date) {
      this.date = new Date(date);
    } else {
      this.date = new Date();
    }
  }

  // Get the underlying Date object
  toDate(): Date {
    return new Date(this.date);
  }

  // Format for display in Melbourne timezone
  toString(): string {
    return this.date.toLocaleString('en-AU', {
      timeZone: MELBOURNE_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  }

  // Format for short display
  toShortString(): string {
    return this.date.toLocaleDateString('en-AU', {
      timeZone: MELBOURNE_TIMEZONE,
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  // Format for time only
  toTimeString(): string {
    return this.date.toLocaleTimeString('en-AU', {
      timeZone: MELBOURNE_TIMEZONE,
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }

  // Get ISO string for database storage
  toISOString(): string {
    return this.date.toISOString();
  }

  // Format with custom options
  format(options?: Intl.DateTimeFormatOptions): string {
    return formatMelbourneDate(this.date, options);
  }

  // Static method to create from Firestore timestamp
  static fromFirestore(timestamp: any): MelbourneDate {
    if (timestamp?.toDate) {
      return new MelbourneDate(timestamp.toDate());
    }
    return new MelbourneDate(timestamp);
  }

  // Static method to get current Melbourne time
  static now(): MelbourneDate {
    return new MelbourneDate();
  }

  // Add days
  addDays(days: number): MelbourneDate {
    const newDate = new Date(this.date);
    newDate.setDate(newDate.getDate() + days);
    return new MelbourneDate(newDate);
  }

  // Add hours
  addHours(hours: number): MelbourneDate {
    const newDate = new Date(this.date);
    newDate.setHours(newDate.getHours() + hours);
    return new MelbourneDate(newDate);
  }

  // Add minutes
  addMinutes(minutes: number): MelbourneDate {
    const newDate = new Date(this.date);
    newDate.setMinutes(newDate.getMinutes() + minutes);
    return new MelbourneDate(newDate);
  }

  // Check if date is today in Melbourne timezone
  isToday(): boolean {
    const today = new Date();
    const todayMelb = today.toLocaleDateString('en-AU', { timeZone: MELBOURNE_TIMEZONE });
    const thisMelb = this.date.toLocaleDateString('en-AU', { timeZone: MELBOURNE_TIMEZONE });
    return todayMelb === thisMelb;
  }

  // Check if date is in the future in Melbourne timezone
  isFuture(): boolean {
    const now = new Date();
    return this.date > now;
  }

  // Check if date is in the past in Melbourne timezone
  isPast(): boolean {
    const now = new Date();
    return this.date < now;
  }

  // Get day of week in Melbourne timezone
  getDayOfWeek(): string {
    return this.date.toLocaleDateString('en-AU', {
      timeZone: MELBOURNE_TIMEZONE,
      weekday: 'long'
    });
  }

  // Get month name in Melbourne timezone
  getMonthName(): string {
    return this.date.toLocaleDateString('en-AU', {
      timeZone: MELBOURNE_TIMEZONE,
      month: 'long'
    });
  }
}

// Helper function to create MelbourneDate from various inputs
export const createMelbourneDate = (input?: Date | string | number | any): MelbourneDate => {
  if (input?.toDate && typeof input.toDate === 'function') {
    // Firestore Timestamp
    return MelbourneDate.fromFirestore(input);
  }
  return new MelbourneDate(input);
};

// Export for convenience
export const now = () => MelbourneDate.now();
