import { useState, FormEvent, useCallback } from 'react'
import { RecurringPayment, Account } from '@/types'
import { formatCurrency, normalizeNumberInput } from '@/lib/format'
import {
  fetchRecurringPayments,
  createRecurringPayment,
  updateRecurringPayment,
  toggleRecurringPaid,
  deleteRecurringPayment,
  reorderRecurringPayments,
} from '@/services/recurring'
import { fetchAccounts } from '@/services/accounts'
import { useRecurringReset } from '@/hooks/useRecurringReset'
import { PageSpinner } from '@/components/Spinner'
import { EmptyState } from '@/components/EmptyState'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { SortableRow, DragHandleHeader } from '@/components/SortableRow'
import { useTranslation } from '@/lib/i18n'
import toast from 'react-hot-toast'
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
  const [editingPayment, setEditingPayment] = useState<RecurringPayment | null>(null)
  const [editName, setEditName] = useState('')
  const [editAmount, setEditAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { t } = useTranslation()

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const fetchData = useCallback(async () => {
    try {
      const [allPayments, allAccounts] = await Promise.all([
        fetchRecurringPayments(),
        fetchAccounts(),
      ])
      setPayments(allPayments)
      setMainAccounts(allAccounts.filter((a) => a.is_main))
    } catch (err) {
      toast.error('Failed to load recurring payments')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useRecurringReset(fetchData)

  async function handleAdd(e: FormEvent) {
    e.preventDefault()
    const trimmed = newName.trim()
    if (!trimmed) { toast.error('Payment name is required'); return }
    if (trimmed.length > 60) { toast.error('Payment name must be under 60 characters'); return }
    const amount = parseFloat(newAmount)
    if (!newAmount || amount <= 0) { toast.error('Amount must be greater than 0'); return }

    setSubmitting(true)
    try {
      const maxOrder = payments.reduce((max, p) => Math.max(max, p.sort_order), -1)
      await createRecurringPayment(trimmed, amount, maxOrder + 1)
      setNewName('')
      setNewAmount('')
      toast.success('Payment added')
      await fetchData()
    } catch (err) {
      toast.error('Failed to add payment')
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleTogglePaid(id: string, currentPaid: boolean) {
    try {
      await toggleRecurringPaid(id, !currentPaid)
      await fetchData()
    } catch (err) {
      toast.error('Failed to update payment')
      console.error(err)
    }
  }

  async function handleDelete() {
    if (!deleteId) return
    try {
      await deleteRecurringPayment(deleteId)
      toast.success('Payment deleted')
      await fetchData()
    } catch (err) {
      toast.error('Failed to delete payment')
      console.error(err)
    } finally {
      setDeleteId(null)
    }
  }

  function startEditing(payment: RecurringPayment) {
    setEditingPayment(payment)
    setEditName(payment.name)
    setEditAmount(payment.amount.toString())
  }

  function cancelEditing() {
    setEditingPayment(null)
    setEditName('')
    setEditAmount('')
  }

  async function handleSaveEdit() {
    if (!editingPayment) return
    const trimmed = editName.trim()
    if (!trimmed) { toast.error('Payment name is required'); return }
    if (trimmed.length > 60) { toast.error('Payment name must be under 60 characters'); return }
    const amount = parseFloat(editAmount)
    if (!editAmount || amount <= 0) { toast.error('Amount must be greater than 0'); return }

    setSubmitting(true)
    try {
      await updateRecurringPayment(editingPayment.id, trimmed, amount)
      toast.success('Payment updated')
      await fetchData()
      cancelEditing()
    } catch (err) {
      toast.error('Failed to update payment')
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = payments.findIndex((p) => p.id === active.id)
    const newIndex = payments.findIndex((p) => p.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const newPayments = [...payments]
    const [movedItem] = newPayments.splice(oldIndex, 1)
    if (movedItem) newPayments.splice(newIndex, 0, movedItem)
    setPayments(newPayments)

    try {
      await reorderRecurringPayments(newPayments.map((p, i) => ({ id: p.id, sort_order: i })))
    } catch (err) {
      toast.error('Failed to reorder payments')
      console.error(err)
      await fetchData()
    }
  }

  if (loading) return <PageSpinner />

  const unpaidTotal = payments.filter((p) => !p.is_paid).reduce((sum, p) => sum + p.amount, 0)
  const mainAccountsBalance = mainAccounts.reduce((sum, acc) => sum + acc.balance, 0)
  const realMoney = mainAccountsBalance - unpaidTotal

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{t('recurringPayments')}</h1>

      <form onSubmit={handleAdd} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder={t('paymentName')}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            required
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
          <input
            type="text"
            inputMode="decimal"
            placeholder={t('amount')}
            value={newAmount}
            onChange={(e) => setNewAmount(normalizeNumberInput(e.target.value))}
            required
            className="w-full sm:w-40 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
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
        <EmptyState icon="🔄" title={t('noRecurringPayments')} description={t('addRecurringExpenses')} />
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden mb-6">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <DragHandleHeader />
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('paid')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('name')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('amount')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                <SortableContext
                  items={payments.map((p) => p.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {payments.map((payment) => (
                    <SortableRow
                      key={payment.id}
                      id={payment.id}
                      className={payment.is_paid ? 'bg-gray-50 dark:bg-gray-700/50' : ''}
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
                          payment.is_paid
                            ? 'text-gray-400 dark:text-gray-500 line-through'
                            : 'text-gray-900 dark:text-white'
                        }`}
                      >
                        {editingPayment?.id === payment.id ? (
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                          />
                        ) : (
                          payment.name
                        )}
                      </td>
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-sm text-right ${
                          payment.is_paid ? 'text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-white'
                        }`}
                      >
                        {editingPayment?.id === payment.id ? (
                          <input
                            type="text"
                            inputMode="decimal"
                            value={editAmount}
                            onChange={(e) => setEditAmount(normalizeNumberInput(e.target.value))}
                            className="w-24 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-right"
                          />
                        ) : (
                          formatCurrency(payment.amount)
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-2">
                        {editingPayment?.id === payment.id ? (
                          <>
                            <button
                              onClick={handleSaveEdit}
                              disabled={submitting}
                              className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 disabled:opacity-50"
                            >
                              {t('save')}
                            </button>
                            <button
                              onClick={cancelEditing}
                              className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300"
                            >
                              {t('cancel')}
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startEditing(payment)}
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                            >
                              {t('edit')}
                            </button>
                            <button
                              onClick={() => setDeleteId(payment.id)}
                              className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                            >
                              {t('delete')}
                            </button>
                          </>
                        )}
                      </td>
                    </SortableRow>
                  ))}
                </SortableContext>
              </tbody>
            </table>
          </DndContext>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t('realMoneyCalculation')}
        </h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">{t('mainAccountsBalanceLabel')}</span>
            <span className="font-medium dark:text-white">
              {mainAccounts.length > 0 ? formatCurrency(mainAccountsBalance) : t('noMainAccounts')}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">{t('unpaidRecurringPayments')}</span>
            <span className="font-medium text-red-600">- {formatCurrency(unpaidTotal)}</span>
          </div>
          <div className="border-t border-gray-200 dark:border-gray-700 pt-2 flex justify-between">
            <span className="font-semibold text-gray-900 dark:text-white">{t('realMoney')}</span>
            <span className={`font-bold text-lg ${realMoney >= 0 ? 'text-green-600' : 'text-red-600'}`}>
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
