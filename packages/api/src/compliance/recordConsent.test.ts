import { user } from '@/auth/dbSchema';
import { auditLogs, consentRecords } from '@/compliance/dbSchema';
import { db } from '@/db/db';
import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { recordConsent } from './recordConsent';

describe('recordConsent', () => {
  it('should record consent with all fields', async () => {
    // Insert test user
    const [testUser] = await db
      .insert(user)
      .values({
        id: 'consent-test-user-1',
        name: 'Test User',
        email: 'consent1@example.com',
        emailVerified: false,
        role: 'patient'
      })
      .returning();

    await recordConsent({
      userId: testUser.id,
      consentVersion: 'v1.0',
      consentText: 'I agree to the terms and conditions',
      consentType: 'registration',
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0'
    });

    // Verify consent record
    const consent = await db.query.consentRecords.findFirst({
      where: eq(consentRecords.userId, testUser.id)
    });

    expect(consent).toBeDefined();
    expect(consent?.userId).toBe(testUser.id);
    expect(consent?.consentVersion).toBe('v1.0');
    expect(consent?.consentText).toBe('I agree to the terms and conditions');
    expect(consent?.consentType).toBe('registration');
    expect(consent?.accepted).toBe(true);
    expect(consent?.ipAddress).toBe('192.168.1.1');
    expect(consent?.userAgent).toBe('Mozilla/5.0');

    // Verify audit log was created
    const logs = await db.query.auditLogs.findMany({
      where: eq(auditLogs.userId, testUser.id)
    });

    expect(logs.length).toBeGreaterThan(0);
    const log = logs.find((l) => l.eventType === 'consent.accepted');
    expect(log).toBeDefined();
    expect(log!.eventData).toEqual({
      consentVersion: 'v1.0',
      consentType: 'registration'
    });
  });

  it('should record consent without optional fields', async () => {
    // Insert test user
    const [testUser] = await db
      .insert(user)
      .values({
        id: 'consent-test-user-2',
        name: 'Test User 2',
        email: 'consent2@example.com',
        emailVerified: false,
        role: 'patient'
      })
      .returning();

    await recordConsent({
      userId: testUser.id,
      consentVersion: 'v2.0',
      consentText: 'Updated terms',
      consentType: 'profile_update'
    });

    // Verify consent record
    const consent = await db.query.consentRecords.findFirst({
      where: eq(consentRecords.userId, testUser.id)
    });

    expect(consent).toBeDefined();
    expect(consent?.userId).toBe(testUser.id);
    expect(consent?.consentVersion).toBe('v2.0');
    expect(consent?.ipAddress).toBeNull();
    expect(consent?.userAgent).toBeNull();
  });
});