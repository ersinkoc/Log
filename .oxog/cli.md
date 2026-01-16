# @oxog/cli - Complete Usage Guide

> A hands-on, practical guide with extensive examples for building professional CLI applications

---

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [Your First CLI Application](#2-your-first-cli-application)
3. [Working with Commands](#3-working-with-commands)
4. [Arguments In-Depth](#4-arguments-in-depth)
5. [Options In-Depth](#5-options-in-depth)
6. [Using Plugins](#6-using-plugins)
7. [Interactive Prompts](#7-interactive-prompts)
8. [Beautiful Output](#8-beautiful-output)
9. [Progress Bars](#9-progress-bars)
10. [Table Output](#10-table-output)
11. [Configuration Files](#11-configuration-files)
12. [Middleware System](#12-middleware-system)
13. [Nested Commands (Subcommands)](#13-nested-commands-subcommands)
14. [Validation](#14-validation)
15. [Error Handling](#15-error-handling)
16. [Shell Completions](#16-shell-completions)
17. [Real-World Examples](#17-real-world-examples)
18. [Best Practices](#18-best-practices)
19. [Recipes & Patterns](#19-recipes--patterns)
20. [Troubleshooting](#20-troubleshooting)

---

## 1. Getting Started

### Installation

```bash
# npm
npm install @oxog/cli

# yarn
yarn add @oxog/cli

# pnpm
pnpm add @oxog/cli
```

### Requirements

- Node.js 18 or higher
- TypeScript 5.0+ (recommended but not required)

### Project Setup

Create a new project:

```bash
mkdir my-cli
cd my-cli
npm init -y
npm install @oxog/cli typescript @types/node
npx tsc --init
```

Update `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "./dist",
    "strict": true,
    "esModuleInterop": true
  },
  "include": ["src/**/*"]
}
```

Update `package.json`:

```json
{
  "name": "my-cli",
  "version": "1.0.0",
  "type": "module",
  "bin": {
    "my-cli": "./dist/index.js"
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "start": "node dist/index.js"
  }
}
```

---

## 2. Your First CLI Application

### Basic Hello World

Create `src/index.ts`:

```typescript
#!/usr/bin/env node

import { cli } from '@oxog/cli';

// Create CLI application
const app = cli('hello')
  .version('1.0.0')
  .describe('A simple hello world CLI');

// Add a command
app.command('greet')
  .describe('Greet someone')
  .argument('<n>', 'Name of the person')
  .option('--loud', 'Shout the greeting')
  .action(({ args, options }) => {
    const message = `Hello, ${args.name}!`;
    console.log(options.loud ? message.toUpperCase() : message);
  });

// Add default command
app.command('default')
  .describe('Say hello to the world')
  .action(() => {
    console.log('Hello, World!');
  });

// Run the CLI
app.run();
```

### Build and Test

```bash
# Build
npm run build

# Test commands
node dist/index.js greet John
# Output: Hello, John!

node dist/index.js greet John --loud
# Output: HELLO, JOHN!

node dist/index.js --help
# Shows help text

node dist/index.js --version
# Output: 1.0.0
```

### Make it Globally Available

```bash
# Link for development
npm link

# Now you can use it anywhere
hello greet World
```

---

## 3. Working with Commands

### Basic Command Structure

```typescript
app.command('command-name')     // Command name (kebab-case recommended)
  .describe('Description')      // Help text description
  .alias('c', 'cmd')           // Alternative names
  .argument('<arg>', 'desc')   // Positional arguments
  .option('-o, --opt', 'desc') // Options/flags
  .action(handler);            // Action handler
```

### Command Naming Conventions

```typescript
// Good - kebab-case
app.command('create-user');
app.command('list-items');
app.command('generate-report');

// Avoid - camelCase or spaces
// app.command('createUser');  // Not recommended
// app.command('create user'); // Invalid
```

### Command Aliases

```typescript
app.command('install')
  .alias('i', 'add')  // Multiple aliases
  .describe('Install packages')
  .action(() => {
    console.log('Installing...');
  });

// All of these work:
// myapp install
// myapp i
// myapp add
```

### Multiple Commands

```typescript
import { cli } from '@oxog/cli';

const app = cli('myapp').version('1.0.0');

// Command 1: init
app.command('init')
  .describe('Initialize a new project')
  .argument('[name]', 'Project name', { default: 'my-project' })
  .action(({ args }) => {
    console.log(`Initializing ${args.name}...`);
  });

// Command 2: build
app.command('build')
  .describe('Build the project')
  .option('-w, --watch', 'Watch mode')
  .option('-p, --prod', 'Production build')
  .action(({ options }) => {
    console.log('Building...');
    if (options.watch) console.log('Watch mode enabled');
    if (options.prod) console.log('Production build');
  });

// Command 3: serve
app.command('serve')
  .describe('Start development server')
  .option('-p, --port <number>', 'Port number', { default: 3000 })
  .action(({ options }) => {
    console.log(`Server running on port ${options.port}`);
  });

// Command 4: test
app.command('test')
  .describe('Run tests')
  .option('--coverage', 'Generate coverage report')
  .option('--watch', 'Watch mode')
  .action(({ options }) => {
    console.log('Running tests...');
  });

app.run();
```

---

## 4. Arguments In-Depth

### Argument Types

```typescript
// Required argument - must be provided
app.command('copy')
  .argument('<source>', 'Source file');

// Optional argument - can be omitted
app.command('copy')
  .argument('[destination]', 'Destination path');

// Variadic argument - accepts multiple values
app.command('copy')
  .argument('<files...>', 'Files to copy');

// Optional variadic
app.command('copy')
  .argument('[files...]', 'Optional files');
```

### Argument Configuration

```typescript
app.command('process')
  .argument('<input>', 'Input file', {
    type: 'string',           // Type: 'string' | 'number' | 'boolean'
    default: undefined,       // Default value (for optional)
    validate: (v) => true,    // Custom validation
    coerce: (v) => v.trim()   // Transform value
  })
  .action(({ args }) => {
    console.log(args.input);
  });
```

### Multiple Arguments

```typescript
app.command('copy')
  .describe('Copy files')
  .argument('<source>', 'Source file')
  .argument('<destination>', 'Destination directory')
  .argument('[extras...]', 'Additional files to copy')
  .action(({ args }) => {
    console.log('Source:', args.source);
    console.log('Destination:', args.destination);
    console.log('Extras:', args.extras); // Array
  });

// Usage:
// myapp copy file.txt /dest
// myapp copy file.txt /dest extra1.txt extra2.txt
```

### Argument Validation

```typescript
app.command('create')
  .argument('<name>', 'Project name', {
    validate: (value) => {
      // Return true if valid
      if (/^[a-z][a-z0-9-]*$/.test(value)) {
        return true;
      }
      // Return error message if invalid
      return 'Name must be lowercase alphanumeric with hyphens';
    }
  })
  .action(({ args }) => {
    console.log(`Creating ${args.name}`);
  });
```

### Argument Coercion

```typescript
app.command('count')
  .argument('<number>', 'A number', {
    type: 'number',
    coerce: (value) => {
      const num = parseInt(value, 10);
      return Math.abs(num); // Always positive
    }
  })
  .action(({ args }) => {
    console.log(`Number: ${args.number}`);
  });
```

---

## 5. Options In-Depth

### Option Syntax

```typescript
// Boolean flag (no value)
.option('-v, --verbose', 'Enable verbose mode')

// Option with required value
.option('-p, --port <number>', 'Port number')

// Option with optional value
.option('-c, --config [file]', 'Config file')

// Short flag only
.option('-d', 'Debug mode')

// Long flag only
.option('--silent', 'Silent mode')

// Array option
.option('-f, --files <items...>', 'Input files')
```

### Option Types

```typescript
import { cli } from '@oxog/cli';

const app = cli('myapp').version('1.0.0');

app.command('demo')
  // String option (default)
  .option('-n, --name <string>', 'Your name', { type: 'string' })
  
  // Number option
  .option('-p, --port <number>', 'Port', { type: 'number', default: 3000 })
  
  // Boolean option
  .option('-v, --verbose', 'Verbose', { type: 'boolean' })
  
  // Array option
  .option('-t, --tags <items...>', 'Tags', { type: 'array' })
  
  .action(({ options }) => {
    console.log('Name:', options.name);           // string
    console.log('Port:', options.port);           // number
    console.log('Verbose:', options.verbose);     // boolean
    console.log('Tags:', options.tags);           // string[]
  });

app.run();
```

### Option with Choices

```typescript
app.command('deploy')
  .option('-e, --env <name>', 'Environment', {
    choices: ['development', 'staging', 'production'],
    default: 'development'
  })
  .option('-r, --region <name>', 'Region', {
    choices: ['us-east', 'us-west', 'eu-west', 'ap-south']
  })
  .action(({ options }) => {
    console.log(`Deploying to ${options.env} in ${options.region}`);
  });

// Usage:
// myapp deploy --env production --region us-east
// myapp deploy -e staging -r eu-west
```

### Option with Default Values

```typescript
app.command('server')
  .option('-p, --port <number>', 'Port', { default: 3000 })
  .option('-h, --host <string>', 'Host', { default: 'localhost' })
  .option('--https', 'Use HTTPS', { default: false })
  .option('--cors', 'Enable CORS', { default: true })
  .action(({ options }) => {
    // options.port = 3000 (if not provided)
    // options.host = 'localhost' (if not provided)
    console.log(`Server: ${options.host}:${options.port}`);
  });
```

### Required Options

```typescript
app.command('deploy')
  .option('-t, --token <string>', 'API token', { required: true })
  .option('-e, --env <name>', 'Environment', { required: true })
  .action(({ options }) => {
    // Will error if --token or --env not provided
    console.log('Deploying with token:', options.token);
  });
```

### Negatable Options

```typescript
app.command('build')
  .option('--sourcemap', 'Generate sourcemaps', { 
    default: true, 
    negatable: true  // Allows --no-sourcemap
  })
  .option('--minify', 'Minify output', { 
    default: true, 
    negatable: true  // Allows --no-minify
  })
  .action(({ options }) => {
    console.log('Sourcemap:', options.sourcemap);
    console.log('Minify:', options.minify);
  });

// Usage:
// myapp build                    # sourcemap=true, minify=true
// myapp build --no-sourcemap     # sourcemap=false, minify=true
// myapp build --no-minify        # sourcemap=true, minify=false
```

### Global Options

```typescript
const app = cli('myapp')
  .version('1.0.0')
  // Global options available to all commands
  .option('-v, --verbose', 'Verbose output')
  .option('-q, --quiet', 'Suppress output')
  .option('--debug', 'Debug mode')
  .option('-c, --config <file>', 'Config file');

app.command('build')
  .option('-w, --watch', 'Watch mode')  // Command-specific option
  .action(({ options }) => {
    // Has access to both global and command options
    if (options.verbose) console.log('Verbose mode');
    if (options.debug) console.log('Debug mode');
    if (options.watch) console.log('Watch mode');
  });

app.command('test')
  .action(({ options }) => {
    // Also has access to global options
    if (options.verbose) console.log('Running tests verbosely');
  });

app.run();
```

### Option Validation

```typescript
app.command('server')
  .option('-p, --port <number>', 'Port', {
    type: 'number',
    validate: (value) => {
      if (value < 1 || value > 65535) {
        return 'Port must be between 1 and 65535';
      }
      if (value < 1024) {
        return 'Ports below 1024 require root privileges';
      }
      return true;
    }
  })
  .option('-t, --timeout <number>', 'Timeout in ms', {
    type: 'number',
    validate: (value) => value > 0 || 'Timeout must be positive'
  })
  .action(({ options }) => {
    console.log(`Starting on port ${options.port}`);
  });
```

---

## 6. Using Plugins

### Available Plugins

| Plugin | Description | Import |
|--------|-------------|--------|
| `helpPlugin` | Auto help generation | Core |
| `versionPlugin` | Version display | Core |
| `validationPlugin` | Argument validation | Core |
| `colorPlugin` | ANSI colors | Optional |
| `spinnerPlugin` | Loading spinners | Optional |
| `loggerPlugin` | Structured logging | Optional |
| `promptPlugin` | Interactive prompts | Optional |
| `progressPlugin` | Progress bars | Optional |
| `tablePlugin` | Table formatting | Optional |
| `configPlugin` | Config file support | Optional |
| `completionPlugin` | Shell completions | Optional |
| `middlewarePlugin` | Middleware support | Optional |

### Basic Plugin Usage

```typescript
import { cli } from '@oxog/cli';
import { 
  colorPlugin, 
  spinnerPlugin, 
  loggerPlugin 
} from '@oxog/cli/plugins';

const app = cli('myapp')
  .version('1.0.0')
  .use(colorPlugin())    // Enable colors
  .use(spinnerPlugin())  // Enable spinners
  .use(loggerPlugin());  // Enable logging

app.command('build')
  .action(async ({ color, spinner, logger }) => {
    // Now you have access to plugin utilities
    logger.info('Starting build...');
    
    const spin = spinner.start('Compiling...');
    await compile();
    spin.succeed('Done!');
    
    console.log(color.green('Build successful!'));
  });

app.run();
```

### Combining Multiple Plugins

```typescript
import { cli } from '@oxog/cli';
import {
  colorPlugin,
  spinnerPlugin,
  loggerPlugin,
  validationPlugin,
  configPlugin
} from '@oxog/cli/plugins';

const app = cli('myapp')
  .version('1.0.0')
  .use(colorPlugin())
  .use(spinnerPlugin())
  .use(loggerPlugin({ level: 'info', timestamp: true }))
  .use(validationPlugin())
  .use(configPlugin({ name: 'myapp' }));

app.command('deploy')
  .option('-e, --env <name>', 'Environment', { 
    choices: ['dev', 'staging', 'prod'] 
  })
  .action(async ({ options, color, spinner, logger, config }) => {
    const env = options.env || config.get('defaultEnv', 'dev');
    
    logger.info(`Deploying to ${env}`);
    
    const spin = spinner.start('Deploying...');
    await deploy(env);
    spin.succeed(color.green('Deployed!'));
  });

app.run();
```

---

## 7. Interactive Prompts

### Setup

```typescript
import { cli } from '@oxog/cli';
import { promptPlugin, colorPlugin } from '@oxog/cli/plugins';

const app = cli('myapp')
  .use(promptPlugin())
  .use(colorPlugin());
```

### Text Input

```typescript
app.command('init')
  .action(async ({ prompt }) => {
    // Basic input
    const name = await prompt.input({
      message: 'Project name:',
      default: 'my-project'
    });

    // Input with validation
    const email = await prompt.input({
      message: 'Your email:',
      validate: (value) => {
        if (!value.includes('@')) {
          return 'Please enter a valid email';
        }
        return true;
      }
    });

    console.log(`Name: ${name}, Email: ${email}`);
  });
```

### Password Input

```typescript
app.command('login')
  .action(async ({ prompt }) => {
    const username = await prompt.input({
      message: 'Username:'
    });

    // Password is hidden/masked
    const password = await prompt.password({
      message: 'Password:'
    });

    console.log('Logging in...');
  });
```

### Confirmation

```typescript
app.command('delete')
  .argument('<file>', 'File to delete')
  .action(async ({ args, prompt }) => {
    const confirmed = await prompt.confirm({
      message: `Delete ${args.file}?`,
      default: false
    });

    if (confirmed) {
      console.log(`Deleting ${args.file}...`);
    } else {
      console.log('Cancelled');
    }
  });
```

### Select (Single Choice)

```typescript
app.command('create')
  .action(async ({ prompt }) => {
    const framework = await prompt.select({
      message: 'Select framework:',
      choices: [
        'React',
        'Vue',
        'Svelte',
        'Solid',
        'Angular'
      ]
    });

    // With descriptions
    const database = await prompt.select({
      message: 'Select database:',
      choices: [
        { value: 'postgres', label: 'PostgreSQL', hint: 'Recommended' },
        { value: 'mysql', label: 'MySQL' },
        { value: 'sqlite', label: 'SQLite', hint: 'For development' },
        { value: 'mongodb', label: 'MongoDB', hint: 'NoSQL' }
      ]
    });

    console.log(`Framework: ${framework}, Database: ${database}`);
  });
```

### Multi-Select

```typescript
app.command('setup')
  .action(async ({ prompt }) => {
    const features = await prompt.multiselect({
      message: 'Select features:',
      choices: [
        { value: 'typescript', label: 'TypeScript', checked: true },
        { value: 'eslint', label: 'ESLint', checked: true },
        { value: 'prettier', label: 'Prettier' },
        { value: 'jest', label: 'Jest' },
        { value: 'vitest', label: 'Vitest' },
        { value: 'tailwind', label: 'Tailwind CSS' }
      ]
    });

    console.log('Selected:', features.join(', '));
  });
```

### Number Input

```typescript
app.command('config')
  .action(async ({ prompt }) => {
    const port = await prompt.number({
      message: 'Port number:',
      default: 3000,
      min: 1,
      max: 65535
    });

    const workers = await prompt.number({
      message: 'Number of workers:',
      default: 4,
      min: 1,
      max: 32
    });

    console.log(`Port: ${port}, Workers: ${workers}`);
  });
```

### Autocomplete

```typescript
app.command('install')
  .action(async ({ prompt }) => {
    const packages = [
      'react', 'react-dom', 'react-router',
      'vue', 'vue-router', 'vuex',
      'svelte', 'sveltekit',
      'express', 'fastify', 'koa',
      'typescript', 'tsup', 'vite'
    ];

    const pkg = await prompt.autocomplete({
      message: 'Search package:',
      choices: packages,
      limit: 10  // Show max 10 results
    });

    console.log(`Installing ${pkg}...`);
  });
```

### Complete Wizard Example

```typescript
app.command('init')
  .action(async ({ prompt, color }) => {
    console.log(color.cyan.bold('Project Setup Wizard'));
    console.log('');

    // Step 1: Project name
    const name = await prompt.input({
      message: 'Project name:',
      default: 'my-project',
      validate: (v) => /^[a-z][a-z0-9-]*$/.test(v) || 'Invalid name'
    });

    // Step 2: Template
    const template = await prompt.select({
      message: 'Select template:',
      choices: [
        { value: 'vanilla-ts', label: 'Vanilla TypeScript' },
        { value: 'react', label: 'React + TypeScript' },
        { value: 'vue', label: 'Vue 3 + TypeScript' },
        { value: 'node', label: 'Node.js API' }
      ]
    });

    // Step 3: Features
    const features = await prompt.multiselect({
      message: 'Select features:',
      choices: [
        { value: 'eslint', label: 'ESLint', checked: true },
        { value: 'prettier', label: 'Prettier', checked: true },
        { value: 'testing', label: 'Unit Testing' },
        { value: 'e2e', label: 'E2E Testing' },
        { value: 'docker', label: 'Docker' },
        { value: 'ci', label: 'GitHub Actions CI' }
      ]
    });

    // Step 4: Package manager
    const pm = await prompt.select({
      message: 'Package manager:',
      choices: ['npm', 'yarn', 'pnpm']
    });

    // Step 5: Git
    const initGit = await prompt.confirm({
      message: 'Initialize git repository?',
      default: true
    });

    // Summary
    console.log('');
    console.log(color.cyan('Summary:'));
    console.log(`  Name: ${color.yellow(name)}`);
    console.log(`  Template: ${color.yellow(template)}`);
    console.log(`  Features: ${color.yellow(features.join(', '))}`);
    console.log(`  Package Manager: ${color.yellow(pm)}`);
    console.log(`  Git: ${color.yellow(initGit ? 'Yes' : 'No')}`);
    console.log('');

    // Confirm
    const proceed = await prompt.confirm({
      message: 'Create project with these settings?',
      default: true
    });

    if (proceed) {
      console.log(color.green('Creating project...'));
      // Create project...
    } else {
      console.log(color.yellow('Cancelled'));
    }
  });
```

---

## 8. Beautiful Output

### Colors

```typescript
import { cli } from '@oxog/cli';
import { colorPlugin } from '@oxog/cli/plugins';

const app = cli('myapp').use(colorPlugin());

app.command('demo')
  .action(({ color }) => {
    // Basic colors
    console.log(color.red('Error message'));
    console.log(color.green('Success message'));
    console.log(color.yellow('Warning message'));
    console.log(color.blue('Info message'));
    console.log(color.cyan('Highlight'));
    console.log(color.magenta('Accent'));
    console.log(color.gray('Muted text'));

    // Styles
    console.log(color.bold('Bold text'));
    console.log(color.dim('Dim text'));
    console.log(color.italic('Italic text'));
    console.log(color.underline('Underlined'));
    console.log(color.strikethrough('Strikethrough'));

    // Combined
    console.log(color.red.bold('Bold red'));
    console.log(color.green.underline('Underlined green'));
    console.log(color.cyan.bold.underline('Bold underlined cyan'));

    // Background colors
    console.log(color.bgRed('Red background'));
    console.log(color.bgGreen('Green background'));
    console.log(color.bgYellow.black('Black on yellow'));

    // Custom colors
    console.log(color.hex('#ff6600', 'Custom orange'));
    console.log(color.rgb(100, 200, 255, 'RGB color'));
  });

app.run();
```

### Spinners

```typescript
import { cli } from '@oxog/cli';
import { spinnerPlugin, colorPlugin } from '@oxog/cli/plugins';

const app = cli('myapp')
  .use(spinnerPlugin())
  .use(colorPlugin());

app.command('build')
  .action(async ({ spinner, color }) => {
    // Basic spinner
    const spin = spinner.start('Loading...');
    await delay(2000);
    spin.stop();

    // Success state
    const spin1 = spinner.start('Compiling...');
    await delay(1000);
    spin1.succeed('Compiled successfully!');

    // Failure state
    const spin2 = spinner.start('Running tests...');
    await delay(1000);
    spin2.fail('Tests failed!');

    // Warning state
    const spin3 = spinner.start('Linting...');
    await delay(1000);
    spin3.warn('Linting passed with warnings');

    // Info state
    const spin4 = spinner.start('Analyzing...');
    await delay(1000);
    spin4.info('Analysis complete');

    // Update text while spinning
    const spin5 = spinner.start('Processing...');
    await delay(500);
    spin5.update('Still processing...');
    await delay(500);
    spin5.update('Almost done...');
    await delay(500);
    spin5.succeed('Processing complete!');
  });

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

app.run();
```

### Multi-Step Workflow

```typescript
app.command('deploy')
  .action(async ({ spinner, color }) => {
    const steps = [
      { text: 'Building application...', success: 'Application built' },
      { text: 'Running tests...', success: 'All tests passed' },
      { text: 'Creating bundle...', success: 'Bundle created' },
      { text: 'Uploading to server...', success: 'Upload complete' },
      { text: 'Restarting services...', success: 'Services restarted' }
    ];

    console.log(color.cyan.bold('🚀 Deployment Started\n'));

    for (const step of steps) {
      const spin = spinner.start(step.text);
      await delay(Math.random() * 1000 + 500);
      spin.succeed(step.success);
    }

    console.log('');
    console.log(color.green.bold('✅ Deployment Complete!'));
  });
```

### Logger

```typescript
import { cli } from '@oxog/cli';
import { loggerPlugin } from '@oxog/cli/plugins';

const app = cli('myapp')
  .use(loggerPlugin({
    level: 'debug',    // 'debug' | 'info' | 'warn' | 'error'
    timestamp: true    // Show timestamps
  }));

app.command('process')
  .action(({ logger }) => {
    logger.debug('Debug: Detailed info for debugging');
    logger.info('Info: General information');
    logger.warn('Warning: Something might be wrong');
    logger.error('Error: Something went wrong');

    // With additional data
    logger.info('User logged in', { userId: 123, ip: '192.168.1.1' });
    logger.error('Database error', { code: 'CONN_REFUSED', retries: 3 });
  });

app.run();
```

---

## 9. Progress Bars

### Basic Progress Bar

```typescript
import { cli } from '@oxog/cli';
import { progressPlugin } from '@oxog/cli/plugins';

const app = cli('myapp').use(progressPlugin());

app.command('download')
  .action(async ({ progress }) => {
    const bar = progress.create({
      total: 100,
      width: 40
    });

    for (let i = 0; i <= 100; i++) {
      await delay(50);
      bar.update(i);
    }

    bar.stop();
    console.log('Download complete!');
  });

app.run();
```

### Progress Bar with Format

```typescript
app.command('process')
  .action(async ({ progress }) => {
    const bar = progress.create({
      total: 1000,
      format: '[:bar] :percent :current/:total :eta remaining',
      width: 30
    });

    for (let i = 0; i <= 1000; i += 10) {
      await delay(20);
      bar.update(i);
    }

    bar.stop();
  });

// Available format tokens:
// :bar       - The progress bar
// :percent   - Percentage complete (e.g., "50%")
// :current   - Current value
// :total     - Total value
// :eta       - Estimated time remaining
// :rate      - Progress rate (items/sec)
// :elapsed   - Time elapsed
```

### Multi Progress Bars

```typescript
app.command('parallel')
  .action(async ({ progress }) => {
    console.log('Downloading multiple files:\n');

    const multi = progress.multi();

    const bar1 = multi.create({ 
      total: 100, 
      label: 'file1.zip' 
    });
    const bar2 = multi.create({ 
      total: 100, 
      label: 'file2.zip' 
    });
    const bar3 = multi.create({ 
      total: 100, 
      label: 'file3.zip' 
    });

    // Simulate parallel downloads
    const download = async (bar: any, speed: number) => {
      for (let i = 0; i <= 100; i++) {
        await delay(speed);
        bar.update(i);
      }
    };

    await Promise.all([
      download(bar1, 30),
      download(bar2, 50),
      download(bar3, 40)
    ]);

    multi.stop();
    console.log('\nAll downloads complete!');
  });
```

### Progress with Custom Styling

```typescript
app.command('styled')
  .action(async ({ progress }) => {
    const bar = progress.create({
      total: 100,
      width: 50,
      complete: '█',      // Filled character
      incomplete: '░',    // Empty character
      format: ':bar :percent'
    });

    for (let i = 0; i <= 100; i++) {
      await delay(30);
      bar.update(i);
    }

    bar.stop();
  });
```

---

## 10. Table Output

### Basic Table

```typescript
import { cli } from '@oxog/cli';
import { tablePlugin } from '@oxog/cli/plugins';

const app = cli('myapp').use(tablePlugin());

app.command('list')
  .action(({ table }) => {
    const data = [
      { name: 'Alice', age: 30, city: 'New York' },
      { name: 'Bob', age: 25, city: 'Los Angeles' },
      { name: 'Charlie', age: 35, city: 'Chicago' }
    ];

    table.print(data);
  });

app.run();
```

### Table with Options

```typescript
app.command('packages')
  .action(({ table }) => {
    const data = [
      { name: 'express', version: '4.18.2', size: '234 KB', status: 'installed' },
      { name: 'react', version: '18.2.0', size: '1.2 MB', status: 'installed' },
      { name: 'typescript', version: '5.1.6', size: '45 MB', status: 'installed' },
      { name: 'vite', version: '4.3.9', size: '3.4 MB', status: 'outdated' }
    ];

    table.print(data, {
      border: 'rounded',     // 'none'|'single'|'double'|'rounded'|'heavy'|'ascii'
      header: true,          // Show header row
      padding: 1             // Cell padding
    });
  });
```

### Custom Column Definitions

```typescript
app.command('report')
  .action(({ table }) => {
    const data = [
      { id: 1, name: 'Product A', price: 29.99, quantity: 150, revenue: 4498.50 },
      { id: 2, name: 'Product B', price: 49.99, quantity: 75, revenue: 3749.25 },
      { id: 3, name: 'Product C', price: 19.99, quantity: 200, revenue: 3998.00 }
    ];

    table.print(data, {
      columns: [
        { key: 'id', header: 'ID', align: 'right', width: 5 },
        { key: 'name', header: 'Product Name', align: 'left', width: 15 },
        { 
          key: 'price', 
          header: 'Price', 
          align: 'right',
          format: (v) => `$${v.toFixed(2)}`
        },
        { key: 'quantity', header: 'Qty', align: 'right' },
        { 
          key: 'revenue', 
          header: 'Revenue', 
          align: 'right',
          format: (v) => `$${v.toFixed(2)}`
        }
      ],
      border: 'single'
    });
  });
```

### Border Styles Examples

```typescript
app.command('borders')
  .action(({ table }) => {
    const data = [
      { a: 'Cell 1', b: 'Cell 2', c: 'Cell 3' },
      { a: 'Cell 4', b: 'Cell 5', c: 'Cell 6' }
    ];

    console.log('Border: none');
    table.print(data, { border: 'none' });

    console.log('\nBorder: single');
    table.print(data, { border: 'single' });

    console.log('\nBorder: double');
    table.print(data, { border: 'double' });

    console.log('\nBorder: rounded');
    table.print(data, { border: 'rounded' });

    console.log('\nBorder: heavy');
    table.print(data, { border: 'heavy' });

    console.log('\nBorder: ascii');
    table.print(data, { border: 'ascii' });
  });
```

---

## 11. Configuration Files

### Setup

```typescript
import { cli } from '@oxog/cli';
import { configPlugin } from '@oxog/cli/plugins';

const app = cli('myapp')
  .use(configPlugin({
    name: 'myapp',                    // Config file name
    defaults: { port: 3000 },         // Default values
    envPrefix: 'MYAPP'                // Environment variable prefix
  }));
```

### Supported Config Files

The plugin searches for these files (in order):
1. `myapp.config.json`
2. `myapp.config.yaml` / `myapp.config.yml`
3. `myapp.config.toml`
4. `.myapprc`
5. `.myapprc.json`
6. `.myapprc.yaml` / `.myapprc.yml`
7. `.myapprc.toml`
8. `.env`
9. `package.json` (under `"myapp"` key)

### Example Config Files

**myapp.config.json:**
```json
{
  "port": 8080,
  "host": "0.0.0.0",
  "database": {
    "host": "localhost",
    "port": 5432,
    "name": "mydb"
  },
  "features": {
    "cache": true,
    "logging": true
  }
}
```

**.env:**
```
MYAPP_PORT=3000
MYAPP_HOST=localhost
MYAPP_DATABASE_HOST=db.example.com
```

### Using Configuration

```typescript
app.command('start')
  .action(async ({ config }) => {
    // Get simple value
    const port = config.get('port');  // 8080

    // Get with default
    const host = config.get('host', 'localhost');

    // Get nested value
    const dbHost = config.get('database.host', 'localhost');
    const dbPort = config.get('database.port', 5432);
    const dbName = config.get('database.name', 'mydb');

    // Check if exists
    const hasCache = config.get('features.cache', false);

    console.log(`Server: ${host}:${port}`);
    console.log(`Database: ${dbHost}:${dbPort}/${dbName}`);
    console.log(`Cache: ${hasCache ? 'enabled' : 'disabled'}`);
  });
```

### Reload Configuration

```typescript
app.command('reload')
  .action(async ({ config }) => {
    console.log('Current port:', config.get('port'));
    
    // Reload from file
    await config.reload();
    
    console.log('New port:', config.get('port'));
  });
```

### Environment Variable Override

```bash
# Environment variables override config file values
MYAPP_PORT=9000 myapp start
# Port will be 9000, not the value from config file
```

---

## 12. Middleware System

### Setup

```typescript
import { cli } from '@oxog/cli';
import { middlewarePlugin } from '@oxog/cli/plugins';

const app = cli('myapp')
  .use(middlewarePlugin());
```

### Global Middleware

```typescript
// Logging middleware
app.middleware(async (ctx, next) => {
  const start = Date.now();
  console.log(`[${new Date().toISOString()}] Starting: ${ctx.command.name}`);
  
  await next();  // Execute command
  
  console.log(`[${new Date().toISOString()}] Completed in ${Date.now() - start}ms`);
});

// Auth middleware
app.middleware(async (ctx, next) => {
  if (ctx.command.name !== 'login' && !process.env.API_TOKEN) {
    throw new Error('Please login first or set API_TOKEN');
  }
  await next();
});
```

### Command-Specific Middleware

```typescript
// Auth check for specific commands
const requireAuth = async (ctx: any, next: () => Promise<void>) => {
  const token = ctx.options.token || process.env.API_TOKEN;
  if (!token) {
    throw new Error('Authentication required. Use --token or set API_TOKEN');
  }
  ctx.token = token;
  await next();
};

// Validate environment
const requireEnv = async (ctx: any, next: () => Promise<void>) => {
  const env = ctx.options.env;
  if (env === 'production') {
    const confirmed = await confirm('Deploy to production?');
    if (!confirmed) {
      console.log('Cancelled');
      return;  // Don't call next() - stops execution
    }
  }
  await next();
};

app.command('deploy')
  .use(requireAuth)
  .use(requireEnv)
  .option('-t, --token <string>', 'API token')
  .option('-e, --env <name>', 'Environment')
  .action(async (ctx) => {
    console.log(`Deploying to ${ctx.options.env} with token ${ctx.token}`);
  });
```

### Middleware Chain Example

```typescript
import { cli } from '@oxog/cli';
import { middlewarePlugin, colorPlugin, spinnerPlugin } from '@oxog/cli/plugins';

const app = cli('deploy-cli')
  .use(middlewarePlugin())
  .use(colorPlugin())
  .use(spinnerPlugin());

// 1. Timing middleware
app.middleware(async (ctx, next) => {
  ctx.startTime = Date.now();
  await next();
  console.log(`\nTotal time: ${Date.now() - ctx.startTime}ms`);
});

// 2. Logging middleware
app.middleware(async (ctx, next) => {
  console.log(`Running command: ${ctx.command.name}`);
  console.log(`Arguments: ${JSON.stringify(ctx.args)}`);
  console.log(`Options: ${JSON.stringify(ctx.options)}`);
  console.log('');
  await next();
});

// 3. Error handling middleware
app.middleware(async (ctx, next) => {
  try {
    await next();
  } catch (error) {
    console.error(`Error in ${ctx.command.name}:`, error.message);
    process.exit(1);
  }
});

app.command('build')
  // Command-specific middleware
  .use(async (ctx, next) => {
    console.log('Validating build config...');
    await next();
  })
  .action(async ({ spinner }) => {
    const spin = spinner.start('Building...');
    await delay(1000);
    spin.succeed('Build complete!');
  });

app.run();
```

---

## 13. Nested Commands (Subcommands)

### Basic Subcommands

```typescript
import { cli } from '@oxog/cli';
import { colorPlugin, spinnerPlugin } from '@oxog/cli/plugins';

const app = cli('config-cli')
  .version('1.0.0')
  .use(colorPlugin())
  .use(spinnerPlugin());

// Parent command
const configCmd = app.command('config')
  .describe('Manage configuration');

// Subcommand: config get
configCmd.command('get')
  .describe('Get a config value')
  .argument('<key>', 'Config key')
  .action(({ args, color }) => {
    console.log(`${color.cyan(args.key as string)}: <value>`);
  });

// Subcommand: config set
configCmd.command('set')
  .describe('Set a config value')
  .argument('<key>', 'Config key')
  .argument('<value>', 'Config value')
  .action(({ args, spinner }) => {
    const spin = spinner.start(`Setting ${args.key}...`);
    setTimeout(() => {
      spin.succeed(`Set ${args.key} = ${args.value}`);
    }, 500);
  });

// Subcommand: config list
configCmd.command('list')
  .describe('List all config values')
  .option('--json', 'Output as JSON')
  .action(({ options }) => {
    const config = { name: 'myapp', version: '1.0.0', debug: false };
    if (options.json) {
      console.log(JSON.stringify(config, null, 2));
    } else {
      Object.entries(config).forEach(([k, v]) => {
        console.log(`  ${k}: ${v}`);
      });
    }
  });

// Subcommand: config delete
configCmd.command('delete')
  .describe('Delete a config value')
  .argument('<key>', 'Config key')
  .action(({ args }) => {
    console.log(`Deleted: ${args.key}`);
  });

app.run();
```

### Usage

```bash
# List all config
myapp config list

# Get specific value
myapp config get database.host

# Set a value
myapp config set database.port 5432

# Delete a value
myapp config delete legacy.setting

# Show help for subcommands
myapp config --help
myapp config get --help
```

### Multiple Command Groups

```typescript
const app = cli('myapp').version('1.0.0');

// Config commands
const configCmd = app.command('config').describe('Configuration');
configCmd.command('get').argument('<key>').action(() => {});
configCmd.command('set').argument('<key>').argument('<value>').action(() => {});
configCmd.command('list').action(() => {});

// User commands
const userCmd = app.command('user').describe('User management');
userCmd.command('add').argument('<username>').action(() => {});
userCmd.command('remove').argument('<username>').action(() => {});
userCmd.command('list').action(() => {});

// Database commands
const dbCmd = app.command('db').describe('Database operations');
dbCmd.command('migrate').option('--dry-run').action(() => {});
dbCmd.command('seed').action(() => {});
dbCmd.command('reset').action(() => {});

// Server commands
const serverCmd = app.command('server').describe('Server management');
serverCmd.command('start').option('-p, --port <number>').action(() => {});
serverCmd.command('stop').action(() => {});
serverCmd.command('restart').action(() => {});
serverCmd.command('status').action(() => {});

app.run();
```

### Deep Nesting (3+ Levels)

```typescript
const app = cli('cloud').version('1.0.0');

// cloud compute
const compute = app.command('compute').describe('Compute Engine');

// cloud compute instance
const instance = compute.command('instance').describe('VM instances');

// cloud compute instance create
instance.command('create')
  .argument('<name>', 'Instance name')
  .option('-t, --type <type>', 'Machine type')
  .option('-z, --zone <zone>', 'Zone')
  .action(({ args, options }) => {
    console.log(`Creating instance ${args.name} in ${options.zone}`);
  });

// cloud compute instance delete
instance.command('delete')
  .argument('<name>', 'Instance name')
  .action(({ args }) => {
    console.log(`Deleting instance ${args.name}`);
  });

// cloud compute instance list
instance.command('list')
  .option('-z, --zone <zone>', 'Filter by zone')
  .action(() => {
    console.log('Listing instances...');
  });

// cloud compute disk
const disk = compute.command('disk').describe('Persistent disks');

disk.command('create')
  .argument('<name>', 'Disk name')
  .option('-s, --size <gb>', 'Size in GB')
  .action(({ args, options }) => {
    console.log(`Creating disk ${args.name} (${options.size}GB)`);
  });

disk.command('delete')
  .argument('<name>', 'Disk name')
  .action(({ args }) => {
    console.log(`Deleting disk ${args.name}`);
  });

app.run();

// Usage:
// cloud compute instance create my-vm --type n1-standard-1 --zone us-east1-b
// cloud compute instance list --zone us-east1-b
// cloud compute disk create my-disk --size 100
```

---

## 14. Validation

### Argument Validation

```typescript
import { cli } from '@oxog/cli';
import { validationPlugin } from '@oxog/cli/plugins';

const app = cli('myapp').use(validationPlugin());

app.command('create')
  // Validate project name format
  .argument('<name>', 'Project name', {
    validate: (value) => {
      if (typeof value !== 'string') return 'Name must be a string';
      if (value.length < 2) return 'Name must be at least 2 characters';
      if (value.length > 50) return 'Name must be less than 50 characters';
      if (!/^[a-z][a-z0-9-]*$/.test(value)) {
        return 'Name must start with letter, contain only lowercase letters, numbers, and hyphens';
      }
      return true;
    }
  })
  .action(({ args }) => {
    console.log(`Creating ${args.name}`);
  });

app.run();
```

### Option Validation

```typescript
app.command('server')
  // Port validation
  .option('-p, --port <number>', 'Port number', {
    type: 'number',
    validate: (value) => {
      if (value < 1 || value > 65535) {
        return 'Port must be between 1 and 65535';
      }
      if (value < 1024) {
        return 'Ports below 1024 require root privileges';
      }
      return true;
    }
  })
  // Host validation
  .option('-h, --host <string>', 'Host address', {
    validate: (value) => {
      const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
      const hostRegex = /^[a-zA-Z0-9][a-zA-Z0-9-_.]+$/;
      if (!ipRegex.test(value) && !hostRegex.test(value)) {
        return 'Invalid host address';
      }
      return true;
    }
  })
  // Environment with choices
  .option('-e, --env <name>', 'Environment', {
    choices: ['development', 'staging', 'production'],
    default: 'development'
  })
  .action(({ options }) => {
    console.log(`Starting server: ${options.host}:${options.port} (${options.env})`);
  });
```

### Multiple Validations

```typescript
app.command('user')
  .describe('Create a user')
  .argument('<username>', 'Username', {
    validate: (v) => {
      if (v.length < 3) return 'Username must be at least 3 characters';
      if (v.length > 20) return 'Username must be at most 20 characters';
      if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(v)) {
        return 'Username must start with letter and contain only letters, numbers, underscores';
      }
      return true;
    }
  })
  .argument('<email>', 'Email address', {
    validate: (v) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(v)) {
        return 'Invalid email address';
      }
      return true;
    }
  })
  .option('-a, --age <number>', 'User age', {
    type: 'number',
    validate: (v) => {
      if (v < 13) return 'User must be at least 13 years old';
      if (v > 150) return 'Invalid age';
      return true;
    }
  })
  .option('-r, --role <name>', 'User role', {
    choices: ['admin', 'user', 'guest'],
    default: 'user'
  })
  .action(({ args, options }) => {
    console.log(`Creating user: ${args.username} <${args.email}>`);
    console.log(`Age: ${options.age}, Role: ${options.role}`);
  });
```

### Custom Coercion

```typescript
app.command('process')
  // Coerce to uppercase
  .argument('<name>', 'Name', {
    coerce: (v) => v.toUpperCase()
  })
  // Coerce to array
  .option('-t, --tags <items>', 'Tags (comma-separated)', {
    coerce: (v) => v.split(',').map(s => s.trim())
  })
  // Coerce to absolute path
  .option('-f, --file <path>', 'File path', {
    coerce: (v) => path.resolve(v)
  })
  // Coerce to date
  .option('-d, --date <date>', 'Date', {
    coerce: (v) => new Date(v)
  })
  .action(({ args, options }) => {
    console.log('Name:', args.name);     // UPPERCASE
    console.log('Tags:', options.tags);   // ['tag1', 'tag2']
    console.log('File:', options.file);   // /absolute/path
    console.log('Date:', options.date);   // Date object
  });
```

---

## 15. Error Handling

### Built-in Error Types

```typescript
import { 
  cli,
  CLIError,
  ValidationError,
  UnknownCommandError,
  MissingArgumentError,
  InvalidOptionError,
  UnknownOptionError
} from '@oxog/cli';
```

### Custom Error Handler

```typescript
const app = cli({
  name: 'myapp',
  errorHandler: (error) => {
    // Custom error handling
    if (error instanceof ValidationError) {
      console.error(`❌ Validation Error: ${error.message}`);
      process.exit(1);
    }

    if (error instanceof UnknownCommandError) {
      console.error(`❌ Unknown command: ${error.command}`);
      console.error(`   Did you mean: ${findSimilar(error.command)}`);
      process.exit(1);
    }

    if (error instanceof MissingArgumentError) {
      console.error(`❌ Missing required argument: ${error.argument}`);
      process.exit(1);
    }

    if (error instanceof InvalidOptionError) {
      console.error(`❌ Invalid option value for ${error.option}`);
      console.error(`   Got: ${error.value}`);
      console.error(`   Expected: ${error.expected}`);
      process.exit(1);
    }

    // Generic error
    console.error(`❌ Error: ${error.message}`);
    if (process.env.DEBUG) {
      console.error(error.stack);
    }
    process.exit(1);
  }
});
```

### Throwing Errors in Actions

```typescript
app.command('deploy')
  .option('-e, --env <name>', 'Environment')
  .action(({ options }) => {
    // Throw CLIError with code and exit code
    if (!options.env) {
      throw new CLIError(
        'Environment is required for deployment',
        'MISSING_ENV',
        1
      );
    }

    // Throw ValidationError
    const validEnvs = ['dev', 'staging', 'prod'];
    if (!validEnvs.includes(options.env)) {
      throw new ValidationError(
        `Invalid environment. Valid options: ${validEnvs.join(', ')}`
      );
    }

    console.log(`Deploying to ${options.env}...`);
  });
```

### Try-Catch in Actions

```typescript
app.command('fetch')
  .argument('<url>', 'URL to fetch')
  .action(async ({ args, color }) => {
    try {
      const response = await fetch(args.url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      console.log(JSON.stringify(data, null, 2));
    } catch (error) {
      if (error.code === 'ENOTFOUND') {
        console.error(color.red('Error: Could not resolve host'));
      } else if (error.code === 'ECONNREFUSED') {
        console.error(color.red('Error: Connection refused'));
      } else {
        console.error(color.red(`Error: ${error.message}`));
      }
      process.exit(1);
    }
  });
```

### Error Handling with Middleware

```typescript
// Global error handler middleware
app.middleware(async (ctx, next) => {
  try {
    await next();
  } catch (error) {
    const { color, logger } = ctx;
    
    logger.error(`Command failed: ${ctx.command.name}`);
    logger.error(error.message);
    
    if (error instanceof ValidationError) {
      console.log('');
      console.log(color.yellow('Usage:'));
      console.log(`  ${ctx.command.usage}`);
    }
    
    if (process.env.DEBUG) {
      console.log('');
      console.log(color.dim(error.stack));
    }
    
    process.exit(error.exitCode || 1);
  }
});
```

---

## 16. Shell Completions

### Setup

```typescript
import { cli } from '@oxog/cli';
import { completionPlugin } from '@oxog/cli/plugins';

const app = cli('myapp')
  .use(completionPlugin());

// This automatically adds a 'completion' command
```

### Generate Completion Script

```bash
# For Bash
myapp completion bash >> ~/.bashrc
source ~/.bashrc

# For Zsh
myapp completion zsh >> ~/.zshrc
source ~/.zshrc

# For Fish
myapp completion fish > ~/.config/fish/completions/myapp.fish
```

### Show Installation Instructions

```bash
myapp completion --install
```

### Programmatic Access

```typescript
app.command('setup')
  .action(({ completion }) => {
    // Detect current shell
    const shell = completion.detectShell();
    console.log(`Detected shell: ${shell}`);

    // Generate completion script
    const script = completion.generate(shell);
    console.log(script);

    // Get installation instructions
    const instructions = completion.instructions(shell);
    console.log(instructions);
  });
```

---

## 17. Real-World Examples

### Example 1: File Manager CLI

```typescript
#!/usr/bin/env node

import { cli } from '@oxog/cli';
import { colorPlugin, spinnerPlugin, tablePlugin } from '@oxog/cli/plugins';
import * as fs from 'fs/promises';
import * as path from 'path';

const app = cli('fm')
  .version('1.0.0')
  .describe('File Manager CLI')
  .use(colorPlugin())
  .use(spinnerPlugin())
  .use(tablePlugin());

// List files
app.command('ls')
  .alias('list')
  .describe('List files in directory')
  .argument('[dir]', 'Directory path', { default: '.' })
  .option('-a, --all', 'Show hidden files')
  .option('-l, --long', 'Long format')
  .action(async ({ args, options, table, color }) => {
    const dir = path.resolve(args.dir as string);
    const files = await fs.readdir(dir, { withFileTypes: true });
    
    const filtered = options.all 
      ? files 
      : files.filter(f => !f.name.startsWith('.'));

    if (options.long) {
      const data = await Promise.all(
        filtered.map(async (f) => {
          const stat = await fs.stat(path.join(dir, f.name));
          return {
            name: f.isDirectory() ? color.blue(f.name + '/') : f.name,
            size: formatSize(stat.size),
            modified: stat.mtime.toLocaleDateString()
          };
        })
      );
      table.print(data, { border: 'rounded' });
    } else {
      console.log(filtered.map(f => 
        f.isDirectory() ? color.blue(f.name + '/') : f.name
      ).join('  '));
    }
  });

// Copy file
app.command('cp')
  .alias('copy')
  .describe('Copy file')
  .argument('<source>', 'Source file')
  .argument('<dest>', 'Destination')
  .option('-r, --recursive', 'Copy directories recursively')
  .action(async ({ args, options, spinner }) => {
    const spin = spinner.start(`Copying ${args.source}...`);
    try {
      await fs.cp(args.source as string, args.dest as string, { 
        recursive: options.recursive as boolean 
      });
      spin.succeed(`Copied to ${args.dest}`);
    } catch (error) {
      spin.fail(`Failed: ${error.message}`);
    }
  });

// Move file
app.command('mv')
  .alias('move')
  .describe('Move file')
  .argument('<source>', 'Source file')
  .argument('<dest>', 'Destination')
  .action(async ({ args, spinner }) => {
    const spin = spinner.start(`Moving ${args.source}...`);
    try {
      await fs.rename(args.source as string, args.dest as string);
      spin.succeed(`Moved to ${args.dest}`);
    } catch (error) {
      spin.fail(`Failed: ${error.message}`);
    }
  });

// Remove file
app.command('rm')
  .alias('remove')
  .describe('Remove file')
  .argument('<file>', 'File to remove')
  .option('-r, --recursive', 'Remove directories recursively')
  .option('-f, --force', 'Force removal')
  .action(async ({ args, options, spinner }) => {
    const spin = spinner.start(`Removing ${args.file}...`);
    try {
      await fs.rm(args.file as string, { 
        recursive: options.recursive as boolean,
        force: options.force as boolean
      });
      spin.succeed(`Removed ${args.file}`);
    } catch (error) {
      spin.fail(`Failed: ${error.message}`);
    }
  });

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / 1024 / 1024).toFixed(1) + ' MB';
  return (bytes / 1024 / 1024 / 1024).toFixed(1) + ' GB';
}

app.run();
```

### Example 2: Git Helper CLI

```typescript
#!/usr/bin/env node

import { cli } from '@oxog/cli';
import { 
  colorPlugin, 
  spinnerPlugin, 
  promptPlugin,
  tablePlugin
} from '@oxog/cli/plugins';
import { execSync } from 'child_process';

const app = cli('git-helper')
  .version('1.0.0')
  .describe('Git workflow helper')
  .use(colorPlugin())
  .use(spinnerPlugin())
  .use(promptPlugin())
  .use(tablePlugin());

// Quick commit
app.command('commit')
  .alias('c')
  .describe('Quick commit with message')
  .argument('[message]', 'Commit message')
  .option('-a, --all', 'Stage all changes')
  .action(async ({ args, options, prompt, spinner, color }) => {
    if (options.all) {
      execSync('git add -A');
    }

    let message = args.message as string;
    if (!message) {
      // Interactive commit type selection
      const type = await prompt.select({
        message: 'Commit type:',
        choices: [
          { value: 'feat', label: '✨ feat - New feature' },
          { value: 'fix', label: '🐛 fix - Bug fix' },
          { value: 'docs', label: '📚 docs - Documentation' },
          { value: 'style', label: '💄 style - Formatting' },
          { value: 'refactor', label: '♻️ refactor - Code refactoring' },
          { value: 'test', label: '✅ test - Tests' },
          { value: 'chore', label: '🔧 chore - Maintenance' }
        ]
      });

      const scope = await prompt.input({
        message: 'Scope (optional):'
      });

      const subject = await prompt.input({
        message: 'Short description:',
        validate: (v) => v.length > 0 || 'Description required'
      });

      message = scope 
        ? `${type}(${scope}): ${subject}`
        : `${type}: ${subject}`;
    }

    const spin = spinner.start('Committing...');
    try {
      execSync(`git commit -m "${message}"`);
      spin.succeed(color.green('Committed!'));
    } catch (error) {
      spin.fail('Commit failed');
    }
  });

// Branch management
const branch = app.command('branch').describe('Branch operations');

branch.command('new')
  .describe('Create new branch')
  .argument('<name>', 'Branch name')
  .action(({ args, spinner }) => {
    const spin = spinner.start(`Creating branch ${args.name}...`);
    try {
      execSync(`git checkout -b ${args.name}`);
      spin.succeed(`Created and switched to ${args.name}`);
    } catch (error) {
      spin.fail('Failed to create branch');
    }
  });

branch.command('list')
  .describe('List branches')
  .option('-a, --all', 'Show remote branches')
  .action(({ options, color }) => {
    const cmd = options.all ? 'git branch -a' : 'git branch';
    const output = execSync(cmd, { encoding: 'utf-8' });
    const branches = output.split('\n').filter(Boolean);
    
    branches.forEach(b => {
      if (b.startsWith('*')) {
        console.log(color.green(b));
      } else if (b.includes('remotes/')) {
        console.log(color.dim(b));
      } else {
        console.log(b);
      }
    });
  });

// Status
app.command('status')
  .alias('s')
  .describe('Show status')
  .action(({ color, table }) => {
    const output = execSync('git status --porcelain', { encoding: 'utf-8' });
    const files = output.split('\n').filter(Boolean);
    
    if (files.length === 0) {
      console.log(color.green('Working tree clean'));
      return;
    }

    const data = files.map(f => {
      const status = f.substring(0, 2);
      const file = f.substring(3);
      return {
        status: formatStatus(status, color),
        file
      };
    });

    table.print(data, { border: 'none' });
  });

function formatStatus(status: string, color: any) {
  const map: Record<string, string> = {
    'M ': color.yellow('modified'),
    ' M': color.yellow('modified'),
    'A ': color.green('added'),
    'D ': color.red('deleted'),
    '??': color.cyan('untracked'),
    'R ': color.blue('renamed'),
    'C ': color.magenta('copied')
  };
  return map[status] || status;
}

app.run();
```

### Example 3: Project Generator CLI

```typescript
#!/usr/bin/env node

import { cli } from '@oxog/cli';
import { 
  colorPlugin, 
  spinnerPlugin, 
  promptPlugin,
  progressPlugin
} from '@oxog/cli/plugins';
import * as fs from 'fs/promises';
import * as path from 'path';

const app = cli('create-project')
  .version('1.0.0')
  .describe('Project generator')
  .use(colorPlugin())
  .use(spinnerPlugin())
  .use(promptPlugin())
  .use(progressPlugin());

app.command('create')
  .alias('c', 'new')
  .describe('Create a new project')
  .argument('[name]', 'Project name')
  .action(async ({ args, prompt, spinner, progress, color }) => {
    console.log(color.cyan.bold('\n🚀 Project Generator\n'));

    // Get project name
    const projectName = args.name || await prompt.input({
      message: 'Project name:',
      default: 'my-project',
      validate: (v) => /^[a-z][a-z0-9-]*$/.test(v) || 'Invalid project name'
    });

    // Select template
    const template = await prompt.select({
      message: 'Select template:',
      choices: [
        { value: 'vanilla-ts', label: 'Vanilla TypeScript', hint: 'Recommended' },
        { value: 'react', label: 'React + TypeScript' },
        { value: 'vue', label: 'Vue 3 + TypeScript' },
        { value: 'node-api', label: 'Node.js API' },
        { value: 'cli', label: 'CLI Application' }
      ]
    });

    // Select features
    const features = await prompt.multiselect({
      message: 'Select features:',
      choices: [
        { value: 'typescript', label: 'TypeScript', checked: true },
        { value: 'eslint', label: 'ESLint', checked: true },
        { value: 'prettier', label: 'Prettier', checked: true },
        { value: 'vitest', label: 'Vitest (Testing)' },
        { value: 'docker', label: 'Docker' },
        { value: 'github-actions', label: 'GitHub Actions CI' }
      ]
    });

    // Select package manager
    const pm = await prompt.select({
      message: 'Package manager:',
      choices: ['npm', 'yarn', 'pnpm']
    });

    // Confirm
    console.log('');
    console.log(color.dim('─'.repeat(40)));
    console.log(color.bold('Summary:'));
    console.log(`  Name: ${color.cyan(projectName)}`);
    console.log(`  Template: ${color.cyan(template)}`);
    console.log(`  Features: ${color.cyan(features.join(', '))}`);
    console.log(`  Package Manager: ${color.cyan(pm)}`);
    console.log(color.dim('─'.repeat(40)));
    console.log('');

    const confirmed = await prompt.confirm({
      message: 'Create project?',
      default: true
    });

    if (!confirmed) {
      console.log(color.yellow('Cancelled'));
      return;
    }

    console.log('');

    // Create project
    const steps = [
      { name: 'Creating directory', fn: () => createDir(projectName) },
      { name: 'Generating files', fn: () => generateFiles(projectName, template, features) },
      { name: 'Writing package.json', fn: () => writePackageJson(projectName, features) },
      { name: 'Setting up config files', fn: () => setupConfigs(projectName, features) },
      { name: 'Initializing git', fn: () => initGit(projectName) }
    ];

    const bar = progress.create({
      total: steps.length,
      format: '[:bar] :current/:total :step'
    });

    for (let i = 0; i < steps.length; i++) {
      bar.update(i + 1, { step: steps[i].name });
      await steps[i].fn();
      await delay(300);
    }

    bar.stop();

    // Success message
    console.log('');
    console.log(color.green.bold('✅ Project created successfully!'));
    console.log('');
    console.log(color.bold('Next steps:'));
    console.log(`  ${color.cyan(`cd ${projectName}`)}`);
    console.log(`  ${color.cyan(`${pm} install`)}`);
    console.log(`  ${color.cyan(`${pm === 'npm' ? 'npm run' : pm} dev`)}`);
    console.log('');
  });

// Helper functions (simplified)
async function createDir(name: string) {
  await fs.mkdir(name, { recursive: true });
}

async function generateFiles(name: string, template: string, features: string[]) {
  // Generate files based on template...
}

async function writePackageJson(name: string, features: string[]) {
  // Write package.json...
}

async function setupConfigs(name: string, features: string[]) {
  // Setup config files...
}

async function initGit(name: string) {
  // Initialize git...
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

app.run();
```

---

## 18. Best Practices

### 1. Use Descriptive Names

```typescript
// ✅ Good
app.command('generate-report');
app.command('sync-database');
app.command('validate-config');

// ❌ Avoid
app.command('gr');
app.command('sd');
app.command('vc');
```

### 2. Provide Helpful Descriptions

```typescript
// ✅ Good
app.command('deploy')
  .describe('Deploy application to specified environment')
  .option('-e, --env <name>', 'Target environment (dev, staging, prod)')
  .option('--dry-run', 'Show what would be deployed without making changes');

// ❌ Avoid
app.command('deploy')
  .describe('Deploy')
  .option('-e', 'env');
```

### 3. Use Sensible Defaults

```typescript
// ✅ Good
app.command('server')
  .option('-p, --port <number>', 'Port number', { default: 3000 })
  .option('-h, --host <string>', 'Host address', { default: 'localhost' })
  .option('--timeout <number>', 'Request timeout in ms', { default: 30000 });
```

### 4. Validate Early

```typescript
// ✅ Good - Validate in option definition
.option('-p, --port <number>', 'Port', {
  type: 'number',
  validate: (v) => (v > 0 && v < 65536) || 'Invalid port'
})

// ❌ Avoid - Validate in action
.action(({ options }) => {
  if (options.port < 1 || options.port > 65535) {
    console.error('Invalid port');
    return;
  }
  // ...
});
```

### 5. Handle Errors Gracefully

```typescript
// ✅ Good
app.command('fetch')
  .action(async ({ args, color }) => {
    try {
      const data = await fetchData(args.url);
      console.log(data);
    } catch (error) {
      console.error(color.red(`Error: ${error.message}`));
      process.exit(1);
    }
  });
```

### 6. Use Async/Await for Async Operations

```typescript
// ✅ Good
app.command('deploy')
  .action(async ({ spinner }) => {
    const spin = spinner.start('Deploying...');
    await deploy();
    spin.succeed('Done!');
  });

// ❌ Avoid
app.command('deploy')
  .action(({ spinner }) => {
    const spin = spinner.start('Deploying...');
    deploy().then(() => {
      spin.succeed('Done!');
    });
  });
```

### 7. Provide Visual Feedback

```typescript
// ✅ Good - User knows what's happening
app.command('build')
  .action(async ({ spinner, color }) => {
    const spin = spinner.start('Compiling TypeScript...');
    await compile();
    spin.succeed('Compiled');
    
    const spin2 = spinner.start('Bundling...');
    await bundle();
    spin2.succeed('Bundled');
    
    console.log(color.green('\n✅ Build complete!'));
  });

// ❌ Avoid - No feedback
app.command('build')
  .action(async () => {
    await compile();
    await bundle();
    console.log('Done');
  });
```

### 8. Group Related Commands

```typescript
// ✅ Good - Organized
const db = app.command('db').describe('Database operations');
db.command('migrate');
db.command('seed');
db.command('reset');

const user = app.command('user').describe('User management');
user.command('add');
user.command('remove');
user.command('list');
```

---

## 19. Recipes & Patterns

### Recipe: Confirmation Before Destructive Action

```typescript
app.command('delete')
  .argument('<item>', 'Item to delete')
  .option('-f, --force', 'Skip confirmation')
  .action(async ({ args, options, prompt, color }) => {
    if (!options.force) {
      const confirmed = await prompt.confirm({
        message: color.red(`Delete ${args.item}? This cannot be undone.`),
        default: false
      });
      
      if (!confirmed) {
        console.log('Cancelled');
        return;
      }
    }
    
    // Proceed with deletion
    console.log(`Deleting ${args.item}...`);
  });
```

### Recipe: Environment-Aware Commands

```typescript
app.command('deploy')
  .option('-e, --env <name>', 'Environment')
  .action(async ({ options, prompt, color }) => {
    const env = options.env || process.env.NODE_ENV || 'development';
    
    if (env === 'production') {
      console.log(color.red.bold('⚠️  PRODUCTION DEPLOYMENT'));
      
      const confirmed = await prompt.confirm({
        message: 'Are you sure you want to deploy to production?',
        default: false
      });
      
      if (!confirmed) return;
      
      // Double confirmation for production
      const typed = await prompt.input({
        message: 'Type "production" to confirm:',
        validate: (v) => v === 'production' || 'Type "production" exactly'
      });
    }
    
    console.log(`Deploying to ${env}...`);
  });
```

### Recipe: Loading Configuration from Multiple Sources

```typescript
app.command('start')
  .option('-c, --config <file>', 'Config file')
  .action(async ({ options, config }) => {
    // Priority: CLI option > env var > config file > default
    const port = 
      options.port ||
      process.env.PORT ||
      config.get('port') ||
      3000;
    
    const host =
      options.host ||
      process.env.HOST ||
      config.get('host') ||
      'localhost';
    
    console.log(`Starting server at ${host}:${port}`);
  });
```

### Recipe: Retry Logic

```typescript
async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 1000
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(r => setTimeout(r, delay * (i + 1)));
    }
  }
  throw new Error('Max retries exceeded');
}

app.command('deploy')
  .option('--retries <number>', 'Max retries', { default: 3 })
  .action(async ({ options, spinner }) => {
    const spin = spinner.start('Deploying...');
    
    try {
      await withRetry(
        () => deploy(),
        options.retries as number
      );
      spin.succeed('Deployed!');
    } catch (error) {
      spin.fail(`Failed after ${options.retries} attempts`);
    }
  });
```

### Recipe: Dry Run Mode

```typescript
app.command('migrate')
  .option('--dry-run', 'Show what would happen without making changes')
  .action(async ({ options, logger }) => {
    const migrations = await getPendingMigrations();
    
    if (options.dryRun) {
      logger.info('Dry run - no changes will be made');
      logger.info('Pending migrations:');
      migrations.forEach(m => logger.info(`  - ${m.name}`));
      return;
    }
    
    // Actually run migrations
    for (const migration of migrations) {
      logger.info(`Running: ${migration.name}`);
      await migration.run();
    }
  });
```

---

## 20. Troubleshooting

### Command Not Found

**Problem:** `command not found: myapp`

**Solution:**
```bash
# Make sure the file is executable
chmod +x dist/index.js

# Link for development
npm link

# Or run directly
node dist/index.js
```

### TypeScript Errors

**Problem:** Module resolution errors

**Solution:** Update `tsconfig.json`:
```json
{
  "compilerOptions": {
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "esModuleInterop": true
  }
}
```

### Colors Not Showing

**Problem:** ANSI colors not displaying

**Solution:**
```bash
# Check if NO_COLOR is set
echo $NO_COLOR

# Force colors
FORCE_COLOR=1 myapp command
```

### Plugin Not Working

**Problem:** Plugin utilities undefined in action

**Solution:** Make sure plugin is registered before commands:
```typescript
// ✅ Correct
const app = cli('myapp')
  .use(colorPlugin())     // Register first
  .use(spinnerPlugin());

app.command('test')       // Then add commands
  .action(({ color, spinner }) => {
    // color and spinner are available
  });

// ❌ Wrong - plugin registered after command
const app = cli('myapp');
app.command('test')
  .action(({ color }) => {}); // color is undefined!
app.use(colorPlugin());       // Too late
```

### Arguments Not Parsing

**Problem:** Arguments coming as undefined

**Solution:** Check argument syntax:
```typescript
// Required: <name>
.argument('<name>', 'description')

// Optional: [name]
.argument('[name]', 'description')

// Make sure action accesses correctly
.action(({ args }) => {
  console.log(args.name);  // Not args['<name>']
})
```

### Options Not Working

**Problem:** Option value always undefined

**Solution:** Check option syntax:
```typescript
// For boolean flag (no value)
.option('-v, --verbose', 'description')

// For option with value
.option('-p, --port <number>', 'description')

// Note the space and angle brackets
```

---

## Resources

- **NPM:** https://www.npmjs.com/package/@oxog/cli
- **GitHub:** https://github.com/ersinkoc/cli
- **Documentation:** https://cli.oxog.dev
- **Issues:** https://github.com/ersinkoc/cli/issues
- **Examples:** https://github.com/ersinkoc/cli/tree/master/examples

---

## License

MIT © 2026 Ersin Koç
