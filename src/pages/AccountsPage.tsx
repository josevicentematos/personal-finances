import { useState, useEffect, FormEvent } from 'react'
import { supabase } from '@/lib/supabase'
import { Account } from '@/types'
import { formatCurrency } from '@/lib/format'
import { PageSpinner } from '@/components/Spinner'
import { EmptyState } from '@/components/EmptyState'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { useTranslation } from '@/lib/i18n'

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
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const { t } = useTranslation()

  useEffect(() => {
    fetchAccounts()
  }, [])

  async function fetchAccounts() {
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .order('created_at', { ascending: true })

    console.log('Fetched accounts:', data)

    if (error) {
      console.error('Error fetching accounts:', error)
    } else {
      setAccounts(data ?? [])
    }
    setLoading(false)
  }

  async function handleAdd(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)

    const { error } = await supabase.from('accounts').insert({
      name: newName,
      balance: parseFloat(newBalance) || 0,
    })

    if (error) {
      console.error('Error adding account:', error)
    } else {
      setNewName('')
      setNewBalance('')
      fetchAccounts()
    }
    setSubmitting(false)
  }

  async function handleUpdateBalance(id: string) {
    const { error } = await supabase
      .from('accounts')
      .update({ balance: parseFloat(editBalance) })
      .eq('id', id)

    if (error) {
      console.error('Error updating balance:', error)
    } else {
      setEditingId(null)
      fetchAccounts()
    }
  }

  async function handleToggleMain(id: string, currentIsMain: boolean) {
    setErrorMessage(null)
    console.log('Toggling main for account:', id, 'from', currentIsMain, 'to', !currentIsMain)
    const { data, error } = await supabase
      .from('accounts')
      .update({ is_main: !currentIsMain })
      .eq('id', id)
      .select()

    console.log('Update result:', { data, error })

    if (error) {
      console.error('Error toggling main account:', error)
      setErrorMessage(`Failed to update: ${error.message}`)
    } else if (!data || data.length === 0) {
      console.error('No rows updated for account:', id)
      setErrorMessage('Failed to update: No rows were modified. The is_main column may not exist in your database. Please run the latest schema migration.')
    } else {
      fetchAccounts()
    }
  }

  async function handleDelete() {
    if (!deleteId) return

    const { error } = await supabase.from('accounts').delete().eq('id', deleteId)

    if (error) {
      console.error('Error deleting account:', error)
    } else {
      fetchAccounts()
    }
    setDeleteId(null)
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

    const { error } = await supabase
      .from('accounts')
      .update({ name: editName })
      .eq('id', confirmEditId)

    if (error) {
      console.error('Error updating account name:', error)
    } else {
      fetchAccounts()
    }
    setConfirmEditId(null)
    setEditingNameId(null)
    setEditName('')
  }

  function cancelEditName() {
    setEditingNameId(null)
    setEditName('')
    setConfirmEditId(null)
  }

  if (loading) return <PageSpinner />

  const mainAccounts = accounts.filter((acc) => acc.is_main)
  const totalBalance = mainAccounts.reduce((sum, acc) => sum + acc.balance, 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('accounts')}</h1>
        <div className="text-right">
          <p className="text-sm text-gray-500">{t('mainAccountsBalance')}</p>
          <p className="text-xl font-semibold text-gray-900">{formatCurrency(totalBalance)}</p>
        </div>
      </div>

      {errorMessage && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {errorMessage}
          <button
            onClick={() => setErrorMessage(null)}
            className="ml-4 text-red-500 hover:text-red-700"
          >
            {t('dismiss')}
          </button>
        </div>
      )}

      {/* Add Account Form */}
      <form onSubmit={handleAdd} className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder={t('accountName')}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            required
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
          <input
            type="number"
            placeholder={t('initialBalance')}
            value={newBalance}
            onChange={(e) => setNewBalance(e.target.value)}
            step="0.01"
            className="w-full sm:w-40 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
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
        <EmptyState
          icon="🏦"
          title={t('noAccountsYet')}
          description={t('addFirstAccount')}
        />
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('main')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('name')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('balance')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {accounts.map((account) => (
                <tr key={account.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <input
                      type="checkbox"
                      checked={account.is_main ?? false}
                      onChange={() => handleToggleMain(account.id, account.is_main ?? false)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {editingNameId === account.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="px-2 py-1 border border-gray-300 rounded"
                          autoFocus
                        />
                        <button
                          onClick={confirmEditName}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          {t('save')}
                        </button>
                        <button
                          onClick={cancelEditName}
                          className="text-gray-500 hover:text-gray-700"
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
                          type="number"
                          value={editBalance}
                          onChange={(e) => setEditBalance(e.target.value)}
                          step="0.01"
                          className="w-32 px-2 py-1 border border-gray-300 rounded text-right"
                          autoFocus
                        />
                        <button
                          onClick={() => handleUpdateBalance(account.id)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          {t('save')}
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-gray-500 hover:text-gray-700"
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
                          account.balance >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {formatCurrency(account.balance)}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-3">
                    <button
                      onClick={() => startEditName(account)}
                      className="text-blue-600 hover:text-blue-800"
                      disabled={editingNameId !== null}
                    >
                      {t('edit')}
                    </button>
                    <button
                      onClick={() => setDeleteId(account.id)}
                      className="text-red-600 hover:text-red-800"
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
