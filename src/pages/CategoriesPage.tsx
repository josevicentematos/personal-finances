import { useState, useEffect, FormEvent } from 'react'
import { supabase } from '@/lib/supabase'
import { Category } from '@/types'
import { formatCurrency } from '@/lib/format'
import { PageSpinner } from '@/components/Spinner'
import { EmptyState } from '@/components/EmptyState'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { useTranslation } from '@/lib/i18n'

interface CategoryWithTotals extends Category {
  total_debit: number
  total_credit: number
}

export function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryWithTotals[]>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteWarning, setDeleteWarning] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [confirmEditId, setConfirmEditId] = useState<string | null>(null)
  const [editWarning, setEditWarning] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const { t } = useTranslation()

  useEffect(() => {
    fetchCategories()
  }, [])

  async function fetchCategories() {
    const { data: categoriesData, error: catError } = await supabase
      .from('categories')
      .select('*')
      .order('created_at', { ascending: true })

    if (catError) {
      console.error('Error fetching categories:', catError)
      setLoading(false)
      return
    }

    const { data: transactions, error: txError } = await supabase
      .from('transactions')
      .select('category_id, debit, credit')

    if (txError) {
      console.error('Error fetching transactions:', txError)
    }

    const categoriesWithTotals = (categoriesData ?? []).map((cat) => {
      const catTransactions = (transactions ?? []).filter((t) => t.category_id === cat.id)
      return {
        ...cat,
        total_debit: catTransactions.reduce((sum, t) => sum + (t.debit ?? 0), 0),
        total_credit: catTransactions.reduce((sum, t) => sum + (t.credit ?? 0), 0),
      }
    })

    setCategories(categoriesWithTotals)
    setLoading(false)
  }

  async function handleAdd(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)

    const { error } = await supabase.from('categories').insert({ name: newName })

    if (error) {
      console.error('Error adding category:', error)
    } else {
      setNewName('')
      fetchCategories()
    }
    setSubmitting(false)
  }

  async function checkAndDelete(id: string) {
    const { count } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', id)

    if (count && count > 0) {
      setDeleteWarning(true)
    }
    setDeleteId(id)
  }

  async function handleDelete() {
    if (!deleteId) return

    const { error } = await supabase.from('categories').delete().eq('id', deleteId)

    if (error) {
      console.error('Error deleting category:', error)
    } else {
      fetchCategories()
    }
    setDeleteId(null)
    setDeleteWarning(false)
  }

  function startEdit(category: CategoryWithTotals) {
    setEditingId(category.id)
    setEditName(category.name)
  }

  async function checkAndConfirmEdit() {
    if (!editingId) return

    const { count } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', editingId)

    if (count && count > 0) {
      setEditWarning(true)
    }
    setConfirmEditId(editingId)
  }

  async function handleEdit() {
    if (!confirmEditId) return

    const { error } = await supabase
      .from('categories')
      .update({ name: editName })
      .eq('id', confirmEditId)

    if (error) {
      console.error('Error updating category:', error)
    } else {
      fetchCategories()
    }
    cancelEdit()
  }

  function cancelEdit() {
    setEditingId(null)
    setEditName('')
    setConfirmEditId(null)
    setEditWarning(false)
  }

  if (loading) return <PageSpinner />

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('categories')}</h1>

      {/* Add Category Form */}
      <form onSubmit={handleAdd} className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <div className="flex gap-3">
          <input
            type="text"
            placeholder={t('categoryName')}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            required
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {t('addCategory')}
          </button>
        </div>
      </form>

      {categories.length === 0 ? (
        <EmptyState
          icon="📁"
          title={t('noCategoriesYet')}
          description={t('addFirstCategory')}
        />
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('name')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('totalDebited')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('totalCredited')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {categories.map((category) => (
                <tr key={category.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {editingId === category.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="px-2 py-1 border border-gray-300 rounded"
                          autoFocus
                        />
                        <button
                          onClick={checkAndConfirmEdit}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          {t('save')}
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          {t('cancel')}
                        </button>
                      </div>
                    ) : (
                      category.name
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600">
                    {formatCurrency(category.total_debit)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600">
                    {formatCurrency(category.total_credit)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-3">
                    <button
                      onClick={() => startEdit(category)}
                      className="text-blue-600 hover:text-blue-800"
                      disabled={editingId !== null}
                    >
                      {t('edit')}
                    </button>
                    <button
                      onClick={() => checkAndDelete(category.id)}
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
        title={t('deleteCategory')}
        message={deleteWarning ? t('deleteCategoryWarning') : t('deleteCategoryConfirm')}
        confirmLabel={t('delete')}
        cancelLabel={t('cancel')}
        onConfirm={handleDelete}
        onCancel={() => {
          setDeleteId(null)
          setDeleteWarning(false)
        }}
        destructive
      />

      <ConfirmDialog
        isOpen={confirmEditId !== null}
        title={t('editCategory')}
        message={
          editWarning
            ? `${t('renameCategoryWarning')} "${editName}"?`
            : `${t('renameCategoryConfirm')} "${editName}"?`
        }
        confirmLabel={t('save')}
        cancelLabel={t('cancel')}
        onConfirm={handleEdit}
        onCancel={cancelEdit}
      />
    </div>
  )
}
