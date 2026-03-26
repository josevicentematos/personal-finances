export interface Account {
  id: string
  name: string
  balance: number
  is_main: boolean
  sort_order: number
  created_at: string
}

export interface Category {
  id: string
  name: string
  color: string
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

export interface AppSettings {
  id: string
  dollar_rate: number
  master_password_hash: string
  updated_at: string
}
