import { generateUploadUrl } from '@/storage/generateUploadUrl';
import { allowedImageTypes } from '@/storage/s3Client';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

export const createPhotoUploadUrlSchema = z.object({
  contentType: z.enum(allowedImageTypes)
});

/**
 * Get S3 presigned URL for uploading profile photo
 * Returns URL valid for 5 minutes with KMS encryption enabled
 */
export async function createPhotoUploadUrl(userId: string, rawInput: z.input<typeof createPhotoUploadUrlSchema>) {
  const input = createPhotoUploadUrlSchema.parse(rawInput);

  try {
    // Define folder path for profile photo (public storage)
    const folder = `public/users/${userId}/profile-photo`;

    const { uploadUrl, fileId, fields } = await generateUploadUrl({
      contentType: input.contentType,
      folder
    });

    return { uploadUrl, fileId, fields };
  } catch (error) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Falha ao gerar URL de upload',
      cause: error
    });
  }
}
