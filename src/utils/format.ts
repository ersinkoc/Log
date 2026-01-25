/**
 * @oxog/log - Formatting Utilities
 *
 * JSON and pretty formatting for log entries.
 *
 * @packageDocumentation
 */

import type { LogEntry, LogLevelName } from '../types.js';
import { LEVEL_LABELS, LEVEL_COLORS } from '../constants.js';
import type { Pigment } from '@oxog/pigment';

/**
 * Format a log entry as JSON string.
 * Uses safe stringify to handle circular references.
 *
 * @example
 * ```typescript
 * const json = formatJson(entry);
 * // {"level":30,"time":1234567890,"msg":"Hello"}
 * ```
 */
export function formatJson(entry: LogEntry): string {
  // Use safeStringify to handle circular references
  return safeStringify(entry);
}

/**
 * JSON replacer function to handle special values.
 */
function jsonReplacer(_key: string, value: unknown): unknown {
  // Handle BigInt
  if (typeof value === 'bigint') {
    return value.toString();
  }

  // Handle Error objects
  if (value instanceof Error) {
    const errorObj = value as Error & Record<string, unknown>;
    const result: Record<string, unknown> = {
      name: value.name,
      message: value.message,
      stack: value.stack,
    };
    // Copy any additional enumerable properties
    for (const key of Object.keys(errorObj)) {
      if (!(key in result)) {
        result[key] = errorObj[key];
      }
    }
    return result;
  }

  // Handle circular references and special objects
  if (typeof value === 'object' && value !== null) {
    // Handle RegExp
    if (value instanceof RegExp) {
      return value.toString();
    }

    // Handle Date (already handled by JSON.stringify, but explicit for clarity)
    if (value instanceof Date) {
      return value.toISOString();
    }

    // Handle Map
    if (value instanceof Map) {
      return Object.fromEntries(value);
    }

    // Handle Set
    if (value instanceof Set) {
      return Array.from(value);
    }
  }

  return value;
}

/**
 * Safe JSON stringify with circular reference handling.
 *
 * @example
 * ```typescript
 * const obj = { a: 1 };
 * obj.self = obj; // circular
 * safeStringify(obj); // {"a":1,"self":"[Circular]"}
 * ```
 */
export function safeStringify(value: unknown, indent?: number): string {
  const seen = new WeakSet<object>();

  return JSON.stringify(
    value,
    (_key, val) => {
      // First apply the standard replacer
      const replaced = jsonReplacer(_key, val);

      // Then check for circular references
      if (typeof replaced === 'object' && replaced !== null) {
        if (seen.has(replaced)) {
          return '[Circular]';
        }
        seen.add(replaced);
      }

      return replaced;
    },
    indent
  );
}

/**
 * Format a log entry as pretty string with colors.
 *
 * @example
 * ```typescript
 * const pretty = formatPretty(entry, pigment);
 * // [14:30:22] INFO  Hello world
 * ```
 */
export function formatPretty(
  entry: LogEntry,
  pigment?: Pigment,
  options: { timestamp?: boolean; source?: boolean } = {}
): string {
  const parts: string[] = [];
  const { timestamp = true, source = true } = options;

  // Timestamp
  if (timestamp && entry.time) {
    const time = formatTime(entry.time);
    parts.push(pigment ? pigment.gray(`[${time}]`) : `[${time}]`);
  }

  // Level
  const levelLabel = LEVEL_LABELS[entry.levelName] || entry.levelName.toUpperCase();
  const levelColor = LEVEL_COLORS[entry.levelName] || 'white';

  if (pigment) {
    const colorFn = (pigment as unknown as Record<string, (s: string) => string>)[levelColor];
    parts.push(colorFn ? colorFn(levelLabel) : levelLabel);
  } else {
    parts.push(levelLabel);
  }

  // Source location
  if (source && entry.file) {
    const location = entry.line ? `${entry.file}:${entry.line}` : entry.file;
    parts.push(pigment ? pigment.dim(`(${location})`) : `(${location})`);
  }

  // Message
  if (entry.msg) {
    parts.push(entry.msg);
  }

  // Extra data (excluding standard fields)
  const extra = getExtraFields(entry);
  if (Object.keys(extra).length > 0) {
    const extraStr = safeStringify(extra);
    parts.push(pigment ? pigment.dim(extraStr) : extraStr);
  }

  // Error stack
  if (entry.err?.stack) {
    parts.push('\n' + (pigment ? pigment.red(entry.err.stack) : entry.err.stack));
  }

  return parts.join(' ');
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
 * Format timestamp as HH:MM:SS.
 */
export function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

/**
 * Format timestamp as ISO 8601 string.
 */
export function formatIso(timestamp: number): string {
  return new Date(timestamp).toISOString();
}

/**
 * Format duration in human-readable format.
 *
 * @example
 * ```typescript
 * formatDuration(45);      // '45ms'
 * formatDuration(1500);    // '1.50s'
 * formatDuration(90000);   // '1m 30s'
 * ```
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  }

  if (ms < 60000) {
    return `${(ms / 1000).toFixed(2)}s`;
  }

  const minutes = Math.floor(ms / 60000);
  const seconds = Math.round((ms % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
}

/**
 * Format bytes in human-readable format.
 *
 * @example
 * ```typescript
 * formatBytes(1024);      // '1 KB'
 * formatBytes(1048576);   // '1 MB'
 * ```
 */
export function formatBytes(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let unitIndex = 0;
  let value = bytes;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }

  return `${value.toFixed(unitIndex > 0 ? 2 : 0)} ${units[unitIndex]}`;
}

/**
 * Truncate a string to a maximum length.
 *
 * @example
 * ```typescript
 * truncate('Hello world', 8); // 'Hello...'
 * ```
 */
export function truncate(str: string, maxLength: number, suffix = '...'): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - suffix.length) + suffix;
}

/**
 * Indent a multi-line string.
 */
export function indent(str: string, spaces = 2): string {
  const pad = ' '.repeat(spaces);
  return str
    .split('\n')
    .map((line) => pad + line)
    .join('\n');
}
