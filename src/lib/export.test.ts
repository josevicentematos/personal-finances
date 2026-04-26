import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { exportToCsv } from './export'
import type { TransactionWithRelations } from '@/types'

const mockTx: TransactionWithRelations = {
  id: '1',
  date: '2024-01-15',
  description: 'Groceries',
  category_id: 'cat1',
  account_id: 'acc1',
  expense: 500,
  income: null,
  dollar_rate: 40,
  balance_snapshot: 9500,
  created_at: '2024-01-15T00:00:00Z',
  category: { id: 'cat1', name: 'Food', color: '#fff', sort_order: 0, created_at: '' },
  account: {
    id: 'acc1',
    name: 'Cash',
    balance: 9500,
    is_main: true,
    show_in_summary: true,
    sort_order: 0,
    created_at: '',
  },
}

describe('exportToCsv', () => {
  let clickMock: ReturnType<typeof vi.fn>
  let createObjectURLMock: ReturnType<typeof vi.fn>
  let revokeObjectURLMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    clickMock = vi.fn()
    createObjectURLMock = vi.fn(() => 'blob:mock-url')
    revokeObjectURLMock = vi.fn()

    vi.stubGlobal('URL', {
      createObjectURL: createObjectURLMock,
      revokeObjectURL: revokeObjectURLMock,
    })

    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'a') {
        return { href: '', download: '', click: clickMock } as unknown as HTMLAnchorElement
      }
      return document.createElement(tag)
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('triggers a download on the created anchor', () => {
    exportToCsv([mockTx], 'transactions.csv')
    expect(clickMock).toHaveBeenCalledOnce()
  })

  it('creates and immediately revokes the object URL', () => {
    exportToCsv([mockTx], 'transactions.csv')
    expect(createObjectURLMock).toHaveBeenCalledOnce()
    expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:mock-url')
  })

  it('handles an empty transaction list without throwing', () => {
    expect(() => exportToCsv([], 'empty.csv')).not.toThrow()
  })
})
