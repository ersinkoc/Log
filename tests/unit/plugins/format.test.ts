import { describe, it, expect, vi } from 'vitest';
import { formatPlugin, detectFormat, formatEntry, getEffectiveFormat } from '../../../src/plugins/core/format.js';
import type { LogContext, LogEntry } from '../../../src/types.js';

describe('formatPlugin', () => {
  it('should create a plugin with correct metadata', () => {
    const plugin = formatPlugin();
    expect(plugin.name).toBe('format');
    expect(plugin.version).toBe('1.0.0');
  });

  it('should set default format on install if not set', () => {
    const plugin = formatPlugin();
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
    expect(ctx.format).toBeDefined();
  });

  it('should not override existing format on install', () => {
    const plugin = formatPlugin();
    const ctx: LogContext = { format: 'pretty' } as LogContext;
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
    expect(ctx.format).toBe('pretty');
  });

  it('should resolve auto format on install', () => {
    const plugin = formatPlugin();
    const ctx: LogContext = { format: 'auto' } as LogContext;
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
    expect(['json', 'pretty']).toContain(ctx.format);
  });
});

describe('detectFormat', () => {
  it('should return json or pretty format', () => {
    const format = detectFormat();
    expect(['json', 'pretty']).toContain(format);
  });
});

describe('formatEntry', () => {
  const mockEntry: LogEntry = {
    level: 30,
    levelName: 'info',
    time: Date.now(),
    msg: 'test message',
  };

  it('should format entry as JSON when format is json', () => {
    const ctx = {
      format: 'json',
      timestamp: true,
      source: false,
    } as LogContext;

    const result = formatEntry(ctx, mockEntry);
    expect(() => JSON.parse(result)).not.toThrow();
  });

  it('should format entry as pretty when format is pretty', () => {
    const ctx = {
      format: 'pretty',
      timestamp: true,
      source: true,
      pigment: {
        gray: (s: string) => s,
        dim: (s: string) => s,
        blue: (s: string) => s,
        red: (s: string) => s,
      },
    } as unknown as LogContext;

    const result = formatEntry(ctx, mockEntry);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('should auto-detect format when set to auto', () => {
    const ctx = {
      format: 'auto',
      timestamp: true,
      source: false,
    } as LogContext;

    const result = formatEntry(ctx, mockEntry);
    expect(typeof result).toBe('string');
  });
});

describe('getEffectiveFormat', () => {
  it('should return json when format is json', () => {
    const ctx = { format: 'json' } as LogContext;
    expect(getEffectiveFormat(ctx)).toBe('json');
  });

  it('should return pretty when format is pretty', () => {
    const ctx = { format: 'pretty' } as LogContext;
    expect(getEffectiveFormat(ctx)).toBe('pretty');
  });

  it('should auto-detect when format is auto', () => {
    const ctx = { format: 'auto' } as LogContext;
    const result = getEffectiveFormat(ctx);
    expect(['json', 'pretty']).toContain(result);
  });
});
