import { logger } from '@/lib/logger';
import { appRouter } from '@/trpc/appRouter';
import { createContext } from '@/trpc/createContext';
import { trpcServer } from '@hono/trpc-server';

/**
 * Configure and return tRPC server middleware
 * Handles all /api/trpc/* routes with error logging
 */
export function createTrpcHandler() {
  return trpcServer({
    endpoint: '/api/trpc',
    router: appRouter,
    createContext,
    onError({ error, path, input }) {
      // Create contextual logger with error details
      logger.addMeta({
        trpcPath: path,
        errorCode: error.code,
        errorName: error.name
      });

      // Log error with full context
      logger.error({
        error,
        input
      }, 'tRPC error');
    }
  });
}
