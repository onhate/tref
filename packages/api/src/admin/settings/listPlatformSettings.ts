import { platformSettings } from '@/admin/dbSchema';
import { db } from '@/db/db';
import { desc } from 'drizzle-orm';
import { z } from 'zod';

export const listPlatformSettingsSchema = z.object({
  limit: z.number().min(1).max(100).default(50).optional(),
  offset: z.number().min(0).default(0).optional()
});

export type ListPlatformSettingsInput = z.infer<typeof listPlatformSettingsSchema>;

export interface PlatformSettingItem {
  id: string;
  settingKey: string;
  settingValue: string;
  settingType: string;
  updatedAt: Date;
}

export interface ListPlatformSettingsResult {
  settings: PlatformSettingItem[];
  total: number;
}

export async function listPlatformSettings(
  rawInput: z.input<typeof listPlatformSettingsSchema>
): Promise<ListPlatformSettingsResult> {
  const input = listPlatformSettingsSchema.parse(rawInput);

  const [settings, totalResult] = await Promise.all([
    db
      .select()
      .from(platformSettings)
      .orderBy(desc(platformSettings.updatedAt))
      .limit(input.limit ?? 50)
      .offset(input.offset ?? 0),
    db.select({ count: db.$count(platformSettings) }).from(platformSettings)
  ]);

  return {
    settings,
    total: totalResult[0]?.count ?? 0
  };
}
