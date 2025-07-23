// Simple in-memory cache for API responses
class MemoryCache {
  constructor(defaultTTL = 300000) { // 5 minutes default TTL
    this.cache = new Map();
    this.defaultTTL = defaultTTL;
  }

  set(key, value, ttl = this.defaultTTL) {
    const expiresAt = Date.now() + ttl;
    this.cache.set(key, { value, expiresAt });
    
    // Clean up expired entries periodically
    if (this.cache.size % 100 === 0) {
      this.cleanup();
    }
  }

  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.value;
  }

  delete(key) {
    this.cache.delete(key);
  }

  // Delete multiple keys matching a pattern
  deletePattern(pattern) {
    const regex = new RegExp(pattern);
    const keysToDelete = [];
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.cache.delete(key));
    return keysToDelete.length;
  }

  clear() {
    this.cache.clear();
  }

  cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  // Get cache stats
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Global cache instance
const apiCache = new MemoryCache();

// Helper function to generate cache keys
export function generateCacheKey(prefix, params) {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}:${params[key]}`)
    .join('|');
  return `${prefix}:${sortedParams}`;
}

// Cache wrapper for API responses
export function withCache(key, ttl = 300000) {
  return {
    get: () => apiCache.get(key),
    set: (value) => apiCache.set(key, value, ttl),
    delete: () => apiCache.delete(key),
    deletePattern: (pattern) => apiCache.deletePattern(pattern)
  };
}

// Helper function to invalidate related cache entries
export function invalidateStudentCache(ugNumber) {
  // Invalidate both authenticated and unauthenticated student cache
  const studentCacheKeyAuth = generateCacheKey('student_detail', { ugNumber, auth: 'auth' });
  const studentCacheKeyAnon = generateCacheKey('student_detail', { ugNumber, auth: 'anon' });
  apiCache.delete(studentCacheKeyAuth);
  apiCache.delete(studentCacheKeyAnon);
  
  // Invalidate search caches that might contain this student
  const deletedCount = apiCache.deletePattern('student_search:.*');
  console.log(`Invalidated ${deletedCount + 2} cache entries for student ${ugNumber}`);
}

export default apiCache;
