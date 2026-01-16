import { describe, it, expect } from 'vitest';
import { timestampPlugin, addTimestamp, formatTimestamp, now, nowIso, toIso, fromIso } from '../../../src/plugins/core/timestamp.js';
import type { LogContext, LogEntry } from '../../../src/types.js';

describe('timestampPlugin', () => {
  it('should create a plugin with correct metadata', () => {
    const plugin = timestampPlugin();
    expect(plugin.name).toBe('timestamp');
    expect(plugin.version).toBe('1.0.0');
  });

  it('should set default timestamp setting on install if not set', () => {
    const plugin = timestampPlugin();
    const ctx: LogContext = {} as LogContext;
    const mockKernel = {
      getContext: () => ctx,
      use: () => {},
      unregister: () => false,
      hasPlugin: () => false,
      listPlugins: () => [],
      init: async () => {},
      destroy: async () => {},
    };

    plugin.install(mockKernel);
    expect(ctx.timestamp).toBe(true);
  });

  it('should not override existing timestamp setting on install', () => {
    const plugin = timestampPlugin();
    const ctx: LogContext = { timestamp: false } as LogContext;
    const mockKernel = {
      getContext: () => ctx,
      use: () => {},
      unregister: () => false,
      hasPlugin: () => false,
      listPlugins: () => [],
      init: async () => {},
      destroy: async () => {},
    };

    plugin.install(mockKernel);
    expect(ctx.timestamp).toBe(false);
  });
});

describe('addTimestamp', () => {
  it('should add timestamp to entry', () => {
    const entry = { level: 30, levelName: 'info', msg: 'test' } as LogEntry;
    const before = Date.now();
    addTimestamp(entry);
    const after = Date.now();

    expect(entry.time).toBeDefined();
    expect(entry.time).toBeGreaterThanOrEqual(before);
    expect(entry.time).toBeLessThanOrEqual(after);
  });

  it('should not override existing timestamp', () => {
    const existingTime = 1705294800000;
    const entry = { level: 30, levelName: 'info', msg: 'test', time: existingTime } as LogEntry;
    addTimestamp(entry);

    expect(entry.time).toBe(existingTime);
  });
});

describe('formatTimestamp', () => {
  it('should format timestamp as ISO string', () => {
    const timestamp = 1705294800000;
    const formatted = formatTimestamp(timestamp);
    expect(formatted).toContain('2024-01-15');
  });

  it('should handle current timestamp', () => {
    const formatted = formatTimestamp(Date.now());
    expect(formatted).toMatch(/^\d{4}-\d{2}-\d{2}/);
  });
});

describe('now', () => {
  it('should return current timestamp in milliseconds', () => {
    const before = Date.now();
    const result = now();
    const after = Date.now();

    expect(result).toBeGreaterThanOrEqual(before);
    expect(result).toBeLessThanOrEqual(after);
  });
});

describe('nowIso', () => {
  it('should return current ISO timestamp string', () => {
    const result = nowIso();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});

describe('toIso', () => {
  it('should convert Unix timestamp to ISO string', () => {
    const timestamp = 1705294800000;
    const result = toIso(timestamp);
    expect(result).toContain('2024-01-15');
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});

describe('fromIso', () => {
  it('should convert ISO string to Unix timestamp', () => {
    const isoString = '2024-01-15T00:00:00.000Z';
    const result = fromIso(isoString);
    expect(typeof result).toBe('number');
    expect(result).toBeGreaterThan(0);
  });

  it('should round-trip with toIso', () => {
    const original = 1705294800000;
    const iso = toIso(original);
    const back = fromIso(iso);
    expect(back).toBe(original);
  });
});
