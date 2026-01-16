import { CodeBlock } from '../../components/code/CodeBlock';

export function Structured() {
  return (
    <div>
      <h1>Structured Logging</h1>
      <p className="lead">
        Attach metadata objects to log entries for better searchability and analysis.
      </p>

      <h2>Basic Usage</h2>
      <p>Pass an object as the first argument, message as the second:</p>
      <CodeBlock
        code={`// Object first, message second
log.info({ userId: 123, action: 'login' }, 'User logged in');
// Output: {"userId":123,"action":"login","msg":"User logged in"}`}
        language="typescript"
      />

      <h2>Automatic Error Serialization</h2>
      <CodeBlock
        code={`try {
  await fetchData();
} catch (error) {
  log.error(error, 'Failed to fetch data');
  // Captures: name, message, stack, code, cause
}`}
        language="typescript"
      />

      <h2>Nested Objects</h2>
      <CodeBlock
        code={`log.info({
  request: {
    method: 'POST',
    path: '/api/users',
    headers: { 'content-type': 'application/json' }
  },
  response: {
    status: 201,
    duration: 45
  }
}, 'API request completed');`}
        language="typescript"
      />

      <h2>Merging with Child Context</h2>
      <CodeBlock
        code={`const reqLog = log.child({ requestId: 'abc-123' });

reqLog.info({ userId: 456 }, 'Processing request');
// Output: {"requestId":"abc-123","userId":456,"msg":"Processing request"}`}
        language="typescript"
      />

      <h2>Redacting Sensitive Data</h2>
      <CodeBlock
        code={`const log = createLogger({
  redact: ['password', 'token', 'creditCard']
});

log.info({ user: 'john', password: 'secret123' }, 'Login attempt');
// Output: {"user":"john","password":"[REDACTED]","msg":"Login attempt"}`}
        language="typescript"
      />

      <h2>Best Practices</h2>
      <ul>
        <li>Use consistent field names across your application</li>
        <li>Keep objects relatively flat for easier querying</li>
        <li>Always redact sensitive information</li>
        <li>Use child loggers to avoid repetitive context</li>
      </ul>
    </div>
  );
}
