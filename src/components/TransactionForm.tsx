import { useState, useEffect, useCallback, FormEvent } from 'react'
import { supabase } from '@/lib/supabase'
import { Account, Category } from '@/types'
import { useTranslation } from '@/lib/i18n'

interface TransactionFormProps {
  isOpen: boolean
  onClose: () => void
  onSaved: () => void
}

export function TransactionForm({ isOpen, onClose, onSaved }: TransactionFormProps) {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const { t } = useTranslation()

  const [date, setDate] = useState(new Date().toISOString().split('T')[0] ?? '')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [accountId, setAccountId] = useState('')
  const [debit, setDebit] = useState('')
  const [credit, setCredit] = useState('')
  const [dollarRate, setDollarRate] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [accountsRes, categoriesRes, settingsRes] = await Promise.all([
      supabase.from('accounts').select('*').order('sort_order', { ascending: true }),
      supabase.from('categories').select('*').order('sort_order', { ascending: true }),
      supabase.from('app_settings').select('dollar_rate').single(),
    ])

    if (accountsRes.data) {
      setAccounts(accountsRes.data)
      if (accountsRes.data.length > 0) {
        setAccountId((prev) => prev || accountsRes.data[0]?.id || '')
      }
    }
    if (categoriesRes.data) {
      setCategories(categoriesRes.data)
      if (categoriesRes.data.length > 0) {
        setCategoryId((prev) => prev || categoriesRes.data[0]?.id || '')
      }
    }
    if (settingsRes.data) {
      setDollarRate(settingsRes.data.dollar_rate.toString())
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (isOpen) {
      fetchData()
    }
  }, [isOpen, fetchData])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)

    const debitAmount = debit ? parseFloat(debit) : null
    const creditAmount = credit ? parseFloat(credit) : null

    const { error: txError } = await supabase.from('transactions').insert({
      date,
      description,
      category_id: categoryId,
      account_id: accountId,
      debit: debitAmount,
      credit: creditAmount,
      dollar_rate: parseFloat(dollarRate),
    })

    if (txError) {
      console.error('Error creating transaction:', txError)
      setSubmitting(false)
      return
    }

    // Update account balance
    const account = accounts.find((a) => a.id === accountId)
    if (account) {
      const balanceChange = (creditAmount ?? 0) - (debitAmount ?? 0)
      const { error: updateError } = await supabase
        .from('accounts')
        .update({ balance: account.balance + balanceChange })
        .eq('id', accountId)

      if (updateError) {
        console.error('Error updating account balance:', updateError)
      }
    }

    // Reset form
    setDescription('')
    setDebit('')
    setCredit('')
    setDate(new Date().toISOString().split('T')[0] ?? '')

    setSubmitting(false)
    onSaved()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />
        <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('newTransaction')}</h2>

          {loading ? (
            <div className="py-8 text-center text-gray-500">{t('loading')}</div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('date')}</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('dollarRate')}
                  </label>
                  <input
                    type="number"
                    value={dollarRate}
                    onChange={(e) => setDollarRate(e.target.value)}
                    step="0.01"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('description')}</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('category')}</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('account')}</label>
                  <select
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('debitExpense')}
                  </label>
                  <input
                    type="number"
                    value={debit}
                    onChange={(e) => setDebit(e.target.value)}
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('creditIncome')}
                  </label>
                  <input
                    type="number"
                    value={credit}
                    onChange={(e) => setCredit(e.target.value)}
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
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
