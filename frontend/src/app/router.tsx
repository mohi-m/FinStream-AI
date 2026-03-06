import { createBrowserRouter, Navigate, useLocation } from 'react-router-dom'
import { PublicLayout, AppLayout } from './layouts'
import { LandingPage } from '@/features/landing'
import { ProtectedRoute } from '@/features/auth'
import { OverviewPage } from '@/features/stocks'
import { PortfoliosPage } from '@/features/portfolios'
import { ProfilePage } from '@/features/profile'

function StocksToOverviewRedirect() {
  const location = useLocation()
  return <Navigate to={`/app/overview${location.search}${location.hash}`} replace />
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      {
        index: true,
        element: <LandingPage />,
      },
    ],
  },
  {
    path: '/app',
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          {
            index: true,
            element: <Navigate to="/app/overview" replace />,
          },
          {
            path: 'overview',
            element: <OverviewPage />,
          },
          {
            path: 'stocks',
            element: <StocksToOverviewRedirect />,
          },
          {
            path: 'portfolios',
            element: <PortfoliosPage />,
          },
          {
            path: 'profile',
            element: <ProfilePage />,
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
])
