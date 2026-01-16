/**
 * @oxog/log - Format Plugin
 *
 * Handles output format selection and formatting.
 *
 * @packageDocumentation
 */

import type { Plugin } from '@oxog/types';
import type { LogContext, LogEntry, Format } from '../../types.js';
import { formatJson, formatPretty } from '../../utils/format.js';
import { isDev, isTTY } from '../../utils/env.js';

/**
 * Format plugin for output formatting.
 *
 * This plugin:
 * - Selects format based on configuration
 * - Provides JSON and Pretty formatters
 * - Auto-detects format based on environment
 *
 * @example
 * ```typescript
 * import { formatPlugin } from '@oxog/log/plugins';
 *
 * logger.use(formatPlugin());
 *
 * // Format is auto-detected or can be set explicitly
 * ```
 */
export function formatPlugin(): Plugin<LogContext> {
  return {
    name: 'format',
    version: '1.0.0',

    install(kernel) {
      const ctx = kernel.getContext();

      // Set default format if not set
      if (ctx.format === undefined) {
        ctx.format = detectFormat();
      }
      // Auto-detect format if set to 'auto'
      else if (ctx.format === 'auto') {
        ctx.format = detectFormat();
      }
    },
  };
}

/**
 * Auto-detect the best format based on environment.
 *
 * - Development + TTY = 'pretty'
 * - Production or non-TTY = 'json'
 */
export function detectFormat(): 'json' | 'pretty' {
  if (isDev() && isTTY()) {
    return 'pretty';
  }
  return 'json';
}

/**
 * Format a log entry based on context settings.
 */
export function formatEntry(ctx: LogContext, entry: LogEntry): string {
  const format = ctx.format === 'auto' ? detectFormat() : ctx.format;

  if (format === 'pretty') {
    return formatPretty(entry, ctx.pigment, {
      timestamp: ctx.timestamp,
      source: ctx.source,
    });
  }

  return formatJson(entry);
}

/**
 * Get the effective format (resolving 'auto').
 */
export function getEffectiveFormat(ctx: LogContext): 'json' | 'pretty' {
  if (ctx.format === 'auto') {
    return detectFormat();
  }
  return ctx.format as 'json' | 'pretty';
}

export default formatPlugin;
