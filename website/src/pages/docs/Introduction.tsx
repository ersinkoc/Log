import { CodeBlock } from '../../components/code/CodeBlock';
import { InstallTabs } from '../../components/code/InstallTabs';

export function Introduction() {
  return (
    <div>
      <h1>Introduction</h1>
      <p className="lead">
        <strong>@oxog/log</strong> is a blazing fast, plugin-based logging library for Node.js and browsers
        with micro-kernel architecture. Part of the @oxog ecosystem.
      </p>

      <h2>Why @oxog/log?</h2>
      <ul>
        <li><strong>Zero Config</strong> - Works out of the box with sensible defaults</li>
        <li><strong>Plugin Architecture</strong> - Extend functionality without bloating your bundle</li>
        <li><strong>TypeScript First</strong> - Full type safety and IntelliSense support</li>
        <li><strong>Universal</strong> - Works in Node.js and browsers</li>
        <li><strong>Performance</strong> - Optimized for speed with minimal overhead</li>
      </ul>

      <h2>Installation</h2>
      <InstallTabs />

      <h2>Basic Usage</h2>
      <CodeBlock
        code={`import { createLogger } from '@oxog/log';

const log = createLogger({ name: 'my-app' });

log.info('Hello, world!');
log.info({ userId: 123 }, 'User logged in');`}
        language="typescript"
      />

      <h2>Features Overview</h2>
      <table>
        <thead>
          <tr>
            <th>Feature</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Six Log Levels</td>
            <td>trace, debug, info, warn, error, fatal with filtering</td>
          </tr>
          <tr>
            <td>Structured Logging</td>
            <td>Attach metadata objects to log entries</td>
          </tr>
          <tr>
            <td>Child Loggers</td>
            <td>Create scoped loggers with inherited context</td>
          </tr>
          <tr>
            <td>Multiple Transports</td>
            <td>Console, File, HTTP, Stream, localStorage</td>
          </tr>
          <tr>
            <td>Plugin System</td>
            <td>Extend functionality with micro-kernel architecture</td>
          </tr>
          <tr>
            <td>TypeScript First</td>
            <td>Full type safety and IntelliSense support</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
