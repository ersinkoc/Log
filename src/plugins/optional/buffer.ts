/**
 * @oxog/log - Buffer Plugin
 *
 * Provides async buffering for log entries.
 *
 * @packageDocumentation
 */

import type { Plugin } from '@oxog/types';
import type { LogContext, LogEntry, BufferOptions } from '../../types.js';
import { DEFAULT_BUFFER_OPTIONS } from '../../constants.js';

/**
 * Buffer plugin for async log buffering.
 *
 * This plugin:
 * - Buffers log entries for batch processing
 * - Flushes based on size or interval
 * - Respects sync levels (fatal/error bypass buffer)
 *
 * @example
 * ```typescript
 * import { bufferPlugin } from '@oxog/log/plugins';
 *
 * logger.use(bufferPlugin({
 *   size: 100,
 *   flushInterval: 1000
 * }));
 * ```
 */
export function bufferPlugin(options: BufferOptions = {}): Plugin<LogContext> {
  return {
    name: 'buffer',
    version: '1.0.0',

    install(kernel) {
      const ctx = kernel.getContext();

      // Initialize buffer
      ctx.buffer = [];
      ctx.bufferOptions = {
        size: options.size ?? DEFAULT_BUFFER_OPTIONS.size,
        flushInterval: options.flushInterval ?? DEFAULT_BUFFER_OPTIONS.flushInterval,
      };

      // Start flush interval
      const flushInterval = ctx.bufferOptions.flushInterval ?? DEFAULT_BUFFER_OPTIONS.flushInterval;
      if (flushInterval > 0) {
        ctx.flushTimerId = setInterval(() => {
          flushBuffer(ctx).catch(() => {
            // Silently ignore flush errors in interval
          });
        }, flushInterval);
      }
    },

    async onDestroy() {
      // Flush is handled by logger.close()
    },
  };
}

/**
 * Add an entry to the buffer.
 * Returns true if buffer was flushed.
 */
export function bufferEntry(ctx: LogContext, entry: LogEntry): boolean {
  ctx.buffer.push(entry);

  // Check if buffer is full
  if (ctx.buffer.length >= (ctx.bufferOptions.size ?? DEFAULT_BUFFER_OPTIONS.size)) {
    // Flush synchronously to avoid overflow
    flushBufferSync(ctx);
    return true;
  }

  return false;
}

/**
 * Flush the buffer asynchronously.
 */
export async function flushBuffer(ctx: LogContext): Promise<LogEntry[]> {
  if (ctx.buffer.length === 0) {
    return [];
  }

  // Swap buffer
  const entries = ctx.buffer;
  ctx.buffer = [];

  // Write all entries to transports
  await Promise.all(
    entries.flatMap((entry) =>
      ctx.transports.map((transport) =>
        Promise.resolve(transport.write(entry)).catch(() => {
          // Silently ignore individual transport errors
        })
      )
    )
  );

  // Emit flush event
  ctx.emitter.emit('flush', undefined as never);

  return entries;
}

/**
 * Flush the buffer synchronously.
 */
export function flushBufferSync(ctx: LogContext): LogEntry[] {
  if (ctx.buffer.length === 0) {
    return [];
  }

  // Swap buffer
  const entries = ctx.buffer;
  ctx.buffer = [];

  // Write all entries to transports (ignore promises)
  for (const entry of entries) {
    for (const transport of ctx.transports) {
      try {
        transport.write(entry);
      } catch {
        // Silently ignore errors
      }
    }
  }

  return entries;
}

/**
 * Get the current buffer size.
 */
export function getBufferSize(ctx: LogContext): number {
  return ctx.buffer.length;
}

/**
 * Clear the buffer without flushing.
 */
export function clearBuffer(ctx: LogContext): LogEntry[] {
  const entries = ctx.buffer;
  ctx.buffer = [];
  return entries;
}

/**
 * Stop the flush interval timer.
 */
export function stopFlushInterval(ctx: LogContext): void {
  if (ctx.flushTimerId) {
    clearInterval(ctx.flushTimerId);
    ctx.flushTimerId = undefined;
  }
}

export default bufferPlugin;
