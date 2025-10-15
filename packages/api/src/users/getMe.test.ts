import { user } from '@/auth/dbSchema';
import { db } from '@/db/db';
import { TRPCError } from '@trpc/server';
import { describe, expect, it } from 'vitest';
import { getMe } from './getMe';

describe('getMe', () => {
  it('should return the current user profile', async () => {
    // 1. Insert test data
    const [testUser] = await db
      .insert(user)
      .values({
        id: 'test-user-id',
        name: 'Test User',
        email: 'test@example.com',
        emailVerified: true
      })
      .returning();

    // 2. Call function
    const result = await getMe(testUser.id);

    // 3. Assert
    expect(result).toMatchObject({
      id: testUser.id,
      name: 'Test User',
      email: 'test@example.com',
      emailVerified: true
    });
    expect(result.createdAt).toBeDefined();
    expect(result.updatedAt).toBeDefined();
  });

  it('should throw NOT_FOUND error when user does not exist', async () => {
    // Call function with non-existent user ID
    await expect(getMe('non-existent-id')).rejects.toThrow(TRPCError);

    await expect(getMe('non-existent-id')).rejects.toMatchObject({
      code: 'NOT_FOUND',
      message: 'Usuário não encontrado'
    });
  });

  it('should return all user fields including optional ones', async () => {
    // 1. Insert test data with optional fields
    const [testUser] = await db
      .insert(user)
      .values({
        id: 'test-user-full-id',
        name: 'Full User',
        email: 'full@example.com',
        emailVerified: false,
        image: 'https://example.com/avatar.jpg',
        isAnonymous: false
      })
      .returning();

    // 2. Call function
    const result = await getMe(testUser.id);

    // 3. Assert all fields
    expect(result).toMatchObject({
      id: testUser.id,
      name: 'Full User',
      email: 'full@example.com',
      emailVerified: false,
      image: 'https://example.com/avatar.jpg',
      isAnonymous: false
    });
  });
});
