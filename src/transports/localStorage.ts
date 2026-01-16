/**
 * @oxog/log - LocalStorage Transport
 *
 * Persist logs to browser localStorage.
 * Browser only.
 *
 * @packageDocumentation
 */

import type { Transport, LogEntry, LocalStorageTransportOptions, LogLevelName } from '../types.js';
import { isBrowser } from '../utils/env.js';
import { parseSize } from '../constants.js';
import { TransportError, EnvironmentError } from '../errors.js';
import { LOG_LEVELS } from '../constants.js';

/**
 * Create a localStorage transport.
 *
 * @example
 * ```typescript
 * import { localStorageTransport } from '@oxog/log/transports';
 *
 * const transport = localStorageTransport({
 *   key: 'app-logs',
 *   maxSize: '1MB',
 *   levels: ['error', 'fatal'],
 * });
 * ```
 */
export function localStorageTransport(options: LocalStorageTransportOptions): Transport {
  if (!isBrowser()) {
    throw new EnvironmentError('LocalStorage transport is only available in browser', 'browser');
  }

  const {
    key,
    maxSize = '1MB',
    levels,
  } = options;

  if (!key) {
    throw new TransportError('Key is required', 'localStorage');
  }

  const maxBytes = parseSize(maxSize);
  const allowedLevels = levels
    ? new Set(levels.map((l) => LOG_LEVELS[l]))
    : null;

  // Get storage
  function getStorage(): Storage {
    return window.localStorage;
  }

  // Load existing logs
  function loadLogs(): LogEntry[] {
    try {
      const data = getStorage().getItem(key);
      if (!data) return [];
      return JSON.parse(data) as LogEntry[];
    } catch {
      return [];
    }
  }

  // Save logs
  function saveLogs(logs: LogEntry[]): void {
    const data = JSON.stringify(logs);

    // Check size
    while (data.length > maxBytes && logs.length > 0) {
      logs.shift(); // Remove oldest
    }

    try {
      getStorage().setItem(key, JSON.stringify(logs));
    } catch (err) {
      // Storage full - try to clear some space
      if (logs.length > 10) {
        logs.splice(0, Math.floor(logs.length / 2));
        saveLogs(logs);
      }
    }
  }

  // Check if level is allowed
  function isLevelAllowed(level: number): boolean {
    if (!allowedLevels) return true;
    return allowedLevels.has(level);
  }

  return {
    name: 'localStorage',

    write(entry: LogEntry): void {
      // Check level filter
      if (!isLevelAllowed(entry.level)) {
        return;
      }

      // Load, add, save
      const logs = loadLogs();
      logs.push(entry);
      saveLogs(logs);
    },

    flush(): void {
      // Nothing to flush - writes are immediate
    },

    close(): void {
      // Nothing to close
    },

    supports(env: 'node' | 'browser'): boolean {
      return env === 'browser';
    },
  };
}

/**
 * Read logs from localStorage.
 *
 * @example
 * ```typescript
 * const logs = readLogs('app-logs');
 * ```
 */
export function readLogs(key: string): LogEntry[] {
  if (!isBrowser()) return [];

  try {
    const data = window.localStorage.getItem(key);
    if (!data) return [];
    return JSON.parse(data) as LogEntry[];
  } catch {
    return [];
  }
}

/**
 * Clear logs from localStorage.
 *
 * @example
 * ```typescript
 * clearLogs('app-logs');
 * ```
 */
export function clearLogs(key: string): void {
  if (!isBrowser()) return;
  window.localStorage.removeItem(key);
}

/**
 * Get storage usage for logs.
 *
 * @example
 * ```typescript
 * const bytes = getStorageUsage('app-logs');
 * ```
 */
export function getStorageUsage(key: string): number {
  if (!isBrowser()) return 0;

  const data = window.localStorage.getItem(key);
  if (!data) return 0;
  return data.length * 2; // UTF-16 encoding
}

export default localStorageTransport;
