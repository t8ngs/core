import { Test } from '../src/test'

describe('Test', () => {
  it('should create a test with basic options', () => {
    const executor = jest.fn()
    const test = new Test('sample test', executor)
    
    expect(test.options.title).toBe('sample test')
    expect(test.options.timeout).toBe(10000)
    expect(test.options.isTodo).toBe(false)
    expect(test.options.isSkipped).toBe(false)
    expect(test.options.executor).toBe(executor)
  })

  it('should mark test as todo', () => {
    const executor = jest.fn()
    const test = new Test('todo test', executor)
    
    test.todo()
    
    expect(test.options.isTodo).toBe(true)
  })

  it('should skip test with reason', () => {
    const executor = jest.fn()
    const test = new Test('skip test', executor)
    
    test.skip('not implemented')
    
    expect(test.options.isSkipped).toBe(true)
    expect(test.options.skipReason).toBe('not implemented')
  })

  it('should mark test as failing', () => {
    const executor = jest.fn()
    const test = new Test('failing test', executor)
    
    test.fails('known issue')
    
    expect(test.options.isFailing).toBe(true)
    expect(test.options.failReason).toBe('known issue')
  })

  it('should set timeout', () => {
    const executor = jest.fn()
    const test = new Test('timeout test', executor)
    
    test.timeout(5000)
    
    expect(test.options.timeout).toBe(5000)
  })

  it('should set tags', () => {
    const executor = jest.fn()
    const test = new Test('tagged test', executor)
    
    test.tags(['unit', 'core'])
    
    expect(test.options.tags).toEqual(['unit', 'core'])
  })

  it('should set metadata', () => {
    const executor = jest.fn()
    const test = new Test('meta test', executor)
    
    test.meta({ author: 'test', version: '1.0' })
    
    expect(test.options.meta).toEqual({ author: 'test', version: '1.0' })
  })

  it('should run synchronous test', async () => {
    const executor = jest.fn()
    const test = new Test('sync test', executor)
    
    await test.run()
    
    expect(executor).toHaveBeenCalledWith(test.context, expect.any(Function))
  })

  it('should run asynchronous test', async () => {
    const executor = jest.fn().mockResolvedValue(undefined)
    const test = new Test('async test', executor)
    
    await test.run()
    
    expect(executor).toHaveBeenCalledWith(test.context, expect.any(Function))
  })

  it('should handle test errors', async () => {
    const error = new Error('test error')
    const executor = jest.fn().mockRejectedValue(error)
    const test = new Test('error test', executor)
    
    await expect(test.run()).rejects.toThrow('test error')
  })
})