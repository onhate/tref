import { describe, expect, it, vi } from 'vitest';
import { getObjectSignedUrl } from './getObjectSignedUrl';

// Mock AWS SDK
vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: vi.fn(async (_client, command) => {
    console.log('Mocked S3 command:', command);
    return `https://mock-presigned-download-url.com/${command.input.Key}`;
  })
}));

describe('getObjectUrl', () => {
  it('should generate presigned download URL from fileId', async () => {
    const url = await getObjectSignedUrl({
      fileId: 'profile-photos/user-123/abc-123.jpg'
    });

    expect(url).toBe('https://mock-presigned-download-url.com/profile-photos/user-123/abc-123.jpg');
  });

  it('should handle public files', async () => {
    const url = await getObjectSignedUrl({
      fileId: 'public/def-456.png'
    });

    expect(url).toBe('https://mock-presigned-download-url.com/public/def-456.png');
  });
});
