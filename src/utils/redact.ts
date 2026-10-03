/**
 * @oxog/log - Redaction Utilities
 *
 * Mask sensitive data in log entries.
 *
 * @packageDocumentation
 */

import { REDACTED_VALUE } from '../constants.js';

/**
 * Marker written in place of a circular value, matching what the stringify
 * helpers emit.
 */
const CIRCULAR = '[Circular]';

/**
 * One open object on the path currently being serialized.
 *
 * `JSON.stringify` has no "exit" callback, so a replacer cannot pop its own
 * stack when it leaves an object. Instead every frame records the object whose
 * properties are being visited (`holder`, i.e. the replacer's `this`) and the
 * value returned for that key (`value`); a frame stays open exactly while we are
 * still inside `value`, so the stack is unwound by dropping trailing frames
 * whose `value` is no longer the current holder.
 */
interface ReplacerFrame {
  holder: unknown;
  key: string;
  value: unknown;
}

/** Drop frames for objects we have already left. */
function unwindStack(stack: ReplacerFrame[], holder: unknown): void {
  while (stack.length > 0 && stack[stack.length - 1].value !== holder) {
    stack.pop();
  }
}

/** Current dot-notation path of a key inside the replacer stack. */
function currentPath(stack: ReplacerFrame[], key: string): string {
  const keys: string[] = [];
  for (const frame of stack) {
    // The root frame has an empty key; it must not add a leading dot.
    if (frame.key !== '') keys.push(frame.key);
  }
  keys.push(key);
  return keys.join('.');
}

/** Path segments of a key inside the replacer stack (array indices included). */
function currentSegments(stack: ReplacerFrame[], key: string): string[] {
  const segments: string[] = [];
  for (const frame of stack) {
    if (frame.key !== '') segments.push(frame.key);
  }
  segments.push(key);
  return segments;
}

/** Match path segments against a pattern, honouring `*` and `[*]` wildcards. */
function matchesSegments(pattern: string[], segments: string[]): boolean {
  if (pattern.length !== segments.length) return false;
  for (let i = 0; i < pattern.length; i++) {
    const part = pattern[i];
    if (part === '*' || part === '[*]') continue;
    if (part !== segments[i]) return false;
  }
  return true;
}

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

  // Track the objects we are currently inside during serialization
  const pathStack: ReplacerFrame[] = [];

  return function replacer(this: unknown, key: string, value: unknown): unknown {
    unwindStack(pathStack, this);

    // Handle the root object
    if (key === '') {
      pathStack.push({ holder: this, key, value });
      return value;
    }

    // Check if this key should be redacted
    if (exactPaths.has(key)) {
      return placeholder;
    }

    // Build current path and check
    const path = currentPath(pathStack, key);

    if (exactPaths.has(path)) {
      return placeholder;
    }

    // Check wildcard paths
    for (const { prefix, suffix } of wildcardPaths) {
      if (path.startsWith(prefix) && path.endsWith(suffix)) {
        return placeholder;
      }
    }

    // Track objects so nested keys get an absolute path. Arrays are tracked
    // too, so their entries appear in the path as index segments.
    if (value !== null && typeof value === 'object') {
      pathStack.push({ holder: this, key, value });
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

  // Pre-compile paths for efficient lookup
  const exactFields = new Set<string>();
  const pathPatterns: string[][] = [];

  for (const path of paths) {
    if (path.includes('.') || path.includes('*')) {
      pathPatterns.push(path.split('.'));
    } else {
      exactFields.add(path.toLowerCase());
    }
  }

  // Objects we are currently inside, used for both path matching and
  // circular reference detection.
  const stack: ReplacerFrame[] = [];

  function replacer(this: unknown, key: string, value: unknown): unknown {
    unwindStack(stack, this);

    // Root object
    if (key === '') {
      if (value !== null && typeof value === 'object') {
        stack.push({ holder: this, key, value });
      }
      return value;
    }

    // Check for simple field name match
    if (exactFields.has(key.toLowerCase())) {
      return placeholder;
    }

    // Check dotted and wildcard paths against the absolute path of this key
    const segments = currentSegments(stack, key);
    for (const pattern of pathPatterns) {
      if (matchesSegments(pattern, segments)) {
        return placeholder;
      }
    }

    // Handle circular references: only an object we are currently inside is a
    // cycle. A value merely referenced twice is serialized as usual.
    if (typeof value === 'object' && value !== null) {
      for (const frame of stack) {
        if (frame.value === value) {
          return CIRCULAR;
        }
      }
    }

    // Handle special types
    if (typeof value === 'bigint') {
      return value.toString();
    }

    // Objects returned from here are the ones JSON.stringify descends into, so
    // they are the ones pushed onto the stack.
    if (value instanceof Error) {
      const converted: Record<string, unknown> = {
        name: value.name,
        message: value.message,
        stack: value.stack,
      };
      stack.push({ holder: this, key, value: converted });
      return converted;
    }

    if (value instanceof RegExp) {
      return value.toString();
    }

    if (value instanceof Map) {
      const converted = Object.fromEntries(value);
      stack.push({ holder: this, key, value: converted });
      return converted;
    }

    if (value instanceof Set) {
      const converted = Array.from(value);
      stack.push({ holder: this, key, value: converted });
      return converted;
    }

    if (value !== null && typeof value === 'object') {
      stack.push({ holder: this, key, value });
    }

    return value;
  }

  return JSON.stringify(obj, replacer, indent);
}

/**
 * Deep clone an object.
 *
 * `ancestors` holds the objects on the path currently being cloned. Log entries
 * routinely contain self-referencing error contexts, so a value already on that
 * path is replaced with the circular marker instead of recursing forever.
 */
function deepClone<T>(obj: T, ancestors: Set<object> = new Set()): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (ancestors.has(obj as object)) {
    return CIRCULAR as unknown as T;
  }

  ancestors.add(obj as object);
  try {
    return deepCloneValue(obj, ancestors);
  } finally {
    ancestors.delete(obj);
  }
}

function deepCloneValue<T>(obj: T, ancestors: Set<object>): T {
  if (Array.isArray(obj)) {
    return obj.map((item) => deepClone(item, ancestors)) as unknown as T;
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
      result.set(key, deepClone(value, ancestors));
    }
    return result as unknown as T;
  }

  if (obj instanceof Set) {
    const result = new Set();
    for (const value of obj) {
      result.add(deepClone(value, ancestors));
    }
    return result as unknown as T;
  }

  const result: Record<string, unknown> = {};
  const source = obj as Record<string, unknown>;
  for (const key of Object.keys(source)) {
    result[key] = deepClone(source[key], ancestors);
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
