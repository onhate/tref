import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import type { AppContext } from './createContext';

const t = initTRPC.context<AppContext>().create({
  transformer: superjson
});

export const router = t.router;
export const trpcPublic = t.procedure;
export const trpcProtected = t.procedure.use(async function isAuthenticated(opts) {
  const { ctx } = opts;
  if (ctx.user) {
    return opts.next({
      ctx: {
        user: ctx.user
      }
    });
  }

  throw new TRPCError({
    code: 'UNAUTHORIZED'
  });
});
