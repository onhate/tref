import { platformSettings } from '@/admin/dbSchema';
import { db } from '@/db/db';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  getPlatformSettingBoolean,
  getPlatformSettingJSON,
  getPlatformSettingNumber,
  getPlatformSettingString,
  setPlatformSetting
} from './platformSettings';
import { clearCache } from './platformSettingsCache';

describe('Platform Settings Helpers', () => {
  beforeEach(async () => {
    // Clean up settings and cache before each test
    await db.delete(platformSettings);
    await clearCache();
  });

  describe('getPlatformSettingNumber', () => {
    it('should return parsed number when settingType is number', async () => {
      await setPlatformSetting('test_fee', 0.15, 'number');

      const result = await getPlatformSettingNumber('test_fee', 0.0);

      expect(result).toBe(0.15);
    });

    it('should return fallback when setting does not exist', async () => {
      const result = await getPlatformSettingNumber('nonexistent_key', 0.25);

      expect(result).toBe(0.25);
    });

    it('should throw error when settingType mismatch', async () => {
      await setPlatformSetting('test_string', 'hello', 'string');

      await expect(
        getPlatformSettingNumber('test_string', 0.0)
      ).rejects.toThrow('Configuração test_string não é do tipo número');
    });

    it('should return fallback when settingValue is not a valid number', async () => {
      await db.insert(platformSettings).values({
        settingKey: 'invalid_number',
        settingValue: 'not-a-number',
        settingType: 'number'
      });

      const result = await getPlatformSettingNumber('invalid_number', 0.5);

      expect(result).toBe(0.5);
    });
  });

  describe('getPlatformSettingString', () => {
    it('should return string value when settingType is string', async () => {
      await setPlatformSetting('app_name', 'Platform', 'string');

      const result = await getPlatformSettingString('app_name', 'Default');

      expect(result).toBe('Platform');
    });

    it('should return fallback when setting does not exist', async () => {
      const result = await getPlatformSettingString('missing_key', 'Fallback');

      expect(result).toBe('Fallback');
    });

    it('should throw error when settingType mismatch', async () => {
      await setPlatformSetting('test_number', 42, 'number');

      await expect(
        getPlatformSettingString('test_number', 'default')
      ).rejects.toThrow('Configuração test_number não é do tipo string');
    });
  });

  describe('getPlatformSettingBoolean', () => {
    it('should return true when settingValue is "true"', async () => {
      await setPlatformSetting('feature_enabled', true, 'boolean');

      const result = await getPlatformSettingBoolean('feature_enabled', false);

      expect(result).toBe(true);
    });

    it('should return false when settingValue is not "true"', async () => {
      await setPlatformSetting('feature_disabled', false, 'boolean');

      const result = await getPlatformSettingBoolean('feature_disabled', true);

      expect(result).toBe(false);
    });

    it('should return fallback when setting does not exist', async () => {
      const result = await getPlatformSettingBoolean('missing_flag', true);

      expect(result).toBe(true);
    });

    it('should throw error when settingType mismatch', async () => {
      await setPlatformSetting('test_json', { key: 'value' }, 'json');

      await expect(
        getPlatformSettingBoolean('test_json', false)
      ).rejects.toThrow('Configuração test_json não é do tipo booleano');
    });
  });

  describe('getPlatformSettingJSON', () => {
    it('should return parsed JSON object when settingType is json', async () => {
      const testData = { foo: 'bar', count: 42 };
      await setPlatformSetting('config_object', testData, 'json');

      const result = await getPlatformSettingJSON('config_object', {});

      expect(result).toEqual(testData);
    });

    it('should return fallback when setting does not exist', async () => {
      const fallback = { default: true };
      const result = await getPlatformSettingJSON('missing_json', fallback);

      expect(result).toEqual(fallback);
    });

    it('should return fallback when JSON parsing fails', async () => {
      await db.insert(platformSettings).values({
        settingKey: 'invalid_json',
        settingValue: 'not-valid-json',
        settingType: 'json'
      });

      const fallback = { error: true };
      const result = await getPlatformSettingJSON('invalid_json', fallback);

      expect(result).toEqual(fallback);
    });

    it('should throw error when settingType mismatch', async () => {
      await setPlatformSetting('test_bool', true, 'boolean');

      await expect(
        getPlatformSettingJSON('test_bool', {})
      ).rejects.toThrow('Configuração test_bool não é do tipo json');
    });
  });

  describe('setPlatformSetting', () => {
    it('should insert new setting', async () => {
      await setPlatformSetting('new_setting', 0.2, 'number');

      const result = await getPlatformSettingNumber('new_setting', 0.0);

      expect(result).toBe(0.2);
    });

    it('should update existing setting on conflict (upsert)', async () => {
      await setPlatformSetting('update_test', 100, 'number');
      await setPlatformSetting('update_test', 200, 'number');

      const result = await getPlatformSettingNumber('update_test', 0);

      expect(result).toBe(200);
    });

    it('should update settingType when upserting', async () => {
      await setPlatformSetting('type_change', 'original', 'string');
      await setPlatformSetting('type_change', 42, 'number');

      const result = await getPlatformSettingNumber('type_change', 0);

      expect(result).toBe(42);
    });

    it('should handle JSON objects correctly', async () => {
      const jsonData = { nested: { value: 123 }, array: [1, 2, 3] };
      await setPlatformSetting('complex_json', jsonData, 'json');

      const result = await getPlatformSettingJSON('complex_json', {});

      expect(result).toEqual(jsonData);
    });
  });

  describe('Cache Behavior', () => {
    it('should cache setting value and avoid duplicate DB queries', async () => {
      await setPlatformSetting('cached_fee', 0.25, 'number');

      // First call - fetches from DB and caches
      const firstCall = await getPlatformSettingNumber('cached_fee', 0.0);
      expect(firstCall).toBe(0.25);

      // Manually update DB without using setPlatformSetting (bypassing cache invalidation)
      await db
        .insert(platformSettings)
        .values({
          settingKey: 'cached_fee',
          settingValue: '0.50',
          settingType: 'number'
        })
        .onConflictDoUpdate({
          target: platformSettings.settingKey,
          set: {
            settingValue: '0.50',
            updatedAt: new Date()
          }
        });

      // Second call - should return cached value (0.25), not DB value (0.50)
      const secondCall = await getPlatformSettingNumber('cached_fee', 0.0);
      expect(secondCall).toBe(0.25);
    });

    it('should invalidate cache when setting is updated via setPlatformSetting', async () => {
      await setPlatformSetting('update_test', 100, 'number');

      // First call - caches value
      const firstCall = await getPlatformSettingNumber('update_test', 0);
      expect(firstCall).toBe(100);

      // Update via setPlatformSetting (which invalidates cache)
      await setPlatformSetting('update_test', 200, 'number');

      // Should return fresh value from DB (200), not cached value (100)
      const secondCall = await getPlatformSettingNumber('update_test', 0);
      expect(secondCall).toBe(200);
    });

    it('should cache different types independently', async () => {
      await setPlatformSetting('string_key', 'hello', 'string');
      await setPlatformSetting('number_key', 42, 'number');
      await setPlatformSetting('bool_key', true, 'boolean');
      await setPlatformSetting('json_key', { foo: 'bar' }, 'json');

      // All values should be cached independently
      const stringVal = await getPlatformSettingString('string_key', 'default');
      const numberVal = await getPlatformSettingNumber('number_key', 0);
      const boolVal = await getPlatformSettingBoolean('bool_key', false);
      const jsonVal = await getPlatformSettingJSON('json_key', {});

      expect(stringVal).toBe('hello');
      expect(numberVal).toBe(42);
      expect(boolVal).toBe(true);
      expect(jsonVal).toEqual({ foo: 'bar' });
    });

    it('should not cache fallback values when setting does not exist', async () => {
      // Call with non-existent key - should return fallback but not cache it
      const firstCall = await getPlatformSettingNumber('nonexistent', 0.5);
      expect(firstCall).toBe(0.5);

      // Create the setting now
      await setPlatformSetting('nonexistent', 1.0, 'number');

      // Should fetch from DB and return new value (not cached fallback)
      const secondCall = await getPlatformSettingNumber('nonexistent', 0.5);
      expect(secondCall).toBe(1.0);
    });
  });
});
