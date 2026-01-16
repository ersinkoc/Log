import { CodeBlock } from '../../components/code/CodeBlock';

export function Plugins() {
  return (
    <div>
      <h1>Plugin System</h1>
      <p className="lead">
        Extend @oxog/log functionality with the micro-kernel plugin architecture.
      </p>

      <h2>What are Plugins?</h2>
      <p>
        Plugins are modular extensions that add features to the logger without increasing
        the core bundle size. Only import what you need.
      </p>

      <h2>Plugin Categories</h2>
      <table>
        <thead>
          <tr>
            <th>Category</th>
            <th>Plugins</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Core</td>
            <td>Level, Format, Timestamp</td>
            <td>Essential logging functionality</td>
          </tr>
          <tr>
            <td>Optional</td>
            <td>Redact, Source, Timing, Correlation, Buffer, Browser</td>
            <td>Extended features</td>
          </tr>
        </tbody>
      </table>

      <h2>Using Plugins</h2>
      <CodeBlock
        code={`import { createLogger, redactPlugin, sourcePlugin } from '@oxog/log';

const log = createLogger({
  plugins: [
    redactPlugin(['password', 'token']),
    sourcePlugin()
  ]
});`}
        language="typescript"
      />

      <h2>Plugin Management</h2>
      <CodeBlock
        code={`// Register plugin at runtime
log.use(myPlugin);

// Check if plugin exists
if (log.hasPlugin('redact')) {
  console.log('Redaction enabled');
}

// List all plugins
const plugins = log.listPlugins();
// ['level', 'format', 'timestamp', 'redact', 'source']

// Unregister plugin
log.unregister('source');`}
        language="typescript"
      />

      <h2>Plugin Hooks</h2>
      <p>Plugins can intercept logs at different stages:</p>
      <ul>
        <li><strong>beforeLog</strong> - Before log entry is created</li>
        <li><strong>transform</strong> - Modify the log entry</li>
        <li><strong>afterLog</strong> - After log is written</li>
      </ul>

      <h2>Next Steps</h2>
      <ul>
        <li><a href="/docs/plugins/core">Core Plugins</a> - Essential plugins</li>
        <li><a href="/docs/plugins/optional">Optional Plugins</a> - Extended features</li>
        <li><a href="/docs/plugins/custom">Custom Plugins</a> - Build your own</li>
      </ul>
    </div>
  );
}
