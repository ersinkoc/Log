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
    // NOTE (F19): the first three assertions used to be
    // `expect(location).toHaveProperty('file')` / `toBeDefined()`. They passed
    // vacuously: before the isInternalFrame fix a bare "node_modules" pattern
    // was compared only against the bare file name ("index.js"), so it never
    // matched and getCallerLocation() handed back the vitest runner's own file
    // (node_modules/@vitest/runner/dist/index.js) as the "caller". Any frame at
    // all satisfied those assertions. The checks below assert the real
    // invariant - a library frame is never returned as the caller - and accept
    // `undefined` when the stack holds no non-internal frame (the case under
    // vitest, where every frame belongs to the runner).
    function expectNoInternalFrame(location: ReturnType<typeof getCallerLocation>) {
      if (location === undefined) return;
      const pathToCheck = location.path || location.file;
      expect(pathToCheck).not.toContain('node_modules');
      expect(pathToCheck).not.toContain('@vitest');
      expect(pathToCheck).not.toContain('node:internal');
      expect(location.file).not.toBe('index.js');
      expect(location).toHaveProperty('file');
    }

    it('should never return a library frame as the caller', () => {
      expectNoInternalFrame(getCallerLocation());
    });

    it('should respect depth parameter', () => {
      expectNoInternalFrame(getCallerLocation(1));
    });

    it('should skip internal frames with custom patterns', () => {
      expectNoInternalFrame(getCallerLocation(0, []));
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
