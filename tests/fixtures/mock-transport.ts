import { vi } from 'vitest';
import type { Transport, LogEntry } from '../../src/types.js';

export interface MockTransport extends Transport {
  getEntries(): LogEntry[];
  clear(): void;
}

export function mockTransport(): MockTransport {
  const entries: LogEntry[] = [];

  const transport: MockTransport = {
    name: 'mock',

    write: vi.fn((entry: LogEntry) => {
      entries.push(entry);
    }),

    flush: vi.fn(() => {}),

    close: vi.fn(() => {}),

    supports(_env: 'node' | 'browser') {
      return true;
    },

    getEntries() {
      return [...entries];
    },

    clear() {
      entries.length = 0;
    }
  };

  return transport;
}
