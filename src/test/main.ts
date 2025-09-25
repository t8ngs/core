/*
 * @t8ngs/core
 *
 * (c) T8ngs
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import Hooks from '@poppinss/hooks'
import Macroable from '@poppinss/macroable'

import debug from '../debug.js'
import { Group } from '../group/main.js'
import { Emitter } from '../emitter.js'
import { Refiner } from '../refiner.js'
import { DummyRunner, TestRunner } from './runner.js'
import type {
  TestHooks,
  DataSetNode,
  TestEndNode,
  TestOptions,
  TestExecutor,
  TestHooksHandler,
  TestHooksCleanupHandler,
} from '../types.js'

/**
 * Test class exposes a self contained API to configure and run
 * tests along with its hooks.
 *
 * @example
 * const test = new Test('2 + 2 = 4', emitter, refiner)
 *
 * test.run(async ({ assert }) => {
 *   assert.equal(2 + 2 , 4)
 * })
 */
export class Test<
  Context extends Record<any, any>,
  TestData extends DataSetNode = undefined,
> extends Macroable {
  /**
   * Methods to call before the test callback is executed
   */
  static executingCallbacks: ((test: Test<any, any>) => void)[] = []

  /**
   * Methods to call after the test callback is executed
   */
  static executedCallbacks: ((
    test: Test<any, any>,
    hasError: boolean,
    errors: TestEndNode['errors']
  ) => void)[] = []

  /**
   * Define a synchronous function to call before running
   * the test executor callback
   *
   * Do note: Async methods are not allowed
   */
  static executing(callback: (test: Test<any, any>) => void): void {
    this.executingCallbacks.push(callback)
  }

  /**
   * Define a synchronous function to call after running
   * the test executor callback
   *
   * Do note: Async methods are not allowed
   */
  static executed(
    callback: (test: Test<any, any>, hasError: boolean, errors: TestEndNode['errors']) => void
  ): void {
    this.executedCallbacks.push(callback)
  }

  #refiner: Refiner
  #emitter: Emitter

  /**
   * Reference to the active runner running the
   * test
   */
  #activeRunner?: TestRunner

  /**
   * Check if the test has been executed
   */
  #executed: boolean = false
  #failed: boolean = false

  /**
   * Debugging Error is used to point the errors to the source of
   * the test.
   *
   * Since tests are executed after they are created, the errors thrown
   * by the internals of t8ngs will never point to the original test.
   * Therefore, this debuggingError property is used to retain
   * the source of the test callback.
   */
  #debuggingError: Error | null = null

  /**
   * Reference to registered hooks
   */
  #hooks = new Hooks<TestHooks<Context>>()

  /**
   * The function for creating the test context
   */
  #contextAccumlator?: (test: this) => Context | Promise<Context>

  /**
   * The function for computing if test should
   * be skipped or not
   */
  #skipAccumulator?: () => Promise<boolean> | boolean

  /**
   * The function that returns the test data set
   */
  #datasetAccumlator?: () => Promise<any[]> | any[]

  /**
   * Know if the test has been executed. Skipped and
   * todo tests are also considered executed.
   */
  get executed(): boolean {
    return this.#executed
  }

  /**
   * Know if the test has failed.
   */
  get failed(): boolean {
    return this.#failed
  }

  /**
   * Test options
   */
  options: TestOptions

  /**
   * Reference to the test dataset
   */
  dataset?: any[]

  /**
   * Reference to the test context. Available at the time
   * of running the test
   */
  context!: Context

  /**
   * Find if the test is pinned
   */
  get isPinned() {
    return this.#refiner.isPinned(this)
  }

  constructor(
    public title: string,
    context: Context | ((test: Test<Context, TestData>) => Context | Promise<Context>),
    emitter: Emitter,
    refiner: Refiner,
    public parent?: Group<Context>
  ) {
    super()

    this.#emitter = emitter
    this.#refiner = refiner
    this.options = {
      title: this.title,
      tags: [],
      timeout: 2000,
      meta: {},
    }

    /**
     * Make sure the instantiated class has its own property "executingCallbacks"
     * and "executedCallbacks"
     */
    if (!this.constructor.hasOwnProperty('executingCallbacks')) {
      throw new Error(
        `Define static property "executingCallbacks = []" on ${this.constructor.name} class`
      )
    }
    if (!this.constructor.hasOwnProperty('executedCallbacks')) {
      throw new Error(
        `Define static property "executedCallbacks = []" on ${this.constructor.name} class`
      )
    }

    if (typeof context === 'function') {
      this.#contextAccumlator = context as (
        test: Test<Context, TestData>
      ) => Context | Promise<Context>
    } else {
      this.context = context
    }
  }

  /**
   * Find if test should be skipped
   */
  async #computeShouldSkip() {
    if (this.#skipAccumulator) {
      this.options.isSkipped = await this.#skipAccumulator()
    }
  }

  /**
   * Find if test is a todo
   */
  #computeisTodo() {
    this.options.isTodo = !this.options.executor
  }

  /**
   * Returns the dataset array or undefined
   */
  async #computeDataset(): Promise<any[] | undefined> {
    if (typeof this.#datasetAccumlator === 'function') {
      this.dataset = await this.#datasetAccumlator()
    }

    return this.dataset
  }

  /**
   * Get context instance for the test
   */
  async #computeContext(): Promise<Context> {
    if (typeof this.#contextAccumlator === 'function') {
      this.context = await this.#contextAccumlator(this)
    }

    return this.context!
  }

  /**
   * Skip the test conditionally
   */
  skip(skip: boolean | (() => Promise<boolean> | boolean) = true, skipReason?: string): this {
    if (typeof skip === 'function') {
      this.#skipAccumulator = skip
    } else {
      this.options.isSkipped = skip
    }

    this.options.skipReason = skipReason
    return this
  }

  /**
   * Expect the test to fail. Helpful in creating test cases
   * to showcase bugs
   */
  fails(failReason?: string): this {
    this.options.isFailing = true
    this.options.failReason = failReason
    return this
  }

  /**
   * Define custom timeout for the test
   */
  timeout(timeout: number): this {
    this.options.timeout = timeout
    return this
  }

  /**
   * Disable test timeout. It is same as calling `test.timeout(0)`
   */
  disableTimeout(): this {
    return this.timeout(0)
  }

  /**
   * Reset the timeout from within the test callback.
   */
  resetTimeout(duration?: number): this {
    if (this.#activeRunner) {
      this.#activeRunner.resetTimeout(duration)
    } else {
      if (duration) {
        this.timeout(duration)
      } else {
        this.disableTimeout()
      }
    }

    return this
  }

  /**
   * Assign tags to the test. Later you can use the tags to run
   * specific tests
   */
  tags(tags: string[], strategy: 'replace' | 'append' | 'prepend' = 'replace'): this {
    if (strategy === 'replace') {
      this.options.tags = tags
      return this
    }

    if (strategy === 'prepend') {
      this.options.tags = tags.concat(this.options.tags)
      return this
    }

    this.options.tags = this.options.tags.concat(tags)
    return this
  }

  /**
   * Configure the number of times this test should be retried
   * when failing.
   */
  retry(retries: number): this {
    this.options.retries = retries
    return this
  }

  /**
   * Wait for the test executor to call done method
   */
  waitForDone(): this {
    this.options.waitsForDone = true
    return this
  }

  /**
   * Pin current test. Pinning a test will only run the
   * pinned tests.
   */
  pin(): this {
    this.#refiner.pinTest(this)
    return this
  }

  /**
   * Define the dataset for the test. The test executor will be invoked
   * for all the items inside the dataset array
   */
  with<Dataset extends DataSetNode>(dataset: Dataset): Test<Context, Dataset> {
    if (Array.isArray(dataset)) {
      this.dataset = dataset
      return this as unknown as Test<Context, Dataset>
    }

    if (typeof dataset === 'function') {
      this.#datasetAccumlator = dataset
      return this as unknown as Test<Context, Dataset>
    }

    throw new Error('dataset must be an array or a function that returns an array')
  }

  /**
   * Define the test executor function
   */
  run(executor: TestExecutor<Context, TestData>, debuggingError?: Error): this {
    this.#debuggingError = debuggingError || new Error()
    this.options.executor = executor
    return this
  }

  /**
   * Register a test setup function
   */
  setup(handler: TestHooksHandler<Context>): this {
    debug('registering "%s" test setup hook %s', this.title, handler)
    this.#hooks.add('setup', handler)
    return this
  }

  /**
   * Register a test teardown function
   */
  teardown(handler: TestHooksHandler<Context>): this {
    debug('registering "%s" test teardown hook %s', this.title, handler)
    this.#hooks.add('teardown', handler)
    return this
  }

  /**
   * Register a cleanup hook from within the test
   */
  cleanup(handler: TestHooksCleanupHandler<Context>): this {
    debug('registering "%s" test cleanup function %s', this.title, handler)
    this.#hooks.add('cleanup', handler)
    return this
  }

  /**
   * Execute test
   */
  async exec() {
    const self = this.constructor as typeof Test

    /**
     * Return early, if there are pinned test and the current test is not
     * pinned.
     *
     * However, the pinned test check is only applied when there
     * is no filter on the test title.
     */
    if (!this.#refiner.allows(this)) {
      debug('test "%s" skipped by refiner', this.title)
      return
    }

    /**
     * Avoid re-running the same test multiple times
     */
    if (this.#executed) {
      return
    }

    this.#executed = true

    /**
     * Do not run tests without executor function
     */
    this.#computeisTodo()
    if (this.options.isTodo) {
      debug('skipping todo test "%s"', this.title)
      new DummyRunner(this, this.#emitter).run()
      return
    }

    /**
     * Do not run test meant to be skipped
     */
    await this.#computeShouldSkip()
    if (this.options.isSkipped) {
      debug(
        'skipping test "%s", reason (%s)',
        this.title,
        this.options.skipReason || 'Skipped using .skip method'
      )
      new DummyRunner(this, this.#emitter).run()
      return
    }

    /**
     * Compute dataset by calling the with method
     */
    await this.#computeDataset()

    /**
     * Run for each row inside dataset
     */
    if (Array.isArray(this.dataset) && this.dataset.length) {
      let index = 0
      // eslint-disable-next-line @typescript-eslint/naming-convention
      for (let _ of this.dataset) {
        await this.#computeContext()

        this.#activeRunner = new TestRunner(
          this,
          this.#hooks,
          this.#emitter,
          {
            executing: self.executingCallbacks,
            executed: self.executedCallbacks,
          },
          this.#debuggingError,
          index
        )

        await this.#activeRunner.run()

        /**
         * Mark test as failed when it is not already been
         * marked as failed and the current iteration
         * fails.
         */
        if (!this.#failed && this.#activeRunner.failed) {
          this.#failed = true
        }

        index++
      }

      this.#activeRunner = undefined
      return
    }

    /**
     * Run when no dataset is used
     */
    await this.#computeContext()

    this.#activeRunner = new TestRunner(
      this,
      this.#hooks,
      this.#emitter,
      {
        executing: self.executingCallbacks,
        executed: self.executedCallbacks,
      },
      this.#debuggingError
    )

    await this.#activeRunner.run()
    this.#failed = this.#activeRunner.failed
    this.#activeRunner = undefined
  }
}
