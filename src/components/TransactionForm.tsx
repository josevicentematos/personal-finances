import { useState, useEffect, useCallback, FormEvent } from 'react'
import { supabase } from '@/lib/supabase'
import { Account, Category, Transaction, RecurringPayment, Product } from '@/types'
import { useTranslation } from '@/lib/i18n'
import { normalizeNumberInput } from '@/lib/format'
import { fetchAccounts, updateAccountBalance } from '@/services/accounts'
import { fetchCategories } from '@/services/categories'
import { fetchSettings } from '@/services/settings'
import { fetchUnpaidRecurringPayments, toggleRecurringPaid } from '@/services/recurring'
import { fetchProducts } from '@/services/products'
import { createTransaction, updateTransaction } from '@/services/transactions'
import { AmountFields } from './AmountFields'
import { RecurringPaymentSelector } from './RecurringPaymentSelector'
import { ProductLineEditor, ProductLine } from './ProductLineEditor'
import toast from 'react-hot-toast'

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
  const [productLines, setProductLines] = useState<ProductLine[]>([])
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
    try {
      const [accs, cats, settings, recurring, products] = await Promise.all([
        fetchAccounts(),
        fetchCategories(),
        fetchSettings(),
        fetchUnpaidRecurringPayments(),
        fetchProducts(),
      ])

      setAccounts(accs)
      setCategories(cats)
      setDollarRate(settings.dollar_rate.toString())
      setRecurringPayments(recurring)
      setAllProducts(products)

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
          setProductLines(
            existingLines.map((l) => ({
              productId: l.product_id,
              quantity: l.quantity.toString(),
            }))
          )
        }
      } else {
        if (accs.length > 0) setAccountId(accs[0]?.id ?? '')
        if (cats.length > 0) setCategoryId(cats[0]?.id ?? '')
      }
    } catch (err) {
      toast.error('Failed to load form data')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [editTransaction])

  useEffect(() => {
    if (isOpen) fetchData()
  }, [isOpen, fetchData])

  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

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
    await supabase.from('transaction_products').delete().eq('transaction_id', transactionId)
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

  function validate(): string | null {
    if (!description.trim()) return 'Description is required'
    if (description.length > 120) return 'Description must be under 120 characters'
    if (!expense && !income) return 'Enter an expense or income amount'
    if (expense && parseFloat(expense) <= 0) return 'Expense must be greater than 0'
    if (income && parseFloat(income) <= 0) return 'Income must be greater than 0'
    if (!dollarRate || parseFloat(dollarRate) <= 0) return 'Dollar rate must be greater than 0'
    return null
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()

    const validationError = validate()
    if (validationError) {
      toast.error(validationError)
      return
    }

    setSubmitting(true)

    const expenseAmount = expense ? parseFloat(expense) : null
    const incomeAmount = income ? parseFloat(income) : null

    try {
      if (editTransaction) {
        const account = accounts.find((a) => a.id === accountId)
        const originalAccount = accounts.find((a) => a.id === originalAccountId)
        const oldBalanceChange = (originalIncome ?? 0) - (originalExpense ?? 0)
        const newBalanceChange = (incomeAmount ?? 0) - (expenseAmount ?? 0)

        if (originalAccountId !== accountId) {
          if (originalAccount && originalAccountId) {
            await updateAccountBalance(originalAccountId, originalAccount.balance - oldBalanceChange)
          }
          if (account) {
            const newBalance = account.balance + newBalanceChange
            await updateAccountBalance(accountId, newBalance)
            await updateTransaction(editTransaction.id, {
              date,
              description,
              category_id: categoryId,
              account_id: accountId,
              expense: expenseAmount,
              income: incomeAmount,
              dollar_rate: parseFloat(dollarRate),
              balance_snapshot: newBalance,
            })
          }
        } else {
          if (account) {
            const balanceDiff = newBalanceChange - oldBalanceChange
            const newBalance = account.balance + balanceDiff
            await updateAccountBalance(accountId, newBalance)
            await updateTransaction(editTransaction.id, {
              date,
              description,
              category_id: categoryId,
              account_id: accountId,
              expense: expenseAmount,
              income: incomeAmount,
              dollar_rate: parseFloat(dollarRate),
              balance_snapshot: newBalance,
            })
          }
        }
        await saveProductLines(editTransaction.id)
      } else {
        const account = accounts.find((a) => a.id === accountId)
        const balanceChange = (incomeAmount ?? 0) - (expenseAmount ?? 0)
        const newBalance = account ? account.balance + balanceChange : null

        const txId = await createTransaction({
          date,
          description,
          category_id: categoryId,
          account_id: accountId,
          expense: expenseAmount,
          income: incomeAmount,
          dollar_rate: parseFloat(dollarRate),
          balance_snapshot: newBalance,
        })

        if (account && newBalance !== null) {
          await updateAccountBalance(accountId, newBalance)
        }
        await saveProductLines(txId)

        if (selectedRecurringPaymentId) {
          await toggleRecurringPaid(selectedRecurringPaymentId, true)
        }
      }

      setDescription('')
      setExpense('')
      setIncome('')
      setDate(new Date().toISOString().split('T')[0] ?? '')
      setSelectedRecurringPaymentId('')
      setProductLines([])
      setOriginalAccountId(null)
      setOriginalExpense(null)
      setOriginalIncome(null)

      toast.success(editTransaction ? 'Transaction updated' : 'Transaction created')
      onSaved()
      onClose()
    } catch (err) {
      toast.error('Failed to save transaction')
      console.error(err)
    } finally {
      setSubmitting(false)
    }
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
                <RecurringPaymentSelector
                  recurringPayments={recurringPayments}
                  selectedId={selectedRecurringPaymentId}
                  onSelect={handleRecurringPaymentSelect}
                />
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('date')}
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('description')}
                </label>
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('category')}
                  </label>
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('account')}
                  </label>
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

              <AmountFields
                expense={expense}
                income={income}
                dollarRate={dollarRate}
                onExpenseChange={setExpense}
                onIncomeChange={setIncome}
                onDollarRateChange={setDollarRate}
              />

              {allProducts.length > 0 && (
                <ProductLineEditor
                  productLines={productLines}
                  products={allProducts}
                  onAdd={addProductLine}
                  onUpdate={updateProductLine}
                  onRemove={removeProductLine}
                />
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
