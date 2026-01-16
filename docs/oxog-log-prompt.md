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

**One-line:** Blazing fast, plugin-based logging for Node.js and browsers with micro-kernel architecture.

@oxog/log is a high-performance, zero-dependency logging library that combines Pino's speed with Winston's flexibility through a true micro-kernel plugin system. It features swappable transports, hybrid sync/async logging, source file location tracking (unique among loggers), and native browser DevTools integration. Every internal plugin can be replaced with external @oxog packages as the ecosystem grows.

---

## @oxog Dependencies

This package has **zero dependencies** (not even @oxog packages). It is a foundation package for the @oxog ecosystem.

---

## NON-NEGOTIABLE RULES

### 1. DEPENDENCY POLICY

```json
{
  "dependencies": {}
}
```

- **ZERO runtime dependencies** - this is a foundation package
- NO external packages (lodash, axios, chalk, etc.)
- Implement ALL functionality from scratch (colors, file rotation, etc.)

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

### 3. MICRO-KERNEL ARCHITECTURE

```
┌─────────────────────────────────────────────────┐
│                   User Code                      │
├─────────────────────────────────────────────────┤
│             Plugin Registry API                  │
│    use() · unregister() · list() · has()        │
├──────────┬──────────┬──────────┬────────────────┤
│  Core    │ Optional │ Imported │   Community    │
│ Plugins  │ Plugins  │ Plugins  │    Plugins     │
├──────────┴──────────┴──────────┴────────────────┤
│                 Micro Kernel                     │
│     Event Bus · Lifecycle · Error Boundary      │
└─────────────────────────────────────────────────┘
```

### 4. SWAPPABLE PLUGIN DESIGN

**CRITICAL**: All internal plugins must implement standard interfaces so they can be replaced by external @oxog packages later.

```typescript
// Today (in-house plugin)
import { consoleTransport } from '@oxog/log/transports';
log.use(consoleTransport());

// Tomorrow (external package - drop-in replacement)
import { colorify } from '@oxog/colorify';
log.use(colorify()); // Same interface!
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

### 1. Six Log Levels

Standard severity levels with numeric values for filtering.

```typescript
log.trace('Detailed debugging');  // 10
log.debug('Debug information');   // 20
log.info('Informational');        // 30
log.warn('Warning');              // 40
log.error('Error occurred');      // 50
log.fatal('Fatal error');         // 60
```

### 2. Structured Logging

Attach metadata objects to log entries.

```typescript
log.info({ userId: 123, action: 'login' }, 'User logged in');
// Output: {"level":30,"time":1234567890,"userId":123,"action":"login","msg":"User logged in"}
```

### 3. Child Loggers (Scoped)

Create loggers with bound context that persists across calls.

```typescript
const dbLog = log.child({ module: 'database' });
dbLog.info('Connected');
// Output: {"level":30,"module":"database","msg":"Connected"}

const queryLog = dbLog.child({ operation: 'select' });
queryLog.debug('Executing query');
// Output: {"level":20,"module":"database","operation":"select","msg":"Executing query"}
```

### 4. Correlation ID (Request Tracing)

Track requests across async operations.

```typescript
const reqLog = log.withCorrelation('req-abc-123');
reqLog.info('Request received');
reqLog.info('Processing');
reqLog.info('Response sent');
// All entries have: {"correlationId":"req-abc-123",...}
```

### 5. Source Location (UNIQUE - Pino doesn't have this!)

Automatically capture file and line number.

```typescript
const log = createLogger({ source: true });
log.info('Debug me');
// Output: {"level":30,"file":"server.ts","line":42,"msg":"Debug me"}
```

### 6. Performance Timing

Built-in timing utilities.

```typescript
log.time('db-query');
await database.query('SELECT * FROM users');
log.timeEnd('db-query');
// Output: {"level":30,"msg":"db-query","duration":45,"unit":"ms"}

// Or with labels
const end = log.startTimer('api-call');
await fetch('/api/data');
end(); // Automatically logs duration
```

### 7. Redaction (Sensitive Data Masking)

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

### 8. Multiple Output Formats

JSON for production, Pretty for development.

```typescript
// Auto-detect based on NODE_ENV
const log = createLogger({ format: 'auto' });

// Explicit JSON
const log = createLogger({ format: 'json' });
// {"level":30,"time":1234567890,"msg":"Hello"}

// Explicit Pretty
const log = createLogger({ format: 'pretty' });
// [2024-01-15 14:30:22] INFO  Hello
```

### 9. Multiple Transports

Send logs to multiple destinations.

```typescript
import { createLogger, consoleTransport, fileTransport, httpTransport } from '@oxog/log';

const log = createLogger({
  transports: [
    consoleTransport({ colors: true }),
    fileTransport({ path: './logs/app.log', rotate: '1d', maxSize: '10MB' }),
    httpTransport({ url: 'https://logs.example.com/ingest', batch: 100 }),
  ],
});
```

### 10. Hybrid Sync/Async Logging

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
```

### 11. Browser Support

Native DevTools integration.

```typescript
// Automatic console method mapping
log.info('Hello');   // → console.log
log.warn('Careful'); // → console.warn
log.error('Oops');   // → console.error

// Child loggers use console.group
const child = log.child({ component: 'Auth' });
child.info('Checking token');  // Grouped in DevTools
child.info('Token valid');
// console.groupEnd() on destroy

// Optional localStorage persistence
import { localStorageTransport } from '@oxog/log/transports';
log.use(localStorageTransport({ 
  key: 'app-logs', 
  maxSize: '1MB',
  levels: ['error', 'fatal'], // Only persist errors
}));
```

---

## PLUGIN SYSTEM

### Standard Plugin Interface

```typescript
/**
 * Standard plugin interface for @oxog/log.
 * All plugins (internal and external) must implement this.
 */
interface LogPlugin<TContext = LogContext> {
  /** Unique plugin identifier (kebab-case) */
  name: string;
  
  /** Semantic version */
  version: string;
  
  /** Plugin dependencies by name */
  dependencies?: string[];
  
  /** Called when plugin is registered */
  install: (kernel: LogKernel<TContext>) => void;
  
  /** Called after ALL plugins are installed */
  onInit?: (context: TContext) => void | Promise<void>;
  
  /** Called when plugin is unregistered */
  onDestroy?: () => void | Promise<void>;
  
  /** Called when an error occurs */
  onError?: (error: Error) => void;
}
```

### Transport Interface (Swappable)

```typescript
/**
 * Transport interface for log output destinations.
 * Internal transports can be replaced by @oxog packages.
 */
interface Transport {
  /** Transport identifier */
  name: string;
  
  /** Write a log entry */
  write(entry: LogEntry): void | Promise<void>;
  
  /** Flush buffered entries */
  flush?(): Promise<void>;
  
  /** Cleanup resources */
  destroy?(): void | Promise<void>;
  
  /** Check if transport supports environment */
  supports?(env: 'node' | 'browser'): boolean;
}
```

### Core Plugins (Always Loaded)

| Plugin | Description |
|--------|-------------|
| `levelPlugin` | Log level management (trace→fatal) with numeric values |
| `formatPlugin` | Output formatting (JSON/Pretty/Auto) |
| `timestampPlugin` | ISO 8601 timestamp injection |

### Optional Plugins (Opt-in, Swappable)

| Plugin | Description | Future @oxog Package |
|--------|-------------|---------------------|
| `consoleTransport` | Colored console output with ANSI codes | `@oxog/colorify` |
| `fileTransport` | File writing with rotation support | `@oxog/file-logger` |
| `jsonTransport` | Structured JSON output | — |
| `httpTransport` | HTTP/Webhook log shipping with batching | `@oxog/log-shipper` |
| `streamTransport` | Node.js stream support | — |
| `redactPlugin` | Sensitive data masking | `@oxog/redact` |
| `sourcePlugin` | Source file + line number capture | — |
| `correlationPlugin` | Request correlation ID tracking | — |
| `timingPlugin` | Performance timing (time/timeEnd) | — |
| `browserPlugin` | DevTools integration + localStorage | — |
| `bufferPlugin` | Async buffering with batch flush | — |

### Exported Plugins (For @oxog Ecosystem)

| Plugin | Description |
|--------|-------------|
| `loggerPlugin` | Ready-to-use logger plugin for any @oxog kernel |
| `performancePlugin` | Timing utilities exportable to other packages |

These plugins can be imported by other @oxog packages:

```typescript
// In another @oxog package
import { loggerPlugin } from '@oxog/log/plugins';
kernel.use(loggerPlugin({ level: 'debug' }));
```

---

## API DESIGN

### Main Export

```typescript
import { createLogger } from '@oxog/log';

// Zero-config (sensible defaults)
const log = createLogger();

// Full configuration
const log = createLogger({
  // Identity
  name: 'my-app',
  
  // Level filtering
  level: 'info', // Minimum level to output
  
  // Output format
  format: 'auto', // 'json' | 'pretty' | 'auto'
  
  // Transports
  transports: [
    consoleTransport({ colors: true }),
    fileTransport({ path: './app.log' }),
  ],
  
  // Features
  redact: ['password', 'token'],
  source: true,
  timestamp: true,
  
  // Performance
  sync: { fatal: true, error: true },
  buffer: { size: 100, flushInterval: 1000 },
  
  // Context
  context: { env: 'production', version: '1.0.0' },
});

// Usage
log.info('Server started');
log.info({ port: 3000 }, 'Listening');
log.error(new Error('Connection failed'), 'Database error');

// Child logger
const dbLog = log.child({ module: 'database' });

// Correlation
const reqLog = log.withCorrelation(generateId());

// Timing
log.time('operation');
await doWork();
log.timeEnd('operation');

// Graceful shutdown
await log.flush();
await log.destroy();
```

### Type Definitions

```typescript
/**
 * Logger configuration options.
 * 
 * @example
 * ```typescript
 * const log = createLogger({
 *   name: 'my-app',
 *   level: 'debug',
 *   format: 'pretty',
 * });
 * ```
 */
export interface LoggerOptions {
  /**
   * Logger name, included in all entries.
   * @default 'app'
   */
  name?: string;
  
  /**
   * Minimum log level to output.
   * @default 'info'
   */
  level?: LogLevel;
  
  /**
   * Output format.
   * - 'json': Structured JSON (production)
   * - 'pretty': Human-readable (development)  
   * - 'auto': Based on NODE_ENV
   * @default 'auto'
   */
  format?: 'json' | 'pretty' | 'auto';
  
  /**
   * Output transports.
   * @default [consoleTransport()]
   */
  transports?: Transport[];
  
  /**
   * Fields to redact from output.
   * Supports dot notation for nested paths.
   * @example ['password', 'user.token']
   */
  redact?: string[];
  
  /**
   * Include source file and line number.
   * @default false
   */
  source?: boolean;
  
  /**
   * Include ISO 8601 timestamp.
   * @default true
   */
  timestamp?: boolean;
  
  /**
   * Sync/async mode per level.
   * @default { fatal: true, error: true }
   */
  sync?: Partial<Record<LogLevel, boolean>>;
  
  /**
   * Buffer configuration for async logging.
   */
  buffer?: BufferOptions;
  
  /**
   * Static context added to all entries.
   */
  context?: Record<string, unknown>;
  
  /**
   * Initial plugins to load.
   */
  plugins?: LogPlugin[];
}

/**
 * Log severity levels.
 */
export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

/**
 * Numeric level values for filtering.
 */
export const LOG_LEVELS: Record<LogLevel, number> = {
  trace: 10,
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
  fatal: 60,
};

/**
 * Log entry structure.
 */
export interface LogEntry {
  /** Numeric level value */
  level: number;
  
  /** Level name */
  levelName: LogLevel;
  
  /** Unix timestamp (ms) */
  time: number;
  
  /** Log message */
  msg: string;
  
  /** Logger name */
  name: string;
  
  /** Additional data */
  [key: string]: unknown;
}

/**
 * Logger instance interface.
 */
export interface Logger {
  // Logging methods
  trace(msg: string): void;
  trace(obj: object, msg: string): void;
  debug(msg: string): void;
  debug(obj: object, msg: string): void;
  info(msg: string): void;
  info(obj: object, msg: string): void;
  warn(msg: string): void;
  warn(obj: object, msg: string): void;
  error(msg: string): void;
  error(obj: object, msg: string): void;
  error(err: Error, msg?: string): void;
  fatal(msg: string): void;
  fatal(obj: object, msg: string): void;
  fatal(err: Error, msg?: string): void;
  
  // Child loggers
  child(context: Record<string, unknown>): Logger;
  
  // Correlation
  withCorrelation(id: string): Logger;
  
  // Timing
  time(label: string): void;
  timeEnd(label: string): void;
  startTimer(label: string): () => void;
  
  // Plugin management
  use(plugin: LogPlugin): this;
  unregister(name: string): boolean;
  hasPlugin(name: string): boolean;
  listPlugins(): LogPlugin[];
  
  // Lifecycle
  flush(): Promise<void>;
  destroy(): Promise<void>;
  
  // Level management
  setLevel(level: LogLevel): void;
  getLevel(): LogLevel;
  isLevelEnabled(level: LogLevel): boolean;
}
```

### Transport Factories

```typescript
// Console transport
import { consoleTransport } from '@oxog/log/transports';

consoleTransport({
  colors: true,           // ANSI colors
  timestamp: true,        // Show timestamp
  levelColors: {          // Custom colors per level
    error: 'red',
    warn: 'yellow',
    info: 'cyan',
  },
});

// File transport
import { fileTransport } from '@oxog/log/transports';

fileTransport({
  path: './logs/app.log',
  rotate: '1d',           // Daily rotation
  maxSize: '10MB',        // Max file size
  maxFiles: 7,            // Keep 7 files
  compress: true,         // Gzip old files
});

// HTTP transport
import { httpTransport } from '@oxog/log/transports';

httpTransport({
  url: 'https://logs.example.com/ingest',
  method: 'POST',
  headers: { 'X-API-Key': 'xxx' },
  batch: 100,             // Batch size
  interval: 5000,         // Flush interval (ms)
  retry: 3,               // Retry attempts
});

// Stream transport
import { streamTransport } from '@oxog/log/transports';

streamTransport({
  stream: process.stdout,
  // Or custom writable stream
});

// localStorage transport (browser)
import { localStorageTransport } from '@oxog/log/transports';

localStorageTransport({
  key: 'app-logs',
  maxSize: '1MB',
  levels: ['error', 'fatal'],
});
```

---

## TECHNICAL REQUIREMENTS

| Requirement | Value |
|-------------|-------|
| Runtime | Universal (Node.js + Browser) |
| Module Format | ESM + CJS |
| Node.js | >= 18 |
| TypeScript | >= 5.0 |
| Bundle (core) | < 3KB gzipped |
| Bundle (all plugins) | < 12KB gzipped |

### Environment Detection

```typescript
// Automatic environment detection
const isNode = typeof process !== 'undefined' && process.versions?.node;
const isBrowser = typeof window !== 'undefined';

// NODE_ENV detection for format: 'auto'
const isDev = process.env.NODE_ENV !== 'production';
```

---

## PROJECT STRUCTURE

```
log/
├── .github/workflows/
│   ├── deploy.yml          # Website deployment
│   └── publish.yml         # npm publishing
├── src/
│   ├── index.ts            # Main entry, public exports
│   ├── kernel.ts           # Micro kernel implementation
│   ├── logger.ts           # Logger class implementation
│   ├── types.ts            # Type definitions (JSDoc rich!)
│   ├── errors.ts           # Custom error classes
│   ├── constants.ts        # Log levels, defaults
│   ├── utils/
│   │   ├── colors.ts       # ANSI color utilities (no deps!)
│   │   ├── format.ts       # JSON/Pretty formatters
│   │   ├── redact.ts       # Redaction utilities
│   │   ├── source.ts       # Stack trace parsing
│   │   ├── time.ts         # Timestamp utilities
│   │   └── env.ts          # Environment detection
│   ├── plugins/
│   │   ├── index.ts        # Plugin exports (for ecosystem)
│   │   ├── core/
│   │   │   ├── index.ts
│   │   │   ├── level.ts    # Level plugin
│   │   │   ├── format.ts   # Format plugin
│   │   │   └── timestamp.ts # Timestamp plugin
│   │   └── optional/
│   │       ├── index.ts
│   │       ├── redact.ts
│   │       ├── source.ts
│   │       ├── correlation.ts
│   │       ├── timing.ts
│   │       ├── buffer.ts
│   │       └── browser.ts
│   └── transports/
│       ├── index.ts        # Transport exports
│       ├── console.ts      # Console transport
│       ├── file.ts         # File transport (Node only)
│       ├── http.ts         # HTTP transport
│       ├── stream.ts       # Stream transport
│       └── localStorage.ts # Browser storage
├── tests/
│   ├── unit/
│   │   ├── kernel.test.ts
│   │   ├── logger.test.ts
│   │   ├── plugins/
│   │   ├── transports/
│   │   └── utils/
│   ├── integration/
│   │   ├── child-loggers.test.ts
│   │   ├── multi-transport.test.ts
│   │   └── browser.test.ts
│   └── fixtures/
│       └── ...
├── examples/
│   ├── 01-basic/
│   │   ├── minimal.ts
│   │   ├── with-options.ts
│   │   ├── log-levels.ts
│   │   └── README.md
│   ├── 02-structured/
│   │   ├── metadata.ts
│   │   ├── errors.ts
│   │   ├── child-loggers.ts
│   │   └── README.md
│   ├── 03-transports/
│   │   ├── console.ts
│   │   ├── file.ts
│   │   ├── http.ts
│   │   ├── multi-transport.ts
│   │   └── README.md
│   ├── 04-features/
│   │   ├── redaction.ts
│   │   ├── source-location.ts
│   │   ├── correlation.ts
│   │   ├── timing.ts
│   │   └── README.md
│   ├── 05-browser/
│   │   ├── basic.html
│   │   ├── devtools.html
│   │   ├── localStorage.html
│   │   └── README.md
│   └── 06-real-world/
│       ├── express-app/
│       ├── cli-tool/
│       ├── microservice/
│       └── README.md
├── website/
│   ├── public/
│   │   ├── CNAME           # log.oxog.dev
│   │   ├── llms.txt
│   │   ├── favicon.svg
│   │   └── og-image.png
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── index.css
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   └── lib/
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   ├── components.json
│   ├── tsconfig.json
│   └── package.json
├── llms.txt                # LLM-optimized reference (< 2000 tokens)
├── SPECIFICATION.md
├── IMPLEMENTATION.md
├── TASKS.md
├── README.md
├── CHANGELOG.md
├── LICENSE
├── package.json
├── tsconfig.json
├── tsup.config.ts
├── vitest.config.ts
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

## PACKAGE.JSON

```json
{
  "name": "@oxog/log",
  "version": "1.0.0",
  "description": "Blazing fast, plugin-based logging for Node.js and browsers",
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
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
  },
  "files": ["dist"],
  "sideEffects": false,
  "repository": {
    "type": "git",
    "url": "git+https://github.com/ersinkoc/log.git"
  },
  "bugs": { "url": "https://github.com/ersinkoc/log/issues" },
  "homepage": "https://log.oxog.dev",
  "keywords": [
    "log",
    "logger",
    "logging",
    "structured-logging",
    "json-logging",
    "zero-dependency",
    "typescript",
    "plugin",
    "micro-kernel",
    "oxog",
    "pino-alternative",
    "winston-alternative"
  ],
  "author": "Ersin Koç",
  "license": "MIT",
  "scripts": {
    "build": "tsup",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "lint": "eslint src/",
    "format": "prettier --write .",
    "typecheck": "tsc --noEmit",
    "prepublishOnly": "npm run build && npm run test:coverage"
  },
  "engines": { "node": ">=18" },
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

---

## WEBSITE REQUIREMENTS

- React 19 + Vite 6 + Tailwind CSS v4
- shadcn/ui components
- Lucide React icons
- JetBrains Mono + Inter fonts
- CNAME: log.oxog.dev
- Footer: "Made with ❤️ by Ersin KOÇ"
- GitHub link only (no social media)

### Pages Required

1. **Home** - Hero, quick start, features
2. **Docs** - Getting started, configuration, API reference
3. **Transports** - Each transport documented
4. **Plugins** - Plugin system, creating plugins
5. **Examples** - Interactive examples
6. **Playground** - Live log testing

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

### Package Completion
- [ ] All tests passing (100%)
- [ ] Coverage at 100%
- [ ] No TypeScript errors
- [ ] Package builds
- [ ] Works in Node.js
- [ ] Works in Browser

### LLM-Native Completion
- [ ] llms.txt created (< 2000 tokens)
- [ ] README optimized
- [ ] 15+ examples
- [ ] 8-12 npm keywords

### Website Completion
- [ ] All pages implemented
- [ ] Dark/Light theme
- [ ] CNAME configured
- [ ] Responsive design

### Final
- [ ] `npm run build` succeeds
- [ ] `npm run test:coverage` shows 100%
- [ ] Website builds
- [ ] All examples run
- [ ] Browser bundle works

---

## COMPETITIVE ADVANTAGES

| Feature | Pino | Winston | Bunyan | @oxog/log |
|---------|------|---------|--------|-----------|
| Speed | ⚡⚡⚡ | ⚡ | ⚡⚡ | ⚡⚡⚡ |
| Source file:line | ❌ | ❌ | ❌ | ✅ |
| Plugin system | ❌ | ❌ | ❌ | ✅ |
| Swappable transports | ❌ | ~ | ❌ | ✅ |
| Zero dependencies | ✅ | ❌ | ❌ | ✅ |
| Browser native | ❌ | ❌ | ❌ | ✅ |
| Micro-kernel | ❌ | ❌ | ❌ | ✅ |
| Active maintenance | ✅ | ✅ | ❌ | ✅ |
| Correlation ID | Plugin | Plugin | ✅ | ✅ Built-in |
| Redaction | ✅ | Plugin | ❌ | ✅ Built-in |
| TypeScript | ✅ | ✅ | ~ | ✅ Strict |

---

## BEGIN IMPLEMENTATION

Start with **SPECIFICATION.md**, then **IMPLEMENTATION.md**, then **TASKS.md**.

Only after all three documents are complete, implement code following TASKS.md sequentially.

**Remember:**
- Production-ready for npm publish
- ZERO runtime dependencies
- 100% test coverage
- LLM-native design
- Beautiful documentation website
- Swappable plugin architecture
