import { getObjectSignedUrl } from '@/storage/getObjectSignedUrl';
import type { Document } from './dbSchema';

/**
 * Generate S3 presigned URL for a document
 * Returns null if document has no fileId or is not uploaded
 *
 * @param document - Document record from database
 * @returns S3 presigned URL (5-minute expiry) or null
 */
export async function getFileUrl(document: Document): Promise<string | null> {
  if (document.fileId && document.uploadStatus === 'uploaded') {
    return getObjectSignedUrl({
      fileId: document.fileId,
      expiresIn: 300 // 5 minutes
    });
  }
  return null;
}
