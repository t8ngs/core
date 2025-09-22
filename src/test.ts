/*
 * @t8ngs/core
 *
 * (c) t8ngs
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import type { TestOptions, TestExecutor } from './types.js'
import { TestContext } from './test-context.js'

/**
 * Represents a single test
 */
export class Test<Context extends Record<any, any> = any, DataSet = undefined> {
  public options: TestOptions
  public context: Context & TestContext
  public dataset?: DataSet

  constructor(title: string, executor: TestExecutor<Context, DataSet>, options: Partial<TestOptions> = {}) {
    this.options = {
      title,
      tags: [],
      timeout: 10000,
      waitsForDone: false,
      isTodo: false,
      isSkipped: false,
      isFailing: false,
      retries: 0,
      retryAttempt: 0,
      meta: {},
      executor,
      ...options,
    }

    this.context = new TestContext() as Context & TestContext
  }

  /**
   * Mark test as todo
   */
  todo(): this {
    this.options.isTodo = true
    return this
  }

  /**
   * Skip test
   */
  skip(reason?: string): this {
    this.options.isSkipped = true
    if (reason) {
      this.options.skipReason = reason
    }
    return this
  }

  /**
   * Mark test as failing
   */
  fails(reason?: string): this {
    this.options.isFailing = true
    if (reason) {
      this.options.failReason = reason
    }
    return this
  }

  /**
   * Set test timeout
   */
  timeout(timeout: number): this {
    this.options.timeout = timeout
    return this
  }

  /**
   * Set test tags
   */
  tags(tags: string[]): this {
    this.options.tags = tags
    return this
  }

  /**
   * Set test metadata
   */
  meta(meta: Record<string, any>): this {
    this.options.meta = { ...this.options.meta, ...meta }
    return this
  }

  /**
   * Execute the test
   */
  async run(): Promise<void> {
    if (!this.options.executor) {
      throw new Error('Test executor is not defined')
    }

    const executor = this.options.executor as any
    
    return new Promise<void>((resolve, reject) => {
      let isCompleted = false
      
      const done = (error?: any) => {
        if (isCompleted) return
        isCompleted = true
        
        if (error) {
          reject(error)
        } else {
          resolve()
        }
      }

      try {
        const result = executor(this.context, done)
        
        if (result && typeof result.then === 'function') {
          result.then(() => {
            if (!this.options.waitsForDone && !isCompleted) {
              done()
            }
          }).catch(done)
        } else if (!this.options.waitsForDone && !isCompleted) {
          done()
        }
      } catch (error) {
        done(error)
      }
    })
  }
}