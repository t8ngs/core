import { Runner, Test } from '../src/index'

describe('Integration Test', () => {
  it('should run a complete test scenario', async () => {
    const runner = new Runner()
    let testStarted = false
    let testEnded = false

    // Listen to events
    runner.emitter.on('test:start', () => {
      testStarted = true
    })

    runner.emitter.on('test:end', () => {
      testEnded = true
    })

    // Create a test
    const test = new Test('integration test', (context) => {
      context.assign({ testValue: 42 })
      expect((context as any).testValue).toBe(42)
    })

    runner.add(test)

    // Run tests
    const summary = await runner.run()

    // Verify results
    expect(summary.aggregates.total).toBe(1)
    expect(summary.aggregates.passed).toBe(1)
    expect(summary.aggregates.failed).toBe(0)
    expect(summary.hasError).toBe(false)
    expect(testStarted).toBe(true)
    expect(testEnded).toBe(true)
  })

  it('should handle test failures correctly', async () => {
    const runner = new Runner()
    
    const test = new Test('failing test', () => {
      throw new Error('This test should fail')
    })

    runner.add(test)

    const summary = await runner.run()

    expect(summary.aggregates.total).toBe(1)
    expect(summary.aggregates.passed).toBe(0)
    expect(summary.aggregates.failed).toBe(1)
    expect(summary.hasError).toBe(true)
    expect(summary.failedTestsTitles).toContain('failing test')
  })
})