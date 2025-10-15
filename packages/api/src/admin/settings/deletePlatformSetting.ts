import { platformSettings } from '@/admin/dbSchema';
import { db } from '@/db/db';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

export const deletePlatformSettingSchema = z.object({
  settingKey: z.string().min(1)
});

export type DeletePlatformSettingInput = z.infer<typeof deletePlatformSettingSchema>;

export async function deletePlatformSetting(
  rawInput: z.input<typeof deletePlatformSettingSchema>
): Promise<void> {
  const input = deletePlatformSettingSchema.parse(rawInput);

  const result = await db
    .delete(platformSettings)
    .where(eq(platformSettings.settingKey, input.settingKey))
    .returning();

  if (result.length === 0) {
    throw new Error(`Configuração da plataforma com chave "${input.settingKey}" não encontrada`);
  }
}
