/*
 * @t8ngs/core
 *
 * (c) t8ngs
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

// Forward declarations to avoid circular dependencies
// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
export interface Runner<Context extends Record<any, any> = any> {
  // Implementation in runner.ts
}

export interface Emitter {
  // Implementation in emitter.ts
}

/**
 * Summary reporters are registered with the SummaryBuilder to
 * add information to the tests summary output
 */
export type SummaryReporter = () => { key: string; value: string | string[] }[]

/**
 * Shape of test data set. Should be an array of a function that
 * returns an array
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DataSetNode = undefined | any[] | (() => any[] | Promise<any[]>)

/**
 * The function to execute the test
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TestExecutor<Context, DataSet> = DataSet extends any[]
  ? (context: Context, value: DataSet[number], done: (error?: any) => void) => void | Promise<void>
  : DataSet extends () => infer A
    ? (
        context: Context,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        value: Awaited<A> extends any[] ? Awaited<A>[number] : Awaited<A>,
        done?: (error?: any) => void
      ) => void | Promise<void>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    : (context: Context, done: (error?: any) => void) => void | Promise<void>

/**
 * Test configuration options.
 */
export type TestOptions = {
  title: string
  tags: string[]
  timeout: number
  waitsForDone?: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  executor?: TestExecutor<any, any>
  isTodo?: boolean
  isSkipped?: boolean
  isFailing?: boolean
  skipReason?: string
  failReason?: string
  retries?: number
  retryAttempt?: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  meta: Record<string, any>
}

/**
 * Data shared during "test:start" event
 */
export type TestStartNode = Omit<TestOptions, 'title'> & {
  title: {
    original: string
    expanded: string
  }
  isPinned: boolean
  dataset?: {
    size: number
    index: number
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    row: any
  }
}

/**
 * Data shared during "test:end" event
 */
export type TestEndNode = Omit<TestOptions, 'title'> & {
  title: {
    original: string
    expanded: string
  }
  isPinned: boolean
  duration: number
  hasError: boolean
  errors: {
    phase: 'setup' | 'test' | 'setup:cleanup' | 'teardown' | 'teardown:cleanup' | 'test:cleanup'
    error: Error
  }[]
  retryAttempt?: number
  dataset?: {
    size: number
    index: number
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    row: any
  }
}

/**
 * Group options
 */
export type GroupOptions = {
  title: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  meta: Record<string, any>
}

/**
 * Data shared with "group:start" event
 */
export type GroupStartNode = GroupOptions

/**
 * Data shared with "group:end" event
 */
export type GroupEndNode = GroupOptions & {
  hasError: boolean
  errors: {
    phase: 'setup' | 'setup:cleanup' | 'teardown' | 'teardown:cleanup'
    error: Error
  }[]
}

/**
 * Data shared with "suite:start" event
 */
export type SuiteStartNode = {
  name: string
}

/**
 * Data shared with "suite:end" event
 */
export type SuiteEndNode = {
  name: string
  hasError: boolean
  errors: {
    phase: 'setup' | 'setup:cleanup' | 'teardown' | 'teardown:cleanup'
    error: Error
  }[]
}

/**
 * Data shared with "runner:start" event
 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export type RunnerStartNode = {}

/**
 * Data shared with "runner:end" event
 */
export type RunnerEndNode = {
  hasError: boolean
}

/**
 * Events emitted by the runner emitter. These can be extended as well
 */
export interface RunnerEvents {
  'test:start': TestStartNode
  'test:end': TestEndNode
  'group:start': GroupStartNode
  'group:end': GroupEndNode
  'suite:start': SuiteStartNode
  'suite:end': SuiteEndNode
  'runner:start': RunnerStartNode
  'runner:end': RunnerEndNode
}

/**
 * Options for filtering and running on selected tests
 */
export type FilteringOptions = {
  tags?: string[]
  groups?: string[]
  tests?: string[]
}

/**
 * Type for the reporter handler function
 */
export type ReporterHandlerContract = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  runner: Runner<any>,
  emitter: Emitter
) => void | Promise<void>

/**
 * Type for a named reporter object.
 */
export type NamedReporterContract = {
  readonly name: string
  handler: ReporterHandlerContract
}

/**
 * Test reporters must adhere to the following contract
 */
export type ReporterContract = ReporterHandlerContract | NamedReporterContract

/**
 * The test node inside the failure tree
 */
export type FailureTreeTestNode = {
  title: string
  type: 'test'
  errors: TestEndNode['errors']
}

/**
 * The group node inside the failure tree
 */
export type FailureTreeGroupNode = {
  name: string
  type: 'group'
  errors: GroupEndNode['errors']
  children: FailureTreeTestNode[]
}

/**
 * The suite node inside the failure tree
 */
export type FailureTreeSuiteNode = {
  name: string
  type: 'suite'
  errors: SuiteEndNode['errors']
  children: (FailureTreeTestNode | FailureTreeGroupNode)[]
}

/**
 * Runner summary properties
 */
export type RunnerSummary = {
  aggregates: {
    total: number
    failed: number
    passed: number
    regression: number
    skipped: number
    todo: number
  }
  duration: number
  hasError: boolean
  failureTree: FailureTreeSuiteNode[]
  failedTestsTitles: string[]
}