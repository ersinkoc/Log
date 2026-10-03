/**
 * @oxog/log - Level Plugin
 *
 * Manages log level filtering and configuration.
 *
 * @packageDocumentation
 */

import type { Plugin } from '@oxog/types';
import type { LogContext, LogLevelName, LogLevel } from '../../types.js';
import { LOG_LEVELS, LEVEL_NAMES } from '../../constants.js';

/**
 * Own-property level lookup.
 *
 * `LOG_LEVELS[levelName]` alone would also resolve inherited keys such as
 * "constructor" or "toString" to a function, which would then be stored in
 * `ctx.level` and make every `levelNum >= ctx.level` comparison false — i.e.
 * all logging would be silently dropped.
 */
function lookupLevel(levelName: string): LogLevel | undefined {
  return Object.prototype.hasOwnProperty.call(LOG_LEVELS, levelName)
    ? LOG_LEVELS[levelName as LogLevelName]
    : undefined;
}

/**
 * Level plugin for log level management.
 *
 * This plugin:
 * - Filters log entries by level
 * - Provides level checking utilities
 * - Allows runtime level changes
 *
 * @example
 * ```typescript
 * import { levelPlugin } from '@oxog/log/plugins';
 *
 * logger.use(levelPlugin());
 *
 * // Only logs at or above 'warn' level will be processed
 * logger.setLevel('warn');
 * ```
 */
export function levelPlugin(): Plugin<LogContext> {
  return {
    name: 'level',
    version: '1.0.0',

    install(kernel) {
      const ctx = kernel.getContext();

      // Ensure level is set
      if (ctx.level === undefined) {
        ctx.level = LOG_LEVELS.info;
      }
    },
  };
}

/**
 * Check if a log level is enabled.
 *
 * @example
 * ```typescript
 * if (isLevelEnabled(context, 'debug')) {
 *   // Process debug log
 * }
 * ```
 */
export function isLevelEnabled(ctx: LogContext, levelName: LogLevelName): boolean {
  const levelValue = lookupLevel(levelName);
  if (levelValue === undefined) {
    return false;
  }
  return levelValue >= ctx.level;
}

/**
 * Get the current level name from context.
 */
export function getLevelName(ctx: LogContext): LogLevelName {
  return LEVEL_NAMES[ctx.level] ?? 'info';
}

/**
 * Set the log level on context.
 */
export function setLevel(ctx: LogContext, levelName: LogLevelName): void {
  const levelValue = lookupLevel(levelName);
  if (levelValue !== undefined) {
    ctx.level = levelValue;
  }
}

/**
 * Parse a level name or number to LogLevel.
 */
export function parseLevel(level: LogLevelName | number): number {
  if (typeof level === 'number') {
    return level;
  }
  return lookupLevel(level) ?? (LOG_LEVELS.info as LogLevel);
}

export default levelPlugin;
