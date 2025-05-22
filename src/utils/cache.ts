// Simple in-memory cache implementation
const cache = new Map<string, {data: any, expiry: number}>();

export const cacheUtils = {
  get: (key: string) => {
    const item = cache.get(key);
    if (!item) return null;
    
    if (item.expiry < Date.now()) {
      cache.delete(key);
      return null;
    }
    
    return item.data;
  },
  
  set: (key: string, data: any, ttlSeconds: number = 60) => {
    cache.set(key, {
      data,
      expiry: Date.now() + (ttlSeconds * 1000)
    });
  },
  
  invalidate: (prefix: string) => {
    for (const key of cache.keys()) {
      if (key.startsWith(prefix)) {
        cache.delete(key);
      }
    }
  }
};