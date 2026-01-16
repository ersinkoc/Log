/**
 * @oxog/log - Source Location Utilities
 *
 * Capture file and line number from stack traces.
 *
 * @packageDocumentation
 */

/**
 * Source location information.
 */
export interface SourceLocation {
  /** Source file name (without path) */
  file: string;

  /** Full file path */
  path?: string;

  /** Line number */
  line: number;

  /** Column number */
  column?: number;

  /** Function name */
  fn?: string;
}

/**
 * Get the source location of the caller.
 *
 * @param depth - How many stack frames to skip (default: 0)
 *
 * @example
 * ```typescript
 * function myLogger() {
 *   const loc = getSourceLocation(1); // Skip myLogger frame
 *   console.log(`${loc.file}:${loc.line}`);
 * }
 * ```
 */
export function getSourceLocation(depth = 0): SourceLocation | undefined {
  // Create an Error to capture stack trace
  const err = new Error();
  const stack = err.stack;

  if (!stack) {
    return undefined;
  }

  // Parse the stack trace
  const frames = parseStack(stack);

  // Skip internal frames + depth
  // Typical stack: Error, getSourceLocation, caller1, caller2...
  const targetIndex = 2 + depth;

  if (targetIndex >= frames.length) {
    return undefined;
  }

  return frames[targetIndex];
}

/**
 * Parse a V8-style stack trace.
 *
 * V8 format:
 * ```
 * Error: message
 *     at functionName (file:line:column)
 *     at file:line:column
 *     at Object.<anonymous> (file:line:column)
 * ```
 */
function parseStack(stack: string): SourceLocation[] {
  const lines = stack.split('\n');
  const frames: SourceLocation[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip "Error:" line
    if (!trimmed.startsWith('at ')) {
      continue;
    }

    const frame = parseV8Frame(trimmed);
    if (frame) {
      frames.push(frame);
    }
  }

  return frames;
}

/**
 * Parse a single V8 stack frame.
 *
 * Formats:
 * - "at functionName (file:line:column)"
 * - "at file:line:column"
 * - "at Object.<anonymous> (file:line:column)"
 * - "at async functionName (file:line:column)"
 */
function parseV8Frame(line: string): SourceLocation | undefined {
  // Remove "at " prefix
  let content = line.slice(3);

  // Handle "async " prefix
  if (content.startsWith('async ')) {
    content = content.slice(6);
  }

  // Pattern 1: "functionName (path:line:column)"
  const parenMatch = content.match(/^(.+?)\s+\((.+):(\d+):(\d+)\)$/);
  if (parenMatch) {
    const [, fn, path, lineStr, colStr] = parenMatch;
    return {
      fn: fn?.trim() || undefined,
      path: path,
      file: extractFileName(path || ''),
      line: parseInt(lineStr || '0', 10),
      column: parseInt(colStr || '0', 10),
    };
  }

  // Pattern 2: "path:line:column" (no function name)
  const simpleMatch = content.match(/^(.+):(\d+):(\d+)$/);
  if (simpleMatch) {
    const [, path, lineStr, colStr] = simpleMatch;
    return {
      path: path,
      file: extractFileName(path || ''),
      line: parseInt(lineStr || '0', 10),
      column: parseInt(colStr || '0', 10),
    };
  }

  // Pattern 3: "path:line" (no column)
  const noColMatch = content.match(/^(.+):(\d+)$/);
  if (noColMatch) {
    const [, path, lineStr] = noColMatch;
    return {
      path: path,
      file: extractFileName(path || ''),
      line: parseInt(lineStr || '0', 10),
    };
  }

  return undefined;
}

/**
 * Extract the file name from a full path.
 *
 * @example
 * ```typescript
 * extractFileName('/path/to/file.ts'); // 'file.ts'
 * extractFileName('C:\\path\\to\\file.ts'); // 'file.ts'
 * extractFileName('file:///path/to/file.ts'); // 'file.ts'
 * ```
 */
export function extractFileName(path: string): string {
  // Remove file:// protocol
  let cleanPath = path.replace(/^file:\/\//, '');

  // Handle Windows paths
  cleanPath = cleanPath.replace(/\\/g, '/');

  // Remove query string and hash
  cleanPath = cleanPath.split('?')[0]?.split('#')[0] || cleanPath;

  // Get the file name
  const parts = cleanPath.split('/');
  return parts[parts.length - 1] || cleanPath;
}

/**
 * Check if a stack frame should be filtered out.
 * Used to skip internal frames from the logging library.
 *
 * @param location - Source location to check
 * @param internalPatterns - Patterns to filter (file names or paths)
 */
export function isInternalFrame(
  location: SourceLocation,
  internalPatterns: string[] = []
): boolean {
  const defaultPatterns = [
    '@oxog/log',
    'node_modules',
    'internal/',
    '<anonymous>',
  ];

  const patterns = [...defaultPatterns, ...internalPatterns];
  const pathToCheck = location.path || location.file;

  return patterns.some((pattern) => {
    if (pattern.includes('/') || pattern.includes('\\')) {
      // Path pattern
      return pathToCheck.includes(pattern);
    }
    // File name pattern
    return location.file === pattern || location.file.includes(pattern);
  });
}

/**
 * Get the first non-internal source location.
 *
 * @param depth - Additional frames to skip
 * @param internalPatterns - Additional patterns to filter
 */
export function getCallerLocation(
  depth = 0,
  internalPatterns: string[] = []
): SourceLocation | undefined {
  const err = new Error();
  const stack = err.stack;

  if (!stack) {
    return undefined;
  }

  const frames = parseStack(stack);

  // Skip: Error, getCallerLocation, getSourceLocation (if called), and depth
  let skipped = 0;
  for (const frame of frames) {
    if (skipped < 2 + depth) {
      skipped++;
      continue;
    }

    if (!isInternalFrame(frame, internalPatterns)) {
      return frame;
    }
  }

  return undefined;
}

/**
 * Format a source location as a string.
 *
 * @example
 * ```typescript
 * formatLocation({ file: 'app.ts', line: 42 }); // 'app.ts:42'
 * formatLocation({ file: 'app.ts', line: 42, column: 10 }); // 'app.ts:42:10'
 * ```
 */
export function formatLocation(location: SourceLocation): string {
  let result = location.file;

  if (location.line) {
    result += `:${location.line}`;
  }

  if (location.column) {
    result += `:${location.column}`;
  }

  return result;
}
