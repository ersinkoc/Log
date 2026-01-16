/**
 * Logger with Options Example
 *
 * Demonstrates various logger configuration options.
 *
 * Run: npx tsx examples/01-basic/with-options.ts
 */
import { createLogger } from '@oxog/log';

// Create logger with custom options
const log = createLogger({
  name: 'api-server',
  level: 'debug',
  format: 'pretty', // 'json' | 'pretty' | 'auto'
  timestamp: true,
});

// trace won't show (level is debug)
log.trace('Debugging information');

// Structured logging with objects
log.debug({ value: 42 }, 'Variable value');
log.info({ userId: 123, action: 'login' }, 'User action');

// Simple message logging
log.warn('Deprecated endpoint used');

// Error logging with context
log.error({ error: 'Connection refused' }, 'Database connection failed');
log.fatal('Cannot start server');
