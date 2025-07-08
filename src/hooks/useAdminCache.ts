// Enhanced cache management for admin data
'use client';

import { useState, useEffect, useRef } from 'react';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class AdminDataCache {
  private static instance: AdminDataCache;
  private cache = new Map<string, CacheItem<any>>();
  private subscribers = new Map<string, Set<(data: any) => void>>();

  static getInstance(): AdminDataCache {
    if (!AdminDataCache.instance) {
      AdminDataCache.instance = new AdminDataCache();
    }
    return AdminDataCache.instance;
  }

  set<T>(key: string, data: T, ttlSeconds = 300): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlSeconds * 1000
    });

    // Notify subscribers
    const keySubscribers = this.subscribers.get(key);
    if (keySubscribers) {
      keySubscribers.forEach(callback => callback(data));
    }
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  subscribe<T>(key: string, callback: (data: T | null) => void): () => void {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
    this.subscribers.get(key)!.add(callback);

    // Immediately call with cached data if available
    const cachedData = this.get<T>(key);
    if (cachedData) {
      callback(cachedData);
    }

    return () => {
      const keySubscribers = this.subscribers.get(key);
      if (keySubscribers) {
        keySubscribers.delete(callback);
        if (keySubscribers.size === 0) {
          this.subscribers.delete(key);
        }
      }
    };
  }

  invalidate(key: string): void {
    this.cache.delete(key);
    // Notify subscribers of invalidation
    const keySubscribers = this.subscribers.get(key);
    if (keySubscribers) {
      keySubscribers.forEach(callback => callback(null));
    }
  }

  clear(): void {
    this.cache.clear();
    this.subscribers.clear();
  }
}

// Hook for using cached data with automatic subscription
export function useCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: { ttl?: number; immediate?: boolean } = {}
) {
  const { ttl = 300, immediate = true } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState<Error | null>(null);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    const cache = AdminDataCache.getInstance();
    
    // Subscribe to cache updates
    const unsubscribe = cache.subscribe<T>(key, (cachedData) => {
      if (cachedData) {
        setData(cachedData);
        setLoading(false);
        setError(null);
      }
    });

    // Fetch if not in cache and immediate is true
    if (immediate) {
      const cachedData = cache.get<T>(key);
      if (!cachedData) {
        fetcherRef.current()
          .then((newData) => {
            cache.set(key, newData, ttl);
            setData(newData);
            setLoading(false);
            setError(null);
          })
          .catch((err) => {
            setError(err);
            setLoading(false);
          });
      } else {
        setData(cachedData);
        setLoading(false);
      }
    }

    return unsubscribe;
  }, [key, ttl, immediate]);

  const refetch = async () => {
    setLoading(true);
    setError(null);
    try {
      const newData = await fetcherRef.current();
      const cache = AdminDataCache.getInstance();
      cache.set(key, newData, ttl);
      setData(newData);
      setLoading(false);
    } catch (err) {
      setError(err as Error);
      setLoading(false);
    }
  };

  const invalidate = () => {
    const cache = AdminDataCache.getInstance();
    cache.invalidate(key);
    setData(null);
  };

  return {
    data,
    loading,
    error,
    refetch,
    invalidate
  };
}

export { AdminDataCache };
