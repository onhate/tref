import { auditLogs } from '@/compliance/dbSchema';
import { db } from '@/db/db';
import { logger } from '@/lib/logger';
import { z } from 'zod';

export const auditEventTypeSchema = z.enum([
  'user.registered',
  'user.login',
  'profile.created',
  'profile.updated',
  'consent.accepted',
  'email.sent',
  'email.failed',
  'doctor.profile_created',
  'doctor.profile_updated',
  'doctor.verification_submitted',
  'doctor.verification_resubmitted',
  'doctor.approved',
  'doctor.rejected',
  'doctor.more_info_requested',
  'document.upload_initiated',
  'document.upload_completed',
  'document.verified',
  'document.rejected',
  'document.deleted'
]);

export const createAuditLogSchema = z.object({
  userId: z.string().optional(),
  eventType: auditEventTypeSchema,
  eventData: z.record(z.string(), z.any()).optional(),
  ipAddress: z.string().optional().nullable(),
  userAgent: z.string().optional().nullable()
});

/**
 * Creates an audit log entry for LGPD compliance
 * This function does not throw errors to avoid breaking the main application flow
 */
export async function createAuditLog(rawInput: z.input<typeof createAuditLogSchema>): Promise<void> {
  logger.addMeta({
    functionName: 'createAuditLog'
  });

  try {
    const input = createAuditLogSchema.parse(rawInput);

    await db.insert(auditLogs).values({
      eventType: input.eventType,
      userId: input.userId ?? null,
      eventData: input.eventData ?? null,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null
    });
  } catch (error) {
    // Log error but don't throw - audit logging should not break main flow
    logger.error({ error }, 'Failed to log audit event');
  }
}
