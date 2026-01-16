/**
 * @oxog/log - A minimal, plugin-based logging library
 *
 * Zero-dependency* structured logging with plugin architecture.
 * (* Uses @oxog ecosystem packages)
 *
 * @packageDocumentation
 */

// ============================================================================
// Main Logger
// ============================================================================

export { createLogger } from './logger.js';

// ============================================================================
// Types
// ============================================================================

export type {
  // Core types
  Logger,
  LoggerOptions,
  LogEntry,
  LogContext,
  LogEvents,
  Unsubscribe,

  // Level types
  LogLevelName,
  Format,

  // Transport types
  Transport,
  ConsoleTransportOptions,
  FileTransportOptions,
  HttpTransportOptions,
  StreamTransportOptions,
  LocalStorageTransportOptions,

  // Other options
  BufferOptions,
} from './types.js';

export { LogLevel } from './types.js';

// ============================================================================
// Constants
// ============================================================================

export {
  LOG_LEVELS,
  LEVEL_NAMES,
  LEVEL_ORDER,
  LEVEL_COLORS,
  LEVEL_LABELS,
  DEFAULT_NAME,
  DEFAULT_LEVEL,
  DEFAULT_FORMAT,
  DEFAULT_COLORS,
  DEFAULT_TIMESTAMP,
  DEFAULT_SOURCE,
  DEFAULT_SYNC_LEVELS,
  DEFAULT_BUFFER_OPTIONS,
  REDACTED_VALUE,
  COMMON_SENSITIVE_FIELDS,
  parseSize,
  parseRotation,
  IS_NODE,
  IS_BROWSER,
  IS_DEV,
  IS_TTY,
} from './constants.js';

// ============================================================================
// Transports
// ============================================================================

export { consoleTransport } from './transports/console.js';
export { fileTransport } from './transports/file.js';
export { streamTransport } from './transports/stream.js';
export { httpTransport } from './transports/http.js';
export {
  localStorageTransport,
  readLogs,
  clearLogs,
  getStorageUsage,
} from './transports/localStorage.js';

// ============================================================================
// Plugins
// ============================================================================

// Core plugins (automatically loaded)
export { levelPlugin } from './plugins/core/level.js';
export { formatPlugin } from './plugins/core/format.js';
export { timestampPlugin } from './plugins/core/timestamp.js';

// Optional plugins
export { redactPlugin } from './plugins/optional/redact.js';
export { sourcePlugin } from './plugins/optional/source.js';
export { timingPlugin } from './plugins/optional/timing.js';
export { correlationPlugin } from './plugins/optional/correlation.js';
export { bufferPlugin } from './plugins/optional/buffer.js';
export { browserPlugin } from './plugins/optional/browser.js';

// ============================================================================
// Utilities
// ============================================================================

export {
  isNode,
  isBrowser,
  isDev,
  isTTY,
  shouldUseColors,
  getEnvironment,
  getCwd,
} from './utils/env.js';

export {
  formatJson,
  formatPretty,
  safeStringify,
  formatTime,
  formatIso,
  formatDuration,
  formatBytes,
  truncate,
  indent,
} from './utils/format.js';

export {
  redactFields,
  isSensitive,
  createRedactor,
  autoRedact,
} from './utils/redact.js';

export {
  getSourceLocation,
  extractFileName,
  getCallerLocation,
  formatLocation,
} from './utils/source.js';

// ============================================================================
// Errors
// ============================================================================

export {
  LogError,
  PluginError,
  TransportError,
  ConfigError,
  SerializationError,
  EnvironmentError,
  BufferError,
  ensureError,
  wrapError,
} from './errors.js';

// ============================================================================
// Default Export
// ============================================================================

export { createLogger as default } from './logger.js';
