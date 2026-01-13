import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { AuthProvider, ThemeProvider, QueryClientProvider } from '@/app/providers'
import { router } from '@/app/router'
import { initializeAnalytics } from '@/lib/firebase/analytics'
import {
  initializeWebVitalsTracking,
  initializePageVisibilityTracking,
} from '@/lib/firebase/webVitals'
import './index.css'

// Initialize Firebase Analytics (safely)
try {
  initializeAnalytics()
  initializeWebVitalsTracking()
  initializePageVisibilityTracking()
} catch (error) {
  console.warn('Analytics initialization failed:', error)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider>
      <AuthProvider>
        <ThemeProvider>
          <RouterProvider router={router} />
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>
)
