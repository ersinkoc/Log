import { describe, it, expect, vi } from 'vitest';
import { createLogger } from '../../src/index.js';

describe('Package Smoke Tests', () => {
  it('should create logger', () => {
    const log = createLogger();
    expect(log).toBeDefined();
    expect(log.getLevel()).toBe('info');
  });

  it('should log messages', () => {
    const log = createLogger();
    const stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);

    log.info('test message');

    expect(stdoutSpy).toHaveBeenCalled();

    stdoutSpy.mockRestore();
  });

  it('should support log levels', () => {
    const log = createLogger({ level: 'debug' });
    expect(log.isLevelEnabled('debug')).toBe(true);
    expect(log.isLevelEnabled('trace')).toBe(false);
  });

  it('should create child loggers', () => {
    const log = createLogger();
    const child = log.child({ module: 'test' });
    expect(child).toBeDefined();
  });
});
