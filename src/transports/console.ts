/**
 * @oxog/log - Console Transport
 *
 * Output logs to console with optional colors.
 *
 * @packageDocumentation
 */

import type { Transport, LogEntry, ConsoleTransportOptions, LogLevelName } from '../types.js';
import { formatJson, formatPretty } from '../utils/format.js';
import { isBrowser, isTTY, shouldUseColors } from '../utils/env.js';
import type { Pigment } from '@oxog/pigment';

/**
 * Default level colors for console output.
 */
const DEFAULT_LEVEL_COLORS: Record<LogLevelName, string> = {
  trace: 'gray',
  debug: 'cyan',
  info: 'blue',
  warn: 'yellow',
  error: 'red',
  fatal: 'magenta',
};

/**
 * Create a console transport.
 *
 * @example
 * ```typescript
 * import { consoleTransport } from '@oxog/log/transports';
 *
 * const transport = consoleTransport({ colors: true });
 * ```
 */
export function consoleTransport(options: ConsoleTransportOptions = {}): Transport {
  const {
    colors = shouldUseColors(),
    timestamp = true,
    levelColors = {},
  } = options;

  // Merge level colors
  const mergedColors = { ...DEFAULT_LEVEL_COLORS, ...levelColors };

  // Store pigment instance (set by logger)
  let pigment: Pigment | undefined;

  return {
    name: 'console',

    write(entry: LogEntry): void {
      // Format the entry
      let output: string;

      if (isBrowser()) {
        // In browser, use console methods directly
        writeToBrowserConsole(entry, colors);
        return;
      }

      // In Node.js, format and write to stdout/stderr
      if (colors && pigment) {
        output = formatPretty(entry, pigment, { timestamp, source: true });
      } else if (colors) {
        // Simple colored output without pigment
        output = formatWithAnsi(entry, mergedColors, timestamp);
      } else {
        output = formatJson(entry);
      }

      // Write to appropriate stream
      if (entry.level >= 50) {
        // Error and Fatal to stderr
        process.stderr.write(output + '\n');
      } else {
        process.stdout.write(output + '\n');
      }
    },

    flush(): void {
      // Console doesn't need flushing
    },

    close(): void {
      // Console doesn't need closing
    },

    supports(env: 'node' | 'browser'): boolean {
      return true; // Works in both environments
    },
  };
}

/**
 * Format entry with ANSI colors (without pigment).
 */
function formatWithAnsi(
  entry: LogEntry,
  levelColors: Record<LogLevelName, string>,
  showTimestamp: boolean
): string {
  const parts: string[] = [];

  // Timestamp
  if (showTimestamp && entry.time) {
    const time = formatTime(entry.time);
    parts.push(`\x1b[90m[${time}]\x1b[0m`);
  }

  // Level with color
  const color = getAnsiColor(levelColors[entry.levelName] || 'white');
  const levelLabel = entry.levelName.toUpperCase().padEnd(5);
  parts.push(`${color}${levelLabel}\x1b[0m`);

  // Source location
  if (entry.file) {
    const location = entry.line ? `${entry.file}:${entry.line}` : entry.file;
    parts.push(`\x1b[90m(${location})\x1b[0m`);
  }

  // Message
  if (entry.msg) {
    parts.push(entry.msg);
  }

  // Extra data
  const extra = getExtraFields(entry);
  if (Object.keys(extra).length > 0) {
    parts.push(`\x1b[90m${JSON.stringify(extra)}\x1b[0m`);
  }

  // Error stack
  if (entry.err?.stack) {
    parts.push('\n\x1b[31m' + entry.err.stack + '\x1b[0m');
  }

  return parts.join(' ');
}

/**
 * Get ANSI color code for a color name.
 */
function getAnsiColor(colorName: string): string {
  const colors: Record<string, string> = {
    black: '\x1b[30m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    gray: '\x1b[90m',
    grey: '\x1b[90m',
  };
  return colors[colorName] || '\x1b[0m';
}

/**
 * Format timestamp as HH:MM:SS.
 */
function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toTimeString().slice(0, 8);
}

/**
 * Get extra fields from entry (excluding standard fields).
 */
function getExtraFields(entry: LogEntry): Record<string, unknown> {
  const standardFields = new Set([
    'level',
    'levelName',
    'time',
    'msg',
    'file',
    'line',
    'column',
    'correlationId',
    'duration',
    'err',
    'name',
  ]);

  const extra: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(entry)) {
    if (!standardFields.has(key)) {
      extra[key] = value;
    }
  }
  return extra;
}

/**
 * Write to browser console with styling.
 */
function writeToBrowserConsole(entry: LogEntry, styled: boolean): void {
  const method = getConsoleMethod(entry.levelName);
  const consoleObj = console as unknown as Record<string, (...args: unknown[]) => void>;

  if (styled) {
    const styles = getBrowserStyles(entry.levelName);
    const label = `%c[${entry.levelName.toUpperCase()}]`;

    const extra = getExtraFields(entry);
    if (Object.keys(extra).length > 0) {
      consoleObj[method](label, styles, entry.msg, extra);
    } else {
      consoleObj[method](label, styles, entry.msg);
    }
  } else {
    consoleObj[method](`[${entry.levelName.toUpperCase()}]`, entry.msg, entry);
  }
}

/**
 * Get console method for level.
 */
function getConsoleMethod(levelName: LogLevelName): string {
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
 * Get browser CSS styles for level.
 */
function getBrowserStyles(levelName: LogLevelName): string {
  const colors: Record<LogLevelName, string> = {
    trace: '#888888',
    debug: '#00bcd4',
    info: '#2196f3',
    warn: '#ff9800',
    error: '#f44336',
    fatal: '#9c27b0',
  };
  return `color: ${colors[levelName]}; font-weight: bold;`;
}

export default consoleTransport;
