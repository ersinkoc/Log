import { describe, it, expect, vi, beforeEach } from 'vitest';
import { timingPlugin, startTimer, endTimer, hasTimer, getActiveTimers, clearTimers, createTimer } from '../../../src/plugins/optional/timing.js';
import type { LogContext } from '../../../src/types.js';

describe('timingPlugin', () => {
  it('should create a plugin with correct metadata', () => {
    const plugin = timingPlugin();
    expect(plugin.name).toBe('timing');
    expect(plugin.version).toBe('1.0.0');
  });

  it('should install without error', () => {
    const plugin = timingPlugin();
    const ctx: LogContext = {
      timers: new Map(),
    } as LogContext;
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

  it('should initialize timers map if not set', () => {
    const plugin = timingPlugin();
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
    expect(ctx.timers).toBeInstanceOf(Map);
  });

  it('should call onDestroy without error', () => {
    const plugin = timingPlugin();
    expect(plugin.onDestroy).toBeDefined();
    expect(() => plugin.onDestroy?.()).not.toThrow();
  });
});

describe('startTimer', () => {
  let ctx: LogContext;

  beforeEach(() => {
    ctx = {
      timers: new Map(),
    } as LogContext;
  });

  it('should start a timer', () => {
    startTimer(ctx, 'test-timer');
    expect(ctx.timers.has('test-timer')).toBe(true);
  });

  it('should overwrite existing timer with same label', () => {
    startTimer(ctx, 'test-timer');
    const firstStart = ctx.timers.get('test-timer');
    startTimer(ctx, 'test-timer');
    const secondStart = ctx.timers.get('test-timer');
    expect(secondStart).toBeGreaterThanOrEqual(firstStart!);
  });
});

describe('endTimer', () => {
  let ctx: LogContext;

  beforeEach(() => {
    ctx = {
      timers: new Map(),
    } as LogContext;
  });

  it('should return duration and delete timer', async () => {
    startTimer(ctx, 'test-timer');
    await new Promise((resolve) => setTimeout(resolve, 10));
    const duration = endTimer(ctx, 'test-timer');

    expect(duration).toBeDefined();
    expect(duration).toBeGreaterThan(0);
    expect(ctx.timers.has('test-timer')).toBe(false);
  });

  it('should return undefined for non-existent timer', () => {
    const duration = endTimer(ctx, 'non-existent');
    expect(duration).toBeUndefined();
  });

  it('should round duration to 2 decimal places', async () => {
    startTimer(ctx, 'test-timer');
    await new Promise((resolve) => setTimeout(resolve, 5));
    const duration = endTimer(ctx, 'test-timer');

    expect(duration).toBeDefined();
    const decimalPlaces = duration!.toString().split('.')[1]?.length ?? 0;
    expect(decimalPlaces).toBeLessThanOrEqual(2);
  });
});

describe('hasTimer', () => {
  let ctx: LogContext;

  beforeEach(() => {
    ctx = {
      timers: new Map(),
    } as LogContext;
  });

  it('should return true for existing timer', () => {
    startTimer(ctx, 'test-timer');
    expect(hasTimer(ctx, 'test-timer')).toBe(true);
  });

  it('should return false for non-existent timer', () => {
    expect(hasTimer(ctx, 'non-existent')).toBe(false);
  });
});

describe('getActiveTimers', () => {
  let ctx: LogContext;

  beforeEach(() => {
    ctx = {
      timers: new Map(),
    } as LogContext;
  });

  it('should return empty array when no timers', () => {
    expect(getActiveTimers(ctx)).toEqual([]);
  });

  it('should return all active timer labels', () => {
    startTimer(ctx, 'timer1');
    startTimer(ctx, 'timer2');
    startTimer(ctx, 'timer3');

    const timers = getActiveTimers(ctx);
    expect(timers).toHaveLength(3);
    expect(timers).toContain('timer1');
    expect(timers).toContain('timer2');
    expect(timers).toContain('timer3');
  });
});

describe('clearTimers', () => {
  let ctx: LogContext;

  beforeEach(() => {
    ctx = {
      timers: new Map(),
    } as LogContext;
  });

  it('should clear all timers', () => {
    startTimer(ctx, 'timer1');
    startTimer(ctx, 'timer2');
    startTimer(ctx, 'timer3');

    clearTimers(ctx);

    expect(ctx.timers.size).toBe(0);
  });

  it('should handle already empty timers', () => {
    expect(() => clearTimers(ctx)).not.toThrow();
  });
});

describe('createTimer', () => {
  let ctx: LogContext;

  beforeEach(() => {
    ctx = {
      timers: new Map(),
    } as LogContext;
  });

  it('should create a one-shot timer function', async () => {
    const end = createTimer(ctx, 'test-timer');
    expect(ctx.timers.has('test-timer')).toBe(true);

    await new Promise((resolve) => setTimeout(resolve, 5));
    const duration = end();

    expect(duration).toBeDefined();
    expect(duration).toBeGreaterThan(0);
    expect(ctx.timers.has('test-timer')).toBe(false);
  });

  it('should return undefined if called twice', async () => {
    const end = createTimer(ctx, 'test-timer');
    await new Promise((resolve) => setTimeout(resolve, 5));

    const first = end();
    const second = end();

    expect(first).toBeDefined();
    expect(second).toBeUndefined();
  });
});
