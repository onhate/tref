import { user } from '@/auth/dbSchema';
import { getFileUrl } from '@/constants/env';
import { db } from '@/db/db';
import { verifyObjectExists } from '@/storage/verifyObjectExists';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

export const confirmPhotoUploadSchema = z.object({
  fileId: z.string().min(1)
});

/**
 * Confirm photo upload and update user.image field with S3 URL
 * Call this after successfully uploading to S3 presigned URL
 */
export async function confirmPhotoUpload(userId: string, rawInput: z.input<typeof confirmPhotoUploadSchema>) {
  const input = confirmPhotoUploadSchema.parse(rawInput);

  // Verify the object exists in S3 before updating database
  await verifyObjectExists({
    key: input.fileId,
    notFoundMessage: 'Photo not found. Please upload the file before confirming.'
  });

  // Generate API URL for file access
  const imageUrl = getFileUrl(input.fileId);

  // Update user.image field
  await db
    .update(user)
    .set({ image: imageUrl })
    .where(eq(user.id, userId));

  return { success: true, imageUrl };
}
