import { useState, useEffect, useCallback, FormEvent } from 'react'
import { supabase } from '@/lib/supabase'
import { Account, Category, Transaction, RecurringPayment, Product } from '@/types'
import { useTranslation } from '@/lib/i18n'
import { normalizeNumberInput } from '@/lib/format'

interface TransactionFormProps {
  isOpen: boolean
  onClose: () => void
  onSaved: () => void
  editTransaction?: Transaction | null
}

export function TransactionForm({ isOpen, onClose, onSaved, editTransaction }: TransactionFormProps) {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [recurringPayments, setRecurringPayments] = useState<RecurringPayment[]>([])
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [productLines, setProductLines] = useState<Array<{ productId: string; quantity: string }>>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const { t } = useTranslation()

  const [date, setDate] = useState(new Date().toISOString().split('T')[0] ?? '')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [accountId, setAccountId] = useState('')
  const [expense, setExpense] = useState('')
  const [income, setIncome] = useState('')
  const [dollarRate, setDollarRate] = useState('')
  const [selectedRecurringPaymentId, setSelectedRecurringPaymentId] = useState<string>('')
  const [originalAccountId, setOriginalAccountId] = useState<string | null>(null)
  const [originalExpense, setOriginalExpense] = useState<number | null>(null)
  const [originalIncome, setOriginalIncome] = useState<number | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [accountsRes, categoriesRes, settingsRes, recurringRes, productsRes] = await Promise.all([
      supabase.from('accounts').select('*').order('sort_order', { ascending: true }),
      supabase.from('categories').select('*').order('sort_order', { ascending: true }),
      supabase.from('app_settings').select('dollar_rate').single(),
      supabase.from('recurring_payments').select('*').eq('is_paid', false).order('sort_order', { ascending: true }),
      supabase.from('products').select('*').order('sort_order', { ascending: true }),
    ])

    if (accountsRes.data) {
      setAccounts(accountsRes.data)
    }
    if (categoriesRes.data) {
      setCategories(categoriesRes.data)
    }
    if (settingsRes.data) {
      setDollarRate(settingsRes.data.dollar_rate.toString())
    }
    if (recurringRes.data) {
      setRecurringPayments(recurringRes.data)
    }
    if (productsRes.data) {
      setAllProducts(productsRes.data)
    }

    // If editing, populate form with existing data
    if (editTransaction) {
      setDate(editTransaction.date)
      setDescription(editTransaction.description)
      setCategoryId(editTransaction.category_id)
      setAccountId(editTransaction.account_id)
      setExpense(editTransaction.expense?.toString() ?? '')
      setIncome(editTransaction.income?.toString() ?? '')
      setDollarRate(editTransaction.dollar_rate.toString())
      setOriginalAccountId(editTransaction.account_id)
      setOriginalExpense(editTransaction.expense)
      setOriginalIncome(editTransaction.income)

      const { data: existingLines } = await supabase
        .from('transaction_products')
        .select('product_id, quantity')
        .eq('transaction_id', editTransaction.id)

      if (existingLines) {
        setProductLines(existingLines.map((l) => ({
          productId: l.product_id,
          quantity: l.quantity.toString(),
        })))
      }
    } else {
      // Set defaults for new transaction
      if (accountsRes.data && accountsRes.data.length > 0) {
        setAccountId(accountsRes.data[0]?.id || '')
      }
      if (categoriesRes.data && categoriesRes.data.length > 0) {
        setCategoryId(categoriesRes.data[0]?.id || '')
      }
    }
    setLoading(false)
  }, [editTransaction])

  useEffect(() => {
    if (isOpen) {
      fetchData()
    }
  }, [isOpen, fetchData])

  function addProductLine() {
    setProductLines((prev) => [...prev, { productId: '', quantity: '1' }])
  }

  function updateProductLine(index: number, field: 'productId' | 'quantity', value: string) {
    setProductLines((prev) =>
      prev.map((line, i) => (i === index ? { ...line, [field]: value } : line))
    )
  }

  function removeProductLine(index: number) {
    setProductLines((prev) => prev.filter((_, i) => i !== index))
  }

  async function saveProductLines(transactionId: string) {
    await supabase
      .from('transaction_products')
      .delete()
      .eq('transaction_id', transactionId)

    const validLines = productLines.filter((l) => l.productId && l.quantity)
    if (validLines.length === 0) return

    await supabase.from('transaction_products').insert(
      validLines.map((l) => ({
        transaction_id: transactionId,
        product_id: l.productId,
        quantity: parseFloat(normalizeNumberInput(l.quantity)),
      }))
    )
  }

  function handleRecurringPaymentSelect(paymentId: string) {
    setSelectedRecurringPaymentId(paymentId)
    if (paymentId) {
      const payment = recurringPayments.find((p) => p.id === paymentId)
      if (payment) {
        setDescription(payment.name)
        setExpense(payment.amount.toString())
        setIncome('')
      }
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)

    const expenseAmount = expense ? parseFloat(expense) : null
    const incomeAmount = income ? parseFloat(income) : null

    if (editTransaction) {
      // EDIT MODE: Update existing transaction
      const account = accounts.find((a) => a.id === accountId)
      const originalAccount = accounts.find((a) => a.id === originalAccountId)

      // Calculate balance adjustments
      const oldBalanceChange = (originalIncome ?? 0) - (originalExpense ?? 0)
      const newBalanceChange = (incomeAmount ?? 0) - (expenseAmount ?? 0)

      // If account changed, revert old account and update new account
      if (originalAccountId !== accountId) {
        // Revert old account balance
        if (originalAccount) {
          const revertedBalance = originalAccount.balance - oldBalanceChange
          await supabase
            .from('accounts')
            .update({ balance: revertedBalance })
            .eq('id', originalAccountId)
        }
        // Update new account balance
        if (account) {
          const newBalance = account.balance + newBalanceChange
          await supabase
            .from('accounts')
            .update({ balance: newBalance })
            .eq('id', accountId)

          // Update transaction with new balance snapshot
          await supabase.from('transactions').update({
            date,
            description,
            category_id: categoryId,
            account_id: accountId,
            expense: expenseAmount,
            income: incomeAmount,
            dollar_rate: parseFloat(dollarRate),
            balance_snapshot: newBalance,
          }).eq('id', editTransaction.id)
        }
      } else {
        // Same account, just adjust the difference
        if (account) {
          const balanceDiff = newBalanceChange - oldBalanceChange
          const newBalance = account.balance + balanceDiff
          await supabase
            .from('accounts')
            .update({ balance: newBalance })
            .eq('id', accountId)

          // Update transaction with new balance snapshot
          await supabase.from('transactions').update({
            date,
            description,
            category_id: categoryId,
            account_id: accountId,
            expense: expenseAmount,
            income: incomeAmount,
            dollar_rate: parseFloat(dollarRate),
            balance_snapshot: newBalance,
          }).eq('id', editTransaction.id)
        }
      }
      await saveProductLines(editTransaction.id)
    } else {
      // CREATE MODE: Insert new transaction
      const account = accounts.find((a) => a.id === accountId)
      const balanceChange = (incomeAmount ?? 0) - (expenseAmount ?? 0)
      const newBalance = account ? account.balance + balanceChange : null

      const { data: txData, error: txError } = await supabase.from('transactions').insert({
        date,
        description,
        category_id: categoryId,
        account_id: accountId,
        expense: expenseAmount,
        income: incomeAmount,
        dollar_rate: parseFloat(dollarRate),
        balance_snapshot: newBalance,
      }).select('id').single()

      if (txError) {
        console.error('Error creating transaction:', txError)
        setSubmitting(false)
        return
      }

      // Update account balance
      if (account && newBalance !== null) {
        const { error: updateError } = await supabase
          .from('accounts')
          .update({ balance: newBalance })
          .eq('id', accountId)

        if (updateError) {
          console.error('Error updating account balance:', updateError)
        }
      }

      // Save product lines
      if (txData?.id) {
        await saveProductLines(txData.id)
      }

      // Mark recurring payment as paid if one was selected
      if (selectedRecurringPaymentId) {
        await supabase
          .from('recurring_payments')
          .update({ is_paid: true })
          .eq('id', selectedRecurringPaymentId)
      }
    }

    // Reset form
    setDescription('')
    setExpense('')
    setIncome('')
    setDate(new Date().toISOString().split('T')[0] ?? '')
    setSelectedRecurringPaymentId('')
    setProductLines([])
    setOriginalAccountId(null)
    setOriginalExpense(null)
    setOriginalIncome(null)

    setSubmitting(false)
    onSaved()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            {editTransaction ? t('editTransaction') : t('newTransaction')}
          </h2>

          {loading ? (
            <div className="py-8 text-center text-gray-500 dark:text-gray-400">{t('loading')}</div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {!editTransaction && recurringPayments.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('recurringPayment')}</label>
                  <select
                    value={selectedRecurringPaymentId}
                    onChange={(e) => handleRecurringPaymentSelect(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">{t('selectRecurringPayment')}</option>
                    {recurringPayments.map((payment) => (
                      <option key={payment.id} value={payment.id}>
                        {payment.name} - ${payment.amount.toFixed(2)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('date')}</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('description')}</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('category')}</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('account')}</label>
                  <select
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('expenseAmount')}
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={expense}
                    onChange={(e) => setExpense(normalizeNumberInput(e.target.value))}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('incomeAmount')}
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={income}
                    onChange={(e) => setIncome(normalizeNumberInput(e.target.value))}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {allProducts.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('addProducts')}
                    </label>
                    <button
                      type="button"
                      onClick={addProductLine}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                    >
                      + {t('addProductLine')}
                    </button>
                  </div>
                  {productLines.map((line, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <select
                        value={line.productId}
                        onChange={(e) => updateProductLine(index, 'productId', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                      >
                        <option value="">{t('selectProduct')}</option>
                        {allProducts.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}{p.unit ? ` (${p.unit})` : ''}
                          </option>
                        ))}
                      </select>
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={line.quantity}
                          onChange={(e) => updateProductLine(index, 'quantity', normalizeNumberInput(e.target.value))}
                          placeholder="1"
                          className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm text-right"
                        />
                        {(() => {
                          const product = allProducts.find((p) => p.id === line.productId)
                          return product?.unit ? (
                            <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{product.unit}</span>
                          ) : null
                        })()}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeProductLine(index)}
                        className="px-2 py-2 text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 transition-colors"
                >
                  {submitting ? t('savingDots') : t('saveTransaction')}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
