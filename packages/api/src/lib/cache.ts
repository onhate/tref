import Keyv from 'keyv';

/**
 * Shared in-memory cache instance for the entire API
 *
 * To migrate to Redis, update this line:
 * ```typescript
 * const cache = new Keyv(Resource.RedisUrl.url);
 * ```
 *
 * All consuming code will continue working without changes.
 */
const cache = new Keyv();

/**
 * Build a namespaced cache key from components
 *
 * @param namespace - Cache namespace (e.g., 'platform_setting', 'user', 'specialty')
 * @param keys - One or more key components (strings or numbers)
 * @returns Colon-separated cache key
 *
 * @example
 * ```typescript
 * // Simple key
 * cacheKey('platform_setting', 'default_fee')
 * // => "platform_setting:default_fee"
 *
 * // Composite key
 * cacheKey('user', userId, 'profile')
 * // => "user:123:profile"
 *
 * // With numbers
 * cacheKey('doctor', 456, 'pricing')
 * // => "doctor:456:pricing"
 * ```
 */
export function cacheKey(namespace: string, ...keys: (string | number)[]): string {
  return [namespace, ...keys].join(':');
}

/**
 * Get value from cache
 *
 * @param key - Cache key (use cacheKey() helper to build)
 * @returns Cached value or undefined if not found or expired
 *
 * @example
 * ```typescript
 * const key = cacheKey('platform_setting', 'default_fee');
 * const value = await get<number>(key);
 * if (value !== undefined) {
 *   // Use cached value
 * }
 * ```
 */
export async function get<T>(key: string): Promise<T | undefined> {
  return await cache.get<T>(key);
}

/**
 * Set value in cache with optional TTL
 *
 * @param key - Cache key (use cacheKey() helper to build)
 * @param value - Value to cache
 * @param ttl - Time to live in milliseconds (optional, overrides default)
 *
 * @example
 * ```typescript
 * const key = cacheKey('platform_setting', 'default_fee');
 * // Cache for 5 minutes
 * await set(key, 0.15, 300000);
 *
 * // Cache indefinitely
 * await set(key, 0.15);
 * ```
 */
export async function set<T>(key: string, value: T, ttl?: number): Promise<void> {
  await cache.set(key, value, ttl);
}

/**
 * Delete specific key from cache
 *
 * @param key - Cache key (use cacheKey() helper to build)
 * @returns true if key was deleted, false if key didn't exist
 *
 * @example
 * ```typescript
 * const key = cacheKey('platform_setting', 'default_fee');
 * await del(key);
 * ```
 */
export async function del(key: string): Promise<boolean> {
  return await cache.delete(key);
}

/**
 * Clear ALL cache entries
 *
 * WARNING: This clears the entire cache across all namespaces.
 * Mainly useful for tests or manual cache invalidation.
 *
 * @example
 * ```typescript
 * // In test setup
 * beforeEach(async () => {
 *   await clear();
 * });
 * ```
 */
export async function clear(): Promise<void> {
  await cache.clear();
}
