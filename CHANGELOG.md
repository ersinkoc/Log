# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-01-16

### Added

- Initial release of @oxog/log
- Six log levels: trace, debug, info, warn, error, fatal
- Structured logging with metadata objects
- Child loggers with inherited context
- Correlation ID support for request tracking
- Source location tracking (file, line, column)
- Performance timing utilities (time/timeEnd, startTimer)
- Sensitive field redaction
- Multiple output formats: JSON, Pretty, Auto
- Multiple transports:
  - Console transport with color support
  - File transport with rotation and compression
  - Stream transport for custom streams
  - HTTP transport for remote logging
  - localStorage transport for browser persistence
- Plugin system with micro-kernel architecture
- Built-in plugins:
  - Level plugin (log level filtering)
  - Format plugin (output formatting)
  - Timestamp plugin (time tracking)
  - Redact plugin (sensitive data masking)
  - Source plugin (source location)
  - Timing plugin (performance measurement)
  - Correlation plugin (request tracking)
  - Buffer plugin (log buffering)
  - Browser plugin (DevTools integration)
- Full TypeScript support with type definitions
- Browser and Node.js compatibility
- 100% test coverage on testable code
- Comprehensive error handling with custom error types

### Dependencies

- @oxog/types ^1.0.0
- @oxog/plugin ^1.0.0
- @oxog/pigment ^1.0.0
- @oxog/emitter ^1.0.0

## [1.0.1] - 2026-01-25

### Fixed

- **Sync logging now truly blocks** - Added `writeSync` method to Transport interface. Fatal and error logs now use synchronous writes to ensure they are written before process exit.
- **Transport errors are no longer silently swallowed** - Added `error` event to LogEvents. Transport failures now emit events and write to stderr as fallback.
- **Circular reference handling in formatJson** - `formatJson` now uses `safeStringify` internally to handle circular references without throwing.
- **Buffer flush on close** - Logger properly flushes internal buffer and stops flush interval timer on close.

### Added

- `Transport.writeSync(entry)` - Optional synchronous write method for transports
- `TransportErrorPayload` type for error events
- `LogEvents.error` event for transport failure notifications
- `stringifyWithRedaction(obj, paths)` - Efficient redaction during JSON serialization without deep cloning
- `createRedactingReplacer(paths)` - Create JSON replacer function for streaming redaction

### Changed

- `formatJson` now uses `safeStringify` internally for circular reference safety
- Console transport implements `writeSync` using `process.stdout/stderr.write`
- File transport implements `writeSync` using `fs.appendFileSync`
- Buffer plugin's `flushBufferSync` now prefers `writeSync` when available

### Performance

- New `stringifyWithRedaction` function is more efficient than `redactFields + JSON.stringify` for large objects as it avoids deep cloning

## [Unreleased]

### Planned

- Performance benchmarks
- Additional transport plugins
- Log aggregation utilities
- Custom formatter support
