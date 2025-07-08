// Helper service to get auth token from local storage
export const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null; // Server-side check
  return localStorage.getItem('authToken');
};
