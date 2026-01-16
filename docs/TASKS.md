# @oxog/log Implementation Tasks

This document provides an ordered task list for implementing @oxog/log. Follow tasks sequentially to ensure proper build and testing.

## Phase 1: Project Setup (Tasks 1-5)

### Task 1: Initialize Project Structure
- [ ] Create directory structure from SPECIFICATION.md
- [ ] Initialize git repository
- [ ] Create .gitignore with standard Node.js patterns
- [ ] Create LICENSE file (MIT)

### Task 2: Create Configuration Files
- [ ] Create package.json with exact values from spec
- [ ] Create tsconfig.json with strict mode
- [ ] Create tsup.config.ts
- [ ] Create vitest.config.ts with 100% coverage
- [ ] Create .eslintrc.js
- [ ] Create .prettierrc

### Task 3: Create Type Definitions
- [ ] Create src/types.ts with all interfaces
- [ ] Add JSDoc comments with @example to all public APIs
- [ ] Export all types

### Task 4: Create Constants
- [ ] Create src/constants.ts
- [ ] Define LOG_LEVELS constant
- [ ] Define ANSI color codes
- [ ] Define default configurations

### Task 5: Create Error Classes
- [ ] Create src/errors.ts
- [ ] Implement LogError base class
- [ ] Implement PluginError
- [ ] Implement TransportError
- [ ] Add unit tests for errors

## Phase 2: Utility Functions (Tasks 6-10)

### Task 6: Create Environment Detection
- [ ] Create src/utils/env.ts
- [ ] Implement isNode, isBrowser
- [ ] Implement isDev() function
- [ ] Write unit tests

### Task 7: Create ANSI Color System
- [ ] Create src/utils/colors.ts
- [ ] Implement colorize function
- [ ] Implement style function
- [ ] Implement all color codes and styles
- [ ] Write unit tests for all colors/styles

### Task 8: Create Stack Trace Parser
- [ ] Create src/utils/source.ts
- [ ] Implement getSourceLocation()
- [ ] Handle Node.js stack format
- [ ] Handle browser stack format
- [ ] Write unit tests

### Task 9: Create Redaction Utility
- [ ] Create src/utils/redact.ts
- [ ] Implement redactFields()
- [ ] Handle nested paths with dot notation
- [ ] Handle arrays
- [ ] Write unit tests

### Task 10: Create Formatters
- [ ] Create src/utils/format.ts
- [ ] Implement JSON formatter
- [ ] Implement pretty formatter
- [ ] Add ISO 8601 timestamp handling
- [ ] Write unit tests

## Phase 3: Core Kernel (Tasks 11-15)

### Task 11: Create Event Bus
- [ ] Create src/kernel/event-bus.ts
- [ ] Implement on(), off(), emit()
- [ ] Add error handling in emit
- [ ] Write unit tests

### Task 12: Create Kernel Base
- [ ] Create src/kernel/kernel.ts
- [ ] Implement LogKernel class
- [ ] Implement register(), unregister(), has(), list()
- [ ] Implement lifecycle management
- [ ] Write unit tests

### Task 13: Implement Kernel Context
- [ ] Add context management to kernel
- [ ] Implement context updates
- [ ] Add getter/setter for context properties
- [ ] Write unit tests

### Task 14: Implement Error Boundary
- [ ] Add error boundary to kernel
- [ ] Implement onError handler registration
- [ ] Add error propagation to plugins
- [ ] Write unit tests

### Task 15: Implement Kernel Flush/Destroy
- [ ] Implement flush() method
- [ ] Implement destroy() method
- [ ] Ensure cleanup of all resources
- [ ] Write unit tests

## Phase 4: Core Plugins (Tasks 16-18)

### Task 16: Implement Level Plugin
- [ ] Create src/plugins/core/level.ts
- [ ] Implement level filtering logic
- [ ] Add setLevel support
- [ ] Write unit tests

### Task 17: Implement Format Plugin
- [ ] Create src/plugins/core/format.ts
- [ ] Implement format selection (json/pretty/auto)
- [ ] Integrate formatters from utils
- [ ] Write unit tests

### Task 18: Implement Timestamp Plugin
- [ ] Create src/plugins/core/timestamp.ts
- [ ] Add ISO 8601 timestamp to entries
- [ ] Make timestamp configurable
- [ ] Write unit tests

## Phase 5: Optional Plugins (Tasks 19-24)

### Task 19: Implement Redact Plugin
- [ ] Create src/plugins/optional/redact.ts
- [ ] Integrate redactFields utility
- [ ] Support field list configuration
- [ ] Write unit tests

### Task 20: Implement Source Plugin
- [ ] Create src/plugins/optional/source.ts
- [ ] Integrate getSourceLocation utility
- [ ] Add file, line, column to entries
- [ ] Write unit tests

### Task 21: Implement Correlation Plugin
- [ ] Create src/plugins/optional/correlation.ts
- [ ] Add correlationId to entries
- [ ] Support per-logger correlation
- [ ] Write unit tests

### Task 22: Implement Timing Plugin
- [ ] Create src/plugins/optional/timing.ts
- [ ] Implement timing map in context
- [ ] Support time(), timeEnd(), startTimer()
- [ ] Write unit tests

### Task 23: Implement Buffer Plugin
- [ ] Create src/plugins/optional/buffer.ts
- [ ] Implement async buffer with size limit
- [ ] Add flush interval support
- [ ] Implement sync/async per level
- [ ] Write unit tests

### Task 24: Implement Browser Plugin
- [ ] Create src/plugins/optional/browser.ts
- [ ] Implement console method mapping
- [ ] Add console.group support for child loggers
- [ ] Write unit tests

## Phase 6: Transports (Tasks 25-30)

### Task 25: Implement Console Transport
- [ ] Create src/transports/console.ts
- [ ] Implement color support
- [ ] Add level-specific colors
- [ ] Handle both pretty and JSON formats
- [ ] Write unit tests

### Task 26: Implement Stream Transport
- [ ] Create src/transports/stream.ts
- [ ] Support Node.js WritableStream
- [ ] Handle errors gracefully
- [ ] Write unit tests

### Task 27: Implement File Transport
- [ ] Create src/transports/file.ts
- [ ] Implement file writing
- [ ] Add rotation support (daily, hourly, size)
- [ ] Add max files with rotation
- [ ] Add gzip compression
- [ ] Write unit tests

### Task 28: Implement HTTP Transport
- [ ] Create src/transports/http.ts
- [ ] Implement batching
- [ ] Add retry logic with exponential backoff
- [ ] Support custom headers
- [ ] Write unit tests

### Task 29: Implement localStorage Transport
- [ ] Create src/transports/localStorage.ts
- [ ] Implement storage with key prefix
- [ ] Add max size limit
- [ ] Support level-based filtering
- [ ] Write unit tests

### Task 30: Create Transport Exports
- [ ] Create src/transports/index.ts
- [ ] Export all transports
- [ ] Add JSDoc for each export
- [ ] Write unit tests

## Phase 7: Logger Implementation (Tasks 31-35)

### Task 31: Create Logger Class
- [ ] Create src/logger.ts
- [ ] Implement Logger class with basic structure
- [ ] Implement constructor with options handling
- [ ] Write unit tests

### Task 32: Implement Logging Methods
- [ ] Implement trace(), debug(), info(), warn(), error(), fatal()
- [ ] Support both signatures (msg only, obj + msg)
- [ ] Add Error handling
- [ ] Write unit tests

### Task 33: Implement Child Loggers
- [ ] Implement child() method
- [ ] Merge context properly
- [ ] Test context inheritance
- [ ] Write unit tests

### Task 34: Implement Correlation
- [ ] Implement withCorrelation() method
- [ ] Test correlation ID propagation
- [ ] Write unit tests

### Task 35: Implement Timing Methods
- [ ] Implement time(), timeEnd(), startTimer()
- [ ] Test timing accuracy
- [ ] Write unit tests

### Task 36: Implement Plugin Management
- [ ] Implement use(), unregister(), hasPlugin(), listPlugins()
- [ ] Delegates to kernel
- [ ] Write unit tests

### Task 37: Implement Lifecycle Methods
- [ ] Implement flush(), destroy()
- [ ] Ensure proper cleanup
- [ ] Write unit tests

### Task 38: Implement Level Management
- [ ] Implement setLevel(), getLevel(), isLevelEnabled()
- [ ] Write unit tests

## Phase 8: Integration Testing (Tasks 39-43)

### Task 39: Test Child Loggers
- [ ] Create tests/integration/child-loggers.test.ts
- [ ] Test context merging
- [ ] Test independent level management
- [ ] Test nested child loggers

### Task 40: Test Multiple Transports
- [ ] Create tests/integration/multi-transport.test.ts
- [ ] Test console + file transport
- [ ] Test console + HTTP transport
- [ ] Test all transports together

### Task 41: Test Redaction
- [ ] Create comprehensive redaction tests
- [ ] Test nested paths
- [ ] Test arrays
- [ ] Test edge cases

### Task 42: Test Browser Compatibility
- [ ] Create tests/integration/browser.test.ts
- [ ] Test in browser environment
- [ ] Test console mapping
- [ ] Test localStorage transport

### Task 43: Test Error Handling
- [ ] Test plugin error handling
- [ ] Test transport failure handling
- [ ] Test error boundary

## Phase 9: Examples (Tasks 44-50)

### Task 44: Basic Examples
- [ ] Create examples/01-basic/minimal.ts
- [ ] Create examples/01-basic/with-options.ts
- [ ] Create examples/01-basic/log-levels.ts
- [ ] Create examples/01-basic/README.md

### Task 45: Structured Examples
- [ ] Create examples/02-structured/metadata.ts
- [ ] Create examples/02-structured/errors.ts
- [ ] Create examples/02-structured/child-loggers.ts
- [ ] Create examples/02-structured/README.md

### Task 46: Transport Examples
- [ ] Create examples/03-transports/console.ts
- [ ] Create examples/03-transports/file.ts
- [ ] Create examples/03-transports/http.ts
- [ ] Create examples/03-transports/multi-transport.ts
- [ ] Create examples/03-transports/README.md

### Task 47: Feature Examples
- [ ] Create examples/04-features/redaction.ts
- [ ] Create examples/04-features/source-location.ts
- [ ] Create examples/04-features/correlation.ts
- [ ] Create examples/04-features/timing.ts
- [ ] Create examples/04-features/README.md

### Task 48: Browser Examples
- [ ] Create examples/05-browser/basic.html
- [ ] Create examples/05-browser/devtools.html
- [ ] Create examples/05-browser/localStorage.html
- [ ] Create examples/05-browser/README.md

### Task 49: Real-World Examples
- [ ] Create examples/06-real-world/express-app/
- [ ] Create examples/06-real-world/cli-tool/
- [ ] Create examples/06-real-world/microservice/
- [ ] Create examples/06-real-world/README.md

### Task 50: Verify All Examples Run
- [ ] Run all TypeScript examples
- [ ] Test browser examples
- [ ] Ensure all examples work

## Phase 10: Build and Export (Tasks 51-53)

### Task 51: Create Main Entry Point
- [ ] Create src/index.ts
- [ ] Export createLogger
- [ ] Export all types
- [ ] Export core utilities
- [ ] Write unit tests

### Task 52: Create Plugin Exports
- [ ] Create src/plugins/index.ts
- [ ] Export core plugins
- [ ] Export optional plugins
- [ ] Add JSDoc
- [ ] Write unit tests

### Task 53: Build Distribution
- [ ] Run npm run build
- [ ] Verify ESM output
- [ ] Verify CJS output
- [ ] Verify type definitions
- [ ] Check bundle size

## Phase 11: Test Coverage (Tasks 54-55)

### Task 54: Verify 100% Coverage
- [ ] Run npm run test:coverage
- [ ] Review coverage report
- [ ] Add missing tests for uncovered lines
- [ ] Repeat until 100%

### Task 55: Fix Type Errors
- [ ] Run npm run typecheck
- [ ] Fix all TypeScript errors
- [ ] Ensure strict mode compliance

## Phase 12: Linting and Formatting (Tasks 56-57)

### Task 56: Run ESLint
- [ ] Run npm run lint
- [ ] Fix all linting errors
- [ ] Ensure code quality standards

### Task 57: Run Prettier
- [ ] Run npm run format
- [ ] Ensure consistent formatting
- [ ] Verify all files are formatted

## Phase 13: Documentation (Tasks 58-62)

### Task 58: Create README.md
- [ ] Write comprehensive README
- [ ] Add quick start guide
- [ ] Add installation instructions
- [ ] Add usage examples (15+)
- [ ] Add API reference
- [ ] Add plugin system documentation
- [ ] Add transport documentation

### Task 59: Create llms.txt
- [ ] Write LLM-optimized reference
- [ ] Keep under 2000 tokens
- [ ] Include key API info
- [ ] Include examples

### Task 60: Create CHANGELOG.md
- [ ] Document version history
- [ ] Add release notes
- [ ] Add breaking changes

### Task 61: Update SPECIFICATION.md
- [ ] Mark all implemented features
- [ ] Document any deviations
- [ ] Finalize specs

### Task 62: Update IMPLEMENTATION.md
- [ ] Document final architecture
- [ ] Update any implementation details

## Phase 14: Website (Tasks 63-67)

### Task 63: Initialize Website
- [ ] Initialize React 19 + Vite 6 project in website/
- [ ] Install Tailwind CSS v4
- [ ] Setup shadcn/ui
- [ ] Configure fonts (JetBrains Mono, Inter)
- [ ] Add Lucide React icons

### Task 64: Create Website Structure
- [ ] Create pages: Home, Docs, Transports, Plugins, Examples, Playground
- [ ] Create layout with navigation
- [ ] Create footer with "Made with ❤️ by Ersin KOÇ"
- [ ] Implement dark/light theme

### Task 65: Implement Home Page
- [ ] Create hero section
- [ ] Add quick start code block
- [ ] Feature comparison table
- [ ] Installation instructions

### Task 66: Implement Documentation Pages
- [ ] Docs page: Getting started, configuration
- [ ] Transports page: Each transport documented
- [ ] Plugins page: Plugin system, creating plugins
- [ ] Examples page: Interactive examples
- [ ] Playground page: Live log testing

### Task 67: Deploy Website
- [ ] Create CNAME file with log.oxog.dev
- [ ] Add GitHub workflow for Pages deployment
- [ ] Test build
- [ ] Deploy to GitHub Pages

## Phase 15: Final Checks (Tasks 68-72)

### Task 68: Run All Tests
- [ ] npm run test
- [ ] All tests pass
- [ ] No failures

### Task 69: Verify Coverage
- [ ] npm run test:coverage
- [ ] 100% coverage confirmed
- [ ] All thresholds met

### Task 70: Build Production Bundle
- [ ] npm run build
- [ ] Build succeeds
- [ ] Check bundle size (< 3KB core, < 12KB all)

### Task 71: Type Checking
- [ ] npm run typecheck
- [ ] No TypeScript errors
- [ ] Strict mode compliant

### Task 72: Lint Check
- [ ] npm run lint
- [ ] No linting errors
- [ ] Code style compliant

## Phase 16: Package Preparation (Tasks 73-75)

### Task 73: Final Review
- [ ] Review all code against specification
- [ ] Verify all features implemented
- [ ] Check all JSDoc comments
- [ ] Verify 15+ examples exist

### Task 74: Create GitHub Workflows
- [ ] Create .github/workflows/deploy.yml
- [ ] Create .github/workflows/publish.yml
- [ ] Test workflows locally

### Task 75: Prepare for Publish
- [ ] Update version to 1.0.0
- [ ] Run prepublishOnly script
- [ ] Verify package.json is correct
- [ ] Ready for npm publish

## Order of Execution

Execute tasks in numerical order. Each task builds upon previous tasks.

**Critical Path**: Tasks 1-38, 51-55 must be completed before package is functional.

**Parallel Tasks**: Examples (44-50) and Website (63-67) can be done in parallel with later phases.

**Testing**: Run tests after each major phase completion.

## Notes

- Always write tests before implementing (TDD approach)
- Commit frequently after task completion
- Run build and test after each phase
- Document any deviations from spec in IMPLEMENTATION.md
- Keep code under review for strict mode compliance
