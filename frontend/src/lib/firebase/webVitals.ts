import { logWebVital } from '@/lib/firebase/analytics'

/**
 * Track Core Web Vitals and other performance metrics
 * This captures: LCP, FID/INP, CLS, TTFB, and FCP
 */
export const initializeWebVitalsTracking = (): void => {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
    return
  }

  try {
    // Track Largest Contentful Paint (LCP)
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1]
        logWebVital('LCP', Math.round((lastEntry as any).renderTime || (lastEntry as any).loadTime), 'ms')
      })
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
    } catch (e) {
      // LCP not supported
    }

    // Track Cumulative Layout Shift (CLS)
    try {
      let clsValue = 0
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value
          }
        }
        logWebVital('CLS', Math.round(clsValue * 100) / 100)
      })
      clsObserver.observe({ entryTypes: ['layout-shift'] })
    } catch (e) {
      // CLS not supported
    }

    // Track First Input Delay (FID) / Interaction to Next Paint (INP)
    try {
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const delay = (entry as any).processingStart - entry.startTime
          logWebVital('FID', Math.round(delay), 'ms')
        }
      })
      fidObserver.observe({ entryTypes: ['first-input', 'interaction'] })
    } catch (e) {
      // FID not supported
    }

    // Track Time to First Byte (TTFB) and First Contentful Paint (FCP)
    try {
      const navObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        for (const entry of entries) {
          if (entry.name === 'first-contentful-paint') {
            logWebVital('FCP', Math.round(entry.startTime), 'ms')
          } else if ((entry as any).responseStart && (entry as any).requestStart) {
            const ttfb = Math.round((entry as any).responseStart - (entry as any).requestStart)
            logWebVital('TTFB', ttfb, 'ms')
          }
        }
      })
      navObserver.observe({ entryTypes: ['navigation', 'paint'] })
    } catch (e) {
      // Navigation timing not supported
    }
  } catch (error) {
    console.warn('Failed to initialize Web Vitals tracking:', error)
  }
}

/**
 * Track page visibility changes (user leaving/returning to tab)
 */
export const initializePageVisibilityTracking = (): void => {
  if (typeof document === 'undefined' || !('hidden' in document)) {
    return
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      // User left the page
      // Could log session duration or other metrics
    } else {
      // User returned to the page
      // Could log return visit
    }
  })
}
