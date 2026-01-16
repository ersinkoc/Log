import { describe, it, expect, beforeEach } from 'vitest';
import {
  correlationPlugin,
  generateCorrelationId,
  addCorrelationId,
  getCorrelationId,
  setCorrelationId,
  ensureCorrelationId,
} from '../../../src/plugins/optional/correlation.js';
import type { LogContext, LogEntry } from '../../../src/types.js';

// Helper to install a plugin with options
function installPlugin(options = {}) {
  const plugin = correlationPlugin(options);
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
  return { plugin, ctx, mockKernel };
}

describe('correlationPlugin', () => {
  // Reset to default options before each test
  beforeEach(() => {
    installPlugin();
  });

  it('should create a plugin with correct metadata', () => {
    const plugin = correlationPlugin();
    expect(plugin.name).toBe('correlation');
    expect(plugin.version).toBe('1.0.0');
  });

  it('should install without error', () => {
    const { plugin, mockKernel } = installPlugin();
    expect(() => plugin.install(mockKernel)).not.toThrow();
  });

  it('should support custom prefix', () => {
    installPlugin({ prefix: 'custom' });
    const id = generateCorrelationId();
    expect(id.startsWith('custom_')).toBe(true);
  });

  it('should support custom generator', () => {
    installPlugin({ generator: () => 'custom-id' });
    const id = generateCorrelationId();
    expect(id).toBe('custom-id');
  });
});

describe('generateCorrelationId', () => {
  beforeEach(() => {
    installPlugin();
  });

  it('should generate unique IDs', () => {
    const id1 = generateCorrelationId();
    const id2 = generateCorrelationId();
    expect(id1).not.toBe(id2);
  });

  it('should use default prefix', () => {
    const id = generateCorrelationId();
    expect(id.startsWith('cid_')).toBe(true);
  });
});

describe('addCorrelationId', () => {
  it('should add correlation ID to entry', () => {
    const entry = { level: 30, levelName: 'info', msg: 'test' } as LogEntry;
    addCorrelationId(entry, 'req-123');
    expect(entry.correlationId).toBe('req-123');
  });
});

describe('getCorrelationId', () => {
  it('should get correlation ID from context', () => {
    const ctx = { correlationId: 'req-456' } as LogContext;
    expect(getCorrelationId(ctx)).toBe('req-456');
  });

  it('should return undefined if not set', () => {
    const ctx = {} as LogContext;
    expect(getCorrelationId(ctx)).toBeUndefined();
  });
});

describe('setCorrelationId', () => {
  it('should set correlation ID on context', () => {
    const ctx = {} as LogContext;
    setCorrelationId(ctx, 'req-789');
    expect(ctx.correlationId).toBe('req-789');
  });
});

describe('ensureCorrelationId', () => {
  beforeEach(() => {
    installPlugin();
  });

  it('should return existing ID if set', () => {
    const ctx = { correlationId: 'existing' } as LogContext;
    const id = ensureCorrelationId(ctx);
    expect(id).toBe('existing');
  });

  it('should generate new ID if not set', () => {
    const ctx = {} as LogContext;
    const id = ensureCorrelationId(ctx);
    expect(id).toBeDefined();
    expect(ctx.correlationId).toBe(id);
  });
});
