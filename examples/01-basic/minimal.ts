/**
 * Minimal Logger Example
 *
 * Demonstrates basic logger usage with default settings.
 *
 * Run: npx tsx examples/01-basic/minimal.ts
 */
import { createLogger } from '@oxog/log';

// Create a logger with a name
const log = createLogger({ name: 'my-app' });

// Simple message logging
log.info('Server started');

// Structured logging with data
log.info({ port: 3000 }, 'Listening on port');

// Child logger with additional context
const dbLog = log.child({ module: 'database' });
dbLog.info('Connected to database');

// Timing operations
log.time('database-query');
dbLog.debug('Executing query');
log.timeEnd('database-query');
