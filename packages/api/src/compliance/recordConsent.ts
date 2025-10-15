import { createAuditLog } from '@/compliance/createAuditLog';
import { consentRecords } from '@/compliance/dbSchema';
import { db } from '@/db/db';
import { z } from 'zod';

export const recordConsentSchema = z.object({
  userId: z.string(),
  consentVersion: z.string(),
  consentText: z.string(),
  consentType: z.string(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional()
});

/**
 * Record user consent for LGPD compliance
 * Also logs consent acceptance to the audit trail
 */
export async function recordConsent(
  rawInput: z.input<typeof recordConsentSchema>
): Promise<void> {
  const input = recordConsentSchema.parse(rawInput);

  await db.insert(consentRecords).values({
    userId: input.userId,
    consentVersion: input.consentVersion,
    consentText: input.consentText,
    consentType: input.consentType,
    accepted: true,
    ipAddress: input.ipAddress ?? null,
    userAgent: input.userAgent ?? null
  });

  // Also log to audit trail
  await createAuditLog({
    userId: input.userId,
    eventType: 'consent.accepted',
    eventData: {
      consentVersion: input.consentVersion,
      consentType: input.consentType
    },
    ipAddress: input.ipAddress,
    userAgent: input.userAgent
  });
}
