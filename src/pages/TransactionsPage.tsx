import { useState, useMemo, useCallback, useEffect } from 'react'
import { Transaction, Account, Category } from '@/types'
import { formatCurrency, formatDate } from '@/lib/format'
import { deleteTransaction } from '@/services/transactions'
import { fetchCategories } from '@/services/categories'
import { fetchAccounts } from '@/services/accounts'
import { useTransactions } from '@/hooks/useTransactions'
import { exportToCsv } from '@/lib/export'
import { PageSpinner } from '@/components/Spinner'
import { EmptyState } from '@/components/EmptyState'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { TransactionForm } from '@/components/TransactionForm'
import { useTranslation } from '@/lib/i18n'
import { useTheme } from '@/lib/theme'
import toast from 'react-hot-toast'

function formatUSD(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

function formatMonthLabel(monthStr: string): string {
  const [year, month] = monthStr.split('-')
  const date = new Date(parseInt(year ?? '2000'), parseInt(month ?? '1') - 1)
  return date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
}

export function TransactionsPage() {
  const { months, transactions, loading, loadingMore, hasMore, activeMonth, setActiveMonth, loadMore, refetch } =
    useTransactions()

  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    fetchAccounts().then(setAccounts).catch(() => {})
    fetchCategories().then(setCategories).catch(() => {})
  }, [])

  const [showForm, setShowForm] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [filterAccount, setFilterAccount] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterFrom, setFilterFrom] = useState('')
  const [filterTo, setFilterTo] = useState('')
  const [filterMinAmount, setFilterMinAmount] = useState('')
  const [filterMaxAmount, setFilterMaxAmount] = useState('')

  const { t } = useTranslation()
  const { isDark } = useTheme()

  const handleSetActiveMonth = useCallback(
    (month: string) => {
      setSearch('')
      setActiveMonth(month)
    },
    [setActiveMonth]
  )

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filterAccount) count++
    if (filterCategory) count++
    if (filterFrom) count++
    if (filterTo) count++
    if (filterMinAmount) count++
    if (filterMaxAmount) count++
    return count
  }, [filterAccount, filterCategory, filterFrom, filterTo, filterMinAmount, filterMaxAmount])

  const filteredTransactions = useMemo(() => {
    const searchLower = search.toLowerCase()
    const minAmt = filterMinAmount ? parseFloat(filterMinAmount) : null
    const maxAmt = filterMaxAmount ? parseFloat(filterMaxAmount) : null

    return transactions.filter((tx) => {
      if (search && !tx.description.toLowerCase().includes(searchLower)) return false
      if (filterAccount && tx.account_id !== filterAccount) return false
      if (filterCategory && tx.category_id !== filterCategory) return false
      if (filterFrom && tx.date < filterFrom) return false
      if (filterTo && tx.date > filterTo) return false
      const amount = tx.expense ?? tx.income ?? 0
      if (minAmt !== null && amount < minAmt) return false
      if (maxAmt !== null && amount > maxAmt) return false
      return true
    })
  }, [transactions, search, filterAccount, filterCategory, filterFrom, filterTo, filterMinAmount, filterMaxAmount])

  function clearAllFilters() {
    setFilterAccount('')
    setFilterCategory('')
    setFilterFrom('')
    setFilterTo('')
    setFilterMinAmount('')
    setFilterMaxAmount('')
  }

  async function handleDelete() {
    if (!deleteId) return
    try {
      await deleteTransaction(deleteId)
      toast.success('Transaction deleted')
      await refetch()
    } catch (err) {
      toast.error('Failed to delete transaction')
      console.error(err)
    } finally {
      setDeleteId(null)
    }
  }

  function handleExport() {
    const filename = `transactions-${activeMonth || 'all'}.csv`
    exportToCsv(filteredTransactions, filename)
  }

  if (loading) return <PageSpinner />

  const hasAnyTransactions = transactions.length > 0 || months.length > 0
  const isFiltered = search !== '' || activeFilterCount > 0

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('transactions')}</h1>
        <div className="flex gap-2">
          {filteredTransactions.length > 0 && (
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
            >
              {t('exportCsv')}
            </button>
          )}
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t('addTransaction')}
          </button>
        </div>
      </div>

      {months.length > 0 && (
        <div className="mb-4 overflow-x-auto">
          <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700 min-w-max">
            {months.map((month) => (
              <button
                key={month}
                onClick={() => handleSetActiveMonth(month)}
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

      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder={t('searchTransactions')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
          />
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors text-sm font-medium ${
              showFilters || activeFilterCount > 0
                ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-400'
                : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
            }`}
          >
            {t('filters')}
            {activeFilterCount > 0 && (
              <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold bg-blue-600 text-white rounded-full">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <select
                value={filterAccount}
                onChange={(e) => setFilterAccount(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">{t('allAccounts')}</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">{t('allCategories')}</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={filterFrom}
                  onChange={(e) => setFilterFrom(e.target.value)}
                  placeholder={t('filterFrom')}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <input
                  type="date"
                  value={filterTo}
                  onChange={(e) => setFilterTo(e.target.value)}
                  placeholder={t('filterTo')}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <input
                type="number"
                value={filterMinAmount}
                onChange={(e) => setFilterMinAmount(e.target.value)}
                placeholder={t('filterMinAmount')}
                min="0"
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <input
                type="number"
                value={filterMaxAmount}
                onChange={(e) => setFilterMaxAmount(e.target.value)}
                placeholder={t('filterMaxAmount')}
                min="0"
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              {activeFilterCount > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white underline text-left"
                >
                  {t('clearFilters')}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {isFiltered && transactions.length > 0 && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
          {filteredTransactions.length} {filteredTransactions.length === 1 ? 'result' : 'results'}
        </p>
      )}

      {!hasAnyTransactions ? (
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
        <>
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
                    {t('balance')}
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('usdEquivalent')}
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {formatDate(tx.date)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white max-w-xs truncate">
                      {tx.description}
                    </td>
                    <td
                      className="px-4 py-3 whitespace-nowrap text-sm text-gray-800 dark:text-gray-100"
                      style={{
                        backgroundColor: tx.category
                          ? (isDark ? (tx.category.color_dark ?? tx.category.color) : tx.category.color) || 'transparent'
                          : 'transparent',
                      }}
                    >
                      {tx.category?.name ?? '-'}
                    </td>
                    <td
                      className="px-4 py-3 whitespace-nowrap text-sm text-gray-800 dark:text-gray-100"
                      style={{
                        backgroundColor: tx.account
                          ? (isDark ? (tx.account.color_dark ?? tx.account.color) : tx.account.color) || 'transparent'
                          : 'transparent',
                      }}
                    >
                      {tx.account?.name ?? '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-red-600 dark:text-red-400">
                      {tx.expense ? formatCurrency(tx.expense) : '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-green-600 dark:text-green-400">
                      {tx.income ? formatCurrency(tx.income) : '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-500 dark:text-gray-400">
                      {tx.balance_snapshot !== null ? formatCurrency(tx.balance_snapshot) : '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-500 dark:text-gray-400">
                      {tx.expense
                        ? formatUSD(tx.expense / tx.dollar_rate)
                        : tx.income
                          ? formatUSD(tx.income / tx.dollar_rate)
                          : '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm space-x-2">
                      <button
                        onClick={() => {
                          setEditingTransaction(tx)
                          setShowForm(true)
                        }}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                      >
                        {t('edit')}
                      </button>
                      <button
                        onClick={() => setDeleteId(tx.id)}
                        className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                      >
                        {t('delete')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {hasMore && !isFiltered && (
            <div className="mt-4 text-center">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="px-6 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors text-sm font-medium"
              >
                {loadingMore ? '...' : t('loadMore')}
              </button>
            </div>
          )}
        </>
      )}

      <TransactionForm
        isOpen={showForm}
        onClose={() => {
          setShowForm(false)
          setEditingTransaction(null)
        }}
        onSaved={refetch}
        editTransaction={editingTransaction}
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
