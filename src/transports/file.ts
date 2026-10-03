/**
 * @oxog/log - File Transport
 *
 * Output logs to files with optional rotation.
 * Node.js only.
 *
 * @packageDocumentation
 */

import type { Transport, LogEntry, FileTransportOptions } from '../types.js';
import { formatJson } from '../utils/format.js';
import { isNode } from '../utils/env.js';
import { parseSize, parseRotation } from '../constants.js';
import { TransportError, EnvironmentError } from '../errors.js';

/**
 * Resolve `fs`/`path` synchronously.
 *
 * This package is pure ESM ("type": "module"), so `require` is not defined and
 * the previously used `require('fs')` threw a ReferenceError that a bare
 * `catch {}` swallowed, sending every sync write to stderr. This helper keeps
 * the built-ins lazy (file.ts is re-exported from the browser entry point, so a
 * static `import 'fs'` would break browser bundling) while still working
 * synchronously.
 */
function loadNodeModulesSync(): {
  fs: typeof import('fs');
  path: typeof import('path');
  zlib: typeof import('zlib') | null;
} | null {
  // CJS build: `require` is in scope.
  const req = (globalThis as { require?: (id: string) => unknown }).require;
  if (typeof req === 'function') {
    const resolve = req as (id: string) => unknown;
    return {
      fs: resolve('fs') as typeof import('fs'),
      path: resolve('path') as typeof import('path'),
      zlib: (() => {
        try {
          return resolve('zlib') as typeof import('zlib');
        } catch {
          return null;
        }
      })(),
    };
  }

  // ESM on Node >= 22 exposes built-ins synchronously.
  const getBuiltinModule = (
    process as unknown as { getBuiltinModule?: (id: string) => unknown }
  ).getBuiltinModule;
  if (typeof getBuiltinModule === 'function') {
    return {
      fs: getBuiltinModule('fs') as typeof import('fs'),
      path: getBuiltinModule('path') as typeof import('path'),
      zlib: (() => {
        try {
          return getBuiltinModule('zlib') as typeof import('zlib');
        } catch {
          return null;
        }
      })(),
    };
  }

  return null;
}

/**
 * Create a file transport.
 *
 * @example
 * ```typescript
 * import { fileTransport } from '@oxog/log/transports';
 *
 * const transport = fileTransport({
 *   path: './logs/app.log',
 *   rotate: '1d',
 *   maxSize: '10MB',
 *   maxFiles: 7,
 * });
 * ```
 */
export function fileTransport(options: FileTransportOptions): Transport {
  if (!isNode()) {
    throw new EnvironmentError('File transport is only available in Node.js', 'node');
  }

  const {
    path: filePath,
    rotate,
    maxSize,
    maxFiles = 5,
    compress = false,
  } = options;

  // Parse size and rotation settings
  const maxSizeBytes = maxSize ? parseSize(maxSize) : undefined;
  const rotationMs = rotate ? parseRotation(rotate) : undefined;

  // Track current file state
  let currentSize = 0;
  let lastRotation = Date.now();
  let writeStream: NodeJS.WritableStream | null = null;
  let fs: typeof import('fs') | null = null;
  let path: typeof import('path') | null = null;
  let zlib: typeof import('zlib') | null = null;

  // Lazy load Node.js modules
  async function ensureModules(): Promise<void> {
    if (!fs) {
      fs = await import('fs');
      path = await import('path');
      if (compress) {
        zlib = await import('zlib');
      }
    }
  }

  // Open write stream
  async function ensureStream(): Promise<NodeJS.WritableStream> {
    await ensureModules();

    if (!writeStream) {
      // Ensure directory exists
      const dir = path!.dirname(filePath);
      if (!fs!.existsSync(dir)) {
        fs!.mkdirSync(dir, { recursive: true });
      }

      // Get current file size if exists
      if (fs!.existsSync(filePath)) {
        const stats = fs!.statSync(filePath);
        currentSize = stats.size;
      }

      writeStream = fs!.createWriteStream(filePath, { flags: 'a' });
    }

    return writeStream;
  }

  // Check if rotation is needed
  function shouldRotate(): boolean {
    // Size-based rotation
    if (maxSizeBytes && currentSize >= maxSizeBytes) {
      return true;
    }

    // Time-based rotation
    if (rotationMs && Date.now() - lastRotation >= rotationMs) {
      return true;
    }

    return false;
  }

  // Perform rotation
  async function performRotation(): Promise<void> {
    await ensureModules();

    if (!writeStream) return;

    // Close current stream
    await new Promise<void>((resolve, reject) => {
      writeStream!.once('finish', resolve);
      writeStream!.once('error', reject);
      writeStream!.end();
    });
    writeStream = null;

    // Generate rotation timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const ext = path!.extname(filePath);
    const base = filePath.slice(0, -ext.length);
    const rotatedPath = `${base}.${timestamp}${ext}`;

    // Rename current file
    fs!.renameSync(filePath, rotatedPath);

    // Compress if enabled
    if (compress && zlib) {
      const gzPath = `${rotatedPath}.gz`;
      const input = fs!.createReadStream(rotatedPath);
      const output = fs!.createWriteStream(gzPath);
      const gzip = zlib.createGzip();

      await new Promise<void>((resolve, reject) => {
        input.pipe(gzip).pipe(output);
        output.on('finish', () => {
          fs!.unlinkSync(rotatedPath);
          resolve();
        });
        output.on('error', reject);
      });
    }

    // Cleanup old files
    await cleanupOldFiles();

    // Reset state
    currentSize = 0;
    lastRotation = Date.now();
  }

  // Perform rotation from a synchronous code path.
  // Used by writeSync(), which cannot await the async version above.
  function performRotationSync(): void {
    if (!fs || !path) return;
    const fsSync = fs;
    const pathSync = path;

    // An open write stream cannot be ended synchronously; the sync path only
    // rotates while no stream is in use.
    if (writeStream) return;

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const ext = pathSync.extname(filePath);
    const base = filePath.slice(0, -ext.length);
    const rotatedPath = `${base}.${timestamp}${ext}`;

    fsSync.renameSync(filePath, rotatedPath);

    if (compress) {
      const gzPath = `${rotatedPath}.gz`;
      try {
        const zlibSync = zlib ?? loadNodeModulesSync()?.zlib;
        if (zlibSync) {
          const data = fsSync.readFileSync(rotatedPath);
          fsSync.writeFileSync(gzPath, zlibSync.gzipSync(data));
          fsSync.unlinkSync(rotatedPath);
        }
      } catch {
        // Compression is best effort; keep the uncompressed rotated file.
      }
    }

    cleanupOldFilesSync();

    currentSize = 0;
    lastRotation = Date.now();
  }

  // Cleanup old rotated files
  async function cleanupOldFiles(): Promise<void> {
    await ensureModules();
    cleanupOldFilesSync();
  }

  function cleanupOldFilesSync(): void {
    if (!fs || !path) return;
    const fsSync = fs;
    const pathSync = path;

    const dir = pathSync.dirname(filePath);
    const baseName = pathSync.basename(filePath);
    const ext = pathSync.extname(filePath);
    const prefix = baseName.slice(0, -ext.length);

    const files = fsSync
      .readdirSync(dir)
      .filter((f) => f.startsWith(prefix) && f !== baseName)
      .map((f) => ({
        name: f,
        path: pathSync.join(dir, f),
        mtime: fsSync.statSync(pathSync.join(dir, f)).mtime.getTime(),
      }))
      .sort((a, b) => b.mtime - a.mtime);

    // Remove excess files
    while (files.length > maxFiles) {
      const file = files.pop()!;
      fsSync.unlinkSync(file.path);
    }
  }

  return {
    name: 'file',

    async write(entry: LogEntry): Promise<void> {
      // Check rotation
      if (shouldRotate()) {
        await performRotation();
      }

      // Get stream
      const stream = await ensureStream();

      // Format entry
      const line = formatJson(entry) + '\n';
      const bytes = Buffer.byteLength(line, 'utf8');

      // Write
      return new Promise((resolve, reject) => {
        stream.write(line, (err) => {
          if (err) {
            reject(new TransportError(`Failed to write to file: ${err.message}`, 'file', err));
          } else {
            currentSize += bytes;
            resolve();
          }
        });
      });
    },

    writeSync(entry: LogEntry): void {
      // Sync writes are used for error/fatal levels, where losing the log file
      // destination is worse than losing a little performance.
      if (!fs) {
        const loaded = loadNodeModulesSync();
        if (loaded) {
          fs = loaded.fs;
          path = loaded.path;
          zlib = zlib ?? loaded.zlib;
        }
      }

      if (!fs || !path) {
        // No synchronous way to reach fs (old Node, pure ESM). Fall back to
        // stderr rather than losing the entry, but make the loss visible.
        process.stderr.write(`[file] sync write unavailable, entry sent to stderr: ${formatJson(entry)}\n`);
        return;
      }

      try {
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        // Rotate before writing, exactly like the async path, so a maxSize cap
        // is honoured for sync (error/fatal) traffic too.
        if (shouldRotate()) {
          performRotationSync();
        }

        const line = formatJson(entry) + '\n';
        fs.appendFileSync(filePath, line, 'utf8');
        currentSize += Buffer.byteLength(line, 'utf8');
      } catch (err) {
        // If sync write fails, write to stderr as fallback
        process.stderr.write(formatJson(entry) + '\n');
        throw new TransportError(
          `Failed to write sync to file: ${err instanceof Error ? err.message : String(err)}`,
          'file',
          err instanceof Error ? err : undefined
        );
      }
    },

    async flush(): Promise<void> {
      if (writeStream && 'flush' in writeStream) {
        return new Promise<void>((resolve) => {
          (writeStream as NodeJS.WritableStream & { flush: (cb: () => void) => void }).flush(resolve);
        });
      }
    },

    async close(): Promise<void> {
      if (writeStream) {
        await new Promise<void>((resolve, reject) => {
          writeStream!.once('finish', resolve);
          writeStream!.once('error', reject);
          writeStream!.end();
        });
        writeStream = null;
      }
    },

    supports(env: 'node' | 'browser'): boolean {
      return env === 'node';
    },
  };
}

export default fileTransport;
