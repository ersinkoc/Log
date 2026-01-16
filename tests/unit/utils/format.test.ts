import { describe, it, expect } from 'vitest';
import { formatJson, formatPretty, safeStringify, formatTime, formatIso, formatDuration, formatBytes, truncate, indent } from '../../../src/utils/format.js';
import type { LogEntry } from '../../../src/types.js';

describe('format', () => {
  const mockEntry: LogEntry = {
    level: 30,
    levelName: 'info',
    time: 1705294800000,
    msg: 'test message',
  };

  describe('formatJson', () => {
    it('should format entry as JSON', () => {
      const result = formatJson(mockEntry);
      const parsed = JSON.parse(result);

      expect(parsed.level).toBe(30);
      expect(parsed.msg).toBe('test message');
    });

    it('should handle entry without time', () => {
      const entry = { ...mockEntry, time: 0 };
      const result = formatJson(entry);
      const parsed = JSON.parse(result);
      expect(parsed.time).toBe(0);
    });

    it('should handle BigInt values', () => {
      const entry = { ...mockEntry, bigValue: BigInt(9007199254740991) } as any;
      const result = formatJson(entry);
      const parsed = JSON.parse(result);
      expect(parsed.bigValue).toBe('9007199254740991');
    });

    it('should handle Error objects', () => {
      const error = new Error('Test error');
      error.name = 'CustomError';
      const entry = { ...mockEntry, error } as any;
      const result = formatJson(entry);
      const parsed = JSON.parse(result);
      expect(parsed.error.name).toBe('CustomError');
      expect(parsed.error.message).toBe('Test error');
      expect(parsed.error.stack).toBeDefined();
    });

    it('should handle Error with custom properties', () => {
      const error = new Error('Test error') as Error & { code: string };
      error.code = 'ERR_TEST';
      const entry = { ...mockEntry, error } as any;
      const result = formatJson(entry);
      const parsed = JSON.parse(result);
      expect(parsed.error.code).toBe('ERR_TEST');
    });

    it('should handle RegExp', () => {
      const entry = { ...mockEntry, pattern: /test/gi } as any;
      const result = formatJson(entry);
      const parsed = JSON.parse(result);
      expect(parsed.pattern).toBe('/test/gi');
    });

    it('should handle Date objects', () => {
      const date = new Date('2024-01-15T00:00:00.000Z');
      const entry = { ...mockEntry, date } as any;
      const result = formatJson(entry);
      const parsed = JSON.parse(result);
      expect(parsed.date).toBe('2024-01-15T00:00:00.000Z');
    });

    it('should handle Map objects', () => {
      const map = new Map([['key1', 'value1'], ['key2', 'value2']]);
      const entry = { ...mockEntry, data: map } as any;
      const result = formatJson(entry);
      const parsed = JSON.parse(result);
      expect(parsed.data.key1).toBe('value1');
      expect(parsed.data.key2).toBe('value2');
    });

    it('should handle Set objects', () => {
      const set = new Set([1, 2, 3]);
      const entry = { ...mockEntry, items: set } as any;
      const result = formatJson(entry);
      const parsed = JSON.parse(result);
      expect(parsed.items).toEqual([1, 2, 3]);
    });
  });

  describe('formatPretty', () => {
    it('should format entry as pretty text', () => {
      const result = formatPretty(mockEntry);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should include timestamp when enabled', () => {
      const result = formatPretty(mockEntry, undefined, { timestamp: true });
      expect(result).toContain('[');
      expect(result).toContain(']');
    });

    it('should exclude timestamp when disabled', () => {
      const result = formatPretty({ ...mockEntry, time: 0 }, undefined, { timestamp: false });
      expect(typeof result).toBe('string');
    });

    it('should include source location', () => {
      const entry: LogEntry = {
        ...mockEntry,
        file: 'app.ts',
        line: 42,
      };
      const result = formatPretty(entry, undefined, { source: true });
      expect(result).toContain('app.ts:42');
    });

    it('should handle entry without file location', () => {
      const result = formatPretty(mockEntry, undefined, { source: true });
      expect(typeof result).toBe('string');
    });

    it('should include extra fields', () => {
      const entry: LogEntry = {
        ...mockEntry,
        userId: 123,
        action: 'login',
      };
      const result = formatPretty(entry);
      expect(result).toContain('userId');
    });

    it('should include error stack', () => {
      const entry: LogEntry = {
        ...mockEntry,
        err: {
          name: 'Error',
          message: 'Test error',
          stack: 'Error: Test error\n    at test.ts:1:1',
        },
      };
      const result = formatPretty(entry);
      expect(result).toContain('Error: Test error');
    });

    it('should handle pigment functions', () => {
      const mockPigment = {
        gray: (s: string) => `[gray]${s}[/gray]`,
        dim: (s: string) => `[dim]${s}[/dim]`,
        blue: (s: string) => `[blue]${s}[/blue]`,
        red: (s: string) => `[red]${s}[/red]`,
      };

      const result = formatPretty(mockEntry, mockPigment as any, { timestamp: true });
      expect(result).toContain('[gray]');
    });

    it('should handle unknown level color', () => {
      const entry: LogEntry = {
        level: 25,
        levelName: 'custom' as any,
        time: 1705294800000,
        msg: 'test',
      };
      const result = formatPretty(entry);
      expect(result).toContain('CUSTOM');
    });

    it('should handle missing pigment color function', () => {
      const mockPigment = {
        gray: (s: string) => s,
        dim: (s: string) => s,
        // Missing 'blue' function
      };

      const result = formatPretty(mockEntry, mockPigment as any);
      expect(typeof result).toBe('string');
    });
  });

  describe('safeStringify', () => {
    it('should stringify objects safely', () => {
      const result = safeStringify({ name: 'test' });
      expect(result).toContain('name');
      expect(result).toContain('test');
    });

    it('should handle circular references', () => {
      const obj: Record<string, unknown> = { name: 'test' };
      obj.self = obj;
      const result = safeStringify(obj);
      expect(result).toContain('[Circular]');
    });

    it('should support indentation', () => {
      const result = safeStringify({ name: 'test' }, 2);
      expect(result).toContain('\n');
    });

    it('should handle nested circular references', () => {
      const obj: Record<string, unknown> = { name: 'test', nested: {} };
      (obj.nested as Record<string, unknown>).parent = obj;
      const result = safeStringify(obj);
      expect(result).toContain('[Circular]');
    });

    it('should handle BigInt in safe stringify', () => {
      const obj = { big: BigInt(12345) };
      const result = safeStringify(obj);
      expect(result).toContain('12345');
    });
  });

  describe('formatTime', () => {
    it('should format timestamp', () => {
      const result = formatTime(1705294800000);
      expect(typeof result).toBe('string');
      expect(result).toMatch(/^\d{2}:\d{2}:\d{2}$/);
    });

    it('should handle current time', () => {
      const result = formatTime(Date.now());
      expect(result).toMatch(/^\d{2}:\d{2}:\d{2}$/);
    });
  });

  describe('formatIso', () => {
    it('should format timestamp as ISO string', () => {
      const result = formatIso(1705294800000);
      expect(result).toContain('2024-01-15');
    });

    it('should be a valid ISO string', () => {
      const result = formatIso(Date.now());
      expect(new Date(result).toISOString()).toBe(result);
    });
  });

  describe('formatDuration', () => {
    it('should format duration in ms', () => {
      expect(formatDuration(100)).toBe('100ms');
      expect(formatDuration(999)).toBe('999ms');
    });

    it('should format duration in seconds', () => {
      expect(formatDuration(1500)).toContain('s');
      expect(formatDuration(59999)).toContain('s');
    });

    it('should format duration in minutes', () => {
      const result = formatDuration(90000);
      expect(result).toContain('m');
      expect(result).toContain('s');
    });
  });

  describe('formatBytes', () => {
    it('should format bytes', () => {
      expect(formatBytes(500)).toContain('B');
    });

    it('should format kilobytes', () => {
      expect(formatBytes(1500)).toContain('KB');
    });

    it('should format megabytes', () => {
      expect(formatBytes(1500000)).toContain('MB');
    });

    it('should format gigabytes', () => {
      expect(formatBytes(1500000000)).toContain('GB');
    });

    it('should format terabytes', () => {
      expect(formatBytes(1500000000000)).toContain('TB');
    });

    it('should handle zero bytes', () => {
      expect(formatBytes(0)).toBe('0 B');
    });
  });

  describe('truncate', () => {
    it('should truncate long strings', () => {
      const long = 'a'.repeat(100);
      const result = truncate(long, 10);
      expect(result.length).toBe(10);
      expect(result.endsWith('...')).toBe(true);
    });

    it('should not truncate short strings', () => {
      const short = 'hello';
      expect(truncate(short, 10)).toBe('hello');
    });

    it('should use custom suffix', () => {
      const long = 'a'.repeat(100);
      const result = truncate(long, 10, '…');
      expect(result.endsWith('…')).toBe(true);
    });

    it('should handle exact length', () => {
      const str = 'hello';
      expect(truncate(str, 5)).toBe('hello');
    });
  });

  describe('indent', () => {
    it('should indent text', () => {
      const result = indent('line1\nline2', 2);
      expect(result).toBe('  line1\n  line2');
    });

    it('should use default 2 spaces', () => {
      const result = indent('test');
      expect(result).toBe('  test');
    });

    it('should handle custom indentation', () => {
      const result = indent('test', 4);
      expect(result).toBe('    test');
    });

    it('should handle empty string', () => {
      const result = indent('');
      expect(result).toBe('  ');
    });

    it('should handle single line', () => {
      const result = indent('single line', 3);
      expect(result).toBe('   single line');
    });
  });
});
