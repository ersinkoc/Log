import { describe, it, expect } from 'vitest';
import { localStorageTransport, readLogs, clearLogs, getStorageUsage } from '../../../src/transports/localStorage.js';

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
