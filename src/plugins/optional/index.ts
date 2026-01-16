/**
 * @oxog/log - Optional Plugins
 *
 * Optional plugins for extended functionality.
 *
 * @packageDocumentation
 */

export { redactPlugin, redactEntry, type RedactPluginOptions } from './redact.js';
export { sourcePlugin, addSourceLocation, type SourcePluginOptions } from './source.js';
export {
  correlationPlugin,
  generateCorrelationId,
  addCorrelationId,
  getCorrelationId,
  setCorrelationId,
  ensureCorrelationId,
  type CorrelationPluginOptions,
} from './correlation.js';
export {
  timingPlugin,
  startTimer,
  endTimer,
  hasTimer,
  getActiveTimers,
  clearTimers,
  createTimer,
} from './timing.js';
export {
  bufferPlugin,
  bufferEntry,
  flushBuffer,
  flushBufferSync,
  getBufferSize,
  clearBuffer,
  stopFlushInterval,
} from './buffer.js';
export {
  browserPlugin,
  getConsoleMethod,
  getLevelStyles,
  writeToBrowserConsole,
  startGroup,
  endGroup,
  isGroupingEnabled,
  type BrowserPluginOptions,
} from './browser.js';
