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

  describe('unserializable entries', () => {
    const makeEntry = (msg: string, extra: Record<string, unknown> = {}): LogEntry => ({
      level: 30,
      levelName: 'info',
      time: Date.now(),
      msg,
      ...extra,
    });

    it('should deliver an entry containing a circular reference', async () => {
      const bodies: unknown[] = [];
      global.fetch = vi.fn().mockImplementation(async (_url: string, init: RequestInit) => {
        bodies.push(JSON.parse(init.body as string));
        return { ok: true, status: 200, statusText: 'OK' } as Response;
      });

      const transport = httpTransport({ url: 'http://example.com/log', batch: 10, interval: 0 });
      const circular = makeEntry('boom');
      circular.context = circular;

      await transport.write(circular);
      await expect(transport.flush?.()).resolves.toBeUndefined();

      expect(bodies).toHaveLength(1);
      expect(JSON.stringify(bodies)).toContain('[Circular]');
    });

    it('should not let one bad entry block later entries', async () => {
      const batches: number[] = [];
      global.fetch = vi.fn().mockImplementation(async (_url: string, init: RequestInit) => {
        batches.push(JSON.parse(init.body as string).length);
        return { ok: true, status: 200, statusText: 'OK' } as Response;
      });

      const transport = httpTransport({ url: 'http://example.com/log', batch: 10, interval: 0 });
      const circular = makeEntry('poison');
      circular.self = circular;

      await transport.write(circular);
      await transport.flush?.().catch(() => undefined);

      for (let i = 0; i < 5; i++) await transport.write(makeEntry(`good ${i}`));
      await transport.flush?.().catch(() => undefined);

      expect(batches.reduce((sum, n) => sum + n, 0)).toBeGreaterThanOrEqual(5);
    });

    it('should deliver an entry containing a BigInt', async () => {
      const bodies: any[] = [];
      global.fetch = vi.fn().mockImplementation(async (_url: string, init: RequestInit) => {
        bodies.push(JSON.parse(init.body as string));
        return { ok: true, status: 200, statusText: 'OK' } as Response;
      });

      const transport = httpTransport({ url: 'http://example.com/log', batch: 10, interval: 0 });
      await transport.write(makeEntry('big', { count: 42n }));
      await transport.flush?.();

      expect(bodies).toHaveLength(1);
      expect(String(bodies[0][0].count)).toBe('42');
    });

    it('should still surface a genuine HTTP failure', async () => {
      let calls = 0;
      global.fetch = vi.fn().mockImplementation(async () => {
        calls++;
        return { ok: false, status: 503, statusText: 'Service Unavailable' } as Response;
      });

      const transport = httpTransport({ url: 'http://example.com/log', batch: 1, interval: 0, retry: 1 });

      await expect(transport.write(makeEntry('will fail'))).rejects.toThrow(/503/);
      expect(calls).toBe(2);
    });
  });

  describe('close drains the buffer', () => {
    it('should deliver entries buffered while a send is in flight', async () => {
      const batches: string[][] = [];
      let release!: () => void;
      const firstSendStarted = new Promise<void>((resolve) => {
        release = resolve;
      });

      global.fetch = vi.fn().mockImplementation(async (_url: string, init: RequestInit) => {
        batches.push(JSON.parse(init.body as string).map((e: LogEntry) => e.msg));
        if (batches.length === 1) await firstSendStarted;
        return { ok: true, status: 200, statusText: 'OK' } as Response;
      });

      const transport = httpTransport({ url: 'http://example.com/log', batch: 1, interval: 0 });
      const entry = (msg: string): LogEntry => ({ level: 30, levelName: 'info', time: Date.now(), msg });

      const pending = transport.write(entry('in-flight'));
      await new Promise((resolve) => setTimeout(resolve, 10));
      await transport.write(entry('buffered-1'));
      await transport.write(entry('buffered-2'));

      const closing = transport.close();
      release();
      await pending;
      await closing;

      const delivered = batches.flat();
      expect(delivered).toContain('in-flight');
      expect(delivered).toContain('buffered-1');
      expect(delivered).toContain('buffered-2');
    });

    it('should resolve when nothing is buffered', async () => {
      const transport = httpTransport({ url: 'http://example.com/log', batch: 5, interval: 0 });
      await expect(transport.close?.()).resolves.toBeUndefined();
    });

    it('should return even when the endpoint keeps failing', async () => {
      global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 503, statusText: 'Nope' } as Response);

      const transport = httpTransport({ url: 'http://example.com/log', batch: 10, interval: 0, retry: 0 });
      const entry: LogEntry = { level: 30, levelName: 'info', time: Date.now(), msg: 'doomed' };
      await transport.write(entry).catch(() => undefined);

      // Regression guard: draining must be bounded, or a failing endpoint makes
      // close() hang forever because each attempt re-queues its batch.
      await expect(
        Promise.race([
          transport.close?.(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('close() never returned')), 4000)),
        ])
      ).resolves.not.toThrow();
    }, 10000);
  });
});
