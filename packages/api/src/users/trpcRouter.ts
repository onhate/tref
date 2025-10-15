import { router, trpcProtected } from '@/trpc';
import { confirmPhotoUpload, confirmPhotoUploadSchema } from './confirmPhotoUpload';
import { createPhotoUploadUrl, createPhotoUploadUrlSchema } from './createPhotoUploadUrl';
import { getMe } from './getMe';

export const usersRouter = router({
  /**
   * Get current authenticated user profile
   * Returns the user's complete profile information
   */
  getMe: trpcProtected
    .query(async ({ ctx }) => {
      return getMe(ctx.user.id);
    }),

  /**
   * Get S3 presigned URL for uploading profile photo
   * Returns URL valid for 5 minutes with KMS encryption enabled
   */
  createPhotoUploadUrl: trpcProtected
    .input(createPhotoUploadUrlSchema)
    .mutation(async ({ ctx, input }) => {
      return createPhotoUploadUrl(ctx.user.id, input);
    }),

  /**
   * Confirm photo upload and update user.image field with S3 URL
   * Call this after successfully uploading to S3 presigned URL
   */
  confirmPhotoUpload: trpcProtected
    .input(confirmPhotoUploadSchema)
    .mutation(async ({ ctx, input }) => {
      return confirmPhotoUpload(ctx.user.id, input);
    })
});
