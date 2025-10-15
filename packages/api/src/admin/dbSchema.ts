import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const platformSettings = pgTable('platform_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  settingKey: text('setting_key').notNull().unique(),
  settingValue: text('setting_value').notNull(),
  settingType: text('setting_type').notNull(), // 'number' | 'string' | 'boolean' | 'json'
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});
