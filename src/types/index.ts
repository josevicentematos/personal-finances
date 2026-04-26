export interface Account {
  id: string
  name: string
  balance: number
  is_main: boolean
  show_in_summary: boolean
  color: string | null
  color_dark: string | null
  sort_order: number
  created_at: string
}

export interface Category {
  id: string
  name: string
  color: string
  color_dark: string | null
  sort_order: number
  created_at: string
}

export interface Transaction {
  id: string
  date: string
  description: string
  category_id: string
  account_id: string
  expense: number | null
  income: number | null
  dollar_rate: number
  balance_snapshot: number | null
  created_at: string
}

export interface TransactionWithRelations extends Transaction {
  category?: Category
  account?: Account
}

export interface RecurringPayment {
  id: string
  name: string
  amount: number
  is_paid: boolean
  sort_order: number
  created_at: string
}

export interface Product {
  id: string
  name: string
  unit: string | null
  sort_order: number
  created_at: string
}

export interface TransactionProduct {
  id: string
  transaction_id: string
  product_id: string
  quantity: number
  created_at: string
  product?: Product
}

export interface AppSettings {
  id: string
  dollar_rate: number
  master_password_hash: string
  last_recurring_reset: string | null
  updated_at: string
}
