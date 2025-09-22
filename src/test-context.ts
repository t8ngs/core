/*
 * @t8ngs/core
 *
 * (c) t8ngs
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * Base test context class that provides common functionality
 * for test execution
 */
export class TestContext {
  constructor() {}

  /**
   * Add custom properties to the test context
   */
  assign(properties: Record<string, any>): this {
    Object.assign(this, properties)
    return this
  }
}