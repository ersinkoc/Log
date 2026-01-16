/**
 * @oxog/log - Stream Transport
 *
 * Output logs to Node.js writable streams.
 * Node.js only.
 *
 * @packageDocumentation
 */

import type { Transport, LogEntry, StreamTransportOptions } from '../types.js';
import { formatJson } from '../utils/format.js';
import { isNode } from '../utils/env.js';
import { TransportError, EnvironmentError } from '../errors.js';

/**
 * Create a stream transport.
 *
 * @example
 * ```typescript
 * import { streamTransport } from '@oxog/log/transports';
 * import { createWriteStream } from 'fs';
 *
 * const transport = streamTransport({
 *   stream: createWriteStream('./app.log'),
 * });
 * ```
 */
export function streamTransport(options: StreamTransportOptions): Transport {
  if (!isNode()) {
    throw new EnvironmentError('Stream transport is only available in Node.js', 'node');
  }

  const { stream } = options;

  if (!stream) {
    throw new TransportError('Stream is required', 'stream');
  }

  let closed = false;

  return {
    name: 'stream',

    write(entry: LogEntry): Promise<void> {
      if (closed) {
        return Promise.reject(new TransportError('Stream is closed', 'stream'));
      }

      const line = formatJson(entry) + '\n';

      return new Promise((resolve, reject) => {
        const canWrite = stream.write(line, (err) => {
          if (err) {
            reject(new TransportError(`Failed to write to stream: ${err.message}`, 'stream', err));
          } else {
            resolve();
          }
        });

        // Handle backpressure
        if (!canWrite) {
          stream.once('drain', () => {
            resolve();
          });
        }
      });
    },

    flush(): Promise<void> {
      // Most streams don't have explicit flush
      return Promise.resolve();
    },

    async close(): Promise<void> {
      if (closed) return;
      closed = true;

      return new Promise((resolve, reject) => {
        stream.once('finish', resolve);
        stream.once('error', (err) => {
          reject(new TransportError(`Failed to close stream: ${err.message}`, 'stream', err));
        });
        stream.end();
      });
    },

    supports(env: 'node' | 'browser'): boolean {
      return env === 'node';
    },
  };
}

export default streamTransport;
