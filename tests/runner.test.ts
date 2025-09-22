import { Runner } from '../src/runner'
import { Test } from '../src/test'

describe('Runner', () => {
  let runner: Runner

  beforeEach(() => {
    runner = new Runner()
  })

  it('should create a runner with empty tests array', () => {
    expect(runner.tests).toEqual([])
    expect(runner.emitter).toBeDefined()
    expect(runner.summary.aggregates.total).toBe(0)
  })

  it('should add tests to the runner', () => {
    const executor = jest.fn()
    const test = new Test('test 1', executor)
    
    runner.add(test)
    
    expect(runner.tests).toHaveLength(1)
    expect(runner.tests[0]).toBe(test)
  })

  it('should run tests and update summary', async () => {
    const executor1 = jest.fn()
    const executor2 = jest.fn()
    
    const test1 = new Test('test 1', executor1)
    const test2 = new Test('test 2', executor2)
    
    runner.add(test1)
    runner.add(test2)
    
    const summary = await runner.run()
    
    expect(summary.aggregates.total).toBe(2)
    expect(summary.aggregates.passed).toBe(2)
    expect(summary.aggregates.failed).toBe(0)
    expect(summary.hasError).toBe(false)
    expect(executor1).toHaveBeenCalled()
    expect(executor2).toHaveBeenCalled()
  })

  it('should handle test failures', async () => {
    const error = new Error('test failed')
    const executor = jest.fn().mockRejectedValue(error)
    const test = new Test('failing test', executor)
    
    runner.add(test)
    
    const summary = await runner.run()
    
    expect(summary.aggregates.total).toBe(1)
    expect(summary.aggregates.passed).toBe(0)
    expect(summary.aggregates.failed).toBe(1)
    expect(summary.hasError).toBe(true)
    expect(summary.failedTestsTitles).toContain('failing test')
  })

  it('should skip tests marked as skipped', async () => {
    const executor = jest.fn()
    const test = new Test('skipped test', executor).skip('not ready')
    
    runner.add(test)
    
    const summary = await runner.run()
    
    expect(summary.aggregates.total).toBe(1)
    expect(summary.aggregates.skipped).toBe(1)
    expect(summary.aggregates.passed).toBe(0)
    expect(executor).not.toHaveBeenCalled()
  })

  it('should handle todo tests', async () => {
    const executor = jest.fn()
    const test = new Test('todo test', executor).todo()
    
    runner.add(test)
    
    const summary = await runner.run()
    
    expect(summary.aggregates.total).toBe(1)
    expect(summary.aggregates.todo).toBe(1)
    expect(summary.aggregates.passed).toBe(0)
    expect(executor).not.toHaveBeenCalled()
  })

  it('should filter tests by title pattern', async () => {
    const executor1 = jest.fn()
    const executor2 = jest.fn()
    
    const test1 = new Test('unit test', executor1)
    const test2 = new Test('integration test', executor2)
    
    runner.add(test1)
    runner.add(test2)
    
    const summary = await runner.run({ tests: ['unit'] })
    
    expect(summary.aggregates.total).toBe(1)
    expect(executor1).toHaveBeenCalled()
    expect(executor2).not.toHaveBeenCalled()
  })

  it('should filter tests by tags', async () => {
    const executor1 = jest.fn()
    const executor2 = jest.fn()
    
    const test1 = new Test('test 1', executor1).tags(['unit'])
    const test2 = new Test('test 2', executor2).tags(['integration'])
    
    runner.add(test1)
    runner.add(test2)
    
    const summary = await runner.run({ tags: ['unit'] })
    
    expect(summary.aggregates.total).toBe(1)
    expect(executor1).toHaveBeenCalled()
    expect(executor2).not.toHaveBeenCalled()
  })

  it('should emit runner events', async () => {
    const runnerStartSpy = jest.fn()
    const runnerEndSpy = jest.fn()
    
    runner.emitter.on('runner:start', runnerStartSpy)
    runner.emitter.on('runner:end', runnerEndSpy)
    
    await runner.run()
    
    expect(runnerStartSpy).toHaveBeenCalledWith({})
    expect(runnerEndSpy).toHaveBeenCalledWith({ hasError: false })
  })
})