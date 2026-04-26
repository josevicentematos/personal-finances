import { supabase } from '@/lib/supabase'
import { Account } from '@/types'

export async function fetchAccounts(): Promise<Account[]> {
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .order('sort_order', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function createAccount(
  name: string,
  balance: number,
  sortOrder: number,
  color?: string | null,
  colorDark?: string | null
): Promise<void> {
  const { error } = await supabase
    .from('accounts')
    .insert({ name, balance, sort_order: sortOrder, color: color ?? null, color_dark: colorDark ?? null })
  if (error) throw error
}

export async function updateAccountColor(id: string, color: string | null, colorDark: string | null): Promise<void> {
  const { error } = await supabase.from('accounts').update({ color, color_dark: colorDark }).eq('id', id)
  if (error) throw error
}

export async function updateAccountBalance(id: string, balance: number): Promise<void> {
  const { error } = await supabase.from('accounts').update({ balance }).eq('id', id)
  if (error) throw error
}

export async function updateAccountName(id: string, name: string): Promise<void> {
  const { error } = await supabase.from('accounts').update({ name }).eq('id', id)
  if (error) throw error
}

export async function toggleAccountMain(id: string, isMain: boolean): Promise<void> {
  const { error } = await supabase.from('accounts').update({ is_main: isMain }).eq('id', id)
  if (error) throw error
}

export async function toggleAccountSummary(id: string, showInSummary: boolean): Promise<void> {
  const { error } = await supabase.from('accounts').update({ show_in_summary: showInSummary }).eq('id', id)
  if (error) throw error
}

export async function deleteAccount(id: string): Promise<void> {
  const { error } = await supabase.from('accounts').delete().eq('id', id)
  if (error) throw error
}

export async function reorderAccounts(updates: Array<{ id: string; sort_order: number }>): Promise<void> {
  for (const u of updates) {
    const { error } = await supabase.from('accounts').update({ sort_order: u.sort_order }).eq('id', u.id)
    if (error) throw error
  }
}
