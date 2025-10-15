import { beforeEach, describe, expect, it } from 'vitest';
import { cacheKey, clear, del, get, set } from './cache';

describe('Cache Module', () => {
  beforeEach(async () => {
    // Clear cache before each test
    await clear();
  });

  describe('cacheKey', () => {
    it('should build key from namespace and single key', () => {
      const key = cacheKey('platform_setting', 'default_fee');

      expect(key).toBe('platform_setting:default_fee');
    });

    it('should build key from namespace and multiple keys', () => {
      const key = cacheKey('user', '123', 'profile');

      expect(key).toBe('user:123:profile');
    });

    it('should handle numeric keys', () => {
      const key = cacheKey('doctor', 456, 'pricing');

      expect(key).toBe('doctor:456:pricing');
    });

    it('should handle mixed string and numeric keys', () => {
      const key = cacheKey('specialty', 789, 'doctors', 'active');

      expect(key).toBe('specialty:789:doctors:active');
    });

    it('should handle single namespace without additional keys', () => {
      const key = cacheKey('global');

      expect(key).toBe('global');
    });
  });

  describe('get and set', () => {
    it('should return undefined for non-existent key', async () => {
      const result = await get<string>('nonexistent:key');

      expect(result).toBeUndefined();
    });

    it('should store and retrieve string values', async () => {
      const key = cacheKey('test', 'string');
      await set(key, 'hello world');

      const result = await get<string>(key);

      expect(result).toBe('hello world');
    });

    it('should store and retrieve number values', async () => {
      const key = cacheKey('test', 'number');
      await set(key, 42.5);

      const result = await get<number>(key);

      expect(result).toBe(42.5);
    });

    it('should store and retrieve boolean values', async () => {
      const key = cacheKey('test', 'boolean');
      await set(key, true);

      const result = await get<boolean>(key);

      expect(result).toBe(true);
    });

    it('should store and retrieve object values', async () => {
      const key = cacheKey('test', 'object');
      const obj = { foo: 'bar', count: 123, nested: { value: true } };
      await set(key, obj);

      const result = await get<typeof obj>(key);

      expect(result).toEqual(obj);
    });

    it('should store and retrieve array values', async () => {
      const key = cacheKey('test', 'array');
      const arr = [1, 2, 3, 'four', { five: 5 }];
      await set(key, arr);

      const result = await get<typeof arr>(key);

      expect(result).toEqual(arr);
    });

    it('should overwrite existing value', async () => {
      const key = cacheKey('test', 'overwrite');
      await set(key, 'first');
      await set(key, 'second');

      const result = await get<string>(key);

      expect(result).toBe('second');
    });

    it('should expire value after TTL', async () => {
      const key = cacheKey('test', 'ttl');
      // Set with 100ms TTL
      await set(key, 'expires', 100);

      // Should be available immediately
      const before = await get<string>(key);
      expect(before).toBe('expires');

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Should be expired
      const after = await get<string>(key);
      expect(after).toBeUndefined();
    }, 10000);

    it('should allow different TTLs for different keys', async () => {
      const shortKey = cacheKey('test', 'short');
      const longKey = cacheKey('test', 'long');

      await set(shortKey, 'expires soon', 100);
      await set(longKey, 'expires later', 300);

      // Wait for short TTL to expire
      await new Promise((resolve) => setTimeout(resolve, 150));

      const shortResult = await get<string>(shortKey);
      const longResult = await get<string>(longKey);

      expect(shortResult).toBeUndefined();
      expect(longResult).toBe('expires later');
    }, 10000);
  });

  describe('del', () => {
    it('should delete existing key', async () => {
      const key = cacheKey('test', 'delete');
      await set(key, 'will be deleted');

      const deleted = await del(key);

      expect(deleted).toBe(true);

      const result = await get<string>(key);
      expect(result).toBeUndefined();
    });

    it('should return false for non-existent key', async () => {
      const key = cacheKey('test', 'nonexistent');

      const deleted = await del(key);

      expect(deleted).toBe(false);
    });

    it('should only delete specified key', async () => {
      const key1 = cacheKey('test', 'keep');
      const key2 = cacheKey('test', 'delete');

      await set(key1, 'keep this');
      await set(key2, 'delete this');

      await del(key2);

      const result1 = await get<string>(key1);
      const result2 = await get<string>(key2);

      expect(result1).toBe('keep this');
      expect(result2).toBeUndefined();
    });
  });

  describe('clear', () => {
    it('should clear all cache entries', async () => {
      const key1 = cacheKey('namespace1', 'key1');
      const key2 = cacheKey('namespace2', 'key2');
      const key3 = cacheKey('namespace3', 'key3');

      await set(key1, 'value1');
      await set(key2, 'value2');
      await set(key3, 'value3');

      await clear();

      const result1 = await get<string>(key1);
      const result2 = await get<string>(key2);
      const result3 = await get<string>(key3);

      expect(result1).toBeUndefined();
      expect(result2).toBeUndefined();
      expect(result3).toBeUndefined();
    });
  });

  describe('Namespace Isolation', () => {
    it('should isolate keys with different namespaces', async () => {
      const key1 = cacheKey('namespace1', 'same_key');
      const key2 = cacheKey('namespace2', 'same_key');

      await set(key1, 'value from namespace1');
      await set(key2, 'value from namespace2');

      const result1 = await get<string>(key1);
      const result2 = await get<string>(key2);

      expect(result1).toBe('value from namespace1');
      expect(result2).toBe('value from namespace2');
    });

    it('should allow deleting from one namespace without affecting others', async () => {
      const key1 = cacheKey('namespace1', 'key');
      const key2 = cacheKey('namespace2', 'key');

      await set(key1, 'value1');
      await set(key2, 'value2');

      await del(key1);

      const result1 = await get<string>(key1);
      const result2 = await get<string>(key2);

      expect(result1).toBeUndefined();
      expect(result2).toBe('value2');
    });
  });
});
