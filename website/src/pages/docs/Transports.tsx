import { CodeBlock } from '../../components/code/CodeBlock';

export function Transports() {
  return (
    <div>
      <h1>Transports</h1>
      <p className="lead">
        Configure where your logs are sent with multiple transport options.
      </p>

      <h2>Available Transports</h2>
      <table>
        <thead>
          <tr>
            <th>Transport</th>
            <th>Environment</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>consoleTransport</code></td>
            <td>Node.js, Browser</td>
            <td>Output to console with optional colors</td>
          </tr>
          <tr>
            <td><code>fileTransport</code></td>
            <td>Node.js</td>
            <td>Write to files with rotation support</td>
          </tr>
          <tr>
            <td><code>streamTransport</code></td>
            <td>Node.js</td>
            <td>Write to any Node.js stream</td>
          </tr>
          <tr>
            <td><code>httpTransport</code></td>
            <td>Node.js, Browser</td>
            <td>Send logs to HTTP endpoint</td>
          </tr>
          <tr>
            <td><code>localStorageTransport</code></td>
            <td>Browser</td>
            <td>Persist logs to localStorage</td>
          </tr>
        </tbody>
      </table>

      <h2>Console Transport</h2>
      <CodeBlock
        code={`import { createLogger, consoleTransport } from '@oxog/log';

const log = createLogger({
  transports: [
    consoleTransport({
      colors: true,      // Enable colored output
      timestamps: true   // Show timestamps
    })
  ]
});`}
        language="typescript"
      />

      <h2>File Transport</h2>
      <CodeBlock
        code={`import { createLogger, fileTransport } from '@oxog/log';

const log = createLogger({
  transports: [
    fileTransport({
      path: './logs/app.log',
      rotate: '1d',       // Rotate daily
      maxFiles: 7,        // Keep 7 days of logs
      compress: true      // Compress rotated files
    })
  ]
});`}
        language="typescript"
      />

      <h2>HTTP Transport</h2>
      <CodeBlock
        code={`import { createLogger, httpTransport } from '@oxog/log';

const log = createLogger({
  transports: [
    httpTransport({
      url: 'https://logs.example.com/ingest',
      method: 'POST',
      headers: {
        'Authorization': 'Bearer token123'
      },
      batch: true,        // Batch multiple logs
      batchSize: 100,     // Send every 100 logs
      batchInterval: 5000 // Or every 5 seconds
    })
  ]
});`}
        language="typescript"
      />

      <h2>Multiple Transports</h2>
      <CodeBlock
        code={`const log = createLogger({
  transports: [
    consoleTransport({ colors: true }),
    fileTransport({ path: './logs/app.log' }),
    httpTransport({ url: 'https://logs.example.com' })
  ]
});

// Logs are sent to all transports`}
        language="typescript"
      />

      <h2>Transport-Specific Levels</h2>
      <CodeBlock
        code={`const log = createLogger({
  transports: [
    // Console: show all logs
    consoleTransport({ level: 'debug' }),
    // File: only warnings and above
    fileTransport({ path: './logs/errors.log', level: 'warn' })
  ]
});`}
        language="typescript"
      />
    </div>
  );
}
