import { z } from 'zod';
import { setPlatformSetting } from './platformSettings';

const settingTypeSchema = z.enum(['number', 'string', 'boolean', 'json']);

export const updatePlatformSettingSchema = z.object({
  settingKey: z.string().min(1).max(255),
  settingValue: z.union([z.string(), z.number(), z.boolean(), z.record(z.string(), z.unknown()), z.array(z.unknown())]),
  settingType: settingTypeSchema
});

export type UpdatePlatformSettingInput = z.infer<typeof updatePlatformSettingSchema>;

function validateValueMatchesType(
  value: string | number | boolean | object,
  type: 'number' | 'string' | 'boolean' | 'json'
): void {
  if (type === 'number' && typeof value !== 'number') {
    throw new Error('Valor deve ser um número quando o tipo é "number"');
  }

  if (type === 'string' && typeof value !== 'string') {
    throw new Error('Valor deve ser uma string quando o tipo é "string"');
  }

  if (type === 'boolean' && typeof value !== 'boolean') {
    throw new Error('Valor deve ser um booleano quando o tipo é "boolean"');
  }

  if (type === 'json' && typeof value !== 'object') {
    throw new Error('Valor deve ser um objeto quando o tipo é "json"');
  }
}

export async function updatePlatformSetting(
  rawInput: z.input<typeof updatePlatformSettingSchema>
): Promise<void> {
  const input = updatePlatformSettingSchema.parse(rawInput);

  validateValueMatchesType(input.settingValue, input.settingType);

  await setPlatformSetting(input.settingKey, input.settingValue, input.settingType);
}
