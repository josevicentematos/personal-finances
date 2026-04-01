import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { TransactionWithRelations, Category, Account, AppSettings } from '@/types'
import { formatCurrency, formatDate } from '@/lib/format'
import { PageSpinner } from '@/components/Spinner'
import { useTranslation } from '@/lib/i18n'

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
  const [transactions, setTransactions] = useState<TransactionWithRelations[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const { t } = useTranslation()

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    const [txRes, accRes, settingsRes] = await Promise.all([
      supabase
        .from('transactions')
        .select('*, category:categories(*), account:accounts(*)')
        .order('date', { ascending: false }),
      supabase
        .from('accounts')
        .select('*')
        .order('sort_order', { ascending: true }),
      supabase
        .from('app_settings')
        .select('*')
        .single(),
    ])

    if (txRes.error) {
      console.error('Error fetching transactions:', txRes.error)
    } else {
      setTransactions(txRes.data ?? [])
    }

    if (accRes.error) {
      console.error('Error fetching accounts:', accRes.error)
    } else {
      setAccounts(accRes.data ?? [])
    }

    if (settingsRes.error) {
      console.error('Error fetching settings:', settingsRes.error)
    } else {
      setSettings(settingsRes.data)
    }

    setLoading(false)
  }

  // Get accounts to show in summary
  const summaryAccounts = useMemo(() => {
    return accounts.filter((acc) => acc.show_in_summary)
  }, [accounts])

  // Get current month in YYYY-MM format
  const currentMonth = useMemo(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  }, [])

  // Filter transactions for current month
  const currentMonthTransactions = useMemo(() => {
    return transactions.filter((tx) => tx.date.substring(0, 7) === currentMonth)
  }, [transactions, currentMonth])

  // Calculate expenses by category for current month
  const categoryExpenses = useMemo(() => {
    const expenseMap = new Map<string, CategoryExpense>()

    currentMonthTransactions.forEach((tx) => {
      if (tx.expense && tx.category) {
        const existing = expenseMap.get(tx.category_id)
        if (existing) {
          existing.total += tx.expense
        } else {
          expenseMap.set(tx.category_id, {
            category: tx.category,
            total: tx.expense,
          })
        }
      }
    })

    return Array.from(expenseMap.values()).sort((a, b) => b.total - a.total)
  }, [currentMonthTransactions])

  // Get max expense for chart scaling
  const maxExpense = useMemo(() => {
    return Math.max(...categoryExpenses.map((e) => e.total), 1)
  }, [categoryExpenses])

  // Get last 5 transactions
  const recentTransactions = useMemo(() => {
    return transactions.slice(0, 5)
  }, [transactions])

  // Calculate total balance of summary accounts
  const totalSummaryBalance = useMemo(() => {
    return summaryAccounts.reduce((sum, acc) => sum + acc.balance, 0)
  }, [summaryAccounts])

  // Get current dollar rate
  const currentDollarRate = settings?.dollar_rate ?? 1

  // Calculate total USD balance
  const totalSummaryBalanceUSD = useMemo(() => {
    return totalSummaryBalance / currentDollarRate
  }, [totalSummaryBalance, currentDollarRate])

  // Format month for display
  function formatMonthLabel(monthStr: string): string {
    const [year, month] = monthStr.split('-')
    const date = new Date(parseInt(year ?? '2000'), parseInt(month ?? '1') - 1)
    return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
  }

  if (loading) return <PageSpinner />

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{t('summary')}</h1>

      {/* Account Balances */}
      {summaryAccounts.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">{t('accountBalances')}</h2>
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
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between">
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
        </div>
      )}

      {/* Monthly Expenses Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
          {t('expensesFor')} {formatMonthLabel(currentMonth)}
        </h2>

        {categoryExpenses.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">{t('noExpensesThisMonth')}</p>
        ) : (
          <div className="space-y-3">
            {categoryExpenses.map((item) => (
              <div key={item.category.id} className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: item.category.color || '#E8F4FD' }}
                />
                <div className="w-28 text-sm text-gray-600 dark:text-gray-400 truncate flex-shrink-0">
                  {item.category.name}
                </div>
                <div className="flex-1 h-8 bg-gray-100 dark:bg-gray-700 rounded-md overflow-hidden">
                  <div
                    className="h-full rounded-md transition-all duration-300"
                    style={{
                      width: `${(item.total / maxExpense) * 100}%`,
                      backgroundColor: item.category.color || '#3B82F6',
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

      {/* Recent Transactions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">{t('recentTransactions')}</h2>

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
                  <tr
                    key={tx.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {formatDate(tx.date)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white max-w-xs truncate">
                      {tx.description}
                    </td>
                    <td
                      className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-700"
                      style={{ backgroundColor: tx.category?.color || 'transparent' }}
                    >
                      {tx.category?.name ?? '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right">
                      {tx.expense ? (
                        <span className="text-red-600 dark:text-red-400">-{formatCurrency(tx.expense)}</span>
                      ) : tx.income ? (
                        <span className="text-green-600 dark:text-green-400">+{formatCurrency(tx.income)}</span>
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
