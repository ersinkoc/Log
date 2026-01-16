/**
 * @oxog/log - Constants
 *
 * Log levels, default values, and configuration constants.
 *
 * @packageDocumentation
 */

import { LogLevel, type LogLevelName, type Format, type BufferOptions } from './types.js';

// ============================================================================
// Log Levels
// ============================================================================

/**
 * Mapping of log level names to numeric values.
 *
 * @example
 * ```typescript
 * const level = LOG_LEVELS.info; // 30
 * ```
 */
export const LOG_LEVELS: Record<LogLevelName, LogLevel> = {
  trace: LogLevel.Trace,
  debug: LogLevel.Debug,
  info: LogLevel.Info,
  warn: LogLevel.Warn,
  error: LogLevel.Error,
  fatal: LogLevel.Fatal,
} as const;

/**
 * Mapping of numeric values to log level names.
 *
 * @example
 * ```typescript
 * const name = LEVEL_NAMES[30]; // 'info'
 * ```
 */
export const LEVEL_NAMES: Record<LogLevel, LogLevelName> = {
  [LogLevel.Trace]: 'trace',
  [LogLevel.Debug]: 'debug',
  [LogLevel.Info]: 'info',
  [LogLevel.Warn]: 'warn',
  [LogLevel.Error]: 'error',
  [LogLevel.Fatal]: 'fatal',
} as const;

/**
 * Array of all log level names in order of severity.
 */
export const LEVEL_ORDER: LogLevelName[] = [
  'trace',
  'debug',
  'info',
  'warn',
  'error',
  'fatal',
] as const;

// ============================================================================
// Default Configuration
// ============================================================================

/**
 * Default logger name.
 */
export const DEFAULT_NAME = 'app';

/**
 * Default log level.
 */
export const DEFAULT_LEVEL: LogLevelName = 'info';

/**
 * Default output format.
 */
export const DEFAULT_FORMAT: Format = 'auto';

/**
 * Default colors setting.
 */
export const DEFAULT_COLORS = true;

/**
 * Default timestamp setting.
 */
export const DEFAULT_TIMESTAMP = true;

/**
 * Default source tracking setting.
 */
export const DEFAULT_SOURCE = false;

/**
 * Default sync levels (fatal and error are sync by default).
 */
export const DEFAULT_SYNC_LEVELS: Record<LogLevelName, boolean> = {
  trace: false,
  debug: false,
  info: false,
  warn: false,
  error: true,
  fatal: true,
} as const;

/**
 * Default buffer options.
 */
export const DEFAULT_BUFFER_OPTIONS: Required<BufferOptions> = {
  size: 100,
  flushInterval: 1000,
} as const;

// ============================================================================
// Level Colors
// ============================================================================

/**
 * Default colors for each log level (used with @oxog/pigment).
 */
export const LEVEL_COLORS: Record<LogLevelName, string> = {
  trace: 'gray',
  debug: 'cyan',
  info: 'blue',
  warn: 'yellow',
  error: 'red',
  fatal: 'magenta',
} as const;

/**
 * Level label display strings (padded for alignment).
 */
export const LEVEL_LABELS: Record<LogLevelName, string> = {
  trace: 'TRACE',
  debug: 'DEBUG',
  info: 'INFO ',
  warn: 'WARN ',
  error: 'ERROR',
  fatal: 'FATAL',
} as const;

// ============================================================================
// Redaction
// ============================================================================

/**
 * Default redaction placeholder.
 */
export const REDACTED_VALUE = '[REDACTED]';

/**
 * Common sensitive field names.
 */
export const COMMON_SENSITIVE_FIELDS = [
  'password',
  'token',
  'secret',
  'apiKey',
  'api_key',
  'apikey',
  'authorization',
  'auth',
  'credential',
  'credentials',
  'ssn',
  'creditCard',
  'credit_card',
  'creditcard',
  'cvv',
  'pin',
] as const;

// ============================================================================
// Size Constants
// ============================================================================

/**
 * Parse size string to bytes.
 *
 * @example
 * ```typescript
 * parseSize('10MB'); // 10485760
 * parseSize('1GB');  // 1073741824
 * ```
 */
export function parseSize(size: string): number {
  const match = size.match(/^(\d+(?:\.\d+)?)\s*(B|KB|MB|GB|TB)?$/i);
  if (!match) {
    throw new Error(`Invalid size format: ${size}`);
  }

  const value = parseFloat(match[1]!);
  const unit = (match[2] || 'B').toUpperCase();

  const units: Record<string, number> = {
    B: 1,
    KB: 1024,
    MB: 1024 * 1024,
    GB: 1024 * 1024 * 1024,
    TB: 1024 * 1024 * 1024 * 1024,
  };

  return Math.floor(value * (units[unit] ?? 1));
}

/**
 * Parse rotation interval string to milliseconds.
 *
 * @example
 * ```typescript
 * parseRotation('1d'); // 86400000
 * parseRotation('1h'); // 3600000
 * ```
 */
export function parseRotation(rotation: string): number {
  const match = rotation.match(/^(\d+)\s*(s|m|h|d|w)?$/i);
  if (!match) {
    throw new Error(`Invalid rotation format: ${rotation}`);
  }

  const value = parseInt(match[1]!, 10);
  const unit = (match[2] || 's').toLowerCase();

  const units: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
    w: 7 * 24 * 60 * 60 * 1000,
  };

  return value * (units[unit] ?? 1000);
}

// ============================================================================
// Environment
// ============================================================================

/**
 * Check if running in Node.js.
 */
export const IS_NODE =
  typeof process !== 'undefined' &&
  process.versions != null &&
  process.versions.node != null;

/**
 * Check if running in browser.
 */
export const IS_BROWSER =
  typeof window !== 'undefined' && typeof window.document !== 'undefined';

/**
 * Check if running in development mode.
 */
export const IS_DEV =
  IS_NODE && process.env['NODE_ENV'] !== 'production';

/**
 * Check if stdout is a TTY (terminal).
 */
export const IS_TTY = IS_NODE && process.stdout?.isTTY === true;
