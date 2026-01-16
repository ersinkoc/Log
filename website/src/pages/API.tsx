import { CodeBlock } from '../components/code/CodeBlock';

export function API() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto prose prose-zinc dark:prose-invert">
        <h1>API Reference</h1>
        <p className="lead">Complete API documentation for @oxog/log.</p>

        <h2>createLogger(options?)</h2>
        <p>Creates a new logger instance.</p>
        <CodeBlock
          code={`import { createLogger } from '@oxog/log';

const log = createLogger(options);`}
          language="typescript"
        />

        <h3>Options</h3>
        <table>
          <thead>
            <tr>
              <th>Option</th>
              <th>Type</th>
              <th>Default</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>name</code></td>
              <td><code>string</code></td>
              <td><code>'app'</code></td>
              <td>Logger name</td>
            </tr>
            <tr>
              <td><code>level</code></td>
              <td><code>LogLevelName</code></td>
              <td><code>'info'</code></td>
              <td>Minimum log level</td>
            </tr>
            <tr>
              <td><code>format</code></td>
              <td><code>'json' | 'pretty' | 'auto'</code></td>
              <td><code>'auto'</code></td>
              <td>Output format</td>
            </tr>
            <tr>
              <td><code>transports</code></td>
              <td><code>Transport[]</code></td>
              <td><code>[consoleTransport()]</code></td>
              <td>Output destinations</td>
            </tr>
            <tr>
              <td><code>redact</code></td>
              <td><code>string[]</code></td>
              <td><code>[]</code></td>
              <td>Fields to redact</td>
            </tr>
            <tr>
              <td><code>source</code></td>
              <td><code>boolean</code></td>
              <td><code>false</code></td>
              <td>Include source location</td>
            </tr>
            <tr>
              <td><code>timestamp</code></td>
              <td><code>boolean</code></td>
              <td><code>true</code></td>
              <td>Include timestamp</td>
            </tr>
            <tr>
              <td><code>context</code></td>
              <td><code>object</code></td>
              <td><code>{'{}'}</code></td>
              <td>Static context</td>
            </tr>
            <tr>
              <td><code>plugins</code></td>
              <td><code>Plugin[]</code></td>
              <td><code>[]</code></td>
              <td>Plugins to load</td>
            </tr>
          </tbody>
        </table>

        <h2>Logger Methods</h2>

        <h3>Logging Methods</h3>
        <CodeBlock
          code={`// Log at different levels
log.trace(msg: string): void
log.trace(obj: object, msg: string): void
log.debug(msg: string): void
log.debug(obj: object, msg: string): void
log.info(msg: string): void
log.info(obj: object, msg: string): void
log.warn(msg: string): void
log.warn(obj: object, msg: string): void
log.error(msg: string): void
log.error(obj: object, msg: string): void
log.error(err: Error, msg: string): void
log.fatal(msg: string): void
log.fatal(obj: object, msg: string): void
log.fatal(err: Error, msg: string): void`}
          language="typescript"
        />

        <h3>Context Methods</h3>
        <CodeBlock
          code={`// Create child logger with additional context
log.child(context: object): Logger

// Create logger with correlation ID
log.withCorrelation(id: string): Logger`}
          language="typescript"
        />

        <h3>Timing Methods</h3>
        <CodeBlock
          code={`// Start a named timer
log.time(label: string): void

// End timer and log duration
log.timeEnd(label: string): void

// Start timer and return stop function
log.startTimer(label: string): () => void`}
          language="typescript"
        />

        <h3>Plugin Methods</h3>
        <CodeBlock
          code={`// Register a plugin
log.use(plugin: Plugin): void

// Unregister a plugin by name
log.unregister(name: string): void

// Check if plugin exists
log.hasPlugin(name: string): boolean

// List all registered plugins
log.listPlugins(): string[]`}
          language="typescript"
        />

        <h3>Level Methods</h3>
        <CodeBlock
          code={`// Set minimum log level
log.setLevel(level: LogLevelName): void

// Get current log level
log.getLevel(): LogLevelName

// Check if a level is enabled
log.isLevelEnabled(level: LogLevelName): boolean`}
          language="typescript"
        />

        <h3>Lifecycle Methods</h3>
        <CodeBlock
          code={`// Flush buffered logs
log.flush(): Promise<void>

// Close logger and cleanup
log.close(): Promise<void>`}
          language="typescript"
        />

        <h2>Types</h2>
        <CodeBlock
          code={`type LogLevelName = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

interface LogEntry {
  level: number;
  time?: number;
  msg: string;
  [key: string]: unknown;
}

interface Transport {
  write(entry: LogEntry): void | Promise<void>;
  flush?(): Promise<void>;
  close?(): Promise<void>;
}

interface Plugin {
  name: string;
  version: string;
  install(kernel: PluginKernel): void | Promise<void>;
  uninstall?(kernel: PluginKernel): void | Promise<void>;
}`}
          language="typescript"
        />
      </div>
    </div>
  );
}
