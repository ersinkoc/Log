import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { httpTransport } from '../../../src/transports/http.js';
import type { LogEntry } from '../../../src/types.js';

describe('httpTransport', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true } as Response);
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('should create http transport', () => {
    const transport = httpTransport({ url: 'http://example.com/log' });
    expect(transport.name).toBe('http');
  });

  it('should support both environments', () => {
    const transport = httpTransport({ url: 'http://example.com/log' });
    expect(transport.supports?.('node')).toBe(true);
    expect(transport.supports?.('browser')).toBe(true);
  });

  it('should accept batch option', () => {
    expect(() => httpTransport({ url: 'http://example.com/log', batch: 10 })).not.toThrow();
  });

  it('should accept retry option', () => {
    expect(() => httpTransport({ url: 'http://example.com/log', retry: 3 })).not.toThrow();
  });

  it('should accept headers option', () => {
    expect(() => httpTransport({
      url: 'http://example.com/log',
      headers: { 'Authorization': 'Bearer token' }
    })).not.toThrow();
  });

  it('should write entries', async () => {
    const transport = httpTransport({
      url: 'http://example.com/log',
      batch: 1
    });

    const entry: LogEntry = {
      level: 30,
      levelName: 'info',
      time: Date.now(),
      msg: 'test',
    };

    await transport.write(entry);
    expect(global.fetch).toHaveBeenCalled();
  });

  it('should buffer entries when batch > 1', async () => {
    const transport = httpTransport({
      url: 'http://example.com/log',
      batch: 5
    });

    const entry: LogEntry = {
      level: 30,
      levelName: 'info',
      time: Date.now(),
      msg: 'test',
    };

    await transport.write(entry);
    // Should not be called yet because batch is 5
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('should flush pending entries', async () => {
    const transport = httpTransport({
      url: 'http://example.com/log',
      batch: 100
    });

    const entry: LogEntry = {
      level: 30,
      levelName: 'info',
      time: Date.now(),
      msg: 'test',
    };

    await transport.write(entry);
    await transport.flush?.();

    expect(global.fetch).toHaveBeenCalled();
  });
});
