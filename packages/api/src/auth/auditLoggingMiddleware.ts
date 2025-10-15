import { createAuditLog } from '@/compliance/createAuditLog';
import { createAuthMiddleware } from 'better-auth/api';

/**
 * After hook middleware for audit logging
 * Logs user registration and login events for LGPD compliance
 */
export const auditLoggingMiddleware = createAuthMiddleware(async (ctx) => {
  // Audit logging for auth events
  const newSession = ctx.context.newSession;

  // Extract IP address and user agent for audit trail
  const ipAddress = ctx.request?.headers.get('x-forwarded-for');
  const userAgent = ctx.request?.headers.get('user-agent');

  // User registration
  if (ctx.path.startsWith('/sign-up') && newSession) {
    await createAuditLog({
      userId: newSession.user.id,
      eventType: 'user.registered',
      eventData: {
        email: newSession.user.email,
        role: newSession.user.role,
        name: newSession.user.name
      },
      ipAddress,
      userAgent
    });
  }

  // User login
  if (ctx.path.startsWith('/sign-in') && newSession) {
    await createAuditLog({
      userId: newSession.user.id,
      eventType: 'user.login',
      eventData: {
        email: newSession.user.email
      },
      ipAddress,
      userAgent
    });
  }
});
