// Performance utilities for faster navigation and better UX

export class NavigationLoader {
  private static instance: NavigationLoader;
  private isLoading = false;
  private loadingCallbacks: Set<(loading: boolean) => void> = new Set();

  static getInstance(): NavigationLoader {
    if (!NavigationLoader.instance) {
      NavigationLoader.instance = new NavigationLoader();
    }
    return NavigationLoader.instance;
  }

  subscribe(callback: (loading: boolean) => void): () => void {
    this.loadingCallbacks.add(callback);
    return () => this.loadingCallbacks.delete(callback);
  }

  setLoading(loading: boolean) {
    if (this.isLoading !== loading) {
      this.isLoading = loading;
      this.loadingCallbacks.forEach(callback => callback(loading));
    }
  }

  getLoading(): boolean {
    return this.isLoading;
  }
}

// Prefetch helper for admin pages
export const prefetchAdminPages = () => {
  if (typeof window !== 'undefined') {
    const adminPages = [
      '/admin',
      '/admin/students',
      '/admin/teachers',
      '/admin/classes',
      '/admin/videos',
      '/admin/transactions',
      '/admin/question'
    ];

    // Use requestIdleCallback to prefetch during idle time
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(() => {
        adminPages.forEach(page => {
          const link = document.createElement('link');
          link.rel = 'prefetch';
          link.href = page;
          document.head.appendChild(link);
        });
      });
    }
  }
};

// Optimize data fetching with caching
export class DataCache {
  private static cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  static set(key: string, data: any, ttlSeconds = 300): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlSeconds * 1000
    });
  }

  static get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  static clear(): void {
    this.cache.clear();
  }
}

// Page transition helper
export const smoothPageTransition = (callback: () => void) => {
  const loader = NavigationLoader.getInstance();
  loader.setLoading(true);
  
  // Use a small delay to show loading state
  setTimeout(() => {
    callback();
    setTimeout(() => loader.setLoading(false), 100);
  }, 50);
};
