export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-UY', {
    style: 'currency',
    currency: 'UYU',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(dateString: string): string {
  const [year, month, day] = dateString.split('-').map(Number)
  // Construct with local-timezone parts to avoid UTC→local day shift in UTC-3
  const date = new Date(year!, month! - 1, day!)
  return new Intl.DateTimeFormat('es-UY', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date)
}

export function formatDateTime(dateString: string): string {
  return new Intl.DateTimeFormat('es-UY', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString))
}

export function normalizeNumberInput(value: string): string {
  // Replace commas with periods to support different number formats
  // E.g., "200,30" becomes "200.30"
  return value.replace(/,/g, '.')
}
