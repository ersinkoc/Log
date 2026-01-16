import { CodeBlock } from '../../components/code/CodeBlock';

export function PluginsCustom() {
  return (
    <div>
      <h1>Custom Plugins</h1>
      <p className="lead">
        Build your own plugins to extend @oxog/log functionality.
      </p>

      <h2>Plugin Structure</h2>
      <CodeBlock
        code={`import type { Plugin } from '@oxog/types';

const myPlugin: Plugin = {
  name: 'myPlugin',
  version: '1.0.0',
  install(kernel) {
    // Setup logic
  },
  uninstall(kernel) {
    // Cleanup logic
  }
};`}
        language="typescript"
      />

      <h2>Transform Plugin</h2>
      <p>Modify log entries before they're written:</p>
      <CodeBlock
        code={`const uppercasePlugin: Plugin = {
  name: 'uppercase',
  version: '1.0.0',
  install(kernel) {
    kernel.on('log', (entry) => {
      if (typeof entry.msg === 'string') {
        entry.msg = entry.msg.toUpperCase();
      }
      return entry;
    });
  }
};

log.use(uppercasePlugin);
log.info('hello world');
// Output: "HELLO WORLD"`}
        language="typescript"
      />

      <h2>Enrichment Plugin</h2>
      <p>Add metadata to every log entry:</p>
      <CodeBlock
        code={`const environmentPlugin: Plugin = {
  name: 'environment',
  version: '1.0.0',
  install(kernel) {
    kernel.on('log', (entry) => {
      entry.env = process.env.NODE_ENV;
      entry.hostname = os.hostname();
      return entry;
    });
  }
};`}
        language="typescript"
      />

      <h2>Filter Plugin</h2>
      <p>Conditionally filter out log entries:</p>
      <CodeBlock
        code={`const filterPlugin: Plugin = {
  name: 'filter',
  version: '1.0.0',
  install(kernel) {
    kernel.on('log', (entry) => {
      // Skip health check logs
      if (entry.path === '/health') {
        return null; // Drop this entry
      }
      return entry;
    });
  }
};`}
        language="typescript"
      />

      <h2>Async Plugin</h2>
      <CodeBlock
        code={`const asyncPlugin: Plugin = {
  name: 'async',
  version: '1.0.0',
  async install(kernel) {
    // Async initialization
    await loadConfig();

    kernel.on('log', async (entry) => {
      await sendToExternalService(entry);
      return entry;
    });
  }
};`}
        language="typescript"
      />

      <h2>Best Practices</h2>
      <ul>
        <li>Always provide <code>name</code> and <code>version</code></li>
        <li>Implement <code>uninstall</code> for cleanup</li>
        <li>Keep plugins focused on a single responsibility</li>
        <li>Handle errors gracefully to avoid breaking the logger</li>
        <li>Use TypeScript for type safety</li>
      </ul>
    </div>
  );
}
