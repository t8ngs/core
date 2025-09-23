/*
 * @t8ngs/core
 *
 * (c) T8ngs
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import timeSpan, { TimeEndFunction } from 'time-span'
import type {
  TestEndNode,
  GroupEndNode,
  SuiteEndNode,
  RunnerEvents,
  RunnerEndNode,
  RunnerSummary,
  GroupStartNode,
  SuiteStartNode,
  FailureTreeGroupNode,
  FailureTreeSuiteNode,
} from './types.js'

/**
 * Tracks the tests events to generate a summary report. Failing tests are further tracked
 * for complete hierarchy
 */
export class Tracker {
  /**
   * Time tracker to find runner duration
   */
  #timeTracker?: TimeEndFunction

  /**
   * Currently active suite
   */
  #currentSuite?: FailureTreeSuiteNode

  /**
   * Currently active group
   */
  #currentGroup?: FailureTreeGroupNode

  /**
   * If the entire run cycle has one or more errors
   */
  #hasError: boolean = false

  #aggregates: RunnerSummary['aggregates'] = {
    total: 0,
    failed: 0,
    passed: 0,
    regression: 0,
    skipped: 0,
    todo: 0,
  }

  #duration: number = 0

  /**
   * A tree of suites/groups and tests that have failed. They are always nested inside
   * other unless the test groups where used, then suites contains a list of tests
   * directly.
   */
  #failureTree: FailureTreeSuiteNode[] = []
  #failedTestsTitles: string[] = []

  /**
   * Set reference for the current suite
   */
  #onSuiteStart(payload: SuiteStartNode) {
    this.#currentSuite = {
      name: payload.name,
      type: 'suite',
      errors: [],
      children: [],
    }
  }

  /**
   * Move suite to the failure tree when the suite
   * has errors
   */
  #onSuiteEnd(payload: SuiteEndNode) {
    if (payload.hasError) {
      this.#currentSuite!.errors = payload.errors
      this.#failureTree.push(this.#currentSuite!)
    }
  }

  /**
   * Set reference for the current group
   */
  #onGroupStart(payload: GroupStartNode) {
    this.#currentGroup = {
      name: payload.title,
      type: 'group',
      errors: [],
      children: [],
    }
  }

  /**
   * Move suite to the failure tree when the suite
   * has errors
   */
  #onGroupEnd(payload: GroupEndNode) {
    if (payload.hasError) {
      this.#currentGroup!.errors = payload.errors
      this.#currentSuite!.children.push(this.#currentGroup!)
    }
  }

  /**
   * In case of failure, track the test inside the current group
   * or the current suite.
   */
  #onTestEnd(payload: TestEndNode) {
    /**
     * Bumping aggregates
     */
    this.#aggregates.total++

    /**
     * Test was skipped
     */
    if (payload.isSkipped) {
      this.#aggregates.skipped++
      return
    }

    /**
     * Test was a todo
     */
    if (payload.isTodo) {
      this.#aggregates.todo++
      return
    }

    /**
     * Test completed successfully
     */
    if (!payload.hasError) {
      if (payload.isFailing) {
        this.#aggregates.regression++
      } else {
        this.#aggregates.passed++
      }
      return
    }

    this.#markTestAsFailed(payload)
  }

  /**
   * Mark test as failed
   */
  #markTestAsFailed(payload: TestEndNode) {
    /**
     * Bump failed count
     */
    this.#aggregates.failed++

    /**
     * Test payload
     */
    const testPayload = {
      type: 'test' as const,
      title: payload.title.expanded,
      errors: payload.errors,
    }

    /**
     * Track test inside the current group or suite
     */
    if (this.#currentGroup) {
      this.#currentGroup.children.push(testPayload)
    } else if (this.#currentSuite) {
      this.#currentSuite.children.push(testPayload)
    }

    /**
     * Push title to the failedTestsTitles array
     */
    this.#failedTestsTitles.push(payload.title.original)
  }

  /**
   * Process the tests events
   */
  processEvent<Event extends keyof RunnerEvents>(
    event: keyof RunnerEvents,
    payload: RunnerEvents[Event]
  ) {
    switch (event) {
      case 'suite:start':
        this.#onSuiteStart(payload as SuiteStartNode)
        break
      case 'suite:end':
        this.#onSuiteEnd(payload as SuiteEndNode)
        break
      case 'group:start':
        this.#onGroupStart(payload as GroupStartNode)
        break
      case 'group:end':
        this.#onGroupEnd(payload as GroupEndNode)
        break
      case 'test:end':
        this.#onTestEnd(payload as TestEndNode)
        break
      case 'runner:start':
        this.#timeTracker = timeSpan()
        break
      case 'runner:end':
        this.#hasError = (payload as RunnerEndNode).hasError
        this.#duration = this.#timeTracker?.rounded() ?? 0
        break
    }
  }

  /**
   * Returns the tests runner summary
   */
  getSummary(): RunnerSummary {
    return {
      aggregates: this.#aggregates,
      hasError: this.#hasError,
      duration: this.#duration,
      failureTree: this.#failureTree,
      failedTestsTitles: this.#failedTestsTitles,
    }
  }
}
