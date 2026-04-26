import { describe, it, expect } from 'vitest'
import { formatDate, normalizeNumberInput } from './format'

describe('formatDate', () => {
  it('renders the correct day without UTC timezone shift', () => {
    expect(formatDate('2024-01-15')).toContain('15')
  })

  it('renders the correct month', () => {
    expect(formatDate('2024-06-01')).toContain('1')
  })

  it('handles year boundary dates', () => {
    expect(formatDate('2024-12-31')).toContain('31')
  })
})

describe('normalizeNumberInput', () => {
  it('replaces commas with periods', () => {
    expect(normalizeNumberInput('200,30')).toBe('200.30')
  })

  it('leaves periods unchanged', () => {
    expect(normalizeNumberInput('200.30')).toBe('200.30')
  })

  it('handles multiple commas', () => {
    expect(normalizeNumberInput('1,234,56')).toBe('1.234.56')
  })

  it('handles empty string', () => {
    expect(normalizeNumberInput('')).toBe('')
  })
})
