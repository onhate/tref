import { platformSettings } from '@/admin/dbSchema';
import { db } from '@/db/db';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  getPlatformSettingBoolean,
  getPlatformSettingJSON,
  getPlatformSettingNumber,
  getPlatformSettingString
} from './platformSettings';
import { updatePlatformSetting } from './updatePlatformSetting';

describe('updatePlatformSetting', () => {
  beforeEach(async () => {
    await db.delete(platformSettings);
  });

  describe('creating new settings', () => {
    it('should create a new number setting', async () => {
      await updatePlatformSetting({
        settingKey: 'test_number',
        settingValue: 42,
        settingType: 'number'
      });

      const value = await getPlatformSettingNumber('test_number', 0);
      expect(value).toBe(42);
    });

    it('should create a new string setting', async () => {
      await updatePlatformSetting({
        settingKey: 'test_string',
        settingValue: 'hello world',
        settingType: 'string'
      });

      const value = await getPlatformSettingString('test_string', '');
      expect(value).toBe('hello world');
    });

    it('should create a new boolean setting', async () => {
      await updatePlatformSetting({
        settingKey: 'test_boolean',
        settingValue: true,
        settingType: 'boolean'
      });

      const value = await getPlatformSettingBoolean('test_boolean', false);
      expect(value).toBe(true);
    });

    it('should create a new json setting', async () => {
      const jsonData = { key: 'value', nested: { prop: 123 } };

      await updatePlatformSetting({
        settingKey: 'test_json',
        settingValue: jsonData,
        settingType: 'json'
      });

      const value = await getPlatformSettingJSON('test_json', {});
      expect(value).toEqual(jsonData);
    });
  });

  describe('updating existing settings', () => {
    it('should update an existing number setting', async () => {
      await updatePlatformSetting({
        settingKey: 'update_test',
        settingValue: 100,
        settingType: 'number'
      });

      await updatePlatformSetting({
        settingKey: 'update_test',
        settingValue: 200,
        settingType: 'number'
      });

      const value = await getPlatformSettingNumber('update_test', 0);
      expect(value).toBe(200);
    });

    it('should update an existing string setting', async () => {
      await updatePlatformSetting({
        settingKey: 'update_string',
        settingValue: 'original',
        settingType: 'string'
      });

      await updatePlatformSetting({
        settingKey: 'update_string',
        settingValue: 'updated',
        settingType: 'string'
      });

      const value = await getPlatformSettingString('update_string', '');
      expect(value).toBe('updated');
    });

    it('should update setting type when changing types', async () => {
      await updatePlatformSetting({
        settingKey: 'type_change',
        settingValue: 'string_value',
        settingType: 'string'
      });

      await updatePlatformSetting({
        settingKey: 'type_change',
        settingValue: 123,
        settingType: 'number'
      });

      const value = await getPlatformSettingNumber('type_change', 0);
      expect(value).toBe(123);
    });
  });

  describe('validation', () => {
    it('should reject empty setting key', async () => {
      await expect(
        updatePlatformSetting({
          settingKey: '',
          settingValue: 'value',
          settingType: 'string'
        })
      ).rejects.toThrow();
    });

    it('should reject number value with non-number type', async () => {
      await expect(
        updatePlatformSetting({
          settingKey: 'test',
          settingValue: 42,
          settingType: 'string'
        })
      ).rejects.toThrow('Valor deve ser uma string quando o tipo é "string"');
    });

    it('should reject string value with non-string type', async () => {
      await expect(
        updatePlatformSetting({
          settingKey: 'test',
          settingValue: 'hello',
          settingType: 'number'
        })
      ).rejects.toThrow('Valor deve ser um número quando o tipo é "number"');
    });

    it('should reject boolean value with non-boolean type', async () => {
      await expect(
        updatePlatformSetting({
          settingKey: 'test',
          settingValue: true,
          settingType: 'string'
        })
      ).rejects.toThrow('Valor deve ser uma string quando o tipo é "string"');
    });

    it('should reject object value with non-json type', async () => {
      await expect(
        updatePlatformSetting({
          settingKey: 'test',
          settingValue: { key: 'value' },
          settingType: 'string'
        })
      ).rejects.toThrow('Valor deve ser uma string quando o tipo é "string"');
    });

    it('should reject invalid setting type', async () => {
      await expect(
        updatePlatformSetting({
          settingKey: 'test',
          settingValue: 'value',
          settingType: 'invalid' as any
        })
      ).rejects.toThrow();
    });

    it('should reject setting key over 255 characters', async () => {
      const longKey = 'a'.repeat(256);

      await expect(
        updatePlatformSetting({
          settingKey: longKey,
          settingValue: 'value',
          settingType: 'string'
        })
      ).rejects.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle zero as a valid number', async () => {
      await updatePlatformSetting({
        settingKey: 'zero_test',
        settingValue: 0,
        settingType: 'number'
      });

      const value = await getPlatformSettingNumber('zero_test', 99);
      expect(value).toBe(0);
    });

    it('should handle negative numbers', async () => {
      await updatePlatformSetting({
        settingKey: 'negative_test',
        settingValue: -42,
        settingType: 'number'
      });

      const value = await getPlatformSettingNumber('negative_test', 0);
      expect(value).toBe(-42);
    });

    it('should handle empty string as valid value', async () => {
      await updatePlatformSetting({
        settingKey: 'empty_string',
        settingValue: '',
        settingType: 'string'
      });

      const value = await getPlatformSettingString('empty_string', 'default');
      expect(value).toBe('');
    });

    it('should handle false as valid boolean value', async () => {
      await updatePlatformSetting({
        settingKey: 'false_test',
        settingValue: false,
        settingType: 'boolean'
      });

      const value = await getPlatformSettingBoolean('false_test', true);
      expect(value).toBe(false);
    });

    it('should handle empty object as valid json', async () => {
      await updatePlatformSetting({
        settingKey: 'empty_object',
        settingValue: {},
        settingType: 'json'
      });

      const value = await getPlatformSettingJSON('empty_object', null);
      expect(value).toEqual({});
    });

    it('should handle arrays as valid json', async () => {
      const arrayData = [1, 2, 3, 'test'];

      await updatePlatformSetting({
        settingKey: 'array_test',
        settingValue: arrayData as any,
        settingType: 'json'
      });

      const value = await getPlatformSettingJSON('array_test', []);
      expect(value).toEqual(arrayData);
    });
  });
});
