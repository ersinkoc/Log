/**
 * @oxog/log - Environment Detection Utilities
 *
 * Detect runtime environment and capabilities.
 *
 * @packageDocumentation
 */

/**
 * Check if running in Node.js environment.
 *
 * @example
 * ```typescript
 * if (isNode()) {
 *   // Use Node.js APIs
 * }
 * ```
 */
export function isNode(): boolean {
  return (
    typeof process !== 'undefined' &&
    process.versions != null &&
    process.versions.node != null
  );
}

/**
 * Check if running in browser environment.
 *
 * @example
 * ```typescript
 * if (isBrowser()) {
 *   // Use browser APIs
 * }
 * ```
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.document !== 'undefined';
}

/**
 * Check if running in development mode.
 * Returns true if NODE_ENV is not 'production'.
 *
 * @example
 * ```typescript
 * if (isDev()) {
 *   log.setLevel('debug');
 * }
 * ```
 */
export function isDev(): boolean {
  if (!isNode()) return false;
  return process.env['NODE_ENV'] !== 'production';
}

/**
 * Check if stdout is a TTY (terminal).
 *
 * @example
 * ```typescript
 * if (isTTY()) {
 *   // Use colors
 * }
 * ```
 */
export function isTTY(): boolean {
  if (!isNode()) return false;
  return process.stdout?.isTTY === true;
}

/**
 * Check if colors should be enabled by default.
 * Returns true if running in TTY or browser.
 *
 * @example
 * ```typescript
 * const colors = shouldUseColors();
 * ```
 */
export function shouldUseColors(): boolean {
  if (isBrowser()) return true;
  if (!isNode()) return false;

  // Check for NO_COLOR environment variable
  if (process.env['NO_COLOR'] !== undefined) return false;

  // Check for FORCE_COLOR environment variable
  if (process.env['FORCE_COLOR'] !== undefined) return true;

  // Check if running in CI
  if (process.env['CI'] !== undefined) return true;

  // Default to TTY detection
  return isTTY();
}

/**
 * Get the current environment name.
 *
 * @example
 * ```typescript
 * const env = getEnvironment(); // 'development' | 'production' | 'test'
 * ```
 */
export function getEnvironment(): string {
  if (!isNode()) return 'browser';
  return process.env['NODE_ENV'] || 'development';
}

/**
 * Get the current working directory.
 * Returns undefined in browser.
 *
 * @example
 * ```typescript
 * const cwd = getCwd(); // '/path/to/project'
 * ```
 */
export function getCwd(): string | undefined {
  if (!isNode()) return undefined;
  return process.cwd();
}

/**
 * Get a safe reference to globalThis.
 */
export function getGlobalThis(): typeof globalThis {
  if (typeof globalThis !== 'undefined') return globalThis;
  if (typeof window !== 'undefined') return window as unknown as typeof globalThis;
  if (typeof global !== 'undefined') return global as unknown as typeof globalThis;
  if (typeof self !== 'undefined') return self as unknown as typeof globalThis;
  return {} as typeof globalThis;
}
