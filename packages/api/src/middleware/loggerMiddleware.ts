import { HonoEnv } from '@/hono';
import { logger } from '@/lib/logger';
import { createMiddleware } from 'hono/factory';

/**
 * Hono middleware for request/response logging with contextual metadata
 *
 * Features:
 * - Initializes AsyncLocalStorage context with unique request ID
 * - Logs incoming requests with method, path, and headers
 * - Logs outgoing responses with status code and duration
 * - All downstream logs automatically include requestId via mixin
 *
 * The request ID is automatically included in all logs within the request scope
 * thanks to AsyncLocalStorage and Pino mixin integration.
 */
export const loggerMiddleware = createMiddleware<HonoEnv>(async (ctx, next) => {
  const start = ctx.env.event.requestContext.timeEpoch; // Start time in milliseconds AWS Lambda

  // Initialize context for this request - all downstream logs will include requestId
  logger.initContext({
    requestId: ctx.env.event.requestContext.requestId,
    method: ctx.req.method,
    path: ctx.req.path,
    userAgent: ctx.req.header('user-agent'),
    ip: ctx.req.header('x-forwarded-for')
  });

  // Log incoming request
  logger.info('Incoming request');

  // Execute the request
  await next();

  // Calculate duration
  const duration = Date.now() - start;

  logger.addMeta({
    status: ctx.res.status,
    duration
  });

  // Log outgoing response
  logger.info('Request completed');
});
