import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { logPageView } from '@/lib/firebase/analytics'

/**
 * Hook to automatically track page views in Firebase Analytics
 * Use this in your root layout or app component
 */
export const useAnalyticsTracking = (): void => {
  const location = useLocation()

  useEffect(() => {
    // Log page view when route changes
    logPageView(location.pathname, document.title)
  }, [location.pathname])
}
