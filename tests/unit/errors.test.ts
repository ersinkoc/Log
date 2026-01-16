import { describe, it, expect } from 'vitest';
import {
  LogError,
  PluginError,
  TransportError,
  ConfigError,
  SerializationError,
  EnvironmentError,
  BufferError,
  ensureError,
  wrapError,
} from '../../src/errors.js';

describe('LogError', () => {
  it('should create error with correct name', () => {
    const error = new LogError('test message', 'TEST_CODE');
    expect(error.name).toBe('LogError');
    expect(error.message).toBe('test message');
    expect(error.code).toBe('TEST_CODE');
  });

  it('should be instanceof Error', () => {
    const error = new LogError('test', 'CODE');
    expect(error).toBeInstanceOf(Error);
  });

  it('should include cause when provided', () => {
    const cause = new Error('original error');
    const error = new LogError('wrapped', 'CODE', cause);
    expect(error.cause).toBe(cause);
  });

  it('should have proper stack trace', () => {
    const error = new LogError('test', 'CODE');
    expect(error.stack).toBeDefined();
    expect(error.stack).toContain('LogError');
  });
});

describe('PluginError', () => {
  it('should create error with correct name', () => {
    const error = new PluginError('plugin failed', 'test-plugin');
    expect(error.name).toBe('PluginError');
    expect(error.message).toContain('plugin failed');
    expect(error.pluginName).toBe('test-plugin');
    expect(error.code).toBe('PLUGIN_ERROR');
  });

  it('should be instanceof LogError', () => {
    const error = new PluginError('test', 'test-plugin');
    expect(error).toBeInstanceOf(LogError);
  });

  it('should format message with plugin name', () => {
    const error = new PluginError('init failed', 'my-plugin');
    expect(error.message).toBe('[Plugin: my-plugin] init failed');
  });

  it('should include cause when provided', () => {
    const cause = new Error('original');
    const error = new PluginError('wrapped', 'plugin', cause);
    expect(error.cause).toBe(cause);
  });
});

describe('TransportError', () => {
  it('should create error with correct name', () => {
    const error = new TransportError('transport failed', 'test-transport');
    expect(error.name).toBe('TransportError');
    expect(error.message).toContain('transport failed');
    expect(error.transportName).toBe('test-transport');
    expect(error.code).toBe('TRANSPORT_ERROR');
  });

  it('should be instanceof LogError', () => {
    const error = new TransportError('test', 'test-transport');
    expect(error).toBeInstanceOf(LogError);
  });

  it('should format message with transport name', () => {
    const error = new TransportError('write failed', 'file');
    expect(error.message).toBe('[Transport: file] write failed');
  });
});

describe('ConfigError', () => {
  it('should create error with correct name', () => {
    const error = new ConfigError('invalid config');
    expect(error.name).toBe('ConfigError');
    expect(error.message).toBe('invalid config');
    expect(error.code).toBe('CONFIG_ERROR');
  });

  it('should include option when provided', () => {
    const error = new ConfigError('invalid value', 'level');
    expect(error.option).toBe('level');
  });

  it('should be instanceof LogError', () => {
    const error = new ConfigError('test');
    expect(error).toBeInstanceOf(LogError);
  });

  it('should include cause when provided', () => {
    const cause = new Error('original');
    const error = new ConfigError('wrapped', 'option', cause);
    expect(error.cause).toBe(cause);
  });
});

describe('SerializationError', () => {
  it('should create error with correct name', () => {
    const error = new SerializationError('circular reference');
    expect(error.name).toBe('SerializationError');
    expect(error.message).toBe('circular reference');
    expect(error.code).toBe('SERIALIZATION_ERROR');
  });

  it('should be instanceof LogError', () => {
    const error = new SerializationError('test');
    expect(error).toBeInstanceOf(LogError);
  });

  it('should include cause when provided', () => {
    const cause = new Error('original');
    const error = new SerializationError('wrapped', cause);
    expect(error.cause).toBe(cause);
  });
});

describe('EnvironmentError', () => {
  it('should create error with correct name', () => {
    const error = new EnvironmentError('not available', 'browser');
    expect(error.name).toBe('EnvironmentError');
    expect(error.message).toBe('not available');
    expect(error.code).toBe('ENVIRONMENT_ERROR');
    expect(error.requiredEnv).toBe('browser');
  });

  it('should be instanceof LogError', () => {
    const error = new EnvironmentError('test', 'node');
    expect(error).toBeInstanceOf(LogError);
  });

  it('should work with node environment', () => {
    const error = new EnvironmentError('file transport requires node', 'node');
    expect(error.requiredEnv).toBe('node');
  });
});

describe('BufferError', () => {
  it('should create error with correct name', () => {
    const error = new BufferError('buffer overflow');
    expect(error.name).toBe('BufferError');
    expect(error.message).toBe('buffer overflow');
    expect(error.code).toBe('BUFFER_ERROR');
  });

  it('should be instanceof LogError', () => {
    const error = new BufferError('test');
    expect(error).toBeInstanceOf(LogError);
  });

  it('should include cause when provided', () => {
    const cause = new Error('original');
    const error = new BufferError('wrapped', cause);
    expect(error.cause).toBe(cause);
  });
});

describe('ensureError', () => {
  it('should return Error as-is', () => {
    const error = new Error('test');
    expect(ensureError(error)).toBe(error);
  });

  it('should convert string to Error', () => {
    const result = ensureError('string error');
    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe('string error');
  });

  it('should convert object with message to Error', () => {
    const result = ensureError({ message: 'object error' });
    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe('object error');
  });

  it('should convert object with message and name to Error', () => {
    const result = ensureError({ message: 'custom error', name: 'CustomError' });
    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe('custom error');
    expect(result.name).toBe('CustomError');
  });

  it('should convert other values to Error via String()', () => {
    expect(ensureError(123).message).toBe('123');
    expect(ensureError(null).message).toBe('null');
    expect(ensureError(undefined).message).toBe('undefined');
    expect(ensureError({ foo: 'bar' }).message).toBe('[object Object]');
  });
});

describe('wrapError', () => {
  it('should wrap Error with message', () => {
    const cause = new Error('original');
    const wrapped = wrapError(cause, 'Context');
    expect(wrapped).toBeInstanceOf(LogError);
    expect(wrapped.message).toBe('Context: original');
    expect(wrapped.cause).toBe(cause);
    expect(wrapped.code).toBe('WRAPPED_ERROR');
  });

  it('should wrap string error', () => {
    const wrapped = wrapError('string error', 'Context');
    expect(wrapped.message).toBe('Context: string error');
  });

  it('should wrap object with message', () => {
    const wrapped = wrapError({ message: 'object error' }, 'Context');
    expect(wrapped.message).toBe('Context: object error');
  });
});
