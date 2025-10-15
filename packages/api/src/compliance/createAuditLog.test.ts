import { user } from '@/auth/dbSchema';
import { auditLogs } from '@/compliance/dbSchema';
import { db } from '@/db/db';
import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { createAuditLog } from './createAuditLog';

describe('createAuditLog', () => {
  it('should log audit event with all fields', async () => {
    // Create test user first to satisfy foreign key constraint
    const [testUser] = await db.insert(user).values({
      id: 'test-user-id',
      name: 'Test User',
      email: 'audit-test@example.com',
      emailVerified: false,
      role: 'patient'
    }).returning();

    await createAuditLog({
      userId: testUser.id,
      eventType: 'user.login',
      eventData: { method: 'password' },
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0'
    });

    const logs = await db.query.auditLogs.findMany({
      where: eq(auditLogs.eventType, 'user.login')
    });

    expect(logs.length).toBeGreaterThan(0);
    const log = logs[logs.length - 1];
    expect(log.userId).toBe(testUser.id);
    expect(log.eventType).toBe('user.login');
    expect(log.eventData).toEqual({ method: 'password' });
    expect(log.ipAddress).toBe('192.168.1.1');
    expect(log.userAgent).toBe('Mozilla/5.0');
  });

  it('should log audit event without optional fields', async () => {
    await createAuditLog({
      eventType: 'user.registered'
    });

    const logs = await db.query.auditLogs.findMany({
      where: eq(auditLogs.eventType, 'user.registered')
    });

    expect(logs.length).toBeGreaterThan(0);
    const log = logs[logs.length - 1];
    expect(log.userId).toBeNull();
    expect(log.eventType).toBe('user.registered');
    expect(log.eventData).toBeNull();
    expect(log.ipAddress).toBeNull();
    expect(log.userAgent).toBeNull();
  });

  it('should not throw error on database failure', async () => {
    await expect(
      createAuditLog({
        eventType: null as unknown as any,
        userId: null as unknown as string
      })
    ).resolves.toBeUndefined();
  });

  it('should log email sent events', async () => {
    const [testUser] = await db.insert(user).values({
      id: 'test-email-user',
      name: 'Email User',
      email: 'email-test@example.com',
      emailVerified: false,
      role: 'patient'
    }).returning();

    await createAuditLog({
      userId: testUser.id,
      eventType: 'email.sent',
      eventData: {
        to: ['recipient@example.com'],
        subject: 'Test Email',
        messageId: 'test-message-id'
      }
    });

    const logs = await db.query.auditLogs.findMany({
      where: eq(auditLogs.eventType, 'email.sent')
    });

    expect(logs.length).toBeGreaterThan(0);
    const log = logs[logs.length - 1];
    expect(log.userId).toBe(testUser.id);
    expect(log.eventType).toBe('email.sent');
  });

  it('should log email failed events', async () => {
    await createAuditLog({
      eventType: 'email.failed',
      eventData: {
        to: ['recipient@example.com'],
        subject: 'Test Email',
        error: 'SES Error'
      }
    });

    const logs = await db.query.auditLogs.findMany({
      where: eq(auditLogs.eventType, 'email.failed')
    });

    expect(logs.length).toBeGreaterThan(0);
  });
});
