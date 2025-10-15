import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Resource } from 'sst';
import { z } from 'zod';
import { defaultPresignedUrlExpiresIn, s3Client } from './s3Client';

export const getObjectUrlSchema = z.object({
  fileId: z.string(),
  expiresIn: z.number().optional()
});


/**
 * Generates a presigned URL for downloading a file from S3
 * The fileId is mapped to the internal S3 key structure
 */
export async function getObjectSignedUrl(
  rawInput: z.input<typeof getObjectUrlSchema>
): Promise<string> {
  const input = getObjectUrlSchema.parse(rawInput);

  // Create GetObject command
  const command = new GetObjectCommand({
    Bucket: Resource.Bucket.name,
    Key: input.fileId
  });

  // Generate presigned URL for download
  return await getSignedUrl(s3Client, command, {
    expiresIn: input.expiresIn ?? defaultPresignedUrlExpiresIn
  });
}
