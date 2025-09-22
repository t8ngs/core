/*
 * @t8ngs/core
 *
 * (c) t8ngs
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import type { RunnerEvents } from './types'

/**
 * Simple event emitter for test runner events
 */
export class Emitter {
  private listeners: Map<keyof RunnerEvents, Array<(data: any) => void>> = new Map()

  /**
   * Add an event listener
   */
  on<T extends keyof RunnerEvents>(event: T, listener: (data: RunnerEvents[T]) => void): this {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.listeners.get(event)!.push(listener as (data: any) => void)
    return this
  }

  /**
   * Remove an event listener
   */
  off<T extends keyof RunnerEvents>(event: T, listener: (data: RunnerEvents[T]) => void): this {
    const eventListeners = this.listeners.get(event)
    if (eventListeners) {
      const index = eventListeners.indexOf(listener as any)
      if (index > -1) {
        eventListeners.splice(index, 1)
      }
    }
    return this
  }

  /**
   * Emit an event
   */
  async emit<T extends keyof RunnerEvents>(event: T, data: RunnerEvents[T]): Promise<void> {
    const eventListeners = this.listeners.get(event)
    if (eventListeners) {
      await Promise.all(eventListeners.map(listener => listener(data)))
    }
  }

  /**
   * Get the number of listeners for an event
   */
  listenerCount(event: keyof RunnerEvents): number {
    return this.listeners.get(event)?.length || 0
  }

  /**
   * Get all registered event names
   */
  eventNames(): Array<keyof RunnerEvents> {
    return Array.from(this.listeners.keys())
  }
}