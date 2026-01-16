# @oxog/log

[![npm version](https://img.shields.io/npm/v/@oxog/log.svg)](https://www.npmjs.com/package/@oxog/log)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)

Blazing fast, plugin-based logging for Node.js and browsers with micro-kernel architecture.

Part of the [@oxog ecosystem](https://github.com/ersinkoc).

## Features

- **Six Log Levels**: trace, debug, info, warn, error, fatal
- **Structured Logging**: Attach metadata objects to log entries
- **Child Loggers**: Create scoped loggers with bound context
- **Correlation ID**: Track requests across async operations
- **Source Location**: Capture file and line number
- **Performance Timing**: Built-in time/timeEnd utilities
- **Redaction**: Mask sensitive fields from output
- **Multiple Formats**: JSON, Pretty, Auto (based on environment)
- **Multiple Transports**: Console, Stream, File, HTTP, localStorage
- **Hybrid Sync/Async**: Level-based synchronization with buffering
- **Browser Support**: Native DevTools integration
- **Zero Config**: Works out of the box with sensible defaults
- **TypeScript First**: Full type safety and IntelliSense support

## Installation

```bash
npm install @oxog/log
```

## Quick Start

```typescript
import { createLogger } from '@oxog/log';

const log = createLogger({ name: 'my-app' });

// Simple logging
log.info('Server started');

// Structured logging with data
log.info({ port: 3000, env: 'production' }, 'Listening');

// Child loggers with context
const dbLog = log.child({ module: 'database' });
dbLog.info('Connected to database');
```

## Log Levels

```typescript
log.trace('Detailed debugging');   // 10
log.debug('Debug information');    // 20
log.info('Informational');         // 30
log.warn('Warning');               // 40
log.error('Error occurred');       // 50
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

// Or use startTimer for more control
const end = log.startTimer('api-call');
await fetch('/api/data');
end();
```

### Redaction

```typescript
const log = createLogger({
  redact: ['password', 'token', 'creditCard']
});

log.info({ user: 'john', password: 'secret123' });
// Output: {"user":"john","password":"[REDACTED]"}
```

### Multiple Transports

```typescript
import { createLogger, consoleTransport, fileTransport } from '@oxog/log';

const log = createLogger({
  transports: [
    consoleTransport({ colors: true }),
    fileTransport({
      path: './logs/app.log',
      rotate: '1d',
      maxFiles: 7
    })
  ]
});
```

### Output Formats

```typescript
// Structured JSON (production)
const jsonLog = createLogger({ format: 'json' });

// Human-readable (development)
const prettyLog = createLogger({ format: 'pretty' });

// Auto-detect based on environment
const autoLog = createLogger({ format: 'auto' });
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

// Dynamic level change
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

const log = createLogger({
  plugins: [
    redactPlugin(['apiKey', 'secret']),
    sourcePlugin()
  ]
});
```

### Custom Plugin

```typescript
import type { Plugin } from '@oxog/types';

const myPlugin: Plugin = {
  name: 'myPlugin',
  version: '1.0.0',
  install(kernel) {
    // Custom logic
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
```

## Graceful Shutdown

```typescript
// Flush buffered logs before shutdown
await log.flush();

// Cleanup and destroy
await log.close();
```

## API Reference

### createLogger(options?)

Creates a new logger instance.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `name` | `string` | `'app'` | Logger name |
| `level` | `LogLevelName` | `'info'` | Minimum log level |
| `format` | `'json' \| 'pretty' \| 'auto'` | `'auto'` | Output format |
| `transports` | `Transport[]` | `[consoleTransport()]` | Output destinations |
| `redact` | `string[]` | `[]` | Fields to redact |
| `source` | `boolean` | `false` | Include source location |
| `timestamp` | `boolean` | `true` | Include timestamp |
| `context` | `object` | `{}` | Static context |
| `plugins` | `Plugin[]` | `[]` | Plugins to load |

### Logger Methods

#### Logging
- `trace(msg)` / `trace(obj, msg)` - Trace level
- `debug(msg)` / `debug(obj, msg)` - Debug level
- `info(msg)` / `info(obj, msg)` - Info level
- `warn(msg)` / `warn(obj, msg)` - Warn level
- `error(msg)` / `error(obj, msg)` / `error(err, msg)` - Error level
- `fatal(msg)` / `fatal(obj, msg)` / `fatal(err, msg)` - Fatal level

#### Context
- `child(context)` - Create child logger with additional context
- `withCorrelation(id)` - Create logger with correlation ID

#### Timing
- `time(label)` - Start a timer
- `timeEnd(label)` - End timer and log duration
- `startTimer(label)` - Returns stop function

#### Plugin Management
- `use(plugin)` - Register plugin
- `unregister(name)` - Unregister plugin
- `hasPlugin(name)` - Check if plugin exists
- `listPlugins()` - List all plugins

#### Lifecycle
- `flush()` - Flush buffered logs
- `close()` - Cleanup and close transports

#### Level Management
- `setLevel(level)` - Set minimum level
- `getLevel()` - Get current level
- `isLevelEnabled(level)` - Check if level is enabled

## Documentation

For detailed documentation, see the [docs](./docs) folder:

- [Specification](./docs/SPECIFICATION.md) - Full API specification
- [Implementation](./docs/IMPLEMENTATION.md) - Implementation details
- [Tasks](./docs/TASKS.md) - Development tasks

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting a PR.

## License

MIT - see [LICENSE](./LICENSE) for details.

## Author

Ersin Koc - [@ersinkoc](https://github.com/ersinkoc)
