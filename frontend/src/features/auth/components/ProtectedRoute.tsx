import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/app/providers'
import { Loading } from '@/components/common'

export function ProtectedRoute() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading message="Checking authentication..." />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
