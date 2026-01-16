# @oxog/log Specification

## Document Purpose

This document specifies the complete requirements for @oxog/log, a high-performance, zero-dependency logging library for Node.js and browsers with micro-kernel plugin architecture.

## 1. Core Requirements

### 1.1 Package Identity
- **Name**: `@oxog/log`
- **Version**: 1.0.0
- **License**: MIT
- **Author**: Ersin Koç
- **Runtime**: Node.js >= 18, Modern Browsers
- **Module Format**: ESM + CJS
- **Bundle Size**: < 3KB core, < 12KB with all plugins (gzipped)

### 1.2 Dependencies
- **Runtime Dependencies**: ZERO
- **Dev Dependencies**: typescript, vitest, @vitest/coverage-v8, tsup, @types/node, prettier, eslint

### 1.3 Quality Standards
- 100% test coverage enforced
- TypeScript strict mode enabled
- All public APIs have JSDoc with examples
- Minimum 15 usage examples

## 2. Functional Requirements

### 2.1 Log Levels

Six severity levels with numeric values:

| Level | Value | Description |
|-------|-------|-------------|
| trace | 10 | Most detailed debugging info |
| debug | 20 | Debugging information |
| info  | 30 | General informational messages |
| warn  | 40 | Warning messages |
| error | 50 | Error conditions |
| fatal | 60 | Critical errors causing failure |

Level filtering: Only messages at or above the minimum level are output.

### 2.2 Core Features

#### 2.2.1 Structured Logging
- Support metadata objects attached to log entries
- JSON serialization of all fields
- Error object handling with stack traces

#### 2.2.2 Child Loggers
- Create scoped loggers with bound context
- Context merges across child hierarchy
- Independent level management per child

#### 2.2.3 Correlation ID
- Bind correlation ID to logger instance
- Persists across all log calls
- Request tracing across async operations

#### 2.2.4 Source Location
- Automatic capture of file name and line number
- Configurable per logger
- Uses stack trace parsing (no deps)

#### 2.2.5 Performance Timing
- `time(label)` / `timeEnd(label)` pair
- `startTimer(label)` returns stop function
- Duration output in milliseconds

#### 2.2.6 Redaction
- Mask sensitive fields from output
- Support dot notation for nested paths
- Configurable fields list

#### 2.2.7 Output Formats
- **json**: Structured JSON (production)
- **pretty**: Human-readable (development)
- **auto**: Based on NODE_ENV detection

#### 2.2.8 Multiple Transports
- Send logs to multiple destinations simultaneously
- Each transport handles write independently
- Support for custom transports

#### 2.2.9 Hybrid Sync/Async
- Per-level sync/async configuration
- Buffered async writes with configurable size
- Flush interval control
- Graceful shutdown flush

#### 2.2.10 Browser Support
- Native console method mapping
- DevTools integration with console.group
- localStorage transport for persistence

## 3. Plugin System

### 3.1 Micro-Kernel Architecture

Components:
1. **Event Bus**: Pub/sub for plugin communication
2. **Lifecycle Management**: install/onInit/onDestroy hooks
3. **Error Boundary**: Centralized error handling

### 3.2 Plugin Interface

```typescript
interface LogPlugin<TContext = LogContext> {
  name: string;
  version: string;
  dependencies?: string[];
  install: (kernel: LogKernel<TContext>) => void;
  onInit?: (context: TContext) => void | Promise<void>;
  onDestroy?: () => void | Promise<void>;
  onError?: (error: Error) => void;
}
```

### 3.3 Core Plugins (Always Loaded)

1. **levelPlugin**: Log level management
2. **formatPlugin**: Output formatting
3. **timestampPlugin**: ISO 8601 timestamp injection

### 3.4 Optional Plugins (Opt-in)

1. **redactPlugin**: Sensitive data masking
2. **sourcePlugin**: Source file location
3. **correlationPlugin**: Correlation ID tracking
4. **timingPlugin**: Performance timing
5. **bufferPlugin**: Async buffering
6. **browserPlugin**: DevTools integration

### 3.5 Swappable Transport Interface

```typescript
interface Transport {
  name: string;
  write(entry: LogEntry): void | Promise<void>;
  flush?(): Promise<void>;
  destroy?(): void | Promise<void>;
  supports?(env: 'node' | 'browser'): boolean;
}
```

All transports can be replaced by external @oxog packages.

## 4. Transport Specifications

### 4.1 Console Transport
- ANSI color codes (no external color library)
- Configurable color per level
- Timestamp display
- Level badge display
- Pretty print for objects

### 4.2 File Transport (Node Only)
- Path configuration
- Rotation: daily, hourly, size-based
- Max files retention
- Gzip compression for rotated files
- Directory creation if not exists

### 4.3 HTTP Transport
- Configurable URL and method
- Custom headers
- Batching support
- Retry logic with backoff
- Timeout handling

### 4.4 Stream Transport (Node Only)
- Accept any WritableStream
- Write to stdout/stderr/custom stream

### 4.5 localStorage Transport (Browser Only)
- Key prefix configuration
- Max size limit with rotation
- Level-based filtering
- JSON storage format

## 5. API Specification

### 5.1 Main Entry Point

```typescript
createLogger(options?: LoggerOptions): Logger
```

### 5.2 Logger Interface

#### Logging Methods
- `trace(msg: string | object, msg?: string): void`
- `debug(msg: string | object, msg?: string): void`
- `info(msg: string | object, msg?: string): void`
- `warn(msg: string | object, msg?: string): void`
- `error(msg: string | Error | object, msg?: string): void`
- `fatal(msg: string | Error | object, msg?: string): void`

Overloads:
1. `log.info('message')` - Just message
2. `log.info({ key: 'value' }, 'message')` - Metadata + message
3. `log.error(error, 'message')` - Error + optional message

#### Child Loggers
- `child(context: Record<string, unknown>): Logger`

#### Correlation
- `withCorrelation(id: string): Logger`

#### Timing
- `time(label: string): void`
- `timeEnd(label: string): void`
- `startTimer(label: string): () => void`

#### Plugin Management
- `use(plugin: LogPlugin): this`
- `unregister(name: string): boolean`
- `hasPlugin(name: string): boolean`
- `listPlugins(): LogPlugin[]`

#### Lifecycle
- `flush(): Promise<void>` - Flush all buffers
- `destroy(): Promise<void>` - Cleanup resources

#### Level Management
- `setLevel(level: LogLevel): void`
- `getLevel(): LogLevel`
- `isLevelEnabled(level: LogLevel): boolean`

### 5.3 Type Definitions

```typescript
type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

interface LoggerOptions {
  name?: string;
  level?: LogLevel;
  format?: 'json' | 'pretty' | 'auto';
  transports?: Transport[];
  redact?: string[];
  source?: boolean;
  timestamp?: boolean;
  sync?: Partial<Record<LogLevel, boolean>>;
  buffer?: BufferOptions;
  context?: Record<string, unknown>;
  plugins?: LogPlugin[];
}

interface LogEntry {
  level: number;
  levelName: LogLevel;
  time: number;
  msg: string;
  name: string;
  [key: string]: unknown;
}

interface BufferOptions {
  size?: number;
  flushInterval?: number;
}
```

## 6. Technical Requirements

### 6.1 Environment Detection
```typescript
const isNode = typeof process !== 'undefined' && process.versions?.node;
const isBrowser = typeof window !== 'undefined';
```

### 6.2 Color Implementation
Custom ANSI color implementation (no chalk):
- Foreground colors: black, red, green, yellow, blue, magenta, cyan, white
- Background colors: same set
- Styles: bold, dim, italic, underline, reset

### 6.3 Stack Trace Parsing
Extract file name and line number from Error.stack:
- Parse V8 stack trace format
- Extract: file path, line number, column number
- Handle both Node.js and browser formats

### 6.4 Redaction Algorithm
- Support dot notation: `user.password`, `data.apiKey`
- Replace values with `[REDACTED]`
- Deep object traversal
- Handle arrays

### 6.5 JSON Formatting
- Space-free compact JSON
- ISO 8601 timestamps
- Circular reference handling
- Function serialization (stringify)

### 6.6 Pretty Formatting
- Timestamp: `[YYYY-MM-DD HH:mm:ss]`
- Level: Right-aligned colored badge
- Message: Text content
- Objects: Indented JSON

## 7. Browser Support

### 7.1 Console Method Mapping
| Logger Level | Console Method |
|--------------|----------------|
| trace | console.debug |
| debug | console.debug |
| info | console.log |
| warn | console.warn |
| error | console.error |
| fatal | console.error |

### 7.2 localStorage Format
```json
{
  "entries": [
    {
      "level": 30,
      "levelName": "info",
      "time": 1705294800000,
      "msg": "message",
      ...
    }
  ],
  "metadata": {
    "created": 1705294800000,
    "version": "1.0.0"
  }
}
```

## 8. Performance Requirements

### 8.1 Benchmarks (Target)
- Simple log: < 0.1ms
- Structured log: < 0.2ms
- Child logger: < 0.05ms
- File write: < 1ms (sync)

### 8.2 Memory
- Minimal allocation per log entry
- Buffer pool for async writes
- Cleanup on destroy

## 9. Security Requirements

### 9.1 Redaction
- Never log sensitive fields
- Configurable field list
- Deep redaction in nested objects

### 9.2 File Permissions
- Default: 0644 for log files
- Directory: 0755

### 9.3 Error Handling
- Never throw from logging methods
- Graceful degradation on transport failure
- Error boundary prevents crashes

## 10. Compliance Requirements

### 10.1 TypeScript
- Strict mode enabled
- All types exported
- No `any` in public API
- Generics where appropriate

### 10.2 Testing
- 100% coverage enforced
- Unit tests for all functions
- Integration tests for features
- Edge case tests

### 10.3 Build Output
- ESM: `dist/index.js` + `dist/index.d.ts`
- CJS: `dist/index.cjs` + `dist/index.d.cts`
- Subpath exports: `/plugins`, `/transports`

### 10.4 Documentation
- JSDoc on all public APIs
- @example tags (minimum 15)
- README with quick start
- LLM-optimized llms.txt
