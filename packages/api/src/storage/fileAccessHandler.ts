import { HonoEnv } from '@/hono';
import type { Context } from 'hono';
import { getObjectSignedUrl } from './getObjectSignedUrl';
import { validateFileAccess } from './validateFileAccess';

/**
 * File access endpoint handler
 * Validates user access to a file and redirects to S3 presigned URL
 */
export async function fileAccessHandler(ctx: Context<HonoEnv>) {
  try {
    // Extract fileId from path (everything after /api/files/)
    const fileId = ctx.req.path.replace('/api/files/', '');

    if (!fileId) {
      return ctx.json({ error: 'File ID is required' }, 400);
    }

    // Get user from context (set by session middleware)
    const user = ctx.get('user');

    await validateFileAccess({
      user,
      fileId
    });

    // Generate fresh S3 presigned URL (1 hour expiry)
    const s3Url = await getObjectSignedUrl({
      fileId,
      expiresIn: 120 // 2 minutes
    });

    // Redirect to S3 presigned URL
    return ctx.redirect(s3Url, 302);
  } catch (error: any) {
    // Return 404 for any errors (including access denied)
    return ctx.json({ error: error.message || 'File not found' }, 404);
  }
}
