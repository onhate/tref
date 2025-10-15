import { platformSettings } from '@/admin/dbSchema';
import { db } from '@/db/db';
import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { deletePlatformSetting } from './deletePlatformSetting';
import { setPlatformSetting } from './platformSettings';

describe('deletePlatformSetting', () => {
  beforeEach(async () => {
    await db.delete(platformSettings);
  });

  it('should delete an existing setting', async () => {
    await setPlatformSetting('test_setting', 'value', 'string');

    await deletePlatformSetting({ settingKey: 'test_setting' });

    const result = await db
      .select()
      .from(platformSettings)
      .where(eq(platformSettings.settingKey, 'test_setting'));

    expect(result).toHaveLength(0);
  });

  it('should throw error when trying to delete non-existent setting', async () => {
    await expect(
      deletePlatformSetting({ settingKey: 'non_existent' })
    ).rejects.toThrow('Configuração da plataforma com chave "non_existent" não encontrada');
  });

  it('should delete only the specified setting', async () => {
    await setPlatformSetting('setting_1', 'value_1', 'string');
    await setPlatformSetting('setting_2', 'value_2', 'string');
    await setPlatformSetting('setting_3', 'value_3', 'string');

    await deletePlatformSetting({ settingKey: 'setting_2' });

    const allSettings = await db.select().from(platformSettings);

    expect(allSettings).toHaveLength(2);
    expect(allSettings.map(s => s.settingKey)).toEqual(
      expect.arrayContaining(['setting_1', 'setting_3'])
    );
    expect(allSettings.map(s => s.settingKey)).not.toContain('setting_2');
  });

  it('should delete settings of different types', async () => {
    await setPlatformSetting('number_setting', 42, 'number');
    await setPlatformSetting('string_setting', 'text', 'string');
    await setPlatformSetting('boolean_setting', true, 'boolean');
    await setPlatformSetting('json_setting', { key: 'value' }, 'json');

    await deletePlatformSetting({ settingKey: 'number_setting' });
    await deletePlatformSetting({ settingKey: 'string_setting' });
    await deletePlatformSetting({ settingKey: 'boolean_setting' });
    await deletePlatformSetting({ settingKey: 'json_setting' });

    const allSettings = await db.select().from(platformSettings);

    expect(allSettings).toHaveLength(0);
  });

  it('should reject empty setting key', async () => {
    await expect(
      deletePlatformSetting({ settingKey: '' })
    ).rejects.toThrow();
  });

  it('should allow re-creating a deleted setting', async () => {
    await setPlatformSetting('recreate_test', 'original', 'string');
    await deletePlatformSetting({ settingKey: 'recreate_test' });

    await setPlatformSetting('recreate_test', 'new_value', 'string');

    const result = await db
      .select()
      .from(platformSettings)
      .where(eq(platformSettings.settingKey, 'recreate_test'));

    expect(result).toHaveLength(1);
    expect(result[0].settingValue).toBe('new_value');
  });
});
