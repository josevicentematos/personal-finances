import { normalizeNumberInput } from '@/lib/format'
import { useTranslation } from '@/lib/i18n'

interface AmountFieldsProps {
  expense: string
  income: string
  dollarRate: string
  onExpenseChange: (v: string) => void
  onIncomeChange: (v: string) => void
  onDollarRateChange: (v: string) => void
}

const inputClass =
  'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white'

export function AmountFields({
  expense,
  income,
  dollarRate,
  onExpenseChange,
  onIncomeChange,
  onDollarRateChange,
}: AmountFieldsProps) {
  const { t } = useTranslation()
  const rate = parseFloat(dollarRate) || 1
  const expenseNum = parseFloat(expense) || 0
  const incomeNum = parseFloat(income) || 0
  const usdAmount = expenseNum > 0 ? expenseNum / rate : incomeNum > 0 ? incomeNum / rate : null

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('expenseAmount')}
          </label>
          <input
            type="text"
            inputMode="decimal"
            value={expense}
            onChange={(e) => onExpenseChange(normalizeNumberInput(e.target.value))}
            placeholder="0.00"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('incomeAmount')}
          </label>
          <input
            type="text"
            inputMode="decimal"
            value={income}
            onChange={(e) => onIncomeChange(normalizeNumberInput(e.target.value))}
            placeholder="0.00"
            className={inputClass}
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="w-32">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('dollarRate')}
          </label>
          <input
            type="text"
            inputMode="decimal"
            value={dollarRate}
            onChange={(e) => onDollarRateChange(normalizeNumberInput(e.target.value))}
            className={inputClass}
          />
        </div>
        {usdAmount !== null && (
          <div className="pt-5 text-sm text-gray-500 dark:text-gray-400">
            ≈{' '}
            {new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }).format(usdAmount)}{' '}
            {t('usdEquivalent')}
          </div>
        )}
      </div>
    </div>
  )
}
