# @oxog/log Implementation

## Document Purpose

This document describes the architecture, implementation details, and technical decisions for @oxog/log.

## 1. Architecture Overview

### 1.1 High-Level Design

```
User Application
       ↓
   Logger API
       ↓
   Kernel Layer
       ↓
   Plugin System
       ↓
   Transports
       ↓
   Output Destinations
```

### 1.2 Core Components

1. **Logger** (`src/logger.ts`)
   - Main user-facing API
   - Entry point for all operations
   - Delegates to kernel

2. **Kernel** (`src/kernel.ts`)
   - Micro-kernel managing plugins
   - Event bus implementation
   - Lifecycle management
   - Context management

3. **Types** (`src/types.ts`)
   - All TypeScript interfaces
   - Rich JSDoc documentation
   - Public type exports

4. **Errors** (`src/errors.ts`)
   - Custom error classes
   - Error boundary implementation

5. **Constants** (`src/constants.ts`)
   - Log levels
   - Default configurations
   - ANSI color codes

## 2. Implementation Details

### 2.1 Micro-Kernel Implementation

The kernel is the core orchestrator managing all plugins and transports.

#### Event Bus
```typescript
class EventBus {
  private listeners = new Map<string, Set<Function>>();

  on(event: string, listener: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
  }

  emit(event: string, data: unknown): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (err) {
          this.onError(err as Error);
        }
      });
    }
  }

  off(event: string, listener: Function): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.delete(listener);
    }
  }
}
```

#### Kernel Context
```typescript
interface KernelContext {
  level: LogLevel;
  levelValue: number;
  entries: LogEntry[];
  timings: Map<string, number>;
  config: Required<LoggerOptions>;
  transports: Map<string, Transport>;
  plugins: Map<string, LogPlugin>;
}
```

#### Plugin Lifecycle
1. **install()**: Called immediately on registration
   - Register event listeners
   - Add context properties
   - Initialize resources

2. **onInit()**: Called after all plugins installed
   - Validate plugin interactions
   - Setup cross-plugin communication

3. **onDestroy()**: Called on cleanup
   - Remove event listeners
   - Release resources
   - Clear buffers

4. **onError()**: Called when errors occur
   - Log plugin-specific errors
   - Implement retry logic if needed

### 2.2 Logger Implementation

#### Class Structure
```typescript
class Logger implements LoggerInterface {
  private kernel: LogKernel<LogContext>;
  private baseContext: Record<string, unknown>;
  private correlationId?: string;
  private name: string;

  constructor(
    kernel: LogKernel<LogContext>,
    options: Required<LoggerOptions>
  ) {
    this.kernel = kernel;
    this.baseContext = options.context || {};
    this.name = options.name;
  }

  // Logging methods
  private log(level: LogLevel, msgOrObj: string | Error | object, msg?: string): void {
    // Implementation
  }

  trace(msg: string): void;
  trace(obj: object, msg: string): void;
  trace(...args: unknown[]): void { /* implementation */ }

  // Other levels...

  child(context: Record<string, unknown>): Logger {
    const childContext = { ...this.baseContext, ...context };
    const childOptions = { ...this.kernel.context.config, context: childContext };
    return new Logger(this.kernel, childOptions);
  }

  withCorrelation(id: string): Logger {
    const newLogger = new Logger(this.kernel, this.kernel.context.config);
    newLogger.correlationId = id;
    return newLogger;
  }

  // Timing methods
  time(label: string): void {
    this.kernel.context.timings.set(label, Date.now());
  }

  timeEnd(label: string): void {
    const start = this.kernel.context.timings.get(label);
    if (!start) return;
    const duration = Date.now() - start;
    this.kernel.context.timings.delete(label);
    this.info({ duration, unit: 'ms' }, label);
  }

  startTimer(label: string): () => void {
    this.time(label);
    return () => this.timeEnd(label);
  }

  // Plugin management delegates
  use(plugin: LogPlugin): this {
    this.kernel.register(plugin);
    return this;
  }

  unregister(name: string): boolean {
    return this.kernel.unregister(name);
  }

  hasPlugin(name: string): boolean {
    return this.kernel.has(name);
  }

  listPlugins(): LogPlugin[] {
    return this.kernel.list();
  }

  // Lifecycle
  async flush(): Promise<void> {
    await this.kernel.flush();
  }

  async destroy(): Promise<void> {
    await this.kernel.destroy();
  }

  // Level management
  setLevel(level: LogLevel): void {
    this.kernel.context.level = level;
    this.kernel.context.levelValue = LOG_LEVELS[level];
  }

  getLevel(): LogLevel {
    return this.kernel.context.level;
  }

  isLevelEnabled(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= this.kernel.context.levelValue;
  }
}
```

### 2.3 Plugin Implementations

#### levelPlugin
```typescript
export function levelPlugin(): LogPlugin {
  return {
    name: 'level',
    version: '1.0.0',
    install(kernel) {
      kernel.on('log', (entry: LogEntry) => {
        const minValue = kernel.context.levelValue;
        if (entry.level < minValue) {
          // Skip this entry
          return;
        }
      });
    }
  };
}
```

#### formatPlugin
```typescript
export function formatPlugin(): LogPlugin {
  return {
    name: 'format',
    version: '1.0.0',
    install(kernel) {
      kernel.on('format', (entry: LogEntry) => {
        const format = kernel.context.config.format;
        const isDev = typeof process !== 'undefined'
          ? process.env.NODE_ENV !== 'production'
          : false;

        const effectiveFormat = format === 'auto'
          ? (isDev ? 'pretty' : 'json')
          : format;

        if (effectiveFormat === 'json') {
          entry.formatted = JSON.stringify(entry);
        } else {
          entry.formatted = formatPretty(entry);
        }
      });
    }
  };
}
```

#### timestampPlugin
```typescript
export function timestampPlugin(): LogPlugin {
  return {
    name: 'timestamp',
    version: '1.0.0',
    install(kernel) {
      kernel.on('beforeLog', (entry: LogEntry) => {
        if (kernel.context.config.timestamp) {
          entry.time = Date.now();
        }
      });
    }
  };
}
```

#### redactPlugin
```typescript
export function redactPlugin(fields: string[]): LogPlugin {
  return {
    name: 'redact',
    version: '1.0.0',
    install(kernel) {
      kernel.on('beforeLog', (entry: LogEntry) => {
        if (fields.length === 0) return;
        redactFields(entry, fields);
      });
    }
  };
}
```

#### sourcePlugin
```typescript
export function sourcePlugin(): LogPlugin {
  return {
    name: 'source',
    version: '1.0.0',
    install(kernel) {
      kernel.on('beforeLog', (entry: LogEntry) => {
        if (!kernel.context.config.source) return;
        const { file, line, column } = getSourceLocation();
        entry.file = file;
        entry.line = line;
        entry.column = column;
      });
    }
  };
}
```

#### correlationPlugin
```typescript
export function correlationPlugin(): LogPlugin {
  return {
    name: 'correlation',
    version: '1.0.0',
    install(kernel) {
      kernel.on('beforeLog', (entry: LogEntry) => {
        const correlationId = (kernel as any).correlationId;
        if (correlationId) {
          entry.correlationId = correlationId;
        }
      });
    }
  };
}
```

#### timingPlugin
```typescript
export function timingPlugin(): LogPlugin {
  return {
    name: 'timing',
    version: '1.0.0',
    install(kernel) {
      kernel.context.timings = new Map();
    }
  };
}
```

#### bufferPlugin
```typescript
export function bufferPlugin(options: BufferOptions): LogPlugin {
  let buffer: LogEntry[] = [];
  let flushTimer: ReturnType<typeof setInterval> | null = null;

  return {
    name: 'buffer',
    version: '1.0.0',
    install(kernel) {
      const flush = async () => {
        if (buffer.length === 0) return;
        const entries = [...buffer];
        buffer = [];

        for (const transport of kernel.context.transports.values()) {
          if (transport.flush) {
            await transport.flush();
          }
        }
      };

      if (options.flushInterval) {
        flushTimer = setInterval(flush, options.flushInterval);
      }

      kernel.on('log', async (entry: LogEntry) => {
        const sync = kernel.context.config.sync[entry.levelName] ?? false;

        if (sync) {
          // Write directly
          for (const transport of kernel.context.transports.values()) {
            await transport.write(entry);
          }
        } else {
          // Buffer
          buffer.push(entry);
          if (buffer.length >= (options.size || 100)) {
            await flush();
          }
        }
      });
    },
    async onDestroy() {
      if (flushTimer) {
        clearInterval(flushTimer);
      }
      // Final flush
      if (buffer.length > 0) {
        for (const entry of buffer) {
          // Final flush logic
        }
      }
    }
  };
}
```

### 2.4 Transport Implementations

#### Console Transport
```typescript
interface ConsoleTransportOptions {
  colors?: boolean;
  timestamp?: boolean;
  levelColors?: Partial<Record<LogLevel, string>>;
}

export function consoleTransport(options: ConsoleTransportOptions = {}): Transport {
  const { colors = true, timestamp = true, levelColors = {} } = options;

  const defaultColors: Record<LogLevel, string> = {
    trace: 'gray',
    debug: 'blue',
    info: 'cyan',
    warn: 'yellow',
    error: 'red',
    fatal: 'magenta',
  };

  const getLevelColor = (level: LogLevel): string =>
    levelColors[level] || defaultColors[level];

  return {
    name: 'console',
    write(entry: LogEntry) {
      const format = entry.formatted || JSON.stringify(entry);

      if (colors) {
        const colorFn = colorize(getLevelColor(entry.levelName));
        const levelBadge = colorFn(entry.levelName.toUpperCase().padStart(6));
        console.log(`${levelBadge} ${format}`);
      } else {
        console.log(format);
      }
    }
  };
}
```

#### File Transport
```typescript
interface FileTransportOptions {
  path: string;
  rotate?: '1d' | '1h' | 'size' | false;
  maxSize?: string;
  maxFiles?: number;
  compress?: boolean;
}

export function fileTransport(options: FileTransportOptions): Transport {
  const { path, rotate = '1d', maxSize = '10MB', maxFiles = 7, compress = true } = options;

  return {
    name: 'file',
    write(entry: LogEntry) {
      const line = entry.formatted || JSON.stringify(entry);
      // Append to file with newline
      // Handle rotation if needed
    },
    async flush() {
      // Flush any buffered writes
    },
    async destroy() {
      // Close file handle, cleanup rotated files
    },
    supports(env) {
      return env === 'node';
    }
  };
}
```

#### HTTP Transport
```typescript
interface HttpTransportOptions {
  url: string;
  method?: 'POST' | 'PUT';
  headers?: Record<string, string>;
  batch?: number;
  interval?: number;
  retry?: number;
}

export function httpTransport(options: HttpTransportOptions): Transport {
  const { url, method = 'POST', headers = {}, batch = 100, interval = 5000, retry = 3 } = options;

  let buffer: LogEntry[] = [];
  let flushTimer: ReturnType<typeof setInterval> | null = null;

  const sendBatch = async (entries: LogEntry[]): Promise<void> => {
    const payload = JSON.stringify({ entries });

    for (let attempt = 0; attempt < retry; attempt++) {
      try {
        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            ...headers,
          },
          body: payload,
        });

        if (response.ok) return;
      } catch (err) {
        if (attempt === retry - 1) throw err;
        await sleep(Math.pow(2, attempt) * 1000); // Exponential backoff
      }
    }
  };

  return {
    name: 'http',
    async write(entry: LogEntry) {
      buffer.push(entry);
      if (buffer.length >= batch) {
        const entries = [...buffer];
        buffer = [];
        await sendBatch(entries);
      }
    },
    async flush() {
      if (buffer.length > 0) {
        await sendBatch(buffer);
        buffer = [];
      }
    },
    async onDestroy() {
      if (flushTimer) clearInterval(flushTimer);
      await this.flush?.();
    }
  };
}
```

#### Stream Transport
```typescript
interface StreamTransportOptions {
  stream: NodeJS.WritableStream;
}

export function streamTransport(options: StreamTransportOptions): Transport {
  const { stream } = options;

  return {
    name: 'stream',
    write(entry: LogEntry) {
      const line = entry.formatted || JSON.stringify(entry);
      stream.write(line + '\n');
    },
    supports(env) {
      return env === 'node';
    }
  };
}
```

#### localStorage Transport
```typescript
interface LocalStorageTransportOptions {
  key: string;
  maxSize?: string;
  levels?: LogLevel[];
}

export function localStorageTransport(options: LocalStorageTransportOptions): Transport {
  const { key, maxSize = '1MB', levels = ['error', 'fatal'] } = options;

  return {
    name: 'localStorage',
    write(entry: LogEntry) {
      if (!levels.includes(entry.levelName)) return;

      const stored = localStorage.getItem(key);
      const data = stored ? JSON.parse(stored) : { entries: [], metadata: {} };

      data.entries.push(entry);

      // Enforce size limit
      while (getStorageSize(data) > parseSize(maxSize)) {
        data.entries.shift();
      }

      localStorage.setItem(key, JSON.stringify(data));
    },
    supports(env) {
      return env === 'browser';
    }
  };
}
```

## 3. Utility Implementations

### 3.1 ANSI Color System

Custom color implementation without external dependencies:

```typescript
const ANSI_CODES = {
  foreground: {
    black: 30, red: 31, green: 32, yellow: 33, blue: 34,
    magenta: 35, cyan: 36, white: 37, gray: 90,
  },
  background: {
    black: 40, red: 41, green: 42, yellow: 43, blue: 44,
    magenta: 45, cyan: 46, white: 47,
  },
  styles: {
    reset: 0, bold: 1, dim: 2, italic: 3, underline: 4,
  },
};

export function colorize(color: string) {
  return (text: string): string => {
    const code = ANSI_CODES.foreground[color as keyof typeof ANSI_CODES.foreground];
    return `\x1b[${code}m${text}\x1b[0m`;
  };
}

export function style(styleName: string) {
  return (text: string): string => {
    const code = ANSI_CODES.styles[styleName as keyof typeof ANSI_CODES.styles];
    return `\x1b[${code}m${text}\x1b[0m`;
  };
}
```

### 3.2 Stack Trace Parsing

```typescript
export function getSourceLocation(): { file: string; line: number; column: number } {
  const stack = new Error().stack;
  if (!stack) return { file: 'unknown', line: 0, column: 0 };

  // Skip internal frames
  const lines = stack.split('\n').slice(3);

  // Parse V8 format: "at functionName (file:line:col)" or "at file:line:col"
  const line = lines[0];
  const match = line.match(/\(([^)]+):(\d+):(\d+)\)/) || line.match(/at\s+([^:]+):(\d+):(\d+)/);

  if (match) {
    const [, file, lineStr, colStr] = match;
    return {
      file,
      line: parseInt(lineStr, 10),
      column: parseInt(colStr, 10),
    };
  }

  return { file: 'unknown', line: 0, column: 0 };
}
```

### 3.3 Redaction

```typescript
export function redactFields(obj: unknown, fields: string[]): unknown {
  if (!fields || fields.length === 0) return obj;

  const fieldSet = new Set(fields);

  const redact = (value: unknown): unknown => {
    if (typeof value !== 'object' || value === null) {
      return value;
    }

    if (Array.isArray(value)) {
      return value.map(redact);
    }

    const result: Record<string, unknown> = {};

    for (const [key, val] of Object.entries(value)) {
      if (fieldSet.has(key)) {
        result[key] = '[REDACTED]';
      } else {
        result[key] = redact(val);
      }
    }

    return result;
  };

  return redact(obj);
}
```

### 3.4 Pretty Formatting

```typescript
export function formatPretty(entry: LogEntry): string {
  const timestamp = entry.time
    ? `[${new Date(entry.time).toISOString().replace('T', ' ').slice(0, 19)}]`
    : '';

  const level = entry.levelName.toUpperCase().padStart(6);

  let output = '';
  if (timestamp) output += `${timestamp} `;
  output += `${level} `;
  output += entry.msg;

  // Add metadata (except standard fields)
  const metadata = Object.entries(entry).filter(
    ([key]) => !['level', 'levelName', 'time', 'msg', 'name', 'formatted'].includes(key)
  );

  if (metadata.length > 0) {
    const metaObj = Object.fromEntries(metadata);
    output += '\n' + JSON.stringify(metaObj, null, 2);
  }

  return output;
}
```

### 3.5 Environment Detection

```typescript
export const isNode = typeof process !== 'undefined' && !!process.versions?.node;
export const isBrowser = typeof window !== 'undefined';

export function isDev(): boolean {
  if (isNode) {
    return process.env.NODE_ENV !== 'production';
  }
  return true; // Browser: default to dev
}
```

## 4. Build Configuration

### 4.1 tsup Configuration

```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'plugins/index': 'src/plugins/index.ts',
    'transports/index': 'src/transports/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: [],
  treeshake: true,
  minify: false,
});
```

### 4.2 TypeScript Configuration

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022"],
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "outDir": "./dist"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

## 5. Testing Strategy

### 5.1 Test Structure

```
tests/
├── unit/
│   ├── kernel.test.ts
│   ├── logger.test.ts
│   ├── plugins/
│   │   ├── level.test.ts
│   │   ├── format.test.ts
│   │   └── ...
│   ├── transports/
│   │   ├── console.test.ts
│   │   └── ...
│   └── utils/
│       ├── colors.test.ts
│       └── ...
├── integration/
│   ├── child-loggers.test.ts
│   ├── multi-transport.test.ts
│   └── browser.test.ts
└── fixtures/
    └── mock-transport.ts
```

### 5.2 Coverage Thresholds

```typescript
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['tests/**', 'examples/**', 'website/**'],
      thresholds: {
        lines: 100,
        functions: 100,
        branches: 100,
        statements: 100,
      },
    },
  },
});
```

### 5.3 Mock Transport for Testing

```typescript
export function mockTransport(): Transport {
  const entries: LogEntry[] = [];

  return {
    name: 'mock',
    write(entry: LogEntry) {
      entries.push(entry);
    },
    flush() {
      return Promise.resolve();
    },
    destroy() {
      return Promise.resolve();
    },
    getEntries() {
      return [...entries];
    },
    clear() {
      entries.length = 0;
    }
  };
}
```

## 6. Browser Support Details

### 6.1 Console Mapping

```typescript
const consoleMethods: Record<LogLevel, keyof Console> = {
  trace: 'debug',
  debug: 'debug',
  info: 'log',
  warn: 'warn',
  error: 'error',
  fatal: 'error',
};

function consoleWrite(entry: LogEntry) {
  const method = consoleMethods[entry.levelName];
  console[method](entry.msg, entry);
}
```

### 6.2 DevTools Grouping

```typescript
let currentGroup: string | null = null;

function logWithGroup(entry: LogEntry, groupName?: string) {
  if (groupName && groupName !== currentGroup) {
    if (currentGroup) console.groupEnd();
    console.group(groupName);
    currentGroup = groupName;
  }
  console.log(entry);
}

function closeGroup() {
  if (currentGroup) {
    console.groupEnd();
    currentGroup = null;
  }
}
```

## 7. Performance Optimizations

### 7.1 Lazy Initialization

Only initialize transports when first log is written.

### 7.2 Buffer Pool

Pre-allocate buffer array for async logging to avoid GC pressure.

### 7.3 String Building

Use string builder pattern instead of concatenation in hot paths.

### 7.4 Minimal Allocations

Reuse objects where possible, avoid creating intermediate objects.

## 8. Error Handling Strategy

### 8.1 Error Boundary

```typescript
class ErrorBoundary {
  private handlers: Set<(error: Error) => void> = new Set();

  onError(error: Error) {
    for (const handler of this.handlers) {
      try {
        handler(error);
      } catch (err) {
        // Prevent infinite loops
        console.error('Error in error handler:', err);
      }
    }
  }

  onError(handler: (error: Error) => void) {
    this.handlers.add(handler);
  }
}
```

### 8.2 Graceful Degradation

If a transport fails, log the error but continue with other transports.

### 8.3 Non-Throwing API

Logging methods never throw; errors are handled internally.

## 9. Swappable Plugin Design

All plugins implement standard interfaces, allowing external packages to replace them:

```typescript
// Internal plugin
import { redactPlugin } from '@oxog/log/plugins';
log.use(redactPlugin(['password', 'token']));

// External package (drop-in replacement)
import { advancedRedact } from '@oxog/redact';
log.use(advancedRedact({
  fields: ['password', 'token'],
  strategy: 'hash', // Additional features!
}));
```

The interface is identical, making migrations seamless.

## 10. Build Outputs

### 10.1 File Structure

```
dist/
├── index.js              # ESM main
├── index.cjs             # CJS main
├── index.d.ts            # ESM types
├── index.d.cts           # CJS types
├── plugins/
│   ├── index.js
│   ├── index.cjs
│   ├── index.d.ts
│   └── index.d.cts
├── transports/
│   ├── index.js
│   ├── index.cjs
│   ├── index.d.ts
│   └── index.d.cts
└── *.js.map              # Source maps
```

### 10.2 Package Exports

```json
{
  "exports": {
    ".": {
      "import": { "types": "./dist/index.d.ts", "default": "./dist/index.js" },
      "require": { "types": "./dist/index.d.cts", "default": "./dist/index.cjs" }
    },
    "./plugins": {
      "import": { "types": "./dist/plugins/index.d.ts", "default": "./dist/plugins/index.js" },
      "require": { "types": "./dist/plugins/index.d.cts", "default": "./dist/plugins/index.cjs" }
    },
    "./transports": {
      "import": { "types": "./dist/transports/index.d.ts", "default": "./dist/transports/index.js" },
      "require": { "types": "./dist/transports/index.d.cts", "default": "./dist/transports/index.cjs" }
    }
  }
}
```
