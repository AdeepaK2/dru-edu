// Performance utilities specifically for teacher dashboard

export class TeacherNavigationCache {
  private static instance: TeacherNavigationCache;
  private cache = new Map<string, any>();
  private prefetchedPages = new Set<string>();

  static getInstance(): TeacherNavigationCache {
    if (!TeacherNavigationCache.instance) {
      TeacherNavigationCache.instance = new TeacherNavigationCache();
    }
    return TeacherNavigationCache.instance;
  }

  // Cache teacher data to avoid repeated Firestore calls
  setTeacherData(key: string, data: any) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: 300000 // 5 minutes
    });
  }

  getTeacherData(key: string) {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    // Check if cache is still valid
    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  // Cache Firestore query results
  setFirestoreCache(collectionPath: string, queryKey: string, data: any, ttl: number = 180000) {
    const cacheKey = `firestore_${collectionPath}_${queryKey}`;
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
      ttl // 3 minutes default for Firestore data
    });
  }

  getFirestoreCache(collectionPath: string, queryKey: string) {
    const cacheKey = `firestore_${collectionPath}_${queryKey}`;
    return this.getTeacherData(cacheKey);
  }

  // Clear cache for specific collection when data is updated
  clearCollectionCache(collectionPath: string) {
    const keysToDelete: string[] = [];
    this.cache.forEach((_, key) => {
      if (key.startsWith(`firestore_${collectionPath}_`)) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  // Prefetch teacher pages for faster navigation
  prefetchTeacherPages() {
    if (typeof window === 'undefined') return;

    const teacherPages = [
      '/teacher',
      '/teacher/classes',
      '/teacher/videos',
      '/teacher/tests',
      '/teacher/questions',
      '/teacher/lessons',
      '/teacher/grades',
      '/teacher/settings'
    ];

    teacherPages.forEach(page => {
      if (!this.prefetchedPages.has(page)) {
        this.prefetchedPages.add(page);
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = page;
        document.head.appendChild(link);
      }
    });
  }

  // Preload critical components
  preloadComponents() {
    if (typeof window === 'undefined') return;

    const criticalComponents = [
      () => import('@/components/teacher/TeacherLayout'),
      () => import('@/components/teacher/TeacherSidebar'),
      () => import('@/components/ui')
    ];

    criticalComponents.forEach(importFn => {
      importFn().catch(() => {
        // Ignore errors, this is just prefetching
      });
    });
  }
}

// Enhanced navigation with loading states
export const optimizeTeacherNavigation = () => {
  const cache = TeacherNavigationCache.getInstance();
  
  // Prefetch pages and components
  cache.prefetchTeacherPages();
  cache.preloadComponents();

  // Optimize images loading
  if (typeof window !== 'undefined') {
    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          img.src = img.dataset.src!;
          img.removeAttribute('data-src');
          observer.unobserve(img);
        }
      });
    });

    images.forEach(img => imageObserver.observe(img));
  }
};

// Debounced search for better performance
export const createDebouncedSearch = (fn: Function, delay: number = 300) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(null, args), delay);
  };
};

// Firestore optimization utilities
export class FirestoreOptimizer {
  private static pendingQueries = new Map<string, Promise<any>>();
  private static cache = TeacherNavigationCache.getInstance();

  // Deduplicate concurrent Firestore queries with fallback support
  static async executeQuery<T>(
    queryKey: string, 
    queryFn: () => Promise<T>,
    fallbackFn?: () => Promise<T>,
    cacheTtl: number = 180000 // 3 minutes
  ): Promise<T> {
    // Check cache first
    const cached = this.cache.getFirestoreCache('queries', queryKey);
    if (cached) {
      return cached;
    }

    // Check if query is already pending
    if (this.pendingQueries.has(queryKey)) {
      return this.pendingQueries.get(queryKey);
    }

    // Execute query with fallback support
    const queryPromise = queryFn().then(result => {
      this.cache.setFirestoreCache('queries', queryKey, result, cacheTtl);
      this.pendingQueries.delete(queryKey);
      return result;
    }).catch(async (error) => {
      this.pendingQueries.delete(queryKey);
      
      // Try fallback if available and error is index-related
      if (fallbackFn && (error.code === 'failed-precondition' || error.message?.includes('index'))) {
        console.warn(`Primary query failed, trying fallback for ${queryKey}:`, error.message);
        try {
          const fallbackResult = await fallbackFn();
          this.cache.setFirestoreCache('queries', queryKey, fallbackResult, cacheTtl);
          return fallbackResult;
        } catch (fallbackError) {
          console.error(`Fallback also failed for ${queryKey}:`, fallbackError);
          throw fallbackError;
        }
      }
      
      throw error;
    });

    this.pendingQueries.set(queryKey, queryPromise);
    return queryPromise;
  }

  // Enhanced student query with caching and fallback
  static async getStudentsByClassOptimized(classId: string) {
    return this.executeQuery(
      `students_by_class_${classId}`,
      async () => {
        // Use enrollment service directly to avoid chunk loading issues
        const { getEnrollmentsByClass } = require('@/services/studentEnrollmentService');
        const enrollments: any[] = await getEnrollmentsByClass(classId);
        
        // Convert to student list format
        return enrollments
          .filter((enrollment: any) => enrollment.status === 'Active')
          .map((enrollment: any) => ({
            id: enrollment.studentId,
            name: enrollment.studentName,
            email: enrollment.studentEmail,
            status: 'Active' as const,
          }))
          .sort((a: any, b: any) => a.name.localeCompare(b.name));
      },
      undefined, // No fallback needed since enrollment service handles errors
      240000 // 4 minutes cache for student data
    );
  }

  // Batch multiple Firestore operations
  static async batchQueries<T>(queries: Array<() => Promise<T>>): Promise<T[]> {
    const batchSize = 5; // Firestore handles up to 10 concurrent connections well
    const results: T[] = [];
    
    for (let i = 0; i < queries.length; i += batchSize) {
      const batch = queries.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch.map(query => query()));
      results.push(...batchResults);
    }
    
    return results;
  }

  // Preload related data for better UX
  static async preloadRelatedData(teacherId: string) {
    // Use direct imports to avoid chunk loading issues
    try {
      const { ClassFirestoreService } = require('@/apiservices/classFirestoreService');
      const { VideoFirestoreService } = require('@/apiservices/videoFirestoreService');
      const { TestService } = require('@/apiservices/testService');

      const queries = [
        () => ClassFirestoreService.getClassesByTeacher(teacherId),
        () => VideoFirestoreService.getVideosByTeacher(teacherId),
        () => TestService.getTeacherTests(teacherId)
      ];

      // Execute in background, don't wait for results
      Promise.all(queries.map(query => query().catch(() => null)));
    } catch (error) {
      console.warn('Failed to preload teacher data:', error);
    }
  }
}
