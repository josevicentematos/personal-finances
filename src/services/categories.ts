import { supabase } from '@/lib/supabase'
import { Category } from '@/types'

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function createCategory(name: string, color: string, sortOrder: number): Promise<void> {
  const { error } = await supabase.from('categories').insert({ name, color, sort_order: sortOrder })
  if (error) throw error
}

export async function updateCategory(id: string, name: string, color: string): Promise<void> {
  const { error } = await supabase.from('categories').update({ name, color }).eq('id', id)
  if (error) throw error
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase.from('categories').delete().eq('id', id)
  if (error) throw error
}

export async function countCategoryTransactions(id: string): Promise<number> {
  const { count, error } = await supabase
    .from('transactions')
    .select('*', { count: 'exact', head: true })
    .eq('category_id', id)
  if (error) throw error
  return count ?? 0
}

export async function reorderCategories(updates: Array<{ id: string; sort_order: number }>): Promise<void> {
  for (const u of updates) {
    const { error } = await supabase.from('categories').update({ sort_order: u.sort_order }).eq('id', u.id)
    if (error) throw error
  }
}
