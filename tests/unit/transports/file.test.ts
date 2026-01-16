import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fileTransport } from '../../../src/transports/file.js';
import type { LogEntry } from '../../../src/types.js';
import { isNode } from '../../../src/utils/env.js';
import fs from 'fs';
import path from 'path';

describe('fileTransport', () => {
  const testDir = path.join(process.cwd(), 'test-logs');
  const testFile = path.join(testDir, 'test.log');

  beforeEach(() => {
    vi.clearAllMocks();
    // Ensure test directory exists
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  });

  afterEach(async () => {
    if (isNode()) {
      try {
        if (fs.existsSync(testDir)) {
          fs.rmSync(testDir, { recursive: true, force: true });
        }
      } catch {
        // Ignore cleanup errors
      }
    }
  });

  it('should create file transport', () => {
    const transport = fileTransport({ path: testFile });
    expect(transport.name).toBe('file');
  });

  it('should support only node environment', () => {
    const transport = fileTransport({ path: testFile });
    expect(transport.supports?.('node')).toBe(true);
    expect(transport.supports?.('browser')).toBe(false);
  });

  it('should accept path option', () => {
    expect(() => fileTransport({ path: './logs/app.log' })).not.toThrow();
  });

  it('should accept maxSize option', () => {
    expect(() => fileTransport({ path: testFile, maxSize: '10MB' })).not.toThrow();
  });

  it('should accept rotate option', () => {
    expect(() => fileTransport({ path: testFile, rotate: '1d' })).not.toThrow();
  });

  it('should accept maxFiles option', () => {
    expect(() => fileTransport({ path: testFile, maxFiles: 10 })).not.toThrow();
  });

  it('should accept compress option', () => {
    expect(() => fileTransport({ path: testFile, compress: true })).not.toThrow();
  });

  describe('write', () => {
    it('should write entry to file', async () => {
      const transport = fileTransport({ path: testFile });
      const entry: LogEntry = {
        level: 30,
        levelName: 'info',
        time: Date.now(),
        msg: 'test message',
      };

      await transport.write(entry);
      await transport.close?.();

      expect(fs.existsSync(testFile)).toBe(true);
      const content = fs.readFileSync(testFile, 'utf8');
      expect(content).toContain('test message');
    });

    it('should create directory if not exists', async () => {
      const nestedPath = path.join(testDir, 'nested', 'deep', 'test.log');
      const transport = fileTransport({ path: nestedPath });
      const entry: LogEntry = {
        level: 30,
        levelName: 'info',
        time: Date.now(),
        msg: 'nested test',
      };

      await transport.write(entry);
      await transport.close?.();

      expect(fs.existsSync(nestedPath)).toBe(true);
    });

    it('should append to existing file', async () => {
      const transport = fileTransport({ path: testFile });
      const entry1: LogEntry = {
        level: 30,
        levelName: 'info',
        time: Date.now(),
        msg: 'first message',
      };
      const entry2: LogEntry = {
        level: 30,
        levelName: 'info',
        time: Date.now(),
        msg: 'second message',
      };

      await transport.write(entry1);
      await transport.write(entry2);
      await transport.close?.();

      const content = fs.readFileSync(testFile, 'utf8');
      expect(content).toContain('first message');
      expect(content).toContain('second message');
    });

    it('should track existing file size when reopening', async () => {
      // First, write to file and close
      const transport1 = fileTransport({ path: testFile });
      const entry1: LogEntry = {
        level: 30,
        levelName: 'info',
        time: Date.now(),
        msg: 'initial content',
      };
      await transport1.write(entry1);
      await transport1.close?.();

      // Verify file exists
      expect(fs.existsSync(testFile)).toBe(true);

      // Now open a new transport to the same file
      const transport2 = fileTransport({ path: testFile });
      const entry2: LogEntry = {
        level: 30,
        levelName: 'info',
        time: Date.now(),
        msg: 'appended content',
      };
      await transport2.write(entry2);
      await transport2.close?.();

      // Should have both entries
      const content = fs.readFileSync(testFile, 'utf8');
      expect(content).toContain('initial content');
      expect(content).toContain('appended content');
    });
  });

  describe('rotation', () => {
    it('should rotate based on size', async () => {
      const transport = fileTransport({
        path: testFile,
        maxSize: '100B',
        maxFiles: 3,
      });

      // Write enough data to trigger rotation
      for (let i = 0; i < 5; i++) {
        const entry: LogEntry = {
          level: 30,
          levelName: 'info',
          time: Date.now(),
          msg: 'x'.repeat(50),
        };
        await transport.write(entry);
      }

      await transport.close?.();

      // Check that rotated files exist
      const files = fs.readdirSync(testDir);
      expect(files.length).toBeGreaterThan(1);
    });

    it('should handle time-based rotation option', async () => {
      const transport = fileTransport({
        path: testFile,
        rotate: '1d',
        maxFiles: 5,
      });

      const entry: LogEntry = {
        level: 30,
        levelName: 'info',
        time: Date.now(),
        msg: 'test time rotation',
      };

      await transport.write(entry);
      await transport.close?.();

      expect(fs.existsSync(testFile)).toBe(true);
    });

    it('should handle compression option', async () => {
      const transport = fileTransport({
        path: testFile,
        maxSize: '50B',
        compress: true,
        maxFiles: 3,
      });

      // Write enough data to trigger rotation with compression
      for (let i = 0; i < 3; i++) {
        const entry: LogEntry = {
          level: 30,
          levelName: 'info',
          time: Date.now(),
          msg: 'compress test ' + i,
        };
        await transport.write(entry);
      }

      await transport.close?.();
      expect(fs.existsSync(testFile)).toBe(true);
    });
  });

  describe('flush', () => {
    it('should handle flush without error', async () => {
      const transport = fileTransport({ path: testFile });
      const entry: LogEntry = {
        level: 30,
        levelName: 'info',
        time: Date.now(),
        msg: 'test',
      };

      await transport.write(entry);
      // Flush may or may not be implemented
      if (transport.flush) {
        try {
          await transport.flush();
        } catch {
          // Some implementations may not have flush
        }
      }
      await transport.close?.();
    });
  });

  describe('close', () => {
    it('should close the transport', async () => {
      const transport = fileTransport({ path: testFile });
      const entry: LogEntry = {
        level: 30,
        levelName: 'info',
        time: Date.now(),
        msg: 'test',
      };

      await transport.write(entry);
      await expect(transport.close?.()).resolves.toBeUndefined();
    });

    it('should handle close when nothing written', async () => {
      const transport = fileTransport({ path: testFile });
      await expect(transport.close?.()).resolves.toBeUndefined();
    });
  });
});
