/**
 * @oxog/log - Correlation Plugin
 *
 * Provides correlation ID tracking for request tracing.
 *
 * @packageDocumentation
 */

import type { Plugin } from '@oxog/types';
import type { LogContext, LogEntry } from '../../types.js';

/**
 * Correlation plugin configuration options.
 */
export interface CorrelationPluginOptions {
  /** Prefix for auto-generated correlation IDs */
  prefix?: string;

  /** Custom ID generator function */
  generator?: () => string;
}

// Store options at module level for ID generation
let correlationOptions: CorrelationPluginOptions = {};

/**
 * Correlation plugin for request tracing.
 *
 * This plugin:
 * - Adds correlation ID to all log entries
 * - Supports auto-generation of IDs
 * - Inherits correlation ID in child loggers
 *
 * @example
 * ```typescript
 * import { correlationPlugin } from '@oxog/log/plugins';
 *
 * logger.use(correlationPlugin());
 *
 * const reqLog = log.withCorrelation('req-123');
 * reqLog.info('Processing'); // includes correlationId
 * ```
 */
export function correlationPlugin(options: CorrelationPluginOptions = {}): Plugin<LogContext> {
  return {
    name: 'correlation',
    version: '1.0.0',

    install(_kernel) {
      // Store options for ID generation
      correlationOptions = options;
    },
  };
}

/**
 * Generate a correlation ID.
 */
export function generateCorrelationId(): string {
  if (correlationOptions.generator) {
    return correlationOptions.generator();
  }

  const prefix = correlationOptions.prefix ?? 'cid';
  const random = Math.random().toString(36).substring(2, 10);
  const timestamp = Date.now().toString(36);
  return `${prefix}_${timestamp}${random}`;
}

/**
 * Add correlation ID to a log entry.
 */
export function addCorrelationId(entry: LogEntry, correlationId: string): LogEntry {
  entry.correlationId = correlationId;
  return entry;
}

/**
 * Get correlation ID from context.
 */
export function getCorrelationId(ctx: LogContext): string | undefined {
  return ctx.correlationId;
}

/**
 * Set correlation ID on context.
 */
export function setCorrelationId(ctx: LogContext, correlationId: string): void {
  ctx.correlationId = correlationId;
}

/**
 * Create or get a correlation ID.
 */
export function ensureCorrelationId(ctx: LogContext): string {
  if (!ctx.correlationId) {
    ctx.correlationId = generateCorrelationId();
  }
  return ctx.correlationId;
}

export default correlationPlugin;
