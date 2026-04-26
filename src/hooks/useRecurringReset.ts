import { useEffect, useRef } from 'react'
import { resetMonthlyPaymentsIfNeeded } from '@/services/recurring'

export function useRecurringReset(onComplete: () => void) {
  const callbackRef = useRef(onComplete)
  callbackRef.current = onComplete

  useEffect(() => {
    resetMonthlyPaymentsIfNeeded()
      .then(() => callbackRef.current())
      .catch(() => callbackRef.current())
  }, [])
}
