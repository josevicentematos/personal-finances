import { supabase } from '@/lib/supabase'
import { Transaction, TransactionWithRelations } from '@/types'

const PAGE_SIZE = 50

export async function fetchTransactionMonths(): Promise<string[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select('date')
    .order('date', { ascending: false })
  if (error) throw error
  const months = new Set((data ?? []).map((t) => t.date.substring(0, 7)))
  return Array.from(months)
}

export async function fetchTransactionsByMonth(
  month: string,
  page = 0
): Promise<{ data: TransactionWithRelations[]; hasMore: boolean }> {
  const from = page * PAGE_SIZE
  const to = from + PAGE_SIZE - 1
  const startDate = `${month}-01`
  const endDate = `${month}-31`

  const { data, error, count } = await supabase
    .from('transactions')
    .select('*, category:categories(*), account:accounts(*)', { count: 'exact' })
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true })
    .order('created_at', { ascending: true })
    .range(from, to)

  if (error) throw error
  return { data: data ?? [], hasMore: count ? count > to + 1 : false }
}

export async function fetchRecentTransactions(limit = 5): Promise<TransactionWithRelations[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select('*, category:categories(*), account:accounts(*)')
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data ?? []
}

export async function fetchCurrentMonthTransactions(month: string): Promise<TransactionWithRelations[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select('*, category:categories(*), account:accounts(*)')
    .gte('date', `${month}-01`)
    .lte('date', `${month}-31`)
    .order('date', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function createTransaction(payload: Omit<Transaction, 'id' | 'created_at'>): Promise<string> {
  const { data, error } = await supabase
    .from('transactions')
    .insert(payload)
    .select('id')
    .single()
  if (error) throw error
  return data.id
}

export async function updateTransaction(id: string, payload: Partial<Omit<Transaction, 'id' | 'created_at'>>): Promise<void> {
  const { error } = await supabase.from('transactions').update(payload).eq('id', id)
  if (error) throw error
}

export async function deleteTransaction(id: string): Promise<void> {
  const { data: tx, error: fetchError } = await supabase
    .from('transactions')
    .select('*')
    .eq('id', id)
    .single()
  if (fetchError) throw fetchError

  const { data: account, error: accFetchError } = await supabase
    .from('accounts')
    .select('balance')
    .eq('id', tx.account_id)
    .single()
  if (accFetchError) throw accFetchError

  if (account) {
    const reverseChange = (tx.expense ?? 0) - (tx.income ?? 0)
    const { error: accUpdateError } = await supabase
      .from('accounts')
      .update({ balance: account.balance + reverseChange })
      .eq('id', tx.account_id)
    if (accUpdateError) throw accUpdateError
  }

  const { error } = await supabase.from('transactions').delete().eq('id', id)
  if (error) throw error
}
