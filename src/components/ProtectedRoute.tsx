import { ReactNode, useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { isAuthenticated, verifySession } from '@/lib/auth'

interface ProtectedRouteProps {
  children: ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [verified, setVerified] = useState<boolean | null>(null)

  useEffect(() => {
    if (!isAuthenticated()) {
      setVerified(false)
      return
    }

    verifySession().then(setVerified)
  }, [])

  if (verified === null) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    )
  }

  if (!verified) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
