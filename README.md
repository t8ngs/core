# @t8ngs/core

[![CI](https://github.com/t8ngs/core/actions/workflows/ci.yml/badge.svg)](https://github.com/t8ngs/core/actions/workflows/ci.yml)
[![npm version](https://badge.fury.io/js/@t8ngs%2Fcore.svg)](https://badge.fury.io/js/@t8ngs%2Fcore)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org)

> From English "test eight things", suggesting multiple tests in a simple and agile way.

A lightweight, TypeScript-first testing framework core inspired by [japa/core](https://github.com/japa/core). This package provides the essential building blocks for creating test runners and testing frameworks.

## Features

- 🎯 **TypeScript First**: Built with TypeScript, providing excellent type safety and IntelliSense
- 📦 **Dual Module Support**: Supports both ESM and CommonJS
- 🔧 **Extensible**: Designed to be extended and customized
- 🚀 **Lightweight**: Minimal dependencies, maximum performance
- 🧪 **Event-driven**: Rich event system for building reporters and plugins
- 🏷️ **Flexible Filtering**: Filter tests by tags, titles, or custom criteria

## Installation

```bash
npm install @t8ngs/core
```

## Quick Start

```typescript
import { Runner, Test } from '@t8ngs/core'

// Create a test runner
const runner = new Runner()

// Create a test
const test = new Test('should add two numbers', (context) => {
  const result = 2 + 2
  if (result !== 4) {
    throw new Error(`Expected 4, got ${result}`)
  }
})

// Add test to runner
runner.add(test)

// Run tests
const summary = await runner.run()
console.log(`Tests: ${summary.aggregates.total}, Passed: ${summary.aggregates.passed}`)
```

## API Reference

### Runner

The `Runner` class is responsible for executing tests and managing the test lifecycle.

```typescript
const runner = new Runner()

// Add tests
runner.add(test)

// Run all tests
const summary = await runner.run()

// Run with filters
const summary = await runner.run({
  tags: ['unit'],
  tests: ['should add']
})
```

### Test

The `Test` class represents an individual test case.

```typescript
const test = new Test('test title', (context) => {
  // Test implementation
})

// Chain methods for configuration
test
  .tags(['unit', 'math'])
  .timeout(5000)
  .meta({ author: 'developer' })
```

### Test Context

Each test receives a context object that can be extended with custom properties.

```typescript
const test = new Test('context test', (context) => {
  context.assign({ userId: 123, isAdmin: true })
  // Use context.userId and context.isAdmin
})
```

## Events

The runner emits events throughout the test execution lifecycle:

```typescript
runner.emitter.on('test:start', (test) => {
  console.log(`Starting: ${test.title.expanded}`)
})

runner.emitter.on('test:end', (test) => {
  console.log(`Finished: ${test.title.expanded} (${test.duration}ms)`)
})
```

Available events:
- `runner:start` - Runner execution begins
- `runner:end` - Runner execution completes
- `test:start` - Individual test starts
- `test:end` - Individual test completes

## Building Reporters

Create custom reporters by listening to runner events:

```typescript
function consoleReporter(runner: Runner) {
  runner.emitter.on('test:end', (test) => {
    if (test.hasError) {
      console.log(`❌ ${test.title.expanded}`)
      test.errors.forEach(error => console.log(`   ${error.error.message}`))
    } else {
      console.log(`✅ ${test.title.expanded}`)
    }
  })
}

// Use the reporter
consoleReporter(runner)
```

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Build the package
npm run build

# Run linter
npm run lint

# Fix linting issues
npm run lint:fix
```

## Contributing

We welcome contributions! Please read our [Contributing Guide](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

### Commit Messages

This project uses [Conventional Commits](https://www.conventionalcommits.org/). Please format your commit messages accordingly:

```
feat: add new test filtering functionality
fix: resolve issue with async test execution
docs: update API documentation
```

## License

MIT © [t8ngs](https://github.com/t8ngs)