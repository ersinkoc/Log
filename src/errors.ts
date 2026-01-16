/**
 * @oxog/log - Error Classes
 *
 * Custom error classes for the logging library.
 *
 * @packageDocumentation
 */

/**
 * Base error class for @oxog/log.
 *
 * @example
 * ```typescript
 * try {
 *   log.info({ nested: circular });
 * } catch (err) {
 *   if (err instanceof LogError) {
 *     console.error('Log error:', err.code);
 *   }
 * }
 * ```
 */
export class LogError extends Error {
  /** Error code for programmatic handling */
  readonly code: string;

  /** Original error if wrapping another error */
  override readonly cause?: Error;

  constructor(message: string, code: string, cause?: Error) {
    super(message);
    this.name = 'LogError';
    this.code = code;
    this.cause = cause;

    // Maintain proper stack trace in V8
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Error thrown when a plugin fails to install or operate.
 *
 * @example
 * ```typescript
 * throw new PluginError('Failed to initialize plugin', 'my-plugin');
 * ```
 */
export class PluginError extends LogError {
  /** Name of the plugin that caused the error */
  readonly pluginName: string;

  constructor(message: string, pluginName: string, cause?: Error) {
    super(`[Plugin: ${pluginName}] ${message}`, 'PLUGIN_ERROR', cause);
    this.name = 'PluginError';
    this.pluginName = pluginName;
  }
}

/**
 * Error thrown when a transport fails to write or operate.
 *
 * @example
 * ```typescript
 * throw new TransportError('Failed to write to file', 'file-transport');
 * ```
 */
export class TransportError extends LogError {
  /** Name of the transport that caused the error */
  readonly transportName: string;

  constructor(message: string, transportName: string, cause?: Error) {
    super(`[Transport: ${transportName}] ${message}`, 'TRANSPORT_ERROR', cause);
    this.name = 'TransportError';
    this.transportName = transportName;
  }
}

/**
 * Error thrown when configuration is invalid.
 *
 * @example
 * ```typescript
 * throw new ConfigError('Invalid log level: verbose');
 * ```
 */
export class ConfigError extends LogError {
  /** Configuration option that caused the error */
  readonly option?: string;

  constructor(message: string, option?: string, cause?: Error) {
    super(message, 'CONFIG_ERROR', cause);
    this.name = 'ConfigError';
    this.option = option;
  }
}

/**
 * Error thrown when serialization fails (e.g., circular references).
 *
 * @example
 * ```typescript
 * throw new SerializationError('Circular reference detected');
 * ```
 */
export class SerializationError extends LogError {
  constructor(message: string, cause?: Error) {
    super(message, 'SERIALIZATION_ERROR', cause);
    this.name = 'SerializationError';
  }
}

/**
 * Error thrown when a required feature is not available in the current environment.
 *
 * @example
 * ```typescript
 * throw new EnvironmentError('File transport is not available in browser');
 * ```
 */
export class EnvironmentError extends LogError {
  /** Required environment */
  readonly requiredEnv: 'node' | 'browser';

  constructor(message: string, requiredEnv: 'node' | 'browser', cause?: Error) {
    super(message, 'ENVIRONMENT_ERROR', cause);
    this.name = 'EnvironmentError';
    this.requiredEnv = requiredEnv;
  }
}

/**
 * Error thrown when buffer operations fail.
 *
 * @example
 * ```typescript
 * throw new BufferError('Buffer overflow: max size exceeded');
 * ```
 */
export class BufferError extends LogError {
  constructor(message: string, cause?: Error) {
    super(message, 'BUFFER_ERROR', cause);
    this.name = 'BufferError';
  }
}

/**
 * Create an error from an unknown caught value.
 * Ensures we always have a proper Error object.
 *
 * @example
 * ```typescript
 * try {
 *   riskyOperation();
 * } catch (err) {
 *   throw ensureError(err);
 * }
 * ```
 */
export function ensureError(value: unknown): Error {
  if (value instanceof Error) {
    return value;
  }

  if (typeof value === 'string') {
    return new Error(value);
  }

  if (typeof value === 'object' && value !== null) {
    const obj = value as Record<string, unknown>;
    if (typeof obj['message'] === 'string') {
      const err = new Error(obj['message']);
      if (typeof obj['name'] === 'string') {
        err.name = obj['name'];
      }
      return err;
    }
  }

  return new Error(String(value));
}

/**
 * Wrap an error with additional context.
 *
 * @example
 * ```typescript
 * try {
 *   writeToFile(data);
 * } catch (err) {
 *   throw wrapError(err, 'Failed to write log file');
 * }
 * ```
 */
export function wrapError(error: unknown, message: string): LogError {
  const cause = ensureError(error);
  return new LogError(`${message}: ${cause.message}`, 'WRAPPED_ERROR', cause);
}
