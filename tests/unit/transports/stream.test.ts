import { describe, it, expect, vi, beforeEach } from 'vitest';
import { streamTransport } from '../../../src/transports/stream.js';
import type { LogEntry } from '../../../src/types.js';
import { TransportError } from '../../../src/errors.js';

describe('streamTransport', () => {
  // Create a proper mock stream that returns true from write (no backpressure)
  function createMockStream() {
    return {
      write: vi.fn((data: string, callback: (err?: Error) => void) => {
        if (callback) callback();
        return true;
      }),
      once: vi.fn((event: string, cb: () => void) => {
        if (event === 'finish') cb();
      }),
      end: vi.fn(),
    } as any;
  }

  it('should create stream transport', () => {
    const mockStream = createMockStream();
    const transport = streamTransport({ stream: mockStream });
    expect(transport.name).toBe('stream');
  });

  it('should write to stream', async () => {
    const mockStream = createMockStream();
    const transport = streamTransport({ stream: mockStream });
    const entry: LogEntry = {
      level: 30,
      levelName: 'info',
      time: Date.now(),
      msg: 'test',
    };

    await transport.write(entry);
    expect(mockStream.write).toHaveBeenCalled();
  });

  it('should support only node environment', () => {
    const mockStream = createMockStream();
    const transport = streamTransport({ stream: mockStream });
    expect(transport.supports?.('node')).toBe(true);
    expect(transport.supports?.('browser')).toBe(false);
  });

  it('should call flush on stream', async () => {
    const mockStream = createMockStream();
    const transport = streamTransport({ stream: mockStream });

    await transport.flush?.();
    // No error means success
  });

  it('should throw if stream is not provided', () => {
    expect(() => streamTransport({ stream: undefined as any })).toThrow('Stream is required');
  });

  describe('write', () => {
    it('should format entry as JSON', async () => {
      const mockStream = createMockStream();
      const transport = streamTransport({ stream: mockStream });
      const entry: LogEntry = {
        level: 30,
        levelName: 'info',
        time: Date.now(),
        msg: 'test message',
      };

      await transport.write(entry);

      const writtenData = mockStream.write.mock.calls[0][0];
      expect(writtenData).toContain('test message');
      expect(writtenData.endsWith('\n')).toBe(true);
    });

    it('should handle write errors', async () => {
      const errorStream = {
        write: vi.fn((data: string, callback: (err?: Error) => void) => {
          if (callback) callback(new Error('Write failed'));
          return true;
        }),
        once: vi.fn(),
        end: vi.fn(),
      } as any;

      const transport = streamTransport({ stream: errorStream });
      const entry: LogEntry = {
        level: 30,
        levelName: 'info',
        time: Date.now(),
        msg: 'test',
      };

      await expect(transport.write(entry)).rejects.toThrow('Failed to write to stream');
    });

    it('should handle backpressure', async () => {
      let drainCallback: (() => void) | null = null;
      const backpressureStream = {
        write: vi.fn((data: string, callback: (err?: Error) => void) => {
          // Simulate backpressure by returning false
          setTimeout(() => {
            if (callback) callback();
          }, 10);
          return false;
        }),
        once: vi.fn((event: string, cb: () => void) => {
          if (event === 'drain') {
            drainCallback = cb;
            // Simulate drain event after a short delay
            setTimeout(() => {
              if (drainCallback) drainCallback();
            }, 5);
          }
        }),
        end: vi.fn(),
      } as any;

      const transport = streamTransport({ stream: backpressureStream });
      const entry: LogEntry = {
        level: 30,
        levelName: 'info',
        time: Date.now(),
        msg: 'test',
      };

      await transport.write(entry);
      expect(backpressureStream.once).toHaveBeenCalledWith('drain', expect.any(Function));
    });

    it('should reject when closed', async () => {
      const mockStream = createMockStream();
      const transport = streamTransport({ stream: mockStream });

      await transport.close?.();

      const entry: LogEntry = {
        level: 30,
        levelName: 'info',
        time: Date.now(),
        msg: 'test',
      };

      await expect(transport.write(entry)).rejects.toThrow('Stream is closed');
    });
  });

  describe('close', () => {
    it('should close the stream', async () => {
      const mockStream = createMockStream();
      const transport = streamTransport({ stream: mockStream });

      await transport.close?.();

      expect(mockStream.end).toHaveBeenCalled();
    });

    it('should handle multiple close calls', async () => {
      const mockStream = createMockStream();
      const transport = streamTransport({ stream: mockStream });

      await transport.close?.();
      await transport.close?.();

      // Should only call end once
      expect(mockStream.end).toHaveBeenCalledTimes(1);
    });

    it('should handle close errors', async () => {
      const errorStream = {
        write: vi.fn(),
        once: vi.fn((event: string, cb: (err?: Error) => void) => {
          if (event === 'error') {
            setTimeout(() => cb(new Error('Close failed')), 5);
          }
        }),
        end: vi.fn(),
      } as any;

      const transport = streamTransport({ stream: errorStream });

      await expect(transport.close?.()).rejects.toThrow('Failed to close stream');
    });
  });
});
