import { CodeBlock } from '../../components/code/CodeBlock';

export function ChildLoggers() {
  return (
    <div>
      <h1>Child Loggers</h1>
      <p className="lead">
        Create scoped loggers with inherited context for organized logging.
      </p>

      <h2>Creating Child Loggers</h2>
      <CodeBlock
        code={`const log = createLogger({ name: 'my-app' });

// Create a child logger with additional context
const dbLog = log.child({ module: 'database' });

dbLog.info('Connected');
// Output: {"name":"my-app","module":"database","msg":"Connected"}`}
        language="typescript"
      />

      <h2>Nested Children</h2>
      <CodeBlock
        code={`const dbLog = log.child({ module: 'database' });
const queryLog = dbLog.child({ operation: 'query' });
const insertLog = dbLog.child({ operation: 'insert' });

queryLog.debug('SELECT * FROM users');
// {"module":"database","operation":"query","msg":"SELECT * FROM users"}

insertLog.debug('INSERT INTO users...');
// {"module":"database","operation":"insert","msg":"INSERT INTO users..."}`}
        language="typescript"
      />

      <h2>Request Scoping</h2>
      <CodeBlock
        code={`app.use((req, res, next) => {
  // Create request-scoped logger
  req.log = log.child({
    requestId: req.headers['x-request-id'],
    method: req.method,
    path: req.path
  });
  next();
});

app.get('/users', (req, res) => {
  req.log.info('Fetching users');
  // Automatically includes requestId, method, path
});`}
        language="typescript"
      />

      <h2>Correlation IDs</h2>
      <p>Use <code>withCorrelation</code> for request tracking:</p>
      <CodeBlock
        code={`const reqLog = log.withCorrelation('req-abc-123');

reqLog.info('Request received');
reqLog.info('Processing');
reqLog.info('Response sent');
// All entries share the same correlationId`}
        language="typescript"
      />

      <h2>Component Loggers</h2>
      <CodeBlock
        code={`// In different modules
// auth.ts
export const authLog = log.child({ component: 'auth' });

// payments.ts
export const paymentLog = log.child({ component: 'payments' });

// Usage
authLog.info('User authenticated');
paymentLog.info({ amount: 99.99 }, 'Payment processed');`}
        language="typescript"
      />

      <h2>Context Inheritance</h2>
      <p>Child loggers inherit all settings from their parent:</p>
      <ul>
        <li>Log level</li>
        <li>Transports</li>
        <li>Format</li>
        <li>Redaction rules</li>
        <li>Plugins</li>
      </ul>
    </div>
  );
}
