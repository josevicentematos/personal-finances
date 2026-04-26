import { useState, useEffect, useMemo, FormEvent } from 'react'
import { supabase } from '@/lib/supabase'
import { Category } from '@/types'

interface TransactionSummary {
  category_id: string
  expense: number | null
  income: number | null
  date: string
}
import { formatCurrency } from '@/lib/format'
import { PageSpinner } from '@/components/Spinner'
import { EmptyState } from '@/components/EmptyState'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { SortableRow, DragHandleHeader } from '@/components/SortableRow'
import { ColorPicker } from '@/components/ColorPicker'
import { DEFAULT_CATEGORY_COLOR } from '@/lib/colors'
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

interface CategoryWithTotals extends Category {
  total_expense: number
  total_income: number
}

export function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [transactions, setTransactions] = useState<TransactionSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState<string>(DEFAULT_CATEGORY_COLOR)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteWarning, setDeleteWarning] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState<string>(DEFAULT_CATEGORY_COLOR)
  const [confirmEditId, setConfirmEditId] = useState<string | null>(null)
  const [editWarning, setEditWarning] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [activeMonth, setActiveMonth] = useState<string>('')
  const { t } = useTranslation()

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    fetchCategories()
  }, [])

  async function fetchCategories() {
    const { data: categoriesData, error: catError } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true })

    if (catError) {
      console.error('Error fetching categories:', catError)
      setLoading(false)
      return
    }

    const { data: txData, error: txError } = await supabase
      .from('transactions')
      .select('category_id, expense, income, date')

    if (txError) {
      console.error('Error fetching transactions:', txError)
    }

    setCategories(categoriesData ?? [])
    setTransactions(txData ?? [])
    setLoading(false)
  }

  // Get all available months sorted in descending order (most recent first)
  const monthOptions = useMemo(() => {
    const months = new Set(transactions.map((t) => t.date.substring(0, 7)))
    return Array.from(months).sort().reverse()
  }, [transactions])

  // Set initial active month to most recent
  useEffect(() => {
    if (monthOptions.length > 0 && !activeMonth) {
      setActiveMonth(monthOptions[0] ?? '')
    }
  }, [monthOptions, activeMonth])

  // Calculate totals per category for the active month
  const categoriesWithTotals = useMemo((): CategoryWithTotals[] => {
    return categories.map((cat) => {
      const catTransactions = transactions.filter((t) => {
        if (t.category_id !== cat.id) return false
        if (activeMonth) {
          return t.date.substring(0, 7) === activeMonth
        }
        return true
      })
      return {
        ...cat,
        total_expense: catTransactions.reduce((sum, t) => sum + (t.expense ?? 0), 0),
        total_income: catTransactions.reduce((sum, t) => sum + (t.income ?? 0), 0),
      }
    })
  }, [categories, transactions, activeMonth])

  // Format month for display
  function formatMonthLabel(monthStr: string): string {
    const [year, month] = monthStr.split('-')
    const date = new Date(parseInt(year ?? '2000'), parseInt(month ?? '1') - 1)
    return date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
  }

  async function handleAdd(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)

    const maxOrder = categories.reduce((max, c) => Math.max(max, c.sort_order), -1)

    const { error } = await supabase.from('categories').insert({
      name: newName,
      color: newColor,
      sort_order: maxOrder + 1,
    })

    if (error) {
      console.error('Error adding category:', error)
    } else {
      setNewName('')
      setNewColor(DEFAULT_CATEGORY_COLOR)
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
    setEditColor(category.color || DEFAULT_CATEGORY_COLOR)
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
      .update({ name: editName, color: editColor })
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
    setEditColor(DEFAULT_CATEGORY_COLOR)
    setConfirmEditId(null)
    setEditWarning(false)
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event

    if (!over || active.id === over.id) return

    const oldIndex = categories.findIndex((c) => c.id === active.id)
    const newIndex = categories.findIndex((c) => c.id === over.id)

    if (oldIndex === -1 || newIndex === -1) return

    // Reorder locally first for immediate feedback
    const newCategories = [...categories]
    const [movedItem] = newCategories.splice(oldIndex, 1)
    if (movedItem) {
      newCategories.splice(newIndex, 0, movedItem)
    }
    setCategories(newCategories)

    // Update sort_order in database
    const updates = newCategories.map((category, index) => ({
      id: category.id,
      sort_order: index,
    }))

    for (const update of updates) {
      await supabase
        .from('categories')
        .update({ sort_order: update.sort_order })
        .eq('id', update.id)
    }
  }

  if (loading) return <PageSpinner />

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{t('categories')}</h1>

      {/* Month Tabs */}
      {monthOptions.length > 0 && (
        <div className="mb-4 overflow-x-auto">
          <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700 min-w-max">
            {monthOptions.map((month) => (
              <button
                key={month}
                onClick={() => setActiveMonth(month)}
                className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                  activeMonth === month
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/30'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                {formatMonthLabel(month)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Add Category Form */}
      <form onSubmit={handleAdd} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm mb-6">
        <div className="space-y-4">
          <div className="flex gap-3">
            <input
              type="text"
              placeholder={t('categoryName')}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              required
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {t('addCategory')}
            </button>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('color')}
            </label>
            <ColorPicker value={newColor} onChange={setNewColor} />
          </div>
        </div>
      </form>

      {categories.length === 0 ? (
        <EmptyState
          icon="📁"
          title={t('noCategoriesYet')}
          description={t('addFirstCategory')}
        />
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <DragHandleHeader />
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('color')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('name')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('categoryTotalExpenses')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('categoryTotalIncome')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                <SortableContext
                  items={categoriesWithTotals.map((c) => c.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {categoriesWithTotals.map((category) => (
                    <SortableRow key={category.id} id={category.id}>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {editingId === category.id ? (
                          <div className="w-32">
                            <ColorPicker value={editColor} onChange={setEditColor} />
                          </div>
                        ) : (
                          <div
                            className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-600"
                            style={{ backgroundColor: category.color || DEFAULT_CATEGORY_COLOR }}
                          />
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {editingId === category.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              autoFocus
                            />
                            <button
                              onClick={checkAndConfirmEdit}
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                            >
                              {t('save')}
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                            >
                              {t('cancel')}
                            </button>
                          </div>
                        ) : (
                          category.name
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600 dark:text-red-400">
                        {formatCurrency(category.total_expense)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600 dark:text-green-400">
                        {formatCurrency(category.total_income)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-3">
                        <button
                          onClick={() => startEdit(category)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                          disabled={editingId !== null}
                        >
                          {t('edit')}
                        </button>
                        <button
                          onClick={() => checkAndDelete(category.id)}
                          className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
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
