import { Product } from '@/types'
import { useTranslation } from '@/lib/i18n'
import { normalizeNumberInput } from '@/lib/format'

export interface ProductLine {
  productId: string
  quantity: string
}

interface ProductLineEditorProps {
  productLines: ProductLine[]
  products: Product[]
  onAdd: () => void
  onUpdate: (index: number, field: 'productId' | 'quantity', value: string) => void
  onRemove: (index: number) => void
}

export function ProductLineEditor({
  productLines,
  products,
  onAdd,
  onUpdate,
  onRemove,
}: ProductLineEditorProps) {
  const { t } = useTranslation()

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('addProducts')}
        </label>
        <button
          type="button"
          onClick={onAdd}
          className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
        >
          + {t('addProductLine')}
        </button>
      </div>
      {productLines.map((line, index) => (
        <div key={index} className="flex gap-2 mb-2">
          <select
            value={line.productId}
            onChange={(e) => onUpdate(index, 'productId', e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
          >
            <option value="">{t('selectProduct')}</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
                {p.unit ? ` (${p.unit})` : ''}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-1">
            <input
              type="text"
              inputMode="decimal"
              value={line.quantity}
              onChange={(e) => onUpdate(index, 'quantity', normalizeNumberInput(e.target.value))}
              placeholder="1"
              className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm text-right"
            />
            {(() => {
              const product = products.find((p) => p.id === line.productId)
              return product?.unit ? (
                <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  {product.unit}
                </span>
              ) : null
            })()}
          </div>
          <button
            type="button"
            onClick={() => onRemove(index)}
            aria-label={t('removeProductLine')}
            className="px-2 py-2 text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}
