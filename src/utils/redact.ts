/**
 * @oxog/log - Redaction Utilities
 *
 * Mask sensitive data in log entries.
 *
 * @packageDocumentation
 */

import { REDACTED_VALUE } from '../constants.js';

/**
 * Redact sensitive fields from an object.
 *
 * @example
 * ```typescript
 * const data = { user: 'john', password: 'secret' };
 * const redacted = redactFields(data, ['password']);
 * // { user: 'john', password: '[REDACTED]' }
 * ```
 */
export function redactFields<T extends Record<string, unknown>>(
  obj: T,
  paths: string[],
  placeholder = REDACTED_VALUE
): T {
  if (!obj || typeof obj !== 'object' || paths.length === 0) {
    return obj;
  }

  // Create a deep clone to avoid mutating the original
  const result = deepClone(obj);

  for (const path of paths) {
    redactPath(result, path.split('.'), placeholder);
  }

  return result;
}

/**
 * Deep clone an object.
 */
function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => deepClone(item)) as unknown as T;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime()) as unknown as T;
  }

  if (obj instanceof RegExp) {
    return new RegExp(obj.source, obj.flags) as unknown as T;
  }

  if (obj instanceof Map) {
    const result = new Map();
    for (const [key, value] of obj) {
      result.set(key, deepClone(value));
    }
    return result as unknown as T;
  }

  if (obj instanceof Set) {
    const result = new Set();
    for (const value of obj) {
      result.add(deepClone(value));
    }
    return result as unknown as T;
  }

  const result: Record<string, unknown> = {};
  for (const key of Object.keys(obj)) {
    result[key] = deepClone((obj as Record<string, unknown>)[key]);
  }
  return result as T;
}

/**
 * Redact a value at a specific path in an object.
 */
function redactPath(
  obj: Record<string, unknown>,
  pathParts: string[],
  placeholder: string
): void {
  if (pathParts.length === 0 || !obj || typeof obj !== 'object') {
    return;
  }

  const [current, ...rest] = pathParts;
  if (!current) return;

  // Handle wildcard matching
  if (current === '*') {
    for (const key of Object.keys(obj)) {
      if (rest.length === 0) {
        obj[key] = placeholder;
      } else {
        const value = obj[key];
        if (value && typeof value === 'object') {
          redactPath(value as Record<string, unknown>, rest, placeholder);
        }
      }
    }
    return;
  }

  // Handle array index notation [*]
  if (current === '[*]' && Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      if (rest.length === 0) {
        obj[i] = placeholder;
      } else {
        const value = obj[i];
        if (value && typeof value === 'object') {
          redactPath(value as Record<string, unknown>, rest, placeholder);
        }
      }
    }
    return;
  }

  if (!(current in obj)) {
    return;
  }

  if (rest.length === 0) {
    // Final path segment - redact the value
    obj[current] = placeholder;
  } else {
    // Continue traversing
    const value = obj[current];
    if (value && typeof value === 'object') {
      redactPath(value as Record<string, unknown>, rest, placeholder);
    }
  }
}

/**
 * Check if a field name matches any of the sensitive patterns.
 *
 * @example
 * ```typescript
 * isSensitive('password', ['password', 'token']); // true
 * isSensitive('username', ['password', 'token']); // false
 * ```
 */
export function isSensitive(fieldName: string, sensitivePatterns: string[]): boolean {
  const lowerField = fieldName.toLowerCase();

  return sensitivePatterns.some((pattern) => {
    const lowerPattern = pattern.toLowerCase();

    // Exact match
    if (lowerField === lowerPattern) return true;

    // Contains match
    if (lowerField.includes(lowerPattern)) return true;

    // Regex pattern (if pattern looks like a regex)
    if (pattern.startsWith('/') && pattern.endsWith('/')) {
      try {
        const regex = new RegExp(pattern.slice(1, -1), 'i');
        return regex.test(fieldName);
      } catch {
        return false;
      }
    }

    return false;
  });
}

/**
 * Create a redaction function with predefined paths.
 *
 * @example
 * ```typescript
 * const redact = createRedactor(['password', 'token']);
 * const safe = redact({ password: 'secret' });
 * ```
 */
export function createRedactor(
  paths: string[],
  placeholder = REDACTED_VALUE
): <T extends Record<string, unknown>>(obj: T) => T {
  return (obj) => redactFields(obj, paths, placeholder);
}

/**
 * Auto-redact common sensitive field names.
 *
 * @example
 * ```typescript
 * const safe = autoRedact({ password: 'secret', username: 'john' });
 * // { password: '[REDACTED]', username: 'john' }
 * ```
 */
export function autoRedact<T extends Record<string, unknown>>(
  obj: T,
  additionalPatterns: string[] = [],
  placeholder = REDACTED_VALUE
): T {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  const defaultPatterns = [
    'password',
    'passwd',
    'pwd',
    'secret',
    'token',
    'apikey',
    'api_key',
    'apiKey',
    'auth',
    'authorization',
    'credential',
    'credentials',
    'private',
    'privateKey',
    'private_key',
  ];

  const patterns = [...defaultPatterns, ...additionalPatterns];
  const result = deepClone(obj);

  autoRedactRecursive(result, patterns, placeholder);

  return result;
}

/**
 * Recursively auto-redact sensitive fields.
 */
function autoRedactRecursive(
  obj: Record<string, unknown>,
  patterns: string[],
  placeholder: string
): void {
  for (const key of Object.keys(obj)) {
    const value = obj[key];

    if (isSensitive(key, patterns)) {
      obj[key] = placeholder;
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      autoRedactRecursive(value as Record<string, unknown>, patterns, placeholder);
    } else if (Array.isArray(value)) {
      for (const item of value) {
        if (item && typeof item === 'object') {
          autoRedactRecursive(item as Record<string, unknown>, patterns, placeholder);
        }
      }
    }
  }
}
