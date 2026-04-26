import { RecurringPayment } from '@/types'
import { useTranslation } from '@/lib/i18n'

interface RecurringPaymentSelectorProps {
  recurringPayments: RecurringPayment[]
  selectedId: string
  onSelect: (id: string) => void
}

export function RecurringPaymentSelector({
  recurringPayments,
  selectedId,
  onSelect,
}: RecurringPaymentSelectorProps) {
  const { t } = useTranslation()

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {t('recurringPayment')}
      </label>
      <select
        value={selectedId}
        onChange={(e) => onSelect(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
      >
        <option value="">{t('selectRecurringPayment')}</option>
        {recurringPayments.map((payment) => (
          <option key={payment.id} value={payment.id}>
            {payment.name} - ${payment.amount.toFixed(2)}
          </option>
        ))}
      </select>
    </div>
  )
}
