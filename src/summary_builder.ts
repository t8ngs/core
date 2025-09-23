/*
 * @t8ngs/core
 *
 * (c) T8ngs
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import string from '@poppinss/string'
import stringWidth from 'string-width'

/**
 * Summary builder is used to create the tests summary reported by
 * multiple reporters. Each report contains a key-value pair
 */
export class SummaryBuilder {
  #reporters: (() => { key: string; value: string | string[] }[])[] = []

  /**
   * Register a custom summary reporter
   */
  use(reporter: () => { key: string; value: string | string[] }[]): this {
    this.#reporters.push(reporter)
    return this
  }

  /**
   * Builds the summary table
   */
  build(): string[] {
    const keys: string[] = []
    const keysLengths: number[] = []
    const values: string[][] = []

    this.#reporters.forEach((reporter) => {
      const reports = reporter()
      reports.forEach((report) => {
        keys.push(report.key)
        values.push(Array.isArray(report.value) ? report.value : [report.value])
        keysLengths.push(stringWidth(report.key))
      })
    })

    const largestKey = Math.max(...keysLengths)
    const keysRows = string.justify(keys, {
      width: largestKey,
      align: 'right',
      indent: ' ',
      getLength: (chunk) => stringWidth(chunk),
    })

    return keysRows.map((key, index) => {
      return `${key}${values[index]
        .map((line, i) => {
          return i === 0 ? `  ${line}` : `${' '.repeat(largestKey)}  ${line}`
        })
        .join('\n')}`
    })
  }
}
