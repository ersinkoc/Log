/**
 * @oxog/log - Timing Plugin
 *
 * Provides performance timing utilities for log entries.
 *
 * @packageDocumentation
 */

import type { Plugin } from '@oxog/types';
import type { LogContext } from '../../types.js';

/**
 * Timing plugin for performance measurement.
 *
 * This plugin:
 * - Provides time/timeEnd methods
 * - Tracks named timers
 * - Logs duration in milliseconds
 *
 * @example
 * ```typescript
 * import { timingPlugin } from '@oxog/log/plugins';
 *
 * logger.use(timingPlugin());
 *
 * log.time('db-query');
 * await query();
 * log.timeEnd('db-query'); // logs duration
 * ```
 */
export function timingPlugin(): Plugin<LogContext> {
  return {
    name: 'timing',
    version: '1.0.0',

    install(kernel) {
      const ctx = kernel.getContext();

      // Initialize timers map
      if (!ctx.timers) {
        ctx.timers = new Map<string, number>();
      }
    },

    onDestroy() {
      // Clean up is handled by logger
    },
  };
}

/**
 * Start a timer with the given label.
 */
export function startTimer(ctx: LogContext, label: string): void {
  ctx.timers.set(label, performance.now());
}

/**
 * End a timer and return the duration.
 */
export function endTimer(ctx: LogContext, label: string): number | undefined {
  const start = ctx.timers.get(label);
  if (start === undefined) {
    return undefined;
  }

  const duration = performance.now() - start;
  ctx.timers.delete(label);
  return Math.round(duration * 100) / 100; // Round to 2 decimal places
}

/**
 * Check if a timer exists.
 */
export function hasTimer(ctx: LogContext, label: string): boolean {
  return ctx.timers.has(label);
}

/**
 * Get all active timer labels.
 */
export function getActiveTimers(ctx: LogContext): string[] {
  return Array.from(ctx.timers.keys());
}

/**
 * Clear all timers.
 */
export function clearTimers(ctx: LogContext): void {
  ctx.timers.clear();
}

/**
 * Create a one-shot timer function.
 */
export function createTimer(ctx: LogContext, label: string): () => number | undefined {
  startTimer(ctx, label);
  return () => endTimer(ctx, label);
}

export default timingPlugin;
