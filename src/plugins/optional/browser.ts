/**
 * @oxog/log - Browser Plugin
 *
 * Provides native browser DevTools integration.
 *
 * @packageDocumentation
 */

import type { Plugin } from '@oxog/types';
import type { LogContext, LogEntry, LogLevelName } from '../../types.js';
import { isBrowser } from '../../utils/env.js';

/**
 * Browser plugin configuration options.
 */
export interface BrowserPluginOptions {
  /** Enable console grouping for child loggers */
  grouping?: boolean;

  /** Enable styled output */
  styled?: boolean;

  /** Custom styles per level */
  styles?: Partial<Record<LogLevelName, string>>;
}

// Store options at module level
let browserOptions: BrowserPluginOptions = {};

/**
 * Browser plugin for DevTools integration.
 *
 * This plugin:
 * - Maps log levels to console methods
 * - Provides styled console output
 * - Uses console.group for child loggers
 *
 * @example
 * ```typescript
 * import { browserPlugin } from '@oxog/log/plugins';
 *
 * logger.use(browserPlugin({ styled: true }));
 *
 * log.info('Hello'); // Uses console.log with styling
 * log.error('Oops'); // Uses console.error with styling
 * ```
 */
export function browserPlugin(options: BrowserPluginOptions = {}): Plugin<LogContext> {
  return {
    name: 'browser',
    version: '1.0.0',

    install(_kernel) {
      // Store options for browser output
      browserOptions = options;
    },
  };
}

/**
 * Get the console method for a log level.
 */
export function getConsoleMethod(levelName: LogLevelName): 'log' | 'debug' | 'info' | 'warn' | 'error' {
  switch (levelName) {
    case 'trace':
    case 'debug':
      return 'debug';
    case 'info':
      return 'info';
    case 'warn':
      return 'warn';
    case 'error':
    case 'fatal':
      return 'error';
    default:
      return 'log';
  }
}

/**
 * Get CSS styles for a log level.
 */
export function getLevelStyles(levelName: LogLevelName): string {
  if (browserOptions.styles?.[levelName]) {
    return browserOptions.styles[levelName]!;
  }

  const colors: Record<LogLevelName, string> = {
    trace: '#888888',
    debug: '#00bcd4',
    info: '#2196f3',
    warn: '#ff9800',
    error: '#f44336',
    fatal: '#9c27b0',
  };

  return `color: ${colors[levelName] ?? '#000000'}; font-weight: bold;`;
}

/**
 * Write a log entry to the browser console.
 */
export function writeToBrowserConsole(entry: LogEntry, styled = true): void {
  if (!isBrowser()) return;

  const method = getConsoleMethod(entry.levelName);
  const consoleObj = console as unknown as Record<string, (...args: unknown[]) => void>;

  if (styled) {
    const styles = getLevelStyles(entry.levelName);
    const label = `%c[${entry.levelName.toUpperCase()}]`;

    // Extract extra data (excluding standard fields)
    const {
      level: _level,
      levelName: _levelName,
      time: _time,
      msg,
      file: _file,
      line: _line,
      column: _column,
      correlationId: _correlationId,
      ...extra
    } = entry;

    if (Object.keys(extra).length > 0) {
      consoleObj[method](label, styles, msg, extra);
    } else {
      consoleObj[method](label, styles, msg);
    }
  } else {
    consoleObj[method](`[${entry.levelName.toUpperCase()}]`, entry.msg, entry);
  }
}

/**
 * Start a console group.
 */
export function startGroup(label: string, collapsed = false): void {
  if (!isBrowser()) return;

  if (collapsed) {
    console.groupCollapsed(label);
  } else {
    console.group(label);
  }
}

/**
 * End a console group.
 */
export function endGroup(): void {
  if (!isBrowser()) return;
  console.groupEnd();
}

/**
 * Check if grouping is enabled.
 */
export function isGroupingEnabled(): boolean {
  return browserOptions.grouping ?? true;
}

export default browserPlugin;
