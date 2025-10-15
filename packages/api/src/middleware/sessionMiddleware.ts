import { auth, User } from '@/auth/auth';
import { HonoEnv } from '@/hono';
import { logger } from '@/lib/logger';
import { createMiddleware } from 'hono/factory';

export const sessionMiddleware = createMiddleware<HonoEnv>(async (ctx, next) => {
  const session = await auth.api.getSession({
    headers: ctx.req.raw.headers
  });

  logger.addMeta({
    requestingUserId: session?.user?.id
  });

  ctx.set('user', session?.user as User);
  ctx.set('session', session?.session);

  await next();
});
