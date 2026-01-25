/**
 * @oxog/log - Type Definitions
 *
 * Core type definitions for the logging library.
 * Uses @oxog/types for Plugin and Kernel interfaces.
 *
 * @packageDocumentation
 */

import type { Plugin, MaybePromise } from '@oxog/types';
import type { Emitter } from '@oxog/emitter';
import type { Pigment } from '@oxog/pigment';

// ============================================================================
// Log Levels
// ============================================================================

/**
 * Log level numeric values for filtering.
 *
 * @example
 * ```typescript
 * import { LogLevel } from '@oxog/log';
 *
 * if (entry.level >= LogLevel.Error) {
 *   alertTeam(entry);
 * }
 * ```
 */
export enum LogLevel {
  Trace = 10,
  Debug = 20,
  Info = 30,
  Warn = 40,
  Error = 50,
  Fatal = 60,
}

/**
 * Log level names as string literals.
 *
 * @example
 * ```typescript
 * const level: LogLevelName = 'info';
 * ```
 */
export type LogLevelName = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

/**
 * Output format options.
 *
 * - `'json'` - Structured JSON output (production)
 * - `'pretty'` - Human-readable colored output (development)
 * - `'auto'` - Auto-detect based on NODE_ENV and TTY
 *
 * @example
 * ```typescript
 * const log = createLogger({ format: 'pretty' });
 * ```
 */
export type Format = 'json' | 'pretty' | 'auto';

// ============================================================================
// Log Entry
// ============================================================================

/**
 * Structure of a log entry.
 *
 * @example
 * ```typescript
 * const entry: LogEntry = {
 *   level: LogLevel.Info,
 *   levelName: 'info',
 *   time: Date.now(),
 *   msg: 'User logged in',
 *   userId: 123,
 * };
 * ```
 */
export interface LogEntry {
  /** Numeric log level value */
  level: LogLevel;

  /** Log level name */
  levelName: LogLevelName;

  /** Unix timestamp in milliseconds */
  time: number;

  /** Log message */
  msg: string;

  /** Additional data fields */
  [key: string]: unknown;

  // Optional standard fields
  /** Source file name (when source tracking enabled) */
  file?: string;

  /** Source line number (when source tracking enabled) */
  line?: number;

  /** Source column number (when source tracking enabled) */
  column?: number;

  /** Correlation ID for request tracing */
  correlationId?: string;

  /** Duration in milliseconds (for timing) */
  duration?: number;

  /** Error information */
  err?: {
    message: string;
    stack?: string;
    name: string;
    code?: string;
  };
}

// ============================================================================
// Transport
// ============================================================================

/**
 * Transport interface for log output destinations.
 * Transports receive formatted log entries and write them to destinations.
 *
 * @example
 * ```typescript
 * const myTransport: Transport = {
 *   name: 'my-transport',
 *   write(entry) {
 *     console.log(JSON.stringify(entry));
 *   },
 *   writeSync(entry) {
 *     // Blocking write for critical logs
 *     fs.writeFileSync('/var/log/app.log', JSON.stringify(entry) + '\n', { flag: 'a' });
 *   },
 * };
 * ```
 */
export interface Transport {
  /** Unique transport identifier */
  name: string;

  /**
   * Write a log entry to the destination.
   * Can be sync or async.
   */
  write(entry: LogEntry): MaybePromise<void>;

  /**
   * Write a log entry synchronously (blocking).
   * Used for fatal/error logs to ensure they are written before process exit.
   * Falls back to write() if not implemented.
   */
  writeSync?(entry: LogEntry): void;

  /**
   * Flush any buffered entries.
   * Called before shutdown or on manual flush.
   */
  flush?(): MaybePromise<void>;

  /**
   * Close the transport and cleanup resources.
   */
  close?(): MaybePromise<void>;

  /**
   * Check if transport supports the current environment.
   */
  supports?(env: 'node' | 'browser'): boolean;
}

// ============================================================================
// Logger Options
// ============================================================================

/**
 * Buffer configuration for async logging.
 *
 * @example
 * ```typescript
 * const log = createLogger({
 *   buffer: { size: 100, flushInterval: 1000 }
 * });
 * ```
 */
export interface BufferOptions {
  /** Maximum number of entries to buffer before flush */
  size?: number;

  /** Flush interval in milliseconds */
  flushInterval?: number;
}

/**
 * Logger configuration options.
 *
 * @example
 * ```typescript
 * const log = createLogger({
 *   level: 'debug',
 *   format: 'pretty',
 *   colors: true,
 *   timestamp: true,
 *   redact: ['password', 'token'],
 * });
 * ```
 */
export interface LoggerOptions {
  /**
   * Logger name, included in all entries.
   * @default 'app'
   */
  name?: string;

  /**
   * Minimum log level to output.
   * @default 'info'
   */
  level?: LogLevelName;

  /**
   * Output format.
   * @default 'auto'
   */
  format?: Format;

  /**
   * Enable colored output (uses @oxog/pigment).
   * @default true
   */
  colors?: boolean;

  /**
   * Include ISO 8601 timestamp in entries.
   * @default true
   */
  timestamp?: boolean;

  /**
   * Include source file and line number.
   * @default false
   */
  source?: boolean;

  /**
   * Fields to redact from output.
   * Supports dot notation for nested paths.
   * @example ['password', 'user.token', 'headers.authorization']
   */
  redact?: string[];

  /**
   * Output transports.
   * @default [consoleTransport()]
   */
  transports?: Transport[];

  /**
   * Additional plugins to load.
   */
  plugins?: Plugin<LogContext>[];

  /**
   * Sync/async mode per level.
   * Sync mode ensures log is written before continuing.
   * @default { fatal: true, error: true }
   */
  sync?: Partial<Record<LogLevelName, boolean>>;

  /**
   * Buffer configuration for async logging.
   */
  buffer?: BufferOptions;

  /**
   * Static context added to all entries.
   */
  context?: Record<string, unknown>;
}

// ============================================================================
// Log Context
// ============================================================================

/**
 * Log context shared between plugins.
 * This is the kernel context type for @oxog/plugin.
 */
export interface LogContext {
  /** Logger name */
  name: string;

  /** Current minimum log level */
  level: LogLevel;

  /** Output format */
  format: Format;

  /** Colors enabled */
  colors: boolean;

  /** Timestamp enabled */
  timestamp: boolean;

  /** Source tracking enabled */
  source: boolean;

  /** Registered transports */
  transports: Transport[];

  /** Fields to redact */
  redactPaths: string[];

  /** Bound context (from child loggers) */
  bindings: Record<string, unknown>;

  /** Correlation ID (if set) */
  correlationId?: string;

  /** Pigment instance for colors */
  pigment: Pigment;

  /** Event emitter for log events */
  emitter: Emitter<LogEvents>;

  /** Sync settings per level */
  syncLevels: Record<LogLevelName, boolean>;

  /** Buffer settings */
  bufferOptions: BufferOptions;

  /** Active timers for timing plugin */
  timers: Map<string, number>;

  /** Buffered entries for async logging */
  buffer: LogEntry[];

  /** Flush interval timer ID */
  flushTimerId?: ReturnType<typeof setInterval>;
}

// ============================================================================
// Log Events
// ============================================================================

/**
 * Transport error payload for error events.
 */
export interface TransportErrorPayload {
  /** Transport name that failed */
  transport: string;
  /** The error that occurred */
  error: Error;
  /** The log entry that failed to write (if available) */
  entry?: LogEntry;
}

/**
 * Log events for subscription via @oxog/emitter.
 *
 * @example
 * ```typescript
 * log.on('log:error', (entry) => {
 *   alertTeam(entry);
 * });
 *
 * // Listen for transport errors
 * log.on('error', ({ transport, error }) => {
 *   console.error(`Transport ${transport} failed:`, error);
 * });
 * ```
 */
export interface LogEvents {
  /** Index signature for EventMap compatibility */
  [key: string]: unknown;

  /** Emitted for every log entry */
  log: LogEntry;

  /** Emitted for trace level logs */
  'log:trace': LogEntry;

  /** Emitted for debug level logs */
  'log:debug': LogEntry;

  /** Emitted for info level logs */
  'log:info': LogEntry;

  /** Emitted for warn level logs */
  'log:warn': LogEntry;

  /** Emitted for error level logs */
  'log:error': LogEntry;

  /** Emitted for fatal level logs */
  'log:fatal': LogEntry;

  /** Emitted when buffer is flushed */
  flush: void;

  /** Emitted when logger is closed */
  close: void;

  /** Emitted when a transport fails to write */
  error: TransportErrorPayload;
}

/**
 * Unsubscribe function returned by event subscription.
 */
export type Unsubscribe = () => void;

// ============================================================================
// Logger Interface
// ============================================================================

/**
 * Logger instance interface.
 * Provides logging methods, child loggers, and lifecycle management.
 *
 * @example
 * ```typescript
 * const log = createLogger();
 *
 * log.info('Server started');
 * log.info({ port: 3000 }, 'Listening');
 *
 * const dbLog = log.child({ module: 'database' });
 * dbLog.debug('Connected');
 *
 * await log.flush();
 * await log.close();
 * ```
 */
export interface Logger {
  // ─────────────────────────────────────────────────────────────────────────
  // Logging Methods
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Log at TRACE level (10).
   * Most verbose, for detailed debugging.
   */
  trace(msg: string): void;
  trace(obj: object, msg?: string): void;

  /**
   * Log at DEBUG level (20).
   * Debug information for developers.
   */
  debug(msg: string): void;
  debug(obj: object, msg?: string): void;

  /**
   * Log at INFO level (30).
   * General informational messages.
   */
  info(msg: string): void;
  info(obj: object, msg?: string): void;

  /**
   * Log at WARN level (40).
   * Warning conditions.
   */
  warn(msg: string): void;
  warn(obj: object, msg?: string): void;

  /**
   * Log at ERROR level (50).
   * Error conditions.
   */
  error(msg: string): void;
  error(obj: object, msg?: string): void;
  error(err: Error, msg?: string): void;

  /**
   * Log at FATAL level (60).
   * System is unusable.
   */
  fatal(msg: string): void;
  fatal(obj: object, msg?: string): void;
  fatal(err: Error, msg?: string): void;

  // ─────────────────────────────────────────────────────────────────────────
  // Child Loggers
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Create a child logger with bound context.
   * Child context is merged with parent context.
   *
   * @example
   * ```typescript
   * const dbLog = log.child({ module: 'database' });
   * dbLog.info('Connected'); // includes { module: 'database' }
   * ```
   */
  child(bindings: Record<string, unknown>): Logger;

  /**
   * Create a child logger with correlation ID.
   * Useful for request tracing.
   *
   * @example
   * ```typescript
   * const reqLog = log.withCorrelation('req-123');
   * reqLog.info('Request received');
   * ```
   */
  withCorrelation(id?: string): Logger;

  // ─────────────────────────────────────────────────────────────────────────
  // Timing
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Start a timer with the given label.
   *
   * @example
   * ```typescript
   * log.time('db-query');
   * await db.query('SELECT * FROM users');
   * log.timeEnd('db-query'); // logs duration
   * ```
   */
  time(label: string): void;

  /**
   * End a timer and log the duration.
   */
  timeEnd(label: string): void;

  /**
   * Time an async operation.
   *
   * @example
   * ```typescript
   * const result = await log.timeAsync('api-call', async () => {
   *   return await fetch('/api/data');
   * });
   * ```
   */
  timeAsync<T>(label: string, fn: () => Promise<T>): Promise<T>;

  /**
   * Start a timer and return a stop function.
   *
   * @example
   * ```typescript
   * const stop = log.startTimer('process');
   * await doWork();
   * stop(); // logs duration
   * ```
   */
  startTimer(label: string): () => void;

  // ─────────────────────────────────────────────────────────────────────────
  // Events
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Subscribe to log events.
   *
   * @example
   * ```typescript
   * const unsub = log.on('log:error', (entry) => {
   *   alertTeam(entry);
   * });
   *
   * // Later: unsub();
   * ```
   */
  on<K extends keyof LogEvents>(
    event: K,
    handler: (payload: LogEvents[K]) => void
  ): Unsubscribe;

  // ─────────────────────────────────────────────────────────────────────────
  // Plugin Management
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Register a plugin.
   */
  use(plugin: Plugin<LogContext>): this;

  /**
   * Unregister a plugin by name.
   */
  unregister(name: string): boolean;

  /**
   * Check if a plugin is registered.
   */
  hasPlugin(name: string): boolean;

  /**
   * List all registered plugins.
   */
  listPlugins(): Plugin<LogContext>[];

  // ─────────────────────────────────────────────────────────────────────────
  // Level Management
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Set the minimum log level.
   */
  setLevel(level: LogLevelName): void;

  /**
   * Get the current minimum log level.
   */
  getLevel(): LogLevelName;

  /**
   * Check if a level is enabled.
   */
  isLevelEnabled(level: LogLevelName): boolean;

  // ─────────────────────────────────────────────────────────────────────────
  // Lifecycle
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Flush all buffered entries.
   */
  flush(): Promise<void>;

  /**
   * Close the logger and cleanup resources.
   */
  close(): Promise<void>;

  /**
   * Alias for close().
   */
  destroy(): Promise<void>;
}

// ============================================================================
// Transport Options
// ============================================================================

/**
 * Console transport options.
 */
export interface ConsoleTransportOptions {
  /** Enable colors */
  colors?: boolean;

  /** Show timestamp */
  timestamp?: boolean;

  /** Custom level colors */
  levelColors?: Partial<Record<LogLevelName, string>>;
}

/**
 * File transport options.
 */
export interface FileTransportOptions {
  /** File path */
  path: string;

  /** Rotation interval ('1d', '1h', etc.) */
  rotate?: string;

  /** Max file size ('10MB', '1GB', etc.) */
  maxSize?: string;

  /** Max number of files to keep */
  maxFiles?: number;

  /** Compress rotated files */
  compress?: boolean;
}

/**
 * HTTP transport options.
 */
export interface HttpTransportOptions {
  /** Endpoint URL */
  url: string;

  /** HTTP method */
  method?: 'POST' | 'PUT';

  /** Custom headers */
  headers?: Record<string, string>;

  /** Batch size before sending */
  batch?: number;

  /** Flush interval in milliseconds */
  interval?: number;

  /** Retry attempts on failure */
  retry?: number;
}

/**
 * Stream transport options.
 */
export interface StreamTransportOptions {
  /** Node.js writable stream */
  stream: NodeJS.WritableStream;
}

/**
 * LocalStorage transport options (browser only).
 */
export interface LocalStorageTransportOptions {
  /** Storage key prefix */
  key: string;

  /** Max storage size ('1MB', etc.) */
  maxSize?: string;

  /** Only store these levels */
  levels?: LogLevelName[];
}
