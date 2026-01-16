/**
 * @oxog/log - Timestamp Plugin
 *
 * Adds timestamp to log entries.
 *
 * @packageDocumentation
 */

import type { Plugin } from '@oxog/types';
import type { LogContext, LogEntry } from '../../types.js';

/**
 * Timestamp plugin for adding timestamps to log entries.
 *
 * This plugin:
 * - Adds Unix timestamp (ms) to entries
 * - Optionally adds ISO 8601 timestamp
 *
 * @example
 * ```typescript
 * import { timestampPlugin } from '@oxog/log/plugins';
 *
 * logger.use(timestampPlugin());
 *
 * // Entries will have: { time: 1234567890123, ... }
 * ```
 */
export function timestampPlugin(): Plugin<LogContext> {
  return {
    name: 'timestamp',
    version: '1.0.0',

    install(kernel) {
      const ctx = kernel.getContext();
      // Set default timestamp setting if not set
      if (ctx.timestamp === undefined) {
        ctx.timestamp = true;
      }
    },
  };
}

/**
 * Get current Unix timestamp in milliseconds.
 */
export function now(): number {
  return Date.now();
}

/**
 * Get current ISO 8601 timestamp string.
 */
export function nowIso(): string {
  return new Date().toISOString();
}

/**
 * Format a Unix timestamp as ISO 8601 string.
 */
export function toIso(timestamp: number): string {
  return new Date(timestamp).toISOString();
}

/**
 * Parse an ISO 8601 string to Unix timestamp.
 */
export function fromIso(isoString: string): number {
  return new Date(isoString).getTime();
}

/**
 * Add timestamp to a log entry.
 */
export function addTimestamp(entry: LogEntry): LogEntry {
  if (entry.time === undefined) {
    entry.time = Date.now();
  }
  return entry;
}

/**
 * Format timestamp for display.
 */
export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toISOString();
}

export default timestampPlugin;
