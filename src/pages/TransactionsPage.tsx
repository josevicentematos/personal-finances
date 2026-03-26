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

  // Active month tab
  const [activeMonth, setActiveMonth] = useState<string>('')

  // Filters (account and category only)
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
      supabase.from('accounts').select('*').order('sort_order', { ascending: true }),
      supabase.from('categories').select('*').order('sort_order', { ascending: true }),
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
      const reverseChange = (tx.expense ?? 0) - (tx.income ?? 0)
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

  // Get all available months sorted in descending order (most recent first for tabs)
  const monthOptions = useMemo(() => {
    const months = new Set(transactions.map((t) => t.date.substring(0, 7)))
    return Array.from(months).sort().reverse()
  }, [transactions])

  // Set initial active month to most recent
  useEffect(() => {
    if (monthOptions.length > 0 && !activeMonth) {
      setActiveMonth(monthOptions[0] ?? '')
    }
  }, [monthOptions, activeMonth])

  // Filter and sort transactions for the active month
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((tx) => {
        // Filter by active month
        if (activeMonth) {
          const txMonth = tx.date.substring(0, 7)
          if (txMonth !== activeMonth) return false
        }
        if (filterAccount && tx.account_id !== filterAccount) return false
        if (filterCategory && tx.category_id !== filterCategory) return false
        return true
      })
      // Sort by date ascending (least recent first within month)
      .sort((a, b) => a.date.localeCompare(b.date))
  }, [transactions, activeMonth, filterAccount, filterCategory])

  // Format month for display
  function formatMonthLabel(monthStr: string): string {
    const [year, month] = monthStr.split('-')
    const date = new Date(parseInt(year ?? '2000'), parseInt(month ?? '1') - 1)
    return date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
  }

  if (loading) return <PageSpinner />

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('transactions')}</h1>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          {t('addTransaction')}
        </button>
      </div>

      {/* Month Tabs */}
      {monthOptions.length > 0 && (
        <div className="mb-4 overflow-x-auto">
          <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700 min-w-max">
            {monthOptions.map((month) => (
              <button
                key={month}
                onClick={() => setActiveMonth(month)}
                className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                  activeMonth === month
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/30'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                {formatMonthLabel(month)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Additional Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={filterAccount}
            onChange={(e) => setFilterAccount(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">{t('allCategories')}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {(filterAccount || filterCategory) && (
            <button
              onClick={() => {
                setFilterAccount('')
                setFilterCategory('')
              }}
              className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
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
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('date')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('description')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('category')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('account')}
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('expense')}
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('income')}
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('rate')}
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredTransactions.map((tx) => (
                <tr
                  key={tx.id}
                  className="hover:opacity-80 transition-opacity"
                  style={{ backgroundColor: tx.category?.color || 'transparent' }}
                >
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-900">
                    {formatDate(tx.date)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-900 max-w-xs truncate">
                    {tx.description}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-700">
                    {tx.category?.name ?? '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-700">
                    {tx.account?.name ?? '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-red-600 dark:text-red-700">
                    {tx.expense ? formatCurrency(tx.expense) : '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-green-600 dark:text-green-700">
                    {tx.income ? formatCurrency(tx.income) : '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-500 dark:text-gray-600">
                    {tx.dollar_rate.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                    <button
                      onClick={() => setDeleteId(tx.id)}
                      className="text-red-600 dark:text-red-700 hover:text-red-800"
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
