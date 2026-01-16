/**
 * @oxog/log - HTTP Transport
 *
 * Send logs to HTTP endpoints with batching and retry.
 *
 * @packageDocumentation
 */

import type { Transport, LogEntry, HttpTransportOptions } from '../types.js';
import { TransportError } from '../errors.js';

/**
 * Create an HTTP transport.
 *
 * @example
 * ```typescript
 * import { httpTransport } from '@oxog/log/transports';
 *
 * const transport = httpTransport({
 *   url: 'https://logs.example.com/ingest',
 *   batch: 100,
 *   interval: 5000,
 *   headers: { 'X-API-Key': 'xxx' },
 * });
 * ```
 */
export function httpTransport(options: HttpTransportOptions): Transport {
  const {
    url,
    method = 'POST',
    headers = {},
    batch = 100,
    interval = 5000,
    retry = 3,
  } = options;

  if (!url) {
    throw new TransportError('URL is required', 'http');
  }

  // Buffer for batching
  let buffer: LogEntry[] = [];
  let flushTimer: ReturnType<typeof setInterval> | null = null;
  let isFlushing = false;
  let closed = false;

  // Start flush interval
  function startFlushInterval(): void {
    if (flushTimer) return;
    if (interval > 0) {
      flushTimer = setInterval(() => {
        flushBuffer().catch(() => {
          // Silently ignore interval flush errors
        });
      }, interval);
    }
  }

  // Stop flush interval
  function stopFlushInterval(): void {
    if (flushTimer) {
      clearInterval(flushTimer);
      flushTimer = null;
    }
  }

  // Flush the buffer
  async function flushBuffer(): Promise<void> {
    if (isFlushing || buffer.length === 0) return;
    isFlushing = true;

    // Take current buffer
    const entries = buffer;
    buffer = [];

    try {
      await sendWithRetry(entries);
    } catch (err) {
      // Put entries back in buffer if send fails
      buffer = [...entries, ...buffer].slice(0, batch * 2); // Limit buffer size
      throw err;
    } finally {
      isFlushing = false;
    }
  }

  // Send entries with retry
  async function sendWithRetry(entries: LogEntry[]): Promise<void> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retry; attempt++) {
      try {
        await sendEntries(entries);
        return;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));

        // Exponential backoff
        if (attempt < retry) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 30000);
          await sleep(delay);
        }
      }
    }

    throw new TransportError(
      `Failed to send logs after ${retry + 1} attempts: ${lastError?.message}`,
      'http',
      lastError || undefined
    );
  }

  // Send entries to endpoint
  async function sendEntries(entries: LogEntry[]): Promise<void> {
    const body = JSON.stringify(entries);

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  }

  // Sleep utility
  function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Start interval on first write
  let started = false;

  return {
    name: 'http',

    async write(entry: LogEntry): Promise<void> {
      if (closed) {
        throw new TransportError('Transport is closed', 'http');
      }

      // Start interval on first write
      if (!started) {
        started = true;
        startFlushInterval();
      }

      // Add to buffer
      buffer.push(entry);

      // Flush if buffer is full
      if (buffer.length >= batch) {
        await flushBuffer();
      }
    },

    async flush(): Promise<void> {
      await flushBuffer();
    },

    async close(): Promise<void> {
      if (closed) return;
      closed = true;

      stopFlushInterval();

      // Final flush
      if (buffer.length > 0) {
        try {
          await flushBuffer();
        } catch {
          // Ignore errors on close
        }
      }
    },

    supports(_env: 'node' | 'browser'): boolean {
      // Works in both environments with fetch
      return typeof fetch !== 'undefined';
    },
  };
}

export default httpTransport;
