import { user } from '@/auth/dbSchema';
import { describe, expect, it } from 'vitest';
import { db } from './db';

describe('Database Setup', () => {
  it('should connect to the test database', async () => {
    // Simple query to verify connection
    const result = await db.select().from(user).limit(1);

    // If query runs without error, connection is working
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });

  it('should have empty tables after cleanup', async () => {
    // Insert a test user
    await db.insert(user).values({
      id: 'test-user-1',
      email: 'test@example.com',
      emailVerified: false,
      name: 'Test User',
      role: 'patient'
    });

    // Verify it was inserted
    const users = await db.select().from(user);
    expect(users.length).toBeGreaterThan(0);
  });

  it('should truncate tables between tests', async () => {
    // This test runs after the previous one
    // If cleanup works, the table should be empty
    const users = await db.select().from(user);
    expect(users.length).toBe(0);
  });
});
