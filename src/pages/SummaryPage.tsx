import { useState, useEffect, useMemo, useCallback } from 'react'
import { TransactionWithRelations, Category, Account, AppSettings, RecurringPayment } from '@/types'
import { formatCurrency, formatDate } from '@/lib/format'
import { fetchCurrentMonthTransactions, fetchRecentTransactions } from '@/services/transactions'
import { fetchAccounts } from '@/services/accounts'
import { fetchSettings } from '@/services/settings'
import { fetchUnpaidRecurringPayments } from '@/services/recurring'
import { PageSpinner } from '@/components/Spinner'
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

interface CategoryExpense {
  category: Category
  total: number
}

export function SummaryPage() {
  const [monthTransactions, setMonthTransactions] = useState<TransactionWithRelations[]>([])
  const [recentTransactions, setRecentTransactions] = useState<TransactionWithRelations[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [recurringPayments, setRecurringPayments] = useState<RecurringPayment[]>([])
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const { t } = useTranslation()
  const { isDark } = useTheme()

  const currentMonth = useMemo(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  }, [])

  const fetchData = useCallback(async () => {
    try {
      const [monthTx, recentTx, accs, appSettings, recurring] = await Promise.all([
        fetchCurrentMonthTransactions(currentMonth),
        fetchRecentTransactions(5),
        fetchAccounts(),
        fetchSettings(),
        fetchUnpaidRecurringPayments(),
      ])
      setMonthTransactions(monthTx)
      setRecentTransactions(recentTx)
      setAccounts(accs)
      setSettings(appSettings)
      setRecurringPayments(recurring)
    } catch (err) {
      toast.error('Failed to load summary')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [currentMonth])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const summaryAccounts = useMemo(() => accounts.filter((acc) => acc.show_in_summary), [accounts])

  const categoryExpenses = useMemo(() => {
    const expenseMap = new Map<string, CategoryExpense>()
    monthTransactions.forEach((tx) => {
      if (tx.expense && tx.category) {
        const existing = expenseMap.get(tx.category_id)
        if (existing) {
          existing.total += tx.expense
        } else {
          expenseMap.set(tx.category_id, { category: tx.category, total: tx.expense })
        }
      }
    })
    return Array.from(expenseMap.values()).sort((a, b) => b.total - a.total)
  }, [monthTransactions])

  const maxExpense = useMemo(
    () => Math.max(...categoryExpenses.map((e) => e.total), 1),
    [categoryExpenses]
  )

  const totalSummaryBalance = useMemo(
    () => summaryAccounts.reduce((sum, acc) => sum + acc.balance, 0),
    [summaryAccounts]
  )

  const mainAccountsBalance = useMemo(
    () => accounts.filter((acc) => acc.is_main).reduce((sum, acc) => sum + acc.balance, 0),
    [accounts]
  )

  const unpaidRecurringTotal = useMemo(
    () => recurringPayments.reduce((sum, p) => sum + p.amount, 0),
    [recurringPayments]
  )

  const realBalance = useMemo(
    () => mainAccountsBalance - unpaidRecurringTotal,
    [mainAccountsBalance, unpaidRecurringTotal]
  )

  const currentDollarRate = settings?.dollar_rate ?? 1
  const totalSummaryBalanceUSD = totalSummaryBalance / currentDollarRate
  const realBalanceUSD = realBalance / currentDollarRate

  function formatMonthLabel(monthStr: string): string {
    const [year, month] = monthStr.split('-')
    const date = new Date(parseInt(year ?? '2000'), parseInt(month ?? '1') - 1)
    return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
  }

  if (loading) return <PageSpinner />

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{t('summary')}</h1>

      {summaryAccounts.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            {t('accountBalances')}
          </h2>
          <div className="space-y-3">
            {summaryAccounts.map((account) => (
              <div key={account.id} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">{account.name}</span>
                <div className="text-right">
                  <span
                    className={`text-sm font-medium ${
                      account.balance >= 0
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {formatCurrency(account.balance)}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                    ({formatUSD(account.balance / currentDollarRate)})
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
            <div className="flex justify-between">
              <span className="font-medium text-gray-700 dark:text-gray-300">{t('totalBalance')}</span>
              <div className="text-right">
                <span
                  className={`font-bold ${
                    totalSummaryBalance >= 0
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {formatCurrency(totalSummaryBalance)}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                  ({formatUSD(totalSummaryBalanceUSD)})
                </span>
              </div>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-gray-700 dark:text-gray-300">{t('realBalance')}</span>
              <div className="text-right">
                <span
                  className={`font-bold ${
                    realBalance >= 0
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {formatCurrency(realBalance)}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                  ({formatUSD(realBalanceUSD)})
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
          {t('expensesFor')} {formatMonthLabel(currentMonth)}
        </h2>

        {categoryExpenses.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            {t('noExpensesThisMonth')}
          </p>
        ) : (
          <div className="space-y-3">
            {categoryExpenses.map((item) => (
              <div key={item.category.id} className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{
                    backgroundColor: isDark
                      ? (item.category.color_dark ?? item.category.color)
                      : item.category.color,
                  }}
                />
                <div className="w-28 text-sm text-gray-600 dark:text-gray-400 truncate flex-shrink-0">
                  {item.category.name}
                </div>
                <div className="flex-1 h-8 bg-gray-100 dark:bg-gray-700 rounded-md overflow-hidden">
                  <div
                    className="h-full rounded-md transition-all duration-300"
                    style={{
                      width: `${(item.total / maxExpense) * 100}%`,
                      backgroundColor: isDark
                        ? (item.category.color_dark ?? item.category.color)
                        : item.category.color,
                    }}
                  />
                </div>
                <div className="w-28 text-sm text-gray-900 dark:text-white text-right flex-shrink-0">
                  {formatCurrency(item.total)}
                </div>
              </div>
            ))}
          </div>
        )}

        {categoryExpenses.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between">
            <span className="font-medium text-gray-700 dark:text-gray-300">{t('totalExpenses')}</span>
            <span className="font-bold text-gray-900 dark:text-white">
              {formatCurrency(categoryExpenses.reduce((sum, e) => sum + e.total, 0))}
            </span>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
          {t('recentTransactions')}
        </h2>

        {recentTransactions.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">{t('noTransactionsYet')}</p>
        ) : (
          <div className="overflow-x-auto">
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
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('amount')}
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    USD
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {recentTransactions.map((tx) => (
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
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right">
                      {tx.expense ? (
                        <span className="text-red-600 dark:text-red-400">
                          -{formatCurrency(tx.expense)}
                        </span>
                      ) : tx.income ? (
                        <span className="text-green-600 dark:text-green-400">
                          +{formatCurrency(tx.income)}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-500 dark:text-gray-400">
                      {tx.expense
                        ? formatUSD(tx.expense / tx.dollar_rate)
                        : tx.income
                          ? formatUSD(tx.income / tx.dollar_rate)
                          : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
