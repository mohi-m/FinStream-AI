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
    // Add a small delay to ensure the page title is updated
    const timer = setTimeout(() => {
      logPageView(location.pathname, document.title)
    }, 0)

    return () => clearTimeout(timer)
  }, [location.pathname, location.search])
}
