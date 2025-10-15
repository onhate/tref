import { adminRouter } from '@/admin/trpcRouter';
import { complianceRouter } from '@/compliance/trpcRouter';
import { documentsRouter } from '@/documents/trpcRouter';
import { router } from '@/trpc';
import { usersRouter } from '@/users/trpcRouter';
import { inferRouterInputs, inferRouterOutputs } from '@trpc/server';

// Main application router
export const appRouter = router({
  users: usersRouter,
  compliance: complianceRouter,
  admin: adminRouter,
  documents: documentsRouter
});

export type AppRouter = typeof appRouter;
export type AppRouterInput = inferRouterInputs<AppRouter>;
export type AppRouterOutput = inferRouterOutputs<AppRouter>;
