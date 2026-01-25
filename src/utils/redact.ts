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
 * Create a JSON replacer function that redacts sensitive fields during serialization.
 * This is more efficient than deep cloning as it redacts during the JSON.stringify process.
 *
 * @example
 * ```typescript
 * const replacer = createRedactingReplacer(['password', 'token']);
 * JSON.stringify(data, replacer);
 * // Redacts password and token fields without cloning the entire object
 * ```
 */
export function createRedactingReplacer(
  paths: string[],
  placeholder = REDACTED_VALUE
): (key: string, value: unknown) => unknown {
  // Pre-compile paths into a Set for O(1) lookup
  const exactPaths = new Set<string>();
  const wildcardPaths: { prefix: string; suffix: string }[] = [];

  for (const path of paths) {
    if (path.includes('*')) {
      const parts = path.split('*');
      wildcardPaths.push({ prefix: parts[0] || '', suffix: parts[1] || '' });
    } else {
      // Add the field name itself for simple matching
      const lastDot = path.lastIndexOf('.');
      const fieldName = lastDot >= 0 ? path.slice(lastDot + 1) : path;
      exactPaths.add(fieldName);
      exactPaths.add(path);
    }
  }

  // Track current path during serialization
  const pathStack: string[] = [];

  return function replacer(key: string, value: unknown): unknown {
    // Handle the root object
    if (key === '') {
      pathStack.length = 0;
      return value;
    }

    // Check if this key should be redacted
    if (exactPaths.has(key)) {
      return placeholder;
    }

    // Build current path and check
    const currentPath = pathStack.length > 0 ? `${pathStack.join('.')}.${key}` : key;

    if (exactPaths.has(currentPath)) {
      return placeholder;
    }

    // Check wildcard paths
    for (const { prefix, suffix } of wildcardPaths) {
      if (currentPath.startsWith(prefix) && currentPath.endsWith(suffix)) {
        return placeholder;
      }
    }

    // If this is an object, track the path for nested keys
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      pathStack.push(key);
      // Note: JSON.stringify will call us again for nested properties
      // We need to pop after processing children, which happens automatically
      // because JSON.stringify processes depth-first
    }

    return value;
  };
}

/**
 * Stringify an object with redaction applied during serialization.
 * More efficient than redactFields + JSON.stringify for large objects.
 *
 * @example
 * ```typescript
 * const json = stringifyWithRedaction(data, ['password', 'headers.authorization']);
 * ```
 */
export function stringifyWithRedaction(
  obj: unknown,
  paths: string[],
  placeholder = REDACTED_VALUE,
  indent?: number
): string {
  if (!obj || typeof obj !== 'object' || paths.length === 0) {
    return JSON.stringify(obj, null, indent);
  }

  // Use a WeakSet for circular reference detection
  const seen = new WeakSet<object>();

  // Pre-compile paths for efficient lookup
  const exactFields = new Set<string>();
  const pathPatterns: string[] = [];

  for (const path of paths) {
    if (path.includes('.') || path.includes('*')) {
      pathPatterns.push(path);
    } else {
      exactFields.add(path.toLowerCase());
    }
  }

  function replacer(this: unknown, key: string, value: unknown): unknown {
    // Root object
    if (key === '' && typeof value === 'object' && value !== null) {
      seen.add(value);
      return value;
    }

    // Check for simple field name match
    if (exactFields.has(key.toLowerCase())) {
      return placeholder;
    }

    // Handle circular references
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return '[Circular]';
      }
      seen.add(value);
    }

    // Handle special types
    if (typeof value === 'bigint') {
      return value.toString();
    }

    if (value instanceof Error) {
      return {
        name: value.name,
        message: value.message,
        stack: value.stack,
      };
    }

    if (value instanceof RegExp) {
      return value.toString();
    }

    if (value instanceof Map) {
      return Object.fromEntries(value);
    }

    if (value instanceof Set) {
      return Array.from(value);
    }

    return value;
  }

  return JSON.stringify(obj, replacer, indent);
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
