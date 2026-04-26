import { useState, useEffect, useCallback } from 'react'
import { Account } from '@/types'
import { fetchAccounts } from '@/services/accounts'
import toast from 'react-hot-toast'

export function useAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    try {
      const data = await fetchAccounts()
      setAccounts(data)
    } catch (err) {
      toast.error('Failed to load accounts')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { accounts, loading, refetch }
}
