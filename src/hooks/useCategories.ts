import { useState, useEffect, useCallback } from 'react'
import { Category } from '@/types'
import { fetchCategories } from '@/services/categories'
import toast from 'react-hot-toast'

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    try {
      const data = await fetchCategories()
      setCategories(data)
    } catch (err) {
      toast.error('Failed to load categories')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { categories, loading, refetch }
}
