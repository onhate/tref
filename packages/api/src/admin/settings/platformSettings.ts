import { platformSettings } from '@/admin/dbSchema';
import { db } from '@/db/db';
import { eq } from 'drizzle-orm';
import { clearCacheKey, getCachedSetting, setCachedSetting } from './platformSettingsCache';

type SettingType = 'number' | 'string' | 'boolean' | 'json';

const TYPE_ERROR_MESSAGES: Record<SettingType, string> = {
  number: 'número',
  string: 'string',
  boolean: 'booleano',
  json: 'json'
};

// Generic internal function for getting settings with type validation and caching
async function getPlatformSetting<T>(
  key: string,
  expectedType: SettingType,
  fallback: T,
  parser: (settingValue: string, fallback: T) => T
): Promise<T> {
  // Check cache first
  const cached = await getCachedSetting<T>(key);
  if (cached !== undefined) {
    return cached;
  }

  // Cache miss - fetch from database
  const setting = await db.query.platformSettings.findFirst({
    where: eq(platformSettings.settingKey, key)
  });

  if (!setting) {
    return fallback;
  }

  if (setting.settingType !== expectedType) {
    throw new Error(`Configuração ${key} não é do tipo ${TYPE_ERROR_MESSAGES[expectedType]}`);
  }

  const result = parser(setting.settingValue, fallback);

  // Store in cache
  await setCachedSetting(key, result);

  return result;
}

export async function getPlatformSettingNumber(
  key: string,
  fallback: number
): Promise<number> {
  return getPlatformSetting(
    key,
    'number',
    fallback,
    (value, fb) => {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? fb : parsed;
    }
  );
}

export async function getPlatformSettingString(
  key: string,
  fallback: string
): Promise<string> {
  return getPlatformSetting(
    key,
    'string',
    fallback,
    (value) => value
  );
}

export async function getPlatformSettingBoolean(
  key: string,
  fallback: boolean
): Promise<boolean> {
  return getPlatformSetting(
    key,
    'boolean',
    fallback,
    (value) => value === 'true'
  );
}

export async function getPlatformSettingJSON<T = unknown>(
  key: string,
  fallback: T
): Promise<T> {
  return getPlatformSetting(
    key,
    'json',
    fallback,
    (value, fb) => {
      try {
        return JSON.parse(value) as T;
      } catch {
        return fb;
      }
    }
  );
}

function resolveStringValue(value: string | number | boolean | object, type: SettingType): string {
  if (type === 'json') {
    return JSON.stringify(value);
  }

  return String(value);
}

// Admin mutation function - handles upsert (insert new or update existing)
export async function setPlatformSetting(
  key: string,
  value: string | number | boolean | object,
  type: SettingType
): Promise<void> {
  const stringValue = resolveStringValue(value, type);

  await db
    .insert(platformSettings)
    .values({
      settingKey: key,
      settingValue: stringValue,
      settingType: type
    })
    .onConflictDoUpdate({
      target: platformSettings.settingKey,
      set: {
        settingValue: stringValue,
        settingType: type,
        updatedAt: new Date()
      }
    });

  // Invalidate cache for this key to ensure fresh data on next read
  await clearCacheKey(key);
}
