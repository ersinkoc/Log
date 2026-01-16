import { describe, it, expect } from 'vitest';
import { redactPlugin, redactEntry } from '../../../src/plugins/optional/redact.js';
import { redactFields, isSensitive, createRedactor, autoRedact } from '../../../src/utils/redact.js';
import type { LogContext, LogEntry } from '../../../src/types.js';

describe('redactPlugin', () => {
  it('should create a plugin with correct metadata', () => {
    const plugin = redactPlugin();
    expect(plugin.name).toBe('redact');
    expect(plugin.version).toBe('1.0.0');
  });

  it('should install without error', () => {
    const plugin = redactPlugin();
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

  it('should accept paths option', () => {
    expect(() => redactPlugin({ paths: ['password', 'secret'] })).not.toThrow();
  });

  it('should accept placeholder option', () => {
    expect(() => redactPlugin({ placeholder: '[HIDDEN]' })).not.toThrow();
  });

  it('should store redact paths in context', () => {
    const plugin = redactPlugin({ paths: ['password', 'token'] });
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
    expect(ctx.redactPaths).toEqual(['password', 'token']);
  });

  it('should use existing redact paths from context', () => {
    const plugin = redactPlugin();
    const ctx: LogContext = { redactPaths: ['existingPath'] } as LogContext;
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
    expect(ctx.redactPaths).toEqual(['existingPath']);
  });

  it('should expose redact function on kernel', () => {
    const plugin = redactPlugin({ paths: ['password'] });
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
    expect(mockKernel.redact).toBeDefined();
    expect(typeof mockKernel.redact).toBe('function');
  });

  it('should redact entries via kernel.redact', () => {
    const plugin = redactPlugin({ paths: ['password'] });
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

    const entry: LogEntry = {
      level: 30,
      levelName: 'info',
      time: Date.now(),
      msg: 'test',
      password: 'secret123',
    };

    const redacted = mockKernel.redact(entry);
    expect(redacted.password).toBe('[REDACTED]');
  });
});

describe('redactEntry', () => {
  it('should redact specified fields', () => {
    const entry: LogEntry = {
      level: 30,
      levelName: 'info',
      time: Date.now(),
      msg: 'test',
      password: 'secret',
      username: 'john',
    };

    const result = redactEntry(entry, ['password']);
    expect(result.password).toBe('[REDACTED]');
    expect(result.username).toBe('john');
  });

  it('should return entry unchanged when paths is empty', () => {
    const entry: LogEntry = {
      level: 30,
      levelName: 'info',
      time: Date.now(),
      msg: 'test',
      password: 'secret',
    };

    const result = redactEntry(entry, []);
    expect(result.password).toBe('secret');
    expect(result).toEqual(entry);
  });

  it('should use custom placeholder', () => {
    const entry: LogEntry = {
      level: 30,
      levelName: 'info',
      time: Date.now(),
      msg: 'test',
      password: 'secret',
    };

    const result = redactEntry(entry, ['password'], '[HIDDEN]');
    expect(result.password).toBe('[HIDDEN]');
  });

  it('should handle nested fields', () => {
    const entry: LogEntry = {
      level: 30,
      levelName: 'info',
      time: Date.now(),
      msg: 'test',
      user: {
        password: 'secret',
        name: 'john',
      },
    };

    const result = redactEntry(entry, ['user.password']);
    expect((result.user as any).password).toBe('[REDACTED]');
    expect((result.user as any).name).toBe('john');
  });
});

describe('redactFields', () => {
  it('should redact specified fields', () => {
    const obj = { password: 'secret', username: 'john' };
    const result = redactFields(obj, ['password']);
    expect(result.password).toBe('[REDACTED]');
    expect(result.username).toBe('john');
  });

  it('should handle nested fields with dot notation', () => {
    const obj = { user: { password: 'secret', name: 'john' } };
    const result = redactFields(obj, ['user.password']);
    expect(result.user.password).toBe('[REDACTED]');
    expect(result.user.name).toBe('john');
  });

  it('should handle empty fields list', () => {
    const obj = { password: 'secret' };
    const result = redactFields(obj, []);
    expect(result.password).toBe('secret');
  });

  it('should use custom replacement', () => {
    const obj = { password: 'secret' };
    const result = redactFields(obj, ['password'], '***');
    expect(result.password).toBe('***');
  });

  it('should handle non-object values', () => {
    expect(redactFields(null as any, ['password'])).toBe(null);
    expect(redactFields(undefined as any, ['password'])).toBe(undefined);
  });

  it('should handle missing paths gracefully', () => {
    const obj = { username: 'john' };
    const result = redactFields(obj, ['password']);
    expect(result.username).toBe('john');
    expect(result.password).toBeUndefined();
  });
});

describe('isSensitive', () => {
  const patterns = ['password', 'secret', 'token'];

  it('should detect password fields', () => {
    expect(isSensitive('password', patterns)).toBe(true);
    expect(isSensitive('userPassword', patterns)).toBe(true);
  });

  it('should detect secret fields', () => {
    expect(isSensitive('secret', patterns)).toBe(true);
    expect(isSensitive('clientSecret', patterns)).toBe(true);
  });

  it('should detect token fields', () => {
    expect(isSensitive('token', patterns)).toBe(true);
    expect(isSensitive('accessToken', patterns)).toBe(true);
  });

  it('should not flag regular fields', () => {
    expect(isSensitive('username', patterns)).toBe(false);
    expect(isSensitive('email', patterns)).toBe(false);
  });

  it('should be case insensitive', () => {
    expect(isSensitive('PASSWORD', patterns)).toBe(true);
    expect(isSensitive('Secret', patterns)).toBe(true);
    expect(isSensitive('TOKEN', patterns)).toBe(true);
  });

  it('should handle regex patterns', () => {
    const regexPatterns = ['/api.*/'];
    expect(isSensitive('apiKey', regexPatterns)).toBe(true);
    expect(isSensitive('apiSecret', regexPatterns)).toBe(true);
    expect(isSensitive('username', regexPatterns)).toBe(false);
  });

  it('should handle invalid regex gracefully', () => {
    const invalidPatterns = ['/[invalid/'];
    expect(isSensitive('test', invalidPatterns)).toBe(false);
  });
});

describe('createRedactor', () => {
  it('should create a redactor function', () => {
    const redact = createRedactor(['password']);
    expect(typeof redact).toBe('function');
  });

  it('should redact using the redactor', () => {
    const redact = createRedactor(['password']);
    const obj = { password: 'secret' };
    const result = redact(obj);
    expect(result.password).toBe('[REDACTED]');
  });

  it('should use custom placeholder', () => {
    const redact = createRedactor(['password'], '[HIDDEN]');
    const obj = { password: 'secret' };
    const result = redact(obj);
    expect(result.password).toBe('[HIDDEN]');
  });
});

describe('autoRedact', () => {
  it('should automatically detect and redact sensitive fields', () => {
    const obj = { password: 'secret', username: 'john' };
    const result = autoRedact(obj);
    expect(result.password).toBe('[REDACTED]');
    expect(result.username).toBe('john');
  });

  it('should detect common sensitive patterns', () => {
    const obj = { apiKey: '123', token: 'abc', email: 'test@example.com' };
    const result = autoRedact(obj);
    expect(result.apiKey).toBe('[REDACTED]');
    expect(result.token).toBe('[REDACTED]');
    expect(result.email).toBe('test@example.com');
  });

  it('should handle nested objects', () => {
    const obj = { user: { password: 'secret', name: 'john' } };
    const result = autoRedact(obj);
    expect((result.user as any).password).toBe('[REDACTED]');
    expect((result.user as any).name).toBe('john');
  });

  it('should handle arrays of objects', () => {
    const obj = { users: [{ password: 'secret1' }, { password: 'secret2' }] };
    const result = autoRedact(obj);
    expect((result.users as any)[0].password).toBe('[REDACTED]');
    expect((result.users as any)[1].password).toBe('[REDACTED]');
  });

  it('should handle non-object values', () => {
    expect(autoRedact(null as any)).toBe(null);
    expect(autoRedact(undefined as any)).toBe(undefined);
  });

  it('should accept additional patterns', () => {
    const obj = { customField: 'value' };
    const result = autoRedact(obj, ['customField']);
    expect(result.customField).toBe('[REDACTED]');
  });

  it('should use custom placeholder', () => {
    const obj = { password: 'secret' };
    const result = autoRedact(obj, [], '***');
    expect(result.password).toBe('***');
  });
});
