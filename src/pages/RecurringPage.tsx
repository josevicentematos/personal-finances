import { useState, useEffect, FormEvent } from 'react'
import { supabase } from '@/lib/supabase'
import { RecurringPayment, Account } from '@/types'
import { formatCurrency, normalizeNumberInput } from '@/lib/format'
import { PageSpinner } from '@/components/Spinner'
import { EmptyState } from '@/components/EmptyState'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { SortableRow, DragHandleHeader } from '@/components/SortableRow'
import { useTranslation } from '@/lib/i18n'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'

export function RecurringPage() {
  const [payments, setPayments] = useState<RecurringPayment[]>([])
  const [mainAccounts, setMainAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [newAmount, setNewAmount] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const { t } = useTranslation()

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    const [paymentsRes, accountsRes] = await Promise.all([
      supabase.from('recurring_payments').select('*').order('sort_order', { ascending: true }),
      supabase.from('accounts').select('*').eq('is_main', true),
    ])

    if (paymentsRes.error) {
      console.error('Error fetching payments:', paymentsRes.error)
    } else {
      setPayments(paymentsRes.data ?? [])
    }

    if (accountsRes.error) {
      console.error('Error fetching accounts:', accountsRes.error)
    } else {
      setMainAccounts(accountsRes.data ?? [])
    }

    setLoading(false)
  }

  async function handleAdd(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)

    const maxOrder = payments.reduce((max, p) => Math.max(max, p.sort_order), -1)

    const { error } = await supabase.from('recurring_payments').insert({
      name: newName,
      amount: parseFloat(newAmount),
      is_paid: false,
      sort_order: maxOrder + 1,
    })

    if (error) {
      console.error('Error adding payment:', error)
    } else {
      setNewName('')
      setNewAmount('')
      fetchData()
    }
    setSubmitting(false)
  }

  async function handleTogglePaid(id: string, currentPaid: boolean) {
    const { error } = await supabase
      .from('recurring_payments')
      .update({ is_paid: !currentPaid })
      .eq('id', id)

    if (error) {
      console.error('Error toggling payment:', error)
    } else {
      fetchData()
    }
  }

  async function handleDelete() {
    if (!deleteId) return

    const { error } = await supabase.from('recurring_payments').delete().eq('id', deleteId)

    if (error) {
      console.error('Error deleting payment:', error)
    } else {
      fetchData()
    }
    setDeleteId(null)
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event

    if (!over || active.id === over.id) return

    const oldIndex = payments.findIndex((p) => p.id === active.id)
    const newIndex = payments.findIndex((p) => p.id === over.id)

    if (oldIndex === -1 || newIndex === -1) return

    // Reorder locally first for immediate feedback
    const newPayments = [...payments]
    const [movedItem] = newPayments.splice(oldIndex, 1)
    if (movedItem) {
      newPayments.splice(newIndex, 0, movedItem)
    }
    setPayments(newPayments)

    // Update sort_order in database
    const updates = newPayments.map((payment, index) => ({
      id: payment.id,
      sort_order: index,
    }))

    for (const update of updates) {
      await supabase
        .from('recurring_payments')
        .update({ sort_order: update.sort_order })
        .eq('id', update.id)
    }
  }

  if (loading) return <PageSpinner />

  const unpaidTotal = payments
    .filter((p) => !p.is_paid)
    .reduce((sum, p) => sum + p.amount, 0)

  const mainAccountsBalance = mainAccounts.reduce((sum, acc) => sum + acc.balance, 0)
  const realMoney = mainAccountsBalance - unpaidTotal

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('recurringPayments')}</h1>

      {/* Add Payment Form */}
      <form onSubmit={handleAdd} className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder={t('paymentName')}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            required
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
          <input
            type="text"
            inputMode="decimal"
            placeholder={t('amount')}
            value={newAmount}
            onChange={(e) => setNewAmount(normalizeNumberInput(e.target.value))}
            required
            className="w-full sm:w-40 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {t('addPayment')}
          </button>
        </div>
      </form>

      {payments.length === 0 ? (
        <EmptyState
          icon="🔄"
          title={t('noRecurringPayments')}
          description={t('addRecurringExpenses')}
        />
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <DragHandleHeader />
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('paid')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('name')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('amount')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <SortableContext
                  items={payments.map((p) => p.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {payments.map((payment) => (
                    <SortableRow
                      key={payment.id}
                      id={payment.id}
                      className={payment.is_paid ? 'bg-gray-50' : ''}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={payment.is_paid}
                          onChange={() => handleTogglePaid(payment.id, payment.is_paid)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                        />
                      </td>
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                          payment.is_paid ? 'text-gray-400 line-through' : 'text-gray-900'
                        }`}
                      >
                        {payment.name}
                      </td>
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-sm text-right ${
                          payment.is_paid ? 'text-gray-400' : 'text-gray-900'
                        }`}
                      >
                        {formatCurrency(payment.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <button
                          onClick={() => setDeleteId(payment.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          {t('delete')}
                        </button>
                      </td>
                    </SortableRow>
                  ))}
                </SortableContext>
              </tbody>
            </table>
          </DndContext>
        </div>
      )}

      {/* Real Money Calculation */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('realMoneyCalculation')}</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">{t('mainAccountsBalanceLabel')}</span>
            <span className="font-medium">
              {mainAccounts.length > 0 ? formatCurrency(mainAccountsBalance) : t('noMainAccounts')}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">{t('unpaidRecurringPayments')}</span>
            <span className="font-medium text-red-600">- {formatCurrency(unpaidTotal)}</span>
          </div>
          <div className="border-t pt-2 flex justify-between">
            <span className="font-semibold text-gray-900">{t('realMoney')}</span>
            <span
              className={`font-bold text-lg ${realMoney >= 0 ? 'text-green-600' : 'text-red-600'}`}
            >
              {formatCurrency(realMoney)}
            </span>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={deleteId !== null}
        title={t('deleteRecurringPayment')}
        message={t('deleteRecurringPaymentConfirm')}
        confirmLabel={t('delete')}
        cancelLabel={t('cancel')}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        destructive
      />
    </div>
  )
}
