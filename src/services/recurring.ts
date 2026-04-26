import { supabase } from '@/lib/supabase'
import { RecurringPayment } from '@/types'

export async function fetchRecurringPayments(): Promise<RecurringPayment[]> {
  const { data, error } = await supabase
    .from('recurring_payments')
    .select('*')
    .order('sort_order', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function fetchUnpaidRecurringPayments(): Promise<RecurringPayment[]> {
  const { data, error } = await supabase
    .from('recurring_payments')
    .select('*')
    .eq('is_paid', false)
    .order('sort_order', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function createRecurringPayment(name: string, amount: number, sortOrder: number): Promise<void> {
  const { error } = await supabase.from('recurring_payments').insert({
    name,
    amount,
    is_paid: false,
    sort_order: sortOrder,
  })
  if (error) throw error
}

export async function updateRecurringPayment(id: string, name: string, amount: number): Promise<void> {
  const { error } = await supabase.from('recurring_payments').update({ name, amount }).eq('id', id)
  if (error) throw error
}

export async function toggleRecurringPaid(id: string, isPaid: boolean): Promise<void> {
  const { error } = await supabase.from('recurring_payments').update({ is_paid: isPaid }).eq('id', id)
  if (error) throw error
}

export async function deleteRecurringPayment(id: string): Promise<void> {
  const { error } = await supabase.from('recurring_payments').delete().eq('id', id)
  if (error) throw error
}

export async function reorderRecurringPayments(updates: Array<{ id: string; sort_order: number }>): Promise<void> {
  for (const u of updates) {
    const { error } = await supabase.from('recurring_payments').update({ sort_order: u.sort_order }).eq('id', u.id)
    if (error) throw error
  }
}

export async function resetMonthlyPaymentsIfNeeded(): Promise<void> {
  const currentMonth = new Date().toISOString().substring(0, 7)

  const { data: settings, error } = await supabase
    .from('app_settings')
    .select('last_recurring_reset')
    .single()
  if (error) throw error

  if (settings?.last_recurring_reset !== currentMonth) {
    const { error: resetError } = await supabase
      .from('recurring_payments')
      .update({ is_paid: false })
      .eq('is_paid', true)
    if (resetError) throw resetError

    const { error: updateError } = await supabase
      .from('app_settings')
      .update({ last_recurring_reset: currentMonth })
      .not('id', 'is', null)
    if (updateError) throw updateError
  }
}
