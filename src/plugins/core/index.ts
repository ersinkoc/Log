/**
 * @oxog/log - Core Plugins
 *
 * Core plugins that are always loaded.
 *
 * @packageDocumentation
 */

export { levelPlugin, isLevelEnabled, getLevelName, setLevel, parseLevel } from './level.js';
export { formatPlugin, detectFormat, formatEntry, getEffectiveFormat } from './format.js';
export { timestampPlugin, now, nowIso, toIso, fromIso, addTimestamp } from './timestamp.js';
