/**
 * Log Levels Example
 *
 * Demonstrates all six log levels and dynamic level changes.
 *
 * Run: npx tsx examples/01-basic/log-levels.ts
 */
import { createLogger, LOG_LEVELS } from '@oxog/log';

// Create logger with trace level to show all messages
const log = createLogger({
  name: 'log-level-demo',
  level: 'trace',
});

// Show numeric level values
console.log('Numeric level values:', LOG_LEVELS);
console.log('');

// Demonstrate all six log levels
log.trace('This is a trace message - level 10');
log.debug('This is a debug message - level 20');
log.info('This is an info message - level 30');
log.warn('This is a warn message - level 40');
log.error('This is an error message - level 50');
log.fatal('This is a fatal message - level 60');

// Dynamic level change
log.setLevel('warn');
console.log('\nAfter setting level to warn:');
log.info('This will NOT appear');
log.warn('This WILL appear');
