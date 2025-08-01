/**
 * API Client utility that automatically switches between local development API routes
 * and Firebase Functions based on the environment
 */

// Firebase Functions URLs (production)
const FIREBASE_FUNCTIONS_BASE_URL = 'https://australia-southeast1-dru-edu.cloudfunctions.net';

// Check if we're in development mode
const isDevelopment = process.env.NODE_ENV === 'development';

// API endpoints configuration
const API_ENDPOINTS = {
  // Local development endpoints
  local: {
    subjects: '/api/subjects',
    classes: '/api/classes',
    teachers: '/api/teacher',
    students: '/api/student',
    questionBanks: '/api/question-banks',
    health: '/api/health',
  },
  // Firebase Functions endpoints (production)
  firebase: {
    subjects: `${FIREBASE_FUNCTIONS_BASE_URL}/getSubjects`,
    createSubject: `${FIREBASE_FUNCTIONS_BASE_URL}/createSubject`,
    classes: `${FIREBASE_FUNCTIONS_BASE_URL}/getClasses`,
    createClass: `${FIREBASE_FUNCTIONS_BASE_URL}/createClass`,
    teachers: `${FIREBASE_FUNCTIONS_BASE_URL}/getTeachers`,
    createTeacher: `${FIREBASE_FUNCTIONS_BASE_URL}/createTeacher`,
    students: `${FIREBASE_FUNCTIONS_BASE_URL}/getStudents`,
    createStudent: `${FIREBASE_FUNCTIONS_BASE_URL}/createStudent`,
    questionBanks: `${FIREBASE_FUNCTIONS_BASE_URL}/getQuestionBanks`,
    createQuestionBank: `${FIREBASE_FUNCTIONS_BASE_URL}/createQuestionBank`,
    health: `${FIREBASE_FUNCTIONS_BASE_URL}/healthCheck`,
  }
};

/**
 * Get the appropriate API endpoint based on environment
 */
export function getApiEndpoint(endpoint: keyof typeof API_ENDPOINTS.local): string {
  if (isDevelopment) {
    return API_ENDPOINTS.local[endpoint];
  }
  
  // For production, map to appropriate Firebase Function
  switch (endpoint) {
    case 'subjects':
      return API_ENDPOINTS.firebase.subjects;
    case 'classes':
      return API_ENDPOINTS.firebase.classes;
    case 'teachers':
      return API_ENDPOINTS.firebase.teachers;
    case 'students':
      return API_ENDPOINTS.firebase.students;
    case 'questionBanks':
      return API_ENDPOINTS.firebase.questionBanks;
    case 'health':
      return API_ENDPOINTS.firebase.health;
    default:
      throw new Error(`Unknown endpoint: ${endpoint}`);
  }
}

/**
 * Get the appropriate CREATE endpoint for Firebase Functions
 */
export function getCreateApiEndpoint(resourceType: 'subjects' | 'classes' | 'teachers' | 'students' | 'questionBanks'): string {
  if (isDevelopment) {
    // In development, use the same endpoint for both GET and POST
    return getApiEndpoint(resourceType);
  }
  
  // For production, use specific create endpoints
  switch (resourceType) {
    case 'subjects':
      return API_ENDPOINTS.firebase.createSubject;
    case 'classes':
      return API_ENDPOINTS.firebase.createClass;
    case 'teachers':
      return API_ENDPOINTS.firebase.createTeacher;
    case 'students':
      return API_ENDPOINTS.firebase.createStudent;
    case 'questionBanks':
      return API_ENDPOINTS.firebase.createQuestionBank;
    default:
      throw new Error(`Unknown resource type: ${resourceType}`);
  }
}

/**
 * Enhanced fetch wrapper that handles both local and Firebase Function calls
 */
export async function apiCall<T = any>(
  endpoint: keyof typeof API_ENDPOINTS.local,
  options: RequestInit = {}
): Promise<T> {
  const url = getApiEndpoint(endpoint);
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, defaultOptions);
    
    if (!response.ok) {
      throw new Error(`API call failed: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`API call to ${url} failed:`, error);
    throw error;
  }
}

/**
 * Authenticated API call that automatically includes Bearer token
 */
export async function authenticatedApiCall<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  // Get auth token from localStorage
  const authToken = localStorage.getItem('authToken');
  if (!authToken) {
    throw new Error('Authentication token not found. Please log in again.');
  }

  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, defaultOptions);
    
    if (!response.ok) {
      if (response.status === 401) {
        // Clear invalid token
        localStorage.removeItem('authToken');
        throw new Error('Authentication failed. Please log in again.');
      }
      
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = {};
      }
      
      console.error(`API Error ${response.status}:`, errorData);
      throw new Error(errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Authenticated API call to ${url} failed:`, error);
    throw error;
  }
}

/**
 * Create resource using appropriate endpoint
 */
export async function createResource<T = any>(
  resourceType: 'subjects' | 'classes' | 'teachers' | 'students' | 'questionBanks',
  data: any
): Promise<T> {
  const url = getCreateApiEndpoint(resourceType);
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error(`Create ${resourceType} failed: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Create ${resourceType} failed:`, error);
    throw error;
  }
}

/**
 * Environment info
 */
export const environmentInfo = {
  isDevelopment,
  apiMode: isDevelopment ? 'local' : 'firebase',
  baseUrl: isDevelopment ? 'localhost' : FIREBASE_FUNCTIONS_BASE_URL,
};
