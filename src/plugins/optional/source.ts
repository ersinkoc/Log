/**
 * @oxog/log - Source Plugin
 *
 * Captures source file and line number for log entries.
 *
 * @packageDocumentation
 */

import type { Plugin } from '@oxog/types';
import type { LogContext, LogEntry } from '../../types.js';
import { getSourceLocation, type SourceLocation } from '../../utils/source.js';

/**
 * Source plugin configuration options.
 */
export interface SourcePluginOptions {
  /** Stack frame depth to skip */
  depth?: number;

  /** Include column number */
  includeColumn?: boolean;

  /** Include full file path */
  includeFullPath?: boolean;
}

/**
 * Source plugin for capturing file and line number.
 *
 * This plugin:
 * - Captures source file name
 * - Captures line number
 * - Optionally captures column number
 *
 * @example
 * ```typescript
 * import { sourcePlugin } from '@oxog/log/plugins';
 *
 * logger.use(sourcePlugin());
 *
 * log.info('Hello'); // Output includes file:line
 * ```
 */
export function sourcePlugin(options: SourcePluginOptions = {}): Plugin<LogContext> {
  return {
    name: 'source',
    version: '1.0.0',

    install(kernel) {
      const ctx = kernel.getContext();

      // Enable source tracking in context
      ctx.source = true;

      // Expose source location function with configured depth.
      // Default is 0: getSourceLocation() already skips its own frame and the
      // wrapper arrow below, so depth 0 lands on whoever called getSource().
      // A higher default skipped that many *caller* frames instead, which
      // reported node internals (or nothing at all) as the call site.
      const depth = options.depth ?? 0;

      (kernel as unknown as { getSource: () => SourceLocation | undefined }).getSource = () => {
        return getSourceLocation(depth);
      };
    },
  };
}

/**
 * Add source location to a log entry.
 */
export function addSourceLocation(
  entry: LogEntry,
  depth = 0,
  options: SourcePluginOptions = {}
): LogEntry {
  const location = getSourceLocation(depth);

  if (location) {
    entry.file = options.includeFullPath ? location.path : location.file;
    entry.line = location.line;

    if (options.includeColumn && location.column) {
      entry.column = location.column;
    }
  }

  return entry;
}

export default sourcePlugin;
