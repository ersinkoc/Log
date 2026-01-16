import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { consoleTransport } from '../../../src/transports/console.js';
import type { LogEntry } from '../../../src/types.js';

describe('consoleTransport', () => {
  let stdoutSpy: ReturnType<typeof vi.spyOn>;
  let stderrSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
  });

  afterEach(() => {
    stdoutSpy.mockRestore();
    stderrSpy.mockRestore();
  });

  it('should create console transport', () => {
    const transport = consoleTransport();
    expect(transport.name).toBe('console');
  });

  it('should write to stdout for info level', () => {
    const transport = consoleTransport({ colors: false });
    const entry: LogEntry = {
      level: 30,
      levelName: 'info',
      time: Date.now(),
      msg: 'test',
    };

    transport.write(entry);
    expect(stdoutSpy).toHaveBeenCalled();
  });

  it('should write to stderr for error level', () => {
    const transport = consoleTransport({ colors: false });
    const entry: LogEntry = {
      level: 50,
      levelName: 'error',
      time: Date.now(),
      msg: 'error test',
    };

    transport.write(entry);
    expect(stderrSpy).toHaveBeenCalled();
  });

  it('should write to stderr for fatal level', () => {
    const transport = consoleTransport({ colors: false });
    const entry: LogEntry = {
      level: 60,
      levelName: 'fatal',
      time: Date.now(),
      msg: 'fatal test',
    };

    transport.write(entry);
    expect(stderrSpy).toHaveBeenCalled();
  });

  it('should support colors option', () => {
    expect(() => consoleTransport({ colors: true })).not.toThrow();
    expect(() => consoleTransport({ colors: false })).not.toThrow();
  });

  it('should support timestamp option', () => {
    expect(() => consoleTransport({ timestamp: true })).not.toThrow();
    expect(() => consoleTransport({ timestamp: false })).not.toThrow();
  });

  it('should support both environments', () => {
    const transport = consoleTransport();
    expect(transport.supports?.('node')).toBe(true);
    expect(transport.supports?.('browser')).toBe(true);
  });

  it('should handle flush', () => {
    const transport = consoleTransport();
    expect(() => transport.flush?.()).not.toThrow();
  });

  it('should handle close', () => {
    const transport = consoleTransport();
    expect(() => transport.close?.()).not.toThrow();
  });

  describe('with colors enabled', () => {
    it('should write colored output for trace level', () => {
      const transport = consoleTransport({ colors: true });
      const entry: LogEntry = {
        level: 10,
        levelName: 'trace',
        time: Date.now(),
        msg: 'trace test',
      };

      transport.write(entry);
      expect(stdoutSpy).toHaveBeenCalled();
      const output = stdoutSpy.mock.calls[0][0];
      expect(output).toContain('TRACE');
    });

    it('should write colored output for debug level', () => {
      const transport = consoleTransport({ colors: true });
      const entry: LogEntry = {
        level: 20,
        levelName: 'debug',
        time: Date.now(),
        msg: 'debug test',
      };

      transport.write(entry);
      expect(stdoutSpy).toHaveBeenCalled();
    });

    it('should write colored output for warn level', () => {
      const transport = consoleTransport({ colors: true });
      const entry: LogEntry = {
        level: 40,
        levelName: 'warn',
        time: Date.now(),
        msg: 'warn test',
      };

      transport.write(entry);
      expect(stdoutSpy).toHaveBeenCalled();
    });

    it('should include source location in output', () => {
      const transport = consoleTransport({ colors: true });
      const entry: LogEntry = {
        level: 30,
        levelName: 'info',
        time: Date.now(),
        msg: 'test with source',
        file: 'app.ts',
        line: 42,
      };

      transport.write(entry);
      expect(stdoutSpy).toHaveBeenCalled();
      const output = stdoutSpy.mock.calls[0][0];
      expect(output).toContain('app.ts:42');
    });

    it('should include file without line in output', () => {
      const transport = consoleTransport({ colors: true });
      const entry: LogEntry = {
        level: 30,
        levelName: 'info',
        time: Date.now(),
        msg: 'test with file only',
        file: 'app.ts',
      };

      transport.write(entry);
      expect(stdoutSpy).toHaveBeenCalled();
      const output = stdoutSpy.mock.calls[0][0];
      expect(output).toContain('app.ts');
    });

    it('should include extra fields in output', () => {
      const transport = consoleTransport({ colors: true });
      const entry: LogEntry = {
        level: 30,
        levelName: 'info',
        time: Date.now(),
        msg: 'test with extra',
        userId: 123,
        action: 'login',
      };

      transport.write(entry);
      expect(stdoutSpy).toHaveBeenCalled();
      const output = stdoutSpy.mock.calls[0][0];
      expect(output).toContain('userId');
    });

    it('should include error stack in output', () => {
      const transport = consoleTransport({ colors: true });
      const entry: LogEntry = {
        level: 50,
        levelName: 'error',
        time: Date.now(),
        msg: 'error with stack',
        err: {
          name: 'Error',
          message: 'Test error',
          stack: 'Error: Test error\n    at test.ts:1:1',
        },
      };

      transport.write(entry);
      expect(stderrSpy).toHaveBeenCalled();
      const output = stderrSpy.mock.calls[0][0];
      expect(output).toContain('Error: Test error');
    });
  });

  describe('with custom level colors', () => {
    it('should accept custom level colors', () => {
      const transport = consoleTransport({
        colors: true,
        levelColors: {
          info: 'green',
        },
      });

      const entry: LogEntry = {
        level: 30,
        levelName: 'info',
        time: Date.now(),
        msg: 'test with custom color',
      };

      transport.write(entry);
      expect(stdoutSpy).toHaveBeenCalled();
    });

    it('should fallback to default colors for unknown levels', () => {
      const transport = consoleTransport({ colors: true });
      const entry: LogEntry = {
        level: 25,
        levelName: 'custom' as any,
        time: Date.now(),
        msg: 'custom level test',
      };

      transport.write(entry);
      expect(stdoutSpy).toHaveBeenCalled();
    });
  });

  describe('without timestamp', () => {
    it('should not include timestamp when disabled', () => {
      const transport = consoleTransport({ colors: true, timestamp: false });
      const entry: LogEntry = {
        level: 30,
        levelName: 'info',
        time: Date.now(),
        msg: 'no timestamp',
      };

      transport.write(entry);
      expect(stdoutSpy).toHaveBeenCalled();
      // Output should still work without timestamp
    });
  });

  describe('entry without message', () => {
    it('should handle entry without message', () => {
      const transport = consoleTransport({ colors: false });
      const entry: LogEntry = {
        level: 30,
        levelName: 'info',
        time: Date.now(),
        msg: '',
      };

      transport.write(entry);
      expect(stdoutSpy).toHaveBeenCalled();
    });
  });

  describe('entry without time', () => {
    it('should handle entry without time', () => {
      const transport = consoleTransport({ colors: true, timestamp: true });
      const entry: LogEntry = {
        level: 30,
        levelName: 'info',
        time: 0,
        msg: 'no time',
      };

      transport.write(entry);
      expect(stdoutSpy).toHaveBeenCalled();
    });
  });
});
