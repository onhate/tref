import { user } from '@/auth/dbSchema';
import { relations } from 'drizzle-orm';
import { boolean, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

/**
 * Consent records table for LGPD compliance
 * Tracks user consent for data processing
 */
export const consentRecords = pgTable('consent_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  consentVersion: text('consent_version').notNull(), // e.g., "v1.0"
  consentText: text('consent_text').notNull(), // Full consent text at time of acceptance
  consentType: text('consent_type').notNull(), // e.g., "registration", "profile_update"
  accepted: boolean('accepted').notNull().default(true),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

/**
 * Audit logs table for tracking all auth and profile events (LGPD requirement)
 */
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').references(() => user.id, { onDelete: 'set null' }), // Nullable for system events
  eventType: text('event_type').notNull(), // e.g., "user.registered", "profile.created", "user.login"
  eventData: jsonb('event_data'), // JSON stored as text
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// Relations
export const consentRecordsRelations = relations(consentRecords, ({ one }) => ({
  user: one(user, {
    fields: [consentRecords.userId],
    references: [user.id]
  })
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(user, {
    fields: [auditLogs.userId],
    references: [user.id]
  })
}));
