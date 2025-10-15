import { cacheKey, clear, del, get, set } from '@/lib/cache';

// Platform settings cache namespace
const NAMESPACE = 'platform_setting';

// TTL: 5 minutes (300000ms) - settings rarely change
const TTL = 300000;

/**
 * Get cached value for a platform setting
 */
export async function getCachedSetting<T>(settingKey: string): Promise<T | undefined> {
  const key = cacheKey(NAMESPACE, settingKey);
  return await get<T>(key);
}

/**
 * Set cached value for a platform setting
 */
export async function setCachedSetting<T>(settingKey: string, value: T): Promise<void> {
  const key = cacheKey(NAMESPACE, settingKey);
  await set(key, value, TTL);
}

/**
 * Invalidate cache for a specific platform setting
 */
export async function clearCacheKey(settingKey: string): Promise<void> {
  const key = cacheKey(NAMESPACE, settingKey);
  await del(key);
}

/**
 * Clear all cache entries (across ALL namespaces)
 * WARNING: This clears the entire shared cache, not just platform settings
 * Useful for tests and manual cache invalidation
 */
export async function clearCache(): Promise<void> {
  await clear();
}
