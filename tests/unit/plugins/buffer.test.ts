import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { bufferPlugin, bufferEntry, flushBuffer, flushBufferSync, getBufferSize, clearBuffer, stopFlushInterval } from '../../../src/plugins/optional/buffer.js';
import type { LogContext, LogEntry, Transport } from '../../../src/types.js';
import { createEmitter } from '@oxog/emitter';

describe('bufferPlugin', () => {
  it('should create a plugin with correct metadata', () => {
    const plugin = bufferPlugin();
    expect(plugin.name).toBe('buffer');
    expect(plugin.version).toBe('1.0.0');
  });

  it('should install without error', () => {
    const plugin = bufferPlugin();
    const ctx: LogContext = {} as LogContext;
    const mockKernel = {
      getContext: () => ctx,
      use: () => {},
      unregister: () => false,
      has: () => false,
      list: () => [],
      init: async () => {},
      destroy: async () => {},
    };

    expect(() => plugin.install(mockKernel)).not.toThrow();
  });

  it('should accept size option', () => {
    expect(() => bufferPlugin({ size: 100 })).not.toThrow();
  });

  it('should accept flushInterval option', () => {
    expect(() => bufferPlugin({ flushInterval: 5000 })).not.toThrow();
  });

  it('should accept combined options', () => {
    expect(() => bufferPlugin({ size: 50, flushInterval: 2000 })).not.toThrow();
  });

  it('should initialize buffer on install', () => {
    const plugin = bufferPlugin({ size: 50 });
    const ctx: LogContext = {} as LogContext;
    const mockKernel = {
      getContext: () => ctx,
      use: () => {},
      unregister: () => false,
      has: () => false,
      list: () => [],
      init: async () => {},
      destroy: async () => {},
    };

    plugin.install(mockKernel);
    expect(ctx.buffer).toEqual([]);
    expect(ctx.bufferOptions.size).toBe(50);
  });

  it('should start flush interval on install', () => {
    vi.useFakeTimers();
    const plugin = bufferPlugin({ flushInterval: 1000 });
    const ctx: LogContext = {
      transports: [],
      emitter: createEmitter(),
    } as unknown as LogContext;
    const mockKernel = {
      getContext: () => ctx,
      use: () => {},
      unregister: () => false,
      has: () => false,
      list: () => [],
      init: async () => {},
      destroy: async () => {},
    };

    plugin.install(mockKernel);
    expect(ctx.flushTimerId).toBeDefined();

    // Clean up
    stopFlushInterval(ctx);
    vi.useRealTimers();
  });

  it('should call onDestroy without error', async () => {
    const plugin = bufferPlugin();
    expect(plugin.onDestroy).toBeDefined();
    await expect(plugin.onDestroy?.()).resolves.toBeUndefined();
  });
});

describe('bufferEntry', () => {
  let ctx: LogContext;
  const mockTransport: Transport = {
    name: 'mock',
    write: vi.fn(),
  };

  beforeEach(() => {
    ctx = {
      buffer: [],
      bufferOptions: { size: 3, flushInterval: 1000 },
      transports: [mockTransport],
      emitter: createEmitter(),
    } as unknown as LogContext;
    vi.clearAllMocks();
  });

  it('should add entry to buffer', () => {
    const entry: LogEntry = { level: 30, levelName: 'info', time: Date.now(), msg: 'test' };
    const flushed = bufferEntry(ctx, entry);

    expect(flushed).toBe(false);
    expect(ctx.buffer).toContain(entry);
  });

  it('should flush when buffer is full', () => {
    const entries: LogEntry[] = [
      { level: 30, levelName: 'info', time: Date.now(), msg: 'test1' },
      { level: 30, levelName: 'info', time: Date.now(), msg: 'test2' },
      { level: 30, levelName: 'info', time: Date.now(), msg: 'test3' },
    ];

    bufferEntry(ctx, entries[0]);
    bufferEntry(ctx, entries[1]);
    const flushed = bufferEntry(ctx, entries[2]);

    expect(flushed).toBe(true);
    expect(ctx.buffer.length).toBe(0);
  });
});

describe('flushBuffer', () => {
  let ctx: LogContext;
  const mockTransport: Transport = {
    name: 'mock',
    write: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    ctx = {
      buffer: [],
      bufferOptions: { size: 100, flushInterval: 1000 },
      transports: [mockTransport],
      emitter: createEmitter(),
    } as unknown as LogContext;
    vi.clearAllMocks();
  });

  it('should return empty array when buffer is empty', async () => {
    const result = await flushBuffer(ctx);
    expect(result).toEqual([]);
  });

  it('should flush all entries to transports', async () => {
    const entries: LogEntry[] = [
      { level: 30, levelName: 'info', time: Date.now(), msg: 'test1' },
      { level: 30, levelName: 'info', time: Date.now(), msg: 'test2' },
    ];
    ctx.buffer = [...entries];

    const result = await flushBuffer(ctx);

    expect(result).toHaveLength(2);
    expect(mockTransport.write).toHaveBeenCalledTimes(2);
    expect(ctx.buffer).toEqual([]);
  });

  it('should handle transport errors gracefully', async () => {
    const errorTransport: Transport = {
      name: 'error',
      write: vi.fn().mockRejectedValue(new Error('Write failed')),
    };
    ctx.transports = [errorTransport];
    ctx.buffer = [{ level: 30, levelName: 'info', time: Date.now(), msg: 'test' }];

    await expect(flushBuffer(ctx)).resolves.not.toThrow();
  });
});

describe('flushBufferSync', () => {
  let ctx: LogContext;
  const mockTransport: Transport = {
    name: 'mock',
    write: vi.fn(),
  };

  beforeEach(() => {
    ctx = {
      buffer: [],
      bufferOptions: { size: 100, flushInterval: 1000 },
      transports: [mockTransport],
      emitter: createEmitter(),
    } as unknown as LogContext;
    vi.clearAllMocks();
  });

  it('should return empty array when buffer is empty', () => {
    const result = flushBufferSync(ctx);
    expect(result).toEqual([]);
  });

  it('should flush all entries synchronously', () => {
    const entries: LogEntry[] = [
      { level: 30, levelName: 'info', time: Date.now(), msg: 'test1' },
      { level: 30, levelName: 'info', time: Date.now(), msg: 'test2' },
    ];
    ctx.buffer = [...entries];

    const result = flushBufferSync(ctx);

    expect(result).toHaveLength(2);
    expect(mockTransport.write).toHaveBeenCalledTimes(2);
    expect(ctx.buffer).toEqual([]);
  });

  it('should handle transport errors gracefully', () => {
    const errorTransport: Transport = {
      name: 'error',
      write: vi.fn().mockImplementation(() => {
        throw new Error('Write failed');
      }),
    };
    ctx.transports = [errorTransport];
    ctx.buffer = [{ level: 30, levelName: 'info', time: Date.now(), msg: 'test' }];

    expect(() => flushBufferSync(ctx)).not.toThrow();
  });
});

describe('getBufferSize', () => {
  it('should return buffer size', () => {
    const ctx = {
      buffer: [
        { level: 30, levelName: 'info', time: Date.now(), msg: 'test1' },
        { level: 30, levelName: 'info', time: Date.now(), msg: 'test2' },
      ],
    } as unknown as LogContext;

    expect(getBufferSize(ctx)).toBe(2);
  });

  it('should return 0 for empty buffer', () => {
    const ctx = { buffer: [] } as unknown as LogContext;
    expect(getBufferSize(ctx)).toBe(0);
  });
});

describe('clearBuffer', () => {
  it('should clear buffer and return entries', () => {
    const entries: LogEntry[] = [
      { level: 30, levelName: 'info', time: Date.now(), msg: 'test1' },
      { level: 30, levelName: 'info', time: Date.now(), msg: 'test2' },
    ];
    const ctx = { buffer: [...entries] } as unknown as LogContext;

    const result = clearBuffer(ctx);

    expect(result).toHaveLength(2);
    expect(ctx.buffer).toEqual([]);
  });
});

describe('stopFlushInterval', () => {
  it('should clear flush interval timer', () => {
    vi.useFakeTimers();
    const timerId = setInterval(() => {}, 1000);
    const ctx = { flushTimerId: timerId } as unknown as LogContext;

    stopFlushInterval(ctx);

    expect(ctx.flushTimerId).toBeUndefined();
    vi.useRealTimers();
  });

  it('should handle undefined timer', () => {
    const ctx = {} as unknown as LogContext;
    expect(() => stopFlushInterval(ctx)).not.toThrow();
  });
});
