import { CodeBlock } from '../../components/code/CodeBlock';
import { InstallTabs } from '../../components/code/InstallTabs';

export function Installation() {
  return (
    <div>
      <h1>Installation</h1>
      <p className="lead">
        Install @oxog/log using your preferred package manager.
      </p>

      <h2>Package Managers</h2>
      <InstallTabs />

      <h2>Requirements</h2>
      <ul>
        <li>Node.js 18 or higher</li>
        <li>TypeScript 5.0+ (optional, for type definitions)</li>
      </ul>

      <h2>Dependencies</h2>
      <p>@oxog/log depends on other packages from the @oxog ecosystem:</p>
      <ul>
        <li><code>@oxog/types</code> - Shared type definitions</li>
        <li><code>@oxog/plugin</code> - Plugin system core</li>
        <li><code>@oxog/pigment</code> - Terminal color utilities</li>
        <li><code>@oxog/emitter</code> - Event emitter</li>
      </ul>
      <p>These are automatically installed as dependencies.</p>

      <h2>ESM and CommonJS</h2>
      <p>@oxog/log supports both ESM and CommonJS:</p>

      <h3>ESM (Recommended)</h3>
      <CodeBlock
        code={`import { createLogger } from '@oxog/log';`}
        language="typescript"
      />

      <h3>CommonJS</h3>
      <CodeBlock
        code={`const { createLogger } = require('@oxog/log');`}
        language="javascript"
      />

      <h2>Browser Usage</h2>
      <p>@oxog/log works in browsers with native DevTools integration:</p>
      <CodeBlock
        code={`import { createLogger } from '@oxog/log';

const log = createLogger();
log.info('Hello from browser!');`}
        language="typescript"
      />

      <h2>TypeScript Configuration</h2>
      <p>Type definitions are included. No additional @types packages needed.</p>
      <CodeBlock
        code={`// tsconfig.json
{
  "compilerOptions": {
    "moduleResolution": "bundler", // or "node16"
    "strict": true
  }
}`}
        language="json"
      />
    </div>
  );
}
