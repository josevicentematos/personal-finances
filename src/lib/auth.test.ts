import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({ data: null, error: null })),
      })),
    })),
  },
}))

import { isAuthenticated, logout } from './auth'

const AUTH_KEY = 'bitacora_authenticated'

beforeEach(() => {
  localStorage.clear()
})

describe('isAuthenticated', () => {
  it('returns false when nothing is stored', () => {
    expect(isAuthenticated()).toBe(false)
  })

  it('returns true for a valid non-expired session', () => {
    localStorage.setItem(
      AUTH_KEY,
      JSON.stringify({ hash: 'abc123', expiresAt: Date.now() + 1_000_000 })
    )
    expect(isAuthenticated()).toBe(true)
  })

  it('returns false and removes expired session', () => {
    localStorage.setItem(
      AUTH_KEY,
      JSON.stringify({ hash: 'abc123', expiresAt: Date.now() - 1 })
    )
    expect(isAuthenticated()).toBe(false)
    expect(localStorage.getItem(AUTH_KEY)).toBeNull()
  })

  it('returns false for malformed JSON', () => {
    localStorage.setItem(AUTH_KEY, 'not-valid-json')
    expect(isAuthenticated()).toBe(false)
  })
})

describe('logout', () => {
  it('removes the stored session', () => {
    localStorage.setItem(
      AUTH_KEY,
      JSON.stringify({ hash: 'abc', expiresAt: Date.now() + 10_000 })
    )
    logout()
    expect(localStorage.getItem(AUTH_KEY)).toBeNull()
  })
})
