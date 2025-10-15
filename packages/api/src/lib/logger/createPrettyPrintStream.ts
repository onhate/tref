import { isEmptyObject } from '@/lib/helpers';
import omit from 'lodash/omit.js';
import pino from 'pino';
import { serialize } from 'superjson';

/**
 * ANSI color codes for terminal output (log levels only)
 */
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',

  // Log levels
  debug: '\x1b[34m',    // Blue
  info: '\x1b[32m',     // Green
  warn: '\x1b[33m',     // Yellow
  error: '\x1b[31m'     // Red
} as const;

export function createPrettyPrintStream() {
  return {
    write: (chunk: string) => {
      try {
        const log = JSON.parse(chunk);
        const formatted = prettyPrint(log);
        process.stdout.write(formatted + '\n');
      } catch (error) {
        // Fallback to raw output if parsing fails
        process.stdout.write(chunk);
      }
    }
  };
}

/**
 * Custom pretty printer for Pino logs in development
 * Works synchronously without worker threads (Lambda-compatible)
 */
function prettyPrint(log: any): string {
  const { level, method, path, msg, time, error, ...context } = log;
  const ctx = omit(context, ['pid', 'hostname']);

  // Build log line: [LEVEL]: message
  const color = getLevelColor(level);
  const { bold, reset, warn } = colors;
  const levelString = `${color}${level.toUpperCase()}${reset}`;
  const httpString = path ? `(${warn}${method}${reset} ${path})` : '';
  let output = `${levelString} ${httpString} ${bold}${msg}${reset}`;

  // Add remaining context (non-error fields)
  if (!isEmptyObject(ctx)) {
    const { json } = serialize(ctx);
    output += '\n' + JSON.stringify(json, null, 2);
  }

  // Add errors separately for better readability
  if (error) {
    output += '\n' + formatError(error);
  }

  return output;
}

/**
 * Get color for log level
 */
function getLevelColor(level: string): string {
  switch (level) {
    case 'debug':
      return colors.debug;
    case 'info':
      return colors.info;
    case 'warn':
      return colors.warn;
    case 'error':
    case 'fatal':
      return colors.error;
    default:
      return colors.reset;
  }
}

/**
 * Format Error object for display
 */
function formatError(error: unknown): string {
  if (Array.isArray(error)) {
    return error.map(formatError).join('\n');
  }

  const { name, message, stack } = pino.stdSerializers.errWithCause(error as Error);

  let output = `${colors.error}${name}${colors.reset}: ${message}\n`;
  if (stack) {
    const stackLines = stack.split('\n').slice(1); // Skip first line (already shown)
    output += stackLines.map(line => `      ${colors.dim}${line.trim()}${colors.reset}`).join('\n');
  }
  return output;
}
