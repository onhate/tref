import { AsyncLocalStorage } from 'node:async_hooks';
import pino from 'pino';
import { Resource } from 'sst';
import { createPrettyPrintStream } from './logger/createPrettyPrintStream';

/**
 * AsyncLocalStorage for request-scoped metadata accumulation
 * Each request maintains its own isolated metadata that accumulates through the call chain
 */
const metadataStorage = new AsyncLocalStorage<Record<string, unknown>>();

/**
 * Pino mixin function - automatically injects accumulated metadata into every log
 * This is called by Pino internally for each log entry
 */
function metadataMixin() {
  return metadataStorage.getStore() ?? {};
}

const isDevelopment = ['development', 'test'].includes(process.env.NODE_ENV!);
const level = isDevelopment ? 'debug' : 'info';

// Create custom stream for pretty printing in development
const stream = isDevelopment
  ? createPrettyPrintStream()
  : process.stdout;

// Base Pino logger with mixin
const baseLogger = pino(
  {
    level,

    // Mixin automatically merges accumulated metadata into every log
    mixin: metadataMixin,

    // Custom serializers for better log output
    serializers: {
      error: pino.stdSerializers.errWithCause,
      cause: pino.stdSerializers.err,
      req: pino.stdSerializers.req,
      res: pino.stdSerializers.res
    },

    // Base fields to include in every log
    base: {
      env: Resource.App.stage
    },

    // Timestamp format
    timestamp: pino.stdTimeFunctions.isoTime,

    // Format level as label instead of number
    formatters: {
      level: (label) => {
        return { level: label };
      }
    }
  },
  stream
);

/**
 * Global logger with automatic metadata accumulation via AsyncLocalStorage
 *
 * Features:
 * - Single global instance - no need to pass logger between functions
 * - Metadata accumulates through call chain (middleware → handlers → functions)
 * - Request isolation via AsyncLocalStorage
 * - Native Pino API with automatic metadata injection via mixin
 *
 * Usage:
 * ```typescript
 * // In middleware
 * import { logger } from '@/lib/logger';
 * logger.initContext({ requestId });
 *
 * // In session middleware
 * logger.addMeta({ userId: session.userId });
 *
 * // In function
 * logger.addMeta({ functionName: 'updateProfile' });
 * logger.info('Profile updated'); // Includes requestId + userId + functionName
 * ```
 */
export const logger = {
  /**
   * Initialize async context for a new request
   * Call this once per request in your first middleware
   *
   * @param initialMeta - Initial metadata (typically requestId)
   *
   * @example
   * ```typescript
   * export async function loggerMiddleware(ctx: Context, next: Next) {
   *   logger.initContext({ requestId: ctx.env.event.requestContext.requestId });
   *   await next();
   * }
   * ```
   */
  initContext(initialMeta: Record<string, unknown> = {}): void {
    metadataStorage.enterWith(initialMeta);
  },

  /**
   * Add metadata to current async context
   * Metadata accumulates - new values merge with existing ones
   *
   * @param meta - Metadata object to merge into current context
   *
   * @example
   * ```typescript
   * // In middleware
   * logger.addMeta({ userId: session.userId });
   *
   * // In function
   * logger.addMeta({ functionName: 'updateProfile', recordId: '123' });
   * ```
   */
  addMeta(meta: Record<string, unknown>): void {
    const current = metadataStorage.getStore() ?? {};
    const merged = { ...current, ...meta };
    metadataStorage.enterWith(merged);
  },

  /**
   * Get current accumulated metadata
   * Useful for debugging or conditionally adding metadata
   *
   * @returns Current metadata object
   */
  getMeta(): Record<string, unknown> {
    return metadataStorage.getStore() ?? {};
  },

  /**
   * Clear metadata from current context
   * Rarely needed - mainly for testing
   */
  clearMeta(): void {
    metadataStorage.enterWith({});
  },

  // Native Pino log methods - metadata automatically injected via mixin
  info: baseLogger.info.bind(baseLogger) as typeof baseLogger.info,
  error: baseLogger.error.bind(baseLogger) as typeof baseLogger.error,
  warn: baseLogger.warn.bind(baseLogger) as typeof baseLogger.warn,
  debug: baseLogger.debug.bind(baseLogger) as typeof baseLogger.debug,
  fatal: baseLogger.fatal.bind(baseLogger) as typeof baseLogger.fatal,
  trace: baseLogger.trace.bind(baseLogger) as typeof baseLogger.trace,

  // Expose child method for advanced usage
  child: baseLogger.child.bind(baseLogger) as typeof baseLogger.child
} as const;
