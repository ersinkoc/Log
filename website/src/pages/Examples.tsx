import { CodeBlock } from '../components/code/CodeBlock';

export function Examples() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto prose prose-zinc dark:prose-invert">
        <h1>Examples</h1>
        <p className="lead">Real-world examples of @oxog/log in action.</p>

        <h2>Express.js Integration</h2>
        <CodeBlock
          code={`import express from 'express';
import { createLogger } from '@oxog/log';
import { randomUUID } from 'crypto';

const log = createLogger({ name: 'api' });
const app = express();

// Request logging middleware
app.use((req, res, next) => {
  const requestId = req.headers['x-request-id'] || randomUUID();
  req.log = log.child({
    requestId,
    method: req.method,
    path: req.path
  });

  const start = Date.now();
  res.on('finish', () => {
    req.log.info({
      status: res.statusCode,
      duration: Date.now() - start
    }, 'Request completed');
  });

  next();
});

app.get('/users', async (req, res) => {
  req.log.info('Fetching users');
  const users = await db.users.findAll();
  req.log.info({ count: users.length }, 'Users retrieved');
  res.json(users);
});`}
          language="typescript"
          filename="server.ts"
        />

        <h2>Database Logging</h2>
        <CodeBlock
          code={`import { createLogger } from '@oxog/log';

const dbLog = createLogger({ name: 'database' });

class Database {
  async query(sql: string, params?: unknown[]) {
    const queryLog = dbLog.child({ sql: sql.slice(0, 100) });

    queryLog.time('query');
    try {
      const result = await this.client.query(sql, params);
      queryLog.timeEnd('query');
      queryLog.debug({ rows: result.rowCount }, 'Query executed');
      return result;
    } catch (error) {
      queryLog.timeEnd('query');
      queryLog.error(error, 'Query failed');
      throw error;
    }
  }
}`}
          language="typescript"
          filename="database.ts"
        />

        <h2>Error Handling</h2>
        <CodeBlock
          code={`import { createLogger } from '@oxog/log';

const log = createLogger({ name: 'app' });

// Global error handler
process.on('uncaughtException', (error) => {
  log.fatal(error, 'Uncaught exception');
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  log.error({ reason }, 'Unhandled rejection');
});

// Try-catch pattern
async function processPayment(orderId: string) {
  const paymentLog = log.child({ orderId, operation: 'payment' });

  try {
    paymentLog.info('Processing payment');
    const result = await paymentGateway.charge(orderId);
    paymentLog.info({ transactionId: result.id }, 'Payment successful');
    return result;
  } catch (error) {
    paymentLog.error(error, 'Payment failed');
    throw error;
  }
}`}
          language="typescript"
          filename="error-handling.ts"
        />

        <h2>Multi-Transport Setup</h2>
        <CodeBlock
          code={`import {
  createLogger,
  consoleTransport,
  fileTransport,
  httpTransport
} from '@oxog/log';

const log = createLogger({
  name: 'production-app',
  level: 'info',
  transports: [
    // Console for development
    consoleTransport({
      colors: process.env.NODE_ENV !== 'production'
    }),

    // File for persistent logs
    fileTransport({
      path: './logs/app.log',
      rotate: '1d',
      maxFiles: 30,
      compress: true
    }),

    // Separate file for errors only
    fileTransport({
      path: './logs/errors.log',
      level: 'error',
      rotate: '7d'
    }),

    // HTTP for log aggregation
    httpTransport({
      url: process.env.LOG_ENDPOINT,
      headers: {
        'Authorization': \`Bearer \${process.env.LOG_TOKEN}\`
      },
      batch: true,
      batchSize: 50,
      batchInterval: 10000
    })
  ]
});`}
          language="typescript"
          filename="production-setup.ts"
        />

        <h2>React Integration</h2>
        <CodeBlock
          code={`import { createLogger } from '@oxog/log';
import { useEffect, useCallback } from 'react';

const log = createLogger({ name: 'react-app' });

function useLogger(component: string) {
  const componentLog = log.child({ component });

  useEffect(() => {
    componentLog.debug('Mounted');
    return () => componentLog.debug('Unmounted');
  }, []);

  return componentLog;
}

function UserProfile({ userId }: { userId: string }) {
  const log = useLogger('UserProfile');

  const handleClick = useCallback(() => {
    log.info({ userId }, 'Profile clicked');
  }, [userId]);

  return <button onClick={handleClick}>View Profile</button>;
}`}
          language="typescript"
          filename="react-usage.tsx"
        />

        <h2>Graceful Shutdown</h2>
        <CodeBlock
          code={`import { createLogger } from '@oxog/log';

const log = createLogger({ name: 'app' });

async function shutdown() {
  log.info('Shutting down gracefully...');

  // Flush any buffered logs
  await log.flush();

  // Close transports
  await log.close();

  log.info('Shutdown complete');
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);`}
          language="typescript"
          filename="shutdown.ts"
        />
      </div>
    </div>
  );
}
