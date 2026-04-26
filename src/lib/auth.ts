import { supabase } from './supabase'

const AUTH_KEY = 'bitacora_authenticated'

interface SessionData {
  hash: string
  expiresAt: number
}

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30 days

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

export async function login(password: string): Promise<boolean> {
  const hashedInput = await hashPassword(password)

  const { data, error } = await supabase
    .from('app_settings')
    .select('master_password_hash')
    .single()

  if (error || !data) {
    console.error('Failed to fetch app settings')
    return false
  }

  if (hashedInput === data.master_password_hash) {
    const session: SessionData = { hash: hashedInput, expiresAt: Date.now() + SESSION_TTL_MS }
    localStorage.setItem(AUTH_KEY, JSON.stringify(session))
    return true
  }

  return false
}

export function logout(): void {
  localStorage.removeItem(AUTH_KEY)
}

export function isAuthenticated(): boolean {
  const stored = localStorage.getItem(AUTH_KEY)
  if (!stored) return false
  try {
    const { expiresAt } = JSON.parse(stored) as SessionData
    if (Date.now() > expiresAt) {
      localStorage.removeItem(AUTH_KEY)
      return false
    }
    return true
  } catch {
    return false
  }
}

export async function verifySession(): Promise<boolean> {
  const stored = localStorage.getItem(AUTH_KEY)
  if (!stored) return false
  try {
    const { hash, expiresAt } = JSON.parse(stored) as SessionData
    if (Date.now() > expiresAt) {
      localStorage.removeItem(AUTH_KEY)
      return false
    }
    const { data, error } = await supabase
      .from('app_settings')
      .select('master_password_hash')
      .single()
    if (error || !data) return false
    return hash === data.master_password_hash
  } catch {
    return false
  }
}
