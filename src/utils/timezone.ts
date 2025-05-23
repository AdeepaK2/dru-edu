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
