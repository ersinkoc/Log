import { describe, it, expect } from 'vitest';
import { levelPlugin, isLevelEnabled, getLevelName, setLevel, parseLevel } from '../../../src/plugins/core/level.js';
import type { LogContext } from '../../../src/types.js';
import { LOG_LEVELS } from '../../../src/constants.js';

describe('levelPlugin', () => {
  it('should create a plugin with correct metadata', () => {
    const plugin = levelPlugin();
    expect(plugin.name).toBe('level');
    expect(plugin.version).toBe('1.0.0');
  });

  it('should set default level on install if not set', () => {
    const plugin = levelPlugin();
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
    expect(ctx.level).toBe(LOG_LEVELS.info);
  });

  it('should not override existing level on install', () => {
    const plugin = levelPlugin();
    const ctx: LogContext = { level: LOG_LEVELS.debug } as LogContext;
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
    expect(ctx.level).toBe(LOG_LEVELS.debug);
  });
});

describe('isLevelEnabled', () => {
  it('should return true for levels at or above minimum', () => {
    const ctx: LogContext = { level: LOG_LEVELS.info } as LogContext;
    expect(isLevelEnabled(ctx, 'info')).toBe(true);
    expect(isLevelEnabled(ctx, 'warn')).toBe(true);
    expect(isLevelEnabled(ctx, 'error')).toBe(true);
    expect(isLevelEnabled(ctx, 'fatal')).toBe(true);
  });

  it('should return false for levels below minimum', () => {
    const ctx: LogContext = { level: LOG_LEVELS.info } as LogContext;
    expect(isLevelEnabled(ctx, 'debug')).toBe(false);
    expect(isLevelEnabled(ctx, 'trace')).toBe(false);
  });
});

describe('getLevelName', () => {
  it('should return correct level name', () => {
    expect(getLevelName({ level: LOG_LEVELS.trace } as LogContext)).toBe('trace');
    expect(getLevelName({ level: LOG_LEVELS.debug } as LogContext)).toBe('debug');
    expect(getLevelName({ level: LOG_LEVELS.info } as LogContext)).toBe('info');
    expect(getLevelName({ level: LOG_LEVELS.warn } as LogContext)).toBe('warn');
    expect(getLevelName({ level: LOG_LEVELS.error } as LogContext)).toBe('error');
    expect(getLevelName({ level: LOG_LEVELS.fatal } as LogContext)).toBe('fatal');
  });

  it('should default to info for unknown level', () => {
    expect(getLevelName({ level: 999 } as LogContext)).toBe('info');
  });
});

describe('setLevel', () => {
  it('should set level on context', () => {
    const ctx: LogContext = { level: LOG_LEVELS.info } as LogContext;
    setLevel(ctx, 'error');
    expect(ctx.level).toBe(LOG_LEVELS.error);
  });

  it('should handle all valid level names', () => {
    const ctx: LogContext = {} as LogContext;

    setLevel(ctx, 'trace');
    expect(ctx.level).toBe(LOG_LEVELS.trace);

    setLevel(ctx, 'debug');
    expect(ctx.level).toBe(LOG_LEVELS.debug);

    setLevel(ctx, 'warn');
    expect(ctx.level).toBe(LOG_LEVELS.warn);
  });
});

describe('parseLevel', () => {
  it('should parse level names', () => {
    expect(parseLevel('trace')).toBe(LOG_LEVELS.trace);
    expect(parseLevel('debug')).toBe(LOG_LEVELS.debug);
    expect(parseLevel('info')).toBe(LOG_LEVELS.info);
    expect(parseLevel('warn')).toBe(LOG_LEVELS.warn);
    expect(parseLevel('error')).toBe(LOG_LEVELS.error);
    expect(parseLevel('fatal')).toBe(LOG_LEVELS.fatal);
  });

  it('should return number if number is passed', () => {
    expect(parseLevel(10)).toBe(10);
    expect(parseLevel(50)).toBe(50);
  });

  it('should default to info for unknown level', () => {
    expect(parseLevel('unknown' as any)).toBe(LOG_LEVELS.info);
  });
});
