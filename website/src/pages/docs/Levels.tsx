import { CodeBlock } from '../../components/code/CodeBlock';

export function Levels() {
  return (
    <div>
      <h1>Log Levels</h1>
      <p className="lead">
        @oxog/log provides six log levels for categorizing messages by severity.
      </p>

      <h2>Available Levels</h2>
      <table>
        <thead>
          <tr>
            <th>Level</th>
            <th>Value</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>trace</code></td>
            <td>10</td>
            <td>Very detailed debugging information</td>
          </tr>
          <tr>
            <td><code>debug</code></td>
            <td>20</td>
            <td>Debug information for development</td>
          </tr>
          <tr>
            <td><code>info</code></td>
            <td>30</td>
            <td>General informational messages</td>
          </tr>
          <tr>
            <td><code>warn</code></td>
            <td>40</td>
            <td>Warning conditions</td>
          </tr>
          <tr>
            <td><code>error</code></td>
            <td>50</td>
            <td>Error conditions</td>
          </tr>
          <tr>
            <td><code>fatal</code></td>
            <td>60</td>
            <td>Critical errors causing shutdown</td>
          </tr>
        </tbody>
      </table>

      <h2>Setting Minimum Level</h2>
      <p>Only messages at or above the minimum level are logged:</p>
      <CodeBlock
        code={`const log = createLogger({ level: 'warn' });

log.info('This will NOT appear');  // Below minimum
log.warn('This WILL appear');      // At minimum
log.error('This WILL appear');     // Above minimum`}
        language="typescript"
      />

      <h2>Dynamic Level Changes</h2>
      <CodeBlock
        code={`// Change level at runtime
log.setLevel('debug');

// Get current level
const level = log.getLevel(); // 'debug'

// Check if level is enabled
if (log.isLevelEnabled('trace')) {
  log.trace('Expensive debug info');
}`}
        language="typescript"
      />

      <h2>Level-Based Behavior</h2>
      <p>
        Error and fatal levels (<code>error</code>, <code>fatal</code>) are logged synchronously
        by default to ensure critical messages are captured before process exit.
      </p>

      <h2>Environment-Based Levels</h2>
      <CodeBlock
        code={`const log = createLogger({
  level: process.env.LOG_LEVEL || 'info'
});

// Development: LOG_LEVEL=debug npm run dev
// Production: LOG_LEVEL=warn npm start`}
        language="typescript"
      />
    </div>
  );
}
