import { describe, it, expect, afterEach } from 'vitest';
import { localStorageTransport, readLogs, clearLogs, getStorageUsage } from '../../../src/transports/localStorage.js';
import type { LogEntry } from '../../../src/types.js';

// Note: localStorageTransport throws EnvironmentError in Node.js because it requires browser

describe('localStorageTransport', () => {
  it('should throw in Node environment', () => {
    expect(() => localStorageTransport({ key: 'test-logs' }))
      .toThrow('LocalStorage transport is only available in browser');
  });
});

describe('readLogs', () => {
  it('should return empty array in Node environment', () => {
    const logs = readLogs('nonexistent');
    expect(logs).toEqual([]);
  });
});

describe('clearLogs', () => {
  it('should not throw in Node environment', () => {
    expect(() => clearLogs('test-logs')).not.toThrow();
  });
});

describe('getStorageUsage', () => {
  it('should return 0 in Node environment', () => {
    const usage = getStorageUsage('test');
    expect(usage).toBe(0);
  });
});

// Browser-path coverage: the Node-only tests above never exercise saveLogs().
// These shim a minimal window.localStorage so the eviction logic is covered.
describe('localStorageTransport (browser behaviour)', () => {
  interface Store {
    get(k: string): string | undefined;
    set(k: string, v: string): void;
    delete(k: string): void;
  }

  let map: Map<string, string>;

  const installBrowser = (quotaBytes: number | null = null) => {
    map = new Map();
    const store: Store = {
      get: (k) => map.get(k),
      set: (k, v) => {
        if (quotaBytes !== null && v.length * 2 > quotaBytes) {
          const err = new Error('QuotaExceededError');
          err.name = 'QuotaExceededError';
          throw err;
        }
        map.set(k, v);
      },
      delete: (k) => void map.delete(k),
    };
    (globalThis as unknown as { window: unknown }).window = {
      document: {},
      localStorage: {
        getItem: (k: string) => (map.has(k) ? map.get(k) : null),
        setItem: (k: string, v: string) => store.set(k, v),
        removeItem: (k: string) => store.delete(k),
      },
    };
  };

  const entry = (msg: string, extra: Record<string, unknown> = {}): LogEntry => ({
    level: 30,
    levelName: 'info',
    time: Date.now(),
    msg,
    ...extra,
  });

  afterEach(() => {
    delete (globalThis as unknown as { window?: unknown }).window;
  });

  it('should evict oldest entries instead of wiping the whole store', () => {
    installBrowser();
    const transport = localStorageTransport({ key: 'app-logs', maxSize: '200B' });

    for (let i = 1; i <= 8; i++) transport.write(entry(`e${i}`));

    const logs = readLogs('app-logs');
    expect(logs.length).toBeGreaterThan(0);
    expect(logs[logs.length - 1].msg).toBe('e8');
    expect(getStorageUsage('app-logs')).toBeLessThanOrEqual(200);
  });

  it('should keep every entry when under the cap', () => {
    installBrowser();
    const transport = localStorageTransport({ key: 'roomy', maxSize: '1MB' });

    for (let i = 1; i <= 20; i++) transport.write(entry(`r${i}`));

    expect(readLogs('roomy')).toHaveLength(20);
  });

  it('should stay bounded under sustained over-cap writes', () => {
    installBrowser();
    const transport = localStorageTransport({ key: 'bound', maxSize: '150B' });

    for (let i = 0; i < 30; i++) transport.write(entry(`b${i}`));

    expect(readLogs('bound').length).toBeGreaterThan(0);
    expect(getStorageUsage('bound')).toBeLessThanOrEqual(150);
  });

  it('should not throw when the storage quota is exceeded', () => {
    installBrowser(300);
    const transport = localStorageTransport({ key: 'quota', maxSize: '1MB' });

    expect(() => {
      for (let i = 0; i < 40; i++) transport.write(entry(`q${i}`));
    }).not.toThrow();
  });

  it('should still honour the levels filter', () => {
    installBrowser();
    const transport = localStorageTransport({ key: 'lvl', maxSize: '1MB', levels: ['error'] });

    transport.write(entry('info one', { level: 30, levelName: 'info' }));
    transport.write(entry('error one', { level: 50, levelName: 'error' }));

    const logs = readLogs('lvl');
    expect(logs).toHaveLength(1);
    expect(logs[0].msg).toBe('error one');
  });

  it('should round trip through readLogs and clearLogs', () => {
    installBrowser();
    const transport = localStorageTransport({ key: 'rt', maxSize: '1MB' });
    transport.write(entry('one'));
    transport.write(entry('two'));

    expect(readLogs('rt')).toHaveLength(2);
    clearLogs('rt');
    expect(readLogs('rt')).toHaveLength(0);
    expect(getStorageUsage('rt')).toBe(0);
  });
});
