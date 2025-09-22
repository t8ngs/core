import { TestContext } from '../src/test-context'

describe('TestContext', () => {
  it('should create a new test context', () => {
    const context = new TestContext()
    expect(context).toBeInstanceOf(TestContext)
  })

  it('should assign properties to context', () => {
    const context = new TestContext()
    const props = { foo: 'bar', num: 42 }
    
    context.assign(props)
    
    expect((context as any).foo).toBe('bar')
    expect((context as any).num).toBe(42)
  })

  it('should return this for method chaining', () => {
    const context = new TestContext()
    const result = context.assign({ test: true })
    
    expect(result).toBe(context)
  })
})