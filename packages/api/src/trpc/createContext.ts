import { HonoEnv } from '@/hono';
import type { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
import type { Context } from 'hono';

export async function createContext(_opts: FetchCreateContextFnOptions, ctx: Context<HonoEnv>) {
  // Get session from Hono context (set by session middleware)
  const user = ctx.get('user');
  const session = ctx.get('session');

  return {
    user,
    session,
    userAgent: ctx.req.header('user-agent'),
    ip: ctx.req.header('x-forwarded-for')
  };
}

export type AppContext = Awaited<ReturnType<typeof createContext>>;
