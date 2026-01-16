import { createBrowserRouter, Navigate } from 'react-router-dom'
import { PublicLayout, AppLayout } from './layouts'
import { LandingPage } from '@/features/landing'
import { ProtectedRoute } from '@/features/auth'
import { StocksPage } from '@/features/stocks'
import { PortfoliosPage } from '@/features/portfolios'
import { ProfilePage } from '@/features/profile'

export const router = createBrowserRouter(
  [
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
              element: <Navigate to="/app/stocks" replace />,
            },
            {
              path: 'stocks',
              element: <StocksPage />,
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
  ]
)
