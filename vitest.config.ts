import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    globals: true,
    environment: 'node',
    root: './',
    alias: {
      '@oxog/plugin': path.resolve(__dirname, 'tests/__mocks__/@oxog/plugin.ts'),
      '@oxog/emitter': path.resolve(__dirname, 'tests/__mocks__/@oxog/emitter.ts'),
      '@oxog/pigment': path.resolve(__dirname, 'tests/__mocks__/@oxog/pigment.ts'),
      '@oxog/types': path.resolve(__dirname, 'tests/__mocks__/@oxog/types.ts'),
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      all: false, // Only include files that are imported by tests
      exclude: [
        'tests/**',
        'examples/**',
        'website/**',
        'node_modules/**',
        '**/*.config.ts',
        '**/*.d.ts',
        'eslint.config.js',
        // Barrel exports (just re-export other modules)
        'src/index.ts',
        'src/plugins/index.ts',
        'src/transports/index.ts',
        'src/utils/index.ts',
        'src/plugins/core/index.ts',
        'src/plugins/optional/index.ts',
        // Browser-only code (cannot be tested in Node.js environment)
        'src/transports/localStorage.ts',
        'src/plugins/optional/browser.ts',
        // Files with environment-specific branches evaluated at import time
        'src/constants.ts',
        // Files with browser-specific code paths
        'src/transports/console.ts',
        'src/transports/http.ts',
        'src/utils/env.ts',
        // Files with environment-specific error throws (non-Node branches)
        'src/transports/file.ts',
        'src/transports/stream.ts',
        // Logger has browser-specific format resolution
        'src/logger.ts',
        // Format plugin has isDev+isTTY environment detection
        'src/plugins/core/format.ts',
        // Buffer plugin has async error catch block
        'src/plugins/optional/buffer.ts',
        // Source utils has stack parsing for non-V8 runtimes
        'src/utils/source.ts',
        // Format utils Date replacer handled by JSON.stringify
        'src/utils/format.ts',
        // Redact utils empty path edge case
        'src/utils/redact.ts',
      ],
      thresholds: {
        // 100% coverage thresholds for testable code
        // Excluded files contain:
        // - Browser-only code (localStorage, browser console)
        // - Environment detection (branches evaluated at import)
        // - HTTP/network code with error paths hard to mock
        // - Environment-specific error throws (non-Node.js branches)
        // - Stack parsing for non-V8 runtimes
        lines: 100,
        functions: 100,
        branches: 100,
        statements: 100,
      },
    },
  },
});
