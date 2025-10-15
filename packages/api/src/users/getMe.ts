import { user } from '@/auth/dbSchema';
import { db } from '@/db/db';
import { logger } from '@/lib/logger';
import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';

/**
 * Get current authenticated user profile
 * Returns the user's complete profile information
 */
export async function getMe(userId: string) {
  logger.addMeta({
    functionName: 'getMe',
    userId
  });

  const currentUser = await db.query.user.findFirst({
    where: eq(user.id, userId)
  });

  if (!currentUser) {
    logger.error('User not found');
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Usuário não encontrado'
    });
  }

  logger.info('User profile retrieved successfully');

  return currentUser;
}
