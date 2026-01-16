import { describe, it, expect } from 'vitest';
import {
  LOG_LEVELS,
  LEVEL_NAMES,
  LEVEL_ORDER,
  DEFAULT_NAME,
  DEFAULT_LEVEL,
  DEFAULT_FORMAT,
  DEFAULT_COLORS,
  DEFAULT_TIMESTAMP,
  DEFAULT_SOURCE,
  DEFAULT_SYNC_LEVELS,
  DEFAULT_BUFFER_OPTIONS,
  LEVEL_COLORS,
  LEVEL_LABELS,
  REDACTED_VALUE,
  COMMON_SENSITIVE_FIELDS,
  parseSize,
  parseRotation,
  IS_NODE,
  IS_BROWSER,
  IS_DEV,
  IS_TTY,
} from '../../src/constants.js';
import { LogLevel } from '../../src/types.js';

describe('LOG_LEVELS', () => {
  it('should have correct level values', () => {
    expect(LOG_LEVELS.trace).toBe(LogLevel.Trace);
    expect(LOG_LEVELS.debug).toBe(LogLevel.Debug);
    expect(LOG_LEVELS.info).toBe(LogLevel.Info);
    expect(LOG_LEVELS.warn).toBe(LogLevel.Warn);
    expect(LOG_LEVELS.error).toBe(LogLevel.Error);
    expect(LOG_LEVELS.fatal).toBe(LogLevel.Fatal);
  });
});

describe('LEVEL_NAMES', () => {
  it('should map numeric levels to names', () => {
    expect(LEVEL_NAMES[LogLevel.Trace]).toBe('trace');
    expect(LEVEL_NAMES[LogLevel.Debug]).toBe('debug');
    expect(LEVEL_NAMES[LogLevel.Info]).toBe('info');
    expect(LEVEL_NAMES[LogLevel.Warn]).toBe('warn');
    expect(LEVEL_NAMES[LogLevel.Error]).toBe('error');
    expect(LEVEL_NAMES[LogLevel.Fatal]).toBe('fatal');
  });
});

describe('LEVEL_ORDER', () => {
  it('should have levels in order of severity', () => {
    expect(LEVEL_ORDER).toEqual(['trace', 'debug', 'info', 'warn', 'error', 'fatal']);
  });
});

describe('Default values', () => {
  it('should have correct defaults', () => {
    expect(DEFAULT_NAME).toBe('app');
    expect(DEFAULT_LEVEL).toBe('info');
    expect(DEFAULT_FORMAT).toBe('auto');
    expect(DEFAULT_COLORS).toBe(true);
    expect(DEFAULT_TIMESTAMP).toBe(true);
    expect(DEFAULT_SOURCE).toBe(false);
  });

  it('should have correct sync levels', () => {
    expect(DEFAULT_SYNC_LEVELS.trace).toBe(false);
    expect(DEFAULT_SYNC_LEVELS.debug).toBe(false);
    expect(DEFAULT_SYNC_LEVELS.info).toBe(false);
    expect(DEFAULT_SYNC_LEVELS.warn).toBe(false);
    expect(DEFAULT_SYNC_LEVELS.error).toBe(true);
    expect(DEFAULT_SYNC_LEVELS.fatal).toBe(true);
  });

  it('should have correct buffer options', () => {
    expect(DEFAULT_BUFFER_OPTIONS.size).toBe(100);
    expect(DEFAULT_BUFFER_OPTIONS.flushInterval).toBe(1000);
  });
});

describe('LEVEL_COLORS', () => {
  it('should have colors for all levels', () => {
    expect(LEVEL_COLORS.trace).toBe('gray');
    expect(LEVEL_COLORS.debug).toBe('cyan');
    expect(LEVEL_COLORS.info).toBe('blue');
    expect(LEVEL_COLORS.warn).toBe('yellow');
    expect(LEVEL_COLORS.error).toBe('red');
    expect(LEVEL_COLORS.fatal).toBe('magenta');
  });
});

describe('LEVEL_LABELS', () => {
  it('should have labels for all levels', () => {
    expect(LEVEL_LABELS.trace).toBe('TRACE');
    expect(LEVEL_LABELS.debug).toBe('DEBUG');
    expect(LEVEL_LABELS.info).toBe('INFO ');
    expect(LEVEL_LABELS.warn).toBe('WARN ');
    expect(LEVEL_LABELS.error).toBe('ERROR');
    expect(LEVEL_LABELS.fatal).toBe('FATAL');
  });
});

describe('Redaction constants', () => {
  it('should have correct redacted value', () => {
    expect(REDACTED_VALUE).toBe('[REDACTED]');
  });

  it('should have common sensitive fields', () => {
    expect(COMMON_SENSITIVE_FIELDS).toContain('password');
    expect(COMMON_SENSITIVE_FIELDS).toContain('token');
    expect(COMMON_SENSITIVE_FIELDS).toContain('secret');
    expect(COMMON_SENSITIVE_FIELDS).toContain('apiKey');
  });
});

describe('parseSize', () => {
  it('should parse bytes', () => {
    expect(parseSize('100B')).toBe(100);
    expect(parseSize('100')).toBe(100);
  });

  it('should parse kilobytes', () => {
    expect(parseSize('1KB')).toBe(1024);
    expect(parseSize('10KB')).toBe(10240);
  });

  it('should parse megabytes', () => {
    expect(parseSize('1MB')).toBe(1024 * 1024);
    expect(parseSize('10MB')).toBe(10 * 1024 * 1024);
  });

  it('should parse gigabytes', () => {
    expect(parseSize('1GB')).toBe(1024 * 1024 * 1024);
  });

  it('should parse terabytes', () => {
    expect(parseSize('1TB')).toBe(1024 * 1024 * 1024 * 1024);
  });

  it('should handle decimal values', () => {
    expect(parseSize('1.5MB')).toBe(Math.floor(1.5 * 1024 * 1024));
  });

  it('should be case insensitive', () => {
    expect(parseSize('1mb')).toBe(1024 * 1024);
    expect(parseSize('1Mb')).toBe(1024 * 1024);
  });

  it('should throw on invalid format', () => {
    expect(() => parseSize('invalid')).toThrow('Invalid size format');
    expect(() => parseSize('abc123')).toThrow('Invalid size format');
    expect(() => parseSize('')).toThrow('Invalid size format');
  });
});

describe('parseRotation', () => {
  it('should parse seconds', () => {
    expect(parseRotation('30s')).toBe(30 * 1000);
    expect(parseRotation('60s')).toBe(60 * 1000);
  });

  it('should parse minutes', () => {
    expect(parseRotation('5m')).toBe(5 * 60 * 1000);
    expect(parseRotation('30m')).toBe(30 * 60 * 1000);
  });

  it('should parse hours', () => {
    expect(parseRotation('1h')).toBe(60 * 60 * 1000);
    expect(parseRotation('24h')).toBe(24 * 60 * 60 * 1000);
  });

  it('should parse days', () => {
    expect(parseRotation('1d')).toBe(24 * 60 * 60 * 1000);
    expect(parseRotation('7d')).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it('should parse weeks', () => {
    expect(parseRotation('1w')).toBe(7 * 24 * 60 * 60 * 1000);
    expect(parseRotation('2w')).toBe(2 * 7 * 24 * 60 * 60 * 1000);
  });

  it('should default to seconds when no unit', () => {
    expect(parseRotation('60')).toBe(60 * 1000);
  });

  it('should be case insensitive', () => {
    expect(parseRotation('1H')).toBe(60 * 60 * 1000);
    expect(parseRotation('1D')).toBe(24 * 60 * 60 * 1000);
  });

  it('should throw on invalid format', () => {
    expect(() => parseRotation('invalid')).toThrow('Invalid rotation format');
    expect(() => parseRotation('abc')).toThrow('Invalid rotation format');
    expect(() => parseRotation('')).toThrow('Invalid rotation format');
  });
});

describe('Environment constants', () => {
  it('should detect Node.js environment', () => {
    expect(IS_NODE).toBe(true);
  });

  it('should detect not browser environment', () => {
    expect(IS_BROWSER).toBe(false);
  });

  it('should detect dev mode based on NODE_ENV', () => {
    // In vitest, NODE_ENV is 'test' which is not 'production'
    expect(typeof IS_DEV).toBe('boolean');
  });

  it('should detect TTY status', () => {
    expect(typeof IS_TTY).toBe('boolean');
  });
});

describe('parseSize edge cases', () => {
  it('should handle unit with whitespace', () => {
    expect(parseSize('10 MB')).toBe(10 * 1024 * 1024);
    expect(parseSize('5 KB')).toBe(5 * 1024);
  });

  it('should handle lowercase units', () => {
    expect(parseSize('1tb')).toBe(1024 * 1024 * 1024 * 1024);
    expect(parseSize('1gb')).toBe(1024 * 1024 * 1024);
  });
});

describe('parseRotation edge cases', () => {
  it('should handle uppercase units', () => {
    expect(parseRotation('1W')).toBe(7 * 24 * 60 * 60 * 1000);
    expect(parseRotation('1M')).toBe(60 * 1000);
    expect(parseRotation('1S')).toBe(1000);
  });

  it('should handle just numbers (defaults to seconds)', () => {
    expect(parseRotation('30')).toBe(30 * 1000);
    expect(parseRotation('120')).toBe(120 * 1000);
  });
});
