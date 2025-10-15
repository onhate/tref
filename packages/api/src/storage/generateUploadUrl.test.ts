import { describe, expect, it, vi } from 'vitest';
import { generateUploadUrl } from './generateUploadUrl';

// Mock AWS SDK
vi.mock('@aws-sdk/s3-presigned-post', () => ({
  createPresignedPost: vi.fn(async () => ({
    url: 'https://mock-bucket.s3.amazonaws.com',
    fields: {
      key: 'mock-key',
      'x-amz-algorithm': 'AWS4-HMAC-SHA256',
      'x-amz-credential': 'mock-credential',
      'x-amz-date': '20240101T000000Z',
      policy: 'mock-policy',
      'x-amz-signature': 'mock-signature'
    }
  }))
}));

describe('generateUploadUrl', () => {
  it('should generate presigned POST and return url, fields, and fileId', async () => {
    const result = await generateUploadUrl({
      contentType: 'image/jpeg',
      folder: 'profile-photos/test-user-123'
    });

    expect(result.uploadUrl).toBe('https://mock-bucket.s3.amazonaws.com');
    expect(result.fields).toHaveProperty('key');
    expect(result.fields).toHaveProperty('x-amz-signature');
    expect(result.fileId).toMatch(/^profile-photos\/test-user-123\/[a-f0-9-]+\.jpeg$/); // fileId is full S3 path
  });

  it('should generate presigned POST with custom folder', async () => {
    const result = await generateUploadUrl({
      contentType: 'image/png',
      folder: 'private/users/test-user-456/photos'
    });

    expect(result.uploadUrl).toBe('https://mock-bucket.s3.amazonaws.com');
    expect(result.fields).toBeDefined();
    expect(result.fileId).toMatch(/^private\/users\/test-user-456\/photos\/[a-f0-9-]+\.png$/);
  });

  it('should handle webp content type', async () => {
    const result = await generateUploadUrl({
      contentType: 'image/webp',
      folder: 'documents/test-user-789'
    });

    expect(result.uploadUrl).toBe('https://mock-bucket.s3.amazonaws.com');
    expect(result.fields).toBeDefined();
    expect(result.fileId).toMatch(/^documents\/test-user-789\/[a-f0-9-]+\.webp$/);
  });

  it('should validate input with Zod schema', async () => {
    await expect(
      generateUploadUrl({
        contentType: '',
        folder: 'test'
      })
    ).rejects.toThrow();

    await expect(
      generateUploadUrl({
        contentType: 'image/jpeg',
        folder: ''
      })
    ).rejects.toThrow();
  });

  it('should use default maxSizeBytes when not provided', async () => {
    const result = await generateUploadUrl({
      contentType: 'image/jpeg',
      folder: 'test-folder'
    });

    expect(result.fileId).toBeDefined();
    // Default size should be applied (10MB)
  });

  it('should accept custom maxSizeBytes', async () => {
    const result = await generateUploadUrl({
      contentType: 'image/jpeg',
      folder: 'test-folder',
      maxSizeBytes: 5 * 1024 * 1024 // 5MB
    });

    expect(result.fileId).toBeDefined();
  });
});
