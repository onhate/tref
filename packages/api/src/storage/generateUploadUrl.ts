import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { randomUUID } from 'crypto';
import { Resource } from 'sst';
import { z } from 'zod';
import { defaultPresignedUrlExpiresIn, s3Client } from './s3Client';

const DEFAULT_MAX_SIZE_MB = 10;
const DEFAULT_MAX_SIZE_BYTES = DEFAULT_MAX_SIZE_MB * 1024 * 1024;

export const generateUploadUrlSchema = z.object({
  folder: z.string().min(1),
  contentType: z.string().min(1),
  maxSizeBytes: z.number().positive().optional().default(DEFAULT_MAX_SIZE_BYTES)
});

export interface GenerateUploadUrlResult {
  uploadUrl: string;
  fields: Record<string, string>;
  fileId: string;
}

/**
 * Generates a presigned POST for uploading files to S3
 *
 * DO NOT EXPOSE THIS FUNCTION DIRECTLY TO API AND CLIENT
 *
 * This is a low-level utility function used by upload functions throughout the API.
 * The caller provides the complete folder path (including any user/case identifiers).
 *
 * Returns:
 * - uploadUrl: S3 presigned POST URL
 * - fields: Form fields to include in multipart POST
 * - fileId: Complete S3 key path (folder/uuid.extension) for later retrieval
 *
 * The fileId is stored and used to generate download/view URLs later.
 *
 * Default max size: 10MB (can be overridden via maxSizeBytes)
 * URL expiration: Defined by defaultPresignedUrlExpiresIn (typically 5 minutes)
 * Encryption: AWS KMS server-side encryption enabled
 *
 * @param rawInput - Content type, folder path, and optional max size
 * @returns Presigned POST data and file ID
 */
export async function generateUploadUrl(
  rawInput: z.input<typeof generateUploadUrlSchema>
): Promise<GenerateUploadUrlResult> {
  const input = generateUploadUrlSchema.parse(rawInput);

  // Generate unique file ID and S3 key
  const fileExtension = input.contentType.split('/')[1];
  const fileId = `${input.folder}/${randomUUID()}.${fileExtension}`;

  // Create presigned POST with KMS encryption and content-type enforcement
  const { url, fields } = await createPresignedPost(s3Client, {
    Bucket: Resource.Bucket.name,
    Key: fileId,
    Conditions: [
      ['content-length-range', 0, input.maxSizeBytes],
      ['eq', '$Content-Type', input.contentType]
    ],
    Fields: {
      'Content-Type': input.contentType,
      'x-amz-server-side-encryption': 'aws:kms'
    },
    Expires: defaultPresignedUrlExpiresIn
  });

  return { uploadUrl: url, fields, fileId };
}
