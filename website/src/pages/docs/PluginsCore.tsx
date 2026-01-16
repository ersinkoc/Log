import { CodeBlock } from '../../components/code/CodeBlock';

export function PluginsCore() {
  return (
    <div>
      <h1>Core Plugins</h1>
      <p className="lead">
        Essential plugins that are loaded by default.
      </p>

      <h2>Level Plugin</h2>
      <p>Filters logs based on minimum log level.</p>
      <CodeBlock
        code={`import { levelPlugin } from '@oxog/log/plugins';

// Automatically included, but can be configured
const log = createLogger({
  level: 'info' // Uses level plugin internally
});`}
        language="typescript"
      />

      <h2>Format Plugin</h2>
      <p>Controls output format (JSON, Pretty, Auto).</p>
      <CodeBlock
        code={`import { formatPlugin } from '@oxog/log/plugins';

const log = createLogger({
  format: 'pretty' // Uses format plugin internally
});

// Output formats:
// 'json'   - {"level":30,"msg":"Hello"}
// 'pretty' - [2024-01-16 10:30:45] INFO: Hello
// 'auto'   - Pretty in dev, JSON in production`}
        language="typescript"
      />

      <h2>Timestamp Plugin</h2>
      <p>Adds timestamps to log entries.</p>
      <CodeBlock
        code={`import { timestampPlugin } from '@oxog/log/plugins';

const log = createLogger({
  timestamp: true // Uses timestamp plugin internally
});

log.info('Hello');
// {"time":1705404645123,"msg":"Hello"}`}
        language="typescript"
      />

      <h2>Core Plugin Behavior</h2>
      <p>Core plugins are:</p>
      <ul>
        <li>Loaded automatically when creating a logger</li>
        <li>Cannot be unregistered</li>
        <li>Executed first in the plugin chain</li>
        <li>Configurable through logger options</li>
      </ul>
    </div>
  );
}
