# Basic Examples

This directory contains basic usage examples for @oxog/log.

## Examples

- **minimal.ts**: Simple logger usage with default settings
- **log-levels.ts**: Demonstrates all six log levels and dynamic level changes
- **with-options.ts**: Logger with various configuration options

## Running Examples

First, install the package:

```bash
npm install @oxog/log
```

Then run any example:

```bash
# Using tsx (recommended)
npx tsx examples/01-basic/minimal.ts
npx tsx examples/01-basic/log-levels.ts
npx tsx examples/01-basic/with-options.ts
```

## Quick Start

```typescript
import { createLogger } from '@oxog/log';

const log = createLogger({ name: 'my-app' });

log.info('Hello, world!');
log.info({ userId: 123 }, 'User logged in');
```
