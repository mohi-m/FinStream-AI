import { getAnalytics, logEvent as firebaseLogEvent, setUserProperties } from 'firebase/analytics'
import { app } from './firebase'

let analytics: any = null
let analyticsInitialized = false

// Initialize analytics only in production and when not in SSR context
export const initializeAnalytics = (): void => {
  if (typeof window === 'undefined' || analyticsInitialized) {
    return
  }

  try {
    analytics = getAnalytics(app)
    analyticsInitialized = true
  } catch (error) {
    console.warn('Failed to initialize Firebase Analytics:', error)
    analyticsInitialized = true // Mark as initialized to prevent repeated attempts
  }
}

/**
 * Log an event to Firebase Analytics
 * @param eventName - Name of the event
 * @param eventParams - Optional parameters for the event
 */
export const logEvent = (eventName: string, eventParams?: Record<string, any>): void => {
  if (!analyticsInitialized) {
    initializeAnalytics()
  }

  if (analytics) {
    try {
      firebaseLogEvent(analytics, eventName, eventParams)
    } catch (error) {
      console.warn(`Failed to log event "${eventName}":`, error)
    }
  }
}

/**
 * Log a page view event
 * @param pageName - Name of the page
 * @param pageTitle - Title of the page (optional)
 */
export const logPageView = (pageName: string, pageTitle?: string): void => {
  logEvent('page_view', {
    page_path: pageName,
    page_title: pageTitle || document.title,
  })
}

/**
 * Log a user engagement event
 * @param eventName - Name of the event
 * @param eventParams - Event parameters
 */
export const logEngagement = (eventName: string, eventParams?: Record<string, any>): void => {
  logEvent(eventName, eventParams)
}

/**
 * Track authentication events
 */
export const logSignUp = (method: 'google' | 'github'): void => {
  logEvent('sign_up', {
    method: method,
  })
}

export const logLogin = (method: 'google' | 'github'): void => {
  logEvent('login', {
    method: method,
  })
}

export const logLogout = (): void => {
  logEvent('logout')
}

/**
 * Set user properties for segmentation
 */
export const setAnalyticsUserProperties = (userId: string, properties?: Record<string, string>): void => {
  if (!analyticsInitialized) {
    initializeAnalytics()
  }

  if (analytics) {
    try {
      setUserProperties(analytics, {
        user_id: userId,
        ...properties,
      })
    } catch (error) {
      console.warn('Failed to set user properties:', error)
    }
  }
}

/**
 * Track portfolio-related events
 */
export const logPortfolioCreated = (portfolioSize?: number): void => {
  logEvent('portfolio_created', {
    portfolio_size: portfolioSize,
  })
}

export const logPortfolioUpdated = (portfolioId?: string): void => {
  logEvent('portfolio_updated', {
    portfolio_id: portfolioId,
  })
}

export const logPortfolioDeleted = (): void => {
  logEvent('portfolio_deleted')
}

/**
 * Track stock-related events
 */
export const logStockSearched = (ticker?: string): void => {
  logEvent('stock_searched', {
    ticker: ticker,
  })
}

export const logStockViewed = (ticker?: string): void => {
  logEvent('stock_viewed', {
    ticker: ticker,
  })
}

export const logPortfolioHoldingAdded = (ticker?: string, quantity?: number): void => {
  logEvent('portfolio_holding_added', {
    ticker: ticker,
    quantity: quantity,
  })
}

/**
 * Track UI interaction events
 */
export const logButtonClick = (buttonName: string): void => {
  logEvent('button_click', {
    button_name: buttonName,
  })
}

export const logFormSubmitted = (formName: string): void => {
  logEvent('form_submitted', {
    form_name: formName,
  })
}

/**
 * Track performance metrics (Web Vitals)
 */
export const logWebVital = (metricName: string, value: number, unit?: string): void => {
  logEvent('web_vital', {
    metric_name: metricName,
    value: value,
    unit: unit || 'ms',
  })
}

/**
 * Track errors and exceptions
 */
export const logError = (errorName: string, errorMessage?: string, context?: string): void => {
  logEvent('error', {
    error_name: errorName,
    error_message: errorMessage,
    context: context,
  })
}

/**
 * Track feature usage
 */
export const logFeatureUsed = (featureName: string, properties?: Record<string, any>): void => {
  logEvent('feature_used', {
    feature_name: featureName,
    ...properties,
  })
}
