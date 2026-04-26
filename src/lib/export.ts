import { TransactionWithRelations } from '@/types'

export function exportToCsv(transactions: TransactionWithRelations[], filename: string): void {
  const headers = ['Date', 'Description', 'Category', 'Account', 'Expense', 'Income', 'Dollar Rate']
  const rows = transactions.map((tx) => [
    tx.date,
    `"${tx.description.replace(/"/g, '""')}"`,
    `"${(tx.category?.name ?? '').replace(/"/g, '""')}"`,
    `"${(tx.account?.name ?? '').replace(/"/g, '""')}"`,
    tx.expense ?? '',
    tx.income ?? '',
    tx.dollar_rate,
  ])

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
