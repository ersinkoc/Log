import { Link } from 'react-router-dom';
import { ArrowRight, Layers, Braces, GitBranch, Send, Puzzle, FileCode } from 'lucide-react';
import { InstallTabs } from '../components/code/InstallTabs';
import { CodeBlock } from '../components/code/CodeBlock';
import { FEATURES, DESCRIPTION, PACKAGE_NAME } from '../lib/constants';

const iconMap = {
  Layers,
  Braces,
  GitBranch,
  Send,
  Puzzle,
  FileCode,
};

const quickStartCode = `import { createLogger } from '@oxog/log';

const log = createLogger({ name: 'my-app' });

// Simple logging
log.info('Server started');

// Structured logging with metadata
log.info({ port: 3000, env: 'production' }, 'Listening');

// Child loggers with inherited context
const dbLog = log.child({ module: 'database' });
dbLog.info('Connected to database');`;

export function Home() {
  return (
    <div>
      {/* Hero Section */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              <span className="text-emerald-500">@oxog/</span>
              <span>log</span>
            </h1>
            <p className="text-xl md:text-2xl text-zinc-600 dark:text-zinc-400 mb-8">
              {DESCRIPTION}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Link
                to="/docs"
                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors"
              >
                Get Started
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href={`https://www.npmjs.com/package/${PACKAGE_NAME}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-medium rounded-lg transition-colors"
              >
                View on npm
              </a>
            </div>
            <div className="max-w-lg mx-auto">
              <InstallTabs />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-zinc-50 dark:bg-zinc-900/50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Features</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {FEATURES.map((feature) => {
              const Icon = iconMap[feature.icon as keyof typeof iconMap];
              return (
                <div
                  key={feature.title}
                  className="p-6 rounded-xl bg-white dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800"
                >
                  <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-emerald-500" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-zinc-600 dark:text-zinc-400">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Quick Start Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-4">Quick Start</h2>
            <p className="text-center text-zinc-600 dark:text-zinc-400 mb-8">
              Get up and running in seconds
            </p>
            <CodeBlock code={quickStartCode} language="typescript" showLineNumbers />
            <div className="text-center mt-8">
              <Link
                to="/docs/quickstart"
                className="inline-flex items-center gap-2 text-emerald-500 hover:text-emerald-400 font-medium"
              >
                See more examples
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
