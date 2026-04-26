import { useState, useEffect, FormEvent, useCallback } from 'react'
import { Account } from '@/types'
import { formatCurrency, normalizeNumberInput } from '@/lib/format'
import {
  fetchAccounts,
  createAccount,
  updateAccountBalance,
  updateAccountName,
  toggleAccountMain,
  toggleAccountSummary,
  deleteAccount,
  reorderAccounts,
} from '@/services/accounts'
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

export function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [newBalance, setNewBalance] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editBalance, setEditBalance] = useState('')
  const [editingNameId, setEditingNameId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [confirmEditId, setConfirmEditId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const { t } = useTranslation()

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const loadAccounts = useCallback(async () => {
    try {
      const data = await fetchAccounts()
      setAccounts(data)
    } catch (err) {
      toast.error('Failed to load accounts')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAccounts()
  }, [loadAccounts])

  async function handleAdd(e: FormEvent) {
    e.preventDefault()
    const trimmed = newName.trim()
    if (!trimmed) { toast.error('Account name is required'); return }
    if (trimmed.length > 60) { toast.error('Account name must be under 60 characters'); return }

    setSubmitting(true)
    try {
      const maxOrder = accounts.reduce((max, a) => Math.max(max, a.sort_order), -1)
      await createAccount(trimmed, parseFloat(newBalance) || 0, maxOrder + 1)
      setNewName('')
      setNewBalance('')
      toast.success('Account added')
      await loadAccounts()
    } catch (err) {
      toast.error('Failed to add account')
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleUpdateBalance(id: string) {
    try {
      await updateAccountBalance(id, parseFloat(editBalance))
      setEditingId(null)
      toast.success('Balance updated')
      await loadAccounts()
    } catch (err) {
      toast.error('Failed to update balance')
      console.error(err)
    }
  }

  async function handleToggleMain(id: string, currentIsMain: boolean) {
    try {
      await toggleAccountMain(id, !currentIsMain)
      await loadAccounts()
    } catch (err) {
      toast.error('Failed to update account')
      console.error(err)
    }
  }

  async function handleToggleShowInSummary(id: string, currentShowInSummary: boolean) {
    try {
      await toggleAccountSummary(id, !currentShowInSummary)
      await loadAccounts()
    } catch (err) {
      toast.error('Failed to update account')
      console.error(err)
    }
  }

  async function handleDelete() {
    if (!deleteId) return
    try {
      await deleteAccount(deleteId)
      toast.success('Account deleted')
      await loadAccounts()
    } catch (err) {
      toast.error('Failed to delete account')
      console.error(err)
    } finally {
      setDeleteId(null)
    }
  }

  function startEditName(account: Account) {
    setEditingNameId(account.id)
    setEditName(account.name)
  }

  function confirmEditName() {
    setConfirmEditId(editingNameId)
  }

  async function handleEditName() {
    if (!confirmEditId) return
    const trimmed = editName.trim()
    if (!trimmed) { toast.error('Account name is required'); return }
    if (trimmed.length > 60) { toast.error('Account name must be under 60 characters'); return }

    try {
      await updateAccountName(confirmEditId, trimmed)
      toast.success('Account renamed')
      await loadAccounts()
    } catch (err) {
      toast.error('Failed to rename account')
      console.error(err)
    } finally {
      setConfirmEditId(null)
      setEditingNameId(null)
      setEditName('')
    }
  }

  function cancelEditName() {
    setEditingNameId(null)
    setEditName('')
    setConfirmEditId(null)
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = accounts.findIndex((a) => a.id === active.id)
    const newIndex = accounts.findIndex((a) => a.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const newAccounts = [...accounts]
    const [movedItem] = newAccounts.splice(oldIndex, 1)
    if (movedItem) newAccounts.splice(newIndex, 0, movedItem)
    setAccounts(newAccounts)

    try {
      await reorderAccounts(newAccounts.map((account, index) => ({ id: account.id, sort_order: index })))
    } catch (err) {
      toast.error('Failed to reorder accounts')
      console.error(err)
      await loadAccounts()
    }
  }

  if (loading) return <PageSpinner />

  const mainAccounts = accounts.filter((acc) => acc.is_main)
  const totalBalance = mainAccounts.reduce((sum, acc) => sum + acc.balance, 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('accounts')}</h1>
        <div className="text-right">
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('mainAccountsBalance')}</p>
          <p className="text-xl font-semibold text-gray-900 dark:text-white">
            {formatCurrency(totalBalance)}
          </p>
        </div>
      </div>

      <form onSubmit={handleAdd} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder={t('accountName')}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            required
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <input
            type="text"
            inputMode="decimal"
            placeholder={t('initialBalance')}
            value={newBalance}
            onChange={(e) => setNewBalance(normalizeNumberInput(e.target.value))}
            className="w-full sm:w-40 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {t('addAccount')}
          </button>
        </div>
      </form>

      {accounts.length === 0 ? (
        <EmptyState icon="🏦" title={t('noAccountsYet')} description={t('addFirstAccount')} />
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <DragHandleHeader />
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('main')}
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('showInSummary')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('name')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('balance')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                <SortableContext
                  items={accounts.map((a) => a.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {accounts.map((account) => (
                    <SortableRow key={account.id} id={account.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <input
                          type="checkbox"
                          checked={account.is_main ?? false}
                          onChange={() => handleToggleMain(account.id, account.is_main ?? false)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <input
                          type="checkbox"
                          checked={account.show_in_summary ?? false}
                          onChange={() =>
                            handleToggleShowInSummary(account.id, account.show_in_summary ?? false)
                          }
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {editingNameId === account.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              autoFocus
                            />
                            <button
                              onClick={confirmEditName}
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                              {t('save')}
                            </button>
                            <button
                              onClick={cancelEditName}
                              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                            >
                              {t('cancel')}
                            </button>
                          </div>
                        ) : (
                          account.name
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        {editingId === account.id ? (
                          <div className="flex items-center justify-end gap-2">
                            <input
                              type="text"
                              inputMode="decimal"
                              value={editBalance}
                              onChange={(e) =>
                                setEditBalance(normalizeNumberInput(e.target.value))
                              }
                              className="w-32 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-right bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              autoFocus
                            />
                            <button
                              onClick={() => handleUpdateBalance(account.id)}
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                              {t('save')}
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                            >
                              {t('cancel')}
                            </button>
                          </div>
                        ) : (
                          <span
                            onClick={() => {
                              setEditingId(account.id)
                              setEditBalance(account.balance.toString())
                            }}
                            className={`cursor-pointer hover:underline ${
                              account.balance >= 0
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-red-600 dark:text-red-400'
                            }`}
                          >
                            {formatCurrency(account.balance)}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-3">
                        <button
                          onClick={() => startEditName(account)}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                          disabled={editingNameId !== null}
                        >
                          {t('edit')}
                        </button>
                        <button
                          onClick={() => setDeleteId(account.id)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
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

      <ConfirmDialog
        isOpen={deleteId !== null}
        title={t('deleteAccount')}
        message={t('deleteAccountConfirm')}
        confirmLabel={t('delete')}
        cancelLabel={t('cancel')}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        destructive
      />

      <ConfirmDialog
        isOpen={confirmEditId !== null}
        title={t('editAccount')}
        message={`${t('renameAccountConfirm')} "${editName}"?`}
        confirmLabel={t('save')}
        cancelLabel={t('cancel')}
        onConfirm={handleEditName}
        onCancel={cancelEditName}
      />
    </div>
  )
}
