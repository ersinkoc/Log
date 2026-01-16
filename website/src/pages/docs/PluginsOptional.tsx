import { CodeBlock } from '../../components/code/CodeBlock';

export function PluginsOptional() {
  return (
    <div>
      <h1>Optional Plugins</h1>
      <p className="lead">
        Extended functionality that can be added as needed.
      </p>

      <h2>Redact Plugin</h2>
      <p>Masks sensitive fields in log output.</p>
      <CodeBlock
        code={`import { redactPlugin } from '@oxog/log/plugins';

const log = createLogger({
  plugins: [redactPlugin(['password', 'token', 'ssn'])]
});

log.info({ user: 'john', password: 'secret' });
// {"user":"john","password":"[REDACTED]"}`}
        language="typescript"
      />

      <h2>Source Plugin</h2>
      <p>Captures file name and line number.</p>
      <CodeBlock
        code={`import { sourcePlugin } from '@oxog/log/plugins';

const log = createLogger({
  plugins: [sourcePlugin()]
});

log.info('Debug me');
// {"file":"server.ts","line":42,"msg":"Debug me"}`}
        language="typescript"
      />

      <h2>Timing Plugin</h2>
      <p>Performance measurement utilities.</p>
      <CodeBlock
        code={`import { timingPlugin } from '@oxog/log/plugins';

const log = createLogger({
  plugins: [timingPlugin()]
});

log.time('db-query');
await database.query('SELECT * FROM users');
log.timeEnd('db-query');
// {"label":"db-query","duration":45.23,"msg":"Timer ended"}`}
        language="typescript"
      />

      <h2>Correlation Plugin</h2>
      <p>Request tracking across async operations.</p>
      <CodeBlock
        code={`import { correlationPlugin } from '@oxog/log/plugins';

const log = createLogger({
  plugins: [correlationPlugin()]
});

const reqLog = log.withCorrelation('req-abc-123');
reqLog.info('Processing');
// {"correlationId":"req-abc-123","msg":"Processing"}`}
        language="typescript"
      />

      <h2>Buffer Plugin</h2>
      <p>Buffers logs for batch processing.</p>
      <CodeBlock
        code={`import { bufferPlugin } from '@oxog/log/plugins';

const log = createLogger({
  plugins: [bufferPlugin({ size: 100, flushInterval: 5000 })]
});

// Logs are buffered and flushed periodically
await log.flush(); // Force flush`}
        language="typescript"
      />

      <h2>Browser Plugin</h2>
      <p>DevTools integration for browsers.</p>
      <CodeBlock
        code={`import { browserPlugin } from '@oxog/log/plugins';

const log = createLogger({
  plugins: [browserPlugin()]
});

// Uses console.group for child loggers
// Styled output in DevTools`}
        language="typescript"
      />
    </div>
  );
}
