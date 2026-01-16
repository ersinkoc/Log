# @oxog/log

Blazing fast, plugin-based logging for Node.js and browsers with micro-kernel architecture.

## Installation

```bash
npm install @oxog/log
```

## Quick Start

```typescript
import { createLogger } from '@oxog/log';

const log = createLogger();

log.info('Hello, world!');
log.info({ userId: 123 }, 'User logged in');
```

## Features

- **Six Log Levels**: trace, debug, info, warn, error, fatal
- **Structured Logging**: Attach metadata objects to log entries
- **Child Loggers**: Create scoped loggers with bound context
- **Correlation ID**: Track requests across async operations
- **Source Location**: Capture file and line number (unique among loggers!)
- **Performance Timing**: Built-in time/timeEnd utilities
- **Redaction**: Mask sensitive fields from output
- **Multiple Formats**: JSON, Pretty, Auto (based on NODE_ENV)
- **Multiple Transports**: Console, Stream, File, HTTP, localStorage
- **Hybrid Sync/Async**: Level-based synchronization with buffering
- **Browser Support**: Native DevTools integration

## Log Levels

```typescript
log.trace('Detailed debugging');   // 10
log.debug('Debug information');    // 20
log.info('Informational');         // 30
log.warn('Warning');               // 40
log.error('Error occurred');         // 50
log.fatal('Fatal error');          // 60
```

## Examples

### Child Loggers

```typescript
const dbLog = log.child({ module: 'database' });
dbLog.info('Connected');

const queryLog = dbLog.child({ operation: 'select' });
queryLog.debug('Executing query');
```

### Correlation ID

```typescript
const reqLog = log.withCorrelation('req-abc-123');
reqLog.info('Request received');
reqLog.info('Processing');
reqLog.info('Response sent');
```

### Performance Timing

```typescript
log.time('db-query');
await database.query('SELECT * FROM users');
log.timeEnd('db-query');

const end = log.startTimer('api-call');
await fetch('/api/data');
end();
```

### Redaction

```typescript
const log = createLogger({
  redact: ['password', 'token', 'creditCard']
});

log.info({ user: 'ersin', password: 'secret123' });
// Output: {"user":"ersin","password":"[REDACTED]"}
```

### Multiple Transports

```typescript
import { createLogger, consoleTransport, fileTransport } from '@oxog/log';

const log = createLogger({
  transports: [
    consoleTransport({ colors: true }),
    fileTransport({ path: './logs/app.log' })
  ]
});
```

### Custom Format

```typescript
const log = createLogger({
  format: 'json'    // Structured JSON
});

const prettyLog = createLogger({
  format: 'pretty'   // Human-readable
});

const autoLog = createLogger({
  format: 'auto'     // Based on NODE_ENV
});
```

### Error Handling

```typescript
try {
  const data = await fetchData();
} catch (error) {
  log.error(error, 'Failed to fetch data');
}

log.fatal(new Error('Cannot start'), 'Server error');
```

### Level Filtering

```typescript
const log = createLogger({ level: 'warn' });

log.info('This will NOT appear');  // Below minimum level
log.warn('This WILL appear');
log.error('This WILL appear');

log.setLevel('debug');
log.info('Now this appears');
```

### Source Location

```typescript
const log = createLogger({ source: true });

log.info('Debug me');
// Output: {"level":30,"file":"server.ts","line":42,"msg":"Debug me"}
```

## Plugin System

```typescript
import { createLogger, redactPlugin, sourcePlugin } from '@oxog/log';
import type { LogPlugin } from '@oxog/log';

const log = createLogger({
  plugins: [
    redactPlugin(['apiKey', 'secret']),
    sourcePlugin()
  ]
});

// Custom plugin
const myPlugin: LogPlugin = {
  name: 'myPlugin',
  version: '1.0.0',
  install(kernel) {
    kernel.on('log:format', (entry) => {
      // Custom formatting logic
    });
  }
};

log.use(myPlugin);
```

## Browser Usage

```typescript
import { createLogger } from '@oxog/log';

const log = createLogger();

log.info('Hello from browser!');
log.warn('Careful!');
log.error('Something went wrong');

// Child loggers use console.group
const child = log.child({ component: 'Auth' });
child.info('Checking token');
child.info('Token valid');
```

## Graceful Shutdown

```typescript
// Flush buffered logs
await log.flush();

// Cleanup and destroy
await log.destroy();
```

## API Reference

### createLogger(options?): Logger

Creates a new logger instance.

**Options**:
- `name`: Logger name (default: 'app')
- `level`: Minimum log level (default: 'info')
- `format`: 'json' | 'pretty' | 'auto' (default: 'auto')
- `transports`: Output transports (default: [consoleTransport()])
- `redact`: Fields to redact
- `source`: Include source location (default: false)
- `timestamp`: Include timestamp (default: true)
- `sync`: Per-level sync mode (default: { fatal: true, error: true })
- `buffer`: Buffer configuration (default: { size: 100, flushInterval: 1000 })
- `context`: Static context object
- `plugins`: Initial plugins to load

### Logger Methods

#### Logging
- `trace(msg | obj, msg): void`
- `debug(msg | obj, msg): void`
- `info(msg | obj, msg): void`
- `warn(msg | obj, msg): void`
- `error(msg | obj, msg | err, msg): void`
- `fatal(msg | obj, msg | err, msg): void`

#### Context
- `child(context): Logger` - Create child logger
- `withCorrelation(id): Logger` - Add correlation ID

#### Timing
- `time(label): void` - Start timer
- `timeEnd(label): void` - End timer and log duration
- `startTimer(label): () => void` - Returns stop function

#### Plugin Management
- `use(plugin): this` - Register plugin
- `unregister(name): boolean` - Unregister plugin
- `hasPlugin(name): boolean` - Check if plugin exists
- `listPlugins(): LogPlugin[]` - List all plugins

#### Lifecycle
- `flush(): Promise<void>` - Flush buffered logs
- `destroy(): Promise<void>` - Cleanup resources

#### Level Management
- `setLevel(level): void` - Set minimum level
- `getLevel(): LogLevel` - Get current level
- `isLevelEnabled(level): boolean` - Check if level is enabled

## License

MIT

## Author

Ersin Koç
