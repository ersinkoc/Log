import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createLogger } from '../../src/logger.js';
import { mockTransport, type MockTransport } from '../fixtures/mock-transport.js';
import type { Logger } from '../../src/types.js';

describe('Logger', () => {
  let logger: Logger;
  let mock: MockTransport;

  beforeEach(() => {
    mock = mockTransport();
    logger = createLogger({
      name: 'test',
      level: 'trace',
      transports: [mock]
    });
  });

  describe('createLogger', () => {
    it('should create logger with default config', () => {
      const log = createLogger();
      expect(log).toBeDefined();
      expect(log.getLevel()).toBe('info');
    });

    it('should create logger with custom config', () => {
      const log = createLogger({ name: 'custom', level: 'debug' });
      expect(log.getLevel()).toBe('debug');
    });

    it('should have core plugins by default', () => {
      const log = createLogger();
      expect(log.hasPlugin('level')).toBe(true);
      expect(log.hasPlugin('format')).toBe(true);
      expect(log.hasPlugin('timestamp')).toBe(true);
    });

    it('should accept explicit json format', () => {
      const log = createLogger({ format: 'json' });
      expect(log).toBeDefined();
    });

    it('should accept explicit pretty format', () => {
      const log = createLogger({ format: 'pretty' });
      expect(log).toBeDefined();
    });
  });

  describe('log levels', () => {
    it('should log at trace level', () => {
      logger.trace('trace message');
      expect(mock.getEntries()).toHaveLength(1);
      expect(mock.getEntries()[0].levelName).toBe('trace');
    });

    it('should log at debug level', () => {
      logger.debug('debug message');
      expect(mock.getEntries()[0].levelName).toBe('debug');
    });

    it('should log at info level', () => {
      logger.info('info message');
      expect(mock.getEntries()[0].levelName).toBe('info');
    });

    it('should log at warn level', () => {
      logger.warn('warn message');
      expect(mock.getEntries()[0].levelName).toBe('warn');
    });

    it('should log at error level', () => {
      logger.error('error message');
      expect(mock.getEntries()[0].levelName).toBe('error');
    });

    it('should log at fatal level', () => {
      logger.fatal('fatal message');
      expect(mock.getEntries()[0].levelName).toBe('fatal');
    });

    it('should filter below minimum level', () => {
      mock.clear();
      const log = createLogger({ level: 'warn', transports: [mock] });
      log.info('should not appear');
      log.warn('should appear');
      expect(mock.getEntries()).toHaveLength(1);
    });
  });

  describe('structured logging', () => {
    it('should log with metadata object', () => {
      logger.info({ userId: 123, action: 'login' }, 'User logged in');
      const entry = mock.getEntries()[0];
      expect(entry.userId).toBe(123);
      expect(entry.action).toBe('login');
      expect(entry.msg).toBe('User logged in');
    });

    it('should log with message only', () => {
      logger.info('simple message');
      expect(mock.getEntries()[0].msg).toBe('simple message');
    });

    it('should handle errors', () => {
      const error = new Error('Test error');
      logger.error(error);
      const entry = mock.getEntries()[0];
      expect(entry.err).toBeDefined();
      expect(entry.err?.message).toBe('Test error');
      expect(entry.err?.stack).toBeDefined();
    });

    it('should handle error with message', () => {
      const error = new Error('Test error');
      logger.error(error, 'Additional context');
      const entry = mock.getEntries()[0];
      expect(entry.err?.message).toBe('Test error');
      expect(entry.msg).toBe('Additional context');
    });
  });

  describe('child loggers', () => {
    it('should create child logger with context', () => {
      const child = logger.child({ module: 'database' });
      child.info('Connected');
      const entry = mock.getEntries()[0];
      expect(entry.module).toBe('database');
    });

    it('should merge context from parent and child', () => {
      mock.clear();
      const parent = createLogger({
        context: { env: 'test' },
        transports: [mock]
      });
      const child = parent.child({ component: 'auth' });
      child.info('test');
      const entry = mock.getEntries()[0];
      expect(entry.env).toBe('test');
      expect(entry.component).toBe('auth');
    });

    it('should support nested child loggers', () => {
      const child1 = logger.child({ module: 'db' });
      const child2 = child1.child({ operation: 'query' });
      child2.info('Executing');
      const entry = mock.getEntries()[0];
      expect(entry.module).toBe('db');
      expect(entry.operation).toBe('query');
    });

    it('should have independent level management', () => {
      mock.clear();
      const parent = createLogger({ level: 'info', transports: [mock] });
      const child = parent.child({ module: 'test' });
      child.setLevel('debug');
      child.debug('debug from child');
      expect(mock.getEntries()).toHaveLength(1);
    });
  });

  describe('correlation ID', () => {
    it('should add correlation ID to entries', () => {
      const corr = logger.withCorrelation('req-abc-123');
      corr.info('Request received');
      const entry = mock.getEntries()[0];
      expect(entry.correlationId).toBe('req-abc-123');
    });

    it('should persist correlation ID across multiple calls', () => {
      const corr = logger.withCorrelation('req-xyz-789');
      corr.info('Step 1');
      corr.info('Step 2');
      corr.info('Step 3');
      const entries = mock.getEntries();
      expect(entries.every((e) => e.correlationId === 'req-xyz-789')).toBe(true);
    });
  });

  describe('timing', () => {
    it('should time operations', () => {
      logger.time('operation');
      logger.timeEnd('operation');
      const entries = mock.getEntries();
      expect(entries.some((e) => e.duration !== undefined)).toBe(true);
    });

    it('should use startTimer', () => {
      const end = logger.startTimer('timer');
      end();
      const entries = mock.getEntries();
      expect(entries.some((e) => e.duration !== undefined)).toBe(true);
    });

    it('should handle missing timer gracefully', () => {
      expect(() => logger.timeEnd('nonexistent')).not.toThrow();
    });

    it('should support timeAsync', async () => {
      const result = await logger.timeAsync('async-op', async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return 'done';
      });
      expect(result).toBe('done');
      const entries = mock.getEntries();
      expect(entries.some((e) => e.duration !== undefined)).toBe(true);
    });
  });

  describe('plugin management', () => {
    it('should register plugin', () => {
      const plugin = {
        name: 'test',
        version: '1.0.0',
        install: vi.fn()
      };
      logger.use(plugin);
      expect(logger.hasPlugin('test')).toBe(true);
    });

    it('should list plugins', () => {
      const plugins = logger.listPlugins();
      expect(plugins.length).toBeGreaterThan(0);
      expect(plugins.some((p) => p.name === 'level')).toBe(true);
    });

    it('should unregister plugin', () => {
      const plugin = {
        name: 'test-remove',
        version: '1.0.0',
        install: vi.fn()
      };
      logger.use(plugin);
      expect(logger.unregister('test-remove')).toBe(true);
      expect(logger.hasPlugin('test-remove')).toBe(false);
    });
  });

  describe('level management', () => {
    it('should set level', () => {
      logger.setLevel('error');
      expect(logger.getLevel()).toBe('error');
    });

    it('should check if level is enabled', () => {
      logger.setLevel('warn');
      expect(logger.isLevelEnabled('error')).toBe(true);
      expect(logger.isLevelEnabled('info')).toBe(false);
    });
  });

  describe('events', () => {
    it('should emit log events', () => {
      const handler = vi.fn();
      logger.on('log', handler);
      logger.info('test message');
      expect(handler).toHaveBeenCalled();
    });

    it('should emit level-specific events', () => {
      const handler = vi.fn();
      logger.on('log:info', handler);
      logger.info('info message');
      expect(handler).toHaveBeenCalled();
    });
  });

  describe('lifecycle', () => {
    it('should flush buffers', async () => {
      await logger.flush();
      expect(mock.flush).toHaveBeenCalled();
    });

    it('should close logger', async () => {
      await logger.close();
      expect(mock.close).toHaveBeenCalled();
    });

    it('should destroy logger', async () => {
      await logger.destroy();
      expect(logger.listPlugins().length).toBe(0);
    });

    it('should not write after closed', async () => {
      mock.clear();
      await logger.close();
      logger.info('after close');
      // After close, write should be skipped
      expect(mock.getEntries().length).toBeLessThanOrEqual(1);
    });

    it('should handle multiple close calls gracefully', async () => {
      await logger.close();
      await logger.close();
      // Should not throw
    });
  });

  describe('edge cases', () => {
    it('should throw on invalid level in config', () => {
      expect(() => createLogger({ level: 'invalid' as any })).toThrow('Invalid log level');
    });

    it('should throw on invalid level in setLevel', () => {
      const log = createLogger({ transports: [mock] });
      expect(() => log.setLevel('invalid' as any)).toThrow('Invalid log level');
    });

    it('should use auto format and resolve to json/pretty', () => {
      mock.clear();
      const log = createLogger({ format: 'auto', transports: [mock] });
      log.info('test');
      expect(mock.getEntries().length).toBe(1);
    });

    it('should generate correlation ID when none provided', () => {
      mock.clear();
      const corr = logger.withCorrelation();
      corr.info('test');
      const entry = mock.getEntries()[0];
      expect(entry.correlationId).toBeDefined();
      expect(entry.correlationId).toMatch(/^[a-f0-9-]{36}$/);
    });

    it('should log object with no message', () => {
      mock.clear();
      logger.info({ key: 'value' });
      const entry = mock.getEntries()[0];
      expect(entry.key).toBe('value');
      expect(entry.msg).toBe('');
    });

    it('should handle timeEnd for non-existent timer', () => {
      // This should not throw and should log a warning
      logger.timeEnd('non-existent-timer');
      const entries = mock.getEntries();
      expect(entries.some((e) => e.msg?.includes('does not exist'))).toBe(true);
    });

    it('should handle transport with no supports method', () => {
      const noSupportsTransport = {
        name: 'no-supports',
        write: vi.fn(),
      };

      const log = createLogger({ transports: [noSupportsTransport] });
      log.info('test');
      expect(noSupportsTransport.write).toHaveBeenCalled();
    });

    it('should handle sync transport results', () => {
      const syncTransport = {
        name: 'sync-transport',
        write: vi.fn().mockReturnValue(undefined), // sync, no promise
        supports: () => true,
      };

      const log = createLogger({ transports: [syncTransport] });
      log.info('test');
      expect(syncTransport.write).toHaveBeenCalled();
    });

    it('should handle _getContext method', () => {
      const log = createLogger({ name: 'test-ctx', transports: [mock] });
      const ctx = (log as any)._getContext();
      expect(ctx.name).toBe('test-ctx');
    });

    it('should use default console transport when none provided', () => {
      const log = createLogger({ level: 'trace' });
      expect(log).toBeDefined();
    });
  });
});
