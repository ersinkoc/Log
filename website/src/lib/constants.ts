export const PACKAGE_NAME = '@oxog/log';
export const PACKAGE_SHORT_NAME = 'log';
export const GITHUB_REPO = 'ersinkoc/log';
export const NPM_PACKAGE = '@oxog/log';
export const VERSION = '1.0.1';
export const DESCRIPTION = 'Blazing fast, plugin-based logging for Node.js and browsers';
export const DOMAIN = 'log.oxog.dev';

export const FEATURES = [
  {
    title: 'Six Log Levels',
    description: 'trace, debug, info, warn, error, fatal with filtering',
    icon: 'Layers',
  },
  {
    title: 'Structured Logging',
    description: 'Attach metadata objects to log entries',
    icon: 'Braces',
  },
  {
    title: 'Child Loggers',
    description: 'Create scoped loggers with inherited context',
    icon: 'GitBranch',
  },
  {
    title: 'Multiple Transports',
    description: 'Console, File, HTTP, Stream, localStorage',
    icon: 'Send',
  },
  {
    title: 'Plugin System',
    description: 'Extend functionality with micro-kernel architecture',
    icon: 'Puzzle',
  },
  {
    title: 'TypeScript First',
    description: 'Full type safety and IntelliSense support',
    icon: 'FileCode',
  },
] as const;

export const INSTALL_COMMANDS = {
  npm: 'npm install @oxog/log',
  yarn: 'yarn add @oxog/log',
  pnpm: 'pnpm add @oxog/log',
  bun: 'bun add @oxog/log',
} as const;

export const NAV_ITEMS = [
  { label: 'Docs', href: '/docs' },
  { label: 'API', href: '/api' },
  { label: 'Examples', href: '/examples' },
] as const;

export const DOCS_NAV = [
  {
    title: 'Getting Started',
    items: [
      { title: 'Introduction', href: '/docs' },
      { title: 'Installation', href: '/docs/installation' },
      { title: 'Quick Start', href: '/docs/quickstart' },
    ],
  },
  {
    title: 'Core Concepts',
    items: [
      { title: 'Log Levels', href: '/docs/levels' },
      { title: 'Structured Logging', href: '/docs/structured' },
      { title: 'Child Loggers', href: '/docs/child-loggers' },
      { title: 'Transports', href: '/docs/transports' },
    ],
  },
  {
    title: 'Plugins',
    items: [
      { title: 'Overview', href: '/docs/plugins' },
      { title: 'Core Plugins', href: '/docs/plugins/core' },
      { title: 'Optional Plugins', href: '/docs/plugins/optional' },
      { title: 'Custom Plugins', href: '/docs/plugins/custom' },
    ],
  },
] as const;
