import { generateUploadUrl } from '@/storage/generateUploadUrl';
import { TRPCError } from '@trpc/server';
import { describe, expect, it, vi } from 'vitest';
import { createPhotoUploadUrl } from './createPhotoUploadUrl';

// Mock only the storage module since we're testing the integration with real S3 calls
vi.mock('@/storage/generateUploadUrl', () => ({
  generateUploadUrl: vi.fn()
}));

describe('createPhotoUploadUrl', () => {
  it('should return upload URL, fields, and fileId', async () => {
    const userId = 'user-123';
    const input = { contentType: 'image/jpeg' as const };
    const mockResponse = {
      uploadUrl: 'https://s3.example.com/upload',
      fields: {
        key: 'test-key',
        policy: 'test-policy',
        'x-amz-signature': 'test-signature'
      },
      fileId: 'test-file-id-123'
    };

    vi.mocked(generateUploadUrl).mockResolvedValueOnce(mockResponse);

    const result = await createPhotoUploadUrl(userId, input);

    expect(result).toEqual(mockResponse);
    expect(generateUploadUrl).toHaveBeenCalledWith({
      contentType: input.contentType,
      folder: `public/users/${userId}/profile-photo`
    });
  });

  it('should throw TRPCError if S3 generation fails', async () => {
    const userId = 'user-123';
    const input = { contentType: 'image/png' as const };

    vi.mocked(generateUploadUrl).mockRejectedValueOnce(
      new Error('S3 service unavailable')
    );

    await expect(createPhotoUploadUrl(userId, input)).rejects.toThrow(TRPCError);
    await expect(createPhotoUploadUrl(userId, input)).rejects.toMatchObject({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Falha ao gerar URL de upload'
    });
  });

  it('should handle different content types', async () => {
    const userId = 'user-456';

    const contentTypes = ['image/jpeg', 'image/png', 'image/webp'] as const;

    for (const contentType of contentTypes) {
      const input = { contentType };
      const mockResponse = {
        uploadUrl: `https://s3.example.com/upload-${contentType}`,
        fields: {
          key: 'test-key',
          policy: 'test-policy'
        },
        fileId: `test-file-id-${contentType}`
      };

      vi.mocked(generateUploadUrl).mockResolvedValueOnce(mockResponse);

      const result = await createPhotoUploadUrl(userId, input);

      expect(result).toEqual(mockResponse);
      expect(generateUploadUrl).toHaveBeenCalledWith({
        contentType,
        folder: `public/users/${userId}/profile-photo`
      });
    }
  });
});
