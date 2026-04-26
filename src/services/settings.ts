import { supabase } from '@/lib/supabase'
import { AppSettings } from '@/types'

export async function fetchSettings(): Promise<AppSettings> {
  const { data, error } = await supabase.from('app_settings').select('*').single()
  if (error) throw error
  return data
}

export async function updateDollarRate(id: string, rate: number): Promise<void> {
  const { error } = await supabase
    .from('app_settings')
    .update({ dollar_rate: rate, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}
