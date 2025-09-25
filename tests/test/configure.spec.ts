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
import { Refiner } from '../../src/refiner.js'
import { Emitter } from '../../src/emitter.js'
import { TestContext } from '../../src/test_context.js'

test.describe('configure', () => {
  test('create an instance of test', async () => {
    const testInstance = new Test('2 + 2 = 4', new TestContext(), new Emitter(), new Refiner({}))
    assert.instanceOf(testInstance, Test)
    assert.deepEqual(testInstance.options, {
      tags: [],
      title: '2 + 2 = 4',
      timeout: 2000,
      meta: {},
    })
  })

  test('define timeout for the test', async () => {
    const testInstance = new Test('2 + 2 = 4', new TestContext(), new Emitter(), new Refiner({}))
    testInstance.timeout(6000)

    assert.deepEqual(testInstance.options, {
      tags: [],
      title: '2 + 2 = 4',
      timeout: 6000,
      meta: {},
    })
  })

  test('disable timeout for the test', async () => {
    const testInstance = new Test('2 + 2 = 4', new TestContext(), new Emitter(), new Refiner({}))
    testInstance.disableTimeout()

    assert.deepEqual(testInstance.options, {
      tags: [],
      title: '2 + 2 = 4',
      timeout: 0,
      meta: {},
    })
  })

  test('define timeout using the resetTimeout method', async () => {
    const testInstance = new Test('2 + 2 = 4', new TestContext(), new Emitter(), new Refiner({}))
    testInstance.resetTimeout(6000)

    assert.deepEqual(testInstance.options, {
      tags: [],
      title: '2 + 2 = 4',
      timeout: 6000,
      meta: {},
    })
  })

  test('disable timeout using the resetTimeout method', async () => {
    const testInstance = new Test('2 + 2 = 4', new TestContext(), new Emitter(), new Refiner({}))
    testInstance.resetTimeout()

    assert.deepEqual(testInstance.options, {
      tags: [],
      title: '2 + 2 = 4',
      timeout: 0,
      meta: {},
    })
  })

  test('define test retries', async () => {
    const testInstance = new Test('2 + 2 = 4', new TestContext(), new Emitter(), new Refiner({}))
    testInstance.retry(4)

    assert.deepEqual(testInstance.options, {
      tags: [],
      title: '2 + 2 = 4',
      timeout: 2000,
      retries: 4,
      meta: {},
    })
  })

  test('mark test to be skipped', async () => {
    const testInstance = new Test('2 + 2 = 4', new TestContext(), new Emitter(), new Refiner({}))
    testInstance.skip(true, 'Disabled for now')

    assert.deepEqual(testInstance.options, {
      tags: [],
      title: '2 + 2 = 4',
      timeout: 2000,
      isSkipped: true,
      skipReason: 'Disabled for now',
      meta: {},
    })
  })

  test('compute skip lazily using a callback', async () => {
    const testInstance = new Test('2 + 2 = 4', new TestContext(), new Emitter(), new Refiner({}))
    testInstance.skip(() => true, 'Disabled for now')

    assert.deepEqual(testInstance.options, {
      tags: [],
      title: '2 + 2 = 4',
      timeout: 2000,
      skipReason: 'Disabled for now',
      meta: {},
    })
  })

  test('mark test as failing', async () => {
    const testInstance = new Test('2 + 2 = 4', new TestContext(), new Emitter(), new Refiner({}))
    testInstance.fails('Should be 4, but returns 5 right now')

    assert.deepEqual(testInstance.options, {
      tags: [],
      title: '2 + 2 = 4',
      timeout: 2000,
      isFailing: true,
      failReason: 'Should be 4, but returns 5 right now',
      meta: {},
    })
  })

  test('define tags', async () => {
    const testInstance = new Test('2 + 2 = 4', new TestContext(), new Emitter(), new Refiner({}))
    testInstance.tags(['@slow'])

    assert.deepEqual(testInstance.options, {
      tags: ['@slow'],
      title: '2 + 2 = 4',
      timeout: 2000,
      meta: {},
    })
  })

  test('append tags', async () => {
    const testInstance = new Test('2 + 2 = 4', new TestContext(), new Emitter(), new Refiner({}))
    testInstance.tags(['@slow']).tags(['@regression'], 'append')

    assert.deepEqual(testInstance.options, {
      tags: ['@slow', '@regression'],
      title: '2 + 2 = 4',
      timeout: 2000,
      meta: {},
    })
  })

  test('prepend tags', async () => {
    const testInstance = new Test('2 + 2 = 4', new TestContext(), new Emitter(), new Refiner({}))
    testInstance.tags(['@slow']).tags(['@regression'], 'prepend')

    assert.deepEqual(testInstance.options, {
      tags: ['@regression', '@slow'],
      title: '2 + 2 = 4',
      timeout: 2000,
      meta: {},
    })
  })

  test('inform runner to waitForDone', async () => {
    const testInstance = new Test('2 + 2 = 4', new TestContext(), new Emitter(), new Refiner({}))
    testInstance.waitForDone()

    assert.deepEqual(testInstance.options, {
      tags: [],
      title: '2 + 2 = 4',
      timeout: 2000,
      waitsForDone: true,
      meta: {},
    })
  })

  test('define dataset for the test', async () => {
    const testInstance = new Test('2 + 2 = 4', new TestContext(), new Emitter(), new Refiner({}))
    testInstance.with(['foo', 'bar'])

    assert.deepEqual(testInstance.dataset, ['foo', 'bar'])
    assert.deepEqual(testInstance.options, {
      tags: [],
      title: '2 + 2 = 4',
      timeout: 2000,
      meta: {},
    })
  })

  test('compute dataset lazily', async () => {
    const testInstance = new Test('2 + 2 = 4', new TestContext(), new Emitter(), new Refiner({}))
    testInstance.with(() => ['foo', 'bar'])

    assert.isUndefined(testInstance.dataset)
    assert.deepEqual(testInstance.options, {
      tags: [],
      title: '2 + 2 = 4',
      timeout: 2000,
      meta: {},
    })
  })

  test('do not mix callbacks when a test is extended', async () => {
    class Test1 extends Test<any, any> {
      static executedCallbacks = []
      static executingCallbacks = []
    }
    class Test2 extends Test<any, any> {
      static executedCallbacks = []
      static executingCallbacks = []
    }

    function disposeCallback() {}
    function setupCallback() {}
    Test1.executed(disposeCallback)
    Test1.executing(setupCallback)

    assert.deepEqual(Test1.executedCallbacks, [disposeCallback])
    assert.deepEqual(Test1.executingCallbacks, [setupCallback])
    assert.deepEqual(Test2.executedCallbacks, [])
    assert.deepEqual(Test2.executingCallbacks, [])
  })

  test('throw error when child class does not initialize callbacks properties', async () => {
    class Test1 extends Test<any, any> {
      static executedCallbacks = []
    }
    class Test2 extends Test<any, any> {
      static executingCallbacks = []
    }

    assert.throws(
      () => new Test1('2 + 2 = 4', new TestContext(), new Emitter(), new Refiner({})),
      'Define static property "executingCallbacks = []" on Test1 class'
    )
    assert.throws(
      () => new Test2('2 + 2 = 4', new TestContext(), new Emitter(), new Refiner({})),
      'Define static property "executedCallbacks = []" on Test2 class'
    )
  })

  test('inherit parent callbacks', async () => {
    function disposeCallback() {}
    function disposeCallback1() {}
    Test.executed(disposeCallback)

    class Test1 extends Test<any, any> {
      static executedCallbacks = [...Test.executedCallbacks]
    }
    class Test2 extends Test<any, any> {
      static executedCallbacks = [...Test.executedCallbacks]
    }

    Test2.executed(disposeCallback1)

    assert.deepEqual(Test1.executedCallbacks, [disposeCallback])
    assert.deepEqual(Test2.executedCallbacks, [disposeCallback, disposeCallback1])
  })
})
