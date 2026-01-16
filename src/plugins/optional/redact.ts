/**
 * @oxog/log - Redact Plugin
 *
 * Masks sensitive data in log entries.
 *
 * @packageDocumentation
 */

import type { Plugin } from '@oxog/types';
import type { LogContext, LogEntry } from '../../types.js';
import { redactFields } from '../../utils/redact.js';
import { REDACTED_VALUE } from '../../constants.js';

/**
 * Redact plugin configuration options.
 */
export interface RedactPluginOptions {
  /** Field paths to redact */
  paths?: string[];

  /** Placeholder text for redacted values */
  placeholder?: string;
}

/**
 * Redact plugin for masking sensitive data.
 *
 * This plugin:
 * - Masks specified fields with placeholder
 * - Supports dot notation for nested paths
 * - Supports wildcards for arrays
 *
 * @example
 * ```typescript
 * import { redactPlugin } from '@oxog/log/plugins';
 *
 * logger.use(redactPlugin({
 *   paths: ['password', 'user.token', 'headers.authorization']
 * }));
 * ```
 */
export function redactPlugin(options: RedactPluginOptions = {}): Plugin<LogContext> {
  return {
    name: 'redact',
    version: '1.0.0',

    install(kernel) {
      const ctx = kernel.getContext();
      const paths = options.paths || ctx.redactPaths || [];
      const placeholder = options.placeholder || REDACTED_VALUE;

      // Store configuration in context
      ctx.redactPaths = paths;

      // Expose redaction function
      (kernel as unknown as { redact: (entry: LogEntry) => LogEntry }).redact = (entry) => {
        return redactEntry(entry, paths, placeholder);
      };
    },
  };
}

/**
 * Redact sensitive fields from a log entry.
 */
export function redactEntry(
  entry: LogEntry,
  paths: string[],
  placeholder = REDACTED_VALUE
): LogEntry {
  if (paths.length === 0) {
    return entry;
  }

  return redactFields(entry, paths, placeholder);
}

export default redactPlugin;
