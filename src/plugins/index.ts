/**
 * @oxog/log - Plugins
 *
 * All plugins for the logging library.
 *
 * @packageDocumentation
 */

// Core plugins (automatically loaded by createLogger)
export {
  levelPlugin,
  isLevelEnabled,
  getLevelName,
  setLevel,
  parseLevel,
} from './core/level.js';

export {
  formatPlugin,
  detectFormat,
  formatEntry,
  getEffectiveFormat,
} from './core/format.js';

export {
  timestampPlugin,
  now,
  nowIso,
  toIso,
  fromIso,
  addTimestamp,
} from './core/timestamp.js';

// Optional plugins
export {
  redactPlugin,
  redactEntry,
  type RedactPluginOptions,
} from './optional/redact.js';

export {
  sourcePlugin,
  addSourceLocation,
  type SourcePluginOptions,
} from './optional/source.js';

export {
  correlationPlugin,
  generateCorrelationId,
  addCorrelationId,
  getCorrelationId,
  setCorrelationId,
  ensureCorrelationId,
  type CorrelationPluginOptions,
} from './optional/correlation.js';

export {
  timingPlugin,
  startTimer,
  endTimer,
  hasTimer,
  getActiveTimers,
  clearTimers,
  createTimer,
} from './optional/timing.js';

export {
  bufferPlugin,
  bufferEntry,
  flushBuffer,
  flushBufferSync,
  getBufferSize,
  clearBuffer,
  stopFlushInterval,
} from './optional/buffer.js';

export {
  browserPlugin,
  getConsoleMethod,
  getLevelStyles,
  writeToBrowserConsole,
  startGroup,
  endGroup,
  isGroupingEnabled,
  type BrowserPluginOptions,
} from './optional/browser.js';
