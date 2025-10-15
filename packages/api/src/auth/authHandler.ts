import { auth } from '@/auth/auth';
import type { Context } from 'hono';

/**
 * Handle Better Auth requests
 * Supports both GET and POST methods for all /api/auth/** routes
 */
export async function authHandler(ctx: Context) {
  return auth.handler(ctx.req.raw);
}
