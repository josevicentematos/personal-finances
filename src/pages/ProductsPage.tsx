import { useState, useEffect, useMemo, FormEvent } from 'react'
import { supabase } from '@/lib/supabase'
import { Product } from '@/types'
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

interface TransactionProductRow {
  id: string
  product_id: string
  quantity: number
  product: Product | null
  transaction: { date: string } | null
}

export function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [txProducts, setTxProducts] = useState<TransactionProductRow[]>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [newUnit, setNewUnit] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteWarning, setDeleteWarning] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editUnit, setEditUnit] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [activeMonth, setActiveMonth] = useState<string>(
    new Date().toISOString().substring(0, 7)
  )
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
    const [productsRes, txProductsRes] = await Promise.all([
      supabase.from('products').select('*').order('sort_order', { ascending: true }),
      supabase
        .from('transaction_products')
        .select('*, product:products(*), transaction:transactions(date)'),
    ])

    if (productsRes.error) {
      console.error('Error fetching products:', productsRes.error)
    } else {
      setProducts(productsRes.data ?? [])
    }

    if (txProductsRes.error) {
      console.error('Error fetching transaction products:', txProductsRes.error)
    } else {
      setTxProducts((txProductsRes.data ?? []) as TransactionProductRow[])
    }

    setLoading(false)
  }

  const monthOptions = useMemo(() => {
    const months = new Set(
      txProducts
        .map((tp) => tp.transaction?.date?.substring(0, 7))
        .filter(Boolean) as string[]
    )
    return Array.from(months).sort().reverse()
  }, [txProducts])

  function formatMonthLabel(monthStr: string): string {
    const [year, month] = monthStr.split('-')
    const date = new Date(parseInt(year ?? '2000'), parseInt(month ?? '1') - 1)
    return date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
  }

  interface UsageRow {
    product: Product
    timesPurchased: number
    totalQuantity: number
  }

  const monthlyUsage = useMemo((): UsageRow[] => {
    const filtered = txProducts.filter(
      (tp) => tp.transaction?.date?.substring(0, 7) === activeMonth
    )

    const byProduct = new Map<string, { product: Product; txIds: Set<string>; total: number }>()
    for (const tp of filtered) {
      if (!tp.product) continue
      const existing = byProduct.get(tp.product_id)
      if (existing) {
        existing.txIds.add(tp.id)
        existing.total += tp.quantity
      } else {
        byProduct.set(tp.product_id, {
          product: tp.product,
          txIds: new Set([tp.id]),
          total: tp.quantity,
        })
      }
    }

    return Array.from(byProduct.values())
      .map((v) => ({
        product: v.product,
        timesPurchased: v.txIds.size,
        totalQuantity: v.total,
      }))
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
  }, [txProducts, activeMonth])

  async function handleAdd(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)

    const maxOrder = products.reduce((max, p) => Math.max(max, p.sort_order), -1)

    const { error } = await supabase.from('products').insert({
      name: newName,
      unit: newUnit || null,
      sort_order: maxOrder + 1,
    })

    if (error) {
      console.error('Error adding product:', error)
    } else {
      setNewName('')
      setNewUnit('')
      fetchData()
    }
    setSubmitting(false)
  }

  async function checkAndDelete(id: string) {
    const { count } = await supabase
      .from('transaction_products')
      .select('*', { count: 'exact', head: true })
      .eq('product_id', id)

    if (count && count > 0) {
      setDeleteWarning(true)
    }
    setDeleteId(id)
  }

  async function handleDelete() {
    if (!deleteId || deleteWarning) {
      setDeleteId(null)
      setDeleteWarning(false)
      return
    }

    const { error } = await supabase.from('products').delete().eq('id', deleteId)

    if (error) {
      console.error('Error deleting product:', error)
    } else {
      fetchData()
    }
    setDeleteId(null)
    setDeleteWarning(false)
  }

  function startEdit(product: Product) {
    setEditingId(product.id)
    setEditName(product.name)
    setEditUnit(product.unit ?? '')
  }

  async function saveEdit() {
    if (!editingId) return

    const { error } = await supabase
      .from('products')
      .update({ name: editName, unit: editUnit || null })
      .eq('id', editingId)

    if (error) {
      console.error('Error updating product:', error)
    } else {
      fetchData()
    }
    cancelEdit()
  }

  function cancelEdit() {
    setEditingId(null)
    setEditName('')
    setEditUnit('')
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event

    if (!over || active.id === over.id) return

    const oldIndex = products.findIndex((p) => p.id === active.id)
    const newIndex = products.findIndex((p) => p.id === over.id)

    if (oldIndex === -1 || newIndex === -1) return

    const newProducts = [...products]
    const [movedItem] = newProducts.splice(oldIndex, 1)
    if (movedItem) {
      newProducts.splice(newIndex, 0, movedItem)
    }
    setProducts(newProducts)

    const updates = newProducts.map((product, index) => ({
      id: product.id,
      sort_order: index,
    }))

    for (const update of updates) {
      await supabase
        .from('products')
        .update({ sort_order: update.sort_order })
        .eq('id', update.id)
    }
  }

  if (loading) return <PageSpinner />

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{t('products')}</h1>

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

      {/* Add Product Form */}
      <form onSubmit={handleAdd} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder={t('productName')}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            required
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
          <input
            type="text"
            placeholder={t('productUnitPlaceholder')}
            value={newUnit}
            onChange={(e) => setNewUnit(e.target.value)}
            className="w-full sm:w-40 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {t('addProduct')}
          </button>
        </div>
      </form>

      {/* Monthly Usage Table */}
      {monthlyUsage.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('monthlyUsage')}</h2>
          </div>
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('name')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('unit')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('timesPurchased')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('totalQuantity')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {monthlyUsage.map((row) => (
                <tr key={row.product.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {row.product.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {row.product.unit ?? '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 dark:text-white">
                    {row.timesPurchased}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 dark:text-white">
                    {row.product.unit
                      ? `${row.totalQuantity % 1 === 0 ? row.totalQuantity : row.totalQuantity.toFixed(2)} ${row.product.unit}`
                      : row.totalQuantity % 1 === 0
                        ? row.totalQuantity
                        : row.totalQuantity.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Full Product Catalog */}
      {products.length === 0 ? (
        <EmptyState
          icon="🛒"
          title={t('noProductsYet')}
          description={t('addFirstProduct')}
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('name')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('unit')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                <SortableContext
                  items={products.map((p) => p.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {products.map((product) => (
                    <SortableRow key={product.id} id={product.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {editingId === product.id ? (
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            autoFocus
                          />
                        ) : (
                          product.name
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {editingId === product.id ? (
                          <input
                            type="text"
                            value={editUnit}
                            onChange={(e) => setEditUnit(e.target.value)}
                            placeholder={t('productUnitPlaceholder')}
                            className="w-32 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                          />
                        ) : (
                          product.unit ?? '—'
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-3">
                        {editingId === product.id ? (
                          <>
                            <button
                              onClick={saveEdit}
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
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startEdit(product)}
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                              disabled={editingId !== null}
                            >
                              {t('edit')}
                            </button>
                            <button
                              onClick={() => checkAndDelete(product.id)}
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

      <ConfirmDialog
        isOpen={deleteId !== null}
        title={t('deleteProduct')}
        message={deleteWarning ? t('deleteProductWarning') : t('deleteProductConfirm')}
        confirmLabel={deleteWarning ? t('cancel') : t('delete')}
        cancelLabel={t('cancel')}
        onConfirm={handleDelete}
        onCancel={() => {
          setDeleteId(null)
          setDeleteWarning(false)
        }}
        destructive={!deleteWarning}
      />
    </div>
  )
}
