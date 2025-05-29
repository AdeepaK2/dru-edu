// Timezone configuration for Melbourne, Australia
export const MELBOURNE_TIMEZONE = 'Australia/Melbourne';

// Set default timezone for the application
export const setDefaultTimezone = () => {
  // Set timezone for server-side operations
  process.env.TZ = MELBOURNE_TIMEZONE;
};

// Helper function to get current Melbourne time
export const getMelbourneTime = (): Date => {
  return new Date(new Date().toLocaleString("en-US", { timeZone: MELBOURNE_TIMEZONE }));
};

// Helper function to format date in Melbourne timezone
export const formatMelbourneDate = (date: Date, options?: Intl.DateTimeFormatOptions): string => {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone: MELBOURNE_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  };
  
  return date.toLocaleString('en-AU', { ...defaultOptions, ...options });
};

// Helper function to convert any date to Melbourne timezone
export const toMelbourneTime = (date: Date): Date => {
  return new Date(date.toLocaleString("en-US", { timeZone: MELBOURNE_TIMEZONE }));
};

// Helper function for Firestore timestamps in Melbourne timezone
export const getMelbourneTimestamp = () => {
  return new Date().toLocaleString("en-US", { timeZone: MELBOURNE_TIMEZONE });
};

// Helper function to create Firestore-compatible timestamp in Melbourne time
export const createMelbourneFirestoreTimestamp = () => {
  // Return a proper Date object that Firestore will store correctly
  return new Date();
};

// Helper function to format Firestore timestamp for display in Melbourne time
export const formatFirestoreTimestamp = (timestamp: any): string => {
  let date: Date;
  
  // Handle different timestamp formats from Firestore
  if (timestamp?.toDate) {
    // Firestore Timestamp object
    date = timestamp.toDate();
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else if (typeof timestamp === 'string') {
    date = new Date(timestamp);
  } else {
    date = new Date();
  }
  
  return formatMelbourneDate(date);
};

// Helper function to ensure all dates in your app display in Melbourne time
export const ensureMelbourneDisplay = (date: Date | string | any): string => {
  if (!date) return '';
  
  let parsedDate: Date;
  
  if (typeof date === 'string') {
    parsedDate = new Date(date);
  } else if (date.toDate && typeof date.toDate === 'function') {
    // Firestore Timestamp
    parsedDate = date.toDate();
  } else if (date instanceof Date) {
    parsedDate = date;
  } else {
    return '';
  }
  
  return formatMelbourneDate(parsedDate);
};

// Utility to get Melbourne timezone offset for logging/debugging
export const getMelbourneOffset = (): string => {
  const now = new Date();
  const utc = new Date(now.getTime() + (now.getTimezoneOffset() * 60000));
  const melbourne = new Date(utc.toLocaleString("en-US", { timeZone: MELBOURNE_TIMEZONE }));
  const offset = (melbourne.getTime() - utc.getTime()) / (1000 * 60 * 60);
  return `UTC${offset >= 0 ? '+' : ''}${offset}`;
};
