import { describe, it, expect } from 'vitest';
import { isNode, isBrowser, isDev, isTTY, shouldUseColors, getEnvironment, getCwd } from '../../../src/utils/env.js';

describe('env', () => {
  describe('isNode', () => {
    it('should return a function', () => {
      expect(typeof isNode).toBe('function');
    });

    it('should detect Node.js environment', () => {
      expect(typeof isNode()).toBe('boolean');
    });

    it('should return true in Node.js', () => {
      expect(isNode()).toBe(true);
    });
  });

  describe('isBrowser', () => {
    it('should return a function', () => {
      expect(typeof isBrowser).toBe('function');
    });

    it('should detect browser environment', () => {
      expect(typeof isBrowser()).toBe('boolean');
    });

    it('should return false in Node.js', () => {
      expect(isBrowser()).toBe(false);
    });
  });

  describe('isDev', () => {
    it('should return boolean for dev mode', () => {
      expect(typeof isDev()).toBe('boolean');
    });
  });

  describe('isTTY', () => {
    it('should return a function', () => {
      expect(typeof isTTY).toBe('function');
    });

    it('should return boolean', () => {
      expect(typeof isTTY()).toBe('boolean');
    });
  });

  describe('shouldUseColors', () => {
    it('should return a function', () => {
      expect(typeof shouldUseColors).toBe('function');
    });

    it('should return boolean', () => {
      expect(typeof shouldUseColors()).toBe('boolean');
    });
  });

  describe('getEnvironment', () => {
    it('should return a function', () => {
      expect(typeof getEnvironment).toBe('function');
    });

    it('should return a string', () => {
      const env = getEnvironment();
      expect(typeof env).toBe('string');
    });

    it('should return NODE_ENV value in Node.js', () => {
      const env = getEnvironment();
      // In vitest, NODE_ENV is 'test'
      expect(env).toBe(process.env.NODE_ENV || 'development');
    });
  });

  describe('getCwd', () => {
    it('should return a function', () => {
      expect(typeof getCwd).toBe('function');
    });

    it('should return a string in Node.js', () => {
      expect(typeof getCwd()).toBe('string');
    });

    it('should return current directory', () => {
      expect(getCwd()).toBe(process.cwd());
    });
  });
});
