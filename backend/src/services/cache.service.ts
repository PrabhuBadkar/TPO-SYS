/**
 * Cache Service
 * In-memory caching for performance optimization
 */

interface CacheEntry {
  data: any;
  expiry: number;
}

/**
 * Cache Service
 */
export class CacheService {
  private cache: Map<string, CacheEntry> = new Map();
  private defaultTTL: number = 300000; // 5 minutes

  /**
   * Get cached data
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set cached data
   */
  set(key: string, data: any, ttl?: number): void {
    const expiry = Date.now() + (ttl || this.defaultTTL);
    
    this.cache.set(key, {
      data,
      expiry,
    });
  }

  /**
   * Delete cached data
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Clear expired entries
   */
  clearExpired(): void {
    const now = Date.now();
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiry) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): any {
    const now = Date.now();
    let expired = 0;
    let active = 0;

    for (const entry of this.cache.values()) {
      if (now > entry.expiry) {
        expired++;
      } else {
        active++;
      }
    }

    return {
      total: this.cache.size,
      active,
      expired,
      memory_usage: this.estimateMemoryUsage(),
    };
  }

  /**
   * Estimate memory usage (rough estimate)
   */
  private estimateMemoryUsage(): string {
    const bytes = JSON.stringify(Array.from(this.cache.entries())).length;
    
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  }

  /**
   * Get or set with callback
   */
  async getOrSet<T>(
    key: string,
    callback: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // Try to get from cache
    const cached = this.get<T>(key);
    
    if (cached !== null) {
      return cached;
    }

    // Execute callback and cache result
    const data = await callback();
    this.set(key, data, ttl);
    
    return data;
  }
}

// Export singleton instance
export const cacheService = new CacheService();

// Clear expired entries every 5 minutes
setInterval(() => {
  cacheService.clearExpired();
}, 300000);
