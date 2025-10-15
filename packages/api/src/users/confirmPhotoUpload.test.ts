import { user } from '@/auth/dbSchema';
import { apiUrl } from '@/constants/env';
import { db } from '@/db/db';
import { verifyObjectExists } from '@/storage/verifyObjectExists';
import { eq } from 'drizzle-orm';
import { describe, expect, it, vi } from 'vitest';
import { confirmPhotoUpload } from './confirmPhotoUpload';

// Mock storage functions
vi.mock('@/storage/verifyObjectExists', () => ({
  verifyObjectExists: vi.fn()
}));

describe('confirmPhotoUpload', () => {
  it('should confirm upload and return image URL', async () => {
    // Insert test user
    const [testUser] = await db.insert(user).values({
      id: 'user-123',
      name: 'Test User',
      email: 'test@example.com',
      emailVerified: false,
      role: 'patient'
    }).returning();

    const input = { fileId: 'test-file-id-123' };
    const expectedImageUrl = `${apiUrl}/api/files/${input.fileId}`;

    // Mock verifyObjectExists to return success (object exists)
    vi.mocked(verifyObjectExists).mockResolvedValueOnce();

    const result = await confirmPhotoUpload(testUser.id, input);

    expect(result).toEqual({ success: true, imageUrl: expectedImageUrl });

    // Verify the user's image field was updated
    const updatedUser = await db.query.user.findFirst({
      where: eq(user.id, testUser.id)
    });

    expect(updatedUser?.image).toBe(expectedImageUrl);
  });

  it('should update existing image URL', async () => {
    // Insert test user with existing image
    const [testUser] = await db.insert(user).values({
      id: 'user-456',
      name: 'Test User Two',
      email: 'test2@example.com',
      emailVerified: false,
      role: 'patient',
      image: 'https://cdn.example.com/old-image.jpg'
    }).returning();

    const input = { fileId: 'test-file-id-456' };
    const newImageUrl = `${apiUrl}/api/files/${input.fileId}`;

    // Mock verifyObjectExists to return success (object exists)
    vi.mocked(verifyObjectExists).mockResolvedValueOnce();

    const result = await confirmPhotoUpload(testUser.id, input);

    expect(result).toEqual({ success: true, imageUrl: newImageUrl });

    // Verify the image was replaced
    const updatedUser = await db.query.user.findFirst({
      where: eq(user.id, testUser.id)
    });

    expect(updatedUser?.image).toBe(newImageUrl);
    expect(updatedUser?.image).not.toBe('https://cdn.example.com/old-image.jpg');
  });
});
