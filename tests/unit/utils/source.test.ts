import { describe, it, expect } from 'vitest';
import { getSourceLocation, extractFileName, getCallerLocation, formatLocation } from '../../../src/utils/source.js';

describe('source', () => {
  describe('getSourceLocation', () => {
    it('should return source location', () => {
      const location = getSourceLocation();
      expect(typeof location).toBe('object');
      expect(typeof location.file).toBe('string');
    });

    it('should return file property', () => {
      const location = getSourceLocation();
      expect(location.file).toBeDefined();
    });
  });

  describe('extractFileName', () => {
    it('should extract filename from unix path', () => {
      expect(extractFileName('/path/to/file.ts')).toBe('file.ts');
    });

    it('should extract filename from windows path', () => {
      expect(extractFileName('C:\\path\\to\\file.ts')).toBe('file.ts');
    });

    it('should handle simple filenames', () => {
      expect(extractFileName('file.ts')).toBe('file.ts');
    });
  });

  describe('getCallerLocation', () => {
    it('should return caller location', () => {
      const location = getCallerLocation();
      expect(location).toHaveProperty('file');
    });

    it('should respect depth parameter', () => {
      const location = getCallerLocation(1);
      expect(location).toBeDefined();
    });

    it('should skip internal frames with custom patterns', () => {
      const location = getCallerLocation(0, []);
      expect(location).toBeDefined();
    });

    it('should return undefined when all frames are internal', () => {
      // Request very high depth to exhaust all frames
      const location = getCallerLocation(1000, []);
      expect(location).toBeUndefined();
    });
  });

  describe('formatLocation', () => {
    it('should format location with all properties', () => {
      const formatted = formatLocation({ file: 'test.ts', line: 10, column: 5 });
      expect(formatted).toContain('test.ts');
      expect(formatted).toContain('10');
    });

    it('should handle missing line/column', () => {
      const formatted = formatLocation({ file: 'test.ts' });
      expect(formatted).toBe('test.ts');
    });
  });
});
