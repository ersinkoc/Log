# Log - @oxog NPM Package

## Package Identity

| Field | Value |
|-------|-------|
| **npm** | `@oxog/log` |
| **GitHub** | `https://github.com/ersinkoc/log` |
| **Website** | `https://log.oxog.dev` |
| **Author** | Ersin Koç |
| **License** | MIT |

> NO social media, Discord, email, or external links.

---

## Description

**One-line:** Blazing fast, plugin-based logging with @oxog ecosystem integration, colored output, and swappable transports.

@oxog/log is a high-performance logging library built on @oxog/plugin's micro-kernel architecture. It combines Pino's speed with Winston's flexibility through a true plugin system. Features include swappable transports, hybrid sync/async logging, source file location tracking (unique among loggers), native browser DevTools integration, and beautiful colored output via @oxog/pigment.

---

## @oxog Dependencies

This package uses the following @oxog packages:

### @oxog/types

Provides the core type definitions:
- `Plugin<TContext>` - Plugin interface
- `Kernel<TContext>` - Kernel interface
- `EventMap` - Event type definitions
- `MaybePromise` - Sync/async return type

```typescript
import type { Plugin, Kernel, EventMap, MaybePromise } from '@oxog/types';
```

### @oxog/plugin

Provides the micro-kernel implementation:
- `createKernel()` - Kernel factory
- `definePlugin()` - Plugin factory helper
- Lifecycle management (install → init → destroy)
- Event bus for plugin communication

```typescript
import { createKernel, definePlugin } from '@oxog/plugin';
```

### @oxog/pigment

Provides terminal coloring for pretty output:
- ANSI color codes for terminal
- Browser console CSS styling
- Semantic colors (success, error, warning, info)

```typescript
import { pigment } from '@oxog/pigment';
import { pigmentPlugin } from '@oxog/pigment/plugins';
```

### @oxog/emitter

Provides standalone event emitter for log events:
- Type-safe log event emission
- Subscribe to log events externally
- Wildcard event support

```typescript
import { createEmitter } from '@oxog/emitter';
```

---

## NON-NEGOTIABLE RULES

### 1. DEPENDENCY POLICY

```json
{
  "dependencies": {
    "@oxog/types": "^1.0.0",
    "@oxog/plugin": "^1.0.0",
    "@oxog/pigment": "^1.0.0",
    "@oxog/emitter": "^1.0.0"
  }
}
```

- ONLY `@oxog/*` packages allowed as runtime dependencies
- NO external packages (pino, winston, chalk, etc.)
- Implement transports, formatting from scratch

**Allowed devDependencies:**
```json
{
  "devDependencies": {
    "typescript": "^5.0.0",
    "vitest": "^2.0.0",
    "@vitest/coverage-v8": "^2.0.0",
    "tsup": "^8.0.0",
    "@types/node": "^20.0.0",
    "prettier": "^3.0.0",
    "eslint": "^9.0.0"
  }
}
```

### 2. 100% TEST COVERAGE

- Every line, branch, function tested
- All tests must pass
- Use Vitest
- Thresholds enforced in config

### 3. USE @oxog/plugin KERNEL

**CRITICAL**: Use `@oxog/plugin` for micro-kernel — DO NOT implement your own kernel!

```typescript
import { createKernel } from '@oxog/plugin';
import { pigmentPlugin } from '@oxog/pigment/plugins';
import type { Plugin } from '@oxog/types';

export function createLogger(options?: LoggerOptions) {
  const kernel = createKernel<LogContext>({
    context: { /* log-specific context */ }
  });
  
  // Use pigment for colors
  kernel.use(pigmentPlugin());
  
  // Register log plugins
  kernel.use(levelsPlugin);
  kernel.use(formatterPlugin);
  // ...
  
  return kernel;
}
```

### 4. SWAPPABLE PLUGIN DESIGN

All internal plugins must implement standard interfaces:

```typescript
// Today (in-house plugin)
import { consoleTransport } from '@oxog/log/transports';
log.use(consoleTransport());

// Tomorrow (external package - drop-in replacement)
import { elasticTransport } from '@oxog/log-elastic';
log.use(elasticTransport()); // Same interface!
```

### 5. DEVELOPMENT WORKFLOW

Create these documents FIRST:

1. **SPECIFICATION.md** - Complete spec
2. **IMPLEMENTATION.md** - Architecture
3. **TASKS.md** - Ordered task list

Only then implement code following TASKS.md.

### 6. TYPESCRIPT STRICT MODE

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler"
  }
}
```

### 7. LLM-NATIVE DESIGN

- `llms.txt` file (< 2000 tokens)
- Predictable API naming
- Rich JSDoc with @example
- Minimum 15 examples
- README optimized for LLMs

---

## CORE FEATURES

### 1. createLogger() Factory

Create a logger instance using @oxog/plugin kernel.

```typescript
import { createLogger } from '@oxog/log';

// Simple usage (sensible defaults)
const log = createLogger();
log.info('Hello world');

// With configuration
const log = createLogger({
  level: 'debug',
  format: 'pretty',     // 'json' | 'pretty' | 'auto'
  colors: true,
  timestamp: true,
});

// With transports
import { consoleTransport, fileTransport } from '@oxog/log/transports';

const log = createLogger({
  transports: [
    consoleTransport({ colors: true }),
    fileTransport({ path: './logs/app.log' })
  ]
});
```

### 2. Six Log Levels

Standard severity levels with numeric values for filtering.

```typescript
log.trace('Detailed debugging');  // 10
log.debug('Debug information');   // 20
log.info('Informational');        // 30
log.warn('Warning');              // 40
log.error('Error occurred');      // 50
log.fatal('Fatal error');         // 60

// Set minimum level
const log = createLogger({ level: 'warn' }); // Only warn, error, fatal
```

### 3. Structured Logging

Attach metadata objects to log entries.

```typescript
log.info({ userId: 123, action: 'login' }, 'User logged in');
// JSON: {"level":30,"time":1234567890,"userId":123,"action":"login","msg":"User logged in"}
// Pretty: [14:30:22] INFO  User logged in { userId: 123, action: 'login' }

// Error with stack trace
log.error({ err: new Error('Connection failed') }, 'Database error');
```

### 4. Child Loggers (Scoped)

Create loggers with bound context.

```typescript
const dbLog = log.child({ module: 'database' });
dbLog.info('Connected');
// Output includes: {"module":"database","msg":"Connected"}

const queryLog = dbLog.child({ operation: 'select' });
queryLog.debug('Executing query');
// Output includes: {"module":"database","operation":"select","msg":"Executing query"}
```

### 5. Colored Output via @oxog/pigment

Beautiful colors using the ecosystem's color library.

```typescript
import { createLogger } from '@oxog/log';

const log = createLogger({ 
  format: 'pretty',
  colors: true  // Uses @oxog/pigment
});

log.info('Info message');    // Blue
log.warn('Warning');         // Yellow
log.error('Error!');         // Red
log.debug('Debug');          // Gray
log.success('Done!');        // Green (via semantic colors)
```

### 6. Correlation ID (Request Tracing)

Track requests across async operations.

```typescript
const reqLog = log.withCorrelation('req-abc-123');
reqLog.info('Request received');
reqLog.info('Processing');
reqLog.info('Response sent');
// All entries have: {"correlationId":"req-abc-123",...}

// Auto-generate correlation ID
const reqLog = log.withCorrelation();
// Uses generated ID like: "cid_1a2b3c4d"
```

### 7. Source Location (UNIQUE Feature!)

Automatically capture file and line number.

```typescript
const log = createLogger({ source: true });
log.info('Debug me');
// Output: {"level":30,"file":"server.ts","line":42,"msg":"Debug me"}

// Pretty format
// [14:30:22] INFO  server.ts:42 Debug me
```

### 8. Performance Timing

Built-in timing utilities.

```typescript
// Simple timing
log.time('db-query');
await database.query('SELECT * FROM users');
log.timeEnd('db-query');
// Output: {"msg":"db-query","duration":45,"unit":"ms"}

// With callback
const result = await log.timeAsync('api-call', async () => {
  return await fetch('/api/data');
});

// Timer function
const end = log.startTimer('process');
await doWork();
end(); // Automatically logs duration
```

### 9. Redaction (Sensitive Data Masking)

Automatically mask sensitive fields.

```typescript
const log = createLogger({
  redact: ['password', 'token', 'creditCard', 'ssn'],
});

log.info({ user: 'ersin', password: 'secret123' });
// Output: {"user":"ersin","password":"[REDACTED]"}

// Nested paths
const log = createLogger({
  redact: ['user.password', 'headers.authorization'],
});
```

### 10. Multiple Output Formats

JSON for production, Pretty for development.

```typescript
// Auto-detect based on NODE_ENV and TTY
const log = createLogger({ format: 'auto' });

// Explicit JSON (production)
const log = createLogger({ format: 'json' });
// {"level":30,"time":1234567890,"msg":"Hello"}

// Explicit Pretty (development)
const log = createLogger({ format: 'pretty' });
// [2024-01-15 14:30:22] INFO  Hello
```

### 11. Multiple Transports

Send logs to multiple destinations.

```typescript
import { createLogger } from '@oxog/log';
import { 
  consoleTransport, 
  fileTransport, 
  httpTransport,
  streamTransport 
} from '@oxog/log/transports';

const log = createLogger({
  transports: [
    consoleTransport({ colors: true }),
    fileTransport({ 
      path: './logs/app.log', 
      rotate: '1d', 
      maxSize: '10MB' 
    }),
    httpTransport({ 
      url: 'https://logs.example.com/ingest', 
      batch: 100 
    }),
  ],
});
```

### 12. Log Events via @oxog/emitter

Subscribe to log events programmatically.

```typescript
import { createLogger } from '@oxog/log';

const log = createLogger();

// Subscribe to all log events
log.on('log', (entry) => {
  // Send to external service
  analytics.track('log', entry);
});

// Subscribe to specific levels
log.on('log:error', (entry) => {
  alertTeam(entry);
});

log.on('log:fatal', (entry) => {
  shutdownGracefully();
});

// Wildcard patterns
log.on('log:*', (level, entry) => {
  console.log(`[${level}]`, entry.msg);
});
```

### 13. Browser Support

Native DevTools integration.

```typescript
// Automatic console method mapping
log.info('Hello');   // → console.log (with styling)
log.warn('Careful'); // → console.warn
log.error('Oops');   // → console.error

// Child loggers use console.group
const child = log.child({ component: 'Auth' });
child.info('Checking token');  // Grouped in DevTools
child.info('Token valid');

// Optional localStorage persistence
import { localStorageTransport } from '@oxog/log/transports';
log.use(localStorageTransport({ 
  key: 'app-logs', 
  maxSize: '1MB',
  levels: ['error', 'fatal'],
}));
```

### 14. Hybrid Sync/Async Logging

Level-based synchronization for optimal performance.

```typescript
const log = createLogger({
  sync: {
    fatal: true,   // Always sync - critical
    error: true,   // Always sync - important
    warn: false,   // Async - buffered
    info: false,   // Async - buffered
    debug: false,  // Async - buffered
    trace: false,  // Async - buffered
  },
  buffer: {
    size: 100,        // Buffer up to 100 entries
    flushInterval: 1000, // Flush every 1s
  },
});

// Manual flush
await log.flush();
```

---

## PLUGIN SYSTEM

### Using @oxog/plugin Interface

All plugins follow the standard @oxog/plugin interface:

```typescript
import type { Plugin } from '@oxog/types';
import { definePlugin } from '@oxog/plugin';

interface LogContext {
  level: LogLevel;
  format: Format;
  transports: Transport[];
  // ...
}

// Define a transport plugin
export const myTransportPlugin = definePlugin<LogContext>((options) => ({
  name: 'my-transport',
  version: '1.0.0',
  
  install(kernel) {
    const ctx = kernel.getContext();
    
    // Add transport
    ctx.transports.push({
      name: 'my-transport',
      write: (entry) => {
        // Send log entry somewhere
        sendToService(entry);
      }
    });
    
    // Listen to log events
    kernel.on('log', (entry) => {
      // Process entry
    });
  },
  
  async onDestroy() {
    // Cleanup, flush buffers
    await flushPendingLogs();
  }
}));
```

### Core Plugins (Always Loaded)

| Plugin | Description |
|--------|-------------|
| `levelsPlugin` | Log level management (trace, debug, info, warn, error, fatal) |
| `formatterPlugin` | JSON and pretty formatting |
| `timestampPlugin` | Timestamp generation |
| `contextPlugin` | Child logger context management |
| `redactionPlugin` | Sensitive data masking |
| `sourcePlugin` | Source file/line tracking |
| `bufferPlugin` | Async buffering and flushing |

### Built-in Transports

| Transport | Description |
|-----------|-------------|
| `consoleTransport` | Console output with colors (via @oxog/pigment) |
| `fileTransport` | File output with rotation (Node.js only) |
| `streamTransport` | Node.js stream output |
| `httpTransport` | HTTP POST batching |
| `localStorageTransport` | Browser localStorage (browser only) |

### Optional Plugins

| Plugin | Description |
|--------|-------------|
| `correlationPlugin` | Correlation ID tracking |
| `timingPlugin` | Performance timing utilities |
| `metricsPlugin` | Log metrics collection |
| `filterPlugin` | Advanced log filtering |
| `transformPlugin` | Log entry transformation |

### Exported Plugins (For Ecosystem)

Log exports a plugin for other @oxog packages:

```typescript
// In @oxog/cli or other packages
import { logPlugin } from '@oxog/log/plugins';

const cli = createCli();
cli.use(logPlugin({ level: 'debug' }));

// Now cli has logging
cli.log.info('CLI started');
```

---

## API DESIGN

### Main Exports

```typescript
// Factory function
export function createLogger(options?: LoggerOptions): Logger;

// Default instance (singleton)
export const log: Logger;

// Transports
export { consoleTransport } from './transports/console';
export { fileTransport } from './transports/file';
export { streamTransport } from './transports/stream';
export { httpTransport } from './transports/http';
export { localStorageTransport } from './transports/localStorage';

// Plugins
export { logPlugin } from './plugins/ecosystem';

// Type re-exports
export type { Plugin } from '@oxog/types';
```

### Type Definitions

```typescript
import type { Plugin, Kernel, EventMap } from '@oxog/types';
import type { Emitter } from '@oxog/emitter';

/**
 * Log levels with numeric values.
 */
export enum LogLevel {
  Trace = 10,
  Debug = 20,
  Info = 30,
  Warn = 40,
  Error = 50,
  Fatal = 60
}

/**
 * Log level names.
 */
export type LogLevelName = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

/**
 * Output format.
 */
export type Format = 'json' | 'pretty' | 'auto';

/**
 * Log entry structure.
 */
export interface LogEntry {
  level: LogLevel;
  levelName: LogLevelName;
  time: number;
  msg: string;
  [key: string]: unknown;
  
  // Optional fields
  file?: string;
  line?: number;
  correlationId?: string;
  duration?: number;
  err?: {
    message: string;
    stack?: string;
    name: string;
  };
}

/**
 * Transport interface.
 */
export interface Transport {
  name: string;
  write(entry: LogEntry): MaybePromise<void>;
  flush?(): MaybePromise<void>;
  close?(): MaybePromise<void>;
}

/**
 * Logger configuration options.
 */
export interface LoggerOptions {
  /** Minimum log level (default: 'info') */
  level?: LogLevelName;
  
  /** Output format (default: 'auto') */
  format?: Format;
  
  /** Enable colors (default: true) */
  colors?: boolean;
  
  /** Include timestamp (default: true) */
  timestamp?: boolean;
  
  /** Include source location (default: false) */
  source?: boolean;
  
  /** Fields to redact */
  redact?: string[];
  
  /** Transports to use */
  transports?: Transport[];
  
  /** Additional plugins */
  plugins?: Plugin<LogContext>[];
  
  /** Sync settings per level */
  sync?: Partial<Record<LogLevelName, boolean>>;
  
  /** Buffer settings */
  buffer?: {
    size?: number;
    flushInterval?: number;
  };
}

/**
 * Log context shared between plugins.
 */
export interface LogContext {
  level: LogLevel;
  format: Format;
  colors: boolean;
  transports: Transport[];
  redactPaths: string[];
  bindings: Record<string, unknown>;
  pigment: PigmentInstance;
  emitter: Emitter<LogEvents>;
}

/**
 * Log events for subscription.
 */
export interface LogEvents extends EventMap {
  'log': LogEntry;
  'log:trace': LogEntry;
  'log:debug': LogEntry;
  'log:info': LogEntry;
  'log:warn': LogEntry;
  'log:error': LogEntry;
  'log:fatal': LogEntry;
  'flush': void;
  'close': void;
}

/**
 * Logger instance.
 */
export interface Logger extends Kernel<LogContext> {
  // Log methods
  trace(msg: string): void;
  trace(obj: object, msg?: string): void;
  debug(msg: string): void;
  debug(obj: object, msg?: string): void;
  info(msg: string): void;
  info(obj: object, msg?: string): void;
  warn(msg: string): void;
  warn(obj: object, msg?: string): void;
  error(msg: string): void;
  error(obj: object, msg?: string): void;
  fatal(msg: string): void;
  fatal(obj: object, msg?: string): void;
  
  // Child loggers
  child(bindings: Record<string, unknown>): Logger;
  
  // Correlation
  withCorrelation(id?: string): Logger;
  
  // Timing
  time(label: string): void;
  timeEnd(label: string): void;
  timeAsync<T>(label: string, fn: () => Promise<T>): Promise<T>;
  startTimer(label: string): () => void;
  
  // Event subscription (via @oxog/emitter)
  on<K extends keyof LogEvents>(event: K, handler: (payload: LogEvents[K]) => void): Unsubscribe;
  
  // Control
  flush(): Promise<void>;
  close(): Promise<void>;
  
  // Level management
  setLevel(level: LogLevelName): void;
  getLevel(): LogLevelName;
  isLevelEnabled(level: LogLevelName): boolean;
}
```

---

## INTERNAL ARCHITECTURE

### Core Modules

```
src/
├── index.ts              # Public exports
├── logger.ts             # createLogger factory
├── entry.ts              # Log entry creation
├── levels.ts             # Level management
├── formatters/
│   ├── index.ts
│   ├── json.ts           # JSON formatter
│   └── pretty.ts         # Pretty formatter (uses @oxog/pigment)
├── transports/
│   ├── index.ts
│   ├── console.ts        # Console transport
│   ├── file.ts           # File transport (Node.js)
│   ├── stream.ts         # Stream transport
│   ├── http.ts           # HTTP transport
│   └── localStorage.ts   # Browser localStorage
├── plugins/
│   ├── index.ts
│   ├── core/
│   │   ├── levels.ts
│   │   ├── formatter.ts
│   │   ├── timestamp.ts
│   │   ├── context.ts
│   │   ├── redaction.ts
│   │   ├── source.ts
│   │   └── buffer.ts
│   ├── optional/
│   │   ├── correlation.ts
│   │   ├── timing.ts
│   │   ├── metrics.ts
│   │   ├── filter.ts
│   │   └── transform.ts
│   └── ecosystem/
│       └── log-plugin.ts # Export for other packages
└── types.ts
```

### Using @oxog Ecosystem

```typescript
// src/logger.ts
import { createKernel } from '@oxog/plugin';
import { pigmentPlugin } from '@oxog/pigment/plugins';
import { createEmitter } from '@oxog/emitter';
import type { Plugin } from '@oxog/types';

import { levelsPlugin, formatterPlugin, /* ... */ } from './plugins/core';
import { consoleTransport } from './transports/console';

export function createLogger(options: LoggerOptions = {}): Logger {
  // Create emitter for log events
  const emitter = createEmitter<LogEvents>();
  
  // Create kernel using @oxog/plugin
  const kernel = createKernel<LogContext>({
    context: {
      level: parseLevel(options.level ?? 'info'),
      format: options.format ?? 'auto',
      colors: options.colors ?? true,
      transports: options.transports ?? [consoleTransport()],
      redactPaths: options.redact ?? [],
      bindings: {},
      pigment: null!, // Set by pigmentPlugin
      emitter,
    }
  });
  
  // Use pigment for colors
  kernel.use(pigmentPlugin({ enabled: options.colors }));
  
  // Register core plugins
  kernel.use(levelsPlugin);
  kernel.use(formatterPlugin);
  kernel.use(timestampPlugin);
  kernel.use(contextPlugin);
  kernel.use(redactionPlugin);
  
  if (options.source) {
    kernel.use(sourcePlugin);
  }
  
  kernel.use(bufferPlugin(options.buffer));
  
  // Register optional plugins
  if (options.plugins) {
    for (const plugin of options.plugins) {
      kernel.use(plugin);
    }
  }
  
  // Initialize kernel
  kernel.init();
  
  // Create logger interface
  return createLoggerInterface(kernel);
}
```

---

## TECHNICAL REQUIREMENTS

| Requirement | Value |
|-------------|-------|
| Runtime | Universal (Node.js + Browser) |
| Module Format | ESM + CJS |
| Node.js | >= 18 |
| TypeScript | >= 5.0 |
| Bundle (core) | < 8KB gzipped |
| Bundle (all) | < 15KB gzipped |

---

## PROJECT STRUCTURE

```
log/
├── .github/workflows/
│   ├── deploy.yml
│   └── publish.yml
├── src/
│   ├── index.ts
│   ├── logger.ts
│   ├── entry.ts
│   ├── levels.ts
│   ├── types.ts
│   ├── formatters/
│   │   ├── index.ts
│   │   ├── json.ts
│   │   └── pretty.ts
│   ├── transports/
│   │   ├── index.ts
│   │   ├── console.ts
│   │   ├── file.ts
│   │   ├── stream.ts
│   │   ├── http.ts
│   │   └── localStorage.ts
│   └── plugins/
│       ├── index.ts
│       ├── core/
│       ├── optional/
│       └── ecosystem/
├── tests/
│   ├── unit/
│   │   ├── logger.test.ts
│   │   ├── entry.test.ts
│   │   ├── levels.test.ts
│   │   ├── formatters/
│   │   ├── transports/
│   │   └── plugins/
│   ├── integration/
│   │   ├── child-loggers.test.ts
│   │   ├── multi-transport.test.ts
│   │   ├── ecosystem.test.ts
│   │   └── browser.test.ts
│   └── fixtures/
├── examples/
│   ├── 01-basic/
│   ├── 02-structured/
│   ├── 03-child-loggers/
│   ├── 04-transports/
│   ├── 05-colors/
│   ├── 06-redaction/
│   ├── 07-source-location/
│   ├── 08-correlation/
│   ├── 09-timing/
│   ├── 10-events/
│   ├── 11-browser/
│   ├── 12-file-rotation/
│   ├── 13-http-batch/
│   ├── 14-custom-transport/
│   └── 15-real-world/
├── website/
│   ├── public/CNAME
│   └── src/
├── llms.txt
├── SPECIFICATION.md
├── IMPLEMENTATION.md
├── TASKS.md
├── README.md
├── package.json
├── tsconfig.json
├── tsup.config.ts
├── vitest.config.ts
├── .prettierrc
├── eslint.config.js
└── .gitignore
```

---

## GITHUB WORKFLOWS

### deploy.yml (Website)

```yaml
name: Deploy Website

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run test:coverage
      - run: npm run build
      - working-directory: ./website
        run: npm ci && npm run build
      - uses: actions/configure-pages@v4
      - uses: actions/upload-pages-artifact@v3
        with:
          path: './website/dist'
  
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - uses: actions/deploy-pages@v4
        id: deployment
```

### publish.yml (npm)

```yaml
name: Publish to npm

on:
  push:
    tags: ['v*']

permissions:
  contents: read
  id-token: write

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'
      - run: npm ci
      - run: npm run test:coverage
      - run: npm run build
      - run: npm publish --provenance --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

---

## WEBSITE REQUIREMENTS

- React 19 + Vite 6 + Tailwind CSS v4
- @oxog/codeshine for syntax highlighting
- shadcn/ui components
- Lucide React icons
- JetBrains Mono + Inter fonts
- CNAME: log.oxog.dev
- Footer: "Made with ❤️ by Ersin KOÇ"
- GitHub link only (no social media)

### Pages Required

1. **Home** - Hero, quick start, features
2. **Getting Started** - Installation, basic usage
3. **Log Levels** - Level configuration and filtering
4. **Structured Logging** - Metadata, child loggers
5. **Transports** - Console, file, HTTP, custom
6. **Formatting** - JSON vs Pretty, colors
7. **Advanced** - Redaction, correlation, timing
8. **Browser** - DevTools integration
9. **Plugins** - Plugin system, creating plugins
10. **API Reference** - Full API documentation
11. **Playground** - Live log testing

---

## IMPLEMENTATION CHECKLIST

### Before Starting
- [ ] Create SPECIFICATION.md
- [ ] Create IMPLEMENTATION.md
- [ ] Create TASKS.md

### During Implementation
- [ ] Follow TASKS.md sequentially
- [ ] Write tests with each feature
- [ ] Maintain 100% coverage
- [ ] JSDoc on every public API

### Core Features
- [ ] Use @oxog/plugin kernel (NOT custom kernel)
- [ ] Use @oxog/pigment for colors
- [ ] Use @oxog/emitter for log events
- [ ] Six log levels
- [ ] Structured logging
- [ ] Child loggers
- [ ] JSON and Pretty formatters
- [ ] Source file/line tracking
- [ ] Correlation ID
- [ ] Performance timing
- [ ] Redaction
- [ ] Async buffering

### Transports
- [ ] consoleTransport (with colors)
- [ ] fileTransport (with rotation)
- [ ] streamTransport
- [ ] httpTransport (with batching)
- [ ] localStorageTransport (browser)

### Plugins
- [ ] Core plugins
- [ ] Optional plugins
- [ ] logPlugin (ecosystem export)

### Package Completion
- [ ] All tests passing (100%)
- [ ] Coverage at 100%
- [ ] No TypeScript errors
- [ ] Package builds
- [ ] Works in Node.js
- [ ] Works in Browser

### Final
- [ ] `npm run build` succeeds
- [ ] `npm run test:coverage` shows 100%
- [ ] Website builds
- [ ] All examples run
- [ ] Ecosystem integration tested

---

## COMPETITIVE ADVANTAGES

| Feature | Pino | Winston | Bunyan | @oxog/log |
|---------|------|---------|--------|-----------|
| Speed | ⚡⚡⚡ | ⚡ | ⚡⚡ | ⚡⚡⚡ |
| Source file:line | ❌ | ❌ | ❌ | ✅ |
| Plugin system | ❌ | ❌ | ❌ | ✅ (@oxog/plugin) |
| Ecosystem integration | ❌ | ❌ | ❌ | ✅ |
| Swappable transports | ❌ | ~ | ❌ | ✅ |
| Zero external deps | ✅ | ❌ | ❌ | ✅ (only @oxog/*) |
| Browser native | ❌ | ❌ | ❌ | ✅ |
| Micro-kernel | ❌ | ❌ | ❌ | ✅ |
| Correlation ID | Plugin | Plugin | ✅ | ✅ Built-in |
| Redaction | ✅ | Plugin | ❌ | ✅ Built-in |
| TypeScript | ✅ | ✅ | ~ | ✅ Strict |
| Colors | Plugin | Plugin | ❌ | ✅ (@oxog/pigment) |
| Log events | ❌ | ❌ | ❌ | ✅ (@oxog/emitter) |

---

## ECOSYSTEM INTEGRATION EXAMPLES

### Using with @oxog/cli

```typescript
import { createCli } from '@oxog/cli';
import { logPlugin } from '@oxog/log/plugins';

const cli = createCli();
cli.use(logPlugin({ level: 'debug', colors: true }));

cli.command('build', async (ctx) => {
  ctx.log.info('Starting build...');
  // ...
  ctx.log.success('Build complete!');
});
```

### Using with @oxog/pigment

```typescript
import { createLogger } from '@oxog/log';
import { semanticPlugin } from '@oxog/pigment/plugins';

const log = createLogger({
  plugins: [
    // Additional pigment features
  ]
});

// Pigment is already integrated, colors work automatically
log.info('This is blue');
log.error('This is red');
```

### Custom Transport Plugin

```typescript
import type { Plugin } from '@oxog/types';
import { definePlugin } from '@oxog/plugin';

export const elasticTransport = definePlugin<LogContext>((options: {
  url: string;
  index: string;
}) => ({
  name: 'elastic-transport',
  version: '1.0.0',
  
  install(kernel) {
    const ctx = kernel.getContext();
    
    ctx.transports.push({
      name: 'elastic',
      async write(entry) {
        await fetch(options.url, {
          method: 'POST',
          body: JSON.stringify({
            ...entry,
            '@timestamp': new Date(entry.time).toISOString(),
          })
        });
      }
    });
  }
}));
```

---

## BEGIN IMPLEMENTATION

Start with **SPECIFICATION.md**, then **IMPLEMENTATION.md**, then **TASKS.md**.

Only after all three documents are complete, implement code following TASKS.md sequentially.

**Remember:**
- Production-ready for npm publish
- Use @oxog/types, @oxog/plugin, @oxog/pigment, @oxog/emitter
- DON'T implement own kernel — use @oxog/plugin
- 100% test coverage
- LLM-native design
- Beautiful documentation website
- Swappable plugin architecture
