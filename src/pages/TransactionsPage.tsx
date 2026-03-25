import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { TransactionWithRelations, Account, Category } from '@/types'
import { formatCurrency, formatDate } from '@/lib/format'
import { PageSpinner } from '@/components/Spinner'
import { EmptyState } from '@/components/EmptyState'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { TransactionForm } from '@/components/TransactionForm'
import { useTranslation } from '@/lib/i18n'

export function TransactionsPage() {
  const [transactions, setTransactions] = useState<TransactionWithRelations[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const { t } = useTranslation()

  // Filters
  const [filterMonth, setFilterMonth] = useState('')
  const [filterAccount, setFilterAccount] = useState('')
  const [filterCategory, setFilterCategory] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    const [txRes, accRes, catRes] = await Promise.all([
      supabase
        .from('transactions')
        .select('*, category:categories(*), account:accounts(*)')
        .order('date', { ascending: false }),
      supabase.from('accounts').select('*').order('created_at'),
      supabase.from('categories').select('*').order('created_at'),
    ])

    if (txRes.error) {
      console.error('Error fetching transactions:', txRes.error)
    } else {
      setTransactions(txRes.data ?? [])
    }

    if (accRes.data) setAccounts(accRes.data)
    if (catRes.data) setCategories(catRes.data)

    setLoading(false)
  }

  async function handleDelete() {
    if (!deleteId) return

    const tx = transactions.find((t) => t.id === deleteId)
    if (!tx) return

    // Reverse the balance change
    const account = accounts.find((a) => a.id === tx.account_id)
    if (account) {
      const reverseChange = (tx.debit ?? 0) - (tx.credit ?? 0)
      await supabase
        .from('accounts')
        .update({ balance: account.balance + reverseChange })
        .eq('id', tx.account_id)
    }

    const { error } = await supabase.from('transactions').delete().eq('id', deleteId)

    if (error) {
      console.error('Error deleting transaction:', error)
    } else {
      fetchData()
    }
    setDeleteId(null)
  }

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (filterMonth) {
        const txMonth = tx.date.substring(0, 7)
        if (txMonth !== filterMonth) return false
      }
      if (filterAccount && tx.account_id !== filterAccount) return false
      if (filterCategory && tx.category_id !== filterCategory) return false
      return true
    })
  }, [transactions, filterMonth, filterAccount, filterCategory])

  const monthOptions = useMemo(() => {
    const months = new Set(transactions.map((t) => t.date.substring(0, 7)))
    return Array.from(months).sort().reverse()
  }, [transactions])

  if (loading) return <PageSpinner />

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('transactions')}</h1>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          {t('addTransaction')}
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            <option value="">{t('allMonths')}</option>
            {monthOptions.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <select
            value={filterAccount}
            onChange={(e) => setFilterAccount(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            <option value="">{t('allAccounts')}</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            <option value="">{t('allCategories')}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {(filterMonth || filterAccount || filterCategory) && (
            <button
              onClick={() => {
                setFilterMonth('')
                setFilterAccount('')
                setFilterCategory('')
              }}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
            >
              {t('clearFilters')}
            </button>
          )}
        </div>
      </div>

      {transactions.length === 0 ? (
        <EmptyState
          icon="💳"
          title={t('noTransactionsYet')}
          description={t('addFirstTransaction')}
          action={{ label: t('addTransaction'), onClick: () => setShowForm(true) }}
        />
      ) : filteredTransactions.length === 0 ? (
        <EmptyState
          icon="🔍"
          title={t('noMatchingTransactions')}
          description={t('adjustFilters')}
        />
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('date')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('description')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('category')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('account')}
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('debit')}
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('credit')}
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('liquid')}
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('rate')}
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(tx.date)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate">
                    {tx.description}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                    {tx.category?.name ?? '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                    {tx.account?.name ?? '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-red-600">
                    {tx.debit ? formatCurrency(tx.debit) : '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-green-600">
                    {tx.credit ? formatCurrency(tx.credit) : '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                    {tx.liquid ? '✓' : '✗'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-500">
                    {tx.dollar_rate.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                    <button
                      onClick={() => setDeleteId(tx.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      {t('delete')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <TransactionForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSaved={fetchData}
      />

      <ConfirmDialog
        isOpen={deleteId !== null}
        title={t('deleteTransaction')}
        message={t('deleteTransactionConfirm')}
        confirmLabel={t('delete')}
        cancelLabel={t('cancel')}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        destructive
      />
    </div>
  )
}
