import { CodeBlock } from '../../components/code/CodeBlock';

export function QuickStart() {
  return (
    <div>
      <h1>Quick Start</h1>
      <p className="lead">
        Get up and running with @oxog/log in minutes.
      </p>

      <h2>Create a Logger</h2>
      <CodeBlock
        code={`import { createLogger } from '@oxog/log';

const log = createLogger({ name: 'my-app' });`}
        language="typescript"
      />

      <h2>Basic Logging</h2>
      <CodeBlock
        code={`// Simple messages
log.info('Server started');
log.warn('Deprecated API usage');
log.error('Connection failed');

// With metadata
log.info({ port: 3000 }, 'Listening on port');
log.error({ code: 'ECONNREFUSED' }, 'Database error');`}
        language="typescript"
      />

      <h2>Log Levels</h2>
      <p>Six log levels are available, from most to least verbose:</p>
      <CodeBlock
        code={`log.trace('Detailed debugging');   // Level 10
log.debug('Debug information');    // Level 20
log.info('Informational');         // Level 30
log.warn('Warning');               // Level 40
log.error('Error occurred');       // Level 50
log.fatal('Fatal error');          // Level 60`}
        language="typescript"
      />

      <h2>Child Loggers</h2>
      <p>Create scoped loggers with inherited context:</p>
      <CodeBlock
        code={`const dbLog = log.child({ module: 'database' });
dbLog.info('Connected');
// Output: {"module":"database","msg":"Connected"}

const queryLog = dbLog.child({ operation: 'select' });
queryLog.debug('Executing query');
// Output: {"module":"database","operation":"select","msg":"Executing query"}`}
        language="typescript"
      />

      <h2>Error Handling</h2>
      <CodeBlock
        code={`try {
  await database.connect();
} catch (error) {
  log.error(error, 'Failed to connect');
  // Automatically captures error name, message, and stack
}`}
        language="typescript"
      />

      <h2>Configuration Options</h2>
      <CodeBlock
        code={`const log = createLogger({
  name: 'my-app',           // Logger name
  level: 'info',            // Minimum log level
  format: 'pretty',         // Output format: 'json' | 'pretty' | 'auto'
  timestamp: true,          // Include timestamps
  source: false,            // Include source location
  redact: ['password'],     // Fields to redact
});`}
        language="typescript"
      />

      <h2>Next Steps</h2>
      <ul>
        <li>Learn about <a href="/docs/levels">Log Levels</a></li>
        <li>Explore <a href="/docs/structured">Structured Logging</a></li>
        <li>Configure <a href="/docs/transports">Transports</a></li>
        <li>Extend with <a href="/docs/plugins">Plugins</a></li>
      </ul>
    </div>
  );
}
