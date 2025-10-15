import { trpcProtected } from '@/trpc';
import { TRPCError } from '@trpc/server';

/**
 * Admin-only procedure middleware
 * Requires user to be authenticated and have role="admin"
 */
export const adminProcedure = trpcProtected.use(async function isAdmin(opts) {
  const { ctx } = opts;

  if (ctx.user.role !== 'admin') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Acesso de administrador necessário'
    });
  }

  return opts.next({
    ctx: {
      user: ctx.user,
      adminId: ctx.user.id
    }
  });
});
