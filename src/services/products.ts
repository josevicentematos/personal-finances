import { supabase } from '@/lib/supabase'
import { Product } from '@/types'

export async function fetchProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('sort_order', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function createProduct(name: string, unit: string | null, sortOrder: number): Promise<void> {
  const { error } = await supabase.from('products').insert({ name, unit, sort_order: sortOrder })
  if (error) throw error
}

export async function updateProduct(id: string, name: string, unit: string | null): Promise<void> {
  const { error } = await supabase.from('products').update({ name, unit }).eq('id', id)
  if (error) throw error
}

export async function deleteProduct(id: string): Promise<void> {
  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) throw error
}

export async function countProductTransactions(id: string): Promise<number> {
  const { count, error } = await supabase
    .from('transaction_products')
    .select('*', { count: 'exact', head: true })
    .eq('product_id', id)
  if (error) throw error
  return count ?? 0
}

export async function reorderProducts(updates: Array<{ id: string; sort_order: number }>): Promise<void> {
  for (const u of updates) {
    const { error } = await supabase.from('products').update({ sort_order: u.sort_order }).eq('id', u.id)
    if (error) throw error
  }
}

export interface TransactionProductRow {
  id: string
  product_id: string
  quantity: number
  product: Product | null
  transaction: { date: string } | null
}

export async function fetchTransactionProducts(): Promise<TransactionProductRow[]> {
  const { data, error } = await supabase
    .from('transaction_products')
    .select('*, product:products(*), transaction:transactions(date)')
  if (error) throw error
  return (data ?? []) as TransactionProductRow[]
}
