/**
 * @oxog/log - Logger Factory
 *
 * Creates logger instances with plugin-based architecture.
 *
 * @packageDocumentation
 */

import { createKernel } from '@oxog/plugin';
import { createEmitter } from '@oxog/emitter';
import { pigment } from '@oxog/pigment';
import type { Plugin } from '@oxog/types';
import type {
  Logger,
  LoggerOptions,
  LogEntry,
  LogContext,
  LogEvents,
  LogLevelName,
  LogLevel,
  Transport,
  Format,
  Unsubscribe,
} from './types.js';
import { LOG_LEVELS, LEVEL_NAMES, DEFAULT_NAME, DEFAULT_LEVEL, DEFAULT_FORMAT } from './constants.js';
import { getEnvironment, isNode } from './utils/env.js';
import { consoleTransport } from './transports/console.js';
import { levelPlugin } from './plugins/core/level.js';
import { formatPlugin } from './plugins/core/format.js';
import { timestampPlugin } from './plugins/core/timestamp.js';
import { ConfigError } from './errors.js';

/**
 * Create a logger instance.
 *
 * @example
 * ```typescript
 * import { createLogger } from '@oxog/log';
 *
 * const logger = createLogger({
 *   name: 'my-app',
 *   level: 'debug',
 *   transports: [consoleTransport()],
 * });
 *
 * logger.info('Hello, world!');
 * ```
 */
export function createLogger(options: LoggerOptions = {}): Logger {
  const {
    name = DEFAULT_NAME,
    level = DEFAULT_LEVEL,
    format = DEFAULT_FORMAT,
    colors = true,
    transports = [],
    redact = [],
    source = false,
    timestamp = true,
    sync = { fatal: true, error: true },
    buffer,
    context: initialContext = {},
    plugins = [],
  } = options;

  // Validate level
  if (!(level in LOG_LEVELS)) {
    throw new ConfigError(`Invalid log level: ${level}`, 'level');
  }

  // Create event emitter
  const emitter = createEmitter<LogEvents>();

  // Setup transports
  const activeTransports: Transport[] = [];
  const env = getEnvironment();

  // Add default console transport if none specified
  if (transports.length === 0) {
    activeTransports.push(consoleTransport({ colors }));
  } else {
    for (const transport of transports) {
      if (!transport.supports || transport.supports(env as 'node' | 'browser')) {
        activeTransports.push(transport);
      }
    }
  }

  // Create kernel context
  const kernelContext: LogContext = {
    name,
    level: LOG_LEVELS[level] as unknown as LogLevel,
    format: resolveFormat(format),
    colors,
    timestamp,
    source,
    transports: activeTransports,
    redactPaths: redact,
    bindings: { ...initialContext },
    correlationId: undefined,
    pigment,
    emitter,
    syncLevels: {
      trace: sync.trace ?? false,
      debug: sync.debug ?? false,
      info: sync.info ?? false,
      warn: sync.warn ?? false,
      error: sync.error ?? true,
      fatal: sync.fatal ?? true,
    },
    bufferOptions: buffer ?? {},
    timers: new Map(),
    buffer: [],
    flushTimerId: undefined,
  };

  // Create kernel with plugins
  const kernel = createKernel<LogContext>({ context: kernelContext });

  // Install core plugins
  kernel.use(levelPlugin());
  kernel.use(formatPlugin());
  kernel.use(timestampPlugin());

  // Install user plugins
  for (const plugin of plugins) {
    kernel.use(plugin);
  }

  // Track if logger is closed
  let closed = false;

  // Emit transport error
  function emitTransportError(transportName: string, error: unknown, entry?: LogEntry): void {
    const err = error instanceof Error ? error : new Error(String(error));
    emitter.emit('error', { transport: transportName, error: err, entry });

    // Fallback to stderr for critical visibility
    if (isNode()) {
      process.stderr.write(`[LOG TRANSPORT ERROR] ${transportName}: ${err.message}\n`);
    }
  }

  // Write to transports synchronously (blocking)
  function writeToTransportsSync(entry: LogEntry): void {
    if (closed) return;

    for (const transport of activeTransports) {
      try {
        if (transport.writeSync) {
          transport.writeSync(entry);
        } else {
          // Fallback to async write but don't await (best effort)
          const result = transport.write(entry);
          if (result instanceof Promise) {
            result.catch((err) => emitTransportError(transport.name, err, entry));
          }
        }
      } catch (err) {
        emitTransportError(transport.name, err, entry);
      }
    }
  }

  // Write to transports asynchronously
  async function writeToTransports(entry: LogEntry): Promise<void> {
    if (closed) return;

    const promises: Promise<void>[] = [];

    for (const transport of activeTransports) {
      try {
        const result = transport.write(entry);
        if (result instanceof Promise) {
          promises.push(
            result.catch((err) => {
              emitTransportError(transport.name, err, entry);
            })
          );
        }
      } catch (err) {
        emitTransportError(transport.name, err, entry);
      }
    }

    if (promises.length > 0) {
      await Promise.all(promises);
    }
  }

  // Create log entry
  function createEntry(
    levelNum: LogLevel,
    levelName: LogLevelName,
    msg: string,
    data?: Record<string, unknown>,
    error?: Error
  ): LogEntry {
    const ctx = kernel.getContext();

    const entry: LogEntry = {
      level: levelNum,
      levelName,
      time: Date.now(),
      msg,
      ...ctx.bindings,
      ...data,
    };

    // Add error if present
    if (error) {
      entry.err = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    // Add correlation ID if set
    if (ctx.correlationId) {
      entry.correlationId = ctx.correlationId;
    }

    return entry;
  }

  // Check if level is enabled
  function isEnabled(levelNum: LogLevel): boolean {
    const ctx = kernel.getContext();
    return levelNum >= ctx.level;
  }

  // Should write sync
  function shouldSync(levelName: LogLevelName): boolean {
    const ctx = kernel.getContext();
    return ctx.syncLevels[levelName] ?? false;
  }

  // Generic log method
  function log(
    levelNum: LogLevel,
    levelName: LogLevelName,
    msgOrObj: string | object,
    msgOrUndefined?: string
  ): void {
    if (!isEnabled(levelNum)) return;

    let msg: string;
    let data: Record<string, unknown> | undefined;
    let error: Error | undefined;

    if (typeof msgOrObj === 'string') {
      msg = msgOrObj;
    } else if (msgOrObj instanceof Error) {
      msg = msgOrUndefined ?? msgOrObj.message;
      error = msgOrObj;
    } else {
      msg = msgOrUndefined ?? '';
      data = msgOrObj as Record<string, unknown>;
    }

    const entry = createEntry(levelNum, levelName, msg, data, error);

    // Emit events
    emitter.emit('log', entry);
    emitter.emit(`log:${levelName}` as keyof LogEvents, entry);

    if (shouldSync(levelName)) {
      // Sync write - truly blocking for critical logs
      writeToTransportsSync(entry);
    } else {
      // Async write
      writeToTransports(entry).catch((err) => {
        emitTransportError('logger', err, entry);
      });
    }
  }

  // Create the logger object
  const logger: Logger = {
    // Log methods with overloads
    trace(msgOrObj: string | object, msg?: string): void {
      log(LOG_LEVELS.trace as unknown as LogLevel, 'trace', msgOrObj, msg);
    },

    debug(msgOrObj: string | object, msg?: string): void {
      log(LOG_LEVELS.debug as unknown as LogLevel, 'debug', msgOrObj, msg);
    },

    info(msgOrObj: string | object, msg?: string): void {
      log(LOG_LEVELS.info as unknown as LogLevel, 'info', msgOrObj, msg);
    },

    warn(msgOrObj: string | object, msg?: string): void {
      log(LOG_LEVELS.warn as unknown as LogLevel, 'warn', msgOrObj, msg);
    },

    error(msgOrObj: string | object | Error, msg?: string): void {
      log(LOG_LEVELS.error as unknown as LogLevel, 'error', msgOrObj, msg);
    },

    fatal(msgOrObj: string | object | Error, msg?: string): void {
      log(LOG_LEVELS.fatal as unknown as LogLevel, 'fatal', msgOrObj, msg);
    },

    // Level management
    getLevel(): LogLevelName {
      const ctx = kernel.getContext();
      return LEVEL_NAMES[ctx.level] ?? 'info';
    },

    setLevel(newLevel: LogLevelName): void {
      if (!(newLevel in LOG_LEVELS)) {
        throw new ConfigError(`Invalid log level: ${newLevel}`, 'level');
      }
      const ctx = kernel.getContext();
      ctx.level = LOG_LEVELS[newLevel] as unknown as LogLevel;
    },

    isLevelEnabled(levelName: LogLevelName): boolean {
      return isEnabled(LOG_LEVELS[levelName] as unknown as LogLevel);
    },

    // Child logger
    child(bindings: Record<string, unknown>): Logger {
      const ctx = kernel.getContext();
      return createLogger({
        ...options,
        context: { ...ctx.bindings, ...bindings },
        transports: activeTransports,
      });
    },

    // Correlation
    withCorrelation(id?: string): Logger {
      const ctx = kernel.getContext();
      const correlationId = id ?? generateCorrelationId();
      const childLogger = createLogger({
        ...options,
        context: { ...ctx.bindings },
        transports: activeTransports,
      });
      // Set correlation ID on child's context
      const childCtx = (childLogger as unknown as { _getContext: () => LogContext })._getContext?.();
      if (childCtx) {
        childCtx.correlationId = correlationId;
      }
      return childLogger;
    },

    // Timing
    time(label: string): void {
      const ctx = kernel.getContext();
      ctx.timers.set(label, performance.now());
    },

    timeEnd(label: string): void {
      const ctx = kernel.getContext();
      const start = ctx.timers.get(label);
      if (start === undefined) {
        logger.warn(`Timer '${label}' does not exist`);
        return;
      }

      const duration = performance.now() - start;
      ctx.timers.delete(label);

      logger.debug({ label, duration }, `${label}: ${duration.toFixed(2)}ms`);
    },

    async timeAsync<T>(label: string, fn: () => Promise<T>): Promise<T> {
      const start = performance.now();
      try {
        return await fn();
      } finally {
        const duration = performance.now() - start;
        logger.debug({ label, duration }, `${label}: ${duration.toFixed(2)}ms`);
      }
    },

    startTimer(label: string): () => void {
      const start = performance.now();
      return () => {
        const duration = performance.now() - start;
        logger.debug({ label, duration }, `${label}: ${duration.toFixed(2)}ms`);
      };
    },

    // Plugin management
    use(plugin: Plugin<LogContext>): Logger {
      kernel.use(plugin);
      return logger;
    },

    unregister(pluginName: string): boolean {
      return kernel.unregister(pluginName);
    },

    hasPlugin(pluginName: string): boolean {
      return kernel.has(pluginName);
    },

    listPlugins(): Plugin<LogContext>[] {
      return kernel.list();
    },

    // Event handling
    on<K extends keyof LogEvents>(event: K, handler: (payload: LogEvents[K]) => void): Unsubscribe {
      return emitter.on(event, handler as (payload: LogEvents[K]) => void);
    },

    // Lifecycle
    async flush(): Promise<void> {
      const promises: Promise<void>[] = [];

      for (const transport of activeTransports) {
        if (transport.flush) {
          try {
            const result = transport.flush();
            if (result instanceof Promise) {
              promises.push(result.catch((err) => emitTransportError(transport.name, err)));
            }
          } catch (err) {
            emitTransportError(transport.name, err);
          }
        }
      }

      await Promise.all(promises);
      emitter.emit('flush', undefined as never);
    },

    async close(): Promise<void> {
      if (closed) return;
      closed = true;

      // Stop flush interval timer if running
      const ctx = kernel.getContext();
      if (ctx.flushTimerId) {
        clearInterval(ctx.flushTimerId);
        ctx.flushTimerId = undefined;
      }

      // Flush internal buffer if any entries are pending
      if (ctx.buffer && ctx.buffer.length > 0) {
        const bufferedEntries = ctx.buffer;
        ctx.buffer = [];

        // Write buffered entries synchronously to ensure they're not lost
        for (const entry of bufferedEntries) {
          for (const transport of activeTransports) {
            try {
              if (transport.writeSync) {
                transport.writeSync(entry);
              } else {
                const result = transport.write(entry);
                if (result instanceof Promise) {
                  await result.catch((err) => emitTransportError(transport.name, err, entry));
                }
              }
            } catch (err) {
              emitTransportError(transport.name, err, entry);
            }
          }
        }
      }

      // Flush transport buffers
      await logger.flush();

      // Close transports
      const promises: Promise<void>[] = [];

      for (const transport of activeTransports) {
        if (transport.close) {
          try {
            const result = transport.close();
            if (result instanceof Promise) {
              promises.push(result.catch((err) => emitTransportError(transport.name, err)));
            }
          } catch (err) {
            emitTransportError(transport.name, err);
          }
        }
      }

      await Promise.all(promises);

      // Destroy kernel
      kernel.destroy();

      emitter.emit('close', undefined as never);
    },

    async destroy(): Promise<void> {
      return logger.close();
    },

    // Internal method for getting context
    _getContext(): LogContext {
      return kernel.getContext();
    },
  } as Logger & { _getContext(): LogContext };

  return logger;
}

/**
 * Resolve format option to concrete format.
 */
function resolveFormat(format: Format): Format {
  if (format !== 'auto') {
    return format;
  }

  // Auto-detect based on environment
  if (isNode()) {
    // Use pretty for TTY, JSON otherwise
    return process.stdout?.isTTY ? 'pretty' : 'json';
  }

  // Browser - always pretty
  return 'pretty';
}

/**
 * Generate a unique correlation ID.
 */
function generateCorrelationId(): string {
  // Simple UUID v4-like generation
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export default createLogger;
