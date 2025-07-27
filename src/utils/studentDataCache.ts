// Student data caching service for improved performance
interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class StudentDataCache {
  private cache = new Map<string, CacheItem<any>>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    const isExpired = Date.now() - item.timestamp > item.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Specific methods for student data
  cacheStudentTests(studentId: string, tests: any[]): void {
    this.set(`student_tests_${studentId}`, tests, 2 * 60 * 1000); // 2 minutes for tests
  }

  getCachedStudentTests(studentId: string): any[] | null {
    return this.get(`student_tests_${studentId}`);
  }

  cacheStudentEnrollments(studentId: string, enrollments: any[]): void {
    this.set(`student_enrollments_${studentId}`, enrollments, 10 * 60 * 1000); // 10 minutes for enrollments
  }

  getCachedStudentEnrollments(studentId: string): any[] | null {
    return this.get(`student_enrollments_${studentId}`);
  }

  cacheTestResult(testId: string, studentId: string, result: any): void {
    this.set(`test_result_${testId}_${studentId}`, result, 30 * 60 * 1000); // 30 minutes for results
  }

  getCachedTestResult(testId: string, studentId: string): any | null {
    return this.get(`test_result_${testId}_${studentId}`);
  }

  // Preload commonly accessed data
  async preloadStudentData(studentId: string): Promise<void> {
    try {
      // Preload enrollments and tests in parallel
      const [enrollmentPromise, testPromise] = await Promise.allSettled([
        this.loadEnrollments(studentId),
        this.loadTests(studentId)
      ]);

      console.log('📦 Preloaded student data for:', studentId);
    } catch (error) {
      console.error('Error preloading student data:', error);
    }
  }

  private async loadEnrollments(studentId: string): Promise<void> {
    if (this.getCachedStudentEnrollments(studentId)) return;

    try {
      const { getEnrollmentsByStudent } = await import('@/services/studentEnrollmentService');
      const enrollments = await getEnrollmentsByStudent(studentId);
      this.cacheStudentEnrollments(studentId, enrollments);
    } catch (error) {
      console.error('Error loading enrollments for cache:', error);
    }
  }

  private async loadTests(studentId: string): Promise<void> {
    if (this.getCachedStudentTests(studentId)) return;

    try {
      // Load tests based on cached enrollments
      const enrollments = this.getCachedStudentEnrollments(studentId);
      if (!enrollments || enrollments.length === 0) return;

      const classIds = enrollments.map(e => e.classId);
      const { collection, query, where, getDocs } = await import('firebase/firestore');
      const { firestore } = await import('@/utils/firebase-client');

      const testsQuery = query(
        collection(firestore, 'tests'),
        where('classIds', 'array-contains-any', classIds)
      );

      const snapshot = await getDocs(testsQuery);
      const tests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      this.cacheStudentTests(studentId, tests);
    } catch (error) {
      console.error('Error loading tests for cache:', error);
    }
  }
}

// Global cache instance
export const studentDataCache = new StudentDataCache();

// Helper functions for easy access
export const getCachedData = <T>(key: string): T | null => {
  return studentDataCache.get<T>(key);
};

export const setCachedData = <T>(key: string, data: T, ttl?: number): void => {
  studentDataCache.set(key, data, ttl);
};

export const invalidateCache = (key: string): void => {
  studentDataCache.invalidate(key);
};

export const preloadStudentData = async (studentId: string): Promise<void> => {
  return studentDataCache.preloadStudentData(studentId);
};
