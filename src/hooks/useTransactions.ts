import { useState, useEffect, useCallback, useRef } from 'react'
import { TransactionWithRelations } from '@/types'
import { fetchTransactionMonths, fetchTransactionsByMonth } from '@/services/transactions'
import toast from 'react-hot-toast'

export function useTransactions() {
  const [months, setMonths] = useState<string[]>([])
  const [activeMonth, setActiveMonthRaw] = useState<string>('')
  const [transactions, setTransactions] = useState<TransactionWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [page, setPage] = useState(0)
  const didInit = useRef(false)

  const fetchForMonth = useCallback(async (month: string, pageNum: number, append = false) => {
    if (!month) return
    if (append) setLoadingMore(true)
    else setLoading(true)
    try {
      const result = await fetchTransactionsByMonth(month, pageNum)
      setTransactions((prev) => (append ? [...prev, ...result.data] : result.data))
      setHasMore(result.hasMore)
      setPage(pageNum)
    } catch (err) {
      toast.error('Failed to load transactions')
      console.error(err)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [])

  useEffect(() => {
    if (didInit.current) return
    didInit.current = true

    fetchTransactionMonths()
      .then((ms) => {
        setMonths(ms)
        const first = ms[0]
        if (first) {
          setActiveMonthRaw(first)
          return fetchForMonth(first, 0)
        } else {
          setLoading(false)
        }
      })
      .catch((err) => {
        toast.error('Failed to load transaction data')
        console.error(err)
        setLoading(false)
      })
  }, [fetchForMonth])

  const setActiveMonth = useCallback(
    (month: string) => {
      setActiveMonthRaw(month)
      fetchForMonth(month, 0)
    },
    [fetchForMonth]
  )

  const loadMore = useCallback(() => {
    if (activeMonth && hasMore && !loadingMore) {
      fetchForMonth(activeMonth, page + 1, true)
    }
  }, [activeMonth, hasMore, loadingMore, page, fetchForMonth])

  const refetch = useCallback(() => {
    return fetchTransactionMonths()
      .then((ms) => {
        setMonths(ms)
        const current = activeMonth || ms[0] || ''
        if (current) {
          setActiveMonthRaw(current)
          return fetchForMonth(current, 0)
        }
      })
      .catch((err) => {
        toast.error('Failed to refresh transactions')
        console.error(err)
      })
  }, [activeMonth, fetchForMonth])

  return {
    months,
    transactions,
    loading,
    loadingMore,
    hasMore,
    activeMonth,
    setActiveMonth,
    loadMore,
    refetch,
  }
}
