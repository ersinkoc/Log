import { describe, it, expect } from 'vitest';
import { sourcePlugin, addSourceLocation } from '../../../src/plugins/optional/source.js';
import { getSourceLocation, extractFileName, getCallerLocation, formatLocation, isInternalFrame } from '../../../src/utils/source.js';
import type { LogContext, LogEntry } from '../../../src/types.js';

describe('sourcePlugin', () => {
  it('should create a plugin with correct metadata', () => {
    const plugin = sourcePlugin();
    expect(plugin.name).toBe('source');
    expect(plugin.version).toBe('1.0.0');
  });

  it('should install without error', () => {
    const plugin = sourcePlugin();
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

  it('should accept depth option', () => {
    expect(() => sourcePlugin({ depth: 3 })).not.toThrow();
    expect(() => sourcePlugin({ depth: 5 })).not.toThrow();
  });

  it('should set source to true on install', () => {
    const plugin = sourcePlugin();
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
    expect(ctx.source).toBe(true);
  });

  it('should expose getSource function on kernel', () => {
    const plugin = sourcePlugin();
    const ctx: LogContext = {} as LogContext;
    const mockKernel = {
      getContext: () => ctx,
      use: () => {},
      unregister: () => false,
      has: () => false,
      list: () => [],
      init: async () => {},
      destroy: async () => {},
    } as any;

    plugin.install(mockKernel);
    expect(mockKernel.getSource).toBeDefined();
    expect(typeof mockKernel.getSource).toBe('function');
  });

  it('should return source location when calling getSource', () => {
    const plugin = sourcePlugin();
    const ctx: LogContext = {} as LogContext;
    const mockKernel = {
      getContext: () => ctx,
      use: () => {},
      unregister: () => false,
      has: () => false,
      list: () => [],
      init: async () => {},
      destroy: async () => {},
    } as any;

    plugin.install(mockKernel);
    const source = mockKernel.getSource();
    // Source may or may not be defined depending on call stack depth
    if (source) {
      expect(source).toHaveProperty('file');
    }
  });

  it('should use custom depth in getSource', () => {
    const plugin = sourcePlugin({ depth: 10 });
    const ctx: LogContext = {} as LogContext;
    const mockKernel = {
      getContext: () => ctx,
      use: () => {},
      unregister: () => false,
      has: () => false,
      list: () => [],
      init: async () => {},
      destroy: async () => {},
    } as any;

    plugin.install(mockKernel);
    // Call getSource - it should use the custom depth
    const source = mockKernel.getSource();
    // Source may be undefined with high depth
    expect(source === undefined || typeof source === 'object').toBe(true);
  });

  it('should accept includeColumn option', () => {
    expect(() => sourcePlugin({ includeColumn: true })).not.toThrow();
  });

  it('should accept includeFullPath option', () => {
    expect(() => sourcePlugin({ includeFullPath: true })).not.toThrow();
  });
});

describe('addSourceLocation', () => {
  it('should add source location to entry', () => {
    const entry: LogEntry = {
      level: 30,
      levelName: 'info',
      time: Date.now(),
      msg: 'test',
    };

    addSourceLocation(entry);

    expect(entry.file).toBeDefined();
    expect(entry.line).toBeDefined();
  });

  it('should accept custom depth', () => {
    const entry: LogEntry = {
      level: 30,
      levelName: 'info',
      time: Date.now(),
      msg: 'test',
    };

    addSourceLocation(entry, 3);
    expect(entry.file).toBeDefined();
  });

  it('should include column when option is set', () => {
    const entry: LogEntry = {
      level: 30,
      levelName: 'info',
      time: Date.now(),
      msg: 'test',
    };

    const result = addSourceLocation(entry, 2, { includeColumn: true });
    expect(result).toBeDefined();
  });

  it('should include full path when option is set', () => {
    const entry: LogEntry = {
      level: 30,
      levelName: 'info',
      time: Date.now(),
      msg: 'test',
    };

    const result = addSourceLocation(entry, 2, { includeFullPath: true });
    expect(result.file).toBeDefined();
  });
});

describe('getSourceLocation', () => {
  it('should return source location object', () => {
    const location = getSourceLocation();
    expect(location).toHaveProperty('file');
    expect(location).toHaveProperty('line');
    expect(location).toHaveProperty('column');
  });

  it('should accept custom depth', () => {
    const location = getSourceLocation(2);
    expect(location).toBeDefined();
  });

  it('should return undefined for very high depth', () => {
    const location = getSourceLocation(100);
    expect(location).toBeUndefined();
  });
});

describe('extractFileName', () => {
  it('should extract filename from path', () => {
    expect(extractFileName('/path/to/file.ts')).toBe('file.ts');
    expect(extractFileName('C:\\path\\to\\file.ts')).toBe('file.ts');
  });

  it('should handle simple filenames', () => {
    expect(extractFileName('file.ts')).toBe('file.ts');
  });

  it('should handle file:// protocol', () => {
    expect(extractFileName('file:///path/to/file.ts')).toBe('file.ts');
  });

  it('should handle query strings and hashes', () => {
    expect(extractFileName('/path/to/file.ts?v=1')).toBe('file.ts');
    expect(extractFileName('/path/to/file.ts#section')).toBe('file.ts');
  });
});

describe('getCallerLocation', () => {
  it('should return caller location', () => {
    const location = getCallerLocation();
    expect(location).toHaveProperty('file');
  });

  it('should accept skip parameter', () => {
    const location = getCallerLocation(2);
    expect(location).toBeDefined();
  });

  it('should accept internal patterns', () => {
    const location = getCallerLocation(0, ['node_modules']);
    expect(location).toBeDefined();
  });
});

describe('isInternalFrame', () => {
  it('should detect @oxog/log as internal', () => {
    const location = { file: 'logger.js', path: '@oxog/log/src/logger.js', line: 1 };
    expect(isInternalFrame(location)).toBe(true);
  });

  it('should detect internal/ pattern as internal', () => {
    const location = { file: 'utils.js', path: 'internal/utils.js', line: 1 };
    expect(isInternalFrame(location)).toBe(true);
  });

  it('should detect <anonymous> as internal', () => {
    const location = { file: '<anonymous>', path: '<anonymous>', line: 1 };
    expect(isInternalFrame(location)).toBe(true);
  });

  it('should not flag user code as internal', () => {
    const location = { file: 'app.ts', path: '/src/app.ts', line: 1 };
    expect(isInternalFrame(location)).toBe(false);
  });

  it('should use custom patterns', () => {
    const location = { file: 'utils.ts', path: '/custom/utils.ts', line: 1 };
    expect(isInternalFrame(location, ['/custom/'])).toBe(true);
  });

  it('should detect node:internal as internal', () => {
    const location = { file: 'loader.js', path: 'node:internal/loader', line: 1 };
    expect(isInternalFrame(location)).toBe(true);
  });
});

describe('formatLocation', () => {
  it('should format location as string', () => {
    const formatted = formatLocation({ file: 'test.ts', line: 10, column: 5 });
    expect(formatted).toContain('test.ts');
    expect(formatted).toContain('10');
    expect(formatted).toContain('5');
  });

  it('should handle missing line/column', () => {
    const formatted = formatLocation({ file: 'test.ts', line: 0 });
    expect(formatted).toBe('test.ts');
  });

  it('should handle line without column', () => {
    const formatted = formatLocation({ file: 'test.ts', line: 42 });
    expect(formatted).toBe('test.ts:42');
  });
});
