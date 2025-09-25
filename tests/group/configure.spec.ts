/*
 * @t8ngs/core
 *
 * (c) t8ngs
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import test from 'node:test'
import { assert } from 'chai'

import { Test } from '../../src/test/main.js'
import { Group } from '../../src/group/main.js'
import { Refiner } from '../../src/refiner.js'
import { Emitter } from '../../src/emitter.js'
import { TestContext } from '../../src/test_context.js'

test.describe('configure', () => {
  test('create an instance of group', async () => {
    const group = new Group('sample group', new Emitter(), new Refiner({}))
    assert.instanceOf(group, Group)
    assert.equal(group.title, 'sample group')
  })

  test('add tests to group', async () => {
    const emitter = new Emitter()
    const refiner = new Refiner({})

    const group = new Group<TestContext>('sample group', emitter, refiner)
    const testInstance = new Test('2 + 2 = 4', new TestContext(), emitter, refiner)
    group.add(testInstance)

    assert.deepEqual(group.tests, [testInstance])
  })

  test('define timeout for registered tests', async () => {
    const emitter = new Emitter()
    const refiner = new Refiner({})

    const group = new Group<TestContext>('sample group', emitter, refiner)
    const testInstance = new Test('2 + 2 = 4', new TestContext(), emitter, refiner)

    group.each.timeout(5000)
    group.add(testInstance)

    assert.equal(testInstance.options.timeout, 5000)
  })

  test('define retries for registered tests', async () => {
    const emitter = new Emitter()
    const refiner = new Refiner({})

    const group = new Group<TestContext>('sample group', emitter, refiner)
    const testInstance = new Test('2 + 2 = 4', new TestContext(), emitter, refiner)

    group.each.retry(3)
    group.add(testInstance)

    assert.equal(testInstance.options.retries, 3)
  })

  test('tap into tests to configure them', async () => {
    const emitter = new Emitter()
    const refiner = new Refiner({})

    const group = new Group<TestContext>('sample group', emitter, refiner)
    const testInstance = new Test('2 + 2 = 4', new TestContext(), emitter, refiner)

    group.tap((t) => t.disableTimeout())
    group.add(testInstance)

    assert.equal(testInstance.options.timeout, 0)
  })

  test('skip all tests inside the group', async () => {
    const emitter = new Emitter()
    const refiner = new Refiner({})

    const group = new Group<TestContext>('sample group', emitter, refiner)
    const testInstance = new Test('2 + 2 = 4', new TestContext(), emitter, refiner)

    group.each.skip()
    group.add(testInstance)

    assert.equal(testInstance.options.isSkipped, true)
  })
})
