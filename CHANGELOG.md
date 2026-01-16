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

## [Unreleased]

### Planned

- Performance benchmarks
- Additional transport plugins
- Log aggregation utilities
- Custom formatter support
