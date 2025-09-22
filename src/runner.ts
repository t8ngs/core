/*
 * @t8ngs/core
 *
 * (c) t8ngs
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Emitter } from './emitter.js'
import { Test } from './test.js'
import type { FilteringOptions, RunnerSummary } from './types.js'

/**
 * Test runner that executes tests and emits events
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class Runner<Context extends Record<any, any> = any> {
  public tests: Test<Context>[] = []
  public emitter = new Emitter()
  public summary: RunnerSummary = {
    aggregates: {
      total: 0,
      failed: 0,
      passed: 0,
      regression: 0,
      skipped: 0,
      todo: 0,
    },
    duration: 0,
    hasError: false,
    failureTree: [],
    failedTestsTitles: [],
  }

  /**
   * Add a test to the runner
   */
  add(test: Test<Context>): void {
    this.tests.push(test)
  }

  /**
   * Filter tests based on options
   */
  private filterTests(options: FilteringOptions = {}): Test<Context>[] {
    let filteredTests = this.tests

    if (options.tests && options.tests.length > 0) {
      filteredTests = filteredTests.filter(test => 
        options.tests!.some(pattern => test.options.title.includes(pattern))
      )
    }

    if (options.tags && options.tags.length > 0) {
      filteredTests = filteredTests.filter(test =>
        options.tags!.some(tag => test.options.tags.includes(tag))
      )
    }

    return filteredTests
  }

  /**
   * Run all tests
   */
  async run(options: FilteringOptions = {}): Promise<RunnerSummary> {
    const startTime = Date.now()
    
    await this.emitter.emit('runner:start', {})
    
    const testsToRun = this.filterTests(options)
    this.summary.aggregates.total = testsToRun.length

    for (const test of testsToRun) {
      if (test.options.isSkipped) {
        this.summary.aggregates.skipped++
        continue
      }

      if (test.options.isTodo) {
        this.summary.aggregates.todo++
        continue
      }

      await this.emitter.emit('test:start', {
        ...test.options,
        title: {
          original: test.options.title,
          expanded: test.options.title,
        },
        isPinned: false,
      })

      const testStartTime = Date.now()
      let hasError = false
      const errors: any[] = []

      try {
        await test.run()
        this.summary.aggregates.passed++
      } catch (error) {
        hasError = true
        this.summary.hasError = true
        this.summary.aggregates.failed++
        this.summary.failedTestsTitles.push(test.options.title)
        
        errors.push({
          phase: 'test',
          error: error instanceof Error ? error : new Error(String(error)),
        })
      }

      const testDuration = Date.now() - testStartTime

      await this.emitter.emit('test:end', {
        ...test.options,
        title: {
          original: test.options.title,
          expanded: test.options.title,
        },
        isPinned: false,
        duration: testDuration,
        hasError,
        errors,
      })
    }

    this.summary.duration = Date.now() - startTime

    await this.emitter.emit('runner:end', {
      hasError: this.summary.hasError,
    })

    return this.summary
  }
}