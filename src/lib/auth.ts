import { supabase } from './supabase'

const AUTH_KEY = 'finance_app_authenticated'

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function login(password: string): Promise<boolean> {
  const hashedInput = await hashPassword(password)

  const { data, error } = await supabase
    .from('app_settings')
    .select('master_password_hash')
    .single()

  if (error || !data) {
    console.error('Failed to fetch app settings:', error)
    return false
  }

  if (hashedInput === data.master_password_hash) {
    localStorage.setItem(AUTH_KEY, hashedInput)
    return true
  }

  return false
}

export function logout(): void {
  localStorage.removeItem(AUTH_KEY)
}

export function isAuthenticated(): boolean {
  return localStorage.getItem(AUTH_KEY) !== null
}

export async function verifySession(): Promise<boolean> {
  const storedHash = localStorage.getItem(AUTH_KEY)
  if (!storedHash) return false

  const { data, error } = await supabase
    .from('app_settings')
    .select('master_password_hash')
    .single()

  if (error || !data) return false

  return storedHash === data.master_password_hash
}
