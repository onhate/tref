import { platformSettings } from '@/admin/dbSchema';
import { db } from '@/db/db';
import { beforeEach, describe, expect, it } from 'vitest';
import { listPlatformSettings } from './listPlatformSettings';
import { setPlatformSetting } from './platformSettings';

describe('listPlatformSettings', () => {
  beforeEach(async () => {
    await db.delete(platformSettings);
  });

  it('should return empty list when no settings exist', async () => {
    const result = await listPlatformSettings({});

    expect(result.settings).toEqual([]);
    expect(result.total).toBe(0);
  });

  it('should return all settings with correct total count', async () => {
    await setPlatformSetting('setting_1', 'value_1', 'string');
    await setPlatformSetting('setting_2', 100, 'number');
    await setPlatformSetting('setting_3', true, 'boolean');

    const result = await listPlatformSettings({});

    expect(result.settings).toHaveLength(3);
    expect(result.total).toBe(3);
  });

  it('should return settings ordered by most recently updated', async () => {
    await setPlatformSetting('old_setting', 'old', 'string');

    // Add a small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    await setPlatformSetting('new_setting', 'new', 'string');

    const result = await listPlatformSettings({});

    expect(result.settings[0].settingKey).toBe('new_setting');
    expect(result.settings[1].settingKey).toBe('old_setting');
  });

  it('should respect limit parameter', async () => {
    await setPlatformSetting('setting_1', 'value_1', 'string');
    await setPlatformSetting('setting_2', 'value_2', 'string');
    await setPlatformSetting('setting_3', 'value_3', 'string');

    const result = await listPlatformSettings({ limit: 2 });

    expect(result.settings).toHaveLength(2);
    expect(result.total).toBe(3);
  });

  it('should respect offset parameter', async () => {
    await setPlatformSetting('setting_1', 'value_1', 'string');
    await setPlatformSetting('setting_2', 'value_2', 'string');
    await setPlatformSetting('setting_3', 'value_3', 'string');

    const result = await listPlatformSettings({ offset: 1 });

    expect(result.settings).toHaveLength(2);
    expect(result.total).toBe(3);
  });

  it('should respect both limit and offset parameters', async () => {
    await setPlatformSetting('setting_1', 'value_1', 'string');
    await setPlatformSetting('setting_2', 'value_2', 'string');
    await setPlatformSetting('setting_3', 'value_3', 'string');
    await setPlatformSetting('setting_4', 'value_4', 'string');

    const result = await listPlatformSettings({ limit: 2, offset: 1 });

    expect(result.settings).toHaveLength(2);
    expect(result.total).toBe(4);
  });

  it('should enforce minimum limit of 1', async () => {
    await expect(
      listPlatformSettings({ limit: 0 })
    ).rejects.toThrow();
  });

  it('should enforce maximum limit of 100', async () => {
    await expect(
      listPlatformSettings({ limit: 101 })
    ).rejects.toThrow();
  });

  it('should return settings with all required fields', async () => {
    await setPlatformSetting('test_setting', 'test_value', 'string');

    const result = await listPlatformSettings({});

    expect(result.settings[0]).toMatchObject({
      id: expect.any(String),
      settingKey: 'test_setting',
      settingValue: 'test_value',
      settingType: 'string',
      updatedAt: expect.any(Date)
    });
  });

  it('should handle different setting types correctly', async () => {
    await setPlatformSetting('string_setting', 'text', 'string');
    await setPlatformSetting('number_setting', 42, 'number');
    await setPlatformSetting('boolean_setting', true, 'boolean');
    await setPlatformSetting('json_setting', { key: 'value' }, 'json');

    const result = await listPlatformSettings({});

    expect(result.settings).toHaveLength(4);

    const settingsByKey = result.settings.reduce((acc, s) => {
      acc[s.settingKey] = s;
      return acc;
    }, {} as Record<string, typeof result.settings[0]>);

    expect(settingsByKey['string_setting'].settingType).toBe('string');
    expect(settingsByKey['number_setting'].settingType).toBe('number');
    expect(settingsByKey['boolean_setting'].settingType).toBe('boolean');
    expect(settingsByKey['json_setting'].settingType).toBe('json');
  });
});
