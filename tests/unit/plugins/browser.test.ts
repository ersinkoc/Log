import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  browserPlugin,
  getConsoleMethod,
  getLevelStyles,
  isGroupingEnabled,
  writeToBrowserConsole,
  startGroup,
  endGroup,
} from '../../../src/plugins/optional/browser.js';
import type { LogContext, LogLevelName, LogEntry } from '../../../src/types.js';

// Helper to install a plugin with options
function installPlugin(options = {}) {
  const plugin = browserPlugin(options);
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

describe('browserPlugin', () => {
  beforeEach(() => {
    installPlugin();
  });

  it('should create a plugin with correct metadata', () => {
    const plugin = browserPlugin();
    expect(plugin.name).toBe('browser');
    expect(plugin.version).toBe('1.0.0');
  });

  it('should install without error', () => {
    const { plugin, mockKernel } = installPlugin();
    expect(() => plugin.install(mockKernel)).not.toThrow();
  });

  it('should accept styled option', () => {
    expect(() => installPlugin({ styled: true })).not.toThrow();
    expect(() => installPlugin({ styled: false })).not.toThrow();
  });

  it('should accept grouping option', () => {
    expect(() => installPlugin({ grouping: true })).not.toThrow();
    expect(() => installPlugin({ grouping: false })).not.toThrow();
  });

  it('should accept custom styles', () => {
    const customStyles = {
      info: 'color: green; font-size: 14px;',
    };
    expect(() => installPlugin({ styles: customStyles })).not.toThrow();
  });
});

describe('getConsoleMethod', () => {
  it('should return debug for trace and debug levels', () => {
    expect(getConsoleMethod('trace')).toBe('debug');
    expect(getConsoleMethod('debug')).toBe('debug');
  });

  it('should return info for info level', () => {
    expect(getConsoleMethod('info')).toBe('info');
  });

  it('should return warn for warn level', () => {
    expect(getConsoleMethod('warn')).toBe('warn');
  });

  it('should return error for error and fatal levels', () => {
    expect(getConsoleMethod('error')).toBe('error');
    expect(getConsoleMethod('fatal')).toBe('error');
  });

  it('should return log for unknown level', () => {
    expect(getConsoleMethod('unknown' as LogLevelName)).toBe('log');
  });
});

describe('getLevelStyles', () => {
  it('should return styles for all levels', () => {
    installPlugin();
    const levels: LogLevelName[] = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];
    for (const level of levels) {
      const styles = getLevelStyles(level);
      expect(styles).toContain('color:');
      expect(styles).toContain('font-weight: bold');
    }
  });

  it('should return custom styles when provided', () => {
    const customStyle = 'color: purple; font-size: 16px;';
    installPlugin({ styles: { info: customStyle } });
    expect(getLevelStyles('info')).toBe(customStyle);
  });

  it('should handle unknown level with default color', () => {
    installPlugin();
    const styles = getLevelStyles('unknown' as LogLevelName);
    expect(styles).toContain('color:');
    expect(styles).toContain('#000000');
  });
});

describe('isGroupingEnabled', () => {
  beforeEach(() => {
    installPlugin();
  });

  it('should return true by default', () => {
    installPlugin();
    expect(isGroupingEnabled()).toBe(true);
  });

  it('should return false when disabled', () => {
    installPlugin({ grouping: false });
    expect(isGroupingEnabled()).toBe(false);
  });
});

describe('writeToBrowserConsole', () => {
  // These tests verify that the functions don't throw in Node.js
  // (they early return when not in a browser)

  it('should not throw in non-browser environment', () => {
    const entry: LogEntry = {
      level: 30,
      levelName: 'info',
      time: Date.now(),
      msg: 'test message',
    };
    expect(() => writeToBrowserConsole(entry)).not.toThrow();
    expect(() => writeToBrowserConsole(entry, true)).not.toThrow();
    expect(() => writeToBrowserConsole(entry, false)).not.toThrow();
  });

  it('should handle entry with extra fields', () => {
    const entry: LogEntry = {
      level: 30,
      levelName: 'info',
      time: Date.now(),
      msg: 'test message',
      userId: 123,
      action: 'login',
    };
    expect(() => writeToBrowserConsole(entry, true)).not.toThrow();
  });

  it('should handle all log levels', () => {
    const levels: LogLevelName[] = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];
    for (const level of levels) {
      const entry: LogEntry = {
        level: 10,
        levelName: level,
        time: Date.now(),
        msg: `${level} message`,
      };
      expect(() => writeToBrowserConsole(entry)).not.toThrow();
    }
  });
});

describe('startGroup', () => {
  it('should not throw in non-browser environment', () => {
    expect(() => startGroup('Test Group')).not.toThrow();
    expect(() => startGroup('Test Group', false)).not.toThrow();
    expect(() => startGroup('Test Group', true)).not.toThrow();
  });
});

describe('endGroup', () => {
  it('should not throw in non-browser environment', () => {
    expect(() => endGroup()).not.toThrow();
  });
});
